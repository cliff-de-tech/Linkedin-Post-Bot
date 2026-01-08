"""
GitHub Router - GitHub OAuth and activity endpoints

Handles:
- GitHub OAuth flow (start, callback)
- GitHub disconnect
- GitHub activity fetching and scanning
"""
import os
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError
import structlog

from schemas import ScanRequest, DisconnectRequest
from middleware.clerk_auth import require_auth
from services.github_activity import get_user_activity, get_repo_details
from services.user_settings import get_user_settings, save_user_settings
from services.token_store import get_token_by_user_id, save_github_token

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api", tags=["github"])

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID', '')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET', '')

# Security settings
SSL_VERIFY = os.getenv('SSL_VERIFY', 'true').lower() != 'false'
REQUEST_TIMEOUT = int(os.getenv('AUTH_REQUEST_TIMEOUT', '15'))


# =============================================================================
# OAUTH ENDPOINTS (no /api prefix for OAuth flow)
# =============================================================================

auth_router = APIRouter(tags=["github-auth"])


@auth_router.get('/auth/github/start')
async def github_oauth_start(redirect_uri: str, user_id: str):
    """
    Start GitHub OAuth flow.
    
    Redirects user to GitHub's authorization page.
    Requested scopes: read:user, repo (for private repo access)
    
    Args:
        redirect_uri: Where to redirect after auth
        user_id: Clerk user ID (stored in state for callback)
    """
    if not GITHUB_CLIENT_ID:
        logger.error("github_oauth_not_configured", user_id=user_id)
        return {"error": "GitHub OAuth not configured"}
    
    state = f"{user_id}:{uuid4().hex}"
    
    # Request read:user and repo scope for private activity access
    scopes = "read:user,repo"
    
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scopes}"
        f"&state={state}"
    )
    
    logger.info("github_oauth_started", user_id=user_id)
    return RedirectResponse(auth_url)


