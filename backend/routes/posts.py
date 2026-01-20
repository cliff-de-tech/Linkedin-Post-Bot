"""
Posts Routes
Handles post generation, publishing, and scheduling.

This module contains endpoints for:
- Generating AI-powered post previews
- Publishing posts to LinkedIn
- Scheduling posts for later
"""

import os
import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

logger = structlog.get_logger(__name__)

# =============================================================================
# ROUTER SETUP
# =============================================================================
router = APIRouter(prefix="/api/post", tags=["Posts"])

# =============================================================================
# SERVICE IMPORTS
# =============================================================================
try:
    from services.ai_service import (
        generate_post_with_ai,
        generate_linkedin_post,
        get_available_providers,
        ModelProvider,
    )
except ImportError:
    generate_post_with_ai = None
    generate_linkedin_post = None
    get_available_providers = None
    ModelProvider = None

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
    from services.scheduled_posts import schedule_post
except ImportError:
    schedule_post = None

try:
    from services.auth_service import (
        TokenNotFoundError,
        TokenRefreshError,
        AuthProviderError,
    )
except ImportError:
    TokenNotFoundError = Exception
    TokenRefreshError = Exception
    AuthProviderError = Exception

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

from services.db import get_database
from repositories.posts import PostRepository


# =============================================================================
# REQUEST MODELS
# =============================================================================
class GenerateRequest(BaseModel):
    context: dict
    user_id: Optional[str] = None
    model: Optional[str] = "groq"  # groq (free), openai (pro), anthropic (pro)
    style: Optional[str] = "standard"  # template style


class PostRequest(BaseModel):
    context: dict
    test_mode: Optional[bool] = True
    user_id: Optional[str] = None
    model: Optional[str] = "groq"


class ScheduleRequest(BaseModel):
    user_id: str
    post_content: str
    scheduled_time: int
    image_url: Optional[str] = None


