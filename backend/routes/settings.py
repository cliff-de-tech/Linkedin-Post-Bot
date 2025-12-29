"""
Settings Routes - User Settings API

Handles:
- GET /api/settings/{user_id} - Get user settings including persona
- POST /api/settings - Save user settings
- POST /api/settings/{user_id} - Save user settings (alternate)
- GET /api/connection-status/{user_id} - Get connection status
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

# =============================================================================
# ROUTER SETUP
# =============================================================================
router = APIRouter(prefix="/api", tags=["Settings"])
logger = logging.getLogger(__name__)

# =============================================================================
# SERVICE IMPORTS
# =============================================================================
try:
    from services.user_settings import get_user_settings, save_user_settings
except ImportError:
    get_user_settings = None
    save_user_settings = None

try:
    from services.token_store import get_token_by_user_id, get_github_token
except ImportError:
    get_token_by_user_id = None
    get_github_token = None


# =============================================================================
# REQUEST MODELS
# =============================================================================
class SettingsRequest(BaseModel):
    """Request model for saving settings."""
    user_id: Optional[str] = None
    github_username: Optional[str] = None
    onboarding_complete: Optional[bool] = None
    preferences: Optional[Dict[str, Any]] = None
    persona: Optional[Dict[str, Any]] = None


# =============================================================================
# SETTINGS ENDPOINTS
# =============================================================================
@router.get("/settings/{user_id}")
async def get_settings(user_id: str):
    """
    Get user settings including persona.
    
    Returns empty object if no settings exist yet.
    """
    if not get_user_settings:
        raise HTTPException(status_code=503, detail="Settings service not available")
    
    try:
        settings = await get_user_settings(user_id)
        if not settings:
            # Return default empty settings
            return {
                "user_id": user_id,
                "github_username": "",
                "preferences": {},
                "persona": {},
                "onboarding_complete": False
            }
        return settings
    except Exception as e:
        logger.error(f"Error getting settings for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings")
async def save_settings_body(req: SettingsRequest):
    """
    Save user settings from request body.
    
    Uses user_id from request body.
    """
    if not save_user_settings:
        raise HTTPException(status_code=503, detail="Settings service not available")
    
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        settings_dict = {}
        if req.github_username is not None:
            settings_dict['github_username'] = req.github_username
        if req.onboarding_complete is not None:
            settings_dict['onboarding_complete'] = req.onboarding_complete
        if req.preferences is not None:
            settings_dict['preferences'] = req.preferences
        if req.persona is not None:
            settings_dict['persona'] = req.persona
        
        await save_user_settings(req.user_id, settings_dict)
        return {"success": True, "message": "Settings saved"}
    except Exception as e:
        logger.error(f"Error saving settings for {req.user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings/{user_id}")
async def save_settings_path(user_id: str, req: SettingsRequest):
    """
    Save user settings with user_id from path.
    
    Used by PersonaSettings component.
    """
    if not save_user_settings:
        raise HTTPException(status_code=503, detail="Settings service not available")
    
    try:
        settings_dict = {}
        if req.github_username is not None:
            settings_dict['github_username'] = req.github_username
        if req.onboarding_complete is not None:
            settings_dict['onboarding_complete'] = req.onboarding_complete
        if req.preferences is not None:
            settings_dict['preferences'] = req.preferences
        if req.persona is not None:
            settings_dict['persona'] = req.persona
        
        await save_user_settings(user_id, settings_dict)
        return {"success": True, "message": "Settings saved"}
    except Exception as e:
        logger.error(f"Error saving settings for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CONNECTION STATUS ENDPOINT
# =============================================================================
@router.get("/connection-status/{user_id}")
async def get_connection_status(user_id: str):
    """
    Get connection status for LinkedIn and GitHub.
    
    Returns which services are connected for this user.
    """
    status = {
        "linkedin_connected": False,
        "linkedin_urn": None,
        "github_connected": False,
        "github_username": None,
        "github_oauth_connected": False,
        "token_expires_at": None
    }
    
    # Get user settings
    if get_user_settings:
        try:
            settings = await get_user_settings(user_id)
            if settings:
                status["github_username"] = settings.get("github_username", "")
                status["github_connected"] = bool(settings.get("github_username"))
        except Exception as e:
            logger.debug(f"Error getting settings: {e}")
    
    # Check LinkedIn token
    if get_token_by_user_id:
        try:
            token = await get_token_by_user_id(user_id)
            if token:
                status["linkedin_connected"] = True
                status["linkedin_urn"] = token.get("linkedin_user_urn", "")
                status["token_expires_at"] = token.get("expires_at")
        except Exception as e:
            logger.debug(f"Error getting LinkedIn token: {e}")
    
    # Check GitHub OAuth
    if get_github_token:
        try:
            github_token = await get_github_token(user_id)
            if github_token:
                status["github_oauth_connected"] = True
                # Use OAuth username if no username in settings
                if not status["github_username"] and github_token.get("github_username"):
                    status["github_username"] = github_token.get("github_username")
                    status["github_connected"] = True
        except Exception as e:
            logger.debug(f"Error getting GitHub token: {e}")
    
    return status
