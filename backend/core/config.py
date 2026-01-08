"""
Backend Core Configuration Module

IMPORTANT: load_dotenv is called FIRST to ensure environment variables
are available before any other imports occur.
"""
import os
from dotenv import load_dotenv

# Load environment variables BEFORE any other imports
# This ensures all env vars are available when other modules import from here
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

import logging

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
def setup_logging() -> logging.Logger:
    """Configure structured logging for production observability."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    return logging.getLogger("api")

# Create the logger instance
logger = setup_logging()

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
# CORS_ORIGINS env var should be comma-separated list of allowed origins
# Example: CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# =============================================================================
# FEATURE FLAGS
# =============================================================================
RATE_LIMITING_ENABLED = True
ROUTERS_ENABLED = True

# =============================================================================
# TEMPLATES
# =============================================================================
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

# =============================================================================
# ENVIRONMENT VALIDATION
# =============================================================================
def validate_environment() -> None:
    """Validate required environment variables on startup."""
    required_vars = {
        "GROQ_API_KEY": "AI content generation",
        "LINKEDIN_CLIENT_ID": "LinkedIn OAuth",
        "LINKEDIN_CLIENT_SECRET": "LinkedIn OAuth",
    }
    
    optional_but_recommended = {
        "GITHUB_CLIENT_ID": "GitHub OAuth (private repos)",
        "GITHUB_CLIENT_SECRET": "GitHub OAuth (private repos)",
        "UNSPLASH_ACCESS_KEY": "Image generation",
        "STRIPE_SECRET_KEY": "Stripe payments",
        "STRIPE_WEBHOOK_SECRET": "Stripe webhook verification",
    }
    
    missing_required = []
    missing_optional = []
    
    for var, purpose in required_vars.items():
        if not os.getenv(var):
            missing_required.append(f"  - {var}: {purpose}")
    
    for var, purpose in optional_but_recommended.items():
        if not os.getenv(var):
            missing_optional.append(f"  - {var}: {purpose}")
    
    if missing_required:
        logger.warning("Missing REQUIRED environment variables:")
        for msg in missing_required:
            logger.warning(msg)
        logger.warning("Some features will not work until these are set.")
    
    if missing_optional:
        logger.info("Missing OPTIONAL environment variables:")
        for msg in missing_optional:
            logger.warning(msg)
        logger.info("These are recommended for full functionality.")

# =============================================================================
# STRIPE CONFIGURATION
# =============================================================================
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_SUCCESS_URL = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:3000/dashboard?payment=success")
STRIPE_CANCEL_URL = os.getenv("STRIPE_CANCEL_URL", "http://localhost:3000/pricing")

# Price IDs for subscription plans (configure in Stripe Dashboard)
STRIPE_PRICE_IDS = {
    "pro_monthly": os.getenv("STRIPE_PRICE_PRO_MONTHLY", "price_pro_monthly"),
    "pro_yearly": os.getenv("STRIPE_PRICE_PRO_YEARLY", "price_pro_yearly"),
}
