"""add_notification_devices_table

Revision ID: add_notification_devices_table
Revises: add_push_devices_table
Create Date: 2024-03-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_notification_devices_table'
down_revision = 'add_push_devices_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('notification_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('device_token', sa.String(length=500), nullable=False),
        sa.Column('device_type', sa.String(length=20), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('device_info', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('app_version', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_used_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_notification_device_user', 'notification_devices', ['user_id'])
    op.create_index('idx_notification_device_token', 'notification_devices', ['device_token'])
    op.create_index('idx_notification_device_active', 'notification_devices', ['is_active'])
    op.create_index('idx_notification_device_user_active', 'notification_devices', ['user_id', 'is_active'])


def downgrade() -> None:
    op.drop_index('idx_notification_device_user_active', table_name='notification_devices')
    op.drop_index('idx_notification_device_active', table_name='notification_devices')
    op.drop_index('idx_notification_device_token', table_name='notification_devices')
    op.drop_index('idx_notification_device_user', table_name='notification_devices')
    op.drop_table('notification_devices')
