"""
User Settings Storage Service - Preferences Only (PostgreSQL Async)

Stores per-user preferences, onboarding state, and connection status.

IMPORTANT - NO SECRETS STORED HERE:
    This module does NOT store any sensitive credentials.
    All tokens and secrets are stored in token_store.py with encryption.
    
    The following are stored in ENV ONLY (never in DB):
    - GROQ_API_KEY
    - LINKEDIN_CLIENT_SECRET  
    - UNSPLASH_ACCESS_KEY
    - GITHUB_TOKEN

WHAT IS STORED HERE:
    - user_id: Clerk user ID (tenant isolation key)
    - github_username: Public GitHub username
    - preferences: JSON blob for UI preferences
    - persona: JSON blob for AI writing persona
    - onboarding_complete: Boolean flag
    - subscription_tier: 'free' | 'pro' | 'enterprise'
    - subscription_status: 'active' | 'cancelled' | 'expired'
    - created_at / updated_at: Timestamps

MULTI-TENANT ISOLATION:
    - All queries filter by user_id (Clerk ID)
    - No cross-tenant data access is possible
    - Uses parameterized queries to prevent SQL injection
"""

import json
import time
import logging
from services.db import get_database

logger = logging.getLogger(__name__)


async def save_user_settings(user_id: str, settings: dict) -> None:
    """
    Save or update user preferences.
    
    Args:
        user_id: Clerk user ID
        settings: Dict containing preferences to save
        
    Accepted fields:
        - github_username: Public GitHub username
        - preferences: Dict of UI preferences
        - persona: Dict of AI writing persona settings
        - onboarding_complete: Boolean
        - subscription_tier: 'free' | 'pro' | 'enterprise'
        - subscription_status: 'active' | 'cancelled' | 'expired'
        
    SECURITY: No secrets should be passed to this function.
    
    TENANT ISOLATION:
        - Settings are saved scoped to user_id
        - Each user can only modify their own settings
    """
    db = get_database()
    timestamp = int(time.time())
    
    # Get existing settings to merge
    existing = await get_user_settings(user_id) or {}
    
    # Merge fields (only update if provided)
    def merge_field(key, default=None):
        new_val = settings.get(key)
        if new_val is not None:
            return new_val
        return existing.get(key, default)
    
    merged = {
        'github_username': merge_field('github_username', ''),
        'preferences': settings.get('preferences') or existing.get('preferences') or {},
        'persona': settings.get('persona') or existing.get('persona') or {},
        'onboarding_complete': merge_field('onboarding_complete', 0),
        'subscription_tier': merge_field('subscription_tier', 'free'),
        'subscription_status': merge_field('subscription_status', 'active'),
    }
    
    # Convert dicts to JSON
    preferences_json = json.dumps(merged['preferences']) if isinstance(merged['preferences'], dict) else merged['preferences']
    persona_json = json.dumps(merged['persona']) if isinstance(merged['persona'], dict) else merged['persona']
    
    await db.execute("""
        INSERT INTO user_settings 
        (user_id, github_username, preferences, persona, onboarding_complete, 
         subscription_tier, subscription_status, updated_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT(user_id) DO UPDATE SET
            github_username = EXCLUDED.github_username,
            preferences = EXCLUDED.preferences,
            persona = EXCLUDED.persona,
            onboarding_complete = EXCLUDED.onboarding_complete,
            subscription_tier = EXCLUDED.subscription_tier,
            subscription_status = EXCLUDED.subscription_status,
            updated_at = EXCLUDED.updated_at
    """, [
        user_id,
        merged['github_username'],
        preferences_json,
        persona_json,
        1 if merged['onboarding_complete'] else 0,
        merged['subscription_tier'],
        merged['subscription_status'],
        timestamp,
        existing.get('created_at', timestamp)
    ])


async def get_user_settings(user_id: str) -> dict | None:
    """
    Get user preferences by Clerk user ID.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Dict with user preferences, or None if not found
        
    TENANT ISOLATION:
        - Query explicitly filters by user_id
        - User can only retrieve their own settings
    """
    db = get_database()
    
    row = await db.fetch_one(
        "SELECT * FROM user_settings WHERE user_id = $1", 
        [user_id]
    )
    
    if not row:
        return None
    
    row_dict = dict(row)
    
    # Parse preferences JSON
    preferences_raw = row_dict.get('preferences', '{}')
    try:
        preferences = json.loads(preferences_raw) if preferences_raw else {}
    except json.JSONDecodeError:
        preferences = {}
    
    # Parse persona JSON
    persona_raw = row_dict.get('persona', '{}')
    try:
        persona = json.loads(persona_raw) if persona_raw else {}
    except json.JSONDecodeError:
        persona = {}
    
    return {
        'user_id': row_dict.get('user_id'),
        'github_username': row_dict.get('github_username', ''),
        'preferences': preferences,
        'persona': persona,
        'onboarding_complete': bool(row_dict.get('onboarding_complete', 0)),
        'subscription_tier': row_dict.get('subscription_tier', 'free'),
        'subscription_status': row_dict.get('subscription_status', 'active'),
        'subscription_expires_at': row_dict.get('subscription_expires_at'),
        'created_at': row_dict.get('created_at'),
        'updated_at': row_dict.get('updated_at')
    }


async def mark_onboarding_complete(user_id: str) -> None:
    """Mark user's onboarding as complete."""
    await save_user_settings(user_id, {'onboarding_complete': True})


async def get_subscription_info(user_id: str) -> dict:
    """
    Get subscription info for a user (safe for frontend).
    
    Returns:
        Dict with subscription tier and status
    """
    settings = await get_user_settings(user_id)
    if not settings:
        return {
            'tier': 'free',
            'status': 'active',
            'expires_at': None
        }
    
    return {
        'tier': settings.get('subscription_tier', 'free'),
        'status': settings.get('subscription_status', 'active'),
        'expires_at': settings.get('subscription_expires_at')
    }
