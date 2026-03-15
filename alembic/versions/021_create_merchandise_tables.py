"""create merchandise tables

Revision ID: 021_create_merchandise
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '021_create_merchandise'
down_revision: Union[str, None] = '020_create_super_admin_reports_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create merchandise_items table
    op.create_table(
        'merchandise_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('size_options', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('color_options', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('mockup_images', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('print_provider', sa.String(length=50), nullable=False),
        sa.Column('product_template_id', sa.String(length=255), nullable=True),
        sa.Column('inventory_tracking', sa.Boolean(), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_merchandise_active', 'merchandise_items', ['is_active'])
    op.create_index('idx_merchandise_institution_category', 'merchandise_items', ['institution_id', 'category'])
    op.create_index('idx_merchandise_provider', 'merchandise_items', ['print_provider'])
    op.create_index(op.f('ix_merchandise_items_id'), 'merchandise_items', ['id'])
    op.create_index(op.f('ix_merchandise_items_institution_id'), 'merchandise_items', ['institution_id'])

    # Create merchandise_orders table
    op.create_table(
        'merchandise_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('order_number', sa.String(length=100), nullable=False),
        sa.Column('buyer_name', sa.String(length=255), nullable=False),
        sa.Column('buyer_email', sa.String(length=255), nullable=False),
        sa.Column('buyer_phone', sa.String(length=20), nullable=True),
        sa.Column('shipping_name', sa.String(length=255), nullable=False),
        sa.Column('shipping_address_line1', sa.String(length=255), nullable=False),
        sa.Column('shipping_address_line2', sa.String(length=255), nullable=True),
        sa.Column('shipping_city', sa.String(length=100), nullable=False),
        sa.Column('shipping_state', sa.String(length=100), nullable=False),
        sa.Column('shipping_postal_code', sa.String(length=20), nullable=False),
        sa.Column('shipping_country', sa.String(length=100), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('shipping_cost', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('customization', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('order_status', sa.String(length=50), nullable=False),
        sa.Column('tracking_number', sa.String(length=255), nullable=True),
        sa.Column('payment_status', sa.String(length=50), nullable=False),
        sa.Column('razorpay_order_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_signature', sa.String(length=500), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('commission_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('commission_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('commission_paid', sa.Boolean(), nullable=False),
        sa.Column('commission_paid_at', sa.DateTime(), nullable=True),
        sa.Column('printful_order_id', sa.String(length=255), nullable=True),
        sa.Column('external_order_id', sa.String(length=255), nullable=True),
        sa.Column('fulfillment_status', sa.String(length=50), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('shipped_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('canceled_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_number'),
        sa.UniqueConstraint('razorpay_payment_id')
    )
    op.create_index('idx_merchandise_created', 'merchandise_orders', ['created_at'])
    op.create_index('idx_merchandise_order_status', 'merchandise_orders', ['order_status'])
    op.create_index('idx_merchandise_payment_status', 'merchandise_orders', ['payment_status'])
    op.create_index('idx_merchandise_user', 'merchandise_orders', ['user_id'])
    op.create_index(op.f('ix_merchandise_orders_id'), 'merchandise_orders', ['id'])
    op.create_index(op.f('ix_merchandise_orders_institution_id'), 'merchandise_orders', ['institution_id'])
    op.create_index(op.f('ix_merchandise_orders_order_number'), 'merchandise_orders', ['order_number'])
    op.create_index(op.f('ix_merchandise_orders_printful_order_id'), 'merchandise_orders', ['printful_order_id'])
    op.create_index(op.f('ix_merchandise_orders_razorpay_order_id'), 'merchandise_orders', ['razorpay_order_id'])
    op.create_index(op.f('ix_merchandise_orders_razorpay_payment_id'), 'merchandise_orders', ['razorpay_payment_id'])
    op.create_index(op.f('ix_merchandise_orders_user_id'), 'merchandise_orders', ['user_id'])

    # Create merchandise_order_items table
    op.create_table(
        'merchandise_order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('merchandise_item_id', sa.Integer(), nullable=False),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('size', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=50), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('personalization', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('printful_item_id', sa.String(length=255), nullable=True),
        sa.Column('external_item_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchandise_item_id'], ['merchandise_items.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['order_id'], ['merchandise_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_merchandise_order_item_merchandise', 'merchandise_order_items', ['merchandise_item_id'])
    op.create_index('idx_merchandise_order_item_order', 'merchandise_order_items', ['order_id'])
    op.create_index(op.f('ix_merchandise_order_items_id'), 'merchandise_order_items', ['id'])
    op.create_index(op.f('ix_merchandise_order_items_merchandise_item_id'), 'merchandise_order_items', ['merchandise_item_id'])
    op.create_index(op.f('ix_merchandise_order_items_order_id'), 'merchandise_order_items', ['order_id'])

    # Create merchandise_commissions table
    op.create_table(
        'merchandise_commissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('order_total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('commission_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('commission_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('payment_reference', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['merchandise_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_merchandise_commission_created', 'merchandise_commissions', ['created_at'])
    op.create_index('idx_merchandise_commission_status', 'merchandise_commissions', ['status'])
    op.create_index(op.f('ix_merchandise_commissions_id'), 'merchandise_commissions', ['id'])
    op.create_index(op.f('ix_merchandise_commissions_institution_id'), 'merchandise_commissions', ['institution_id'])
    op.create_index(op.f('ix_merchandise_commissions_order_id'), 'merchandise_commissions', ['order_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_merchandise_commissions_order_id'), table_name='merchandise_commissions')
    op.drop_index(op.f('ix_merchandise_commissions_institution_id'), table_name='merchandise_commissions')
    op.drop_index(op.f('ix_merchandise_commissions_id'), table_name='merchandise_commissions')
    op.drop_index('idx_merchandise_commission_status', table_name='merchandise_commissions')
    op.drop_index('idx_merchandise_commission_created', table_name='merchandise_commissions')
    op.drop_table('merchandise_commissions')
    
    op.drop_index(op.f('ix_merchandise_order_items_order_id'), table_name='merchandise_order_items')
    op.drop_index(op.f('ix_merchandise_order_items_merchandise_item_id'), table_name='merchandise_order_items')
    op.drop_index(op.f('ix_merchandise_order_items_id'), table_name='merchandise_order_items')
    op.drop_index('idx_merchandise_order_item_order', table_name='merchandise_order_items')
    op.drop_index('idx_merchandise_order_item_merchandise', table_name='merchandise_order_items')
    op.drop_table('merchandise_order_items')
    
    op.drop_index(op.f('ix_merchandise_orders_user_id'), table_name='merchandise_orders')
    op.drop_index(op.f('ix_merchandise_orders_razorpay_payment_id'), table_name='merchandise_orders')
    op.drop_index(op.f('ix_merchandise_orders_razorpay_order_id'), table_name='merchandise_orders')
    op.drop_index(op.f('ix_merchandise_orders_printful_order_id'), table_name='merchandise_orders')
    op.drop_index(op.f('ix_merchandise_orders_order_number'), table_name='merchandise_orders')
    op.drop_index(op.f('ix_merchandise_orders_institution_id'), table_name='merchandise_orders')
    op.drop_index(op.f('ix_merchandise_orders_id'), table_name='merchandise_orders')
    op.drop_index('idx_merchandise_user', table_name='merchandise_orders')
    op.drop_index('idx_merchandise_payment_status', table_name='merchandise_orders')
    op.drop_index('idx_merchandise_order_status', table_name='merchandise_orders')
    op.drop_index('idx_merchandise_created', table_name='merchandise_orders')
    op.drop_table('merchandise_orders')
    
    op.drop_index(op.f('ix_merchandise_items_institution_id'), table_name='merchandise_items')
    op.drop_index(op.f('ix_merchandise_items_id'), table_name='merchandise_items')
    op.drop_index('idx_merchandise_provider', table_name='merchandise_items')
    op.drop_index('idx_merchandise_institution_category', table_name='merchandise_items')
    op.drop_index('idx_merchandise_active', table_name='merchandise_items')
    op.drop_table('merchandise_items')
