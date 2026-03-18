"""add feedback table

Revision ID: add_feedback_table
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_feedback_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'feedbacks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('subject', sa.String(200), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('rating', sa.Integer, nullable=True),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('metadata', postgresql.JSON, server_default='{}'),
        sa.Column('admin_response', sa.Text, nullable=True),
        sa.Column('created_at', sa.String, nullable=False),
        sa.Column('updated_at', sa.String, nullable=False),
    )
    
    op.create_index('idx_feedbacks_user_id', 'feedbacks', ['user_id'])
    op.create_index('idx_feedbacks_category', 'feedbacks', ['category'])
    op.create_index('idx_feedbacks_status', 'feedbacks', ['status'])
    op.create_index('idx_feedbacks_created_at', 'feedbacks', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_feedbacks_created_at', 'feedbacks')
    op.drop_index('idx_feedbacks_status', 'feedbacks')
    op.drop_index('idx_feedbacks_category', 'feedbacks')
    op.drop_index('idx_feedbacks_user_id', 'feedbacks')
    op.drop_table('feedbacks')
