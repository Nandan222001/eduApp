"""add impersonation and debugging tables

Revision ID: 018_impersonation_debug
Revises: 017_create_adaptive_learning_path_tables
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '018_impersonation_debug'
down_revision = '017_create_adaptive_learning_path_tables'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'impersonation_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('super_admin_id', sa.Integer(), nullable=True),
        sa.Column('impersonated_user_id', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('actions_performed', JSONB, nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['super_admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['impersonated_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_impersonation_super_admin', 'impersonation_logs', ['super_admin_id'])
    op.create_index('idx_impersonation_user', 'impersonation_logs', ['impersonated_user_id'])
    op.create_index('idx_impersonation_active', 'impersonation_logs', ['is_active'])
    op.create_index('idx_impersonation_started', 'impersonation_logs', ['started_at'])
    op.create_index('idx_impersonation_ended', 'impersonation_logs', ['ended_at'])

    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('activity_type', sa.String(length=100), nullable=False),
        sa.Column('activity_category', sa.String(length=50), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=True),
        sa.Column('method', sa.String(length=10), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('request_data', JSONB, nullable=True),
        sa.Column('response_data', JSONB, nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_activity_institution_user', 'activity_logs', ['institution_id', 'user_id'])
    op.create_index('idx_activity_type', 'activity_logs', ['activity_type'])
    op.create_index('idx_activity_category', 'activity_logs', ['activity_category'])
    op.create_index('idx_activity_created', 'activity_logs', ['created_at'])
    op.create_index('idx_activity_status', 'activity_logs', ['status_code'])

    op.create_table(
        'session_replays',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('events', JSONB, nullable=False),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('page_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('interaction_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_session_replay_session', 'session_replays', ['session_id'])
    op.create_index('idx_session_replay_user', 'session_replays', ['user_id'])
    op.create_index('idx_session_replay_started', 'session_replays', ['started_at'])


def downgrade():
    op.drop_index('idx_session_replay_started', table_name='session_replays')
    op.drop_index('idx_session_replay_user', table_name='session_replays')
    op.drop_index('idx_session_replay_session', table_name='session_replays')
    op.drop_table('session_replays')
    
    op.drop_index('idx_activity_status', table_name='activity_logs')
    op.drop_index('idx_activity_created', table_name='activity_logs')
    op.drop_index('idx_activity_category', table_name='activity_logs')
    op.drop_index('idx_activity_type', table_name='activity_logs')
    op.drop_index('idx_activity_institution_user', table_name='activity_logs')
    op.drop_table('activity_logs')
    
    op.drop_index('idx_impersonation_ended', table_name='impersonation_logs')
    op.drop_index('idx_impersonation_started', table_name='impersonation_logs')
    op.drop_index('idx_impersonation_active', table_name='impersonation_logs')
    op.drop_index('idx_impersonation_user', table_name='impersonation_logs')
    op.drop_index('idx_impersonation_super_admin', table_name='impersonation_logs')
    op.drop_table('impersonation_logs')
