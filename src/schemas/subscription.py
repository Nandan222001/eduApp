from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class PlanName(str, Enum):
    STARTER = "Starter"
    GROWTH = "Growth"
    PROFESSIONAL = "Professional"
    ENTERPRISE = "Enterprise"


class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    GRACE_PERIOD = "grace_period"
    CANCELED = "canceled"
    EXPIRED = "expired"
    PAUSED = "paused"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    OVERDUE = "overdue"


class SubscriptionBase(BaseModel):
    institution_id: int
    plan_name: str = Field(..., max_length=100)
    billing_cycle: str = Field(..., max_length=50)
    auto_renew: bool = Field(default=True)


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = Field(None, max_length=100)
    billing_cycle: Optional[str] = Field(None, max_length=50)
    auto_renew: Optional[bool] = None
    metadata: Optional[str] = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    plan_name: str
    status: str
    billing_cycle: str
    price: Decimal
    currency: str
    max_users: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    grace_period_end: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    auto_renew: bool
    external_subscription_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    razorpay_customer_id: Optional[str] = None
    metadata: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SubscriptionUpgrade(BaseModel):
    new_plan_name: str = Field(..., max_length=100)


class SubscriptionCancel(BaseModel):
    immediate: bool = Field(default=False)
    reason: Optional[str] = None


class PaymentBase(BaseModel):
    subscription_id: int
    institution_id: int
    amount: Decimal = Field(..., decimal_places=2)
    currency: str = Field(default="INR", max_length=3)
    payment_method: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    subscription_id: int
    institution_id: int
    amount: Decimal
    currency: str
    status: str
    payment_method: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    failure_reason: Optional[str] = None
    metadata: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class InvoiceBase(BaseModel):
    subscription_id: int
    institution_id: int
    amount: Decimal = Field(..., decimal_places=2)
    tax_amount: Decimal = Field(default=Decimal("0.00"), decimal_places=2)
    total_amount: Decimal = Field(..., decimal_places=2)
    currency: str = Field(default="INR", max_length=3)
    billing_period_start: datetime
    billing_period_end: datetime
    due_date: datetime


class InvoiceCreate(InvoiceBase):
    invoice_number: str = Field(..., max_length=100)
    status: str = Field(default="draft", max_length=50)


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    subscription_id: int
    institution_id: int
    invoice_number: str
    status: str
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    billing_period_start: datetime
    billing_period_end: datetime
    due_date: datetime
    paid_at: Optional[datetime] = None
    invoice_url: Optional[str] = None
    metadata: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UsageRecordBase(BaseModel):
    subscription_id: int
    institution_id: int
    metric_name: str = Field(..., max_length=100)
    metric_value: Decimal = Field(..., decimal_places=2)
    period_start: datetime
    period_end: datetime


class UsageRecordCreate(UsageRecordBase):
    pass


class UsageRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    subscription_id: int
    institution_id: int
    metric_name: str
    metric_value: Decimal
    recorded_at: datetime
    period_start: datetime
    period_end: datetime
    metadata: Optional[str] = None
    created_at: datetime


class RazorpayOrderCreate(BaseModel):
    amount: Decimal = Field(..., decimal_places=2)
    currency: str = Field(default="INR", max_length=3)
    receipt: str


class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: Decimal
    currency: str
    status: str


class RazorpayPaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PlanDetails(BaseModel):
    name: str
    display_name: str
    description: str
    monthly_price: Decimal
    quarterly_price: Decimal
    yearly_price: Decimal
    max_users: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: List[str]


class SubscriptionListResponse(BaseModel):
    total: int
    subscriptions: List[SubscriptionResponse]


class InvoiceListResponse(BaseModel):
    total: int
    invoices: List[InvoiceResponse]


class PaymentListResponse(BaseModel):
    total: int
    payments: List[PaymentResponse]


class UsageRecordListResponse(BaseModel):
    total: int
    usage_records: List[UsageRecordResponse]
