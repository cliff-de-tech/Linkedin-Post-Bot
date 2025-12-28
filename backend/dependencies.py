"""
Backend Dependencies Module

Provides dependency injection for:
- Authentication (Clerk JWT verification)
- Repository factories (with user_id scoping for multi-tenancy)

Usage in routes:
    @router.get("/posts")
    async def get_posts(
        post_repo: PostRepository = Depends(get_post_repository)
    ):
        return await post_repo.get_posts()
"""
from fastapi import Depends, HTTPException

# =============================================================================
# AUTH DEPENDENCIES
# =============================================================================
from middleware.clerk_auth import get_current_user, require_auth

# Re-export auth dependencies for use in routers
require_auth_dep = Depends(require_auth) if require_auth else None
get_user_dep = Depends(get_current_user) if get_current_user else None


def get_auth_dependency():
    """Get the authentication dependency for router endpoints."""
    return Depends(require_auth) if require_auth else None


def get_optional_auth_dependency():
    """Get optional authentication dependency (allows unauthenticated access)."""
    return Depends(get_current_user) if get_current_user else None


# =============================================================================
# DATABASE DEPENDENCY
# =============================================================================
from services.db import get_database


async def get_db():
    """
    Get database instance for dependency injection.
    
    Returns:
        DatabaseWrapper instance
    """
    return get_database()


# =============================================================================
# REPOSITORY DEPENDENCIES
# =============================================================================
from repositories.posts import PostRepository
from repositories.settings import SettingsRepository


async def get_current_user_id(
    current_user: dict = Depends(require_auth) if require_auth else None
) -> str:
    """
    Extract user_id from authenticated request.
    
    Raises:
        HTTPException 401 if not authenticated
    """
    if not current_user or not current_user.get("user_id"):
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user["user_id"]


async def get_post_repository(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
) -> PostRepository:
    """
    Get PostRepository injected with current user's ID.
    
    This ensures all queries are automatically scoped to the authenticated user.
    
    Usage:
        @router.get("/posts")
        async def get_posts(post_repo: PostRepository = Depends(get_post_repository)):
            return await post_repo.get_posts()
    """
    return PostRepository(db, user_id)


async def get_settings_repository(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
) -> SettingsRepository:
    """
    Get SettingsRepository injected with current user's ID.
    
    Usage:
        @router.get("/settings")
        async def get_settings(settings_repo: SettingsRepository = Depends(get_settings_repository)):
            return await settings_repo.get_settings()
    """
    return SettingsRepository(db, user_id)


# =============================================================================
# OPTIONAL AUTH REPOSITORY DEPENDENCIES
# Useful for endpoints that work with or without authentication
# =============================================================================

async def get_optional_user_id(
    current_user: dict = Depends(get_current_user) if get_current_user else None
) -> str | None:
    """
    Extract user_id from request if authenticated, otherwise None.
    """
    if current_user:
        return current_user.get("user_id")
    return None


async def get_post_repository_optional(
    user_id: str | None = Depends(get_optional_user_id),
    db = Depends(get_db)
) -> PostRepository | None:
    """
    Get PostRepository if user is authenticated, otherwise None.
    """
    if user_id:
        return PostRepository(db, user_id)
    return None
