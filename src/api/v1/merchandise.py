from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal
import hmac
import hashlib

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.merchandise import (
    MerchandiseItemCreate,
    MerchandiseItemUpdate,
    MerchandiseItemResponse,
    MerchandiseItemListResponse,
    MerchandiseOrderCreate,
    MerchandiseOrderUpdate,
    MerchandiseOrderResponse,
    MerchandiseOrderListResponse,
    MockupGenerationRequest,
    MockupGenerationResponse,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    OrderTrackingResponse,
    CommissionReportResponse,
    PrintfulWebhookPayload
)
from src.services.merchandise_service import MerchandiseService
from src.config import settings
import razorpay

router = APIRouter()

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def get_merchandise_service(db: Session = Depends(get_db)) -> MerchandiseService:
    """Dependency to get merchandise service"""
    printful_api_key = getattr(settings, 'printful_api_key', None)
    return MerchandiseService(db, printful_api_key)


# Merchandise Item Management

@router.post("/items", response_model=MerchandiseItemResponse, status_code=status.HTTP_201_CREATED)
async def create_merchandise_item(
    item_data: MerchandiseItemCreate,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseItemResponse:
    """Create a new merchandise item (Admin only)"""
    if item_data.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create items for other institutions"
        )
    
    item = service.create_merchandise_item(item_data)
    return MerchandiseItemResponse.model_validate(item)


