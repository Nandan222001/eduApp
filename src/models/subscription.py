from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Index
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
    currency = Column(String(3), nullable=False, default='USD')
    max_users = Column(Integer, nullable=True)
    max_storage_gb = Column(Integer, nullable=True)
    features = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    external_subscription_id = Column(String(255), nullable=True, index=True)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="subscriptions")
    
    __table_args__ = (
        Index('idx_subscription_institution_status', 'institution_id', 'status'),
        Index('idx_subscription_dates', 'start_date', 'end_date'),
        Index('idx_subscription_status', 'status'),
    )
