"""create fee management tables

Revision ID: 026_fee_management
Revises: 025_family_coordination
Create Date: 2024-01-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '026_fee_management'
down_revision = '025_family_coordination'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create fee_structures table
    op.create_table(
        'fee_structures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('recurrence_period', sa.String(length=50), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('late_fee_applicable', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('late_fee_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('late_fee_percentage', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_fee_structure_institution', 'fee_structures', ['institution_id'])
    op.create_index('idx_fee_structure_academic_year', 'fee_structures', ['academic_year_id'])
    op.create_index('idx_fee_structure_grade', 'fee_structures', ['grade_id'])
    op.create_index('idx_fee_structure_category', 'fee_structures', ['category'])
    op.create_index('idx_fee_structure_due_date', 'fee_structures', ['due_date'])
    op.create_index('idx_fee_structure_active', 'fee_structures', ['is_active'])

    # Create fee_payments table
    op.create_table(
        'fee_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('fee_structure_id', sa.Integer(), nullable=False),
        sa.Column('receipt_number', sa.String(length=100), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('amount_paid', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('late_fee', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='completed'),
        sa.Column('transaction_id', sa.String(length=255), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('collected_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('receipt_number'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['fee_structure_id'], ['fee_structures.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['collected_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_fee_payment_institution', 'fee_payments', ['institution_id'])
    op.create_index('idx_fee_payment_student', 'fee_payments', ['student_id'])
    op.create_index('idx_fee_payment_fee_structure', 'fee_payments', ['fee_structure_id'])
    op.create_index('idx_fee_payment_receipt', 'fee_payments', ['receipt_number'], unique=True)
    op.create_index('idx_fee_payment_date', 'fee_payments', ['payment_date'])
    op.create_index('idx_fee_payment_status', 'fee_payments', ['payment_status'])
    op.create_index('idx_fee_payment_collected_by', 'fee_payments', ['collected_by'])

    # Create fee_waivers table
    op.create_table(
        'fee_waivers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('fee_structure_id', sa.Integer(), nullable=False),
        sa.Column('waiver_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('waiver_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_until', sa.Date(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['fee_structure_id'], ['fee_structures.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_fee_waiver_institution', 'fee_waivers', ['institution_id'])
    op.create_index('idx_fee_waiver_student', 'fee_waivers', ['student_id'])
    op.create_index('idx_fee_waiver_fee_structure', 'fee_waivers', ['fee_structure_id'])
    op.create_index('idx_fee_waiver_valid_from', 'fee_waivers', ['valid_from'])
    op.create_index('idx_fee_waiver_valid_until', 'fee_waivers', ['valid_until'])
    op.create_index('idx_fee_waiver_active', 'fee_waivers', ['is_active'])
    op.create_index('idx_fee_waiver_approved_by', 'fee_waivers', ['approved_by'])


def downgrade() -> None:
    op.drop_table('fee_waivers')
    op.drop_table('fee_payments')
    op.drop_table('fee_structures')
