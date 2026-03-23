"""create analytics tables

Revision ID: create_analytics_tables
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'create_analytics_tables'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create analytics_events table
    op.create_table(
        'analytics_events',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('institution_id', sa.String(36), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('referrer', sa.String(length=500), nullable=True),
        sa.Column('url', sa.String(length=1000), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_analytics_events_event_name', 'analytics_events', ['event_name'])
    op.create_index('ix_analytics_events_event_type', 'analytics_events', ['event_type'])
    op.create_index('ix_analytics_events_user_id', 'analytics_events', ['user_id'])
    op.create_index('ix_analytics_events_session_id', 'analytics_events', ['session_id'])
    op.create_index('ix_analytics_events_institution_id', 'analytics_events', ['institution_id'])
    op.create_index('ix_analytics_events_created_at', 'analytics_events', ['created_at'])
    op.create_index('ix_analytics_events_user_created', 'analytics_events', ['user_id', 'created_at'])
    op.create_index('ix_analytics_events_institution_created', 'analytics_events', ['institution_id', 'created_at'])
    op.create_index('ix_analytics_events_event_created', 'analytics_events', ['event_name', 'created_at'])

    # Create performance_metrics table
    op.create_table(
        'performance_metrics',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('url', sa.String(length=1000), nullable=True),
        sa.Column('rating', sa.String(length=20), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_performance_metrics_metric_name', 'performance_metrics', ['metric_name'])
    op.create_index('ix_performance_metrics_user_id', 'performance_metrics', ['user_id'])
    op.create_index('ix_performance_metrics_session_id', 'performance_metrics', ['session_id'])
    op.create_index('ix_performance_metrics_created_at', 'performance_metrics', ['created_at'])
    op.create_index('ix_performance_metrics_metric_created', 'performance_metrics', ['metric_name', 'created_at'])
    op.create_index('ix_performance_metrics_user_created', 'performance_metrics', ['user_id', 'created_at'])

    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('institution_id', sa.String(36), nullable=True),
        sa.Column('first_seen', sa.DateTime(), nullable=False),
        sa.Column('last_seen', sa.DateTime(), nullable=False),
        sa.Column('page_views', sa.Integer(), nullable=True),
        sa.Column('events_count', sa.Integer(), nullable=True),
        sa.Column('landing_page', sa.String(length=1000), nullable=True),
        sa.Column('exit_page', sa.String(length=1000), nullable=True),
        sa.Column('referrer', sa.String(length=500), nullable=True),
        sa.Column('device_type', sa.String(length=50), nullable=True),
        sa.Column('browser', sa.String(length=100), nullable=True),
        sa.Column('os', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id')
    )
    op.create_index('ix_user_sessions_session_id', 'user_sessions', ['session_id'])
    op.create_index('ix_user_sessions_user_id', 'user_sessions', ['user_id'])
    op.create_index('ix_user_sessions_institution_id', 'user_sessions', ['institution_id'])
    op.create_index('ix_user_sessions_first_seen', 'user_sessions', ['first_seen'])
    op.create_index('ix_user_sessions_user_created', 'user_sessions', ['user_id', 'created_at'])

    # Create feature_usage table
    op.create_table(
        'feature_usage',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('feature_name', sa.String(length=255), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('institution_id', sa.String(36), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=True),
        sa.Column('first_used_at', sa.DateTime(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(), nullable=False),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feature_usage_feature_name', 'feature_usage', ['feature_name'])
    op.create_index('ix_feature_usage_user_id', 'feature_usage', ['user_id'])
    op.create_index('ix_feature_usage_institution_id', 'feature_usage', ['institution_id'])
    op.create_index('ix_feature_usage_created_at', 'feature_usage', ['created_at'])
    op.create_index('ix_feature_usage_feature_user', 'feature_usage', ['feature_name', 'user_id'])
    op.create_index('ix_feature_usage_institution_created', 'feature_usage', ['institution_id', 'created_at'])

    # Create user_retention table
    op.create_table(
        'user_retention',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('institution_id', sa.String(36), nullable=True),
        sa.Column('cohort_date', sa.DateTime(), nullable=False),
        sa.Column('activity_date', sa.DateTime(), nullable=False),
        sa.Column('days_since_cohort', sa.Integer(), nullable=False),
        sa.Column('sessions_count', sa.Integer(), nullable=True),
        sa.Column('events_count', sa.Integer(), nullable=True),
        sa.Column('time_spent_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_retention_user_id', 'user_retention', ['user_id'])
    op.create_index('ix_user_retention_institution_id', 'user_retention', ['institution_id'])
    op.create_index('ix_user_retention_cohort_date', 'user_retention', ['cohort_date'])
    op.create_index('ix_user_retention_activity_date', 'user_retention', ['activity_date'])
    op.create_index('ix_user_retention_user_activity', 'user_retention', ['user_id', 'activity_date'])
    op.create_index('ix_user_retention_cohort_days', 'user_retention', ['cohort_date', 'days_since_cohort'])


def downgrade() -> None:
    op.drop_table('user_retention')
    op.drop_table('feature_usage')
    op.drop_table('user_sessions')
    op.drop_table('performance_metrics')
    op.drop_table('analytics_events')
