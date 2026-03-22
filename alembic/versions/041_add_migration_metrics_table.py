"""add migration execution metrics table

Revision ID: 041
Revises: 040
Create Date: 2024-01-20 10:00:00.000000

This migration creates a table to track migration execution metrics.
"""
from alembic import op
import sqlalchemy as sa

revision = '041'
down_revision = '040'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create migration execution metrics table."""
    conn = op.get_bind()
    
    # Check if table already exists
    table_exists = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'migration_execution_metrics'
        )
    """)).scalar()
    
    if not table_exists:
        op.create_table(
            'migration_execution_metrics',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('migration_name', sa.String(length=255), nullable=False),
            sa.Column('duration_seconds', sa.Float(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('executed_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes for common queries
        op.create_index(
            'ix_migration_metrics_name',
            'migration_execution_metrics',
            ['migration_name']
        )
        
        op.create_index(
            'ix_migration_metrics_executed_at',
            'migration_execution_metrics',
            ['executed_at']
        )
        
        op.create_index(
            'ix_migration_metrics_status',
            'migration_execution_metrics',
            ['status']
        )
        
        print("Created migration_execution_metrics table")
    else:
        print("Table migration_execution_metrics already exists")


def downgrade() -> None:
    """Drop migration execution metrics table."""
    conn = op.get_bind()
    
    # Check if table exists
    table_exists = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'migration_execution_metrics'
        )
    """)).scalar()
    
    if table_exists:
        op.drop_index('ix_migration_metrics_status', table_name='migration_execution_metrics')
        op.drop_index('ix_migration_metrics_executed_at', table_name='migration_execution_metrics')
        op.drop_index('ix_migration_metrics_name', table_name='migration_execution_metrics')
        op.drop_table('migration_execution_metrics')
        print("Dropped migration_execution_metrics table")