@router.get("/items", response_model=MerchandiseItemListResponse)
async def list_merchandise_items(
    category: Optional[str] = None,
    is_active: Optional[bool] = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseItemListResponse:
    """List merchandise items for the institution"""
    items, total = service.list_merchandise_items(
        institution_id=current_user.institution_id,
        category=category,
        is_active=is_active,
        skip=skip,
        limit=limit
    )
    
    return MerchandiseItemListResponse(
        total=total,
        items=[MerchandiseItemResponse.model_validate(item) for item in items]
    )


@router.get("/items/{item_id}", response_model=MerchandiseItemResponse)
async def get_merchandise_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseItemResponse:
    """Get merchandise item details"""
    item = service.get_merchandise_item(item_id, current_user.institution_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchandise item not found"
        )
    
    return MerchandiseItemResponse.model_validate(item)


@router.put("/items/{item_id}", response_model=MerchandiseItemResponse)
async def update_merchandise_item(
    item_id: int,
    item_data: MerchandiseItemUpdate,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseItemResponse:
    """Update merchandise item (Admin only)"""
    item = service.update_merchandise_item(item_id, current_user.institution_id, item_data)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchandise item not found"
        )
    
    return MerchandiseItemResponse.model_validate(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_merchandise_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
):
    """Delete merchandise item (Admin only)"""
    deleted = service.delete_merchandise_item(item_id, current_user.institution_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchandise item not found"
        )


# Mockup Generation

@router.post("/mockups/generate", response_model=MockupGenerationResponse)
async def generate_mockup(
    mockup_data: MockupGenerationRequest,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MockupGenerationResponse:
    """Generate custom mockup with institution branding"""
    result = await service.generate_mockup(
        item_id=mockup_data.merchandise_item_id,
        institution_id=current_user.institution_id,
        logo_url=mockup_data.logo_url,
        primary_color=mockup_data.primary_color,
        secondary_color=mockup_data.secondary_color,
        text_overlay=mockup_data.text_overlay
    )
    
    return MockupGenerationResponse(**result)


# Order Management

@router.post("/orders", response_model=MerchandiseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: MerchandiseOrderCreate,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseOrderResponse:
    """Create a new merchandise order"""
    order = service.create_order(
        order_data=order_data,
        institution_id=current_user.institution_id,
        user_id=current_user.id
    )
    
    return MerchandiseOrderResponse.model_validate(order)


@router.get("/orders", response_model=MerchandiseOrderListResponse)
async def list_orders(
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseOrderListResponse:
    """List orders for the current user"""
    orders, total = service.list_orders(
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        order_status=order_status,
        payment_status=payment_status,
        skip=skip,
        limit=limit
    )
    
    return MerchandiseOrderListResponse(
        total=total,
        orders=[MerchandiseOrderResponse.model_validate(order) for order in orders]
    )


@router.get("/orders/{order_id}", response_model=MerchandiseOrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseOrderResponse:
    """Get order details"""
    order = service.get_order(order_id, current_user.institution_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user owns the order or is admin
    if order.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return MerchandiseOrderResponse.model_validate(order)


@router.put("/orders/{order_id}", response_model=MerchandiseOrderResponse)
async def update_order(
    order_id: int,
    order_data: MerchandiseOrderUpdate,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseOrderResponse:
    """Update order (Admin only)"""
    order = service.update_order(order_id, current_user.institution_id, order_data)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return MerchandiseOrderResponse.model_validate(order)


# Payment Processing

@router.post("/orders/{order_id}/payment/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    order_id: int,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> PaymentInitiateResponse:
    """Initiate payment for an order"""
    order = service.get_order(order_id, current_user.institution_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if order.payment_status == "captured":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )
    
    # Create Razorpay order
    amount_in_paise = int(order.total_amount * 100)
    
    razorpay_order = razorpay_client.order.create({
        "amount": amount_in_paise,
        "currency": order.currency,
        "receipt": order.order_number,
        "notes": {
            "order_id": str(order.id),
            "institution_id": str(order.institution_id)
        }
    })
    
    # Update order with Razorpay order ID
    order.razorpay_order_id = razorpay_order["id"]
    service.db.commit()
    
    return PaymentInitiateResponse(
        order_id=order.order_number,
        razorpay_order_id=razorpay_order["id"],
        amount=order.total_amount,
        currency=order.currency,
        razorpay_key_id=settings.razorpay_key_id
    )


@router.post("/orders/payment/verify", response_model=PaymentVerifyResponse)
async def verify_payment(
    payment_data: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> PaymentVerifyResponse:
    """Verify payment and update order status"""
    order = service.get_order(payment_data.order_id, current_user.institution_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Verify signature
    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode(),
        f"{payment_data.razorpay_order_id}|{payment_data.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if expected_signature != payment_data.razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature"
        )
    
    # Update order payment status
    order = service.update_payment_status(
        order_id=order.id,
        payment_status="captured",
        razorpay_payment_id=payment_data.razorpay_payment_id,
        razorpay_signature=payment_data.razorpay_signature
    )
    
    return PaymentVerifyResponse(
        order_id=order.id,
        payment_status="captured",
        message="Payment verified successfully"
    )


# Order Tracking

@router.get("/orders/{order_number}/track", response_model=OrderTrackingResponse)
async def track_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> OrderTrackingResponse:
    """Track order status"""
    order = service.get_order_by_number(order_number, current_user.institution_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return OrderTrackingResponse(
        order_number=order.order_number,
        order_status=order.order_status,
        payment_status=order.payment_status,
        tracking_number=order.tracking_number,
        fulfillment_status=order.fulfillment_status,
        estimated_delivery=None,
        tracking_events=[]
    )


# Printful Integration

@router.post("/orders/{order_id}/submit-fulfillment")
async def submit_to_fulfillment(
    order_id: int,
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
):
    """Submit order to Printful for fulfillment (Admin only)"""
    result = await service.submit_to_printful(order_id, current_user.institution_id)
    return {"message": "Order submitted to Printful", "printful_order": result}


@router.post("/webhooks/printful")
async def printful_webhook(
    webhook_data: PrintfulWebhookPayload,
    service: MerchandiseService = Depends(get_merchandise_service)
):
    """Handle Printful webhook events"""
    event_type = webhook_data.type
    data = webhook_data.data
    
    if event_type == "package_shipped":
        # Update order status when shipped
        external_id = data.get("order", {}).get("external_id")
        if external_id:
            order = service.get_order_by_number(external_id)
            if order:
                service.update_order(
                    order.id,
                    order.institution_id,
                    MerchandiseOrderUpdate(
                        order_status="shipped",
                        tracking_number=data.get("shipment", {}).get("tracking_number")
                    )
                )
    
    elif event_type == "package_returned":
        # Handle returns
        external_id = data.get("order", {}).get("external_id")
        if external_id:
            order = service.get_order_by_number(external_id)
            if order:
                service.update_order(
                    order.id,
                    order.institution_id,
                    MerchandiseOrderUpdate(order_status="canceled")
                )
    
    return {"status": "success"}


# Admin Endpoints

@router.get("/admin/orders", response_model=MerchandiseOrderListResponse)
async def list_all_orders(
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> MerchandiseOrderListResponse:
    """List all orders for institution (Admin only)"""
    orders, total = service.list_orders(
        institution_id=current_user.institution_id,
        order_status=order_status,
        payment_status=payment_status,
        skip=skip,
        limit=limit
    )
    
    return MerchandiseOrderListResponse(
        total=total,
        orders=[MerchandiseOrderResponse.model_validate(order) for order in orders]
    )


@router.get("/admin/commission-report", response_model=CommissionReportResponse)
async def get_commission_report(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    service: MerchandiseService = Depends(get_merchandise_service)
) -> CommissionReportResponse:
    """Get commission report for institution (Admin only)"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    report = service.get_commission_report(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return CommissionReportResponse(**report)
