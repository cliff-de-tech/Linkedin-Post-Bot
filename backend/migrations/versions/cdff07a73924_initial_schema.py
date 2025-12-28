"""initial_schema

Revision ID: cdff07a73924
Revises: 
Create Date: 2025-12-28 05:48:08.171179

BASELINE MIGRATION:
Tables already exist from legacy init_tables() function.
This migration marks the current state as the baseline for future migrations.
SQLite doesn't support ALTER COLUMN, so we skip schema adjustments.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cdff07a73924'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Baseline migration - tables already exist.
    
    The following tables are assumed to already exist:
    - accounts
    - user_settings
    - post_history
    - scheduled_posts
    - feedback
    - tickets
    
    Future migrations will alter/extend these tables.
    """
    pass  # Tables already exist from init_tables()


def downgrade() -> None:
    """
    Downgrade would drop all tables - not recommended.
    """
    pass  # Cannot undo baseline
