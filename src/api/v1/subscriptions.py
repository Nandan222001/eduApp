from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from src.database import get_db
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionUpgrade,
    SubscriptionCancel,
    PaymentResponse,
    InvoiceResponse,
    UsageRecordCreate,
    UsageRecordResponse,
    RazorpayOrderCreate,
    RazorpayOrderResponse,
    RazorpayPaymentVerify,
    PlanDetails,
    SubscriptionListResponse,
    InvoiceListResponse,
    PaymentListResponse,
    UsageRecordListResponse,
)
from src.services.subscription_service import SubscriptionService, SubscriptionPlans
from src.config import settings

router = APIRouter()


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    razorpay_key_id = getattr(settings, "razorpay_key_id", "rzp_test_key")
    razorpay_key_secret = getattr(settings, "razorpay_key_secret", "rzp_test_secret")
    return SubscriptionService(db, razorpay_key_id, razorpay_key_secret)


@router.get("/plans", response_model=List[PlanDetails])
async def get_subscription_plans() -> List[PlanDetails]:
    plans = SubscriptionPlans.get_all_plans()
    plan_details = []
    
    for plan_name, plan_data in plans.items():
        plan_details.append(
            PlanDetails(
                name=plan_name,
                display_name=plan_data["display_name"],
                description=plan_data["description"],
                monthly_price=plan_data["monthly_price"],
                quarterly_price=plan_data["quarterly_price"],
                yearly_price=plan_data["yearly_price"],
                max_users=plan_data["max_users"],
                max_storage_gb=plan_data["max_storage_gb"],
                features=plan_data["features"],
            )
        )
    
    return plan_details


@router.get("/plans/{plan_name}", response_model=PlanDetails)
async def get_plan_details(plan_name: str) -> PlanDetails:
    plan_data = SubscriptionPlans.get_plan(plan_name)
    if not plan_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_name}' not found",
        )
    
    return PlanDetails(
        name=plan_name,
        display_name=plan_data["display_name"],
        description=plan_data["description"],
        monthly_price=plan_data["monthly_price"],
        quarterly_price=plan_data["quarterly_price"],
        yearly_price=plan_data["yearly_price"],
        max_users=plan_data["max_users"],
        max_storage_gb=plan_data["max_storage_gb"],
        features=plan_data["features"],
    )


@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    trial_days: int = Query(default=14, ge=0, le=90),
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.create_subscription(subscription_data, trial_days)
    return SubscriptionResponse.model_validate(subscription)


