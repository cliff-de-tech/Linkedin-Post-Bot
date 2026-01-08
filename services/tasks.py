"""
Celery Tasks - Background Task Definitions

This module contains Celery tasks for background processing:
- publish_due_posts_task: Periodic task that checks and publishes scheduled posts
- publish_single_post_task: Publish a single post (can be called directly)
- scheduler_heartbeat_task: Health check for monitoring

IMPORTANT: Async/Sync Bridge
-----------------------------
The database layer uses async/await (databases + asyncpg).
Celery workers are synchronous by default.

Solution: We use asyncio.run() to execute async functions within Celery tasks.
This creates a new event loop for each task execution, which is safe because:
1. Each task runs in isolation
2. The event loop is properly closed after execution
3. No shared state between task invocations

Alternative approaches considered:
- asgiref.sync.async_to_sync: Works but adds dependency
- Synchronous DB sessions: Would require rewriting all DB code
- Celery async support (experimental): Not production-ready
"""

import asyncio
import time
from typing import Optional
import structlog

from services.celery_app import celery_app

logger = structlog.get_logger(__name__)


# =============================================================================
# ASYNC/SYNC BRIDGE HELPER
# =============================================================================

def run_async(coro):
    """
    Execute an async coroutine in a synchronous context.
    
    Creates a new event loop, runs the coroutine, and properly cleans up.
    Safe to use in Celery tasks where each task is isolated.
    
    Args:
        coro: Async coroutine to execute
        
    Returns:
        Result of the coroutine
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# =============================================================================
# DATABASE IMPORTS (Lazy to avoid import issues)
# =============================================================================

def get_db_functions():
    """
    Lazy import of database functions to avoid circular imports
    and ensure proper initialization.
    """
    from services.scheduled_posts import get_due_posts, update_post_status
    from services.token_store import get_token_by_user_id
    from services.linkedin_service import post_to_linkedin
    from services.db import connect_db, disconnect_db
    
    return {
        'get_due_posts': get_due_posts,
        'update_post_status': update_post_status,
        'get_token_by_user_id': get_token_by_user_id,
        'post_to_linkedin': post_to_linkedin,
        'connect_db': connect_db,
        'disconnect_db': disconnect_db,
    }


# =============================================================================
# ASYNC IMPLEMENTATION (Core Logic)
# =============================================================================

async def _process_due_posts_async() -> int:
    """
    Async implementation of the due posts processor.
    
    This is the core logic extracted from the old scheduler.py.
    
    Returns:
        Number of posts processed
    """
    funcs = get_db_functions()
    
    # Ensure database connection is established
    await funcs['connect_db']()
    
    try:
        due_posts = await funcs['get_due_posts']()
    except Exception as e:
        logger.error("get_due_posts_failed", error=str(e))
        return 0
    
    if not due_posts:
        logger.debug("no_due_posts")
        return 0
    
    logger.info("processing_due_posts", count=len(due_posts))
    processed = 0
    
    for post in due_posts:
        post_id = post['id']
        user_id = post['user_id']
        log = logger.bind(post_id=post_id, user_id=user_id)
        
        try:
            # Get user's LinkedIn tokens
            tokens = await funcs['get_token_by_user_id'](user_id)
            
            if not tokens or not tokens.get('access_token'):
                await funcs['update_post_status'](
                    post_id,
                    'failed',
                    'LinkedIn not connected or token expired'
                )
                log.warning("no_linkedin_token")
                processed += 1
                continue
            
            # Publish to LinkedIn
            result = funcs['post_to_linkedin'](
                message_text=post['post_content'],
                access_token=tokens['access_token'],
            )
            
            if result.get('success'):
                await funcs['update_post_status'](post_id, 'published')
                log.info("post_published_successfully")
            else:
                error_msg = result.get('error', 'Unknown error')
                await funcs['update_post_status'](post_id, 'failed', error_msg)
                log.error("post_publish_failed", error=error_msg)
            
            processed += 1
            
        except Exception as e:
            await funcs['update_post_status'](post_id, 'failed', str(e))
            log.exception("post_processing_error")
            processed += 1
    
    return processed


async def _publish_single_post_async(
    post_id: int,
    user_id: str,
    post_content: str,
    image_url: Optional[str] = None,
) -> dict:
    """
    Async implementation for publishing a single post.
    
    Returns:
        Dict with success status and details
    """
    funcs = get_db_functions()
    log = logger.bind(post_id=post_id, user_id=user_id)
    
    # Ensure database connection
    await funcs['connect_db']()
    
    try:
        # Get user's LinkedIn tokens
        tokens = await funcs['get_token_by_user_id'](user_id)
        
        if not tokens or not tokens.get('access_token'):
            await funcs['update_post_status'](
                post_id,
                'failed',
                'LinkedIn not connected or token expired'
            )
            return {'success': False, 'error': 'No valid LinkedIn token'}
        
        # Publish to LinkedIn
        result = funcs['post_to_linkedin'](
            message_text=post_content,
            access_token=tokens['access_token'],
        )
        
        if result.get('success'):
            await funcs['update_post_status'](post_id, 'published')
            log.info("single_post_published")
            return {'success': True, 'linkedin_post_id': result.get('id')}
        else:
            error_msg = result.get('error', 'Unknown error')
            await funcs['update_post_status'](post_id, 'failed', error_msg)
            log.error("single_post_failed", error=error_msg)
            return {'success': False, 'error': error_msg}
            
    except Exception as e:
        await funcs['update_post_status'](post_id, 'failed', str(e))
        log.exception("single_post_error")
        return {'success': False, 'error': str(e)}


# =============================================================================
# CELERY TASKS
# =============================================================================

@celery_app.task(
    bind=True,
    name='services.tasks.publish_due_posts_task',
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
)
def publish_due_posts_task(self):
    """
    Periodic task: Check for and publish all due scheduled posts.
    
    This replaces the old `while True` loop in scheduler.py.
    Called by Celery Beat every 60 seconds.
    
    Features:
    - Automatic retry with exponential backoff on failure
    - Task expires if not picked up within 55 seconds (prevents overlap)
    - Structured logging for observability
    """
    log = logger.bind(task_id=self.request.id, task_name='publish_due_posts')
    log.info("task_started")
    
    start_time = time.time()
    
    try:
        processed = run_async(_process_due_posts_async())
        duration = time.time() - start_time
        
        log.info(
            "task_completed",
            posts_processed=processed,
            duration_seconds=round(duration, 2),
        )
        
        return {
            'status': 'success',
            'posts_processed': processed,
            'duration_seconds': round(duration, 2),
        }
        
    except Exception as e:
        log.exception("task_failed")
        # Re-raise to trigger Celery's retry mechanism
        raise


@celery_app.task(
    bind=True,
    name='services.tasks.publish_single_post_task',
    max_retries=3,
    default_retry_delay=30,
)
def publish_single_post_task(
    self,
    post_id: int,
    user_id: str,
    post_content: str,
    image_url: Optional[str] = None,
):
    """
    Task: Publish a single scheduled post immediately.
    
    Can be called directly to bypass the scheduler for immediate publishing.
    
    Args:
        post_id: Database ID of the scheduled post
        user_id: Clerk user ID
        post_content: The post text content
        image_url: Optional image URL
    """
    log = logger.bind(
        task_id=self.request.id,
        task_name='publish_single_post',
        post_id=post_id,
        user_id=user_id,
    )
    log.info("task_started")
    
    try:
        result = run_async(_publish_single_post_async(
            post_id=post_id,
            user_id=user_id,
            post_content=post_content,
            image_url=image_url,
        ))
        
        if result['success']:
            log.info("task_completed", result=result)
        else:
            log.warning("task_completed_with_error", result=result)
        
        return result
        
    except Exception as e:
        log.exception("task_failed")
        raise self.retry(exc=e)


@celery_app.task(name='services.tasks.scheduler_heartbeat_task')
def scheduler_heartbeat_task():
    """
    Health check task: Confirms Celery Beat is running.
    
    Runs every 5 minutes. Useful for monitoring and alerting.
    """
    timestamp = time.time()
    logger.info(
        "scheduler_heartbeat",
        timestamp=timestamp,
        message="Celery Beat is alive",
    )
    return {
        'status': 'alive',
        'timestamp': timestamp,
    }


# =============================================================================
# UTILITY FUNCTIONS (For direct invocation from API)
# =============================================================================

def schedule_immediate_publish(post_id: int, user_id: str, post_content: str, image_url: Optional[str] = None):
    """
    Queue a post for immediate publishing via Celery.
    
    Use this from API endpoints to trigger async publishing.
    
    Example:
        from services.tasks import schedule_immediate_publish
        task = schedule_immediate_publish(post_id=123, user_id="user_abc", post_content="Hello!")
        print(f"Task queued: {task.id}")
    """
    return publish_single_post_task.delay(
        post_id=post_id,
        user_id=user_id,
        post_content=post_content,
        image_url=image_url,
    )
