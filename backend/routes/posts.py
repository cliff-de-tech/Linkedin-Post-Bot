"""
Posts Routes
Handles post generation, publishing, and scheduling.

This module contains endpoints for:
- Generating AI-powered post previews
- Publishing posts to LinkedIn
- Scheduling posts for later
"""

import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

# =============================================================================
# ROUTER SETUP
# =============================================================================
router = APIRouter(prefix="/api/post", tags=["Posts"])

# =============================================================================
# SERVICE IMPORTS
# =============================================================================
try:
    from services.ai_service import generate_post_with_ai
except ImportError:
    generate_post_with_ai = None

try:
    from services.persona_service import build_full_persona_context
except ImportError:
    build_full_persona_context = None

try:
    from services.image_service import get_relevant_image
except ImportError:
    get_relevant_image = None

try:
    from services.linkedin_service import post_to_linkedin, upload_image_to_linkedin
except ImportError:
    post_to_linkedin = None
    upload_image_to_linkedin = None

try:
    from services.user_settings import get_user_settings
except ImportError:
    get_user_settings = None

try:
    from services.token_store import (
        get_all_tokens,
        get_access_token_for_urn,
        get_token_by_user_id,
    )
except ImportError:
    get_all_tokens = None
    get_access_token_for_urn = None
    get_token_by_user_id = None

try:
    from services.rate_limiter import (
        post_generation_limiter,
        publish_limiter,
    )
    RATE_LIMITING_ENABLED = True
except ImportError:
    RATE_LIMITING_ENABLED = False
    post_generation_limiter = None
    publish_limiter = None

try:
    from middleware.clerk_auth import get_current_user
except ImportError:
    get_current_user = None


# =============================================================================
# REQUEST MODELS
# =============================================================================
class GenerateRequest(BaseModel):
    context: dict
    user_id: Optional[str] = None


class PostRequest(BaseModel):
    context: dict
    test_mode: Optional[bool] = True
    user_id: Optional[str] = None


class BatchGenerateRequest(BaseModel):
    """Request for batch post generation in Bot Mode."""
    user_id: str
    activities: list  # List of GitHub activities to generate posts for
    style: Optional[str] = "standard"  # Template style


# =============================================================================
# ENDPOINTS
# =============================================================================
@router.post("/generate-preview")
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
            settings = await get_user_settings(user_id)
            if settings:
                groq_api_key = settings.get('groq_api_key')
        except Exception as e:
            print(f"Failed to get user settings: {type(e).__name__}")
    
    # Get user's persona context
    persona_context = None
    if user_id and build_full_persona_context:
        try:
            persona_context = await build_full_persona_context(user_id)
            if persona_context:
                print(f"✅ Persona loaded for user {user_id[:8]}...: {len(persona_context)} chars")
            else:
                print(f"⚠️ No persona found for user {user_id[:8]}...")
        except Exception as e:
            print(f"Failed to get persona: {type(e).__name__}: {e}")
    
    post = generate_post_with_ai(req.context, groq_api_key=groq_api_key, persona_context=persona_context)
    return {"post": post}


@router.post("/generate-batch")
async def generate_batch(req: BatchGenerateRequest):
    """Generate multiple posts for Bot Mode.
    
    Takes a list of GitHub activities and generates posts for each one.
    Returns the list of generated posts with success/failure counts.
    """
    if not generate_post_with_ai:
        return {"error": "generate_post_with_ai not available (import failed)"}
    
    user_id = req.user_id
    activities = req.activities
    style = req.style or "standard"
    
    # Get user settings for API key and persona
    groq_api_key = None
    persona_context = None
    
    if user_id and get_user_settings:
        try:
            settings = await get_user_settings(user_id)
            if settings:
                groq_api_key = settings.get('groq_api_key')
        except Exception as e:
            print(f"Failed to get user settings: {type(e).__name__}")
    
    if user_id and build_full_persona_context:
        try:
            persona_context = await build_full_persona_context(user_id)
        except Exception as e:
            print(f"Failed to get persona: {type(e).__name__}")
    
    # Generate posts for each activity
    generated_posts = []
    success_count = 0
    failed_count = 0
    
    for activity in activities:
        try:
            # Build context from activity
            context = {
                "type": activity.get("type", "push"),
                "repo": activity.get("repo") or activity.get("full_repo", "").split("/")[-1],
                "full_repo": activity.get("full_repo", ""),
                "commits": activity.get("commits", 1),
                "date": activity.get("date", activity.get("time_ago", "recently")),
                "title": activity.get("title", ""),
                "description": activity.get("description", ""),
                "tone": style  # Use the selected template/style
            }
            
            # Generate post with AI
            post_content = generate_post_with_ai(
                context, 
                groq_api_key=groq_api_key, 
                persona_context=persona_context
            )
            
            if post_content:
                generated_posts.append({
                    "id": f"gen_{success_count}_{activity.get('id', '')}",
                    "content": post_content,
                    "activity": activity,
                    "style": style,
                    "status": "draft"
                })
                success_count += 1
            else:
                failed_count += 1
                
        except Exception as e:
            print(f"Failed to generate post for activity: {e}")
            failed_count += 1
    
    return {
        "posts": generated_posts,
        "generated_count": success_count,
        "failed_count": failed_count,
        "total": len(activities)
    }


@router.post("/publish")
async def publish(req: PostRequest):
    """Publish a post to LinkedIn."""
    if not generate_post_with_ai:
        return {"error": "generate_post_with_ai not available (import failed)"}

    # Get user's Groq API key if user_id provided
    groq_api_key = None
    user_settings = None
    if req.user_id and get_user_settings:
        try:
            user_settings = await get_user_settings(req.user_id)
            if user_settings:
                groq_api_key = user_settings.get('groq_api_key')
        except Exception as e:
            print(f"Failed to get user settings: {e}")
    
    # Get user's persona context
    persona_context = None
    if req.user_id and build_full_persona_context:
        try:
            persona_context = await build_full_persona_context(req.user_id)
        except Exception as e:
            print(f"Failed to get persona: {type(e).__name__}")

    post = generate_post_with_ai(req.context, groq_api_key=groq_api_key, persona_context=persona_context)
    if not post:
        return {"error": "failed_to_generate_post"}

    if req.test_mode:
        return {"status": "preview", "post": post}

    # Actual publishing logic
    image_data = None
    image_asset = None

    # First try: use user's specific token
    if req.user_id and get_token_by_user_id:
        try:
            user_token = await get_token_by_user_id(req.user_id)
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
        accounts = await get_all_tokens() if get_all_tokens else []
    except Exception as e:
        logger.debug(f"Failed to get tokens: {e}")
        accounts = []

    if accounts:
        account = accounts[0]
        linkedin_urn = account.get('linkedin_user_urn')
        try:
            token = await get_access_token_for_urn(linkedin_urn)
        except Exception as e:
            logger.debug(f"Failed to get access token: {e}")
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
