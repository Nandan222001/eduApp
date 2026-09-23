from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Index, JSON,
    Numeric, Text
)
from sqlalchemy.orm import relationship
from src.database import Base


class MerchandiseItem(Base):
    __tablename__ = "merchandise_items"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)

    item_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    size_options = Column(JSON, nullable=True)
    color_options = Column(JSON, nullable=True)
    mockup_images = Column(JSON, nullable=True)
    print_provider = Column(String(50), default="Printful", nullable=False)
    product_template_id = Column(String(100), nullable=True)
    inventory_tracking = Column(Boolean, default=False, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    order_items = relationship("MerchandiseOrderItem", back_populates="merchandise_item")

    __table_args__ = (
        Index('idx_merchandise_item_institution_category', 'institution_id', 'category'),
    )


class MerchandiseOrder(Base):
    __tablename__ = "merchandise_orders"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    order_number = Column(String(50), unique=True, nullable=False, index=True)

    buyer_name = Column(String(255), nullable=False)
    buyer_email = Column(String(255), nullable=False)
    buyer_phone = Column(String(20), nullable=True)

    shipping_name = Column(String(255), nullable=False)
    shipping_address_line1 = Column(String(255), nullable=False)
    shipping_address_line2 = Column(String(255), nullable=True)
    shipping_city = Column(String(100), nullable=False)
    shipping_state = Column(String(100), nullable=False)
    shipping_postal_code = Column(String(20), nullable=False)
    shipping_country = Column(String(100), default="India", nullable=False)

    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False)
    shipping_cost = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    customization = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    order_status = Column(String(20), default="pending", nullable=False, index=True)
    tracking_number = Column(String(100), nullable=True)

    payment_status = Column(String(20), default="pending", nullable=False, index=True)
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)

    commission_percentage = Column(Numeric(5, 2), default=10.00, nullable=False)
    commission_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    commission_paid = Column(Boolean, default=False, nullable=False)

    printful_order_id = Column(String(100), nullable=True)
    fulfillment_status = Column(String(50), nullable=True)

    metadata_json = Column('metadata', JSON, nullable=True)

    confirmed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    user = relationship("User")
    items = relationship("MerchandiseOrderItem", back_populates="order", cascade="all, delete-orphan")
    commissions = relationship("MerchandiseCommission", back_populates="order")

    __table_args__ = (
        Index('idx_merchandise_order_institution_status', 'institution_id', 'order_status'),
    )


class MerchandiseOrderItem(Base):
    __tablename__ = "merchandise_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('merchandise_orders.id', ondelete='CASCADE'), nullable=False, index=True)
    merchandise_item_id = Column(Integer, ForeignKey('merchandise_items.id', ondelete='RESTRICT'), nullable=False, index=True)

    item_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    size = Column(String(20), nullable=True)
    color = Column(String(50), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    personalization = Column(JSON, nullable=True)
    printful_item_id = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("MerchandiseOrder", back_populates="items")
    merchandise_item = relationship("MerchandiseItem", back_populates="order_items")


class MerchandiseCommission(Base):
    __tablename__ = "merchandise_commissions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey('merchandise_orders.id', ondelete='CASCADE'), nullable=False, index=True)

    order_total = Column(Numeric(10, 2), nullable=False)
    commission_percentage = Column(Numeric(5, 2), nullable=False)
    commission_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    is_paid = Column(Boolean, default=False, nullable=False)
    paid_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    order = relationship("MerchandiseOrder", back_populates="commissions")

    __table_args__ = (
        Index('idx_merchandise_commission_institution', 'institution_id', 'is_paid'),
    )
