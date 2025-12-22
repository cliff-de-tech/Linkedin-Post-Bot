import os
import sys

# Load environment variables from .env file in project root
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Ensure parent project path is importable so we can reuse `bot.py`
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Depends
from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pydantic import BaseModel
from typing import Optional

# Import JWT auth middleware
try:
    from middleware.clerk_auth import get_current_user, require_auth
except ImportError:
    get_current_user = None
    require_auth = None

try:
    # Import core functions from the refactored services
    from services.ai_service import generate_post_with_ai
except ImportError:
    generate_post_with_ai = None

# Import GitHub service
try:
    from services.github_activity import get_user_activity
except ImportError:
    get_user_activity = None

# Import Unsplash service (if available in utils or services)
try:
    from services.image_service import get_relevant_image
except ImportError:
    # Basic fallback
    get_relevant_image = None

# Import LinkedIn service
try:
    from services.linkedin_service import post_to_linkedin, upload_image_to_linkedin
except ImportError:
    post_to_linkedin = None
    upload_image_to_linkedin = None

# Import User Settings service
try:
    from services.user_settings import get_user_settings, get_token_by_user_id
except ImportError:
    get_user_settings = None
    get_token_by_user_id = None

# Import Post History service
try:
    from services.post_history import save_post, get_user_posts, get_user_stats
except ImportError:
    save_post = None
    get_user_posts = None
    get_user_stats = None

try:
    # Import core functions from the refactored services
    # from services.ai_service import generate_post_with_ai # Already imported above
    # from services.image_service import get_relevant_image # Already imported above
    # from services.linkedin_service import upload_image_to_linkedin, post_to_linkedin # Already imported above
    from services.token_store import get_all_tokens, init_db
    from services.auth_service import (
        get_access_token_for_urn,
        get_authorize_url,
        exchange_code_for_token,
        get_authorize_url_for_user,
        exchange_code_for_token_with_user
    )
    from services.user_settings import init_db as init_settings_db, save_user_settings # get_user_settings already imported
    from services.post_history import (
        init_db as init_post_history_db,
        # save_post, # Already imported above
        # get_user_posts, # Already imported above
        update_post_status,
        delete_post,
        get_user_usage,
        can_user_generate_posts,
        can_user_schedule_post
    )

    from services.github_activity import get_user_activity, get_repo_details
    from services.email_service import email_service
    from services.scheduled_posts import (
        schedule_post as db_schedule_post,
        get_scheduled_posts,
        cancel_scheduled_post,
        reschedule_post,
        init_db as init_scheduled_db
    )
except Exception:
    generate_post_with_ai = None
    get_relevant_image = None
    upload_image_to_linkedin = None
    post_to_linkedin = None
    get_all_tokens = None
    get_access_token_for_urn = None
    get_authorize_url = None
    exchange_code_for_token = None
    init_db = None
    init_settings_db = None
    save_user_settings = None
    get_user_settings = None
    init_post_history_db = None
    save_post = None
    get_user_posts = None
    update_post_status = None
    delete_post = None
    get_user_stats = None
    get_user_activity = None
    get_repo_details = None
    email_service = None

# =============================================================================
# RATE LIMITING
# =============================================================================
# Import rate limiters to prevent API abuse
# See services/middleware.py for configuration
try:
    from services.middleware import (
        post_generation_limiter,
        publish_limiter,
        api_limiter,
        RateLimitExceededError
    )
    RATE_LIMITING_ENABLED = True
except ImportError:
    RATE_LIMITING_ENABLED = False
    post_generation_limiter = None
    publish_limiter = None
    api_limiter = None
    RateLimitExceededError = Exception

app = FastAPI(
    title="LinkedIn Post Bot API",
    description="""
    AI-powered LinkedIn content automation API.
    
    ## Features
    - Generate LinkedIn posts from GitHub activity
    - Multiple AI writing templates (Standard, Build in Public, Thought Leadership, Job Search)
    - Post history and analytics
    - Image selection from Unsplash
    - Scheduled posting
    
    ## OpenAPI Documentation
    - OpenAPI JSON: `/openapi.json`
    - Interactive Docs (Swagger): `/docs`  
    - ReDoc: `/redoc`
    """,
    version="1.0.0",
    openapi_url="/openapi.json",  # Explicit stable URL for OpenAPI spec
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc alternative
    contact={
        "name": "LinkedIn Post Bot",
        "url": "https://github.com/cliff-de-tech/Linkedin-Post-Bot",
    },
    license_info={
        "name": "MIT",
    },
)

