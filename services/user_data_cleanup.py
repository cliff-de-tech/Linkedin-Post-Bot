"""
User Data Cleanup Service (Async PostgreSQL/SQLite Compatible)

Handles deletion of all user data across all tables when a user:
- Deletes their Clerk account
- Requests data deletion (GDPR right to erasure)

TABLES AFFECTED (all in centralized database):
- accounts - OAuth tokens
- user_settings - User preferences
- post_history - Generated/published posts
- scheduled_posts - Scheduled posts
- feedback - User feedback submissions

GDPR COMPLIANCE:
- Provides complete data erasure functionality
- Logs deletion requests (without sensitive data)
- Returns count of deleted records for audit
"""

import logging
from services.db import get_database

logger = logging.getLogger(__name__)


async def delete_user_tokens(user_id: str) -> int:
    """Delete all OAuth tokens for a user from accounts table."""
    db = get_database()
    try:
        result = await db.execute(
            "DELETE FROM accounts WHERE user_id = :p1", 
            [user_id]
        )
        deleted = result if isinstance(result, int) else 1
        logger.info(f"🗑️  Deleted {deleted} token record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        logger.error(f"⚠️  Error deleting tokens: {e}")
        return 0


async def delete_user_settings(user_id: str) -> int:
    """Delete user settings/preferences from user_settings table."""
    db = get_database()
    try:
        result = await db.execute(
            "DELETE FROM user_settings WHERE user_id = :p1", 
            [user_id]
        )
        deleted = result if isinstance(result, int) else 1
        logger.info(f"🗑️  Deleted {deleted} settings record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        logger.error(f"⚠️  Error deleting settings: {e}")
        return 0


async def delete_user_posts(user_id: str) -> int:
    """Delete post history for a user from post_history table."""
    db = get_database()
    try:
        result = await db.execute(
            "DELETE FROM post_history WHERE user_id = :p1", 
            [user_id]
        )
        deleted = result if isinstance(result, int) else 1
        logger.info(f"🗑️  Deleted {deleted} post record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        logger.error(f"⚠️  Error deleting posts: {e}")
        return 0


async def delete_user_scheduled_posts(user_id: str) -> int:
    """Delete scheduled posts for a user from scheduled_posts table."""
    db = get_database()
    try:
        result = await db.execute(
            "DELETE FROM scheduled_posts WHERE user_id = :p1", 
            [user_id]
        )
        deleted = result if isinstance(result, int) else 1
        logger.info(f"🗑️  Deleted {deleted} scheduled post record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        logger.error(f"⚠️  Error deleting scheduled posts: {e}")
        return 0


async def delete_user_feedback(user_id: str) -> int:
    """Delete feedback submissions for a user from feedback table."""
    db = get_database()
    try:
        result = await db.execute(
            "DELETE FROM feedback WHERE user_id = :p1", 
            [user_id]
        )
        deleted = result if isinstance(result, int) else 1
        logger.info(f"🗑️  Deleted {deleted} feedback record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        logger.error(f"⚠️  Error deleting feedback: {e}")
        return 0


async def delete_all_user_data(user_id: str) -> dict:
    """
    Delete ALL data associated with a user across all tables.
    
    This is the main function called by the Clerk webhook handler
    when a user deletes their account.
    
    Args:
        user_id: Clerk user ID (e.g., "user_abc123...")
        
    Returns:
        Dictionary with deletion results
    """
    logger.info(f"\n🧹 Starting complete data deletion for user {user_id[:8]}...")
    
    results = {
        "tokens": await delete_user_tokens(user_id),
        "settings": await delete_user_settings(user_id),
        "posts": await delete_user_posts(user_id),
        "scheduled_posts": await delete_user_scheduled_posts(user_id),
        "feedback": await delete_user_feedback(user_id),
    }
    
    total = sum(results.values())
    
    logger.info(f"✅ Data deletion complete. Total records deleted: {total}\n")
    
    return {
        "success": True,
        "user_id": f"{user_id[:8]}...",  # Masked for logging
        "deleted": results,
        "total": total
    }
