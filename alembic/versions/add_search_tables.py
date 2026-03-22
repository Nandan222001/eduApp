"""Add search tables

Revision ID: add_search_tables
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_search_tables'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Create search_history table
    op.create_table(
        'search_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('query', sa.String(length=500), nullable=False),
        sa.Column('search_type', sa.String(length=50), nullable=True),
        sa.Column('filters', sa.JSON(), nullable=True),
        sa.Column('results_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_search_history_user', 'search_history', ['user_id'])
    op.create_index('idx_search_history_institution', 'search_history', ['institution_id'])
    op.create_index('idx_search_history_created', 'search_history', ['created_at'])
    op.create_index('idx_search_history_user_created', 'search_history', ['user_id', 'created_at'])

    # Create popular_searches table
    op.create_table(
        'popular_searches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=True),
        sa.Column('query', sa.String(length=500), nullable=False),
        sa.Column('search_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('last_searched_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_popular_search_institution', 'popular_searches', ['institution_id'])
    op.create_index('idx_popular_search_role', 'popular_searches', ['role'])
    op.create_index('idx_popular_search_count', 'popular_searches', ['search_count'])
    op.create_index('idx_popular_search_institution_role', 'popular_searches', ['institution_id', 'role'])


def downgrade():
    op.drop_index('idx_popular_search_institution_role', table_name='popular_searches')
    op.drop_index('idx_popular_search_count', table_name='popular_searches')
    op.drop_index('idx_popular_search_role', table_name='popular_searches')
    op.drop_index('idx_popular_search_institution', table_name='popular_searches')
    op.drop_table('popular_searches')
    
    op.drop_index('idx_search_history_user_created', table_name='search_history')
    op.drop_index('idx_search_history_created', table_name='search_history')
    op.drop_index('idx_search_history_institution', table_name='search_history')
    op.drop_index('idx_search_history_user', table_name='search_history')
    op.drop_table('search_history')
