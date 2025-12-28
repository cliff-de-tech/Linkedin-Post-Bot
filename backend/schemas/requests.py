"""
Pydantic Request Models

All request body schemas for API endpoints.
Extracted from app.py for clean architecture.
"""
from pydantic import BaseModel
from typing import Optional


# =============================================================================
# GENERATION & PUBLISHING
# =============================================================================

class GenerateRequest(BaseModel):
    """Request model for AI post generation."""
    context: dict
    user_id: Optional[str] = None


class PostRequest(BaseModel):
    """Request model for publishing posts."""
    context: dict
    test_mode: Optional[bool] = True
    user_id: Optional[str] = None


class FullPublishRequest(BaseModel):
    """Request model for full publish flow with optional image."""
    user_id: str
    post_content: str
    image_url: Optional[str] = None
    test_mode: Optional[bool] = False


class BatchGenerateRequest(BaseModel):
    """Request model for batch post generation."""
    user_id: str
    activities: list
    style: Optional[str] = "standard"


class ImagePreviewRequest(BaseModel):
    """Request model for image preview/search."""
    post_content: str
    count: Optional[int] = 3


# =============================================================================
# GITHUB & SCANNING
# =============================================================================

class ScanRequest(BaseModel):
    """Request model for GitHub activity scanning."""
    user_id: str
    hours: Optional[int] = 24
    activity_type: Optional[str] = None


# =============================================================================
# USER SETTINGS & AUTH
# =============================================================================

class UserSettingsRequest(BaseModel):
    """Request model for saving user settings.
    
    SECURITY: Only safe fields are accepted from frontend.
    """
    user_id: str
    github_username: Optional[str] = None
    onboarding_complete: Optional[bool] = None


class AuthRefreshRequest(BaseModel):
    """Request model for auth refresh check."""
    user_id: str


class DisconnectRequest(BaseModel):
    """Request model for disconnect endpoints (LinkedIn/GitHub)."""
    user_id: str


# =============================================================================
# POST HISTORY
# =============================================================================

class SavePostRequest(BaseModel):
    """Request model for saving a post to history."""
    user_id: str
    post_content: str
    post_type: Optional[str] = "mixed"
    context: Optional[dict] = {}
    status: Optional[str] = "draft"
    linkedin_post_id: Optional[str] = None


# =============================================================================
# SCHEDULED POSTS
# =============================================================================

class SchedulePostRequest(BaseModel):
    """Request model for scheduling a post."""
    user_id: str
    post_content: str
    scheduled_time: int  # Unix timestamp
    image_url: Optional[str] = None


class RescheduleRequest(BaseModel):
    """Request model for rescheduling a post."""
    user_id: str
    new_time: int  # Unix timestamp


# =============================================================================
# FEEDBACK & CONTACT
# =============================================================================

class FeedbackRequest(BaseModel):
    """Request model for feedback submission."""
    user_id: str
    rating: int
    liked: Optional[str] = None
    improvements: str
    suggestions: Optional[str] = None


class ContactRequest(BaseModel):
    """Request model for contact form submission."""
    to: str
    from_email: str = None
    subject: str
    body: str
    name: str
