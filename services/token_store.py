"""
Token Storage Service - Secure OAuth Token Management

Stores encrypted LinkedIn OAuth tokens and optional GitHub access tokens.

DATABASE SCHEMA (accounts table):
    id: INTEGER PRIMARY KEY
    user_id: TEXT - Clerk user ID (tenant isolation key)
    linkedin_user_urn: TEXT UNIQUE - LinkedIn person URN
    access_token: TEXT - Encrypted LinkedIn OAuth token
    refresh_token: TEXT - Encrypted OAuth refresh token (may be null)
    github_username: TEXT - GitHub username (public, not encrypted)
    github_access_token: TEXT - Encrypted GitHub PAT (optional, advanced)
    expires_at: INTEGER - Token expiry Unix timestamp
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
    - Database file must be excluded from version control (.gitignore)
"""

import sqlite3
import os
import time

from services.encryption import encrypt_value, decrypt_value, is_encrypted, mask_token

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
    Handles migrations for existing databases (adding new columns).
    
    SECURITY: Uses parameterized schema definition - no injection risk.
    """
    conn = get_conn()
    cur = conn.cursor()
    
    # Create table if it doesn't exist (with new schema)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        user_id TEXT,
        linkedin_user_urn TEXT UNIQUE,
        access_token TEXT,
        refresh_token TEXT,
        github_username TEXT,
        github_access_token TEXT,
        expires_at INTEGER,
        scopes TEXT,
        is_encrypted INTEGER DEFAULT 0
    )
    ''')
    
    # Migration: Add new columns if they don't exist
    # This handles databases created before Phase 2
    migrations = [
        ('user_id', 'TEXT'),
        ('github_username', 'TEXT'),
        ('github_access_token', 'TEXT'),
        ('scopes', 'TEXT'),
        ('is_encrypted', 'INTEGER DEFAULT 0'),
    ]
    
    for column_name, column_type in migrations:
        try:
            cur.execute(f'ALTER TABLE accounts ADD COLUMN {column_name} {column_type}')
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    conn.commit()
    conn.close()


def save_token(
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
        - Uses parameterized queries (? placeholders) to prevent SQL injection
        - Tokens are NEVER logged
        - is_encrypted flag set to 1 after encryption
    
    TENANT ISOLATION:
        - user_id must be provided for multi-tenant operation
        - Each user's tokens are isolated by their Clerk ID
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    # Encrypt sensitive tokens before storage
    encrypted_access = encrypt_value(access_token) if access_token else None
    encrypted_refresh = encrypt_value(refresh_token) if refresh_token else None
    encrypted_github = encrypt_value(github_access_token) if github_access_token else None
    
    # UPSERT pattern: Insert or update on conflict
    cur.execute('''
    INSERT INTO accounts (
        linkedin_user_urn, access_token, refresh_token, expires_at, 
        user_id, github_username, github_access_token, scopes, is_encrypted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(linkedin_user_urn) DO UPDATE SET
        access_token=excluded.access_token,
        refresh_token=excluded.refresh_token,
        expires_at=excluded.expires_at,
        user_id=excluded.user_id,
        github_username=excluded.github_username,
        github_access_token=excluded.github_access_token,
        scopes=excluded.scopes,
        is_encrypted=1
    ''', (
        linkedin_user_urn, encrypted_access, encrypted_refresh, expires_at,
        user_id, github_username, encrypted_github, scopes
    ))
    
    conn.commit()
    conn.close()


def _migrate_if_plaintext(row: dict) -> dict:
    """
    Auto-migrate plaintext tokens to encrypted on first access.
    
    Hardened implementation with atomic transaction support:
    1. Check if migration needed (is_encrypted != 1)
    2. Encrypt tokens in memory
    3. Perform atomic DB update with WHERE clause safety
    4. Return decrypted values for immediate use
    
    Args:
        row: Token row from database
        
    Returns:
        Row with decrypted tokens (ready to use)
        
    SECURITY: 
        - Atomic transaction ensures all-or-nothing migration
        - WHERE is_encrypted=0 clause prevents double-encryption race conditions
        - Returns usable plaintext tokens to the caller while ensuring storage is secured
    """
    if row.get('is_encrypted') == 1:
        # Already encrypted, just decrypt for use
        return {
            **row,
            'access_token': decrypt_value(row.get('access_token', '')),
            'refresh_token': decrypt_value(row.get('refresh_token', '')),
            'github_access_token': decrypt_value(row.get('github_access_token', '')),
        }
    
    # Legacy plaintext - migrate to encrypted
    # Only migrate if we have sensible data to encrypt
    if not is_encrypted(row.get('access_token', '')):
        try:
            # 1. Encrypt in memory first
            enc_access = encrypt_value(row.get('access_token', ''))
            enc_refresh = encrypt_value(row.get('refresh_token', '')) if row.get('refresh_token') else None
            enc_github = encrypt_value(row.get('github_access_token', '')) if row.get('github_access_token') else None
            
            # 2. Perform atomic update
            # We open a NEW connection to ensure isolation from any outer read transaction
            # (though SQLite default locking usually handles this, we want to be explicit)
            update_conn = get_conn()
            try:
                cur = update_conn.cursor()
                
                # Optimistic locking: Only update if still unencrypted
                cur.execute('''
                    UPDATE accounts 
                    SET access_token=?, refresh_token=?, github_access_token=?, is_encrypted=1
                    WHERE linkedin_user_urn=? AND (is_encrypted=0 OR is_encrypted IS NULL)
                ''', (
                    enc_access, 
                    enc_refresh, 
                    enc_github, 
                    row['linkedin_user_urn']
                ))
                
                if cur.rowcount > 0:
                    update_conn.commit()
                    # Migration successful
                else:
                    # No rows updated - likely another process beat us to it
                    # This is fine, we just return the row as-is (database is safe)
                    pass
                    
            except Exception as e:
                update_conn.rollback()
                # Log usage but don't crash app flow - return plaintext for this single request
                print(f"Token migration failed: {e}")
            finally:
                update_conn.close()
                
        except Exception as e:
            # Encryption failure (e.g., key missing in production)
            # This should have been caught earlier by encryption module, 
            # but as a final safety net, we catch it here.
            print(f"Encryption failed during migration: {e}")

    # Return the original plaintext values for this request so the app keeps working
    # (The DB is either updated to encrypted, or upgrade failed but we still have data)
    return row


def get_token_by_urn(linkedin_user_urn: str) -> dict | None:
    """
    Retrieve a token by LinkedIn URN with automatic decryption.
    
    Args:
        linkedin_user_urn: The LinkedIn person URN to look up
        
    Returns:
        Dict with decrypted token data if found, None otherwise
        
    SECURITY: 
        - Uses parameterized query to prevent SQL injection
        - Returns decrypted tokens for internal use only
        - Auto-migrates plaintext tokens to encrypted
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT linkedin_user_urn, access_token, refresh_token, expires_at, 
               user_id, github_username, github_access_token, scopes, is_encrypted
        FROM accounts WHERE linkedin_user_urn=?
    ''', (linkedin_user_urn,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    token_data = {
        'linkedin_user_urn': row[0],
        'access_token': row[1],
        'refresh_token': row[2],
        'expires_at': row[3],
        'user_id': row[4],
        'github_username': row[5],
        'github_access_token': row[6],
        'scopes': row[7],
        'is_encrypted': row[8]
    }
    
    return _migrate_if_plaintext(token_data)


def get_token_by_user_id(user_id: str) -> dict | None:
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
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    # TENANT ISOLATION: Query explicitly filters by user_id
    cur.execute('''
        SELECT linkedin_user_urn, access_token, refresh_token, expires_at, 
               user_id, github_username, github_access_token, scopes, is_encrypted
        FROM accounts WHERE user_id=?
    ''', (user_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    token_data = {
        'linkedin_user_urn': row[0],
        'access_token': row[1],
        'refresh_token': row[2],
        'expires_at': row[3],
        'user_id': row[4],
        'github_username': row[5],
        'github_access_token': row[6],
        'scopes': row[7],
        'is_encrypted': row[8]
    }
    
    return _migrate_if_plaintext(token_data)


def get_connection_status(user_id: str) -> dict:
    """
    Get connection status for a user without exposing tokens.
    
    This is safe to return to the frontend.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        Dict with connection status (no sensitive data)
        
    SECURITY: This function NEVER returns actual tokens.
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT linkedin_user_urn, github_username, expires_at, scopes
        FROM accounts WHERE user_id=?
    ''', (user_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return {
            'linkedin_connected': False,
            'github_connected': False,
        }
    
    return {
        'linkedin_connected': bool(row[0]),
        'linkedin_urn': row[0] or '',
        'github_connected': bool(row[1]),
        'github_username': row[1] or '',
        'token_expires_at': row[2],
        'scopes': row[3] or '',
    }


def save_github_token(user_id: str, github_username: str, github_access_token: str = None) -> bool:
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
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    # First check if user has a token record
    cur.execute('SELECT linkedin_user_urn FROM accounts WHERE user_id=?', (user_id,))
    row = cur.fetchone()
    
    if not row:
        # No LinkedIn token yet - can't save GitHub without LinkedIn first
        conn.close()
        return False
    
    linkedin_urn = row[0]
    
    # Encrypt GitHub token if provided
    encrypted_github = encrypt_value(github_access_token) if github_access_token else None
    
    # Update the existing record
    cur.execute('''
        UPDATE accounts 
        SET github_username=?, github_access_token=?
        WHERE user_id=?
    ''', (github_username, encrypted_github, user_id))
    
    conn.commit()
    conn.close()
    return True


def delete_token_by_user_id(user_id: str) -> bool:
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
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        # Delete the token record for this user
        cur.execute('DELETE FROM accounts WHERE user_id=?', (user_id,))
        deleted = cur.rowcount > 0
        conn.commit()
        return deleted
    except Exception as e:
        conn.rollback()
        print(f"Error deleting token: {e}")
        return False
    finally:
        conn.close()


def get_all_tokens() -> list[dict]:
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
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT linkedin_user_urn, access_token, refresh_token, expires_at,
               user_id, github_username, github_access_token, scopes, is_encrypted
        FROM accounts
    ''')
    rows = cur.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        token_data = {
            'linkedin_user_urn': r[0], 
            'access_token': r[1], 
            'refresh_token': r[2], 
            'expires_at': r[3],
            'user_id': r[4],
            'github_username': r[5],
            'github_access_token': r[6],
            'scopes': r[7],
            'is_encrypted': r[8]
        }
        results.append(_migrate_if_plaintext(token_data))
    
    return results


if __name__ == '__main__':
    # CLI initialization for development
    init_db()
    print(f'Initialized token DB at {DB_PATH}')