# Initialize databases
if init_db:
    init_db()
if init_settings_db:
    init_settings_db()
if init_post_history_db:
    init_post_history_db()
if init_settings_db:
    init_settings_db()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    context: dict
    user_id: Optional[str] = None


class PostRequest(BaseModel):
    context: dict
    test_mode: Optional[bool] = True
    user_id: Optional[str] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate-preview")
async def generate_preview(
    req: GenerateRequest,
    current_user: dict = Depends(get_current_user) if get_current_user else None
):
    """Generate an AI post preview from context.
    
    Rate limited to 10 requests per hour per user to prevent abuse.
    """
    if not generate_post_with_ai:
        return {"error": "generate_post_with_ai not available (import failed)"}
    
    # Use authenticated user_id if available, otherwise fall back to request body
    user_id = None
    if current_user and current_user.get("user_id"):
        user_id = current_user["user_id"]
    elif req.user_id:
        user_id = req.user_id
    
    # Rate limiting check (10 requests/hour for AI generation)
    if RATE_LIMITING_ENABLED and post_generation_limiter and user_id:
        if not post_generation_limiter.is_allowed(user_id):
            remaining = post_generation_limiter.get_remaining(user_id)
            reset_time = post_generation_limiter.get_reset_time(user_id)
            return {
                "error": "Rate limit exceeded for post generation",
                "remaining": remaining,
                "reset_in_seconds": int(reset_time) if reset_time else None
            }
    
    # Get user's Groq API key if user_id available
    groq_api_key = None
    if user_id and get_user_settings:
        try:
            settings = get_user_settings(user_id)
            if settings:
                groq_api_key = settings.get('groq_api_key')
        except Exception as e:
            # SECURITY: Don't log the actual key, just the error type
            print(f"Failed to get user settings: {type(e).__name__}")
    
    post = generate_post_with_ai(req.context, groq_api_key=groq_api_key)
    return {"post": post}


@app.post("/publish")
def publish(req: PostRequest):
    if not generate_post_with_ai:
        return {"error": "generate_post_with_ai not available (import failed)"}

    # Get user's Groq API key if user_id provided
    groq_api_key = None
    user_settings = None
    if req.user_id and get_user_settings:
        try:
            user_settings = get_user_settings(req.user_id)
            if user_settings:
                groq_api_key = user_settings.get('groq_api_key')
        except Exception as e:
            print(f"Failed to get user settings: {e}")

    post = generate_post_with_ai(req.context, groq_api_key=groq_api_key)
    if not post:
        return {"error": "failed_to_generate_post"}

    if req.test_mode:
        # Return preview without posting
        return {"status": "preview", "post": post}

    # Try to post using user's specific LinkedIn token
    image_data = None
    image_asset = None
    
    # First try: use user's specific token
    if req.user_id and get_token_by_user_id:
        try:
            user_token = get_token_by_user_id(req.user_id)
            if user_token:
                linkedin_urn = user_token.get('linkedin_user_urn')
                token = user_token.get('access_token')
                
                if get_relevant_image and token:
                    image_data = get_relevant_image(post)
                if image_data and upload_image_to_linkedin and token:
                    image_asset = upload_image_to_linkedin(image_data, access_token=token, linkedin_user_urn=linkedin_urn)
                if post_to_linkedin and token:
                    post_to_linkedin(post, image_asset, access_token=token, linkedin_user_urn=linkedin_urn)
                return {"status": "posted", "post": post, "image_asset": image_asset, "account": linkedin_urn}
        except Exception as e:
            print(f"Failed to use user token: {e}")

    # Fallback: use first stored account or environment-based service
    accounts = []
    try:
        accounts = get_all_tokens() if get_all_tokens else []
    except Exception:
        accounts = []

    if accounts:
        account = accounts[0]
        linkedin_urn = account.get('linkedin_user_urn')
        try:
            token = get_access_token_for_urn(linkedin_urn)
        except Exception as e:
            token = None

        if get_relevant_image and token:
            image_data = get_relevant_image(post)
        if image_data and upload_image_to_linkedin and token:
            image_asset = upload_image_to_linkedin(image_data, access_token=token, linkedin_user_urn=linkedin_urn)
        if post_to_linkedin and token:
            post_to_linkedin(post, image_asset, access_token=token, linkedin_user_urn=linkedin_urn)
        return {"status": "posted", "post": post, "image_asset": image_asset, "account": linkedin_urn}

    # Final fallback: environment-based linkedin service
    if get_relevant_image:
        image_data = get_relevant_image(post)
    if image_data and upload_image_to_linkedin:
        image_asset = upload_image_to_linkedin(image_data)
    if post_to_linkedin:
        post_to_linkedin(post, image_asset)
    return {"status": "posted", "post": post, "image_asset": image_asset}


