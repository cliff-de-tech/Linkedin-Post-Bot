"""
LinkedIn Post Bot API - FastAPI Application

This is the main application entry point. It only contains:
- FastAPI app initialization
- CORS middleware setup
- Database lifecycle hooks
- Global exception handler
- Router registration

All route logic is in backend/routes/*.py
All schemas are in backend/schemas/*.py
All configuration is in backend/core/config.py
"""
import os
import sys
from pathlib import Path

# =============================================================================
# PATH SETUP FOR MODULE IMPORTS
# =============================================================================
# Ensure backend directory is in Python path for imports like 'from core.config'
# This allows running as both 'python backend/app.py' and 'uvicorn backend.app:app'
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load dotenv EARLY before any other imports
from dotenv import load_dotenv
load_dotenv(backend_dir.parent / '.env')

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Import configuration from core module
from core.config import (
    logger,
    CORS_ORIGINS,
    RATE_LIMITING_ENABLED,
    TEMPLATES,
    validate_environment,
)

# =============================================================================
# VALIDATE ENVIRONMENT ON STARTUP
# =============================================================================
validate_environment()

# =============================================================================
# SERVICE IMPORTS - FAIL FAST (No defensive try/except)
# =============================================================================
# Database connection
from services.db import connect_db, disconnect_db

# NOTE: Background task scheduling is now handled by Celery workers.
# See services/celery_app.py and services/tasks.py
# Start workers with: celery -A services.celery_app worker --beat --loglevel=info

logger.info("Core services imported successfully")

# =============================================================================
# FASTAPI APP INITIALIZATION
# =============================================================================
app = FastAPI(
    title="LinkedIn Post Bot API",
    description="""
    AI-powered LinkedIn content automation API.
    
    ## Features
    - Generate LinkedIn posts from GitHub activity
    - Multiple AI writing templates (Standard, Build in Public, Thought Leadership, Job Search)
    - Post history and analytics
    - Image selection from Unsplash
    - Scheduled posting
    
    ## OpenAPI Documentation
    - OpenAPI JSON: `/openapi.json`
    - Interactive Docs (Swagger): `/docs`  
    - ReDoc: `/redoc`
    """,
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "LinkedIn Post Bot",
        "url": "https://github.com/cliff-de-tech/Linkedin-Post-Bot",
    },
    license_info={
        "name": "MIT",
    },
)

# =============================================================================
# GLOBAL EXCEPTION HANDLER
# =============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )

# =============================================================================
# DATABASE LIFECYCLE HOOKS
# =============================================================================
@app.on_event("startup")
async def startup():
    """Initialize database connection pool.
    
    Note: Schema is managed by Alembic migrations.
    Run 'alembic upgrade head' to apply migrations.
    
    Background Tasks: Scheduled post publishing is now handled by Celery.
    The API server no longer runs background loops - this improves:
    - Horizontal scaling (multiple API replicas without duplicate tasks)
    - Reliability (tasks survive API restarts)
    - Observability (Celery provides task monitoring)
    """
    await connect_db()
    logger.info("Application startup complete (Celery handles background tasks)")


@app.on_event("shutdown")
async def shutdown():
    """Close database connection pool."""
    await disconnect_db()
    logger.info("Application shutdown complete")

# =============================================================================
# CORS MIDDLEWARE
# =============================================================================
# Clean up CORS origins
cors_origins = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# ROUTER REGISTRATION
# =============================================================================
try:
    # Import existing routers
    from routes.auth import router as auth_router
    from routes.feedback import router as feedback_router
    from routes.posts import router as posts_router
    from routes.webhooks import router as webhooks_router
    from routes.settings import router as settings_router
    
    # Import new modular routers
    from routes.github import router as github_router, auth_router as github_auth_router
    from routes.linkedin import router as linkedin_router, auth_router as linkedin_auth_router
    
    # Import payment routers
    from routes.payments import router as payments_router, webhook_router as stripe_webhook_router
    
    # Mount API routers
    app.include_router(auth_router)
    app.include_router(feedback_router)
    app.include_router(posts_router)
    app.include_router(webhooks_router)
    app.include_router(settings_router)
    app.include_router(github_router)
    app.include_router(linkedin_router)
    app.include_router(payments_router)
    
    # Mount OAuth routers (no /api prefix)
    app.include_router(github_auth_router)
    app.include_router(linkedin_auth_router)
    
    # Mount Stripe webhook router (no /api prefix for Stripe callbacks)
    app.include_router(stripe_webhook_router)
    
    logger.info("All routers loaded successfully")
except ImportError as e:
    logger.error(f"Failed to load routers: {e}", exc_info=True)
    raise

# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================
@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# =============================================================================
# TEMPLATES ENDPOINT
# =============================================================================
@app.get("/api/templates", tags=["Templates"])
async def get_templates():
    """Get post templates."""
    return {"templates": TEMPLATES}


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
