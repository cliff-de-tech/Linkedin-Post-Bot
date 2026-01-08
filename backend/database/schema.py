"""
SQLAlchemy Core Schema Definitions

This module defines all database tables using SQLAlchemy Core (not ORM).
The `metadata` object is used by Alembic for migrations.

These definitions EXACTLY match the existing PostgreSQL schema from
services/db.py init_tables() to ensure migration compatibility.
"""
from sqlalchemy import (
    MetaData,
    Table,
    Column,
    Integer,
    BigInteger,
    Text,
    String,
    UniqueConstraint,
    Index,
)

# =============================================================================
# METADATA - Single source of truth for all table definitions
# =============================================================================
metadata = MetaData()

# =============================================================================
# TABLE: accounts
# Stores OAuth tokens for LinkedIn and GitHub
# From: token_store.py
# =============================================================================
accounts = Table(
    "accounts",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Text),
    Column("linkedin_user_urn", Text, unique=True),
    Column("access_token", Text),
    Column("refresh_token", Text),
    Column("github_username", Text),
    Column("github_access_token", Text),
    Column("expires_at", BigInteger),
    Column("scopes", Text),
    Column("is_encrypted", Integer, default=0),
)

# =============================================================================
# TABLE: user_settings
# Stores user preferences, onboarding state, subscription info
# From: user_settings.py
# =============================================================================
user_settings = Table(
    "user_settings",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Text, unique=True),
    Column("github_username", Text),
    Column("preferences", Text, default="{}"),
    Column("persona", Text, default="{}"),  # User's writing persona for AI
    Column("onboarding_complete", Integer, default=0),
    Column("subscription_tier", Text, default="free"),
    Column("subscription_status", Text, default="active"),
    Column("subscription_expires_at", BigInteger),
    Column("created_at", BigInteger),
    Column("updated_at", BigInteger),
)

# =============================================================================
# TABLE: post_history
# Stores generated and published posts
# From: post_history.py
# =============================================================================
post_history = Table(
    "post_history",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Text, index=True),
    Column("post_content", Text),
    Column("post_type", Text),
    Column("context", Text),
    Column("status", Text),
    Column("linkedin_post_id", Text),
    Column("engagement", Text),
    Column("created_at", BigInteger),
    Column("published_at", BigInteger),
    # Indexes defined via Index objects below
)

# Additional indexes for post_history
Index("idx_post_history_user", post_history.c.user_id)
Index("idx_post_history_status", post_history.c.user_id, post_history.c.status)

# =============================================================================
# TABLE: scheduled_posts
# Stores posts scheduled for future publishing
# From: scheduled_posts.py
# =============================================================================
scheduled_posts = Table(
    "scheduled_posts",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Text, nullable=False),
    Column("post_content", Text, nullable=False),
    Column("image_url", Text),
    Column("scheduled_time", BigInteger, nullable=False),
    Column("status", Text, default="pending"),
    Column("error_message", Text),
    Column("created_at", BigInteger, nullable=False),
    Column("published_at", BigInteger),
    UniqueConstraint("user_id", "scheduled_time", name="uq_scheduled_user_time"),
)

# Indexes for scheduled_posts
Index("idx_scheduled_time", scheduled_posts.c.scheduled_time)
Index("idx_scheduled_user", scheduled_posts.c.user_id)
Index("idx_scheduled_status", scheduled_posts.c.status)

# =============================================================================
# TABLE: feedback
# Stores user feedback submissions
# From: feedback.py
# =============================================================================
feedback = Table(
    "feedback",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Text, nullable=False),
    Column("rating", Integer),
    Column("liked", Text),
    Column("improvements", Text),
    Column("suggestions", Text),
    Column("created_at", BigInteger, nullable=False),
    Column("email_sent", Integer, default=0),
)

# Index for feedback
Index("idx_feedback_user", feedback.c.user_id, feedback.c.created_at.desc())

# =============================================================================
# TABLE: tickets
# Stores support ticket submissions (replaces JSON file storage)
# From: /api/contact endpoint
# =============================================================================
tickets = Table(
    "tickets",
    metadata,
    Column("id", Text, primary_key=True),  # UUID string
    Column("name", Text, nullable=False),
    Column("email", Text),
    Column("subject", Text, nullable=False),
    Column("body", Text, nullable=False),
    Column("recipient", Text, nullable=False),
    Column("status", Text, default="open"),
    Column("created_at", BigInteger),
)

# =============================================================================
# TABLE: subscriptions
# Stores Stripe subscription data linked to users
# =============================================================================
subscriptions = Table(
    "subscriptions",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Text, nullable=False, unique=True),  # Clerk user ID
    Column("stripe_customer_id", String(255), unique=True),  # cus_xxxxx
    Column("stripe_subscription_id", String(255), unique=True),  # sub_xxxxx
    Column("plan_id", String(255)),  # price_xxxxx (Stripe Price ID)
    Column("status", String(50), default="inactive"),  # active, past_due, canceled, trialing
    Column("current_period_start", BigInteger),  # Unix timestamp
    Column("current_period_end", BigInteger),  # Unix timestamp
    Column("cancel_at_period_end", Integer, default=0),  # Boolean: 1 if scheduled to cancel
    Column("created_at", BigInteger),
    Column("updated_at", BigInteger),
)

# Indexes for subscriptions
Index("idx_subscriptions_user", subscriptions.c.user_id)
Index("idx_subscriptions_customer", subscriptions.c.stripe_customer_id)
Index("idx_subscriptions_status", subscriptions.c.status)
