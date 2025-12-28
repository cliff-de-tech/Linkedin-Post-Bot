"""
Backend Routes Package

All API routers for the LinkedIn Post Bot application.
"""
from fastapi import APIRouter

# Import existing routers
from .auth import router as auth_router
from .posts import router as posts_router
from .feedback import router as feedback_router
from .webhooks import router as webhooks_router

# Import new modular routers
from .github import router as github_router, auth_router as github_auth_router
from .linkedin import router as linkedin_router, auth_router as linkedin_auth_router

# Collect all routers for easy registration
all_routers = [
    auth_router,
    posts_router,
    feedback_router,
    webhooks_router,
    github_router,
    linkedin_router,
]

# OAuth routers (no /api prefix)
oauth_routers = [
    github_auth_router,
    linkedin_auth_router,
]

__all__ = [
    "auth_router",
    "posts_router", 
    "feedback_router",
    "webhooks_router",
    "github_router",
    "github_auth_router",
    "linkedin_router",
    "linkedin_auth_router",
    "all_routers",
    "oauth_routers",
]
