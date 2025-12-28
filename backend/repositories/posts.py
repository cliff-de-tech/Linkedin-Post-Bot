"""
Post Repository

Handles all post-related data access with user_id isolation.
Extends BaseRepository with post-specific query methods.
"""
from typing import Optional, List, Dict
from sqlalchemy import desc
import time

from .base import BaseRepository
from database.schema import post_history


class PostRepository(BaseRepository):
    """
    Repository for post_history table operations.
    
    All queries are automatically scoped to the current user.
    """
    
    def __init__(self, db, user_id: str):
        super().__init__(db, user_id, post_history)
    
    async def get_posts(
        self, 
        limit: int = 50, 
        status: str = None
    ) -> List[Dict]:
        """
        Get user's posts with optional status filter.
        
        Args:
            limit: Maximum posts to return (default 50)
            status: Filter by status ('draft', 'published', etc.)
            
        Returns:
            List of post dictionaries ordered by created_at DESC
        """
        filters = {}
        if status:
            filters['status'] = status
        
        return await self.get_all(
            order_by=desc(post_history.c.created_at),
            limit=limit,
            **filters
        )
    
    async def get_recent_published(self, days: int = 30) -> List[Dict]:
        """
        Get posts published in the last N days.
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of published posts
        """
        cutoff = int(time.time()) - (days * 24 * 60 * 60)
        # Using raw query for complex date comparison
        query = f"""
            SELECT * FROM post_history 
            WHERE user_id = $1 
            AND status = 'published' 
            AND published_at >= $2
            ORDER BY published_at DESC
        """
        result = await self.db.fetch_all(query, [self.user_id, cutoff])
        return [dict(row) for row in result] if result else []
    
    async def get_stats(self) -> Dict:
        """
        Get aggregated post statistics for the user.
        
        Returns:
            Dictionary with counts by status
        """
        query = """
            SELECT 
                status,
                COUNT(*) as count
            FROM post_history
            WHERE user_id = $1
            GROUP BY status
        """
        result = await self.db.fetch_all(query, [self.user_id])
        
        stats = {
            'total': 0,
            'draft': 0,
            'published': 0,
            'scheduled': 0,
            'failed': 0
        }
        
        if result:
            for row in result:
                status = row['status'] or 'draft'
                count = row['count']
                stats[status] = count
                stats['total'] += count
        
        return stats
    
    async def save_post(
        self,
        post_content: str,
        post_type: str = "mixed",
        context: dict = None,
        status: str = "draft",
        linkedin_post_id: str = None
    ) -> int:
        """
        Save a new post to history.
        
        Args:
            post_content: The post text content
            post_type: Type of post (e.g., 'mixed', 'text')
            context: Original context/activity data
            status: Post status
            linkedin_post_id: LinkedIn's post ID if published
            
        Returns:
            ID of the created post
        """
        import json
        
        data = {
            'post_content': post_content,
            'post_type': post_type,
            'context': json.dumps(context) if context else '{}',
            'status': status,
            'linkedin_post_id': linkedin_post_id,
            'created_at': int(time.time()),
        }
        
        if status == 'published':
            data['published_at'] = int(time.time())
        
        return await self.create(**data)
    
    async def update_status(self, post_id: int, status: str, linkedin_post_id: str = None) -> bool:
        """
        Update the status of a post.
        
        Args:
            post_id: ID of the post
            status: New status
            linkedin_post_id: LinkedIn's post ID if publishing
            
        Returns:
            True if updated successfully
        """
        data = {'status': status}
        
        if status == 'published':
            data['published_at'] = int(time.time())
            if linkedin_post_id:
                data['linkedin_post_id'] = linkedin_post_id
        
        return await self.update(post_id, **data)
    
    async def get_today_count(self) -> int:
        """
        Get count of posts created today (for rate limiting).
        
        Returns:
            Number of posts created today
        """
        # Start of today (midnight UTC)
        import time
        from datetime import datetime, timezone
        
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_ts = int(today.timestamp())
        
        query = """
            SELECT COUNT(*) FROM post_history
            WHERE user_id = $1 AND created_at >= $2
        """
        result = await self.db.fetch_one(query, [self.user_id, today_ts])
        return result[0] if result else 0
