# backend/repositories - Repository pattern for data access
from .base import BaseRepository
from .posts import PostRepository
from .settings import SettingsRepository

__all__ = [
    "BaseRepository",
    "PostRepository",
    "SettingsRepository",
]