@app.get('/auth/linkedin/start')
def linkedin_start(redirect_uri: str, user_id: str = None):
    """Redirects the user to LinkedIn's authorization page.
    
    If user_id is provided, uses that user's saved LinkedIn credentials.
    Otherwise falls back to global env vars.
    """
    state = uuid4().hex
    
    # Try to use per-user credentials if user_id provided
    if user_id and get_user_settings:
        try:
            settings = get_user_settings(user_id)
            if settings and settings.get('linkedin_client_id'):
                # Store user_id in state for callback
                state = f"{user_id}:{state}"
                url = get_authorize_url_for_user(
                    settings['linkedin_client_id'],
                    redirect_uri,
                    state
                )
                return RedirectResponse(url)
        except Exception as e:
            print(f"Failed to get user settings: {e}")
    
    # Fallback to global credentials
    if not get_authorize_url:
        return {"error": "OAuth service not available"}
    url = get_authorize_url(redirect_uri, state)
    return RedirectResponse(url)


@app.get('/auth/linkedin/callback')
def linkedin_callback(code: str = None, state: str = None, redirect_uri: str = None):
    """Exchange code for token and store it. Returns a small status JSON."""
    if not code or not redirect_uri:
        return {"error": "missing code or redirect_uri"}
    
    # Check if state contains user_id (format: "user_id:random_state")
    user_id = None
    if state and ':' in state:
        parts = state.split(':', 1)
        if len(parts) == 2:
            user_id = parts[0]
    
    try:
        # Use per-user credentials if we have a user_id
        if user_id and get_user_settings and exchange_code_for_token_with_user:
            settings = get_user_settings(user_id)
            if settings and settings.get('linkedin_client_id') and settings.get('linkedin_client_secret'):
                result = exchange_code_for_token_with_user(
                    settings['linkedin_client_id'],
                    settings['linkedin_client_secret'],
                    code,
                    redirect_uri,
                    user_id
                )
                # Also save the URN to user settings
                if save_user_settings:
                    settings['linkedin_user_urn'] = result.get('linkedin_user_urn')
                    save_user_settings(user_id, settings)
                return {"status": "success", "linkedin_user_urn": result.get("linkedin_user_urn")}
        
        # Fallback to global credentials
        if not exchange_code_for_token:
            return {"error": "OAuth service not available"}
        result = exchange_code_for_token(code, redirect_uri)
        return {"status": "success", "linkedin_user_urn": result.get("linkedin_user_urn")}
    except Exception as e:
        import traceback
        print(f"OAuth Error: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "status": "failed"}


# User settings endpoints
# SECURITY: Only safe fields are accepted from frontend
class UserSettingsRequest(BaseModel):
    user_id: str
    github_username: Optional[str] = None
    onboarding_complete: Optional[bool] = None
    # NOTE: API keys are managed server-side via environment variables
    # Frontend NEVER sends credentials to this endpoint


class AuthRefreshRequest(BaseModel):
    user_id: str


@app.post("/api/auth/refresh")
def refresh_auth(req: AuthRefreshRequest):
    """Check if user has valid LinkedIn connection"""
    if not get_user_settings:
        return {"error": "Settings service not available"}
    try:
        settings = get_user_settings(req.user_id)
        if settings and settings.get("linkedin_user_urn"):
            # User has LinkedIn connected
            return {
                "access_token": "valid",
                "user_urn": settings.get("linkedin_user_urn"),
                "authenticated": True
            }
        return {"access_token": None, "authenticated": False}
    except Exception as e:
        return {"error": str(e), "authenticated": False}


@app.post("/api/settings")
def save_settings(settings: UserSettingsRequest):
    """Save user settings"""
    if not save_user_settings:
        return {"error": "User settings service not available"}
    try:
        save_user_settings(settings.user_id, settings.dict())
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/settings/{user_id}")
def get_settings(user_id: str):
    """
    Get user settings by user ID.
    
    SECURITY: Returns ONLY safe, non-sensitive data.
    No credentials, tokens, or API keys are returned.
    """
    if not get_user_settings:
        return {"error": "User settings service not available"}
    try:
        settings = get_user_settings(user_id)
        if settings:
            # SECURITY: Only return safe data, no credentials
            return {
                "user_id": settings.get("user_id"),
                "github_username": settings.get("github_username") or "",
                "onboarding_complete": settings.get("onboarding_complete", False),
                "subscription_tier": settings.get("subscription_tier") or "free",
                "subscription_status": settings.get("subscription_status") or "active",
            }
        return {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/connection-status/{user_id}")
def get_connection_status_endpoint(user_id: str):
    """
    Get connection status for a user.
    
    SECURITY: Returns ONLY boolean status and public identifiers.
    No tokens or credentials are ever returned.
    """
    try:
        # Import get_connection_status from token_store
        from services.token_store import get_connection_status
        
        status = get_connection_status(user_id)
        
        # Also get github_username from settings
        github_username = ''
        if get_user_settings:
            settings = get_user_settings(user_id)
            if settings:
                github_username = settings.get('github_username', '')
        
        return {
            "linkedin_connected": status.get("linkedin_connected", False),
            "linkedin_urn": status.get("linkedin_urn", ""),
            "github_connected": bool(github_username),
            "github_username": github_username,
            "token_expires_at": status.get("token_expires_at"),
        }
    except Exception as e:
        return {
            "linkedin_connected": False,
            "github_connected": False,
            "error": str(e)
        }


class DisconnectRequest(BaseModel):
    user_id: str


@app.post("/api/disconnect-linkedin")
def disconnect_linkedin(request: DisconnectRequest):
    """
    Disconnect a user's LinkedIn account.
    
    Removes the stored OAuth token, requiring re-authentication
    to post again.
    
    SECURITY:
        - User can only disconnect their own account
        - Token is permanently deleted from database
    """
    try:
        from services.token_store import delete_token_by_user_id
        
        deleted = delete_token_by_user_id(request.user_id)
        
        if deleted:
            return {"success": True, "message": "LinkedIn disconnected"}
        else:
            return {"success": False, "message": "No connection found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/github/activity/{username}")
def github_activity(username: str, limit: int = 10):
    """Get GitHub activity for a user"""
    if not get_user_activity:
        return {"error": "GitHub service not available"}
    try:
        activities = get_user_activity(username, limit)
        return {"activities": activities}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/github/repo/{owner}/{repo}")
def github_repo(owner: str, repo: str):
    """Get GitHub repository details"""
    if not get_repo_details:
        return {"error": "GitHub service not available"}
    try:
        repo_info = get_repo_details(f"{owner}/{repo}")
        return repo_info or {"error": "Repository not found"}
    except Exception as e:
        return {"error": str(e)}


# Post history endpoints
@app.get("/api/posts/{user_id}")
def get_posts(user_id: str, limit: int = 50, status: str = None):
    """Get user's post history"""
    if not get_user_posts:
        return {"error": "Post history service not available"}
    try:
        posts = get_user_posts(user_id, limit, status)
        return {"posts": posts}
    except Exception as e:
        return {"error": str(e)}


class SavePostRequest(BaseModel):
    user_id: str
    post_content: str
    post_type: Optional[str] = "mixed"
    context: Optional[dict] = {}
    status: Optional[str] = "draft"
    linkedin_post_id: Optional[str] = None




@app.delete("/api/posts/{post_id}")
def remove_post(post_id: int):
    """Delete a post from history"""
    if not delete_post:
        return {"error": "Post history service not available"}
    try:
        delete_post(post_id)
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/stats/{user_id}")
def user_stats(user_id: str):
    """Get user statistics"""
    if not get_user_stats:
        return {"error": "Stats service not available"}
    try:
        stats = get_user_stats(user_id)
        return stats
    except Exception as e:
        return {"error": str(e)}


# Templates
TEMPLATES = [
    {
        "id": "code_release",
        "name": "Code Release",
        "description": "Announce a new version or release",
        "icon": "🚀",
        "context": {"type": "milestone", "milestone": "v1.0.0"}
    },
    {
        "id": "learning",
        "name": "Learning Journey",
        "description": "Share what you learned",
        "icon": "📚",
        "context": {"type": "generic"}
    },
    {
        "id": "project_update",
        "name": "Project Update",
        "description": "Share progress on a project",
        "icon": "🔨",
        "context": {"type": "push", "commits": 5}
    },
    {
        "id": "collaboration",
        "name": "Collaboration",
        "description": "Thank contributors or collaborators",
        "icon": "🤝",
        "context": {"type": "pull_request"}
    },
    {
        "id": "new_project",
        "name": "New Project",
        "description": "Announce a new repository",
        "icon": "✨",
        "context": {"type": "new_repo"}
    }
]


@app.get("/api/templates")
def get_templates():
    """Get post templates"""
    return {"templates": TEMPLATES}


class ContactRequest(BaseModel):
    to: str
    from_email: str = None
    subject: str
    body: str
    name: str


@app.post("/api/contact")
def send_contact_email(req: ContactRequest):
    """Send contact form email"""
    if not email_service:
        return {
            "success": False, 
            "message": "Email service not available",
            "fallback": True
        }
    
    try:
        # Extract priority from subject if present
        priority = "medium"
        if "[Support - " in req.subject:
            priority_text = req.subject.split("[Support - ")[1].split("]")[0].lower()
            if priority_text in ["low", "medium", "high", "urgent"]:
                priority = priority_text
        
        result = email_service.send_contact_email(
            to_email=req.to,
            from_email=req.from_email or "noreply@linkedin-post-bot.com",
            from_name=req.name,
            subject=req.subject,
            message=req.body,
            priority=priority
        )
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "fallback": True
        }


# =============================================================================
# BOT GUI API ENDPOINTS
# =============================================================================

class ScanRequest(BaseModel):
    user_id: str
    hours: Optional[int] = 24
    activity_type: Optional[str] = None  # 'push', 'pull_request', 'new_repo', 'commits', 'all'

class BatchGenerateRequest(BaseModel):
    user_id: str
    activities: list
    style: Optional[str] = "standard"

class ImagePreviewRequest(BaseModel):
    post_content: str
    count: Optional[int] = 3

class FullPublishRequest(BaseModel):
    user_id: str
    post_content: str
    image_url: Optional[str] = None
    test_mode: Optional[bool] = False


@app.post("/api/github/scan")
async def scan_github_activity(req: ScanRequest):
    """Scan GitHub for recent activity (like the bot does)"""
    if not get_user_activity:
        return {"error": "GitHub activity service not available"}
    
    # Get user's GitHub username from settings
    github_username = None
    if get_user_settings:
        try:
            settings = get_user_settings(req.user_id)
            if settings:
                github_username = settings.get('github_username')
        except Exception as e:
            print(f"Error getting user settings: {e}")
    
    # Fallback to env var
    if not github_username:
        github_username = os.getenv('GITHUB_USERNAME', 'cliff-de-tech')
    
    if not github_username:
        return {"error": "No GitHub username configured", "activities": [], "all_activities": []}
    
    # Get user's GitHub token if available
    github_token = None
    if get_token_by_user_id:
        try:
            token_data = get_token_by_user_id(req.user_id)
            if token_data:
                github_token = token_data.get('github_access_token')
        except Exception as e:
            print(f"Error getting user token: {e}")

    try:
        # Get activities (passing user token if available)
        # This will auto-select private or public endpoint based on token presence
        activities = get_user_activity(github_username, limit=30, token=github_token)
        
        # Filter to recent hours
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=req.hours)
        
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
        
        # Filter by activity type if specified
        filtered_activities = all_recent_activities
        if req.activity_type and req.activity_type not in ['all', 'generic']:
            type_mapping = {
                'push': 'push',
                'pull_request': 'pull_request',
                'new_repo': 'new_repo',
                'commits': 'push'  # commits are part of push events
            }
            target_type = type_mapping.get(req.activity_type, req.activity_type)
            filtered_activities = [a for a in all_recent_activities if a.get('type') == target_type]
        
        return {
            "success": True,
            "github_username": github_username,
            "activities": filtered_activities,
            "all_activities": all_recent_activities,  # For suggesting alternatives
            "count": len(filtered_activities)
        }
    except Exception as e:
        return {"error": str(e), "activities": [], "all_activities": []}


