from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from enum import Enum


class MerchandiseCategory(str, Enum):
    APPAREL = "apparel"
    ACCESSORIES = "accessories"
    SCHOOL_SUPPLIES = "school_supplies"
    TECH = "tech"


class PrintProvider(str, Enum):
    PRINTFUL = "Printful"
    CUSTOMCAT = "CustomCat"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PRODUCTION = "production"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELED = "canceled"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class MerchandiseItemBase(BaseModel):
    item_name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=50)
    description: Optional[str] = None
    base_price: Decimal = Field(..., decimal_places=2)
    size_options: Optional[List[str]] = None
    color_options: Optional[List[str]] = None
    mockup_images: Optional[Dict[str, Any]] = None
    print_provider: str = Field(default="Printful", max_length=50)
    product_template_id: Optional[str] = None
    inventory_tracking: bool = False
    stock_quantity: int = 0


class MerchandiseItemCreate(MerchandiseItemBase):
    institution_id: int


class MerchandiseItemUpdate(BaseModel):
    item_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, decimal_places=2)
    size_options: Optional[List[str]] = None
    color_options: Optional[List[str]] = None
    mockup_images: Optional[Dict[str, Any]] = None
    print_provider: Optional[str] = Field(None, max_length=50)
    product_template_id: Optional[str] = None
    inventory_tracking: Optional[bool] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None


class MerchandiseItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    item_name: str
    category: str
    description: Optional[str] = None
    base_price: Decimal
    size_options: Optional[List[str]] = None
    color_options: Optional[List[str]] = None
    mockup_images: Optional[Dict[str, Any]] = None
    print_provider: str
    product_template_id: Optional[str] = None
    inventory_tracking: bool
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MerchandiseItemListResponse(BaseModel):
    total: int
    items: List[MerchandiseItemResponse]


class OrderItemCreate(BaseModel):
    merchandise_item_id: int
    size: Optional[str] = None
    color: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    personalization: Optional[Dict[str, Any]] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    merchandise_item_id: int
    item_name: str
    category: str
    size: Optional[str] = None
    color: Optional[str] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    personalization: Optional[Dict[str, Any]] = None
    printful_item_id: Optional[str] = None


class ShippingAddress(BaseModel):
    shipping_name: str = Field(..., max_length=255)
    shipping_address_line1: str = Field(..., max_length=255)
    shipping_address_line2: Optional[str] = Field(None, max_length=255)
    shipping_city: str = Field(..., max_length=100)
    shipping_state: str = Field(..., max_length=100)
    shipping_postal_code: str = Field(..., max_length=20)
    shipping_country: str = Field(default="India", max_length=100)


class MerchandiseOrderCreate(BaseModel):
    buyer_name: str = Field(..., max_length=255)
    buyer_email: EmailStr
    buyer_phone: Optional[str] = Field(None, max_length=20)
    shipping_address: ShippingAddress
    items: List[OrderItemCreate] = Field(..., min_length=1)
    customization: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class MerchandiseOrderUpdate(BaseModel):
    order_status: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None


class MerchandiseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: Optional[int] = None
    order_number: str
    buyer_name: str
    buyer_email: str
    buyer_phone: Optional[str] = None
    shipping_name: str
    shipping_address_line1: str
    shipping_address_line2: Optional[str] = None
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str
    subtotal: Decimal
    tax_amount: Decimal
    shipping_cost: Decimal
    total_amount: Decimal
    currency: str
    customization: Optional[Dict[str, Any]] = None
    order_status: str
    tracking_number: Optional[str] = None
    payment_status: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    commission_percentage: Decimal
    commission_amount: Decimal
    commission_paid: bool
    printful_order_id: Optional[str] = None
    fulfillment_status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []


class MerchandiseOrderListResponse(BaseModel):
    total: int
    orders: List[MerchandiseOrderResponse]


class MockupGenerationRequest(BaseModel):
    merchandise_item_id: int
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    text_overlay: Optional[str] = None


class MockupGenerationResponse(BaseModel):
    merchandise_item_id: int
    mockup_urls: Dict[str, str]
    generated_at: datetime


class PaymentInitiateRequest(BaseModel):
    order_id: int


class PaymentInitiateResponse(BaseModel):
    order_id: str
    razorpay_order_id: str
    amount: Decimal
    currency: str
    razorpay_key_id: str


class PaymentVerifyRequest(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerifyResponse(BaseModel):
    order_id: int
    payment_status: str
    message: str


class OrderTrackingResponse(BaseModel):
    order_number: str
    order_status: str
    payment_status: str
    tracking_number: Optional[str] = None
    fulfillment_status: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    tracking_events: Optional[List[Dict[str, Any]]] = None


class CommissionReportResponse(BaseModel):
    institution_id: int
    total_orders: int
    total_sales: Decimal
    total_commission: Decimal
    pending_commission: Decimal
    paid_commission: Decimal
    currency: str
    period_start: datetime
    period_end: datetime


class PrintfulWebhookPayload(BaseModel):
    type: str
    data: Dict[str, Any]
    created: int
    retries: int
