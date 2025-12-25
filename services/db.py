"""
Centralized async PostgreSQL connection pool.
Single source of truth for database schema and connections.

This module handles:
- Database connection pooling via asyncpg
- Automatic postgres:// -> postgresql:// URL conversion (Heroku/Render compatibility)
- Consolidated schema definition for all tables
- Startup/shutdown lifecycle hooks

Environment Variables:
    DATABASE_URL: PostgreSQL connection string (required in production)
                  Format: postgresql://user:password@host:5432/dbname
    
    If DATABASE_URL is not set, the app will fail fast with RuntimeError.
"""
import os
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# DATABASE CONNECTION
# =============================================================================

DATABASE_URL = os.getenv("DATABASE_URL")

# For local development, allow SQLite fallback (will be handled differently)
# In production, DATABASE_URL is REQUIRED
if not DATABASE_URL:
    # Check if we're in production (common indicators)
    if os.getenv("RENDER") or os.getenv("HEROKU") or os.getenv("PRODUCTION"):
        raise RuntimeError(
            "DATABASE_URL environment variable is required in production. "
            "Please configure your PostgreSQL connection string."
        )
    else:
        # Local development fallback - warn but don't crash
        logger.warning(
            "DATABASE_URL not set. Using SQLite fallback for local development. "
            "Set DATABASE_URL for PostgreSQL in production."
        )
        DATABASE_URL = "sqlite:///./dev_database.db"

# Handle Heroku/Render postgres:// -> postgresql:// URL conversion
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Detect if we're using SQLite
IS_SQLITE = DATABASE_URL and DATABASE_URL.startswith("sqlite")

# Lazy import to avoid issues if databases package not installed
database = None
_wrapper = None


def _convert_query_for_sqlite(query: str, params: list) -> tuple:
    """
    Convert PostgreSQL-style $1, $2 placeholders to SQLite-compatible :p1, :p2 named params.
    
    Args:
        query: SQL query with $1, $2, ... placeholders
        params: List of parameter values
        
    Returns:
        Tuple of (converted_query, params_dict)
    """
    import re
    
    if not params:
        return query, {}
    
    # Convert $1, $2, etc. to :p1, :p2, etc.
    converted_query = query
    params_dict = {}
    
    # Find all $N placeholders and replace them
    for i, value in enumerate(params, 1):
        placeholder = f"${i}"
        named_param = f":p{i}"
        converted_query = converted_query.replace(placeholder, named_param)
        params_dict[f"p{i}"] = value
    
    return converted_query, params_dict


class DatabaseWrapper:
    """
    Wrapper around the databases.Database class that handles
    PostgreSQL/SQLite parameter compatibility.
    
    All services use PostgreSQL-style $1 placeholders, but when running
    locally with SQLite, this wrapper converts them to named params.
    """
    
    def __init__(self, db):
        self._db = db
        self._is_sqlite = IS_SQLITE
    
    @property
    def is_connected(self):
        return self._db.is_connected
    
    async def connect(self):
        return await self._db.connect()
    
    async def disconnect(self):
        return await self._db.disconnect()
    
    async def execute(self, query: str, values: list = None):
        if self._is_sqlite and values:
            query, values = _convert_query_for_sqlite(query, values)
        return await self._db.execute(query=query, values=values)
    
    async def fetch_one(self, query: str, values: list = None):
        if self._is_sqlite and values:
            query, values = _convert_query_for_sqlite(query, values)
        return await self._db.fetch_one(query=query, values=values)
    
    async def fetch_all(self, query: str, values: list = None):
        if self._is_sqlite and values:
            query, values = _convert_query_for_sqlite(query, values)
        return await self._db.fetch_all(query=query, values=values)


def get_database():
    """Get the database instance, initializing if needed."""
    global database, _wrapper
    if database is None:
        from databases import Database
        database = Database(DATABASE_URL)
        _wrapper = DatabaseWrapper(database)
    return _wrapper


async def connect_db():
    """
    Connect to database. Call on app startup.
    
    This establishes the connection pool for async database operations.
    """
    db = get_database()
    if not db.is_connected:
        await db.connect()
        logger.info("Database connected successfully")


async def disconnect_db():
    """
    Disconnect from database. Call on app shutdown.
    
    This cleanly closes all connections in the pool.
    """
    db = get_database()
    if db.is_connected:
        await db.disconnect()
        logger.info("Database disconnected")


# =============================================================================
# SCHEMA DEFINITION - Single Source of Truth
# =============================================================================

async def init_tables():
    """
    Create all tables if they don't exist (PostgreSQL DDL).
    
    This consolidates all schema definitions from the scattered service files
    into a single location. Tables are created idempotently using
    CREATE TABLE IF NOT EXISTS.
    """
    db = get_database()
    
    # =========================================================================
    # TABLE: accounts (from token_store.py)
    # Stores OAuth tokens for LinkedIn and GitHub
    # =========================================================================
    await db.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            linkedin_user_urn TEXT UNIQUE,
            access_token TEXT,
            refresh_token TEXT,
            github_username TEXT,
            github_access_token TEXT,
            expires_at BIGINT,
            scopes TEXT,
            is_encrypted INTEGER DEFAULT 0
        )
    """)
    
    # =========================================================================
    # TABLE: user_settings (from user_settings.py)
    # Stores user preferences, onboarding state, subscription info
    # =========================================================================
    await db.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id SERIAL PRIMARY KEY,
            user_id TEXT UNIQUE,
            github_username TEXT,
            preferences TEXT DEFAULT '{}',
            onboarding_complete INTEGER DEFAULT 0,
            subscription_tier TEXT DEFAULT 'free',
            subscription_status TEXT DEFAULT 'active',
            subscription_expires_at BIGINT,
            created_at BIGINT,
            updated_at BIGINT
        )
    """)
    
    # =========================================================================
    # TABLE: post_history (from post_history.py)
    # Stores generated and published posts
    # =========================================================================
    await db.execute("""
        CREATE TABLE IF NOT EXISTS post_history (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            post_content TEXT,
            post_type TEXT,
            context TEXT,
            status TEXT,
            linkedin_post_id TEXT,
            engagement TEXT,
            created_at BIGINT,
            published_at BIGINT
        )
    """)
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_post_history_user ON post_history(user_id)"
    )
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_post_history_status ON post_history(user_id, status)"
    )
    
    # =========================================================================
    # TABLE: scheduled_posts (from scheduled_posts.py)
    # Stores posts scheduled for future publishing
    # =========================================================================
    await db.execute("""
        CREATE TABLE IF NOT EXISTS scheduled_posts (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            post_content TEXT NOT NULL,
            image_url TEXT,
            scheduled_time BIGINT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            created_at BIGINT NOT NULL,
            published_at BIGINT,
            UNIQUE(user_id, scheduled_time)
        )
    """)
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_posts(scheduled_time)"
    )
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_scheduled_user ON scheduled_posts(user_id)"
    )
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_posts(status)"
    )
    
    # =========================================================================
    # TABLE: feedback (from feedback.py)
    # Stores user feedback submissions
    # =========================================================================
    await db.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            rating INTEGER,
            liked TEXT,
            improvements TEXT,
            suggestions TEXT,
            created_at BIGINT NOT NULL,
            email_sent INTEGER DEFAULT 0
        )
    """)
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id, created_at DESC)"
    )
    
    # =========================================================================
    # TABLE: tickets (NEW - replaces JSON file storage in /api/contact)
    # Stores support ticket submissions
    # =========================================================================
    await db.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            recipient TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            created_at BIGINT
        )
    """)
    
    logger.info("Database tables initialized successfully")
