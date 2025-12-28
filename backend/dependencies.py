"""
Backend Dependencies Module

Shared dependencies used across multiple routers.
This file prevents circular imports by centralizing shared helpers.
"""
from fastapi import Depends
from middleware.clerk_auth import get_current_user, require_auth

# Re-export auth dependencies for use in routers
# Usage: from backend.dependencies import require_auth_dep
require_auth_dep = Depends(require_auth) if require_auth else None
get_user_dep = Depends(get_current_user) if get_current_user else None


def get_auth_dependency():
    """Get the authentication dependency for router endpoints."""
    return Depends(require_auth) if require_auth else None


def get_optional_auth_dependency():
    """Get optional authentication dependency (allows unauthenticated access)."""
    return Depends(get_current_user) if get_current_user else None
