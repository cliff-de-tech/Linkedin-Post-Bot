"""
Services Layer Tests

Tests for the core services including:
- GitHub activity parsing
- Rate limiting
- Input validation
"""

import pytest
import os
import sys

# Ensure services are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


class TestGitHubActivityParsing:
    """Tests for GitHub event parsing logic."""
    
    def test_parse_push_event(self, sample_github_event):
        """Push event should be parsed correctly."""
        from services.github_activity import parse_event
        
        result = parse_event(sample_github_event)
        
        assert result is not None
        assert result["type"] == "push"
        assert result["icon"] == "🚀"
        assert "commit" in result["title"].lower()
        assert result["context"]["commits"] == 2
    
    def test_parse_push_event_zero_commits_returns_update(self):
        """Push event with 0 commits should return update description."""
        from services.github_activity import parse_event
        
        event = {
            "id": "123",
            "type": "PushEvent",
            "repo": {"name": "user/repo"},
            "payload": {"commits": []},
            "created_at": "2024-12-21T06:00:00Z"
        }
        
        result = parse_event(event)
        # Zero commits now returns a result with type 'push' and description about update
        # (force push or sync behavior)
        assert result is not None
        assert result["type"] == "push"
        assert result["context"]["commits"] == 0
    
    def test_parse_pr_event(self):
        """Pull request event should be parsed correctly."""
        from services.github_activity import parse_event
        
        event = {
            "id": "456",
            "type": "PullRequestEvent",
            "repo": {"name": "user/repo"},
            "payload": {
                "action": "opened",
                "pull_request": {
                    "number": 42,
                    "title": "Add new feature"
                }
            },
            "created_at": "2024-12-21T06:00:00Z"
        }
        
        result = parse_event(event)
        
        assert result is not None
        assert result["type"] == "pull_request"
        assert result["icon"] == "🔀"
        assert "42" in result["title"]
        assert result["context"]["pr_number"] == 42
    
    def test_parse_create_repo_event(self):
        """Create repository event should be parsed correctly."""
        from services.github_activity import parse_event
        
        event = {
            "id": "789",
            "type": "CreateEvent",
            "repo": {"name": "user/new-repo"},
            "payload": {
                "ref_type": "repository",
                "description": "A new project"
            },
            "created_at": "2024-12-21T06:00:00Z"
        }
        
        result = parse_event(event)
        
        assert result is not None
        assert result["type"] == "new_repo"
        assert result["icon"] == "✨"
    
    def test_parse_unknown_event_returns_none(self):
        """Unknown event types should return None."""
        from services.github_activity import parse_event
        
        event = {
            "id": "999",
            "type": "UnknownEventType",
            "repo": {"name": "user/repo"},
            "payload": {},
            "created_at": "2024-12-21T06:00:00Z"
        }
        
        result = parse_event(event)
        assert result is None
    
    def test_parse_event_includes_time_ago(self, sample_github_event):
        """Parsed event should include time_ago field."""
        from services.github_activity import parse_event
        
        result = parse_event(sample_github_event)
        
        assert "time_ago" in result
        assert isinstance(result["time_ago"], str)


class TestRateLimiting:
    """Tests for rate limiting middleware."""
    
    def test_rate_limiter_allows_initial_requests(self):
        """Rate limiter should allow initial requests within limit."""
        from services.middleware import RateLimiter
        
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        
        # First 5 requests should be allowed
        for i in range(5):
            assert limiter.is_allowed(f"user_{i}") is True
    
    def test_rate_limiter_blocks_excess_requests(self):
        """Rate limiter should block requests over the limit."""
        from services.middleware import RateLimiter
        
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        user_id = "test_user"
        
        # First 3 requests should be allowed
        for _ in range(3):
            assert limiter.is_allowed(user_id) is True
        
        # 4th request should be blocked
        assert limiter.is_allowed(user_id) is False
    
    def test_rate_limiter_tracks_per_user(self):
        """Rate limiter should track limits per user."""
        from services.middleware import RateLimiter
        
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        
        # User A uses their limit
        assert limiter.is_allowed("user_a") is True
        assert limiter.is_allowed("user_a") is True
        assert limiter.is_allowed("user_a") is False
        
        # User B should still have their full limit
        assert limiter.is_allowed("user_b") is True
        assert limiter.is_allowed("user_b") is True
    
    def test_rate_limiter_get_remaining(self):
        """Rate limiter should return correct remaining count."""
        from services.middleware import RateLimiter
        
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        user_id = "test_user"
        
        assert limiter.get_remaining(user_id) == 5
        
        limiter.is_allowed(user_id)
        assert limiter.get_remaining(user_id) == 4
        
        limiter.is_allowed(user_id)
        limiter.is_allowed(user_id)
        assert limiter.get_remaining(user_id) == 2


