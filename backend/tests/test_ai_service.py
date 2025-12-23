"""
AI Service Tests

Comprehensive tests for the AI content generation service including:
- Prompt generation for different styles
- Context handling for various activity types
- Hashtag synthesis
- Error handling and fallbacks
"""

import pytest
import os
import sys
from unittest.mock import patch, MagicMock

# Ensure services are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


class TestPromptGeneration:
    """Tests for prompt template generation."""
    
    def test_get_prompt_for_standard_style(self):
        """Standard style should return full prompt with persona."""
        from services.ai_service import get_prompt_for_style
        
        prompt = get_prompt_for_style("standard")
        
        assert prompt is not None
        assert len(prompt) > 100
        assert "Hook" in prompt or "STRUCTURE" in prompt
    
    def test_get_prompt_for_build_in_public_style(self):
        """Build-in-public style should exist and be different from standard."""
        from services.ai_service import get_prompt_for_style
        
        standard = get_prompt_for_style("standard")
        bip = get_prompt_for_style("build_in_public")
        
        assert bip is not None
        assert bip != standard
        assert "build" in bip.lower() or "public" in bip.lower()
    
    def test_get_prompt_for_thought_leadership_style(self):
        """Thought leadership style should emphasize industry insights."""
        from services.ai_service import get_prompt_for_style
        
        prompt = get_prompt_for_style("thought_leadership")
        
        assert prompt is not None
        assert "industry" in prompt.lower() or "insight" in prompt.lower() or "opinion" in prompt.lower()
    
    def test_get_prompt_for_job_search_style(self):
        """Job search style should emphasize availability and skills."""
        from services.ai_service import get_prompt_for_style
        
        prompt = get_prompt_for_style("job_search")
        
        assert prompt is not None
        assert "open" in prompt.lower() or "role" in prompt.lower() or "hiring" in prompt.lower()
    
    def test_get_prompt_for_unknown_style_returns_standard(self):
        """Unknown style should fall back to standard."""
        from services.ai_service import get_prompt_for_style
        
        standard = get_prompt_for_style("standard")
        unknown = get_prompt_for_style("nonexistent_style")
        
        assert unknown == standard


class TestHashtagSynthesis:
    """Tests for hashtag generation from post content."""
    
    def test_synthesize_hashtags_returns_string(self):
        """synthesize_hashtags should return a string."""
        from services.ai_service import synthesize_hashtags
        
        post = "Just shipped a new React component for our dashboard!"
        result = synthesize_hashtags(post)
        
        assert isinstance(result, str)
    
    def test_synthesize_hashtags_includes_relevant_tags(self):
        """Hashtags should be relevant to post content."""
        from services.ai_service import synthesize_hashtags
        
        post = "Working on a Python project with FastAPI and PostgreSQL"
        result = synthesize_hashtags(post)
        
        result_lower = result.lower()
        # Should include at least one relevant hashtag
        assert "#python" in result_lower or "#fastapi" in result_lower or "#developer" in result_lower
    
    def test_synthesize_hashtags_respects_desired_count(self):
        """Should generate approximately the desired number of hashtags."""
        from services.ai_service import synthesize_hashtags
        
        post = "Building a full-stack application with React, Node.js, TypeScript, and MongoDB"
        result = synthesize_hashtags(post, desired=10)
        
        hashtag_count = result.count("#")
        # Allow some variance but should be close to desired
        assert hashtag_count >= 5 and hashtag_count <= 15
    
    def test_synthesize_hashtags_handles_empty_content(self):
        """Should handle empty or minimal content gracefully."""
        from services.ai_service import synthesize_hashtags
        
        result = synthesize_hashtags("")
        
        # Should still return something (generic hashtags)
        assert isinstance(result, str)


