"""
Post History Service (PostgreSQL Async)

Stores generated and published posts, usage tracking, and statistics.
"""

import json
import time
import logging
from services.db import get_database

logger = logging.getLogger(__name__)

# Free tier limits
FREE_TIER_DAILY_POSTS = 10
FREE_TIER_SCHEDULED_POSTS = 10


async def save_post(
    user_id: str, 
    post_content: str, 
    post_type: str, 
    context: dict, 
    status: str = 'draft', 
    linkedin_post_id: str = None
) -> int:
    """
    Save a new post to history.
    
    Returns:
        post_id: The ID of the newly created post
    """
    db = get_database()
    
    timestamp = int(time.time())
    published_at = timestamp if status == 'published' else None
    
    result = await db.execute("""
        INSERT INTO post_history 
        (user_id, post_content, post_type, context, status, linkedin_post_id, engagement, created_at, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    """, [
        user_id,
        post_content,
        post_type,
        json.dumps(context),
        status,
        linkedin_post_id,
        json.dumps({}),
        timestamp,
        published_at
    ])
    
    # For databases library, we need to fetch the returned id
    row = await db.fetch_one(
        "SELECT id FROM post_history WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
        [user_id]
    )
    return row['id'] if row else None


async def get_user_posts(user_id: str, limit: int = 50, status: str = None) -> list[dict]:
    """
    Get posts for a user with optional status filter.
    """
    db = get_database()
    
    if status:
        rows = await db.fetch_all("""
            SELECT id, post_content, post_type, context, status, linkedin_post_id, engagement, created_at, published_at
            FROM post_history 
            WHERE user_id = $1 AND status = $2
            ORDER BY created_at DESC
            LIMIT $3
        """, [user_id, status, limit])
    else:
        rows = await db.fetch_all("""
            SELECT id, post_content, post_type, context, status, linkedin_post_id, engagement, created_at, published_at
            FROM post_history 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        """, [user_id, limit])
    
    posts = []
    for row in rows:
        row_dict = dict(row)
        posts.append({
            'id': row_dict['id'],
            'post_content': row_dict['post_content'],
            'post_type': row_dict['post_type'],
            'context': json.loads(row_dict['context']) if row_dict['context'] else {},
            'status': row_dict['status'],
            'linkedin_post_id': row_dict['linkedin_post_id'],
            'engagement': json.loads(row_dict['engagement']) if row_dict['engagement'] else {},
            'created_at': row_dict['created_at'],
            'published_at': row_dict['published_at']
        })
    
    return posts


async def update_post_status(post_id: int, status: str, linkedin_post_id: str = None) -> None:
    """Update the status of a post."""
    db = get_database()
    
    published_at = int(time.time()) if status == 'published' else None
    
    if linkedin_post_id:
        await db.execute("""
            UPDATE post_history 
            SET status = $1, linkedin_post_id = $2, published_at = $3
            WHERE id = $4
        """, [status, linkedin_post_id, published_at, post_id])
    else:
        await db.execute("""
            UPDATE post_history 
            SET status = $1, published_at = $2
            WHERE id = $3
        """, [status, published_at, post_id])


async def delete_post(post_id: int) -> None:
    """Delete a post from history."""
    db = get_database()
    await db.execute("DELETE FROM post_history WHERE id = $1", [post_id])


async def get_user_stats(user_id: str) -> dict:
    """Get comprehensive stats for a user.
    
    OPTIMIZED: Single query with conditional aggregation instead of 5 separate queries.
    This reduces DB round-trips from 5 to 1, significantly improving dashboard load time.
    """
    db = get_database()
    
    # Pre-calculate timestamps
    now = int(time.time())
    one_week_ago = now - (7 * 24 * 60 * 60)
    two_weeks_ago = now - (14 * 24 * 60 * 60)
    current_month_start = now - (30 * 24 * 60 * 60)
    
    # Single optimized query with conditional counting
    row = await db.fetch_one("""
        SELECT 
            COUNT(*) as total_posts,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
            SUM(CASE WHEN created_at > $2 THEN 1 ELSE 0 END) as posts_this_month,
            SUM(CASE WHEN created_at > $3 THEN 1 ELSE 0 END) as posts_this_week,
            SUM(CASE WHEN created_at > $4 AND created_at <= $3 THEN 1 ELSE 0 END) as posts_last_week
        FROM post_history 
        WHERE user_id = $1
    """, [user_id, current_month_start, one_week_ago, two_weeks_ago])
    
    if not row:
        return {
            'posts_generated': 0,
            'posts_published': 0,
            'posts_this_month': 0,
            'posts_this_week': 0,
            'posts_last_week': 0,
            'growth_percentage': 0,
            'draft_posts': 0
        }
    
    total_posts = row['total_posts'] or 0
    published_posts = row['published_posts'] or 0
    posts_this_month = row['posts_this_month'] or 0
    posts_this_week = row['posts_this_week'] or 0
    posts_last_week = row['posts_last_week'] or 0
    
    # Calculate growth percentage
    if posts_last_week > 0:
        growth_percentage = round(((posts_this_week - posts_last_week) / posts_last_week) * 100)
    elif posts_this_week > 0:
        growth_percentage = 100
    else:
        growth_percentage = 0
    
    return {
        'posts_generated': total_posts,
        'posts_published': published_posts,
        'posts_this_month': posts_this_month,
        'posts_this_week': posts_this_week,
        'posts_last_week': posts_last_week,
        'growth_percentage': growth_percentage,
        'draft_posts': total_posts - published_posts
    }



