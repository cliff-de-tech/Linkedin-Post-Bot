"""
Base Repository Pattern

Provides multi-tenant data isolation by automatically enforcing
user_id filtering on all queries.

SECURITY: Uses parameterized queries to prevent SQL injection.
All user inputs are passed as bind parameters, never interpolated
into SQL strings.

Usage:
    repo = PostRepository(db, user_id="user_123")
    posts = await repo.get_all()  # Automatically filters by user_id
"""
from typing import Any, Optional, List, Dict, Union
from sqlalchemy import Table, select, insert, update, delete, and_, text
from sqlalchemy.sql import Select
from sqlalchemy.dialects import postgresql
import structlog

logger = structlog.get_logger(__name__)


class BaseRepository:
    """
    Base repository class that enforces user_id filtering for multi-tenancy.
    
    All data access for a specific user should go through a repository
    to ensure strict isolation between users.
    
    SECURITY FEATURES:
    - Parameterized queries (no SQL injection via literal_binds)
    - Automatic user_id enforcement (multi-tenant isolation)
    - Input sanitization through SQLAlchemy's query builder
    
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
        self._log = logger.bind(
            repository=self.__class__.__name__,
            user_id=user_id[:8] + "..." if user_id and len(user_id) > 8 else user_id
        )
    
    def _user_filter(self):
        """Get the base user_id filter condition."""
        return self.table.c.user_id == self.user_id
    
    async def _execute_query(
        self, 
        stmt, 
        fetch_mode: str = "all",
        operation: str = "query"
    ) -> Union[List[Dict], Optional[Dict], int, bool]:
        """
        Execute a parameterized query safely.
        
        SECURITY: This method compiles SQLAlchemy statements with proper
        parameter binding, preventing SQL injection attacks.
        
        Args:
            stmt: SQLAlchemy statement object
            fetch_mode: "all", "one", "execute", or "scalar"
            operation: Description for logging
            
        Returns:
            Query results based on fetch_mode
        """
        try:
            # Compile the statement to get SQL and parameters separately
            # This is the SECURE way - parameters are passed separately
            compiled = stmt.compile(dialect=postgresql.dialect())
            query_text = str(compiled)
            params = compiled.params
            
            self._log.debug(
                "executing_query",
                operation=operation,
                fetch_mode=fetch_mode,
                # Don't log sensitive parameter values in production
                param_count=len(params) if params else 0
            )
            
            if fetch_mode == "all":
                result = await self.db.fetch_all(query=query_text, values=params)
                return [dict(row) for row in result] if result else []
            elif fetch_mode == "one":
                result = await self.db.fetch_one(query=query_text, values=params)
                return dict(result) if result else None
            elif fetch_mode == "scalar":
                result = await self.db.fetch_one(query=query_text, values=params)
                return result[0] if result else 0
            else:  # execute
                result = await self.db.execute(query=query_text, values=params)
                return result
                
        except Exception as e:
            self._log.error(
                "query_execution_failed",
                operation=operation,
                error=str(e),
                error_type=type(e).__name__
            )
            raise
    
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
        
        # Apply additional filters (SQLAlchemy handles parameterization)
        for column, value in filters.items():
            if hasattr(self.table.c, column):
                stmt = stmt.where(getattr(self.table.c, column) == value)
        
        # Apply ordering
        if order_by is not None:
            if hasattr(order_by, '__iter__') and not isinstance(order_by, str):
                stmt = stmt.order_by(*order_by)
            else:
                stmt = stmt.order_by(order_by)
        
        # Apply limit (as integer, safe from injection)
        if limit is not None:
            stmt = stmt.limit(int(limit))
        
        return await self._execute_query(stmt, fetch_mode="all", operation="get_all")
    
    async def get_by_id(self, record_id: int) -> Optional[Dict]:
        """
        Get a single record by ID with user_id verification.
        
        Args:
            record_id: Primary key ID
            
        Returns:
            Record dictionary or None if not found/not owned by user
        """
        # Ensure record_id is an integer (type safety)
        record_id = int(record_id)
        
        stmt = select(self.table).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        )
        return await self._execute_query(stmt, fetch_mode="one", operation="get_by_id")
    
    async def create(self, **data) -> int:
        """
        Create a new record with the current user_id.
        
        Args:
            **data: Column values for the new record
            
        Returns:
            ID of the created record
        """
        # Enforce user_id (prevents privilege escalation)
        data['user_id'] = self.user_id
        
        # Remove any None values to let DB defaults work
        clean_data = {k: v for k, v in data.items() if v is not None}
        
        stmt = insert(self.table).values(**clean_data).returning(self.table.c.id)
        
        result = await self._execute_query(stmt, fetch_mode="scalar", operation="create")
        
        self._log.info("record_created", record_id=result)
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
        # Type safety
        record_id = int(record_id)
        
        # Remove None values to prevent accidental nullification
        clean_data = {k: v for k, v in data.items() if v is not None}
        
        if not clean_data:
            self._log.warning("update_skipped_no_data", record_id=record_id)
            return False
        
        stmt = update(self.table).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        ).values(**clean_data)
        
        result = await self._execute_query(stmt, fetch_mode="execute", operation="update")
        
        success = result is not None
        if success:
            self._log.info("record_updated", record_id=record_id)
        return success
    
    async def delete(self, record_id: int) -> bool:
        """
        Delete a record by ID with user_id verification.
        
        Args:
            record_id: Primary key ID
            
        Returns:
            True if deleted, False if not found/not owned
        """
        # Type safety
        record_id = int(record_id)
        
        stmt = delete(self.table).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        )
        
        result = await self._execute_query(stmt, fetch_mode="execute", operation="delete")
        
        success = result is not None
        if success:
            self._log.info("record_deleted", record_id=record_id)
        return success
    
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
        
        return await self._execute_query(stmt, fetch_mode="scalar", operation="count")
    
    async def exists(self, record_id: int) -> bool:
        """
        Check if a record exists for the current user.
        
        Args:
            record_id: Primary key ID
            
        Returns:
            True if record exists and belongs to user
        """
        record_id = int(record_id)
        
        from sqlalchemy import func, exists as sql_exists
        
        subquery = select(self.table.c.id).where(
            and_(
                self.table.c.id == record_id,
                self._user_filter()
            )
        ).exists()
        
        stmt = select(subquery)
        result = await self._execute_query(stmt, fetch_mode="scalar", operation="exists")
        return bool(result)
