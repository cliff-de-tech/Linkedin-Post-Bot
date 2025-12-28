"""
Settings Repository

Handles user settings data access with user_id isolation.
Note: user_settings uses user_id as a unique key, so this repository
is primarily for single-user lookups rather than list operations.
"""
from typing import Optional, Dict
import time
import json

from .base import BaseRepository
from database.schema import user_settings


class SettingsRepository(BaseRepository):
    """
    Repository for user_settings table operations.
    
    Unlike other repositories, user_settings has a 1:1 relationship
    with user_id, so most operations work on the single settings record.
    """
    
    def __init__(self, db, user_id: str):
        super().__init__(db, user_id, user_settings)
    
    async def get_settings(self) -> Optional[Dict]:
        """
        Get the current user's settings.
        
        Returns:
            Settings dictionary or None if not found
        """
        query = """
            SELECT * FROM user_settings WHERE user_id = $1
        """
        result = await self.db.fetch_one(query, [self.user_id])
        
        if result:
            settings = dict(result)
            # Parse JSON preferences
            if settings.get('preferences'):
                try:
                    settings['preferences'] = json.loads(settings['preferences'])
                except json.JSONDecodeError:
                    settings['preferences'] = {}
            return settings
        return None
    
    async def save_settings(self, **data) -> bool:
        """
        Save or update user settings (upsert).
        
        Args:
            **data: Settings fields to save
            
        Returns:
            True if successful
        """
        # Handle preferences JSON encoding
        if 'preferences' in data and isinstance(data['preferences'], dict):
            data['preferences'] = json.dumps(data['preferences'])
        
        # Check if settings exist
        existing = await self.get_settings()
        
        if existing:
            # Update existing
            data['updated_at'] = int(time.time())
            query = """
                UPDATE user_settings 
                SET github_username = COALESCE($2, github_username),
                    preferences = COALESCE($3, preferences),
                    onboarding_complete = COALESCE($4, onboarding_complete),
                    subscription_tier = COALESCE($5, subscription_tier),
                    updated_at = $6
                WHERE user_id = $1
            """
            await self.db.execute(query, [
                self.user_id,
                data.get('github_username'),
                data.get('preferences'),
                data.get('onboarding_complete'),
                data.get('subscription_tier'),
                data['updated_at']
            ])
        else:
            # Create new
            now = int(time.time())
            query = """
                INSERT INTO user_settings 
                (user_id, github_username, preferences, onboarding_complete, subscription_tier, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """
            await self.db.execute(query, [
                self.user_id,
                data.get('github_username'),
                data.get('preferences', '{}'),
                data.get('onboarding_complete', 0),
                data.get('subscription_tier', 'free'),
                now,
                now
            ])
        
        return True
    
    async def get_github_username(self) -> Optional[str]:
        """
        Get the user's GitHub username.
        
        Returns:
            GitHub username or None
        """
        settings = await self.get_settings()
        return settings.get('github_username') if settings else None
    
    async def is_onboarding_complete(self) -> bool:
        """
        Check if user has completed onboarding.
        
        Returns:
            True if onboarding is complete
        """
        settings = await self.get_settings()
        return bool(settings.get('onboarding_complete')) if settings else False
    
    async def get_subscription_tier(self) -> str:
        """
        Get the user's subscription tier.
        
        Returns:
            Subscription tier ('free', 'pro', etc.) - defaults to 'free'
        """
        settings = await self.get_settings()
        return settings.get('subscription_tier', 'free') if settings else 'free'
    
    async def complete_onboarding(self) -> bool:
        """
        Mark onboarding as complete for the user.
        
        Returns:
            True if successful
        """
        return await self.save_settings(onboarding_complete=1)
