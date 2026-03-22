"""create performance monitoring tables

Revision ID: performance_monitoring_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'performance_monitoring_001'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE alertseverity AS ENUM ('low', 'medium', 'high', 'critical')")
    op.execute("CREATE TYPE alertstatus AS ENUM ('active', 'acknowledged', 'resolved')")
    
    # Create api_performance_metrics table
    op.create_table(
        'api_performance_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('endpoint', sa.String(length=500), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('response_time_ms', sa.Float(), nullable=False),
        sa.Column('request_size_bytes', sa.Integer(), nullable=True),
        sa.Column('response_size_bytes', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_api_metric_timestamp', 'api_performance_metrics', ['timestamp'])
    op.create_index('idx_api_metric_endpoint', 'api_performance_metrics', ['endpoint'])
    op.create_index('idx_api_metric_timestamp_endpoint', 'api_performance_metrics', ['timestamp', 'endpoint'])
    op.create_index('idx_api_metric_status_code', 'api_performance_metrics', ['status_code'])
    op.create_index('idx_api_metric_response_time', 'api_performance_metrics', ['response_time_ms'])
    op.create_index('idx_api_metric_user_id', 'api_performance_metrics', ['user_id'])
    op.create_index('idx_api_metric_institution_id', 'api_performance_metrics', ['institution_id'])
    
    # Create database_query_metrics table
    op.create_table(
        'database_query_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('query_hash', sa.String(length=64), nullable=False),
        sa.Column('query_type', sa.String(length=50), nullable=False),
        sa.Column('table_name', sa.String(length=100), nullable=True),
        sa.Column('execution_time_ms', sa.Float(), nullable=False),
        sa.Column('rows_affected', sa.Integer(), nullable=True),
        sa.Column('is_slow', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('endpoint', sa.String(length=500), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_db_metric_timestamp', 'database_query_metrics', ['timestamp'])
    op.create_index('idx_db_metric_query_hash', 'database_query_metrics', ['query_hash'])
    op.create_index('idx_db_metric_table_name', 'database_query_metrics', ['table_name'])
    op.create_index('idx_db_metric_timestamp_table', 'database_query_metrics', ['timestamp', 'table_name'])
    op.create_index('idx_db_metric_execution_time', 'database_query_metrics', ['execution_time_ms'])
    op.create_index('idx_db_metric_slow_queries', 'database_query_metrics', ['is_slow', 'timestamp'])
    op.create_index('idx_db_metric_institution_id', 'database_query_metrics', ['institution_id'])
    
    # Create cache_metrics table
    op.create_table(
        'cache_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('cache_key_pattern', sa.String(length=255), nullable=False),
        sa.Column('operation', sa.String(length=20), nullable=False),
        sa.Column('hit', sa.Boolean(), nullable=True),
        sa.Column('execution_time_ms', sa.Float(), nullable=False),
        sa.Column('key_size_bytes', sa.Integer(), nullable=True),
        sa.Column('value_size_bytes', sa.Integer(), nullable=True),
        sa.Column('ttl_seconds', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_cache_metric_timestamp', 'cache_metrics', ['timestamp'])
    op.create_index('idx_cache_metric_pattern', 'cache_metrics', ['cache_key_pattern'])
    op.create_index('idx_cache_metric_timestamp_pattern', 'cache_metrics', ['timestamp', 'cache_key_pattern'])
    op.create_index('idx_cache_metric_operation_hit', 'cache_metrics', ['operation', 'hit'])
    op.create_index('idx_cache_metric_institution_id', 'cache_metrics', ['institution_id'])
    
    # Create task_queue_metrics table
    op.create_table(
        'task_queue_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('task_name', sa.String(length=255), nullable=False),
        sa.Column('task_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('execution_time_ms', sa.Float(), nullable=True),
        sa.Column('queue_wait_time_ms', sa.Float(), nullable=True),
        sa.Column('retries', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('worker_name', sa.String(length=100), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_task_metric_timestamp', 'task_queue_metrics', ['timestamp'])
    op.create_index('idx_task_metric_name', 'task_queue_metrics', ['task_name'])
    op.create_index('idx_task_metric_task_id', 'task_queue_metrics', ['task_id'])
    op.create_index('idx_task_metric_status', 'task_queue_metrics', ['status'])
    op.create_index('idx_task_metric_timestamp_name', 'task_queue_metrics', ['timestamp', 'task_name'])
    op.create_index('idx_task_metric_status_timestamp', 'task_queue_metrics', ['status', 'timestamp'])
    op.create_index('idx_task_metric_institution_id', 'task_queue_metrics', ['institution_id'])
    
    # Create resource_utilization_metrics table
    op.create_table(
        'resource_utilization_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=False),
        sa.Column('cpu_percent', sa.Float(), nullable=True),
        sa.Column('memory_percent', sa.Float(), nullable=True),
        sa.Column('memory_used_mb', sa.Float(), nullable=True),
        sa.Column('memory_available_mb', sa.Float(), nullable=True),
        sa.Column('disk_percent', sa.Float(), nullable=True),
        sa.Column('disk_used_gb', sa.Float(), nullable=True),
        sa.Column('disk_available_gb', sa.Float(), nullable=True),
        sa.Column('network_bytes_sent', sa.Integer(), nullable=True),
        sa.Column('network_bytes_recv', sa.Integer(), nullable=True),
        sa.Column('active_connections', sa.Integer(), nullable=True),
        sa.Column('active_sessions', sa.Integer(), nullable=True),
        sa.Column('server_name', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_resource_metric_timestamp', 'resource_utilization_metrics', ['timestamp'])
    op.create_index('idx_resource_metric_type', 'resource_utilization_metrics', ['metric_type'])
    op.create_index('idx_resource_metric_timestamp_type', 'resource_utilization_metrics', ['timestamp', 'metric_type'])
    op.create_index('idx_resource_metric_server', 'resource_utilization_metrics', ['server_name', 'timestamp'])
    
    # Create performance_alerts table
    op.create_table(
        'performance_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('alert_type', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.Enum('low', 'medium', 'high', 'critical', name='alertseverity'), nullable=False),
        sa.Column('status', sa.Enum('active', 'acknowledged', 'resolved', name='alertstatus'), nullable=False, server_default='active'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=True),
        sa.Column('threshold_value', sa.Float(), nullable=True),
        sa.Column('affected_resource', sa.String(length=255), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('acknowledged_by', sa.Integer(), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_alert_timestamp', 'performance_alerts', ['timestamp'])
    op.create_index('idx_alert_type', 'performance_alerts', ['alert_type'])
    op.create_index('idx_alert_severity', 'performance_alerts', ['severity'])
    op.create_index('idx_alert_status', 'performance_alerts', ['status'])
    op.create_index('idx_alert_timestamp_severity', 'performance_alerts', ['timestamp', 'severity'])
    op.create_index('idx_alert_status_type', 'performance_alerts', ['status', 'alert_type'])
    op.create_index('idx_alert_institution', 'performance_alerts', ['institution_id', 'status'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('performance_alerts')
    op.drop_table('resource_utilization_metrics')
    op.drop_table('task_queue_metrics')
    op.drop_table('cache_metrics')
    op.drop_table('database_query_metrics')
    op.drop_table('api_performance_metrics')
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS alertstatus")
    op.execute("DROP TYPE IF EXISTS alertseverity")
