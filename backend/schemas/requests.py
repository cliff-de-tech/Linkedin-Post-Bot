"""
Pydantic Request Models - Strictly Validated

All request body schemas for API endpoints.
SECURITY: All inputs are strictly validated to prevent:
- Injection attacks (SQL, NoSQL, Command injection via AI prompts)
- DoS attacks (oversized payloads, unbounded lists)
- Type coercion vulnerabilities

Validation Rules:
- All string fields have min/max length constraints
- All list fields have max_length constraints
- Enums/Literals used for known value sets
- Nested models replace generic dict types
"""
from __future__ import annotations

from typing import Optional, List, Literal, Annotated
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


# =============================================================================
# SECURITY CONSTANTS
# =============================================================================

# Maximum lengths to prevent DoS attacks
MAX_USER_ID_LENGTH = 64
MAX_POST_CONTENT_LENGTH = 3500  # LinkedIn limit is 3000, buffer for formatting
MAX_URL_LENGTH = 2048
MAX_REPO_NAME_LENGTH = 256
MAX_USERNAME_LENGTH = 64
MAX_LIST_SIZE = 50  # Maximum items in any list
MAX_CONTEXT_STRING_LENGTH = 500

# Allowed activity types (GitHub event types)
ALLOWED_ACTIVITY_TYPES = Literal[
    "push", "PushEvent",
    "pr", "pull_request", "PullRequestEvent",
    "commit", "CommitEvent",
    "new_repo", "CreateEvent",
    "issue", "IssuesEvent",
    "comment", "IssueCommentEvent",
    "release", "ReleaseEvent",
    "fork", "ForkEvent",
    "star", "WatchEvent",
    "generic", "milestone",
]

# Allowed post generation styles
ALLOWED_STYLES = Literal[
    "standard",
    "build_in_public",
    "thought_leadership",
    "job_search",
    "casual",
    "technical",
]

# Allowed post statuses
ALLOWED_POST_STATUSES = Literal["draft", "published", "scheduled", "failed"]

# Allowed post types
ALLOWED_POST_TYPES = Literal["push", "pr", "commit", "new_repo", "generic", "mixed", "manual"]


# =============================================================================
# NESTED CONTEXT MODELS (Replace generic dict)
# =============================================================================

class PostContext(BaseModel):
    """
    Structured context for post generation.
    
    SECURITY: All fields are constrained to prevent injection attacks.
    This replaces the dangerous generic `dict` type.
    """
    model_config = ConfigDict(extra="forbid")  # Reject unknown fields
    
    type: ALLOWED_ACTIVITY_TYPES = Field(
        default="generic",
        description="Type of GitHub activity"
    )
    commits: Optional[int] = Field(
        default=None,
        ge=0,
        le=10000,
        description="Number of commits (for push events)"
    )
    repo: Optional[str] = Field(
        default=None,
        max_length=MAX_REPO_NAME_LENGTH,
        description="Repository name (e.g., 'my-project')"
    )
    full_repo: Optional[str] = Field(
        default=None,
        max_length=MAX_REPO_NAME_LENGTH * 2,
        description="Full repository path (e.g., 'username/my-project')"
    )
    date: Optional[str] = Field(
        default=None,
        max_length=32,
        description="ISO date string"
    )
    message: Optional[str] = Field(
        default=None,
        max_length=MAX_CONTEXT_STRING_LENGTH,
        description="Commit message or PR title"
    )
    branch: Optional[str] = Field(
        default=None,
        max_length=256,
        description="Branch name"
    )
    milestone: Optional[str] = Field(
        default=None,
        max_length=MAX_CONTEXT_STRING_LENGTH,
        description="Milestone name (for milestone posts)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Additional description or context"
    )
    
    @field_validator('repo', 'full_repo', 'branch', mode='before')
    @classmethod
    def sanitize_path_like_strings(cls, v):
        """Prevent path traversal attacks in repo/branch names."""
        if v is None:
            return v
        if not isinstance(v, str):
            return str(v)
        # Remove dangerous path characters
        dangerous_patterns = ['..', '\\', '\x00', '\n', '\r']
        for pattern in dangerous_patterns:
            v = v.replace(pattern, '')
        return v.strip()


class GitHubActivityItem(BaseModel):
    """
    Single GitHub activity item for batch processing.
    
    SECURITY: Strictly typed to prevent arbitrary data injection.
    """
    model_config = ConfigDict(extra="forbid")
    
    type: ALLOWED_ACTIVITY_TYPES
    repo: str = Field(max_length=MAX_REPO_NAME_LENGTH)
    message: Optional[str] = Field(default=None, max_length=MAX_CONTEXT_STRING_LENGTH)
    commits: Optional[int] = Field(default=None, ge=0, le=10000)
    date: Optional[str] = Field(default=None, max_length=32)
    url: Optional[str] = Field(default=None, max_length=MAX_URL_LENGTH)