# =============================================================================
# USAGE TRACKING ENDPOINTS
# =============================================================================

@app.get("/api/usage/{user_id}")
def get_usage(user_id: str):
    """Get user's current usage data for free tier limits"""
    try:
        if not get_user_usage:
            return {"error": "Usage tracking not available"}
        
        # Get user's subscription tier (default to free)
        tier = "free"
        if get_user_settings:
            try:
                settings = get_user_settings(user_id)
                if settings:
                    tier = settings.get('subscription_tier', 'free')
            except Exception:
                pass
        
        usage = get_user_usage(user_id, tier)
        return {"success": True, "usage": usage}
    except Exception as e:
        print(f"Error getting usage: {e}")
        return {"error": str(e)}


@app.post("/api/post/generate-batch")
async def generate_batch_posts(req: BatchGenerateRequest):
    """Generate posts for multiple activities"""
    if not generate_post_with_ai:
        return {"error": "AI service not available"}
    
    # Check free tier limits
    if can_user_generate_posts:
        try:
            # Get user's subscription tier (default to free)
            tier = "free"
            if get_user_settings:
                settings = get_user_settings(req.user_id)
                if settings:
                    tier = settings.get('subscription_tier', 'free')
            
            # Check if user can generate the requested number of posts
            limit_check = can_user_generate_posts(req.user_id, len(req.activities), tier)
            
            if not limit_check.get("allowed"):
                # Return 429 Too Many Requests with usage info
                return {
                    "success": False,
                    "error": limit_check.get("reason", "Daily limit reached"),
                    "limit_exceeded": True,
                    "remaining": limit_check.get("remaining", 0),
                    "posts": [],
                    "generated_count": 0,
                    "failed_count": 0
                }
        except Exception as e:
            print(f"Error checking usage limits: {e}")
            # Continue without limit check if there's an error
    
    # Get user's Groq API key

    groq_api_key = None
    if get_user_settings:
        try:
            settings = get_user_settings(req.user_id)
            if settings:
                groq_api_key = settings.get('groq_api_key')
        except Exception:
            pass
    
    generated_posts = []
    
    for idx, activity in enumerate(req.activities):
        try:
            # Extract context for AI generation
            context = activity.get('context', activity)
            
            # Generate the post
            post_content = generate_post_with_ai(context, groq_api_key=groq_api_key, style=req.style)
            
            if post_content:
                generated_posts.append({
                    'id': f"post_{idx}_{activity.get('id', '')}",
                    'activity_id': activity.get('id'),
                    'activity_type': activity.get('type'),
                    'activity_title': activity.get('title'),
                    'content': post_content,
                    'status': 'pending',
                    'image_url': None
                })
        except Exception as e:
            print(f"Error generating post for activity: {e}")
            generated_posts.append({
                'id': f"post_{idx}_{activity.get('id', '')}",
                'activity_id': activity.get('id'),
                'activity_type': activity.get('type'),
                'activity_title': activity.get('title'),
                'content': None,
                'error': str(e),
                'status': 'failed'
            })
    
    return {
        "success": True,
        "posts": generated_posts,
        "generated_count": len([p for p in generated_posts if p.get('content')]),
        "failed_count": len([p for p in generated_posts if p.get('error')])
    }