async def get_daily_post_count(user_id: str, user_timezone: str = "UTC") -> int:
    """
    Count PUBLISHED posts by user today (in user's local timezone).
    Used for enforcing daily post limit (10 published posts/day for free tier).
    """
    db = get_database()
    
    import datetime
    try:
        from zoneinfo import ZoneInfo
        # Handle common UTC variants
        tz_key = user_timezone
        if tz_key.upper() == "UTC":
            tz_key = "Etc/UTC"
        user_tz = ZoneInfo(tz_key)
    except Exception as e:
        # Fallback to UTC using datetime.timezone
        logger.debug(f"Invalid timezone '{user_timezone}': {e}")
        user_tz = datetime.timezone.utc
    
    now_local = datetime.datetime.now(user_tz)
    today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    today_start_utc = int(today_start_local.timestamp())
    
    row = await db.fetch_one("""
        SELECT COUNT(*) as count FROM post_history 
        WHERE user_id = $1 AND status = 'published' AND published_at >= $2
    """, [user_id, today_start_utc])
    
    return row['count'] if row else 0


async def get_scheduled_post_count(user_id: str) -> int:
    """
    Count pending scheduled posts for user.
    Free tier is limited to 10 scheduled posts.
    """
    db = get_database()
    
    try:
        row = await db.fetch_one("""
            SELECT COUNT(*) as count FROM scheduled_posts 
            WHERE user_id = $1 AND status = 'pending'
        """, [user_id])
        return row['count'] if row else 0
    except Exception as e:
        logger.debug(f"Failed to get scheduled count: {e}")
        return 0


async def get_user_usage(user_id: str, tier: str = "free", user_timezone: str = "UTC") -> dict:
    """
    Get comprehensive usage data for a user.
    Returns current usage counts, limits, and reset time.
    """
    import datetime
    
    posts_today = await get_daily_post_count(user_id, user_timezone)
    scheduled_count = await get_scheduled_post_count(user_id)
    
    try:
        from zoneinfo import ZoneInfo
        # Handle common UTC variants
        tz_key = user_timezone
        if tz_key.upper() == "UTC":
            tz_key = "Etc/UTC"
        user_tz = ZoneInfo(tz_key)
    except Exception as e:
        # Fallback to UTC using datetime.timezone
        logger.debug(f"Invalid timezone '{user_timezone}': {e}")
        user_tz = datetime.timezone.utc
    
    now_local = datetime.datetime.now(user_tz)
    tomorrow_midnight = (now_local + datetime.timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    seconds_until_reset = int((tomorrow_midnight - now_local).total_seconds())
    reset_time_iso = tomorrow_midnight.isoformat()
    
    if tier == "free":
        return {
            "tier": "free",
            "posts_today": posts_today,
            "posts_limit": FREE_TIER_DAILY_POSTS,
            "posts_remaining": max(0, FREE_TIER_DAILY_POSTS - posts_today),
            "scheduled_count": scheduled_count,
            "scheduled_limit": FREE_TIER_SCHEDULED_POSTS,
            "scheduled_remaining": max(0, FREE_TIER_SCHEDULED_POSTS - scheduled_count),
            "resets_in_seconds": seconds_until_reset,
            "resets_at": reset_time_iso,
            "timezone": user_timezone
        }
    else:
        return {
            "tier": tier,
            "posts_today": posts_today,
            "posts_limit": -1,
            "posts_remaining": -1,
            "scheduled_count": scheduled_count,
            "scheduled_limit": -1,
            "scheduled_remaining": -1,
            "resets_in_seconds": 0,
            "resets_at": None
        }


async def can_user_generate_posts(user_id: str, count: int = 1, tier: str = "free") -> dict:
    """
    Check if user can generate more posts.
    Returns { allowed: bool, reason: str, remaining: int }
    """
    if tier != "free":
        return {"allowed": True, "reason": None, "remaining": -1}
    
    posts_today = await get_daily_post_count(user_id)
    remaining = FREE_TIER_DAILY_POSTS - posts_today
    
    if remaining <= 0:
        return {
            "allowed": False,
            "reason": f"Daily limit reached. You've used all {FREE_TIER_DAILY_POSTS} posts today.",
            "remaining": 0
        }
    
    if count > remaining:
        return {
            "allowed": False,
            "reason": f"You can only generate {remaining} more post(s) today.",
            "remaining": remaining
        }
    
    return {"allowed": True, "reason": None, "remaining": remaining}


async def can_user_schedule_post(user_id: str, tier: str = "free") -> dict:
    """
    Check if user can schedule another post.
    Free tier limited to 10 scheduled posts.
    """
    if tier != "free":
        return {"allowed": True, "reason": None, "remaining": -1}
    
    scheduled_count = await get_scheduled_post_count(user_id)
    remaining = FREE_TIER_SCHEDULED_POSTS - scheduled_count
    
    if remaining <= 0:
        return {
            "allowed": False,
            "reason": f"Scheduled posts limit reached. Free tier allows {FREE_TIER_SCHEDULED_POSTS} scheduled posts.",
            "remaining": 0
        }
    
    return {"allowed": True, "reason": None, "remaining": remaining}
