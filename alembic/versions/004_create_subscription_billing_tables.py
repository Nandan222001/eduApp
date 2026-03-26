"""create subscription billing tables

Revision ID: 004
Revises: 003
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('DROP TABLE IF EXISTS subscriptions CASCADE')
    
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('plan_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('billing_cycle', sa.String(length=50), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('max_users', sa.Integer(), nullable=True),
        sa.Column('max_storage_gb', sa.Integer(), nullable=True),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('trial_end_date', sa.DateTime(), nullable=True),
        sa.Column('grace_period_end', sa.DateTime(), nullable=True),
        sa.Column('canceled_at', sa.DateTime(), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(), nullable=True),
        sa.Column('auto_renew', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('external_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_customer_id', sa.String(length=255), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_subscription_institution_id', 'subscriptions', ['institution_id'])
    op.create_index('idx_subscription_plan_name', 'subscriptions', ['plan_name'])
    op.create_index('idx_subscription_status', 'subscriptions', ['status'])
    op.create_index('idx_subscription_institution_status', 'subscriptions', ['institution_id', 'status'])
    op.create_index('idx_subscription_dates', 'subscriptions', ['start_date', 'end_date'])
    op.create_index('idx_subscription_next_billing', 'subscriptions', ['next_billing_date'])
    op.create_index('idx_subscription_grace_period', 'subscriptions', ['grace_period_end'])
    op.create_index('idx_subscription_external_id', 'subscriptions', ['external_subscription_id'])
    op.create_index('idx_subscription_razorpay_id', 'subscriptions', ['razorpay_subscription_id'])
    op.create_index('idx_subscription_razorpay_customer_id', 'subscriptions', ['razorpay_customer_id'])

    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_order_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_signature', sa.String(length=500), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_payment_subscription_id', 'payments', ['subscription_id'])
    op.create_index('idx_payment_institution_id', 'payments', ['institution_id'])
    op.create_index('idx_payment_status', 'payments', ['status'])
    op.create_index('idx_payment_created', 'payments', ['created_at'])
    op.create_index('idx_payment_razorpay_payment_id', 'payments', ['razorpay_payment_id'], unique=True)
    op.create_index('idx_payment_razorpay_order_id', 'payments', ['razorpay_order_id'])

    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('billing_period_start', sa.DateTime(), nullable=False),
        sa.Column('billing_period_end', sa.DateTime(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('invoice_url', sa.String(length=500), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_invoice_subscription_id', 'invoices', ['subscription_id'])
    op.create_index('idx_invoice_institution_id', 'invoices', ['institution_id'])
    op.create_index('idx_invoice_number', 'invoices', ['invoice_number'], unique=True)
    op.create_index('idx_invoice_status', 'invoices', ['status'])
    op.create_index('idx_invoice_due_date', 'invoices', ['due_date'])
    op.create_index('idx_invoice_created', 'invoices', ['created_at'])

    op.create_table(
        'usage_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_value', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_usage_subscription_id', 'usage_records', ['subscription_id'])
    op.create_index('idx_usage_institution_id', 'usage_records', ['institution_id'])
    op.create_index('idx_usage_metric', 'usage_records', ['metric_name'])
    op.create_index('idx_usage_recorded', 'usage_records', ['recorded_at'])
    op.create_index('idx_usage_period', 'usage_records', ['period_start', 'period_end'])


def downgrade() -> None:
    op.drop_index('idx_usage_period', table_name='usage_records')
    op.drop_index('idx_usage_recorded', table_name='usage_records')
    op.drop_index('idx_usage_metric', table_name='usage_records')
    op.drop_index('idx_usage_institution_id', table_name='usage_records')
    op.drop_index('idx_usage_subscription_id', table_name='usage_records')
    op.drop_table('usage_records')
    
    op.drop_index('idx_invoice_created', table_name='invoices')
    op.drop_index('idx_invoice_due_date', table_name='invoices')
    op.drop_index('idx_invoice_status', table_name='invoices')
    op.drop_index('idx_invoice_number', table_name='invoices')
    op.drop_index('idx_invoice_institution_id', table_name='invoices')
    op.drop_index('idx_invoice_subscription_id', table_name='invoices')
    op.drop_table('invoices')
    
    op.drop_index('idx_payment_razorpay_order_id', table_name='payments')
    op.drop_index('idx_payment_razorpay_payment_id', table_name='payments')
    op.drop_index('idx_payment_created', table_name='payments')
    op.drop_index('idx_payment_status', table_name='payments')
    op.drop_index('idx_payment_institution_id', table_name='payments')
    op.drop_index('idx_payment_subscription_id', table_name='payments')
    op.drop_table('payments')
    
    op.drop_index('idx_subscription_razorpay_customer_id', table_name='subscriptions')
    op.drop_index('idx_subscription_razorpay_id', table_name='subscriptions')
    op.drop_index('idx_subscription_external_id', table_name='subscriptions')
    op.drop_index('idx_subscription_grace_period', table_name='subscriptions')
    op.drop_index('idx_subscription_next_billing', table_name='subscriptions')
    op.drop_index('idx_subscription_dates', table_name='subscriptions')
    op.drop_index('idx_subscription_institution_status', table_name='subscriptions')
    op.drop_index('idx_subscription_status', table_name='subscriptions')
    op.drop_index('idx_subscription_plan_name', table_name='subscriptions')
    op.drop_index('idx_subscription_institution_id', table_name='subscriptions')
    op.drop_table('subscriptions')
