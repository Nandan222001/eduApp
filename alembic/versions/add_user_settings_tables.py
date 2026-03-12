"""Add user settings tables

Revision ID: add_user_settings
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_settings'
down_revision = None  # Update this to the latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create user_settings table
    op.create_table(
        'user_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme_mode', sa.String(length=10), nullable=False, server_default='auto'),
        sa.Column('primary_color', sa.String(length=20), nullable=True),
        sa.Column('font_size', sa.String(length=10), nullable=False, server_default='medium'),
        sa.Column('compact_mode', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='America/New_York'),
        sa.Column('profile_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_in_leaderboard', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_email', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('show_phone', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('allow_messages', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_online_status', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notification_preferences', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_user_settings_user_id', 'user_settings', ['user_id'])

    # Create user_devices table
    op.create_table(
        'user_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_name', sa.String(length=255), nullable=False),
        sa.Column('device_type', sa.String(length=20), nullable=False),
        sa.Column('browser', sa.String(length=100), nullable=True),
        sa.Column('os', sa.String(length=100), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('session_token', sa.String(length=500), nullable=False),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_active', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_token')
    )
    op.create_index('ix_user_devices_user_id', 'user_devices', ['user_id'])
    op.create_index('ix_user_devices_session_token', 'user_devices', ['session_token'])

    # Create account_deletion_requests table
    op.create_table(
        'account_deletion_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('scheduled_date', sa.DateTime(), nullable=True),
        sa.Column('confirmation_token', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('confirmation_token')
    )
    op.create_index('ix_account_deletion_requests_user_id', 'account_deletion_requests', ['user_id'])


def downgrade():
    op.drop_index('ix_account_deletion_requests_user_id', table_name='account_deletion_requests')
    op.drop_table('account_deletion_requests')
    
    op.drop_index('ix_user_devices_session_token', table_name='user_devices')
    op.drop_index('ix_user_devices_user_id', table_name='user_devices')
    op.drop_table('user_devices')
    
    op.drop_index('ix_user_settings_user_id', table_name='user_settings')
    op.drop_table('user_settings')
