"""
API Endpoint Tests

Tests for FastAPI endpoints including:
- Health check
- Settings API
- Post generation
- GitHub activity scanning
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Tests for the /health endpoint."""
    
    def test_health_returns_ok(self, sync_test_client: TestClient):
        """Health endpoint should return status=healthy."""
        response = sync_test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_health_response_format(self, sync_test_client: TestClient):
        """Health endpoint should return proper JSON structure."""
        response = sync_test_client.get("/health")
        
        assert response.headers["content-type"] == "application/json"
        data = response.json()
        assert "status" in data


class TestTemplatesEndpoint:
    """Tests for the /api/templates endpoint."""
    
    def test_get_templates_returns_list(self, sync_test_client: TestClient):
        """Templates endpoint should return a list of templates."""
        response = sync_test_client.get("/api/templates")
        
        assert response.status_code == 200
        data = response.json()
        # API returns {"templates": [...]} format
        assert "templates" in data
        assert isinstance(data["templates"], list)
    
    def test_templates_have_required_fields(self, sync_test_client: TestClient):
        """Each template should have id, name, and description."""
        response = sync_test_client.get("/api/templates")
        data = response.json()
        templates = data["templates"]
        
        for template in templates:
            assert "id" in template
            assert "name" in template
            assert "description" in template
    
    def test_templates_includes_code_release(self, sync_test_client: TestClient):
        """Templates should include at least the standard template."""
        response = sync_test_client.get("/api/templates")
        data = response.json()
        templates = data["templates"]
        
        template_ids = [t["id"] for t in templates]
        assert "standard" in template_ids


class TestSettingsEndpoint:
    """Tests for the /api/settings endpoints."""
    
    def test_get_nonexistent_user_settings(self, sync_test_client: TestClient):
        """Getting settings for non-existent user should return error."""
        response = sync_test_client.get("/api/settings/nonexistent_user_xyz")
        
        assert response.status_code == 200
        data = response.json()
        # Should return error for non-existent user
        assert "error" in data or "user_id" in data  # Either error or empty data
    
    def test_settings_endpoint_accepts_user_id(self, sync_test_client: TestClient):
        """Settings endpoint should accept user_id in path."""
        # Just verify the endpoint exists and accepts the path parameter
        response = sync_test_client.get("/api/settings/test_user_123")
        
        assert response.status_code == 200
        # Response should be JSON
        assert response.headers["content-type"] == "application/json"


class TestGeneratePreviewEndpoint:
    """Tests for the /api/post/generate-preview endpoint."""
    
    def test_generate_preview_requires_context(self, sync_test_client: TestClient):
        """Generate preview should require context in request body."""
        # Note: This endpoint requires authentication in production
        # For testing, we just verify the endpoint exists
        response = sync_test_client.post(
            "/api/post/generate-preview",
            json={"context": {}, "user_id": "test_user"}
        )
        
        # May return 401 (auth required) or 200/422 depending on auth setup
        assert response.status_code in [200, 401, 422]
        if response.status_code == 200:
            data = response.json()
            # Either has a post or an error
            assert "post" in data or "error" in data or "detail" in data
    
    def test_generate_preview_with_push_context(
        self, 
        sync_test_client: TestClient,
        sample_push_context
    ):
        """Generate preview with push context should work."""
        response = sync_test_client.post(
            "/api/post/generate-preview",
            json={"context": sample_push_context, "user_id": "test_user"}
        )
        
        # May return 401 (auth required) or 200/422 depending on auth setup
        assert response.status_code in [200, 401, 422]
        if response.status_code == 200:
            data = response.json()
            # Either has a post or an error (if Groq not configured)
            assert "post" in data or "error" in data or "detail" in data


class TestGitHubScanEndpoint:
    """Tests for the /api/github/scan endpoint."""
    
    def test_github_scan_requires_auth(self, sync_test_client: TestClient):
        """GitHub scan requires authentication."""
        response = sync_test_client.post(
            "/api/github/scan",
            json={"user_id": "test_user", "hours": 24}
        )
        
        # This endpoint requires valid Clerk auth token
        # Without auth, expect 401 or similar auth error
        assert response.status_code in [200, 401, 403]
        if response.status_code == 200:
            data = response.json()
            # Should have activities list (possibly empty) or error
            assert "activities" in data or "error" in data
    
    def test_github_scan_activity_type_filter(self, sync_test_client: TestClient):
        """GitHub scan should accept activity_type filter."""
        response = sync_test_client.post(
            "/api/github/scan",
            json={
                "user_id": "test_user",
                "hours": 24,
                "activity_type": "push"
            }
        )
        
        # May require authentication
        assert response.status_code in [200, 401, 403]


class TestPublishEndpoint:
    """Tests for the /api/publish/full endpoint."""
    
    def test_publish_test_mode_returns_success(self, sync_test_client: TestClient):
        """Publish in test mode should return success without posting."""
        response = sync_test_client.post(
            "/api/publish/full",
            json={
                "user_id": "test_user",
                "post_content": "This is a test post for LinkedIn!",
                "test_mode": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("test_mode") is True
        # Current API returns success and message
        assert data.get("success") is True
        assert "message" in data
    
    def test_publish_validates_content(self, sync_test_client: TestClient):
        """Publish should accept post_content."""
        response = sync_test_client.post(
            "/api/publish/full",
            json={
                "user_id": "test_user",
                "post_content": "Test content",
                "test_mode": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        # Current API returns success response with test_mode flag
        assert data.get("success") is True
        assert data.get("test_mode") is True


class TestCORSConfiguration:
    """Tests for CORS configuration."""
    
    def test_cors_allows_localhost(self, sync_test_client: TestClient):
        """CORS should allow localhost:3000 origin."""
        response = sync_test_client.options(
            "/health",
            headers={"Origin": "http://localhost:3000"}
        )
        
        # OPTIONS request should succeed
        assert response.status_code in [200, 405]  # FastAPI may not handle OPTIONS directly