@router.get("/", response_model=SubscriptionListResponse)
async def list_subscriptions(
    institution_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionListResponse:
    subscriptions, total = service.list_subscriptions(institution_id, status, skip, limit)
    return SubscriptionListResponse(
        total=total,
        subscriptions=[SubscriptionResponse.model_validate(s) for s in subscriptions],
    )


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.get_subscription(subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    return SubscriptionResponse.model_validate(subscription)


@router.get("/institution/{institution_id}", response_model=SubscriptionResponse)
async def get_institution_subscription(
    institution_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.get_institution_subscription(institution_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found for this institution",
        )
    return SubscriptionResponse.model_validate(subscription)


@router.patch("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    update_data: SubscriptionUpdate,
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.update_subscription(subscription_id, update_data)
    return SubscriptionResponse.model_validate(subscription)


@router.post("/{subscription_id}/upgrade", response_model=dict)
async def upgrade_subscription(
    subscription_id: int,
    upgrade_data: SubscriptionUpgrade,
    service: SubscriptionService = Depends(get_subscription_service),
) -> dict:
    result = service.upgrade_subscription(subscription_id, upgrade_data.new_plan_name)
    return {
        "subscription": SubscriptionResponse.model_validate(result["subscription"]),
        "prorated_amount": float(result["prorated_amount"]),
        "immediate_charge": result["immediate_charge"],
    }


@router.post("/{subscription_id}/downgrade", response_model=SubscriptionResponse)
async def downgrade_subscription(
    subscription_id: int,
    downgrade_data: SubscriptionUpgrade,
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.downgrade_subscription(subscription_id, downgrade_data.new_plan_name)
    return SubscriptionResponse.model_validate(subscription)


@router.post("/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: int,
    cancel_data: SubscriptionCancel,
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.cancel_subscription(
        subscription_id, cancel_data.immediate, cancel_data.reason
    )
    return SubscriptionResponse.model_validate(subscription)


@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse)
async def renew_subscription(
    subscription_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> SubscriptionResponse:
    subscription = service.renew_subscription(subscription_id)
    return SubscriptionResponse.model_validate(subscription)


@router.post("/{subscription_id}/invoices", response_model=InvoiceResponse)
async def generate_invoice(
    subscription_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> InvoiceResponse:
    invoice = service.generate_invoice(subscription_id)
    return InvoiceResponse.model_validate(invoice)


@router.get("/invoices/", response_model=InvoiceListResponse)
async def list_invoices(
    subscription_id: Optional[int] = Query(None),
    institution_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: SubscriptionService = Depends(get_subscription_service),
) -> InvoiceListResponse:
    invoices, total = service.list_invoices(subscription_id, institution_id, status, skip, limit)
    return InvoiceListResponse(
        total=total,
        invoices=[InvoiceResponse.model_validate(i) for i in invoices],
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> InvoiceResponse:
    invoice = service.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return InvoiceResponse.model_validate(invoice)


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_invoice_paid(
    invoice_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> InvoiceResponse:
    invoice = service.mark_invoice_paid(invoice_id)
    return InvoiceResponse.model_validate(invoice)


@router.post("/{subscription_id}/payments/create-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order(
    subscription_id: int,
    service: SubscriptionService = Depends(get_subscription_service),
) -> RazorpayOrderResponse:
    order_data = service.create_razorpay_order(subscription_id)
    return RazorpayOrderResponse(
        order_id=order_data["order_id"],
        amount=Decimal(str(order_data["amount"])) / 100,
        currency=order_data["currency"],
        status=order_data["status"],
    )


@router.post("/{subscription_id}/payments", response_model=PaymentResponse)
async def create_payment(
    subscription_id: int,
    payment_method: Optional[str] = Query(None),
    service: SubscriptionService = Depends(get_subscription_service),
) -> PaymentResponse:
    subscription = service.get_subscription(subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    
    payment = service.create_payment(subscription_id, subscription.price, payment_method)
    return PaymentResponse.model_validate(payment)


@router.post("/payments/{payment_id}/verify", response_model=PaymentResponse)
async def verify_razorpay_payment(
    payment_id: int,
    verify_data: RazorpayPaymentVerify,
    service: SubscriptionService = Depends(get_subscription_service),
) -> PaymentResponse:
    payment = service.verify_razorpay_payment(
        payment_id,
        verify_data.razorpay_order_id,
        verify_data.razorpay_payment_id,
        verify_data.razorpay_signature,
    )
    return PaymentResponse.model_validate(payment)


@router.get("/payments/", response_model=PaymentListResponse)
async def list_payments(
    subscription_id: Optional[int] = Query(None),
    institution_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: SubscriptionService = Depends(get_subscription_service),
) -> PaymentListResponse:
    payments, total = service.list_payments(subscription_id, institution_id, status, skip, limit)
    return PaymentListResponse(
        total=total,
        payments=[PaymentResponse.model_validate(p) for p in payments],
    )


@router.post("/{subscription_id}/usage", response_model=UsageRecordResponse)
async def record_usage(
    subscription_id: int,
    usage_data: UsageRecordCreate,
    service: SubscriptionService = Depends(get_subscription_service),
) -> UsageRecordResponse:
    usage_record = service.record_usage(
        subscription_id,
        usage_data.metric_name,
        usage_data.metric_value,
        usage_data.period_start,
        usage_data.period_end,
    )
    return UsageRecordResponse.model_validate(usage_record)


@router.get("/usage/", response_model=UsageRecordListResponse)
async def get_usage_records(
    subscription_id: Optional[int] = Query(None),
    institution_id: Optional[int] = Query(None),
    metric_name: Optional[str] = Query(None),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: SubscriptionService = Depends(get_subscription_service),
) -> UsageRecordListResponse:
    usage_records, total = service.get_usage_records(
        subscription_id, institution_id, metric_name, period_start, period_end, skip, limit
    )
    return UsageRecordListResponse(
        total=total,
        usage_records=[UsageRecordResponse.model_validate(u) for u in usage_records],
    )


@router.get("/admin/check-renewals", response_model=List[SubscriptionResponse])
async def check_subscriptions_for_renewal(
    service: SubscriptionService = Depends(get_subscription_service),
) -> List[SubscriptionResponse]:
    subscriptions = service.check_subscriptions_for_renewal()
    return [SubscriptionResponse.model_validate(s) for s in subscriptions]


@router.get("/admin/check-expired-trials", response_model=List[SubscriptionResponse])
async def check_expired_trials(
    service: SubscriptionService = Depends(get_subscription_service),
) -> List[SubscriptionResponse]:
    subscriptions = service.check_expired_trials()
    return [SubscriptionResponse.model_validate(s) for s in subscriptions]


@router.get("/admin/check-expired-grace-periods", response_model=List[SubscriptionResponse])
async def check_expired_grace_periods(
    service: SubscriptionService = Depends(get_subscription_service),
) -> List[SubscriptionResponse]:
    subscriptions = service.check_expired_grace_periods()
    return [SubscriptionResponse.model_validate(s) for s in subscriptions]
