"""
Rate Limiter Service - Per-User Request Throttling

Implements simple in-memory rate limiting to prevent abuse.

CONFIGURATION:
    - Default: 60 requests per minute per user
    - Configurable via environment variables

DESIGN:
    - In-memory storage (resets on server restart)
    - Keyed by user_id for multi-tenant isolation
    - Sliding window algorithm
"""
import time
import os
from collections import defaultdict
from threading import Lock
import logging

logger = logging.getLogger(__name__)

# Configuration
RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', '60'))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('RATE_LIMIT_WINDOW', '60'))


class RateLimiter:
    """
    Thread-safe per-user rate limiter using sliding window.
    
    MULTI-TENANT ISOLATION:
        - Each user has their own request counter
        - No cross-user rate limit sharing
    """
    
    def __init__(self, max_requests: int = RATE_LIMIT_REQUESTS, 
                 window_seconds: int = RATE_LIMIT_WINDOW_SECONDS):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # user_id -> [timestamps]
        self.lock = Lock()
    
    def is_allowed(self, user_id: str) -> tuple[bool, dict]:
        """
        Check if a request is allowed for a user.
        
        Args:
            user_id: Clerk user ID (tenant isolation key)
            
        Returns:
            (allowed: bool, info: dict with remaining, reset_at, etc.)
            
        SECURITY: Uses user_id to ensure rate limits are per-tenant.
        """
        if not user_id:
            # Anonymous requests - use stricter limit
            user_id = "anonymous"
        
        current_time = time.time()
        window_start = current_time - self.window_seconds
        
        with self.lock:
            # Clean old requests
            self.requests[user_id] = [
                ts for ts in self.requests[user_id] 
                if ts > window_start
            ]
            
            request_count = len(self.requests[user_id])
            remaining = max(0, self.max_requests - request_count)
            
            if request_count >= self.max_requests:
                # Rate limited
                oldest = self.requests[user_id][0] if self.requests[user_id] else current_time
                reset_at = oldest + self.window_seconds
                return False, {
                    "allowed": False,
                    "remaining": 0,
                    "limit": self.max_requests,
                    "reset_at": int(reset_at),
                    "retry_after": int(reset_at - current_time)
                }
            
            # Allow and record
            self.requests[user_id].append(current_time)
            
            return True, {
                "allowed": True,
                "remaining": remaining - 1,
                "limit": self.max_requests,
                "reset_at": int(current_time + self.window_seconds)
            }
    
    def get_status(self, user_id: str) -> dict:
        """Get current rate limit status for a user without consuming quota."""
        current_time = time.time()
        window_start = current_time - self.window_seconds
        
        with self.lock:
            requests = [ts for ts in self.requests.get(user_id, []) if ts > window_start]
            remaining = max(0, self.max_requests - len(requests))
            
            return {
                "remaining": remaining,
                "limit": self.max_requests,
                "window_seconds": self.window_seconds,
                "used": len(requests)
            }


# Global rate limiter instance
rate_limiter = RateLimiter()


def check_rate_limit(user_id: str) -> tuple[bool, dict]:
    """
    Convenience function to check rate limit.
    
    Returns:
        (allowed: bool, info: dict)
    """
    return rate_limiter.is_allowed(user_id)


def get_rate_limit_status(user_id: str) -> dict:
    """Get rate limit status without consuming quota."""
    return rate_limiter.get_status(user_id)