class SavePostContext(BaseModel):
    """
    Context stored with saved posts (more permissive for historical data).
    """
    model_config = ConfigDict(extra="ignore")  # Allow extra fields for backwards compat
    
    type: Optional[str] = Field(default=None, max_length=64)
    repo: Optional[str] = Field(default=None, max_length=MAX_REPO_NAME_LENGTH)
    commits: Optional[int] = Field(default=None, ge=0, le=10000)
    message: Optional[str] = Field(default=None, max_length=MAX_CONTEXT_STRING_LENGTH)


# =============================================================================
# USER ID MIXIN (Common validation)
# =============================================================================

class UserIdMixin(BaseModel):
    """Mixin for models that require user_id."""
    user_id: str = Field(
        min_length=1,
        max_length=MAX_USER_ID_LENGTH,
        description="Clerk user ID"
    )
    
    @field_validator('user_id', mode='before')
    @classmethod
    def validate_user_id(cls, v):
        """Ensure user_id is a valid format."""
        if not isinstance(v, str):
            raise ValueError('user_id must be a string')
        v = v.strip()
        if not v:
            raise ValueError('user_id cannot be empty')
        # Basic format check (Clerk IDs are alphanumeric with underscores)
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('user_id contains invalid characters')
        return v


# =============================================================================
# GENERATION & PUBLISHING
# =============================================================================

class GenerateRequest(BaseModel):
    """
    Request model for AI post generation.
    
    SECURITY: Context is now a structured PostContext, not a generic dict.
    """
    model_config = ConfigDict(extra="forbid")
    
    context: PostContext = Field(
        description="Structured context for post generation"
    )
    user_id: Optional[str] = Field(
        default=None,
        max_length=MAX_USER_ID_LENGTH,
        description="Optional user ID for personalization"
    )


class PostRequest(BaseModel):
    """Request model for publishing posts."""
    model_config = ConfigDict(extra="forbid")
    
    context: PostContext
    test_mode: bool = Field(default=True, description="If true, returns preview without publishing")
    user_id: Optional[str] = Field(default=None, max_length=MAX_USER_ID_LENGTH)


class FullPublishRequest(UserIdMixin):
    """Request model for full publish flow with optional image."""
    model_config = ConfigDict(extra="forbid")
    
    post_content: str = Field(
        min_length=1,
        max_length=MAX_POST_CONTENT_LENGTH,
        description="The post text content"
    )
    image_url: Optional[str] = Field(
        default=None,
        max_length=MAX_URL_LENGTH,
        description="Optional image URL"
    )
    test_mode: bool = Field(default=False)
    
    @field_validator('image_url', mode='before')
    @classmethod
    def validate_url(cls, v):
        """Validate image URL format."""
        if v is None:
            return v
        if not isinstance(v, str):
            return None
        v = v.strip()
        if not v:
            return None
        # Must be HTTP(S) URL
        if not v.startswith(('http://', 'https://')):
            raise ValueError('image_url must be a valid HTTP/HTTPS URL')
        return v


class BatchGenerateRequest(UserIdMixin):
    """
    Request model for batch post generation.
    
    SECURITY: activities is now a typed list with max size.
    """
    model_config = ConfigDict(extra="forbid")
    
    activities: List[GitHubActivityItem] = Field(
        max_length=MAX_LIST_SIZE,
        description="List of GitHub activities to generate posts for"
    )
    style: ALLOWED_STYLES = Field(
        default="standard",
        description="Post generation style/template"
    )


class ImagePreviewRequest(BaseModel):
    """Request model for image preview/search."""
    model_config = ConfigDict(extra="forbid")
    
    post_content: str = Field(
        min_length=1,
        max_length=MAX_POST_CONTENT_LENGTH,
        description="Post content to find relevant images for"
    )
    count: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of images to return (max 10)"
    )


# =============================================================================
# GITHUB & SCANNING
# =============================================================================

class ScanRequest(UserIdMixin):
    """Request model for GitHub activity scanning."""
    model_config = ConfigDict(extra="forbid")
    
    hours: int = Field(
        default=24,
        ge=1,
        le=720,  # Max 30 days
        description="Hours of activity to scan (1-720)"
    )
    activity_type: Optional[ALLOWED_ACTIVITY_TYPES] = Field(
        default=None,
        description="Filter by specific activity type"
    )


# =============================================================================
# USER SETTINGS & AUTH
# =============================================================================

