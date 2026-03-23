"""add_push_devices_table

Revision ID: add_push_devices_table
Revises: create_notification_tables
Create Date: 2024-03-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_push_devices_table'
down_revision = 'create_notification_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('push_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=500), nullable=False),
        sa.Column('device_type', sa.String(length=20), nullable=False),
        sa.Column('device_id', sa.String(length=255), nullable=False),
        sa.Column('topics', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_used_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index('idx_push_device_user', 'push_devices', ['user_id'])
    op.create_index('idx_push_device_token', 'push_devices', ['token'])
    op.create_index('idx_push_device_active', 'push_devices', ['is_active'])


def downgrade() -> None:
    op.drop_index('idx_push_device_active', table_name='push_devices')
    op.drop_index('idx_push_device_token', table_name='push_devices')
    op.drop_index('idx_push_device_user', table_name='push_devices')
    op.drop_table('push_devices')
