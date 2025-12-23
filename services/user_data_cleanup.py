"""
User Data Cleanup Service

Handles deletion of all user data across databases when a user:
- Deletes their Clerk account
- Requests data deletion (GDPR right to erasure)

DATABASES AFFECTED:
- backend_tokens.db (accounts table) - OAuth tokens
- user_settings.db (settings table) - User preferences
- post_history.db (posts table) - Generated/published posts
- feedback.db (feedback table) - User feedback submissions

GDPR COMPLIANCE:
- Provides complete data erasure functionality
- Logs deletion requests (without sensitive data)
- Returns count of deleted records for audit
"""

import os
import sqlite3
from typing import Dict, Any

# Database paths (same as other services)
TOKEN_DB_PATH = os.getenv(
    'TOKEN_DB_PATH', 
    os.path.join(os.path.dirname(__file__), '..', 'backend_tokens.db')
)

SETTINGS_DB_PATH = os.getenv(
    'USER_SETTINGS_DB_PATH',
    os.path.join(os.path.dirname(__file__), '..', 'user_settings.db')
)

POST_HISTORY_DB_PATH = os.getenv(
    'POST_HISTORY_DB_PATH',
    os.path.join(os.path.dirname(__file__), '..', 'post_history.db')
)

FEEDBACK_DB_PATH = os.getenv(
    'FEEDBACK_DB_PATH',
    os.path.join(os.path.dirname(__file__), '..', 'feedback.db')
)


def delete_user_tokens(user_id: str) -> int:
    """
    Delete all OAuth tokens for a user.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Number of records deleted
    """
    if not os.path.exists(TOKEN_DB_PATH):
        return 0
    
    try:
        conn = sqlite3.connect(TOKEN_DB_PATH)
        cur = conn.cursor()
        
        cur.execute('DELETE FROM accounts WHERE user_id = ?', (user_id,))
        deleted = cur.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"🗑️  Deleted {deleted} token record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        print(f"⚠️  Error deleting tokens: {e}")
        return 0


def delete_user_settings(user_id: str) -> int:
    """
    Delete user settings/preferences.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Number of records deleted
    """
    if not os.path.exists(SETTINGS_DB_PATH):
        return 0
    
    try:
        conn = sqlite3.connect(SETTINGS_DB_PATH)
        cur = conn.cursor()
        
        cur.execute('DELETE FROM settings WHERE user_id = ?', (user_id,))
        deleted = cur.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"🗑️  Deleted {deleted} settings record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        print(f"⚠️  Error deleting settings: {e}")
        return 0


def delete_user_posts(user_id: str) -> int:
    """
    Delete post generation history for a user.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Number of records deleted
    """
    if not os.path.exists(POST_HISTORY_DB_PATH):
        return 0
    
    try:
        conn = sqlite3.connect(POST_HISTORY_DB_PATH)
        cur = conn.cursor()
        
        cur.execute('DELETE FROM posts WHERE user_id = ?', (user_id,))
        deleted = cur.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"🗑️  Deleted {deleted} post record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        print(f"⚠️  Error deleting posts: {e}")
        return 0


def delete_user_feedback(user_id: str) -> int:
    """
    Delete feedback submissions for a user.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Number of records deleted
    """
    if not os.path.exists(FEEDBACK_DB_PATH):
        return 0
    
    try:
        conn = sqlite3.connect(FEEDBACK_DB_PATH)
        cur = conn.cursor()
        
        cur.execute('DELETE FROM feedback WHERE user_id = ?', (user_id,))
        deleted = cur.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"🗑️  Deleted {deleted} feedback record(s) for user {user_id[:8]}...")
        return deleted
    except Exception as e:
        print(f"⚠️  Error deleting feedback: {e}")
        return 0


def delete_all_user_data(user_id: str) -> Dict[str, Any]:
    """
    Delete ALL data associated with a user across all databases.
    
    This is the main function called by the Clerk webhook handler
    when a user deletes their account.
    
    Args:
        user_id: Clerk user ID (e.g., "user_abc123...")
        
    Returns:
        Dictionary with deletion results:
        {
            "success": bool,
            "user_id": str (masked),
            "deleted": {
                "tokens": int,
                "settings": int,
                "posts": int,
                "feedback": int
            },
            "total": int
        }
    """
    print(f"\n🧹 Starting complete data deletion for user {user_id[:8]}...")
    
    results = {
        "tokens": delete_user_tokens(user_id),
        "settings": delete_user_settings(user_id),
        "posts": delete_user_posts(user_id),
        "feedback": delete_user_feedback(user_id),
    }
    
    total = sum(results.values())
    
    print(f"✅ Data deletion complete. Total records deleted: {total}\n")
    
    return {
        "success": True,
        "user_id": f"{user_id[:8]}...",  # Masked for logging
        "deleted": results,
        "total": total
    }
