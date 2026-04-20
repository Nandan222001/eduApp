from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    JSON, Index, Enum as SQLAlchemyEnum
)
from enum import Enum
from src.database import Base


class MetricStatus(str, Enum):
    NORMAL = "normal"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class APIPerformanceMetric(Base):
    __tablename__ = "api_performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    endpoint = Column(String(500), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    request_size_bytes = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    institution_id = Column(Integer, nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_api_metric_timestamp_endpoint', 'timestamp', 'endpoint'),
        Index('idx_api_metric_status_code', 'status_code'),
        Index('idx_api_metric_response_time', 'response_time_ms'),
    )


class DatabaseQueryMetric(Base):
    __tablename__ = "database_query_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    query_hash = Column(String(64), nullable=False, index=True)
    query_type = Column(String(50), nullable=False)
    table_name = Column(String(100), nullable=True, index=True)
    execution_time_ms = Column(Float, nullable=False)
    rows_affected = Column(Integer, nullable=True)
    is_slow = Column(Boolean, default=False, nullable=False, index=True)
    endpoint = Column(String(500), nullable=True)
    user_id = Column(Integer, nullable=True)
    institution_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_db_metric_timestamp_table', 'timestamp', 'table_name'),
        Index('idx_db_metric_execution_time', 'execution_time_ms'),
        Index('idx_db_metric_slow_queries', 'is_slow', 'timestamp'),
    )


class CacheMetric(Base):
    __tablename__ = "cache_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    cache_key_pattern = Column(String(255), nullable=False, index=True)
    operation = Column(String(20), nullable=False)
    hit = Column(Boolean, nullable=True)
    execution_time_ms = Column(Float, nullable=False)
    key_size_bytes = Column(Integer, nullable=True)
    value_size_bytes = Column(Integer, nullable=True)
    ttl_seconds = Column(Integer, nullable=True)
    institution_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_cache_metric_timestamp_pattern', 'timestamp', 'cache_key_pattern'),
        Index('idx_cache_metric_operation_hit', 'operation', 'hit'),
    )


class TaskQueueMetric(Base):
    __tablename__ = "task_queue_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    task_name = Column(String(255), nullable=False, index=True)
    task_id = Column(String(255), nullable=True, index=True)
    status = Column(String(50), nullable=False, index=True)
    execution_time_ms = Column(Float, nullable=True)
    queue_wait_time_ms = Column(Float, nullable=True)
    retries = Column(Integer, default=0, nullable=False)
    worker_name = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    institution_id = Column(Integer, nullable=True, index=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_task_metric_timestamp_name', 'timestamp', 'task_name'),
        Index('idx_task_metric_status', 'status', 'timestamp'),
    )


class ResourceUtilizationMetric(Base):
    __tablename__ = "resource_utilization_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    metric_type = Column(String(50), nullable=False, index=True)
    cpu_percent = Column(Float, nullable=True)
    memory_percent = Column(Float, nullable=True)
    memory_used_mb = Column(Float, nullable=True)
    memory_available_mb = Column(Float, nullable=True)
    disk_percent = Column(Float, nullable=True)
    disk_used_gb = Column(Float, nullable=True)
    disk_available_gb = Column(Float, nullable=True)
    network_bytes_sent = Column(Integer, nullable=True)
    network_bytes_recv = Column(Integer, nullable=True)
    active_connections = Column(Integer, nullable=True)
    active_sessions = Column(Integer, nullable=True)
    server_name = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_resource_metric_timestamp_type', 'timestamp', 'metric_type'),
        Index('idx_resource_metric_server', 'server_name', 'timestamp'),
    )


class PerformanceAlert(Base):
    __tablename__ = "performance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    alert_type = Column(String(100), nullable=False, index=True)
    severity = Column(SQLAlchemyEnum(AlertSeverity), nullable=False, index=True)
    status = Column(SQLAlchemyEnum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    metric_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    affected_resource = Column(String(255), nullable=True)
    institution_id = Column(Integer, nullable=True, index=True)
    acknowledged_by = Column(Integer, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_alert_timestamp_severity', 'timestamp', 'severity'),
        Index('idx_alert_status_type', 'status', 'alert_type'),
        Index('idx_alert_institution', 'institution_id', 'status'),
    )
