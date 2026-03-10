from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
import hmac
import hashlib
import json
from typing import Optional

from src.database import get_db
from src.services.subscription_service import SubscriptionService
from src.schemas.subscription import PaymentStatus, InvoiceStatus
from src.config import settings

router = APIRouter()


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    return SubscriptionService(db, settings.razorpay_key_id, settings.razorpay_key_secret)


def verify_razorpay_webhook_signature(
    payload: bytes, signature: str, webhook_secret: str
) -> bool:
    expected_signature = hmac.new(
        webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
    service: SubscriptionService = Depends(get_subscription_service),
) -> dict:
    payload = await request.body()
    
    if settings.razorpay_webhook_secret:
        if not x_razorpay_signature:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing webhook signature",
            )
        
        is_valid = verify_razorpay_webhook_signature(
            payload, x_razorpay_signature, settings.razorpay_webhook_secret
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )
    
    try:
        event_data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )
    
    event_type = event_data.get("event")
    payload_data = event_data.get("payload", {})
    
    if event_type == "payment.captured":
        return await handle_payment_captured(payload_data, service)
    elif event_type == "payment.failed":
        return await handle_payment_failed(payload_data, service)
    elif event_type == "subscription.charged":
        return await handle_subscription_charged(payload_data, service)
    elif event_type == "subscription.cancelled":
        return await handle_subscription_cancelled(payload_data, service)
    elif event_type == "subscription.paused":
        return await handle_subscription_paused(payload_data, service)
    elif event_type == "subscription.resumed":
        return await handle_subscription_resumed(payload_data, service)
    else:
        return {"status": "ignored", "event": event_type}


async def handle_payment_captured(payload: dict, service: SubscriptionService) -> dict:
    payment_entity = payload.get("payment", {}).get("entity", {})
    razorpay_payment_id = payment_entity.get("id")
    razorpay_order_id = payment_entity.get("order_id")
    amount_in_paise = payment_entity.get("amount", 0)
    
    payments = service.db.query(service.db.query(service.db.models.Payment)).filter(
        service.db.models.Payment.razorpay_order_id == razorpay_order_id
    ).all()
    
    if payments:
        payment = payments[0]
        payment.status = PaymentStatus.CAPTURED
        payment.razorpay_payment_id = razorpay_payment_id
        payment.paid_at = service.db.func.now()
        service.db.commit()
        
        if payment.subscription_id:
            invoices = service.list_invoices(subscription_id=payment.subscription_id, status=InvoiceStatus.OPEN)
            if invoices[0]:
                service.mark_invoice_paid(invoices[0][0].id)
        
        return {"status": "success", "payment_id": payment.id}
    
    return {"status": "no_matching_payment"}


async def handle_payment_failed(payload: dict, service: SubscriptionService) -> dict:
    payment_entity = payload.get("payment", {}).get("entity", {})
    razorpay_payment_id = payment_entity.get("id")
    razorpay_order_id = payment_entity.get("order_id")
    error_reason = payment_entity.get("error_reason", "Unknown error")
    
    from src.models.subscription import Payment
    
    payments = service.db.query(Payment).filter(
        Payment.razorpay_order_id == razorpay_order_id
    ).all()
    
    if payments:
        payment = payments[0]
        payment.status = PaymentStatus.FAILED
        payment.razorpay_payment_id = razorpay_payment_id
        payment.failure_reason = error_reason
        service.db.commit()
        
        if payment.subscription_id:
            service.handle_failed_payment(payment.subscription_id)
        
        return {"status": "success", "payment_id": payment.id}
    
    return {"status": "no_matching_payment"}


async def handle_subscription_charged(payload: dict, service: SubscriptionService) -> dict:
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_entity.get("id")
    
    from src.models.subscription import Subscription
    
    subscriptions = service.db.query(Subscription).filter(
        Subscription.razorpay_subscription_id == razorpay_subscription_id
    ).all()
    
    if subscriptions:
        subscription = subscriptions[0]
        service.renew_subscription(subscription.id)
        
        return {"status": "success", "subscription_id": subscription.id}
    
    return {"status": "no_matching_subscription"}


async def handle_subscription_cancelled(payload: dict, service: SubscriptionService) -> dict:
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_entity.get("id")
    
    from src.models.subscription import Subscription
    
    subscriptions = service.db.query(Subscription).filter(
        Subscription.razorpay_subscription_id == razorpay_subscription_id
    ).all()
    
    if subscriptions:
        subscription = subscriptions[0]
        service.cancel_subscription(subscription.id, immediate=False)
        
        return {"status": "success", "subscription_id": subscription.id}
    
    return {"status": "no_matching_subscription"}


async def handle_subscription_paused(payload: dict, service: SubscriptionService) -> dict:
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_entity.get("id")
    
    from src.models.subscription import Subscription
    from src.schemas.subscription import SubscriptionStatus
    
    subscriptions = service.db.query(Subscription).filter(
        Subscription.razorpay_subscription_id == razorpay_subscription_id
    ).all()
    
    if subscriptions:
        subscription = subscriptions[0]
        subscription.status = SubscriptionStatus.PAUSED
        service.db.commit()
        
        return {"status": "success", "subscription_id": subscription.id}
    
    return {"status": "no_matching_subscription"}


async def handle_subscription_resumed(payload: dict, service: SubscriptionService) -> dict:
    subscription_entity = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_entity.get("id")
    
    from src.models.subscription import Subscription
    from src.schemas.subscription import SubscriptionStatus
    
    subscriptions = service.db.query(Subscription).filter(
        Subscription.razorpay_subscription_id == razorpay_subscription_id
    ).all()
    
    if subscriptions:
        subscription = subscriptions[0]
        subscription.status = SubscriptionStatus.ACTIVE
        service.db.commit()
        
        return {"status": "success", "subscription_id": subscription.id}
    
    return {"status": "no_matching_subscription"}
