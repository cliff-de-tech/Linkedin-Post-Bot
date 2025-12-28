"""
Base Repository Pattern

Provides multi-tenant data isolation by automatically enforcing
user_id filtering on all queries.

Usage:
    repo = PostRepository(db, user_id="user_123")
    posts = await repo.get_all()  # Automatically filters by user_id
"""
from typing import Any, Optional, List, Dict
from sqlalchemy import Table, select, insert, update, delete, and_
from sqlalchemy.sql import Select


class BaseRepository:
    """
    Base repository class that enforces user_id filtering for multi-tenancy.
    
    All data access for a specific user should go through a repository
    to ensure strict isolation between users.
    
    Attributes:
        db: Database wrapper instance
        user_id: Current user's ID (used for all queries)
        table: SQLAlchemy Table object for this repository
    """
    
    def __init__(self, db, user_id: str, table: Table):
        """
        Initialize repository with database and user context.
        
        Args:
            db: DatabaseWrapper instance
            user_id: The authenticated user's ID
            table: SQLAlchemy Table for this repository's entity
        """
        self.db = db
        self.user_id = user_id
        self.table = table
    
    def _user_filter(self):
        """Get the base user_id filter condition."""
        return self.table.c.user_id == self.user_id
    
    async def get_all(self, order_by=None, limit: int = None, **filters) -> List[Dict]:
        """
        Get all records for current user with optional filtering.
        
        Args:
            order_by: Column or list of columns for ordering
            limit: Maximum number of records to return
            **filters: Additional column filters (e.g., status='published')
            
        Returns:
            List of record dictionaries
        """
        stmt = select(self.table).where(self._user_filter())
        
        # Apply additional filters
        for column, value in filters.items():
            if hasattr(self.table.c, column):
                stmt = stmt.where(getattr(self.table.c, column) == value)
        
        # Apply ordering
        if order_by is not None:
            if hasattr(order_by, '__iter__') and not isinstance(order_by, str):
                stmt = stmt.order_by(*order_by)
            else:
                stmt = stmt.order_by(order_by)
        
        # Apply limit
        if limit is not None:
            stmt = stmt.limit(limit)
        
        result = await self.db.fetch_all(str(stmt.compile(compile_kwargs={"literal_binds": True})))
        return [dict(row) for row in result] if result else []
    
    async def get_by_id(self, record_id: int) -> Optional[Dict]:
        """
        Get a single record by ID with user_id verification.
        
        Args:
            record_id: Primary key ID
            
        Returns:
            Record dictionary or None if not found/not owned by user
        """
        stmt = select(self.table).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        )
        result = await self.db.fetch_one(str(stmt.compile(compile_kwargs={"literal_binds": True})))
        return dict(result) if result else None
    
    async def create(self, **data) -> int:
        """
        Create a new record with the current user_id.
        
        Args:
            **data: Column values for the new record
            
        Returns:
            ID of the created record
        """
        # Enforce user_id
        data['user_id'] = self.user_id
        
        stmt = insert(self.table).values(**data)
        result = await self.db.execute(str(stmt.compile(compile_kwargs={"literal_binds": True})))
        return result
    
    async def update(self, record_id: int, **data) -> bool:
        """
        Update a record by ID with user_id verification.
        
        Args:
            record_id: Primary key ID
            **data: Column values to update
            
        Returns:
            True if updated, False if not found/not owned
        """
        stmt = update(self.table).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        ).values(**data)
        
        result = await self.db.execute(str(stmt.compile(compile_kwargs={"literal_binds": True})))
        return result is not None
    
    async def delete(self, record_id: int) -> bool:
        """
        Delete a record by ID with user_id verification.
        
        Args:
            record_id: Primary key ID
            
        Returns:
            True if deleted, False if not found/not owned
        """
        stmt = delete(self.table).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        )
        
        result = await self.db.execute(str(stmt.compile(compile_kwargs={"literal_binds": True})))
        return result is not None
    
    async def count(self, **filters) -> int:
        """
        Count records for current user with optional filtering.
        
        Args:
            **filters: Column filters
            
        Returns:
            Count of matching records
        """
        from sqlalchemy import func
        stmt = select(func.count()).select_from(self.table).where(self._user_filter())
        
        for column, value in filters.items():
            if hasattr(self.table.c, column):
                stmt = stmt.where(getattr(self.table.c, column) == value)
        
        result = await self.db.fetch_one(str(stmt.compile(compile_kwargs={"literal_binds": True})))
        return result[0] if result else 0