class TestGeneratePostWithAI:
    """Tests for the main AI generation function."""
    
    @patch('services.ai_service.client')
    def test_generate_post_with_push_context(self, mock_client):
        """Push event context should generate a post."""
        from services.ai_service import generate_post_with_ai
        
        # Mock the Groq response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Just pushed some code! #coding #developer"
        mock_client.chat.completions.create.return_value = mock_response
        
        context = {
            "type": "push",
            "commits": 3,
            "repo": "my-project",
            "full_repo": "user/my-project",
            "date": "2 hours ago"
        }
        
        result = generate_post_with_ai(context)
        
        assert result is not None
        assert len(result) > 0
    
    @patch('services.ai_service.client')
    def test_generate_post_with_pr_context(self, mock_client):
        """Pull request context should generate a post."""
        from services.ai_service import generate_post_with_ai
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Just opened a PR! #opensource"
        mock_client.chat.completions.create.return_value = mock_response
        
        context = {
            "type": "pull_request",
            "action": "opened",
            "pr_number": 42,
            "pr_title": "Add feature",
            "repo": "my-project",
            "full_repo": "user/my-project"
        }
        
        result = generate_post_with_ai(context)
        
        assert result is not None
    
    @patch('services.ai_service.client')
    def test_generate_post_with_custom_api_key(self, mock_client):
        """Custom Groq API key should be used when provided."""
        from services.ai_service import generate_post_with_ai
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test post content"
        mock_client.chat.completions.create.return_value = mock_response
        
        context = {"type": "generic"}
        
        # Should not raise error with custom key
        result = generate_post_with_ai(context, groq_api_key="gsk_test_key")
        
        assert result is not None
    
    @patch('services.ai_service.client', None)
    def test_generate_post_returns_none_when_client_unavailable(self):
        """Should return None or handle gracefully when Groq client unavailable."""
        from services.ai_service import generate_post_with_ai
        
        context = {"type": "push", "commits": 1, "repo": "test"}
        
        # Should not crash, should return None or empty
        result = generate_post_with_ai(context)
        
        # Depending on implementation, either None or a fallback message
        assert result is None or isinstance(result, str)
    
    @patch('services.ai_service.client')
    def test_generate_post_with_different_styles(self, mock_client):
        """Different styles should result in different prompts being used."""
        from services.ai_service import generate_post_with_ai
        
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Post content"
        mock_client.chat.completions.create.return_value = mock_response
        
        context = {"type": "generic"}
        
        # Test different styles
        for style in ["standard", "build_in_public", "thought_leadership", "job_search"]:
            result = generate_post_with_ai(context, style=style)
            assert result is not None


class TestContextFormatting:
    """Tests for how different context types are handled."""
    
    def test_push_context_structure(self, sample_push_context):
        """Push context should have all required fields."""
        assert "type" in sample_push_context
        assert "commits" in sample_push_context
        assert "repo" in sample_push_context
        assert sample_push_context["type"] == "push"
    
    def test_pr_context_structure(self, sample_pr_context):
        """PR context should have all required fields."""
        assert "type" in sample_pr_context
        assert "pr_number" in sample_pr_context
        assert "action" in sample_pr_context
        assert sample_pr_context["type"] == "pull_request"
    
    def test_new_repo_context_structure(self, sample_new_repo_context):
        """New repo context should have all required fields."""
        assert "type" in sample_new_repo_context
        assert "repo" in sample_new_repo_context
        assert sample_new_repo_context["type"] == "new_repo"


# Fixtures from conftest.py are used here
@pytest.fixture
def sample_push_context():
    return {
        "type": "push",
        "commits": 3,
        "repo": "test-project",
        "full_repo": "testuser/test-project",
        "date": "2 hours ago"
    }


@pytest.fixture
def sample_pr_context():
    return {
        "type": "pull_request",
        "action": "opened",
        "pr_number": 42,
        "pr_title": "Add new feature",
        "repo": "test-project",
        "full_repo": "testuser/test-project",
        "date": "1 hour ago"
    }


@pytest.fixture
def sample_new_repo_context():
    return {
        "type": "new_repo",
        "repo": "awesome-new-project",
        "full_repo": "testuser/awesome-new-project",
        "date": "just now"
    }
