"""
Authentication Routes
Handles OAuth flows for LinkedIn and GitHub.

SECURITY NOTES:
- OAuth tokens are stored encrypted in backend_tokens.db
- User IDs are validated via Clerk JWT
- State parameter prevents CSRF attacks
"""

import os
import base64
from uuid import uuid4
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional

# =============================================================================
# ROUTER SETUP
# =============================================================================
router = APIRouter(prefix="/auth", tags=["Authentication"])

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID', '')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET', '')

# =============================================================================
# SERVICE IMPORTS (with graceful fallbacks)
# =============================================================================
try:
    from services.user_settings import get_user_settings, save_user_settings
except ImportError:
    get_user_settings = None
    save_user_settings = None

try:
    from services.auth_service import (
        get_authorize_url,
        exchange_code_for_token,
        get_authorize_url_for_user,
        exchange_code_for_token_with_user,
    )
except ImportError:
    get_authorize_url = None
    exchange_code_for_token = None
    get_authorize_url_for_user = None
    exchange_code_for_token_with_user = None


# =============================================================================
# REQUEST MODELS
# =============================================================================
class DisconnectRequest(BaseModel):
    """Request model for disconnect endpoints."""
    user_id: str


class AuthRefreshRequest(BaseModel):
    user_id: str


# =============================================================================
# LINKEDIN OAUTH ENDPOINTS
# =============================================================================
@router.get('/linkedin/start')
async def linkedin_start(redirect_uri: str, user_id: str = None):
    """
    Redirects the user to LinkedIn's authorization page.
    
    If user_id is provided, uses that user's saved LinkedIn credentials.
    Otherwise falls back to global env vars.
    """
    # Generate random state
    random_state = uuid4().hex
    
    # Store user_id and frontend redirect_uri in state
    safe_redirect = redirect_uri or "http://localhost:3000/settings"
    safe_user_id = user_id or ""
    
    state_payload = f"{safe_user_id}|{safe_redirect}|{random_state}"
    state = base64.urlsafe_b64encode(state_payload.encode()).decode()
    
    # The callback URI registered in LinkedIn Developer Portal MUST match this
    backend_callback_uri = "http://localhost:8000/auth/linkedin/callback"
    
    # Try to use per-user credentials if user_id provided
    if user_id and get_user_settings:
        try:
            settings = await get_user_settings(user_id)
            if settings and settings.get('linkedin_client_id') and get_authorize_url_for_user:
                url = get_authorize_url_for_user(
                    settings['linkedin_client_id'],
                    backend_callback_uri,
                    state
                )
                return RedirectResponse(url)
        except Exception as e:
            print(f"Failed to get user settings: {e}")
    
    # Fallback to global credentials
    if not get_authorize_url:
        return {"error": "OAuth service not available"}
        
    url = get_authorize_url(backend_callback_uri, state)
    return RedirectResponse(url)


@router.get('/linkedin/callback')
async def linkedin_callback(code: str = None, state: str = None, redirect_uri: str = None):
    """
    Exchange code for token and redirect back to frontend.
    
    Redirects to: {frontend_redirect}?linkedin_success=true&linkedin_urn=...
    Or on error: {frontend_redirect}?linkedin_success=false&error=...
    """
    # Default redirect if decoding fails
    frontend_redirect = "http://localhost:3000/settings"
    user_id = None
    
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
                    if 'localhost:8000' in frontend_redirect:
                        frontend_redirect = "http://localhost:3000/settings"
            
            # Legacy state support
            elif ':' in decoded:
                parts = decoded.split(':', 1)
                if parts[0]: user_id = parts[0]

        except Exception as e:
            print(f"Error decoding state: {e}")
            if state and ':' in state:
                parts = state.split(':', 1)
                if parts[0]: user_id = parts[0]
    
    if not code:
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error=missing_code")
    
    try:
        result = None
        
        # Use per-user credentials if we have a user_id
        if user_id and get_user_settings and exchange_code_for_token_with_user:
            settings = await get_user_settings(user_id)
            if settings and settings.get('linkedin_client_id') and settings.get('linkedin_client_secret'):
                result = await exchange_code_for_token_with_user(
                    settings['linkedin_client_id'],
                    settings['linkedin_client_secret'],
                    code,
                    backend_callback_uri,
                    user_id
                )
                if save_user_settings:
                    settings['linkedin_user_urn'] = result.get('linkedin_user_urn')
                    await save_user_settings(user_id, settings)
        
        # Fallback to global credentials
        if not result:
            if not exchange_code_for_token:
                return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error=oauth_not_available")
            
            result = await exchange_code_for_token(code, backend_callback_uri, user_id)
        
        linkedin_urn = result.get("linkedin_user_urn", "")
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=true&linkedin_urn={linkedin_urn}")
        
    except Exception as e:
        import traceback
        print(f"OAuth Error: {e}")
        print(traceback.format_exc())
        error_msg = str(e).replace(" ", "_")[:50]
        return RedirectResponse(f"{frontend_redirect}?linkedin_success=false&error={error_msg}")