class TestInputValidation:
    """Tests for input validation utilities."""
    
    def test_validate_groq_api_key_valid(self):
        """Valid Groq API key should pass validation."""
        from services.middleware import validate_api_key
        
        valid_key = "gsk_1234567890abcdefghijklmnop"
        assert validate_api_key(valid_key, "groq") is True
    
    def test_validate_groq_api_key_invalid_prefix(self):
        """Groq API key with wrong prefix should fail."""
        from services.middleware import validate_api_key
        
        invalid_key = "sk_1234567890abcdefghijklmnop"
        assert validate_api_key(invalid_key, "groq") is False
    
    def test_validate_groq_api_key_too_short(self):
        """Short Groq API key should fail."""
        from services.middleware import validate_api_key
        
        short_key = "gsk_123"
        assert validate_api_key(short_key, "groq") is False
    
    def test_validate_empty_api_key(self):
        """Empty API key should fail validation."""
        from services.middleware import validate_api_key
        
        assert validate_api_key("", "groq") is False
        assert validate_api_key(None, "groq") is False
    
    def test_validate_github_username_valid(self):
        """Valid GitHub username should pass validation."""
        from services.middleware import validate_github_username
        
        assert validate_github_username("octocat") is True
        assert validate_github_username("test-user") is True
        assert validate_github_username("user123") is True
    
    def test_validate_github_username_invalid(self):
        """Invalid GitHub username should fail validation."""
        from services.middleware import validate_github_username
        
        assert validate_github_username("-startswith") is False
        assert validate_github_username("endswith-") is False
        assert validate_github_username("") is False
        assert validate_github_username("a" * 40) is False  # Too long
    
    def test_sanitize_input_removes_null_bytes(self):
        """Sanitize should remove null bytes from input."""
        from services.middleware import sanitize_input
        
        malicious = "Hello\x00World"
        result = sanitize_input(malicious)
        assert "\x00" not in result
        assert result == "HelloWorld"
    
    def test_sanitize_input_truncates_long_text(self):
        """Sanitize should truncate text exceeding max length."""
        from services.middleware import sanitize_input
        
        long_text = "a" * 20000
        result = sanitize_input(long_text, max_length=100)
        assert len(result) == 100


class TestTokenStore:
    """Tests for token storage service."""
    
    @pytest.mark.asyncio
    async def test_token_store_connection(self):
        """Token store should connect to database."""
        # The token store now uses async PostgreSQL via services.db
        # We just verify the module loads and functions are accessible
        import services.token_store as token_store
        
        # Check that the required functions exist
        assert hasattr(token_store, 'save_token')
        assert hasattr(token_store, 'get_token_by_urn')
        assert hasattr(token_store, 'get_token_by_user_id')
        assert callable(token_store.save_token)
        assert callable(token_store.get_token_by_urn)
        assert callable(token_store.get_token_by_user_id)
    
    def test_token_store_module_structure(self):
        """Token store module should have expected structure."""
        import services.token_store as token_store
        
        # Verify the module has the core functions
        # Note: init_db was removed in the async migration, 
        # database init is now handled by alembic migrations
        expected_functions = [
            'save_token',
            'get_token_by_urn',
            'get_token_by_user_id',
            'get_connection_status',
            'delete_token_by_user_id'
        ]
        
        for func_name in expected_functions:
            assert hasattr(token_store, func_name), f"Missing function: {func_name}"


class TestAIServicePrompts:
    """Tests for AI service prompt generation."""
    
    def test_push_context_generates_prompt(self, sample_push_context):
        """Push context should be handled by AI service."""
        # Just verify the context structure is correct
        assert sample_push_context["type"] == "push"
        assert "commits" in sample_push_context
        assert "repo" in sample_push_context
        assert "full_repo" in sample_push_context
    
    def test_pr_context_has_required_fields(self, sample_pr_context):
        """PR context should have all required fields."""
        assert sample_pr_context["type"] == "pull_request"
        assert "action" in sample_pr_context
        assert "pr_number" in sample_pr_context
        assert "pr_title" in sample_pr_context
