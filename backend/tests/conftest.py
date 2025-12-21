"""
Pytest fixtures and configuration for backend tests.

Provides:
- FastAPI test client
- Mock services
- Test data fixtures
"""

import os
import sys
import pytest
from typing import Generator

# Ensure parent paths are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


@pytest.fixture
def test_client():
    """Create a FastAPI test client."""
    from httpx import AsyncClient, ASGITransport
    from app import app
    
    # Create async client with ASGI transport
    transport = ASGITransport(app=app)
    
    async def get_client():
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client
    
    return get_client


@pytest.fixture
def sync_test_client():
    """Create a synchronous test client for simple tests."""
    from fastapi.testclient import TestClient
    from app import app
    return TestClient(app)


@pytest.fixture
def sample_push_context():
    """Sample GitHub push event context for AI generation tests."""
    return {
        "type": "push",
        "commits": 3,
        "repo": "test-project",
        "full_repo": "testuser/test-project",
        "date": "2 hours ago"
    }


@pytest.fixture
def sample_pr_context():
    """Sample GitHub PR event context for AI generation tests."""
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
    """Sample GitHub new repo event context."""
    return {
        "type": "new_repo",
        "repo": "awesome-new-project",
        "full_repo": "testuser/awesome-new-project",
        "date": "just now"
    }


@pytest.fixture
def sample_github_event():
    """Sample raw GitHub event for parsing tests."""
    return {
        "id": "12345678901",
        "type": "PushEvent",
        "repo": {
            "name": "testuser/test-repo"
        },
        "payload": {
            "commits": [
                {"sha": "abc123", "message": "Fix bug"},
                {"sha": "def456", "message": "Add feature"}
            ]
        },
        "created_at": "2024-12-21T06:00:00Z"
    }


@pytest.fixture
def mock_user_id():
    """Mock Clerk user ID for testing."""
    return "user_test123"
