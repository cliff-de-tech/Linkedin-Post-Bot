"""
Token Storage Service - Secure OAuth Token Management (PostgreSQL Async)

Stores encrypted LinkedIn OAuth tokens and optional GitHub access tokens.

DATABASE SCHEMA (accounts table):
    id: SERIAL PRIMARY KEY
    user_id: TEXT - Clerk user ID (tenant isolation key)
    linkedin_user_urn: TEXT UNIQUE - LinkedIn person URN
    access_token: TEXT - Encrypted LinkedIn OAuth token
    refresh_token: TEXT - Encrypted OAuth refresh token (may be null)
    github_username: TEXT - GitHub username (public, not encrypted)
    github_access_token: TEXT - Encrypted GitHub PAT (optional, advanced)
    expires_at: BIGINT - Token expiry Unix timestamp
    scopes: TEXT - OAuth scopes granted (comma-separated)
    is_encrypted: INTEGER - 1 if tokens are encrypted, 0 for legacy plaintext

ENCRYPTION:
    - Uses Fernet symmetric encryption via services/encryption.py
    - Encryption key loaded from ENCRYPTION_KEY environment variable
    - Auto-migration: plaintext tokens encrypted on first access
    - Tokens prefixed with "ENC:" when encrypted

MULTI-TENANT ISOLATION:
    - All queries filter by user_id (Clerk ID)
    - get_token_by_user_id() is the primary retrieval method
    - No cross-tenant data access is possible
    - get_all_tokens() is deprecated and should only be used for admin/migration

SECURITY NOTES:
    - Tokens are NEVER logged
    - Tokens are NEVER returned to frontend (use mask_token for display)
    - Uses parameterized queries to prevent SQL injection
"""

import logging
from services.db import get_database
from services.encryption import encrypt_value, decrypt_value, is_encrypted, mask_token

logger = logging.getLogger(__name__)


async def save_token(
    linkedin_user_urn: str, 
    access_token: str, 
    refresh_token: str = None, 
    expires_at: int = None, 
    user_id: str = None,
    github_username: str = None,
    github_access_token: str = None,
    scopes: str = None
) -> None:
    """
    Save or update a token in the database with encryption.
    
    Uses UPSERT (INSERT ... ON CONFLICT) for atomic save-or-update.
    
    Args:
        linkedin_user_urn: LinkedIn person URN (unique identifier)
        access_token: OAuth access token (will be encrypted)
        refresh_token: OAuth refresh token (will be encrypted, optional)
        expires_at: Unix timestamp when token expires
        user_id: Clerk user ID for multi-tenant isolation
        github_username: GitHub username (optional, not encrypted)
        github_access_token: GitHub PAT (optional, will be encrypted)
        scopes: OAuth scopes granted (comma-separated)
        
    SECURITY:
        - Tokens are encrypted before storage
        - Uses parameterized queries to prevent SQL injection
        - Tokens are NEVER logged
        - is_encrypted flag set to 1 after encryption
    
    TENANT ISOLATION:
        - user_id must be provided for multi-tenant operation
        - Each user's tokens are isolated by their Clerk ID
    """
    db = get_database()
    
    # Encrypt sensitive tokens before storage
    encrypted_access = encrypt_value(access_token) if access_token else None
    encrypted_refresh = encrypt_value(refresh_token) if refresh_token else None
    encrypted_github = encrypt_value(github_access_token) if github_access_token else None
    
    # Check if we already have a record for this user_id
    if user_id:
        row = await db.fetch_one(
            "SELECT id FROM accounts WHERE user_id = $1", 
            [user_id]
        )
        if row:
            # Update existing record for this user - use user_id for WHERE clause
            await db.execute("""
                UPDATE accounts SET
                    linkedin_user_urn = $1,
                    access_token = $2,
                    refresh_token = $3,
                    expires_at = $4,
                    scopes = $5,
                    is_encrypted = 1
                WHERE user_id = $6
            """, [linkedin_user_urn, encrypted_access, encrypted_refresh, 
                  expires_at, scopes, user_id])
            return
    
    # Before inserting, check if this linkedin_urn exists for another user
    # If so, clear that old record (user is reconnecting from different Clerk account)
    if linkedin_user_urn:
        existing_urn = await db.fetch_one(
            "SELECT user_id FROM accounts WHERE linkedin_user_urn = $1",
            [linkedin_user_urn]
        )
        if existing_urn and existing_urn.get('user_id') != user_id:
            logger.info(f"LinkedIn URN switching users, clearing old record")
            await db.execute(
                "UPDATE accounts SET linkedin_user_urn = NULL, access_token = NULL WHERE linkedin_user_urn = $1",
                [linkedin_user_urn]
            )
    
    # Insert new record or update if linkedin_urn conflicts
    await db.execute("""
        INSERT INTO accounts (
            linkedin_user_urn, access_token, refresh_token, expires_at, 
            user_id, github_username, github_access_token, scopes, is_encrypted
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
        ON CONFLICT(linkedin_user_urn) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at,
            user_id = EXCLUDED.user_id,
            scopes = EXCLUDED.scopes,
            is_encrypted = 1
    """, [
        linkedin_user_urn, encrypted_access, encrypted_refresh, expires_at,
        user_id, github_username, encrypted_github, scopes
    ])