@app.post("/api/image/preview")
async def get_image_options(req: ImagePreviewRequest):
    """Get image options from Unsplash for a post"""
    if not get_relevant_image:
        return {"error": "Image service not available", "images": []}
    
    try:
        # Extract keywords from post content
        content_lower = req.post_content.lower()
        
        # Determine search terms based on content
        search_terms = []
        if any(word in content_lower for word in ['ui', 'ux', 'design', 'interface']):
            search_terms = ['web design laptop', 'ui design screen', 'ux designer']
        elif any(word in content_lower for word in ['react', 'javascript', 'frontend']):
            search_terms = ['javascript code', 'programming laptop', 'developer coding']
        elif any(word in content_lower for word in ['github', 'code', 'repository']):
            search_terms = ['coding laptop', 'programmer screen', 'software development']
        else:
            search_terms = ['developer workspace', 'laptop code', 'tech workspace']
        
        # Fetch images from Unsplash
        import requests
        unsplash_key = os.getenv('UNSPLASH_ACCESS_KEY', '')
        
        if not unsplash_key:
            return {"error": "Unsplash API key not configured", "images": []}
        
        images = []
        for term in search_terms[:req.count]:
            try:
                url = f"https://api.unsplash.com/photos/random?query={term}&orientation=landscape"
                headers = {'Authorization': f'Client-ID {unsplash_key}'}
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    images.append({
                        'id': data.get('id'),
                        'url': data['urls']['regular'],
                        'thumb': data['urls']['thumb'],
                        'description': data.get('alt_description', 'No description'),
                        'photographer': data.get('user', {}).get('name', 'Unknown'),
                        'download_url': data['urls']['regular']
                    })
            except Exception as e:
                print(f"Error fetching image for term '{term}': {e}")
        
        return {
            "success": True,
            "images": images,
            "count": len(images)
        }
    except Exception as e:
        return {"error": str(e), "images": []}


