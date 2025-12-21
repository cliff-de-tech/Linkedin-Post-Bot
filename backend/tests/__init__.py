"""
Backend Test Suite - LinkedIn Post Bot

This package contains tests for the FastAPI backend and services.

Test Structure:
- test_api.py: API endpoint tests (health, settings, posts)
- test_services.py: Service layer tests (GitHub activity, AI generation)
- conftest.py: Shared fixtures

Running Tests:
    cd backend
    pytest

Or with coverage:
    pytest --cov=. --cov-report=html
"""