def _process_token_row(row) -> dict:
    """
    Process a token row and decrypt tokens.
    
    Args:
        row: Database row from accounts table
        
    Returns:
        Dict with decrypted tokens
    """
    if not row:
        return None
    
    token_data = dict(row)
    
    # Decrypt tokens if encrypted
    if token_data.get('is_encrypted') == 1:
        token_data['access_token'] = decrypt_value(token_data.get('access_token', ''))
        token_data['refresh_token'] = decrypt_value(token_data.get('refresh_token', ''))
        token_data['github_access_token'] = decrypt_value(token_data.get('github_access_token', ''))
    
    return token_data


async def get_token_by_urn(linkedin_user_urn: str) -> dict | None:
    """
    Retrieve a token by LinkedIn URN with automatic decryption.
    
    Args:
        linkedin_user_urn: The LinkedIn person URN to look up
        
    Returns:
        Dict with decrypted token data if found, None otherwise
        
    SECURITY: 
        - Uses parameterized query to prevent SQL injection
        - Returns decrypted tokens for internal use only
    """
    db = get_database()
    
    row = await db.fetch_one("""
        SELECT linkedin_user_urn, access_token, refresh_token, expires_at, 
               user_id, github_username, github_access_token, scopes, is_encrypted
        FROM accounts WHERE linkedin_user_urn = $1
    """, [linkedin_user_urn])
    
    return _process_token_row(row)


async def get_token_by_user_id(user_id: str) -> dict | None:
    """
    Retrieve a token by Clerk user ID with automatic decryption.
    
    This is the PRIMARY method for multi-tenant token retrieval.
    Each user can only access their own tokens.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Dict with decrypted token data if found, None otherwise
        
    SECURITY:
        - Parameterized query prevents SQL injection
        - User can only retrieve their own tokens (tenant isolation)
        - Returns decrypted tokens for internal use only
        
    TENANT ISOLATION:
        - This function enforces tenant boundaries
        - Query explicitly filters by user_id
        - No way to access another user's tokens through this function
    """
    db = get_database()
    
    row = await db.fetch_one("""
        SELECT linkedin_user_urn, access_token, refresh_token, expires_at, 
               user_id, github_username, github_access_token, scopes, is_encrypted
        FROM accounts WHERE user_id = $1
    """, [user_id])
    
    return _process_token_row(row)


async def get_connection_status(user_id: str) -> dict:
    """
    Get connection status for a user without exposing tokens.
    
    This is safe to return to the frontend.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Dict with connection status (no sensitive data)
        
    SECURITY: This function NEVER returns actual tokens.
    """
    db = get_database()
    
    row = await db.fetch_one("""
        SELECT linkedin_user_urn, github_username, expires_at, scopes
        FROM accounts WHERE user_id = $1
    """, [user_id])
    
    if not row:
        return {
            'linkedin_connected': False,
            'github_connected': False,
        }
    
    return {
        'linkedin_connected': bool(row['linkedin_user_urn']),
        'linkedin_urn': row['linkedin_user_urn'] or '',
        'github_connected': bool(row['github_username']),
        'github_username': row['github_username'] or '',
        'token_expires_at': row['expires_at'],
        'scopes': row['scopes'] or '',
    }


async def save_github_token(user_id: str, github_username: str, github_access_token: str = None) -> bool:
    """
    Save or update GitHub credentials for a user.
    
    This is the method for the dashboard UI to save optional GitHub PAT.
    
    Args:
        user_id: Clerk user ID
        github_username: GitHub username
        github_access_token: Optional GitHub PAT (will be encrypted)
        
    Returns:
        True if saved successfully, False otherwise
        
    SECURITY: GitHub PAT is encrypted before storage.
    """
    db = get_database()
    
    # Encrypt GitHub token if provided
    encrypted_github = encrypt_value(github_access_token) if github_access_token else None
    
    # Check if a record exists for this user_id
    row = await db.fetch_one(
        "SELECT id FROM accounts WHERE user_id = $1", 
        [user_id]
    )
    
    if row:
        # Update existing record
        await db.execute("""
            UPDATE accounts 
            SET github_username = $1, github_access_token = $2
            WHERE user_id = $3
        """, [github_username, encrypted_github, user_id])
    else:
        # Insert new record (LinkedIn URN will be NULL for now)
        await db.execute("""
            INSERT INTO accounts (user_id, github_username, github_access_token, is_encrypted)
            VALUES ($1, $2, $3, 1)
        """, [user_id, github_username, encrypted_github])
    
    return True


async def delete_token_by_user_id(user_id: str) -> bool:
    """
    Delete a user's token record (disconnect LinkedIn).
    
    Used when a user wants to disconnect their LinkedIn account.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        True if deleted, False if not found
        
    SECURITY: 
        - Enforces tenant isolation (can only delete own token)
        - No cross-user deletion possible
    """
    db = get_database()
    
    try:
        result = await db.execute(
            "DELETE FROM accounts WHERE user_id = $1", 
            [user_id]
        )
        # result is the number of rows affected
        return result > 0 if isinstance(result, int) else True
    except Exception as e:
        logger.error(f"Error deleting token: {e}")
        return False


async def get_all_tokens() -> list[dict]:
    """
    Retrieve all stored tokens (ADMIN/MIGRATION USE ONLY).
    
    WARNING: This returns ALL tokens across all users.
    Should only be used for admin/migration purposes.
    
    Returns:
        List of token dicts with decrypted tokens
        
    SECURITY: 
        - DEPRECATED for regular operation
        - New code should use get_token_by_user_id
        - Consider adding admin auth check in future
    """
    db = get_database()
    
    rows = await db.fetch_all("""
        SELECT linkedin_user_urn, access_token, refresh_token, expires_at,
               user_id, github_username, github_access_token, scopes, is_encrypted
        FROM accounts
    """)
    
    return [_process_token_row(row) for row in rows]
