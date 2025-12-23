"""
Feedback Routes
Handles user feedback submission and status checking.

This module supports the beta feedback popup that collects user ratings
and improvement suggestions.
"""

import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

# =============================================================================
# ROUTER SETUP
# =============================================================================
router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

# =============================================================================
# SERVICE IMPORTS
# =============================================================================
try:
    from services.feedback import (
        save_feedback,
        has_user_submitted_feedback,
        get_all_feedback,
    )
except ImportError:
    save_feedback = None
    has_user_submitted_feedback = None
    get_all_feedback = None

try:
    from services.email_service import EmailService
    email_service = EmailService()
except ImportError:
    email_service = None


# =============================================================================
# REQUEST MODELS
# =============================================================================
class FeedbackRequest(BaseModel):
    """Request model for feedback submission."""
    user_id: str
    rating: int  # 1-5 stars
    liked: Optional[str] = None
    improvements: str  # Required
    suggestions: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================
@router.post("/submit")
async def submit_feedback(req: FeedbackRequest):
    """Submit user feedback (stored in SQLite and optionally emailed)."""
    if not save_feedback:
        return {"error": "Feedback service not available"}
    
    try:
        # Save to database
        result = save_feedback(
            user_id=req.user_id,
            rating=req.rating,
            liked=req.liked,
            improvements=req.improvements,
            suggestions=req.suggestions
        )
        
        # Also send email notification if email service available
        if email_service and result.get('success'):
            try:
                email_body = f"""
New Beta Feedback Received!

User ID: {req.user_id}
Rating: {'⭐' * req.rating}
Liked: {req.liked or 'Not provided'}
Improvements: {req.improvements}
Suggestions: {req.suggestions or 'None'}
                """
                email_service.send_email(
                    to_email=os.getenv('ADMIN_EMAIL', 'admin@example.com'),
                    subject=f"[LinkedIn Bot] New Feedback - {req.rating}⭐",
                    body=email_body
                )
            except Exception as e:
                print(f"Failed to send feedback email: {e}")
        
        return result
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return {"success": False, "error": str(e)}


@router.get("/status/{user_id}")
def get_feedback_status(user_id: str):
    """Check if user has already submitted feedback."""
    if not has_user_submitted_feedback:
        return {"has_submitted": False}
    
    return {"has_submitted": has_user_submitted_feedback(user_id)}