class BatchGenerateRequest(BaseModel):
    """Request for batch post generation in Bot Mode."""
    user_id: str
    activities: list  # List of GitHub activities to generate posts for
    style: Optional[str] = "standard"  # Template style
    model: Optional[str] = "groq"  # AI provider


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
    
    Supports multiple AI providers with tier enforcement:
    - Free tier: Always routes to Groq (fast, free)
    - Pro tier: Can choose groq, openai (GPT-4o), or anthropic (Claude 3.5)
    """
    if not generate_linkedin_post:
        # Fallback to legacy if new function unavailable
        if not generate_post_with_ai:
            return {"error": "AI service not available (import failed)"}
    
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
    
    # Get user's API keys if user_id available
    groq_api_key = None
    openai_api_key = None
    anthropic_api_key = None
    
    if user_id and get_user_settings:
        try:
            settings = await get_user_settings(user_id)
            if settings:
                groq_api_key = settings.get('groq_api_key')
                openai_api_key = settings.get('openai_api_key')
                anthropic_api_key = settings.get('anthropic_api_key')
        except Exception as e:
            logger.warning("failed_to_get_user_settings", error=str(e))
    
    # Get user's persona context
    persona_context = None
    if user_id and build_full_persona_context:
        try:
            persona_context = await build_full_persona_context(user_id)
            if persona_context:
                logger.info("persona_loaded", user_id=user_id[:8], length=len(persona_context))
        except Exception as e:
            logger.warning("failed_to_get_persona", error=str(e))
    
    # Use new multi-model router
    if generate_linkedin_post:
        result = await generate_linkedin_post(
            context_data=req.context,
            user_id=user_id,
            model_provider=req.model or "groq",
            style=req.style or "standard",
            groq_api_key=groq_api_key,
            openai_api_key=openai_api_key,
            anthropic_api_key=anthropic_api_key,
            persona_context=persona_context,
        )
        
        if result:
            return {
                "post": result.content,
                "provider": result.provider.value,
                "model": result.model,
                "was_downgraded": result.was_downgraded,
            }
        else:
            return {"error": "Failed to generate post"}
    
    # Fallback to legacy sync function
    post = generate_post_with_ai(req.context, groq_api_key=groq_api_key, persona_context=persona_context)
    return {"post": post, "provider": "groq", "model": "llama-3.3-70b-versatile"}


@router.post("/generate-batch")
async def generate_batch(req: BatchGenerateRequest):
    """Generate multiple posts for Bot Mode.
    
    Takes a list of GitHub activities and generates posts for each one.
    Returns the list of generated posts with success/failure counts.
    
    Supports tier-based model selection:
    - Free tier: Always Groq
    - Pro tier: Can specify groq, openai, or anthropic
    """
    if not generate_linkedin_post and not generate_post_with_ai:
        return {"error": "AI service not available (import failed)"}
    
    user_id = req.user_id
    activities = req.activities
    style = req.style or "standard"
    model = req.model or "groq"
    
    # Get user settings for API keys and persona
    groq_api_key = None
    openai_api_key = None
    anthropic_api_key = None
    persona_context = None
    
    if user_id and get_user_settings:
        try:
            settings = await get_user_settings(user_id)
            if settings:
                groq_api_key = settings.get('groq_api_key')
                openai_api_key = settings.get('openai_api_key')
                anthropic_api_key = settings.get('anthropic_api_key')
        except Exception as e:
            logger.warning("failed_to_get_user_settings", error=str(e))
    
    if user_id and build_full_persona_context:
        try:
            persona_context = await build_full_persona_context(user_id)
        except Exception as e:
            logger.warning("failed_to_get_persona", error=str(e))
        except Exception as e:
            logger.warning("failed_to_get_persona", error=str(e))
    
    # Generate posts for each activity
    generated_posts = []
    success_count = 0
    failed_count = 0
    used_provider = None
    was_downgraded = False
    
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
            
            # Use new multi-model router if available
            if generate_linkedin_post:
                result = await generate_linkedin_post(
                    context_data=context,
                    user_id=user_id,
                    model_provider=model,
                    style=style,
                    groq_api_key=groq_api_key,
                    openai_api_key=openai_api_key,
                    anthropic_api_key=anthropic_api_key,
                    persona_context=persona_context,
                )
                
                if result:
                    final_post = {
                        "id": f"gen_{success_count}_{activity.get('id', '')}",
                        "content": result.content,
                        "activity": activity,
                        "style": style,
                        "status": "draft",
                        "provider": result.provider.value,
                        "model": result.model,
                    }
                    generated_posts.append(final_post)
                    
                    # PERSISTENCE: Save as draft immediately
                    try:
                        db = get_database()
                        repo = PostRepository(db, req.user_id)
                        saved_id = await repo.save_post(
                            post_content=result.content,
                            post_type='bot',
                            context=activity,
                            status='draft'
                        )
                        final_post['id'] = str(saved_id)
                        final_post['db_id'] = saved_id
                    except Exception as e:
                        logger.error("failed_to_persist_post_provider", error=str(e))
                        
                    used_provider = result.provider.value
                    was_downgraded = result.was_downgraded
                    success_count += 1
                else:
                    failed_count += 1
            else:
                # Fallback to legacy function
                post_content = generate_post_with_ai(
                    context, 
                    groq_api_key=groq_api_key, 
                    persona_context=persona_context
                )
                
                if post_content:
                    final_post = {
                        "id": f"gen_{success_count}_{activity.get('id', '')}",
                        "content": post_content,
                        "activity": activity,
                        "style": style,
                        "status": "draft",
                        "provider": "groq",
                        "model": "llama-3.3-70b-versatile",
                    }
                    generated_posts.append(final_post)
                    
                    # PERSISTENCE: Save as draft immediately
                    try:
                        db = get_database()
                        repo = PostRepository(db, req.user_id)
                        saved_id = await repo.save_post(
                            post_content=post_content,
                            post_type='bot',
                            context=activity,
                            status='draft'
                        )
                        # Build full object with real ID so frontend can use it for publishing
                        final_post['id'] = str(saved_id)
                        final_post['db_id'] = saved_id  # explicitly track DB ID
                    except Exception as e:
                        logger.error("failed_to_persist_post", error=str(e))
                        
                    success_count += 1
                else:
                    failed_count += 1
                    
        except Exception as e:
            logger.error("failed_to_generate_post", error=str(e))
            failed_count += 1
            
    # For provider-based generation loop above, we also need persistence
    # (Note: I'm patching the loop above in a second chunk or assuming the user meant to cover both paths. 
    # To be safe and clean, I will wrap the persistence logic in a helper or duplicate it for the first branch if I can't easily merge.)
    # Actually, the previous 'if result:' block also needs persistence. 
    # Let me re-read the file content to ensure I catch both branches.
    # The file view showed headers 300-450.
    
    return {
        "posts": generated_posts,
        "generated_count": success_count,
        "failed_count": failed_count,
        "total": len(activities),
        "provider": used_provider,
        "was_downgraded": was_downgraded,
    }


@router.get("/bot-stats")
async def get_bot_stats(
    user_id: str,
    current_user: dict = Depends(get_current_user) if get_current_user else None
):
    """Get statistics for bot mode (generated vs published)."""
    if current_user and current_user.get("user_id") != user_id:
         raise HTTPException(status_code=403, detail="Unauthorized")
         
    try:
        db = get_database()
        repo = PostRepository(db, user_id)
        return await repo.get_bot_stats()
    except Exception as e:
        logger.error("failed_to_get_bot_stats", error=str(e))
        return {"generated": 0, "published": 0}


@router.get("/providers")
async def list_providers(
    current_user: dict = Depends(get_current_user) if get_current_user else None
):
    """List available AI providers and their configuration status.
    
    Returns provider availability based on configured API keys and user tier.
    Free tier users will see premium providers as unavailable for them.
    """
    if not get_available_providers:
        return {
            "providers": {
                "groq": {"available": False, "model": "unknown", "tier": "free"},
                "openai": {"available": False, "model": "unknown", "tier": "pro"},
                "anthropic": {"available": False, "model": "unknown", "tier": "pro"},
            },
            "user_tier": "free",
        }
    
    providers = get_available_providers()
    
    # Get user tier if authenticated
    user_tier = "free"
    if current_user and current_user.get("user_id") and get_user_settings:
        try:
            settings = await get_user_settings(current_user["user_id"])
            if settings:
                user_tier = settings.get("subscription_tier", "free")
        except Exception:
            pass
    
    # Mark pro providers as unavailable for free users
    if user_tier == "free":
        for name, info in providers.items():
            if info.get("tier") == "pro":
                info["available_to_user"] = False
            else:
                info["available_to_user"] = info.get("available", False)
    else:
        for name, info in providers.items():
            info["available_to_user"] = info.get("available", False)
    
    return {
        "providers": providers,
        "user_tier": user_tier,
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
        
        except TokenNotFoundError as e:
            logger.warning("token_not_found", user_id=req.user_id, error=str(e))
            raise HTTPException(status_code=401, detail="LinkedIn not connected. Please reconnect your account.")
        
        except TokenRefreshError as e:
            logger.warning("token_refresh_failed", user_id=req.user_id, error=str(e))
            raise HTTPException(status_code=401, detail="LinkedIn session expired. Please reconnect your account.")
        
        except AuthProviderError as e:
            logger.error("linkedin_api_unavailable", user_id=req.user_id, error=str(e))
            raise HTTPException(status_code=502, detail="LinkedIn is temporarily unavailable. Please try again later.")
        
        except Exception as e:
            logger.error("token_retrieval_failed", user_id=req.user_id, error=str(e))
            # Continue to fallback instead of failing

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
        
        except TokenNotFoundError as e:
            logger.warning("fallback_token_not_found", linkedin_urn=linkedin_urn, error=str(e))
            raise HTTPException(status_code=401, detail="LinkedIn not connected. Please reconnect your account.")
        
        except TokenRefreshError as e:
            logger.warning("fallback_token_refresh_failed", linkedin_urn=linkedin_urn, error=str(e))
            raise HTTPException(status_code=401, detail="LinkedIn session expired. Please reconnect your account.")
        
        except AuthProviderError as e:
            logger.error("fallback_linkedin_unavailable", linkedin_urn=linkedin_urn, error=str(e))
            raise HTTPException(status_code=502, detail="LinkedIn is temporarily unavailable. Please try again later.")
        
        except Exception as e:
            logger.error("fallback_token_error", linkedin_urn=linkedin_urn, error=str(e))
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


@router.post("/schedule")
async def schedule(req: ScheduleRequest):
    """Schedule a post for later publishing."""
    if not schedule_post:
        raise HTTPException(status_code=500, detail="Schedule service not available")

    result = await schedule_post(
        user_id=req.user_id,
        post_content=req.post_content,
        scheduled_time=req.scheduled_time,
        image_url=req.image_url
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
        
    return result

