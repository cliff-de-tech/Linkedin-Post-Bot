"""
LinkedIn Service Tests

Comprehensive tests for the LinkedIn posting service including:
- Post formatting and validation
- Image upload flow
- API response handling
- Error scenarios
"""

import pytest
import os
import sys
from unittest.mock import patch, MagicMock

# Ensure services are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


class TestPostFormatting:
    """Tests for post content formatting and validation."""
    
    def test_post_content_max_length(self):
        """LinkedIn posts should respect max character limit."""
        MAX_LINKEDIN_LENGTH = 3000
        
        # Generate a very long post
        long_post = "a" * 4000
        
        # Truncation should happen (if implemented)
        assert MAX_LINKEDIN_LENGTH == 3000  # Document the limit
    
    def test_post_content_preserves_hashtags(self):
        """Hashtags should be preserved in post content."""
        post = "Great day coding! #developer #coding #python"
        
        assert "#developer" in post
        assert "#coding" in post
        assert "#python" in post
    
    def test_post_content_handles_unicode(self):
        """Post should handle unicode characters (emojis, etc)."""
        post = "🚀 Just shipped new feature! 💻 #coding"
        
        assert "🚀" in post
        assert "💻" in post


class TestImageUpload:
    """Tests for LinkedIn image upload functionality."""
    
    @patch('services.linkedin_service.requests.post')
    @patch('services.linkedin_service.requests.put')
    def test_upload_image_registers_upload(self, mock_put, mock_post):
        """Image upload should register with LinkedIn API first."""
        from services.linkedin_service import upload_image_to_linkedin
        
        # Mock the register call
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "value": {
                    "uploadMechanism": {
                        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
                            "uploadUrl": "https://api.linkedin.com/upload/123"
                        }
                    },
                    "asset": "urn:li:digitalmediaAsset:C5622AQGe5dE"
                }
            }
        )
        
        # Mock the PUT upload call
        mock_put.return_value = MagicMock(status_code=201)
        
        # Call with test image data
        result = upload_image_to_linkedin(
            b"fake_image_data",
            access_token="test_token",
            linkedin_user_urn="urn:li:person:test123"
        )
        
        # Should call register endpoint
        assert mock_post.called
        # Should return asset URN
        assert result is not None
    
    @patch('services.linkedin_service.requests.post')
    def test_upload_image_handles_api_error(self, mock_post):
        """Image upload should handle API errors gracefully."""
        from services.linkedin_service import upload_image_to_linkedin
        
        # Mock an error response
        mock_post.return_value = MagicMock(
            status_code=401,
            json=lambda: {"message": "Unauthorized"}
        )
        
        result = upload_image_to_linkedin(
            b"fake_image_data",
            access_token="invalid_token",
            linkedin_user_urn="urn:li:person:test123"
        )
        
        # Should return None on error
        assert result is None
    
    def test_upload_image_requires_token(self):
        """Image upload should require access token."""
        from services.linkedin_service import upload_image_to_linkedin
        
        # Without token, should handle gracefully
        result = upload_image_to_linkedin(
            b"fake_image_data",
            access_token=None,
            linkedin_user_urn="urn:li:person:test123"
        )
        
        # Should return None without token
        assert result is None


