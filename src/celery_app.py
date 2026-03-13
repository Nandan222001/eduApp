from celery import Celery
from src.config import settings

celery_app = Celery(
    "notification_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "src.tasks.notification_tasks",
        "src.tasks.analytics_tasks",
        "src.tasks.ml_training_tasks"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    result_expires=3600,
)

celery_app.conf.beat_schedule = {
    "send-scheduled-announcements": {
        "task": "src.tasks.notification_tasks.send_scheduled_announcements",
        "schedule": 60.0,
    },
    "cleanup-old-notifications": {
        "task": "src.tasks.notification_tasks.cleanup_old_notifications",
        "schedule": 86400.0,
    },
    "retry-failed-notifications": {
        "task": "src.tasks.notification_tasks.retry_failed_notifications",
        "schedule": 3600.0,  # Every hour
    },
    "aggregate-notification-analytics": {
        "task": "src.tasks.notification_tasks.aggregate_analytics",
        "schedule": 3600.0,  # Every hour
    },
    "process-grouped-notifications": {
        "task": "src.tasks.notification_tasks.process_grouped_notifications",
        "schedule": 900.0,  # Every 15 minutes
    },
    "send-hourly-digest": {
        "task": "src.tasks.notification_tasks.send_digest_notifications",
        "schedule": 3600.0,  # Every hour
        "kwargs": {"digest_type": "hourly"}
    },
    "daily-analytics-aggregation": {
        "task": "analytics.daily_aggregation",
        "schedule": 86400.0,
    },
    "clean-analytics-cache": {
        "task": "analytics.clean_expired_cache",
        "schedule": 3600.0,
    },
}