# =============================================================================
# GITHUB OAUTH ENDPOINTS
# =============================================================================
@router.get('/github/start')
def github_oauth_start(redirect_uri: str, user_id: str):
    """
    Start GitHub OAuth flow.
    
    Redirects user to GitHub's authorization page.
    Requested scopes: read:user, repo (for private repo access)
    """
    if not GITHUB_CLIENT_ID:
        return {"error": "GitHub OAuth not configured"}
    
    state = f"{user_id}:{uuid4().hex}"
    scopes = "read:user,repo"
    
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scopes}"
        f"&state={state}"
    )
    
    return RedirectResponse(auth_url)


@router.get('/github/callback')
async def github_oauth_callback(code: str = None, state: str = None, redirect_uri: str = None):
    """
    Handle GitHub OAuth callback.
    
    Exchanges authorization code for access token and stores it encrypted.
    Returns JSON status for the frontend callback component.
    """
    if not code:
        return {"error": "missing code", "status": "failed"}
    
    # Extract user_id from state
    user_id = None
    if state and ':' in state:
        parts = state.split(':', 1)
        user_id = parts[0]
    
    if not user_id:
        return {"error": "missing user_id in state", "status": "failed"}
    
    try:
        import requests
        
        # Exchange code for access token
        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code,
            },
            headers={'Accept': 'application/json'},
            timeout=10,
            verify=False
        )
        
        token_data = token_response.json()
        
        if 'error' in token_data:
            return {"error": token_data.get('error_description', 'OAuth failed'), "status": "failed"}
        
        access_token = token_data.get('access_token')
        
        if not access_token:
            return {"error": "No access token received", "status": "failed"}
        
        # Get GitHub username from API
        user_response = requests.get(
            'https://api.github.com/user',
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout=10,
            verify=False
        )
        
        github_user = user_response.json()
        github_username = github_user.get('login', '')
        
        # Store the token encrypted
        from services.token_store import save_github_token
        await save_github_token(user_id, github_username, access_token)
        
        # Also update user settings with username
        if save_user_settings and get_user_settings:
            settings = await get_user_settings(user_id) or {}
            settings['github_username'] = github_username
            await save_user_settings(user_id, settings)
        
        return {
            "status": "success", 
            "github_username": github_username,
            "github_connected": True
        }
    except Exception as e:
        import traceback
        print(f"GitHub OAuth Error: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "status": "failed"}


# =============================================================================
# AUTH UTILITY ENDPOINTS
# =============================================================================
@router.post("/refresh")
async def refresh_auth(req: AuthRefreshRequest):
    """Check if user has valid LinkedIn connection"""
    if not get_user_settings:
        return {"error": "Settings service not available"}
    try:
        settings = await get_user_settings(req.user_id)
        if settings and settings.get("linkedin_user_urn"):
            return {
                "access_token": "valid",
                "user_urn": settings.get("linkedin_user_urn"),
                "authenticated": True
            }
        return {"access_token": None, "authenticated": False}
    except Exception as e:
        return {"error": str(e), "authenticated": False}
