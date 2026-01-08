"""
Celery Application Configuration

This module initializes the Celery app instance for distributed task processing.

Architecture:
- Redis acts as the message broker (tasks queue)
- Celery Beat schedules periodic tasks (replaces the old while True loop)
- Celery Workers execute tasks (publishing posts, etc.)

Usage:
    # Start worker:
    celery -A services.celery_app worker --loglevel=info
    
    # Start beat scheduler:
    celery -A services.celery_app beat --loglevel=info
    
    # Or combined (development only):
    celery -A services.celery_app worker --beat --loglevel=info
"""

import os
from celery import Celery
from celery.schedules import crontab
import structlog

logger = structlog.get_logger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Redis URL for message broker and result backend
# Format: redis://[[username]:[password]]@host:port/db
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# =============================================================================
# CELERY APP INITIALIZATION
# =============================================================================

celery_app = Celery(
    'postbot',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['services.tasks'],  # Import task modules
)

# =============================================================================
# CELERY CONFIGURATION
# =============================================================================

celery_app.conf.update(
    # Task execution settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task behavior
    task_acks_late=True,  # Acknowledge tasks after completion (safer)
    task_reject_on_worker_lost=True,  # Re-queue tasks if worker crashes
    task_time_limit=300,  # 5 minute hard limit per task
    task_soft_time_limit=240,  # 4 minute soft limit (raises SoftTimeLimitExceeded)
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Process one task at a time (for DB-heavy tasks)
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks (prevent memory leaks)
    
    # Result backend settings (optional - we don't heavily rely on results)
    result_expires=3600,  # Results expire after 1 hour
    
    # Retry settings
    task_default_retry_delay=60,  # Wait 60 seconds before retry
    task_max_retries=3,  # Maximum 3 retries
    
    # Beat scheduler settings
    beat_schedule={
        # Check for due scheduled posts every 60 seconds
        'publish-due-posts': {
            'task': 'services.tasks.publish_due_posts_task',
            'schedule': 60.0,  # Every 60 seconds
            'options': {
                'expires': 55,  # Task expires if not picked up within 55 seconds
            },
        },
        # Health check / heartbeat every 5 minutes
        'scheduler-heartbeat': {
            'task': 'services.tasks.scheduler_heartbeat_task',
            'schedule': 300.0,  # Every 5 minutes
        },
    },
    
    # Logging
    worker_hijack_root_logger=False,  # Don't override our structlog config
)

# =============================================================================
# TASK ROUTING (Optional - for future scaling)
# =============================================================================
# Route specific tasks to specific queues for priority handling
celery_app.conf.task_routes = {
    'services.tasks.publish_due_posts_task': {'queue': 'scheduler'},
    'services.tasks.publish_single_post_task': {'queue': 'publishing'},
    'services.tasks.scheduler_heartbeat_task': {'queue': 'scheduler'},
}

# Define queue priorities
celery_app.conf.task_queues = {
    'celery': {'exchange': 'celery', 'routing_key': 'celery'},
    'scheduler': {'exchange': 'scheduler', 'routing_key': 'scheduler'},
    'publishing': {'exchange': 'publishing', 'routing_key': 'publishing'},
}

logger.info(
    "celery_app_initialized",
    broker=REDIS_URL.replace(REDIS_URL.split('@')[0] if '@' in REDIS_URL else '', '***'),
)