@auth_router.get('/auth/github/callback')
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
        logger.warning("github_oauth_missing_user_id")
        return {"error": "missing user_id in state", "status": "failed"}
    
    log = logger.bind(user_id=user_id)
    
    try:
        # Exchange code for access token
        log.debug("github_token_exchange_started")
        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code,
            },
            headers={'Accept': 'application/json'},
            timeout=REQUEST_TIMEOUT,
            verify=SSL_VERIFY,
        )
        token_response.raise_for_status()
        
        token_data = token_response.json()
        
        if 'error' in token_data:
            log.error("github_oauth_error_response", error=token_data.get('error'))
            return {"error": token_data.get('error_description', 'OAuth failed'), "status": "failed"}
        
        access_token = token_data.get('access_token')
        
        if not access_token:
            log.error("github_no_access_token")
            return {"error": "No access token received", "status": "failed"}
        
        # Get GitHub username from API
        user_response = requests.get(
            'https://api.github.com/user',
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout=REQUEST_TIMEOUT,
            verify=SSL_VERIFY,
        )
        user_response.raise_for_status()
        
        github_user = user_response.json()
        github_username = github_user.get('login', '')
        
        # Store the token encrypted
        await save_github_token(user_id, github_username, access_token)
        
        # Also update user settings with username
        settings = await get_user_settings(user_id) or {}
        settings['github_username'] = github_username
        await save_user_settings(user_id, settings)
        
        log.info("github_oauth_success", github_username=github_username)
        return {
            "status": "success", 
            "github_username": github_username,
            "github_connected": True
        }
    
    except Timeout:
        log.error("github_oauth_timeout")
        return {"error": "GitHub API request timed out", "status": "failed"}
    
    except ConnectionError:
        log.error("github_oauth_connection_error")
        return {"error": "Unable to connect to GitHub", "status": "failed"}
    
    except RequestException as e:
        log.error("github_oauth_request_error", error=str(e))
        return {"error": f"GitHub API error: {str(e)}", "status": "failed"}
    
    except Exception as e:
        log.exception("github_oauth_unexpected_error")
        return {"error": str(e), "status": "failed"}


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/disconnect-github")
async def disconnect_github(
    request: DisconnectRequest,
    current_user: dict = Depends(require_auth) if require_auth else None
):
    """
    Disconnect a user's GitHub OAuth token (secured - verifies ownership).
    """
    # SECURITY: Verify user is disconnecting their own GitHub
    if current_user and current_user.get("user_id") != request.user_id:
        raise HTTPException(status_code=403, detail="Cannot disconnect other user's GitHub")
    
    try:
        from services.db import get_database
        db = get_database()
        
        # Clear only the GitHub token, keep the rest
        await db.execute("""
            UPDATE accounts 
            SET github_access_token = NULL 
            WHERE user_id = $1
        """, [request.user_id])
        
        return {"success": True, "message": "GitHub disconnected"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/github/activity/{username}")
async def github_activity(username: str, limit: int = 10):
    """Get GitHub activity for a user"""
    if not get_user_activity:
        return {"error": "GitHub service not available"}
    try:
        activities = get_user_activity(username, limit)
        return {"activities": activities}
    except Exception as e:
        return {"error": str(e)}


@router.get("/github/repo/{owner}/{repo}")
async def github_repo(owner: str, repo: str):
    """Get GitHub repository details"""
    if not get_repo_details:
        return {"error": "GitHub service not available"}
    try:
        repo_info = get_repo_details(f"{owner}/{repo}")
        return repo_info or {"error": "Repository not found"}
    except Exception as e:
        return {"error": str(e)}


@router.post("/github/scan")
async def scan_github_activity(
    req: ScanRequest,
    current_user: dict = Depends(require_auth) if require_auth else None
):
    """Scan GitHub for recent activity (secured)
    
    TIER RESTRICTIONS:
    - Free tier: Limited to 24-hour scan
    - Pro tier: Full customization
    """
    # SECURITY: Verify user is scanning for their own account
    if current_user and current_user.get("user_id") != req.user_id:
        raise HTTPException(status_code=403, detail="Cannot scan GitHub for other users")
    
    if not get_user_activity:
        return {"error": "GitHub activity service not available"}
    
    # Get user's subscription tier
    user_tier = 'free'  # Default
    try:
        settings = await get_user_settings(req.user_id)
        if settings:
            user_tier = settings.get('subscription_tier', 'free')
    except Exception as e:
        logger.debug(f"Failed to get user settings for tier: {e}")
    
    # TIER ENFORCEMENT: Force Free tier restrictions
    scan_hours = req.hours
    scan_activity_type = req.activity_type
    if user_tier == 'free':
        if scan_hours > 24:
            scan_hours = 24  # Free tier: Max 24 hours
        scan_activity_type = 'all'  # Free tier: No filtering
    
    # Get user's GitHub username from settings
    github_username = None
    try:
        settings = await get_user_settings(req.user_id)
        if settings:
            github_username = settings.get('github_username')
    except Exception as e:
        logger.error("Error getting user settings", exc_info=True)
    
    # Fallback to env var
    if not github_username:
        github_username = os.getenv('GITHUB_USERNAME', 'cliff-de-tech')
    
    if not github_username:
        return {"error": "No GitHub username configured", "activities": [], "all_activities": []}
    
    # Get user's GitHub token if available
    github_token = None
    try:
        token_data = await get_token_by_user_id(req.user_id)
        if token_data:
            github_token = token_data.get('github_access_token')
    except Exception as e:
        logger.error("Error getting user token", exc_info=True)

    try:
        # Get activities (passing user token if available)
        # This will auto-select private or public endpoint based on token presence
        activities = get_user_activity(github_username, limit=30, token=github_token)
        
        # Filter to recent hours
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=scan_hours)
        
        all_recent_activities = []
        for activity in activities:
            # Check if activity has context (our parsed format)
            if activity.get('context'):
                all_recent_activities.append({
                    'id': activity.get('id'),
                    'type': activity.get('type'),
                    'icon': activity.get('icon', '📦'),
                    'title': activity.get('title'),
                    'description': activity.get('description'),
                    'time_ago': activity.get('time_ago'),
                    'context': activity.get('context'),
                    'repo': activity.get('repo')
                })
        
        # Filter by activity type if specified (and Pro tier)
        filtered_activities = all_recent_activities
        if scan_activity_type and scan_activity_type not in ['all', 'generic']:
            type_mapping = {
                'push': 'push',
                'pull_request': 'pull_request',
                'new_repo': 'new_repo',
                'commits': 'push'  # commits are part of push events
            }
            target_type = type_mapping.get(scan_activity_type, scan_activity_type)
            filtered_activities = [a for a in all_recent_activities if a.get('type') == target_type]
        
        # FREE TIER LIMIT: Cap at 10 activities (aligns with 10 posts/day limit)
        if user_tier == 'free':
            filtered_activities = filtered_activities[:10]
        
        return {
            "success": True,
            "github_username": github_username,
            "activities": filtered_activities,
            "all_activities": all_recent_activities,  # For suggesting alternatives
            "count": len(filtered_activities)
        }
    except Exception as e:
        return {"error": str(e), "activities": [], "all_activities": []}
