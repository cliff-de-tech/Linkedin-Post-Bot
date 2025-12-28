"""
Alembic Migration Environment

Configured for async PostgreSQL (asyncpg) with SQLite fallback for local dev.
"""
import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# =============================================================================
# PATH SETUP - Ensure backend directory is in Python path
# =============================================================================
backend_dir = Path(__file__).parent.parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# =============================================================================
# LOAD ENVIRONMENT VARIABLES
# =============================================================================
from dotenv import load_dotenv
load_dotenv(backend_dir.parent / '.env')

# =============================================================================
# ALEMBIC CONFIG
# =============================================================================
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# =============================================================================
# DATABASE URL CONFIGURATION
# =============================================================================
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local development fallback - use absolute path
    sqlite_path = backend_dir / "dev_database.db"
    DATABASE_URL = f"sqlite+aiosqlite:///{sqlite_path}"
else:
    # Handle Heroku/Render postgres:// -> postgresql+asyncpg://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Override the sqlalchemy.url from alembic.ini
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# =============================================================================
# TARGET METADATA - Import from schema.py
# =============================================================================
from database.schema import metadata
target_metadata = metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations asynchronously.
    
    Creates an async engine and runs migrations via run_sync.
    This is required for asyncpg driver compatibility.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
