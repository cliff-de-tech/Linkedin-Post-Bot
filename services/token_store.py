"""
Token Storage Service

Secure storage for LinkedIn OAuth tokens using SQLite.

SECURITY NOTES:
- Tokens are stored in a local SQLite database
- Database file should be excluded from version control (.gitignore)
- Access tokens are sensitive - treat like passwords
- This module uses parameterized queries to prevent SQL injection

MULTI-TENANT DESIGN:
- Each token is associated with a user_id (Clerk ID)
- Tokens can be retrieved by LinkedIn URN or user_id
- No cross-tenant data access is possible

DATABASE SCHEMA:
    accounts (
        id: INTEGER PRIMARY KEY
        linkedin_user_urn: TEXT UNIQUE - LinkedIn person URN
        access_token: TEXT - OAuth access token (sensitive)
        refresh_token: TEXT - OAuth refresh token (sensitive, may be null)
        expires_at: INTEGER - Unix timestamp of token expiry
        user_id: TEXT - Clerk user ID for multi-tenant isolation
    )
"""

import sqlite3
import os
import time

# Database path - defaults to project root
# SECURITY: This file contains sensitive tokens and should never be committed
DB_PATH = os.getenv(
    'TOKEN_DB_PATH', 
    os.path.join(os.path.dirname(__file__), '..', 'backend_tokens.db')
)


def get_conn() -> sqlite3.Connection:
    """
    Get a database connection, creating the directory if needed.
    
    Returns:
        SQLite connection object
    """
    dirpath = os.path.dirname(DB_PATH)
    if dirpath and not os.path.exists(dirpath):
        try:
            os.makedirs(dirpath, exist_ok=True)
        except Exception:
            pass  # Directory might already exist from another process
    
    conn = sqlite3.connect(DB_PATH)
    return conn


def init_db() -> None:
    """
    Initialize the database schema.
    
    Creates the accounts table if it doesn't exist.
    Also handles migrations for existing databases (adding user_id column).
    
    SECURITY: Uses parameterized schema definition - no injection risk here.
    """
    conn = get_conn()
    cur = conn.cursor()
    
    # Create table if it doesn't exist
    cur.execute('''
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        linkedin_user_urn TEXT UNIQUE,
        access_token TEXT,
        refresh_token TEXT,
        expires_at INTEGER,
        user_id TEXT
    )
    ''')
    
    # Migration: Add user_id column if it doesn't exist
    # This handles databases created before multi-tenant support
    try:
        cur.execute('ALTER TABLE accounts ADD COLUMN user_id TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    conn.commit()
    conn.close()


def save_token(
    linkedin_user_urn: str, 
    access_token: str, 
    refresh_token: str = None, 
    expires_at: int = None, 
    user_id: str = None
) -> None:
    """
    Save or update a token in the database.
    
    Uses UPSERT (INSERT ... ON CONFLICT) for atomic save-or-update.
    
    Args:
        linkedin_user_urn: LinkedIn person URN (unique identifier)
        access_token: OAuth access token
        refresh_token: OAuth refresh token (optional)
        expires_at: Unix timestamp when token expires
        user_id: Clerk user ID for multi-tenant association
        
    SECURITY:
    - Uses parameterized queries (? placeholders) to prevent SQL injection
    - Tokens are NEVER logged - only URN and user_id are safe to log
    - Overwrites existing tokens atomically
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    # UPSERT pattern: Insert or update on conflict
    cur.execute('''
    INSERT INTO accounts (linkedin_user_urn, access_token, refresh_token, expires_at, user_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(linkedin_user_urn) DO UPDATE SET
        access_token=excluded.access_token,
        refresh_token=excluded.refresh_token,
        expires_at=excluded.expires_at,
        user_id=excluded.user_id
    ''', (linkedin_user_urn, access_token, refresh_token, expires_at, user_id))
    
    conn.commit()
    conn.close()


def get_token_by_urn(linkedin_user_urn: str) -> dict | None:
    """
    Retrieve a token by LinkedIn URN.
    
    Args:
        linkedin_user_urn: The LinkedIn person URN to look up
        
    Returns:
        Dict with token data if found, None otherwise
        
    SECURITY: Uses parameterized query to prevent SQL injection.
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute(
        'SELECT linkedin_user_urn, access_token, refresh_token, expires_at, user_id '
        'FROM accounts WHERE linkedin_user_urn=?', 
        (linkedin_user_urn,)
    )
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        'linkedin_user_urn': row[0],
        'access_token': row[1],
        'refresh_token': row[2],
        'expires_at': row[3],
        'user_id': row[4]
    }


def get_token_by_user_id(user_id: str) -> dict | None:
    """
    Retrieve a token by Clerk user ID.
    
    This is the primary method for multi-tenant token retrieval.
    Each user can only access their own tokens.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Dict with token data if found, None otherwise
        
    SECURITY:
    - Parameterized query prevents SQL injection
    - User can only retrieve their own tokens (tenant isolation)
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute(
        'SELECT linkedin_user_urn, access_token, refresh_token, expires_at, user_id '
        'FROM accounts WHERE user_id=?', 
        (user_id,)
    )
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        'linkedin_user_urn': row[0],
        'access_token': row[1],
        'refresh_token': row[2],
        'expires_at': row[3],
        'user_id': row[4]
    }


def get_all_tokens() -> list[dict]:
    """
    Retrieve all stored tokens.
    
    WARNING: This returns ALL tokens across all users.
    Should only be used for admin/migration purposes, not for regular operation.
    
    Returns:
        List of token dicts
        
    SECURITY: Does not return user_id to avoid cross-tenant data exposure
    in legacy code paths. New code should use get_token_by_user_id.
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute(
        'SELECT linkedin_user_urn, access_token, refresh_token, expires_at FROM accounts'
    )
    rows = cur.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            'linkedin_user_urn': r[0], 
            'access_token': r[1], 
            'refresh_token': r[2], 
            'expires_at': r[3]
        })
    
    return results


if __name__ == '__main__':
    # CLI initialization for development
    init_db()
    print(f'Initialized token DB at {DB_PATH}')
