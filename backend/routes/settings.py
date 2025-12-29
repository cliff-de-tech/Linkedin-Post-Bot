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
# USAGE ENDPOINT (for usage bar: X/10 posts)
# =============================================================================
@router.get("/usage/{user_id}")
async def get_usage(user_id: str, timezone: str = "UTC"):
    """
    Get usage stats for the daily limit bar.
    
    Returns posts used today out of daily limit (10 for free, 50 for pro).
    """
    import time
    from datetime import datetime
    
    try:
        from services.db import get_database
        db = get_database()
        
        # Get subscription tier
        tier = "free"
        if get_user_settings:
            settings = await get_user_settings(user_id)
            if settings:
                tier = settings.get('subscription_tier', 'free')
        
        # Set limits based on tier
        posts_limit = 10 if tier == "free" else 50
        scheduled_limit = 3 if tier == "free" else 20
        
        # Count posts today (using UTC midnight as reset)
        now = datetime.utcnow()
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
        midnight_ts = int(midnight.timestamp())
        
        posts_today_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM posts WHERE user_id = $1 AND created_at > $2",
            [user_id, midnight_ts]
        )
        posts_today = posts_today_result['count'] if posts_today_result else 0
        
        # Count scheduled posts
        scheduled_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM scheduled_posts WHERE user_id = $1 AND status = 'pending'",
            [user_id]
        )
        scheduled_count = scheduled_result['count'] if scheduled_result else 0
        
        # Calculate reset time (next midnight UTC)
        tomorrow_midnight = midnight.replace(day=now.day + 1) if now.day < 28 else midnight
        resets_in = int((tomorrow_midnight - now).total_seconds())
        
        return {
            "tier": tier,
            "posts_today": posts_today,
            "posts_limit": posts_limit,
            "posts_remaining": max(0, posts_limit - posts_today),
            "scheduled_count": scheduled_count,
            "scheduled_limit": scheduled_limit,
            "scheduled_remaining": max(0, scheduled_limit - scheduled_count),
            "resets_in_seconds": max(0, resets_in),
            "resets_at": tomorrow_midnight.isoformat() + "Z"
        }
    except Exception as e:
        logger.error(f"Error getting usage for {user_id}: {e}")
        # Return defaults to prevent UI breaking
        return {
            "tier": "free",
            "posts_today": 0,
            "posts_limit": 10,
            "posts_remaining": 10,
            "scheduled_count": 0,
            "scheduled_limit": 3,
            "scheduled_remaining": 3,
            "resets_in_seconds": 86400,
            "resets_at": None
        }


# =============================================================================
# STATS ENDPOINT
# =============================================================================
@router.get("/stats/{user_id}")
async def get_stats(user_id: str):
    """
    Get dashboard stats for a user.
    
    Returns post counts, credits, and growth metrics.
    """
    try:
        # Get post counts from database
        from services.db import get_database
        db = get_database()
        
        # Count posts for this user
        posts_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM posts WHERE user_id = $1",
            [user_id]
        )
        posts_count = posts_result['count'] if posts_result else 0
        
        # Count posts this month
        import time
        now = int(time.time())
        month_ago = now - (30 * 24 * 60 * 60)
        week_ago = now - (7 * 24 * 60 * 60)
        
        monthly_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM posts WHERE user_id = $1 AND created_at > $2",
            [user_id, month_ago]
        )
        posts_this_month = monthly_result['count'] if monthly_result else 0
        
        weekly_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM posts WHERE user_id = $1 AND created_at > $2",
            [user_id, week_ago]
        )
        posts_this_week = weekly_result['count'] if weekly_result else 0
        
        # Get usage/credits from user settings
        credits_remaining = 10  # Default for free tier
        if get_user_settings:
            settings = await get_user_settings(user_id)
            if settings and settings.get('subscription_tier') == 'pro':
                credits_remaining = 50
        
        return {
            "posts_generated": posts_count,
            "posts_published": posts_count,
            "posts_this_month": posts_this_month,
            "posts_this_week": posts_this_week,
            "posts_last_week": 0,  # TODO: calculate if needed
            "growth_percentage": 0,  # TODO: calculate week-over-week
            "credits_remaining": credits_remaining,
            "draft_posts": 0
        }
    except Exception as e:
        logger.error(f"Error getting stats for {user_id}: {e}")
        # Return default stats instead of error to prevent UI breaking
        return {
            "posts_generated": 0,
            "posts_published": 0,
            "posts_this_month": 0,
            "posts_this_week": 0,
            "posts_last_week": 0,
            "growth_percentage": 0,
            "credits_remaining": 10,
            "draft_posts": 0
        }


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
    
    logger.info(f"Checking connection status for user: {user_id}")
    
    # Check LinkedIn token from accounts table
    if get_token_by_user_id:
        try:
            token = await get_token_by_user_id(user_id)
            logger.info(f"Token query result: {token is not None}")
            if token:
                # LinkedIn is connected if we have an access_token (not just URN)
                has_access_token = bool(token.get("access_token"))
                logger.info(f"Has access_token: {has_access_token}")
                status["linkedin_connected"] = has_access_token
                status["linkedin_urn"] = token.get("linkedin_user_urn") or ""
                status["token_expires_at"] = token.get("expires_at")
                
                # Get GitHub info from accounts table too
                if token.get("github_username"):
                    status["github_username"] = token.get("github_username")
                    status["github_connected"] = True
                if token.get("github_access_token"):
                    status["github_oauth_connected"] = True
        except Exception as e:
            logger.error(f"Error getting token: {e}", exc_info=True)
    else:
        logger.warning("get_token_by_user_id is None - import failed")
    
    # Fallback: Direct database query if token_store didn't work
    if not status["linkedin_connected"]:
        try:
            from services.db import get_database
            db = get_database()
            row = await db.fetch_one(
                "SELECT access_token, linkedin_user_urn, github_username, github_access_token, expires_at FROM accounts WHERE user_id = $1",
                [user_id]
            )
            if row:
                row_dict = dict(row)
                logger.info(f"Direct DB query found row with access_token: {bool(row_dict.get('access_token'))}")
                if row_dict.get("access_token"):
                    status["linkedin_connected"] = True
                    status["linkedin_urn"] = row_dict.get("linkedin_user_urn") or ""
                    status["token_expires_at"] = row_dict.get("expires_at")
                if row_dict.get("github_username"):
                    status["github_username"] = row_dict.get("github_username")
                    status["github_connected"] = True
                if row_dict.get("github_access_token"):
                    status["github_oauth_connected"] = True
        except Exception as e:
            logger.error(f"Direct DB fallback error: {e}")
    
    # Also check user_settings for github_username (may be set there instead)
    if get_user_settings and not status["github_username"]:
        try:
            settings = await get_user_settings(user_id)
            if settings and settings.get("github_username"):
                status["github_username"] = settings.get("github_username")
                status["github_connected"] = True
        except Exception as e:
            logger.debug(f"Error getting settings: {e}")
    
    # Check GitHub OAuth token separately 
    if get_github_token and not status["github_oauth_connected"]:
        try:
            github_token = await get_github_token(user_id)
            if github_token:
                status["github_oauth_connected"] = True
                # Use OAuth username if no username yet
                if not status["github_username"] and github_token.get("github_username"):
                    status["github_username"] = github_token.get("github_username")
                    status["github_connected"] = True
        except Exception as e:
            logger.debug(f"Error getting GitHub token: {e}")
    
    logger.info(f"Final status: linkedin={status['linkedin_connected']}, github={status['github_connected']}")
    return status


