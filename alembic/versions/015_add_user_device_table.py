"""add user device table

Revision ID: 015a_add_user_device_table
Revises: 014
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '015a_add_user_device_table'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_token', sa.String(length=500), nullable=False),
        sa.Column('device_type', sa.String(length=20), nullable=False),
        sa.Column('device_name', sa.String(length=255), nullable=True),
        sa.Column('app_version', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('topics', sa.JSON(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_device_user', 'user_devices', ['user_id'])
    op.create_index('idx_device_token', 'user_devices', ['device_token'], unique=True)
    op.create_index('idx_device_active', 'user_devices', ['is_active'])


def downgrade():
    op.drop_index('idx_device_active', table_name='user_devices')
    op.drop_index('idx_device_token', table_name='user_devices')
    op.drop_index('idx_device_user', table_name='user_devices')
    op.drop_table('user_devices')