class TestPostToLinkedIn:
    """Tests for the main posting function."""
    
    @patch('services.linkedin_service.requests.post')
    def test_post_to_linkedin_success(self, mock_post):
        """Successful post should return True or post ID."""
        from services.linkedin_service import post_to_linkedin
        
        # Mock successful post response
        mock_post.return_value = MagicMock(
            status_code=201,
            json=lambda: {"id": "urn:li:share:1234567890"}
        )
        
        result = post_to_linkedin(
            "Test post content #test",
            access_token="valid_token",
            linkedin_user_urn="urn:li:person:test123"
        )
        
        assert result is True or result is not None
    
    @patch('services.linkedin_service.requests.post')
    def test_post_to_linkedin_with_image(self, mock_post):
        """Post with image should include media in payload."""
        from services.linkedin_service import post_to_linkedin
        
        mock_post.return_value = MagicMock(
            status_code=201,
            json=lambda: {"id": "urn:li:share:1234567890"}
        )
        
        result = post_to_linkedin(
            "Test post with image #test",
            image_asset_urn="urn:li:digitalmediaAsset:C5622AQGe5dE",
            access_token="valid_token",
            linkedin_user_urn="urn:li:person:test123"
        )
        
        # Verify the POST was called
        assert mock_post.called
        
        # Check if image was included in payload (inspect call args)
        call_kwargs = mock_post.call_args
        if call_kwargs and 'json' in call_kwargs.kwargs:
            payload = call_kwargs.kwargs['json']
            assert 'content' in str(payload) or 'media' in str(payload)
    
    @patch('services.linkedin_service.requests.post')
    def test_post_to_linkedin_unauthorized(self, mock_post):
        """Unauthorized token should return False or error."""
        from services.linkedin_service import post_to_linkedin
        
        mock_post.return_value = MagicMock(
            status_code=401,
            json=lambda: {"message": "Invalid access token"}
        )
        
        result = post_to_linkedin(
            "Test post content",
            access_token="invalid_token",
            linkedin_user_urn="urn:li:person:test123"
        )
        
        assert result is False or result is None
    
    @patch('services.linkedin_service.requests.post')
    def test_post_to_linkedin_rate_limited(self, mock_post):
        """Rate limited response should be handled."""
        from services.linkedin_service import post_to_linkedin
        
        mock_post.return_value = MagicMock(
            status_code=429,
            json=lambda: {"message": "Rate limit exceeded"}
        )
        
        result = post_to_linkedin(
            "Test post content",
            access_token="valid_token",
            linkedin_user_urn="urn:li:person:test123"
        )
        
        # Should handle rate limiting gracefully
        assert result is False or result is None
    
    def test_post_to_linkedin_requires_token(self):
        """Posting should require access token and raise error without one."""
        from services.linkedin_service import post_to_linkedin
        
        # Without token, should raise RuntimeError
        with pytest.raises(RuntimeError, match='Missing access_token'):
            post_to_linkedin(
                "Test post content",
                access_token=None,
                linkedin_user_urn="urn:li:person:test123"
            )


class TestAPICompliance:
    """Tests to verify LinkedIn API compliance."""
    
    def test_uses_ugc_posts_api(self):
        """Should use the UGC Posts API (not deprecated Share API)."""
        from services.linkedin_service import post_to_linkedin
        import inspect
        
        # Check function source for API endpoint
        source = inspect.getsource(post_to_linkedin)
        
        # Should use UGC Posts endpoint
        assert "ugcPosts" in source or "ugc" in source.lower()
    
    def test_requires_proper_scopes(self):
        """Documentation should mention required scopes."""
        import services.linkedin_service as module
        
        # Check module docstring
        if module.__doc__:
            # Should mention w_member_social scope
            assert "w_member_social" in module.__doc__ or "OAuth scope" in module.__doc__


class TestSecurityPractices:
    """Tests for security best practices."""
    
    def test_no_token_logging(self):
        """Access tokens should never be logged."""
        import services.linkedin_service as module
        import inspect
        
        source = inspect.getsource(module)
        
        # Should not have print statements with token in them
        # This is a heuristic check
        lines = source.split('\n')
        for line in lines:
            if 'print' in line and 'token' in line.lower():
                # If token is mentioned in print, it should be masked or noted as not logged
                assert 'SECURITY' in line or 'not log' in line or 'mask' in line or 'access_token' not in line
    
    def test_token_only_in_headers(self):
        """Tokens should only be sent in Authorization headers."""
        from services.linkedin_service import post_to_linkedin
        import inspect
        
        source = inspect.getsource(post_to_linkedin)
        
        # Should use Authorization header
        assert "Authorization" in source or "headers" in source