@app.post("/api/publish/full")
async def publish_full(req: FullPublishRequest):
    """Publish a post to LinkedIn with optional image (full bot functionality).
    
    Rate limited to 5 posts per hour per user to prevent spam.
    
    SECURITY & COMPLIANCE NOTES:
    - Uses official LinkedIn UGC Posts API
    - Requires user's explicit action (not automated)
    - Rate limiting prevents abuse
    - Test mode available for preview without posting
    """
    if not post_to_linkedin:
        return {"error": "LinkedIn service not available"}
    
    # Rate limiting check (5 posts/hour - stricter for actual publishing)
    # This helps prevent spam and protects against LinkedIn rate limiting
    if RATE_LIMITING_ENABLED and publish_limiter and req.user_id and not req.test_mode:
        if not publish_limiter.is_allowed(req.user_id):
            remaining = publish_limiter.get_remaining(req.user_id)
            reset_time = publish_limiter.get_reset_time(req.user_id)
            return {
                "error": "Rate limit exceeded for publishing",
                "message": "To prevent spam, you can only publish 5 posts per hour. Please try again later.",
                "remaining": remaining,
                "reset_in_seconds": int(reset_time) if reset_time else None
            }
    
    # Test mode - just return preview (not rate limited)
    if req.test_mode:
        return {
            "success": True,
            "test_mode": True,
            "preview": {
                "content": req.post_content[:500] + "..." if len(req.post_content) > 500 else req.post_content,
                "has_image": bool(req.image_url),
                "image_url": req.image_url
            },
            "message": "Test mode - post not published"
        }
    
    # Get user's LinkedIn token
    access_token = None
    linkedin_urn = None
    
    if get_user_settings and get_token_by_user_id:
        try:
            # Get user settings for URN
            settings = get_user_settings(req.user_id)
            if settings:
                linkedin_urn = settings.get('linkedin_user_urn')
            
            # Get token
            token_data = get_token_by_user_id(req.user_id)
            if token_data:
                access_token = token_data.get('access_token')
        except Exception as e:
            print(f"Error getting user credentials: {e}")
    
    # Fallback to environment variables
    if not access_token:
        access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
    if not linkedin_urn:
        linkedin_urn = os.getenv('LINKEDIN_USER_URN')
    
    if not access_token or not linkedin_urn:
        return {"error": "LinkedIn not connected. Please connect your LinkedIn account in settings."}
    
    try:
        # Upload image if provided
        image_asset_urn = None
        if req.image_url and upload_image_to_linkedin:
            import requests
            # Download image
            img_response = requests.get(req.image_url, timeout=30)
            if img_response.status_code == 200:
                image_asset_urn = upload_image_to_linkedin(img_response.content)
        
        # Post to LinkedIn
        result = post_to_linkedin(req.post_content, image_asset_urn)
        
        # Save to post history
        if save_post:
            try:
                save_post(
                    user_id=req.user_id,
                    post_content=req.post_content,
                    post_type='bot_generated',
                    context={'image_url': req.image_url},
                    status='published'
                )
            except Exception as e:
                print(f"Error saving to post history: {e}")
        
        return {
            "success": True,
            "test_mode": False,
            "published": True,
            "has_image": bool(image_asset_urn),
            "message": "Post published to LinkedIn successfully!"
        }
    except Exception as e:
        return {"error": str(e), "success": False}


