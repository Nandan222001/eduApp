"""create password reset tokens table

Revision ID: 003
Revises: 002
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('password_reset_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_reset_tokens_id'), 'password_reset_tokens', ['id'], unique=False)
    op.create_index('idx_password_reset_token', 'password_reset_tokens', ['token'], unique=True)
    op.create_index('idx_password_reset_user', 'password_reset_tokens', ['user_id'], unique=False)
    op.create_index('idx_password_reset_expires', 'password_reset_tokens', ['expires_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_password_reset_expires', table_name='password_reset_tokens')
    op.drop_index('idx_password_reset_user', table_name='password_reset_tokens')
    op.drop_index('idx_password_reset_token', table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_id'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')
