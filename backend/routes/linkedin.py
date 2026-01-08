"""
LinkedIn Router - LinkedIn OAuth and account management endpoints

Handles:
- LinkedIn OAuth flow (start, callback)
- LinkedIn disconnect
"""
import os
import base64
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

import structlog
from schemas import DisconnectRequest
from middleware.clerk_auth import require_auth
from services.user_settings import get_user_settings, save_user_settings
from services.auth_service import (
    get_authorize_url,
    exchange_code_for_token,
    get_authorize_url_for_user,
    exchange_code_for_token_with_user,
    AuthServiceError,
    AuthConfigurationError,
    AuthProviderError,
    TokenNotFoundError,
    TokenRefreshError,
)
from services.token_store import delete_token_by_user_id

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api", tags=["linkedin"])

# OAuth router without /api prefix
auth_router = APIRouter(tags=["linkedin-auth"])


@auth_router.get('/auth/linkedin/start')
async def linkedin_start(redirect_uri: str, user_id: str = None):
    """Redirects the user to LinkedIn's authorization page.
    
    If user_id is provided, uses that user's saved LinkedIn credentials.
    Otherwise falls back to global env vars.
    """
    # Generate random state
    random_state = uuid4().hex
    
    # Store user_id and frontend redirect_uri in state
    # Format: user_id|frontend_redirect_uri|random_state
    safe_redirect = redirect_uri or "http://localhost:3000/settings"
    safe_user_id = user_id or ""
    
    # Simple delimiter-based state
    state_payload = f"{safe_user_id}|{safe_redirect}|{random_state}"
    state = base64.urlsafe_b64encode(state_payload.encode()).decode()
    
    # The callback URI registered in LinkedIn Developer Portal MUST match this
    backend_callback_uri = "http://localhost:8000/auth/linkedin/callback"
    
    # Try to use per-user credentials if user_id provided
    if user_id:
        try:
            settings = await get_user_settings(user_id)
            if settings and settings.get('linkedin_client_id'):
                url = get_authorize_url_for_user(
                    settings['linkedin_client_id'],
                    backend_callback_uri,
                    state
                )
                return RedirectResponse(url)
        except Exception as e:
            logger.error("Failed to get user settings", exc_info=True)
    
    # Fallback to global credentials
    if not get_authorize_url:
        return {"error": "OAuth service not available"}
        
    url = get_authorize_url(backend_callback_uri, state)
    return RedirectResponse(url)


@auth_router.get('/auth/linkedin/callback')
async def linkedin_callback(code: str = None, state: str = None, redirect_uri: str = None):
    """
    Exchange code for token and redirect back to frontend.
    
    Redirects to: {frontend_redirect}?linkedin_success=true&linkedin_urn=...
    Or on error: {frontend_redirect}?linkedin_success=false&error=...
    """
    # Default redirect if decoding fails
    frontend_redirect = "http://localhost:3000/settings"
    user_id = None
    
    # Define the backend callback URI that must be used for exchange
    backend_callback_uri = "http://localhost:8000/auth/linkedin/callback"
    
    # Decode state to get user_id and frontend_redirect
    if state:
        try:
            decoded = base64.urlsafe_b64decode(state).decode()
            parts = decoded.split('|')
            if len(parts) >= 2:
                user_id_part = parts[0]
                redirect_part = parts[1]
                
                if user_id_part:
                    user_id = user_id_part
                if redirect_part and (redirect_part.startswith('http') or redirect_part.startswith('/')):
                    frontend_redirect = redirect_part
                    # Clean up any Double encoding if present
                    if 'localhost:8000' in frontend_redirect:
                         frontend_redirect = "http://localhost:3000/settings"
            
            # Legacy state support (user_id:random) - in case old link used
            elif ':' in decoded:
                 parts = decoded.split(':', 1)
                 if parts[0]: user_id = parts[0]

        except Exception as e:
            logger.error("Error decoding state", exc_info=True)
            # Try legacy format (raw string)
            if state and ':' in state:
                parts = state.split(':', 1)
                if parts[0]: user_id = parts[0]
    
    if not code:
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error=missing_code")
    
    try:
        result = None
        
        # Use per-user credentials if we have a user_id
        if user_id:
            settings = await get_user_settings(user_id)
            if settings and settings.get('linkedin_client_id') and settings.get('linkedin_client_secret'):
                result = await exchange_code_for_token_with_user(
                    settings['linkedin_client_id'],
                    settings['linkedin_client_secret'],
                    code,
                    backend_callback_uri,
                    user_id
                )
                # Also save the URN to user settings (result is now TokenResponse dataclass)
                settings['linkedin_user_urn'] = result.linkedin_user_urn
                await save_user_settings(user_id, settings)
        
        # Fallback to global credentials
        if not result:
            if not exchange_code_for_token:
                return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error=oauth_not_available")
            
            # Pass user_id for multi-tenant token storage
            result = await exchange_code_for_token(code, backend_callback_uri, user_id)
        
        # Handle both TokenResponse object and dict (for backwards compatibility)
        linkedin_urn = result.linkedin_user_urn if hasattr(result, 'linkedin_user_urn') else result.get("linkedin_user_urn", "")
        logger.info("oauth_callback_success", user_id=user_id, linkedin_urn=linkedin_urn)
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=true&linkedin_urn={linkedin_urn}")
    
    except AuthConfigurationError as e:
        logger.error("oauth_config_error", user_id=user_id, error=str(e))
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error=oauth_not_configured")
    
    except AuthProviderError as e:
        logger.error("oauth_provider_error", user_id=user_id, error=str(e), status_code=e.status_code)
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error=linkedin_unavailable")
    
    except AuthServiceError as e:
        logger.error("oauth_service_error", user_id=user_id, error=str(e))
        error_msg = str(e).replace(" ", "_")[:50]  # Sanitize for URL
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error={error_msg}")
        
    except Exception as e:
        logger.exception("oauth_unexpected_error", user_id=user_id)
        error_msg = str(e).replace(" ", "_")[:50]  # Sanitize for URL
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error={error_msg}")


@router.post("/disconnect-linkedin")
async def disconnect_linkedin(
    request: DisconnectRequest,
    current_user: dict = Depends(require_auth) if require_auth else None
):
    """
    Disconnect a user's LinkedIn account (secured - verifies ownership).
    
    Removes the stored OAuth token, requiring re-authentication
    to post again.
    """
    # SECURITY: Verify user is disconnecting their own account
    if current_user and current_user.get("user_id") != request.user_id:
        raise HTTPException(status_code=403, detail="Cannot disconnect other user's account")
    
    try:
        deleted = await delete_token_by_user_id(request.user_id)
        
        if deleted:
            return {"success": True, "message": "LinkedIn disconnected"}
        else:
            return {"success": False, "message": "No connection found"}
    except Exception as e:
        return {"success": False, "error": str(e)}
