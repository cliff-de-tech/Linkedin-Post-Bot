"""
LinkedIn OAuth Authentication Service

This module handles LinkedIn OAuth 2.0 authentication flow:
1. Generate authorization URL → User redirects to LinkedIn
2. Exchange authorization code for access token
3. Store tokens securely in database
4. Refresh tokens before expiry

SECURITY NOTES:
- Client secrets are never logged
- Access tokens are stored encrypted at rest
- Tokens are refreshed automatically before expiry
- All HTTP requests use HTTPS with SSL verification enabled
- Structured logging outputs to stdout (no file-based debug logs)

OAuth Scopes Used:
- openid: Required for OpenID Connect user info
- profile: Access to basic profile data
- email: Access to email address (optional)
- w_member_social: Required for creating posts

Token Lifecycle:
- Access tokens expire (typically 60 days)
- Refresh tokens can renew access tokens
- Expiration is tracked and checked before each API call
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote

import requests
from requests.exceptions import (
    ConnectionError,
    HTTPError,
    RequestException,
    Timeout,
)
import structlog

from services.token_store import save_token, get_token_by_urn

# =============================================================================
# STRUCTURED LOGGING CONFIGURATION
# =============================================================================
# Configure structlog for JSON output in production, pretty console in dev
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer() if os.getenv("ENVIRONMENT") == "production" 
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================
# LinkedIn OAuth configuration from environment
# SECURITY: These are loaded from environment variables, never hardcoded
CLIENT_ID: str = os.getenv('LINKEDIN_CLIENT_ID', '')
CLIENT_SECRET: str = os.getenv('LINKEDIN_CLIENT_SECRET', '')

# OAuth scopes required for this application
SCOPE: str = os.getenv('LINKEDIN_OAUTH_SCOPE', 'openid profile email w_member_social')

# SSL Verification: ALWAYS True in production
# Only disable for local development with self-signed certs if absolutely necessary
SSL_VERIFY: bool = os.getenv('SSL_VERIFY', 'true').lower() != 'false'

# Request timeout in seconds
REQUEST_TIMEOUT: int = int(os.getenv('AUTH_REQUEST_TIMEOUT', '15'))


# =============================================================================
# CUSTOM EXCEPTIONS
# =============================================================================
class AuthServiceError(Exception):
    """Base exception for authentication service errors."""
    
    def __init__(self, message: str, user_id: Optional[str] = None, provider: str = "linkedin"):
        self.message = message
        self.user_id = user_id
        self.provider = provider
        super().__init__(self.message)


class AuthConfigurationError(AuthServiceError):
    """Raised when OAuth credentials are not configured."""
    pass


class AuthProviderError(AuthServiceError):
    """Raised when the OAuth provider (LinkedIn) returns an error or is unreachable."""
    
    def __init__(
        self, 
        message: str, 
        user_id: Optional[str] = None,
        provider: str = "linkedin",
        status_code: Optional[int] = None,
        response_body: Optional[str] = None,
    ):
        super().__init__(message, user_id, provider)
        self.status_code = status_code
        # SECURITY: Truncate response body to prevent log bloat and potential secret exposure
        self.response_body = response_body[:500] if response_body else None


class TokenNotFoundError(AuthServiceError):
    """Raised when no token exists for a given user/URN."""
    pass


class TokenRefreshError(AuthServiceError):
    """Raised when token refresh fails."""
    pass


# =============================================================================
# TYPED RESPONSE MODELS
# =============================================================================
@dataclass(frozen=True)
class TokenResponse:
    """Immutable response from token exchange operations."""
    linkedin_user_urn: str
    access_token: str
    expires_at: Optional[int]
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'linkedin_user_urn': self.linkedin_user_urn,
            'access_token': self.access_token,
            'expires_at': self.expires_at,
        }


@dataclass(frozen=True)
class RefreshTokenResponse:
    """Response from token refresh operations."""
    access_token: str
    refresh_token: Optional[str]
    expires_at: Optional[int]
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'access_token': self.access_token,
            'refresh_token': self.refresh_token,
            'expires_at': self.expires_at,
        }


# =============================================================================
# INTERNAL HELPERS
# =============================================================================
def _make_request(
    method: str,
    url: str,
    user_id: Optional[str] = None,
    **kwargs,
) -> requests.Response:
    """
    Make an HTTP request with standardized error handling and logging.
    
    This centralizes all HTTP calls to ensure:
    - SSL verification is always applied
    - Timeouts are enforced
    - Errors are caught and wrapped in AuthProviderError
    - Structured logging captures request context
    
    Args:
        method: HTTP method ('get', 'post', etc.)
        url: Target URL
        user_id: Optional user ID for logging context
        **kwargs: Additional arguments passed to requests
        
    Returns:
        requests.Response object
        
    Raises:
        AuthProviderError: If the request fails for any reason
    """
    # SECURITY: Always enforce SSL verification and timeout
    kwargs.setdefault('verify', SSL_VERIFY)
    kwargs.setdefault('timeout', REQUEST_TIMEOUT)
    
    # Log SSL warning in development mode only (not production)
    if not SSL_VERIFY:
        logger.warning(
            "ssl_verification_disabled",
            user_id=user_id,
            url=url,
            warning="SSL verification is disabled - DO NOT USE IN PRODUCTION",
        )
    
    log = logger.bind(user_id=user_id, url=url, method=method.upper())
    
    try:
        log.debug("http_request_started")
        response = getattr(requests, method.lower())(url, **kwargs)
        response.raise_for_status()
        log.debug("http_request_completed", status_code=response.status_code)
        return response
        
    except Timeout as e:
        log.error(
            "http_request_timeout",
            error_type="Timeout",
            timeout_seconds=kwargs.get('timeout'),
        )
        raise AuthProviderError(
            message=f"Request to {url} timed out after {kwargs.get('timeout')}s",
            user_id=user_id,
            provider="linkedin",
        ) from e
        
    except ConnectionError as e:
        log.error(
            "http_request_connection_error",
            error_type="ConnectionError",
            error_details=str(e),
        )
        raise AuthProviderError(
            message=f"Failed to connect to LinkedIn API: {e}",
            user_id=user_id,
            provider="linkedin",
        ) from e
        
    except HTTPError as e:
        status_code = e.response.status_code if e.response is not None else None
        response_text = e.response.text if e.response is not None else None
        
        log.error(
            "http_request_http_error",
            error_type="HTTPError",
            status_code=status_code,
            # SECURITY: Don't log full response body - may contain tokens in error messages
            response_preview=response_text[:200] if response_text else None,
        )
        raise AuthProviderError(
            message=f"LinkedIn API returned error: HTTP {status_code}",
            user_id=user_id,
            provider="linkedin",
            status_code=status_code,
            response_body=response_text,
        ) from e
        
    except RequestException as e:
        log.error(
            "http_request_failed",
            error_type=type(e).__name__,
            error_details=str(e),
        )
        raise AuthProviderError(
            message=f"Request to LinkedIn failed: {e}",
            user_id=user_id,
            provider="linkedin",
        ) from e


def _fetch_linkedin_user_id(access_token: str, user_id: Optional[str] = None) -> str:
    """
    Fetch the LinkedIn user ID using the OpenID Connect userinfo endpoint.
    
    Args:
        access_token: Valid LinkedIn OAuth access token
        user_id: Optional Clerk user ID for logging context
        
    Returns:
        LinkedIn user ID (the 'sub' claim)
        
    Raises:
        AuthProviderError: If the userinfo request fails or returns no ID
    """
    userinfo_url = 'https://api.linkedin.com/v2/userinfo'
    
    response = _make_request(
        'get',
        userinfo_url,
        user_id=user_id,
        headers={'Authorization': f'Bearer {access_token}'},
    )
    
    userinfo = response.json()
    linkedin_id = userinfo.get('sub')
    
    if not linkedin_id:
        logger.error(
            "linkedin_user_id_missing",
            user_id=user_id,
            userinfo_keys=list(userinfo.keys()),
        )
        raise AuthProviderError(
            message="LinkedIn userinfo response did not contain 'sub' claim",
            user_id=user_id,
            provider="linkedin",
        )
    
    return linkedin_id


# =============================================================================
# PUBLIC API
# =============================================================================
def get_authorize_url(redirect_uri: str, state: str) -> str:
    """
    Generate the LinkedIn OAuth authorization URL.
    
    This is Step 1 of the OAuth flow: redirect the user to LinkedIn to grant access.
    
    Args:
        redirect_uri: URL to redirect back to after authorization
        state: Random string to prevent CSRF attacks (should be validated on callback)
    
    Returns:
        Full LinkedIn authorization URL
        
    Raises:
        AuthConfigurationError: If LINKEDIN_CLIENT_ID is not set
    
    SECURITY: The state parameter should be cryptographically random and
    validated when the callback is received to prevent CSRF attacks.
    """
    if not CLIENT_ID:
        logger.error("oauth_config_missing", missing_var="LINKEDIN_CLIENT_ID")
        raise AuthConfigurationError(
            message="LINKEDIN_CLIENT_ID environment variable is not set",
            provider="linkedin",
        )
    
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': redirect_uri,
        'scope': SCOPE,
        'state': state,
    }
    query_string = '&'.join([f"{k}={quote(v)}" for k, v in params.items()])
    
    logger.info(
        "oauth_authorize_url_generated",
        redirect_uri=redirect_uri,
        # SECURITY: Don't log the state parameter - it's a CSRF token
    )
    
    return f"https://www.linkedin.com/oauth/v2/authorization?{query_string}"


async def exchange_code_for_token(
    code: str, 
    redirect_uri: str, 
    user_id: Optional[str] = None,
) -> TokenResponse:
    """
    Exchange authorization code for access token (OAuth Step 2).
    
    This completes the OAuth flow by exchanging the authorization code
    (received from LinkedIn callback) for an access token.
    
    Args:
        code: Authorization code from LinkedIn callback
        redirect_uri: Must match the redirect_uri used in authorization
        user_id: Clerk user ID for multi-tenant isolation
        
    Returns:
        TokenResponse containing linkedin_user_urn, access_token, and expires_at
        
    Raises:
        AuthConfigurationError: If credentials not set
        AuthProviderError: If token exchange or userinfo fetch fails
    
    SECURITY NOTES:
    - Client secret is sent securely via POST body (not URL)
    - Token response is not logged to prevent secret exposure
    - Token is immediately stored in encrypted database
    """
    log = logger.bind(user_id=user_id, provider="linkedin")
    
    if not CLIENT_ID or not CLIENT_SECRET:
        log.error("oauth_config_missing", missing_vars=["CLIENT_ID", "CLIENT_SECRET"])
        raise AuthConfigurationError(
            message="LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set",
            user_id=user_id,
            provider="linkedin",
        )

    log.info("oauth_token_exchange_started")
    
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    # Exchange code for token
    response = _make_request('post', token_url, user_id=user_id, data=data, headers=headers)
    token_data = response.json()
    
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')
    
    if not access_token:
        log.error("oauth_token_missing_in_response")
        raise AuthProviderError(
            message="LinkedIn token response did not contain access_token",
            user_id=user_id,
            provider="linkedin",
        )
    
    # Fetch LinkedIn user identity
    linkedin_id = _fetch_linkedin_user_id(access_token, user_id)
    linkedin_user_urn = f'urn:li:person:{linkedin_id}'
    
    # Calculate absolute expiration timestamp
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    
    # Store token securely with user_id for multi-tenant isolation
    await save_token(
        linkedin_user_urn, 
        access_token, 
        refresh_token=None, 
        expires_at=expires_at, 
        user_id=user_id,
    )
    
    log.info(
        "oauth_token_exchange_success",
        linkedin_user_urn=linkedin_user_urn,
        expires_in_seconds=expires_in,
    )
    
    return TokenResponse(
        linkedin_user_urn=linkedin_user_urn,
        access_token=access_token,
        expires_at=expires_at,
    )


def get_authorize_url_for_user(client_id: str, redirect_uri: str, state: str) -> str:
    """
    Generate authorization URL using per-user LinkedIn app credentials.
    
    This allows multi-tenant operation where each user provides their own
    LinkedIn Developer App credentials.
    
    Args:
        client_id: User's LinkedIn app Client ID
        redirect_uri: Callback URL (must match LinkedIn app settings)
        state: CSRF protection token (format: "user_id:random_state")
        
    Returns:
        Full LinkedIn authorization URL
        
    Raises:
        AuthConfigurationError: If client_id is not provided
        
    SECURITY: The state parameter embeds user_id for multi-tenant routing.
    This is validated on callback to ensure the response matches the initiator.
    """
    if not client_id:
        logger.error("oauth_config_missing", missing_var="client_id (per-user)")
        raise AuthConfigurationError(
            message="LinkedIn Client ID not provided",
            provider="linkedin",
        )
    
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': SCOPE,
        'state': state,
    }
    query_string = '&'.join([f"{k}={quote(v)}" for k, v in params.items()])
    
    return f"https://www.linkedin.com/oauth/v2/authorization?{query_string}"


async def exchange_code_for_token_with_user(
    client_id: str, 
    client_secret: str, 
    code: str, 
    redirect_uri: str, 
    user_id: Optional[str] = None,
) -> TokenResponse:
    """
    Exchange authorization code using per-user credentials.
    
    Used for multi-tenant operation where each user has their own LinkedIn app.
    
    Args:
        client_id: User's LinkedIn app Client ID
        client_secret: User's LinkedIn app Client Secret
        code: Authorization code from callback
        redirect_uri: Must match authorization request
        user_id: Clerk user ID to associate with this token
        
    Returns:
        TokenResponse containing linkedin_user_urn, access_token, and expires_at
        
    Raises:
        AuthConfigurationError: If credentials not provided
        AuthProviderError: If token exchange fails
        
    SECURITY NOTES:
    - User's client_secret is sent securely to LinkedIn
    - Credentials are NOT logged at any point
    - Token is associated with user_id for isolation
    """
    log = logger.bind(user_id=user_id, provider="linkedin", credential_type="per-user")
    
    if not client_id or not client_secret:
        log.error("oauth_config_missing", missing_vars=["client_id", "client_secret"])
        raise AuthConfigurationError(
            message="LinkedIn Client ID or Client Secret not provided",
            user_id=user_id,
            provider="linkedin",
        )

    log.info("oauth_token_exchange_started")
    
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'client_secret': client_secret,
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    # Exchange code for token
    response = _make_request('post', token_url, user_id=user_id, data=data, headers=headers)
    token_data = response.json()
    
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')
    
    if not access_token:
        log.error("oauth_token_missing_in_response")
        raise AuthProviderError(
            message="LinkedIn token response did not contain access_token",
            user_id=user_id,
            provider="linkedin",
        )
    
    # Fetch LinkedIn user identity
    linkedin_id = _fetch_linkedin_user_id(access_token, user_id)
    linkedin_user_urn = f'urn:li:person:{linkedin_id}'
    
    # Calculate expiration
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    
    # Save token with user_id association for multi-tenant isolation
    await save_token(
        linkedin_user_urn, 
        access_token, 
        refresh_token=None, 
        expires_at=expires_at, 
        user_id=user_id,
    )
    
    log.info(
        "oauth_token_exchange_success",
        linkedin_user_urn=linkedin_user_urn,
        expires_in_seconds=expires_in,
    )

    return TokenResponse(
        linkedin_user_urn=linkedin_user_urn,
        access_token=access_token,
        expires_at=expires_at,
    )


def refresh_access_token(refresh_token: str, user_id: Optional[str] = None) -> RefreshTokenResponse:
    """
    Use refresh token to obtain a new access token.
    
    Called automatically when an access token is near expiry.
    
    Args:
        refresh_token: Refresh token from previous token response
        user_id: Optional user ID for logging context
        
    Returns:
        RefreshTokenResponse containing new access_token, refresh_token, and expires_at
        
    Raises:
        AuthConfigurationError: If credentials not set
        TokenRefreshError: If refresh fails
        
    SECURITY: Refresh tokens are single-use; the new refresh token
    should replace the old one in storage.
    
    NOTE: LinkedIn refresh tokens are not always available.
    Check LinkedIn's current documentation for token lifecycle.
    """
    log = logger.bind(user_id=user_id, provider="linkedin")
    
    if not CLIENT_ID or not CLIENT_SECRET:
        log.error("oauth_config_missing", missing_vars=["CLIENT_ID", "CLIENT_SECRET"])
        raise AuthConfigurationError(
            message="LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set",
            user_id=user_id,
            provider="linkedin",
        )

    log.info("oauth_token_refresh_started")
    
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        response = _make_request('post', token_url, user_id=user_id, data=data, headers=headers)
    except AuthProviderError as e:
        log.error(
            "oauth_token_refresh_failed",
            error_message=str(e),
            status_code=e.status_code,
        )
        raise TokenRefreshError(
            message=f"Failed to refresh LinkedIn token: {e.message}",
            user_id=user_id,
            provider="linkedin",
        ) from e
    
    token_data = response.json()
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')
    new_refresh = token_data.get('refresh_token', refresh_token)
    
    if not access_token:
        log.error("oauth_token_missing_in_refresh_response")
        raise TokenRefreshError(
            message="LinkedIn refresh response did not contain access_token",
            user_id=user_id,
            provider="linkedin",
        )
    
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    
    log.info(
        "oauth_token_refresh_success",
        expires_in_seconds=expires_in,
    )

    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_at=expires_at,
    )


async def get_access_token_for_urn(
    linkedin_user_urn: str, 
    refresh_buffer: int = 60,
) -> str:
    """
    Get a valid access token for a LinkedIn user, refreshing if needed.
    
    This is the main entry point for getting a usable token.
    It handles automatic refresh when token is near expiry.
    
    Args:
        linkedin_user_urn: The user's LinkedIn URN
        refresh_buffer: Seconds before expiry to trigger refresh (default: 60)
        
    Returns:
        Valid access token string
        
    Raises:
        TokenNotFoundError: If no token found for URN
        TokenRefreshError: If refresh fails
        
    SECURITY: Tokens are refreshed proactively to avoid failed API calls.
    The refresh buffer ensures continuous availability.
    """
    log = logger.bind(linkedin_user_urn=linkedin_user_urn)
    
    token_row = await get_token_by_urn(linkedin_user_urn)
    if not token_row:
        log.warning("token_not_found")
        raise TokenNotFoundError(
            message=f"No token found for LinkedIn URN: {linkedin_user_urn}",
            provider="linkedin",
        )

    access_token = token_row.get('access_token')
    refresh_token = token_row.get('refresh_token')
    expires_at = token_row.get('expires_at')
    user_id = token_row.get('user_id')  # Extract for logging context

    now = int(time.time())
    
    # Check if token needs refresh (within buffer period of expiry)
    if expires_at and (expires_at - now) <= refresh_buffer:
        log.info(
            "token_refresh_required",
            user_id=user_id,
            expires_in_seconds=expires_at - now,
            refresh_buffer=refresh_buffer,
        )
        
        if not refresh_token:
            log.error("no_refresh_token_available", user_id=user_id)
            raise TokenRefreshError(
                message="No refresh token available to refresh access token",
                user_id=user_id,
                provider="linkedin",
            )
        
        refreshed = refresh_access_token(refresh_token, user_id=user_id)
        
        # Update stored token with new values
        await save_token(
            linkedin_user_urn, 
            refreshed.access_token, 
            refreshed.refresh_token, 
            refreshed.expires_at,
        )
        
        log.info("token_refreshed_and_stored", user_id=user_id)
        return refreshed.access_token

    return access_token
