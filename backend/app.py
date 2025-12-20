import os
import sys

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env'))

# Ensure parent project path is importable so we can reuse `bot.py`
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pydantic import BaseModel
from typing import Optional

try:
    # Import core functions from the refactored services
    from services.ai_service import generate_post_with_ai
    from services.image_service import get_relevant_image
    from services.linkedin_service import upload_image_to_linkedin, post_to_linkedin
    from services.token_store import get_all_tokens, init_db
    from services.auth_service import get_access_token_for_urn, get_authorize_url, exchange_code_for_token
    from services.user_settings import init_db as init_settings_db, save_user_settings, get_user_settings
    from services.post_history import (
        init_db as init_post_history_db,
        save_post,
        get_user_posts,
        update_post_status,
        delete_post,
        get_user_stats
    )
    from services.github_activity import get_user_activity, get_repo_details
    from services.email_service import email_service
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

app = FastAPI(title="LinkedIn Post Bot API")

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


class PostRequest(BaseModel):
    context: dict
    test_mode: Optional[bool] = True


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate-preview")
def generate_preview(req: GenerateRequest):
    if not generate_post_with_ai:
        return {"error": "generate_post_with_ai not available (import failed)"}
    post = generate_post_with_ai(req.context)
    return {"post": post}


@app.post("/publish")
def publish(req: PostRequest):
    if not generate_post_with_ai:
        return {"error": "generate_post_with_ai not available (import failed)"}

    post = generate_post_with_ai(req.context)
    if not post:
        return {"error": "failed_to_generate_post"}

    if req.test_mode:
        # Return preview without posting
        return {"status": "preview", "post": post}

    # Try to fetch an image and post live using a stored account token if available
    image_data = None
    image_asset = None

    accounts = []
    try:
        accounts = get_all_tokens() if get_all_tokens else []
    except Exception:
        accounts = []

    # Choose first stored account if available
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

    # Fallback: use environment-based linkedin service (may raise if not configured)
    if get_relevant_image:
        image_data = get_relevant_image(post)
    if image_data and upload_image_to_linkedin:
        image_asset = upload_image_to_linkedin(image_data)
    if post_to_linkedin:
        post_to_linkedin(post, image_asset)
    return {"status": "posted", "post": post, "image_asset": image_asset}


@app.get('/auth/linkedin/start')
def linkedin_start(redirect_uri: str):
    """Redirects the user to LinkedIn's authorization page."""
    if not get_authorize_url:
        return {"error": "OAuth service not available"}
    state = uuid4().hex
    url = get_authorize_url(redirect_uri, state)
    return RedirectResponse(url)


@app.get('/auth/linkedin/callback')
def linkedin_callback(code: str = None, state: str = None, redirect_uri: str = None):
    """Exchange code for token and store it. Returns a small status JSON."""
    if not exchange_code_for_token:
        return {"error": "OAuth service not available"}
    if not code or not redirect_uri:
        return {"error": "missing code or redirect_uri"}
    try:
        result = exchange_code_for_token(code, redirect_uri)
        return {"status": "success", "linkedin_user_urn": result.get("linkedin_user_urn")}
    except Exception as e:
        return {"error": str(e)}


# User settings endpoints
class UserSettingsRequest(BaseModel):
    user_id: str
    linkedin_client_id: Optional[str] = None
    linkedin_client_secret: Optional[str] = None
    groq_api_key: Optional[str] = None
    github_username: Optional[str] = None
    unsplash_access_key: Optional[str] = None


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
    """Get user settings by user ID"""
    if not get_user_settings:
        return {"error": "User settings service not available"}
    try:
        settings = get_user_settings(user_id)
        if settings:
            # Don't expose secrets to frontend
            return {
                "user_id": settings.get("user_id"),
                "github_username": settings.get("github_username"),
                "has_linkedin": bool(settings.get("linkedin_client_id")),
                "has_groq": bool(settings.get("groq_api_key")),
                "has_unsplash": bool(settings.get("unsplash_access_key")),
            }
        return {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}


# GitHub activity endpoints
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
    post_type: str
    context: dict
    status: str = "draft"


@app.post("/api/posts")
def create_post(request: SavePostRequest):
    """Save a post to history"""
    if not save_post:
        return {"error": "Post history service not available"}
    try:
        post_id = save_post(
            request.user_id,
            request.post_content,
            request.post_type,
            request.context,
            request.status
        )
        return {"post_id": post_id, "status": "success"}
    except Exception as e:
        return {"error": str(e)}


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


# Keep the old callback endpoint for backwards compatibility
    try:
        result = exchange_code_for_token(code, redirect_uri)
        return {"status": "ok", "result": result}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