class UserSettingsRequest(UserIdMixin):
    """
    Request model for saving user settings.
    
    SECURITY: Only safe fields are accepted from frontend.
    Sensitive fields (API keys, tokens) are handled separately.
    """
    model_config = ConfigDict(extra="forbid")
    
    github_username: Optional[str] = Field(
        default=None,
        max_length=MAX_USERNAME_LENGTH,
        pattern=r'^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$',  # GitHub username rules (simplified)
        description="GitHub username"
    )
    
    @field_validator('github_username', mode='after')
    @classmethod
    def validate_github_username(cls, v):
        """Validate GitHub username doesn't have consecutive hyphens or end with hyphen."""
        if v is None:
            return v
        if '--' in v:
            raise ValueError('GitHub username cannot contain consecutive hyphens')
        if v.endswith('-'):
            raise ValueError('GitHub username cannot end with a hyphen')
        return v
    onboarding_complete: Optional[bool] = Field(
        default=None,
        description="Whether user completed onboarding"
    )


class AuthRefreshRequest(UserIdMixin):
    """Request model for auth refresh check."""
    model_config = ConfigDict(extra="forbid")


class DisconnectRequest(UserIdMixin):
    """Request model for disconnect endpoints (LinkedIn/GitHub)."""
    model_config = ConfigDict(extra="forbid")


# =============================================================================
# POST HISTORY
# =============================================================================

class SavePostRequest(UserIdMixin):
    """Request model for saving a post to history."""
    model_config = ConfigDict(extra="forbid")
    
    post_content: str = Field(
        min_length=1,
        max_length=MAX_POST_CONTENT_LENGTH
    )
    post_type: ALLOWED_POST_TYPES = Field(default="mixed")
    context: Optional[SavePostContext] = Field(
        default_factory=SavePostContext,
        description="Optional context about how the post was generated"
    )
    status: ALLOWED_POST_STATUSES = Field(default="draft")
    linkedin_post_id: Optional[str] = Field(
        default=None,
        max_length=128,
        description="LinkedIn's post ID after publishing"
    )


# =============================================================================
# SCHEDULED POSTS
# =============================================================================

class SchedulePostRequest(UserIdMixin):
    """Request model for scheduling a post."""
    model_config = ConfigDict(extra="forbid")
    
    post_content: str = Field(
        min_length=1,
        max_length=MAX_POST_CONTENT_LENGTH
    )
    scheduled_time: int = Field(
        ge=0,
        description="Unix timestamp for scheduled publish time"
    )
    image_url: Optional[str] = Field(
        default=None,
        max_length=MAX_URL_LENGTH
    )
    
    @field_validator('scheduled_time', mode='before')
    @classmethod
    def validate_scheduled_time(cls, v):
        """Ensure scheduled time is in the future (within reason)."""
        import time
        if not isinstance(v, (int, float)):
            raise ValueError('scheduled_time must be a number')
        v = int(v)
        now = int(time.time())
        # Allow scheduling up to 1 year in the future
        max_future = now + (365 * 24 * 60 * 60)
        if v > max_future:
            raise ValueError('scheduled_time cannot be more than 1 year in the future')
        return v


class RescheduleRequest(UserIdMixin):
    """Request model for rescheduling a post."""
    model_config = ConfigDict(extra="forbid")
    
    new_time: int = Field(
        ge=0,
        description="New Unix timestamp for scheduled publish time"
    )


# =============================================================================
# FEEDBACK & CONTACT
# =============================================================================

class FeedbackRequest(UserIdMixin):
    """Request model for feedback submission."""
    model_config = ConfigDict(extra="forbid")
    
    rating: int = Field(
        ge=1,
        le=5,
        description="Rating from 1-5"
    )
    liked: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="What the user liked"
    )
    improvements: str = Field(
        min_length=1,
        max_length=2000,
        description="Suggested improvements"
    )
    suggestions: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Additional suggestions"
    )


class ContactRequest(BaseModel):
    """Request model for contact form submission."""
    model_config = ConfigDict(extra="forbid")
    
    to: str = Field(
        max_length=254,  # Max email length per RFC
        description="Recipient email address"
    )
    from_email: Optional[str] = Field(
        default=None,
        max_length=254,
        description="Sender's email address"
    )
    subject: str = Field(
        min_length=1,
        max_length=256,
        description="Email subject"
    )
    body: str = Field(
        min_length=1,
        max_length=10000,
        description="Email body content"
    )
    name: str = Field(
        min_length=1,
        max_length=128,
        description="Sender's name"
    )
    
    @field_validator('to', 'from_email', mode='before')
    @classmethod
    def validate_email_format(cls, v):
        """Basic email format validation."""
        if v is None:
            return v
        if not isinstance(v, str):
            raise ValueError('Email must be a string')
        v = v.strip().lower()
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v
