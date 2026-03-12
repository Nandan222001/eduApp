from celery import Celery
from src.config import settings

celery_app = Celery(
    "notification_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "src.tasks.notification_tasks",
        "src.tasks.analytics_tasks",
        "src.tasks.performance_monitoring_tasks",
        "src.tasks.database_maintenance_tasks"
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
    "check-api-performance": {
        "task": "performance.check_api_performance",
        "schedule": 300.0,  # Every 5 minutes
    },
    "check-database-performance": {
        "task": "performance.check_database_performance",
        "schedule": 300.0,  # Every 5 minutes
    },
    "check-cache-performance": {
        "task": "performance.check_cache_performance",
        "schedule": 300.0,  # Every 5 minutes
    },
    "check-resource-utilization": {
        "task": "performance.check_resource_utilization",
        "schedule": 60.0,  # Every minute
    },
    "cleanup-old-metrics": {
        "task": "performance.cleanup_old_metrics",
        "schedule": 86400.0,  # Daily
    },
    "db-maintenance-vacuum-analyze": {
        "task": "db_maintenance.vacuum_analyze",
        "schedule": 86400.0,  # Daily at midnight
    },
    "db-maintenance-analyze-indexes": {
        "task": "db_maintenance.analyze_index_usage",
        "schedule": 604800.0,  # Weekly
    },
    "db-maintenance-cleanup-dead-tuples": {
        "task": "db_maintenance.cleanup_dead_tuples",
        "schedule": 21600.0,  # Every 6 hours
    },
    "db-maintenance-log-slow-queries": {
        "task": "db_maintenance.log_slow_queries",
        "schedule": 3600.0,  # Every hour
    },
    "db-maintenance-create-partitions": {
        "task": "db_maintenance.create_partitions",
        "schedule": 86400.0,  # Daily
    },
    "db-maintenance-table-bloat-report": {
        "task": "db_maintenance.table_bloat_report",
        "schedule": 604800.0,  # Weekly
    },
    "db-maintenance-update-statistics": {
        "task": "db_maintenance.update_statistics",
        "schedule": 43200.0,  # Every 12 hours
    },
}
