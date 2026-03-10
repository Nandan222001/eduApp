from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Index, Boolean
from sqlalchemy.orm import relationship
from src.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    plan_name = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)
    billing_cycle = Column(String(50), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='INR')
    max_users = Column(Integer, nullable=True)
    max_storage_gb = Column(Integer, nullable=True)
    features = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    grace_period_end = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=True, nullable=False)
    external_subscription_id = Column(String(255), nullable=True, index=True)
    razorpay_subscription_id = Column(String(255), nullable=True, index=True)
    razorpay_customer_id = Column(String(255), nullable=True, index=True)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="subscription", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_subscription_institution_status', 'institution_id', 'status'),
        Index('idx_subscription_dates', 'start_date', 'end_date'),
        Index('idx_subscription_status', 'status'),
        Index('idx_subscription_next_billing', 'next_billing_date'),
        Index('idx_subscription_grace_period', 'grace_period_end'),
    )


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='INR')
    status = Column(String(50), nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)
    razorpay_payment_id = Column(String(255), nullable=True, unique=True, index=True)
    razorpay_order_id = Column(String(255), nullable=True, index=True)
    razorpay_signature = Column(String(500), nullable=True)
    failure_reason = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    subscription = relationship("Subscription", back_populates="payments")
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_payment_status', 'status'),
        Index('idx_payment_created', 'created_at'),
    )


class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='INR')
    billing_period_start = Column(DateTime, nullable=False)
    billing_period_end = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    invoice_url = Column(String(500), nullable=True)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    subscription = relationship("Subscription", back_populates="invoices")
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_invoice_status', 'status'),
        Index('idx_invoice_due_date', 'due_date'),
        Index('idx_invoice_created', 'created_at'),
    )


class UsageRecord(Base):
    __tablename__ = "usage_records"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Numeric(15, 2), nullable=False)
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    subscription = relationship("Subscription", back_populates="usage_records")
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_usage_metric', 'metric_name'),
        Index('idx_usage_recorded', 'recorded_at'),
        Index('idx_usage_period', 'period_start', 'period_end'),
    )
