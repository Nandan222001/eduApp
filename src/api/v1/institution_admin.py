from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from src.database import get_db
from src.models.subscription import Subscription, Invoice, Payment, UsageRecord
from src.models.institution import Institution
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.dependencies.auth import get_current_user, require_roles
from src.schemas.subscription import (
    SubscriptionResponse,
    InvoiceResponse,
    PaymentResponse,
    PlanDetails,
)
from src.services.subscription_service import SubscriptionService, SubscriptionPlans
from src.config import settings

router = APIRouter()

# Every endpoint in this router previously had NO auth dependency at all
# (bug class 12): `GET /institution-admin/subscription` returned institution
# #1's full billing dashboard -- subscription, invoices, payment history --
# to any anonymous caller, and the mutating payment-method/add-on endpoints
# were equally open. It was also hardcoded to `institution_id = 1`
# regardless of caller, so it never actually worked for any other
# institution. Fixed by requiring a logged-in admin/institution_admin and
# scoping every query to `current_user.institution_id`.
ADMIN_ROLES = ["admin", "institution_admin"]


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    razorpay_key_id = getattr(settings, "razorpay_key_id", "rzp_test_key")
    razorpay_key_secret = getattr(settings, "razorpay_key_secret", "rzp_test_secret")
    return SubscriptionService(db, razorpay_key_id, razorpay_key_secret)


@router.get("/subscription")
async def get_institution_subscription_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: SubscriptionService = Depends(get_subscription_service),
):
    require_roles(current_user, ADMIN_ROLES)
    institution_id = current_user.institution_id

    subscription = (
        db.query(Subscription)
        .filter(Subscription.institution_id == institution_id)
        .filter(Subscription.status.in_(["active", "trialing"]))
        .first()
    )
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found",
        )
    
    plans = SubscriptionPlans.get_all_plans()
    available_plans = []
    for plan_name, plan_data in plans.items():
        available_plans.append({
            "name": plan_name,
            "display_name": plan_data["display_name"],
            "description": plan_data["description"],
            "monthly_price": float(plan_data["monthly_price"]),
            "quarterly_price": float(plan_data["quarterly_price"]),
            "yearly_price": float(plan_data["yearly_price"]),
            "max_users": plan_data["max_users"],
            "max_storage_gb": plan_data["max_storage_gb"],
            "features": plan_data["features"],
        })
    
    invoices = (
        db.query(Invoice)
        .filter(Invoice.institution_id == institution_id)
        .order_by(Invoice.created_at.desc())
        .limit(20)
        .all()
    )
    
    # `User.role` is a relationship (to `Role`), not a plain string column --
    # `User.role == "student"` raised `sqlalchemy.exc.ArgumentError` on
    # every single call that reached this point (any institution with an
    # active/trialing subscription), a 500 on this router's one real
    # endpoint. Count through the dedicated `Student`/`Teacher` tables
    # instead, matching the established convention used elsewhere in this
    # codebase (see institution_health_service.py's feature-adoption/data-
    # quality scoring) rather than trying to join through `Role.slug`.
    student_count = db.query(Student).filter(
        Student.institution_id == institution_id,
        Student.is_active == True
    ).count()

    teacher_count = db.query(Teacher).filter(
        Teacher.institution_id == institution_id,
        Teacher.is_active == True
    ).count()
    
    payments = (
        db.query(Payment)
        .filter(Payment.institution_id == institution_id)
        .order_by(Payment.created_at.desc())
        .limit(10)
        .all()
    )
    
    history = []
    for payment in payments:
        history.append({
            "id": payment.id,
            "type": "payment",
            "title": f"Payment of ₹{payment.amount}",
            "description": f"Payment {payment.status}",
            "date": payment.created_at.isoformat(),
            "amount": float(payment.amount),
        })
    
    history.insert(0, {
        "id": subscription.id,
        "type": "created",
        "title": f"Subscription Created - {subscription.plan_name}",
        "description": f"Started {subscription.billing_cycle} subscription",
        "date": subscription.created_at.isoformat(),
    })
    
    return {
        "subscription": SubscriptionResponse.model_validate(subscription),
        "availablePlans": available_plans,
        "invoices": [InvoiceResponse.model_validate(inv) for inv in invoices],
        "paymentMethods": [
            {
                "id": 1,
                "card_number": "4242424242424242",
                "card_holder": "John Doe",
                "expiry_month": "12",
                "expiry_year": "2025",
                "is_default": True,
            }
        ],
        "addOns": [
            {
                "id": 1,
                "name": "Advanced Analytics",
                "description": "Unlock detailed analytics and reporting features",
                "monthly_price": 2999,
                "yearly_price": 29990,
                "features": [
                    "Custom report builder",
                    "Predictive analytics",
                    "Export to multiple formats",
                    "Advanced data visualization",
                ],
            },
            {
                "id": 2,
                "name": "AI-Powered Insights",
                "description": "Get AI-driven insights and recommendations",
                "monthly_price": 4999,
                "yearly_price": 49990,
                "features": [
                    "Student performance predictions",
                    "Personalized learning paths",
                    "Automated interventions",
                    "Risk detection",
                ],
            },
            {
                "id": 3,
                "name": "Parent Portal Plus",
                "description": "Enhanced parent engagement features",
                "monthly_price": 1999,
                "yearly_price": 19990,
                "features": [
                    "Real-time notifications",
                    "Advanced messaging",
                    "Parent-teacher conferences",
                    "Progress tracking",
                ],
            },
        ],
        "activeAddOns": [],
        "usage": {
            "students_used": student_count,
            "teachers_used": teacher_count,
            "storage_used_gb": 12.5,
        },
        "limits": {
            "max_users": subscription.max_users,
            "max_storage_gb": subscription.max_storage_gb,
        },
        "history": history,
    }


@router.post("/payment-methods")
async def add_payment_method(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_roles(current_user, ADMIN_ROLES)
    # Previously indexed `data[...]` directly -- a request missing any of
    # these keys raised an unhandled `KeyError`, surfacing as a raw 500
    # instead of a clean validation error.
    required_fields = ["card_number", "card_holder", "expiry_month", "expiry_year"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required field(s): {', '.join(missing)}",
        )
    return {
        "id": 2,
        "card_number": data["card_number"],
        "card_holder": data["card_holder"],
        "expiry_month": data["expiry_month"],
        "expiry_year": data["expiry_year"],
        "is_default": False,
    }


@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_roles(current_user, ADMIN_ROLES)
    return {"message": "Payment method deleted"}


@router.post("/payment-methods/{method_id}/set-default")
async def set_default_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_roles(current_user, ADMIN_ROLES)
    return {"message": "Default payment method updated"}


@router.post("/add-ons/{addon_id}/enable")
async def enable_addon(
    addon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_roles(current_user, ADMIN_ROLES)
    return {"message": "Add-on enabled"}


@router.post("/add-ons/{addon_id}/disable")
async def disable_addon(
    addon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_roles(current_user, ADMIN_ROLES)
    return {"message": "Add-on disabled"}
