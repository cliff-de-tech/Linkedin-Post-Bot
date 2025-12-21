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
- All HTTP requests use HTTPS with timeouts

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

import os
import time
import requests
from urllib.parse import quote
from services.token_store import save_token, get_token_by_urn

# LinkedIn OAuth configuration from environment
# SECURITY: These are loaded from environment variables, never hardcoded
CLIENT_ID = os.getenv('LINKEDIN_CLIENT_ID', '')
CLIENT_SECRET = os.getenv('LINKEDIN_CLIENT_SECRET', '')

# OAuth scopes required for this application
# - r_liteprofile/r_emailaddress: Legacy scopes (deprecated by LinkedIn)
# - openid, profile, email: OpenID Connect scopes
# - w_member_social: Required for posting content
SCOPE = os.getenv('LINKEDIN_OAUTH_SCOPE', 'openid profile email w_member_social')


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
        RuntimeError: If LINKEDIN_CLIENT_ID is not set
    
    SECURITY: The state parameter should be cryptographically random and
    validated when the callback is received to prevent CSRF attacks.
    """
    if not CLIENT_ID:
        raise RuntimeError('LINKEDIN_CLIENT_ID not set')
    
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': redirect_uri,
        'scope': SCOPE,
        'state': state
    }
    q = '&'.join([f"{k}={quote(v)}" for k, v in params.items()])
    return f"https://www.linkedin.com/oauth/v2/authorization?{q}"


def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """
    Exchange authorization code for access token (OAuth Step 2).
    
    This completes the OAuth flow by exchanging the authorization code
    (received from LinkedIn callback) for an access token.
    
    Args:
        code: Authorization code from LinkedIn callback
        redirect_uri: Must match the redirect_uri used in authorization
        
    Returns:
        Dict containing linkedin_user_urn, access_token, and expires_at
        
    Raises:
        RuntimeError: If credentials not set or token exchange fails
    
    SECURITY NOTES:
    - Client secret is sent securely via POST body (not URL)
    - Token response is not logged to prevent secret exposure
    - Token is immediately stored in encrypted database
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set')

    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    # SECURITY: Using timeout to prevent hanging connections
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    
    token_data = resp.json()
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')

    # Use OpenID Connect userinfo endpoint to get user identity
    # This is more reliable than the legacy /v2/me endpoint
    userinfo_url = 'https://api.linkedin.com/v2/userinfo'
    userinfo_resp = requests.get(
        userinfo_url, 
        headers={'Authorization': f'Bearer {access_token}'}, 
        timeout=10
    )
    userinfo_resp.raise_for_status()
    userinfo = userinfo_resp.json()
    
    # 'sub' is the OpenID Connect standard claim for user ID
    linkedin_id = userinfo.get('sub')
    if not linkedin_id:
        raise RuntimeError('Failed to fetch LinkedIn user id')
    
    linkedin_user_urn = f'urn:li:person:{linkedin_id}'

    # Calculate absolute expiration timestamp
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    
    # Store token securely
    # SECURITY: Token is stored in SQLite; access is via parameterized queries
    save_token(linkedin_user_urn, access_token, refresh_token=None, expires_at=expires_at)

    return {
        'linkedin_user_urn': linkedin_user_urn,
        'access_token': access_token,
        'expires_at': expires_at
    }


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
        
    SECURITY: The state parameter embeds user_id for multi-tenant routing.
    This is validated on callback to ensure the response matches the initiator.
    """
    if not client_id:
        raise RuntimeError('LinkedIn Client ID not provided')
    
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': SCOPE,
        'state': state
    }
    q = '&'.join([f"{k}={quote(v)}" for k, v in params.items()])
    return f"https://www.linkedin.com/oauth/v2/authorization?{q}"


def exchange_code_for_token_with_user(
    client_id: str, 
    client_secret: str, 
    code: str, 
    redirect_uri: str, 
    user_id: str = None
) -> dict:
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
        Dict containing linkedin_user_urn, access_token, and expires_at
        
    SECURITY NOTES:
    - User's client_secret is sent securely to LinkedIn
    - Credentials are NOT logged at any point
    - Token is associated with user_id for isolation
    """
    if not client_id or not client_secret:
        raise RuntimeError('LinkedIn Client ID or Client Secret not provided')

    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'client_secret': client_secret
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    
    token_data = resp.json()
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')

    # Get user identity via OpenID Connect
    userinfo_url = 'https://api.linkedin.com/v2/userinfo'
    userinfo_resp = requests.get(
        userinfo_url, 
        headers={'Authorization': f'Bearer {access_token}'}, 
        timeout=10
    )
    userinfo_resp.raise_for_status()
    userinfo = userinfo_resp.json()
    
    linkedin_id = userinfo.get('sub')
    if not linkedin_id:
        raise RuntimeError('Failed to fetch LinkedIn user id')
    
    linkedin_user_urn = f'urn:li:person:{linkedin_id}'
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    
    # Save token with user_id association for multi-tenant isolation
    save_token(
        linkedin_user_urn, 
        access_token, 
        refresh_token=None, 
        expires_at=expires_at, 
        user_id=user_id
    )

    return {
        'linkedin_user_urn': linkedin_user_urn,
        'access_token': access_token,
        'expires_at': expires_at
    }


def refresh_access_token(refresh_token: str) -> dict:
    """
    Use refresh token to obtain a new access token.
    
    Called automatically when an access token is near expiry.
    
    Args:
        refresh_token: Refresh token from previous token response
        
    Returns:
        Dict containing new access_token, refresh_token, and expires_at
        
    SECURITY: Refresh tokens are single-use; the new refresh token
    should replace the old one in storage.
    
    NOTE: LinkedIn refresh tokens are not always available.
    Check LinkedIn's current documentation for token lifecycle.
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set')

    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    
    token_data = resp.json()
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')
    new_refresh = token_data.get('refresh_token', refresh_token)

    expires_at = int(time.time()) + int(expires_in) if expires_in else None

    return {
        'access_token': access_token,
        'refresh_token': new_refresh,
        'expires_at': expires_at
    }


def get_access_token_for_urn(linkedin_user_urn: str, refresh_buffer: int = 60) -> str:
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
        RuntimeError: If no token found or refresh fails
        
    SECURITY: Tokens are refreshed proactively to avoid failed API calls.
    The refresh buffer ensures continuous availability.
    """
    token_row = get_token_by_urn(linkedin_user_urn)
    if not token_row:
        raise RuntimeError('No token found for this linkedin_user_urn')

    access_token = token_row.get('access_token')
    refresh_token = token_row.get('refresh_token')
    expires_at = token_row.get('expires_at')

    now = int(time.time())
    
    # Check if token needs refresh (within buffer period of expiry)
    if expires_at and (expires_at - now) <= refresh_buffer:
        if not refresh_token:
            raise RuntimeError('No refresh token available to refresh access token')
        
        refreshed = refresh_access_token(refresh_token)
        
        # Update stored token with new values
        save_token(
            linkedin_user_urn, 
            refreshed['access_token'], 
            refreshed.get('refresh_token'), 
            refreshed.get('expires_at')
        )
        return refreshed['access_token']

    return access_token
