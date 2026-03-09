from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class SubscriptionBase(BaseModel):
    institution_id: int
    plan_name: str = Field(..., max_length=100)
    status: str = Field(..., max_length=50)
    billing_cycle: str = Field(..., max_length=50)
    price: Decimal = Field(..., decimal_places=2)
    currency: str = Field(default="USD", max_length=3)
    max_users: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    external_subscription_id: Optional[str] = Field(None, max_length=255)
    metadata: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    billing_cycle: Optional[str] = Field(None, max_length=50)
    price: Optional[Decimal] = None
    max_users: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: Optional[str] = None
    end_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    metadata: Optional[str] = None


class SubscriptionResponse(SubscriptionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    canceled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