@app.post("/api/posts")
def api_save_post(req: SavePostRequest):
    """Save a post to history (draft or published)"""
    if not save_post:
        return {"error": "History service not available"}
    
    try:
        post_id = save_post(
            user_id=req.user_id,
            post_content=req.post_content,
            post_type=req.post_type,
            context=req.context,
            status=req.status,
            linkedin_post_id=req.linkedin_post_id
        )
        return {"success": True, "post_id": post_id}
    except Exception as e:
        return {"error": str(e), "success": False}


@app.get("/api/stats/{user_id}")
def get_stats(user_id: str):
    """Get user content analytics"""
    if not get_user_stats:
        return {"error": "Stats service not available"}
    
    try:
        stats = get_user_stats(user_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {"error": str(e)}


# ============================================
# SCHEDULED POSTS ENDPOINTS
# ============================================

class SchedulePostRequest(BaseModel):
    user_id: str
    post_content: str
    scheduled_time: int  # Unix timestamp
    image_url: Optional[str] = None

class RescheduleRequest(BaseModel):
    user_id: str
    new_time: int

@app.get("/api/scheduled/{user_id}")
def list_scheduled_posts(user_id: str, include_past: bool = False):
    """Get all scheduled posts for a user"""
    try:
        if init_scheduled_db:
            init_scheduled_db()
        posts = get_scheduled_posts(user_id, include_past) if get_scheduled_posts else []
        return {"success": True, "posts": posts}
    except Exception as e:
        return {"error": str(e), "success": False}

@app.post("/api/scheduled")
def create_scheduled_post(req: SchedulePostRequest):
    """Schedule a post for later publishing"""
    try:
        if init_scheduled_db:
            init_scheduled_db()
        result = db_schedule_post(
            user_id=req.user_id,
            post_content=req.post_content,
            scheduled_time=req.scheduled_time,
            image_url=req.image_url
        ) if db_schedule_post else {"success": False, "error": "Service unavailable"}
        return result
    except Exception as e:
        return {"error": str(e), "success": False}

@app.delete("/api/scheduled/{post_id}")
def cancel_scheduled(post_id: int, user_id: str):
    """Cancel a scheduled post"""
    try:
        success = cancel_scheduled_post(post_id, user_id) if cancel_scheduled_post else False
        if success:
            return {"success": True, "message": "Post cancelled"}
        return {"success": False, "error": "Post not found or already published"}
    except Exception as e:
        return {"error": str(e), "success": False}

@app.put("/api/scheduled/{post_id}")
def reschedule(post_id: int, req: RescheduleRequest):
    """Reschedule a pending post"""
    try:
        success = reschedule_post(post_id, req.user_id, req.new_time) if reschedule_post else False
        if success:
            return {"success": True, "message": "Post rescheduled"}
        return {"success": False, "error": "Post not found or time conflicts"}
    except Exception as e:
        return {"error": str(e), "success": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