# =============================================================================
# POSTS ENDPOINTS (for manual mode dashboard)
# =============================================================================
class PostCreateRequest(BaseModel):
    """Request model for creating a post."""
    user_id: str
    post_content: str
    post_type: Optional[str] = "push"
    context: Optional[Dict[str, Any]] = None
    status: Optional[str] = "draft"


@router.post("/posts")
async def create_post(req: PostCreateRequest):
    """
    Create/save a new post record.
    """
    import time
    
    try:
        from services.db import get_database
        db = get_database()
        
        now = int(time.time())
        
        await db.execute("""
            INSERT INTO posts (user_id, post_content, post_type, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
        """, [req.user_id, req.post_content, req.post_type, req.status, now])
        
        return {"success": True, "message": "Post saved"}
    except Exception as e:
        logger.error(f"Error saving post: {e}")
        return {"success": False, "error": str(e)}


@router.get("/scheduled-posts/{user_id}")
async def get_scheduled_posts(user_id: str):
    """
    Get scheduled posts for a user.
    """
    try:
        from services.db import get_database
        db = get_database()
        
        rows = await db.fetch_all(
            """SELECT id, post_content, image_url, scheduled_time, status, 
                      error_message, created_at, published_at 
               FROM scheduled_posts 
               WHERE user_id = $1 
               ORDER BY scheduled_time DESC 
               LIMIT 50""",
            [user_id]
        )
        
        posts = []
        for row in rows:
            posts.append({
                "id": row['id'],
                "post_content": row['post_content'],
                "image_url": row.get('image_url'),
                "scheduled_time": row['scheduled_time'],
                "status": row['status'],
                "error_message": row.get('error_message'),
                "created_at": row['created_at'],
                "published_at": row.get('published_at')
            })
        
        return {"posts": posts}
    except Exception as e:
        logger.error(f"Error getting scheduled posts: {e}")
        return {"posts": []}


class ImagePreviewRequest(BaseModel):
    """Request model for image preview."""
    query: str
    user_id: Optional[str] = None


@router.post("/image/preview")
async def get_image_preview(req: ImagePreviewRequest):
    """
    Get image suggestions for a post (uses Unsplash or similar).
    """
    import os
    import requests
    
    try:
        # Try Unsplash API
        unsplash_key = os.getenv("UNSPLASH_ACCESS_KEY")
        
        if unsplash_key:
            response = requests.get(
                "https://api.unsplash.com/search/photos",
                params={"query": req.query, "per_page": 6},
                headers={"Authorization": f"Client-ID {unsplash_key}"}
            )
            
            if response.ok:
                data = response.json()
                images = []
                for photo in data.get("results", []):
                    images.append({
                        "id": photo["id"],
                        "url": photo["urls"]["regular"],
                        "thumb": photo["urls"]["thumb"],
                        "description": photo.get("description") or photo.get("alt_description", ""),
                        "photographer": photo["user"]["name"],
                        "download_url": photo["urls"]["full"]
                    })
                return {"images": images}
        
        # Fallback: return empty (no API key)
        return {"images": [], "message": "No image API configured. Set UNSPLASH_ACCESS_KEY in .env"}
    except Exception as e:
        logger.error(f"Error fetching images: {e}")
        return {"images": [], "error": str(e)}
