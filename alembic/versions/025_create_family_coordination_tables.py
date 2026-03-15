"""create family coordination tables

Revision ID: 025_family_coordination
Revises: 024_create_document_vault_tables
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '025_family_coordination'
down_revision = '024_create_document_vault_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create family_groups table
    op.create_table(
        'family_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_family_group_institution', 'family_groups', ['institution_id'])
    op.create_index('idx_family_group_parent', 'family_groups', ['parent_id'])
    op.create_index('idx_family_group_active', 'family_groups', ['is_active'])

    # Create family_group_members table
    op.create_table(
        'family_group_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_group_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('display_color', sa.String(length=7), nullable=True),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['family_group_id'], ['family_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('family_group_id', 'student_id', name='uq_family_group_student'),
    )
    op.create_index('idx_family_member_group', 'family_group_members', ['family_group_id'])
    op.create_index('idx_family_member_student', 'family_group_members', ['student_id'])

    # Create family_calendar_events table
    op.create_table(
        'family_calendar_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_group_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['family_group_id'], ['family_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_family_calendar_group', 'family_calendar_events', ['family_group_id'])
    op.create_index('idx_family_calendar_student', 'family_calendar_events', ['student_id'])
    op.create_index('idx_family_calendar_type', 'family_calendar_events', ['event_type'])
    op.create_index('idx_family_calendar_dates', 'family_calendar_events', ['start_date', 'end_date'])

    # Create sibling_comparisons table
    op.create_table(
        'sibling_comparisons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_group_id', sa.Integer(), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('comparison_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('insights', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('privacy_level', sa.String(length=20), nullable=False, server_default='aggregated'),
        sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['family_group_id'], ['family_groups.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_sibling_comparison_group', 'sibling_comparisons', ['family_group_id'])
    op.create_index('idx_sibling_comparison_metric', 'sibling_comparisons', ['metric_type'])
    op.create_index('idx_sibling_comparison_period', 'sibling_comparisons', ['period_start', 'period_end'])

    # Create family_notification_batches table
    op.create_table(
        'family_notification_batches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_group_id', sa.Integer(), nullable=False),
        sa.Column('batch_date', sa.Date(), nullable=False),
        sa.Column('notification_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('summary', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['family_group_id'], ['family_groups.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_family_notification_batch_group', 'family_notification_batches', ['family_group_id'])
    op.create_index('idx_family_notification_batch_date', 'family_notification_batches', ['batch_date'])
    op.create_index('idx_family_notification_batch_read', 'family_notification_batches', ['is_read'])

    # Create family_notification_items table
    op.create_table(
        'family_notification_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['batch_id'], ['family_notification_batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_family_notification_item_batch', 'family_notification_items', ['batch_id'])
    op.create_index('idx_family_notification_item_student', 'family_notification_items', ['student_id'])
    op.create_index('idx_family_notification_item_type', 'family_notification_items', ['notification_type'])

    # Create shared_expenses table
    op.create_table(
        'shared_expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('family_group_id', sa.Integer(), nullable=False),
        sa.Column('expense_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('split_type', sa.String(length=20), nullable=False, server_default='equal'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('is_paid', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('transaction_id', sa.String(length=255), nullable=True),
        sa.Column('receipt_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['family_group_id'], ['family_groups.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_shared_expense_institution', 'shared_expenses', ['institution_id'])
    op.create_index('idx_shared_expense_group', 'shared_expenses', ['family_group_id'])
    op.create_index('idx_shared_expense_due_date', 'shared_expenses', ['due_date'])
    op.create_index('idx_shared_expense_paid', 'shared_expenses', ['is_paid'])

    # Create expense_splits table
    op.create_table(
        'expense_splits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('expense_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('weight', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('is_paid', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['expense_id'], ['shared_expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('expense_id', 'student_id', name='uq_expense_student_split'),
    )
    op.create_index('idx_expense_split_expense', 'expense_splits', ['expense_id'])
    op.create_index('idx_expense_split_student', 'expense_splits', ['student_id'])
    op.create_index('idx_expense_split_paid', 'expense_splits', ['is_paid'])

    # Create family_dashboard_widgets table
    op.create_table(
        'family_dashboard_widgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('family_group_id', sa.Integer(), nullable=False),
        sa.Column('widget_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['family_group_id'], ['family_groups.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_family_widget_group', 'family_dashboard_widgets', ['family_group_id'])
    op.create_index('idx_family_widget_type', 'family_dashboard_widgets', ['widget_type'])
    op.create_index('idx_family_widget_position', 'family_dashboard_widgets', ['position'])


def downgrade() -> None:
    op.drop_table('family_dashboard_widgets')
    op.drop_table('expense_splits')
    op.drop_table('shared_expenses')
    op.drop_table('family_notification_items')
    op.drop_table('family_notification_batches')
    op.drop_table('sibling_comparisons')
    op.drop_table('family_calendar_events')
    op.drop_table('family_group_members')
    op.drop_table('family_groups')
