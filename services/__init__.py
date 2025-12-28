"""
Services Package - Centralized Exports

This module defines the public API for the services package.
Import functions from here to ensure you're using the correct names.

Usage:
    from services import post_to_linkedin, get_token_by_user_id

Benefits:
    - Single source of truth for exports
    - IDE autocomplete shows available functions
    - Import errors caught immediately at module load
    - Prevents importing non-existent functions
"""

# =============================================================================
# LinkedIn Service
# =============================================================================
from services.linkedin_service import (
    post_to_linkedin,
    upload_image_to_linkedin,
)

# =============================================================================
# Token Store - Authentication & Token Management
# =============================================================================
from services.token_store import (
    save_token,
    get_token_by_urn,
    get_token_by_user_id,
    get_connection_status,
    save_github_token,
    delete_token_by_user_id,
)

# =============================================================================
# Database
# =============================================================================
from services.db import get_database, DatabaseWrapper

# =============================================================================
# User Settings
# =============================================================================
from services.user_settings import (
    get_user_settings,
    save_user_settings,
)

# =============================================================================
# Post History
# =============================================================================
from services.post_history import (
    save_post,
    get_user_posts,
    get_user_stats,
    get_user_usage,
)

# =============================================================================
# GitHub Activity
# =============================================================================
from services.github_activity import (
    get_user_activity,
    get_github_stats,
    get_recent_repo_updates,
)

# =============================================================================
# AI Service
# =============================================================================
from services.ai_service import generate_post_with_ai

# =============================================================================
# Persona Service
# =============================================================================
from services.persona_service import (
    get_user_persona,
    save_user_persona,
    build_persona_prompt,
    build_full_persona_context,
    refresh_learned_patterns,
)

# =============================================================================
# Persona Analyzer
# =============================================================================
from services.persona_analyzer import (
    analyze_writing_style,
    update_learned_patterns,
    build_style_context,
)

# =============================================================================
# Scheduler
# =============================================================================
from services.scheduler import (
    start_scheduler,
    start_scheduler_async,
    stop_scheduler,
)

# =============================================================================
# Scheduled Posts
# =============================================================================
from services.scheduled_posts import (
    schedule_post,
    get_scheduled_posts,
    cancel_scheduled_post,
    get_due_posts,
    update_post_status,
)

# =============================================================================
# Encryption
# =============================================================================
from services.encryption import (
    encrypt_value,
    decrypt_value,
    mask_token,
)

# Define public API
__all__ = [
    # LinkedIn
    'post_to_linkedin',
    'upload_image_to_linkedin',
    # Token Store
    'save_token',
    'get_token_by_urn',
    'get_token_by_user_id',
    'get_connection_status',
    'save_github_token',
    'delete_token_by_user_id',
    # Database
    'get_database',
    'DatabaseWrapper',
    # User Settings
    'get_user_settings',
    'save_user_settings',
    # Post History
    'save_post',
    'get_user_posts',
    'get_user_stats',
    'get_user_usage',
    # GitHub
    'get_user_activity',
    'get_github_stats',
    'get_recent_repo_updates',
    # AI
    'generate_post_with_ai',
    # Persona
    'get_user_persona',
    'save_user_persona',
    'build_persona_prompt',
    'build_full_persona_context',
    'refresh_learned_patterns',
    # Persona Analyzer
    'analyze_writing_style',
    'update_learned_patterns',
    'build_style_context',
    # Scheduler
    'start_scheduler',
    'start_scheduler_async',
    'stop_scheduler',
    # Scheduled Posts
    'schedule_post',
    'get_scheduled_posts',
    'cancel_scheduled_post',
    'get_due_posts',
    'update_post_status',
    # Encryption
    'encrypt_value',
    'decrypt_value',
    'mask_token',
]
