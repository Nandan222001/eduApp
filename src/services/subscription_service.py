from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
import json
import hmac
import hashlib

from src.models.subscription import Subscription, Payment, Invoice, UsageRecord
from src.models.institution import Institution
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    PlanName,
    BillingCycle,
    SubscriptionStatus,
    PaymentStatus,
    InvoiceStatus,
)
from src.config import settings


class SubscriptionPlans:
    PLANS = {
        PlanName.STARTER: {
            "display_name": "Starter",
            "description": "Perfect for small teams getting started",
            "monthly_price": Decimal("999.00"),
            "quarterly_price": Decimal("2699.00"),
            "yearly_price": Decimal("9999.00"),
            "max_users": 10,
            "max_storage_gb": 50,
            "features": [
                "Up to 10 users",
                "50 GB storage",
                "Basic support",
                "Email notifications",
                "API access",
            ],
        },
        PlanName.GROWTH: {
            "display_name": "Growth",
            "description": "For growing teams with more needs",
            "monthly_price": Decimal("2999.00"),
            "quarterly_price": Decimal("8099.00"),
            "yearly_price": Decimal("29999.00"),
            "max_users": 50,
            "max_storage_gb": 250,
            "features": [
                "Up to 50 users",
                "250 GB storage",
                "Priority support",
                "Advanced analytics",
                "Custom integrations",
                "API access",
                "SSO integration",
            ],
        },
        PlanName.PROFESSIONAL: {
            "display_name": "Professional",
            "description": "For professional teams requiring advanced features",
            "monthly_price": Decimal("7999.00"),
            "quarterly_price": Decimal("21599.00"),
            "yearly_price": Decimal("79999.00"),
            "max_users": 200,
            "max_storage_gb": 1000,
            "features": [
                "Up to 200 users",
                "1 TB storage",
                "24/7 premium support",
                "Advanced security",
                "Custom workflows",
                "Dedicated account manager",
                "API access",
                "SSO integration",
                "Audit logs",
            ],
        },
        PlanName.ENTERPRISE: {
            "display_name": "Enterprise",
            "description": "For large organizations with custom requirements",
            "monthly_price": Decimal("19999.00"),
            "quarterly_price": Decimal("53999.00"),
            "yearly_price": Decimal("199999.00"),
            "max_users": None,
            "max_storage_gb": None,
            "features": [
                "Unlimited users",
                "Unlimited storage",
                "24/7 dedicated support",
                "Enterprise security",
                "Custom SLA",
                "On-premise deployment option",
                "Custom integrations",
                "API access",
                "SSO integration",
                "Advanced audit logs",
                "Custom training",
            ],
        },
    }

    @classmethod
    def get_plan(cls, plan_name: str) -> Optional[Dict[str, Any]]:
        return cls.PLANS.get(plan_name)

    @classmethod
    def get_all_plans(cls) -> Dict[str, Dict[str, Any]]:
        return cls.PLANS

    @classmethod
    def get_plan_price(cls, plan_name: str, billing_cycle: str) -> Decimal:
        plan = cls.get_plan(plan_name)
        if not plan:
            raise ValueError(f"Invalid plan name: {plan_name}")

        price_key = f"{billing_cycle}_price"
        if price_key not in plan:
            raise ValueError(f"Invalid billing cycle: {billing_cycle}")

        return plan[price_key]


class SubscriptionService:
    GRACE_PERIOD_DAYS = 7
    TAX_RATE = Decimal("0.18")

    def __init__(self, db: Session, razorpay_key_id: str, razorpay_key_secret: str):
        self.db = db
        self.razorpay_key_id = razorpay_key_id
        self.razorpay_key_secret = razorpay_key_secret

    def create_subscription(
        self, subscription_data: SubscriptionCreate, trial_days: int = 14
    ) -> Subscription:
        institution = (
            self.db.query(Institution)
            .filter(Institution.id == subscription_data.institution_id)
            .first()
        )
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution not found",
            )

        existing_active = (
            self.db.query(Subscription)
            .filter(
                Subscription.institution_id == subscription_data.institution_id,
                Subscription.status.in_([
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.TRIALING,
                    SubscriptionStatus.GRACE_PERIOD,
                ]),
            )
            .first()
        )
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution already has an active subscription",
            )

        plan = SubscriptionPlans.get_plan(subscription_data.plan_name)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan name: {subscription_data.plan_name}",
            )

        price = SubscriptionPlans.get_plan_price(
            subscription_data.plan_name, subscription_data.billing_cycle
        )

        start_date = datetime.utcnow()
        trial_end_date = start_date + timedelta(days=trial_days) if trial_days > 0 else None

        subscription = Subscription(
            institution_id=subscription_data.institution_id,
            plan_name=subscription_data.plan_name,
            status=SubscriptionStatus.TRIALING if trial_days > 0 else SubscriptionStatus.ACTIVE,
            billing_cycle=subscription_data.billing_cycle,
            price=price,
            currency="INR",
            max_users=plan["max_users"],
            max_storage_gb=plan["max_storage_gb"],
            features=json.dumps(plan["features"]),
            start_date=start_date,
            trial_end_date=trial_end_date,
            next_billing_date=trial_end_date if trial_end_date else self._calculate_next_billing_date(
                start_date, subscription_data.billing_cycle
            ),
            auto_renew=subscription_data.auto_renew,
        )

        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def get_subscription(self, subscription_id: int) -> Optional[Subscription]:
        return self.db.query(Subscription).filter(Subscription.id == subscription_id).first()

    def get_institution_subscription(self, institution_id: int) -> Optional[Subscription]:
        return (
            self.db.query(Subscription)
            .filter(
                Subscription.institution_id == institution_id,
                Subscription.status.in_([
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.TRIALING,
                    SubscriptionStatus.GRACE_PERIOD,
                ]),
            )
            .order_by(Subscription.created_at.desc())
            .first()
        )

    def list_subscriptions(
        self,
        institution_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Subscription], int]:
        query = self.db.query(Subscription)

        if institution_id:
            query = query.filter(Subscription.institution_id == institution_id)
        if status:
            query = query.filter(Subscription.status == status)

        total = query.count()
        subscriptions = query.order_by(Subscription.created_at.desc()).offset(skip).limit(limit).all()

        return subscriptions, total

    def update_subscription(
        self, subscription_id: int, update_data: SubscriptionUpdate
    ) -> Subscription:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        update_dict = update_data.model_dump(exclude_unset=True)

        if "plan_name" in update_dict or "billing_cycle" in update_dict:
            plan_name = update_dict.get("plan_name", subscription.plan_name)
            billing_cycle = update_dict.get("billing_cycle", subscription.billing_cycle)

            plan = SubscriptionPlans.get_plan(plan_name)
            if not plan:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid plan name: {plan_name}",
                )

            price = SubscriptionPlans.get_plan_price(plan_name, billing_cycle)
            update_dict["price"] = price
            update_dict["max_users"] = plan["max_users"]
            update_dict["max_storage_gb"] = plan["max_storage_gb"]
            update_dict["features"] = json.dumps(plan["features"])

        for field, value in update_dict.items():
            setattr(subscription, field, value)

        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def upgrade_subscription(
        self, subscription_id: int, new_plan_name: str
    ) -> Dict[str, Any]:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        if subscription.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only upgrade active or trialing subscriptions",
            )

        new_plan = SubscriptionPlans.get_plan(new_plan_name)
        if not new_plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan name: {new_plan_name}",
            )

        new_price = SubscriptionPlans.get_plan_price(new_plan_name, subscription.billing_cycle)
        old_price = subscription.price

        prorated_amount = self._calculate_prorated_amount(
            subscription, old_price, new_price
        )

        subscription.plan_name = new_plan_name
        subscription.price = new_price
        subscription.max_users = new_plan["max_users"]
        subscription.max_storage_gb = new_plan["max_storage_gb"]
        subscription.features = json.dumps(new_plan["features"])

        self.db.commit()
        self.db.refresh(subscription)

        return {
            "subscription": subscription,
            "prorated_amount": prorated_amount,
            "immediate_charge": prorated_amount > 0,
        }

    def downgrade_subscription(
        self, subscription_id: int, new_plan_name: str
    ) -> Subscription:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        if subscription.status not in [SubscriptionStatus.ACTIVE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only downgrade active subscriptions",
            )

        new_plan = SubscriptionPlans.get_plan(new_plan_name)
        if not new_plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan name: {new_plan_name}",
            )

        subscription.plan_name = new_plan_name
        subscription.price = SubscriptionPlans.get_plan_price(
            new_plan_name, subscription.billing_cycle
        )
        subscription.max_users = new_plan["max_users"]
        subscription.max_storage_gb = new_plan["max_storage_gb"]
        subscription.features = json.dumps(new_plan["features"])

        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def cancel_subscription(
        self, subscription_id: int, immediate: bool = False, reason: Optional[str] = None
    ) -> Subscription:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        if subscription.status in [SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription is already canceled or expired",
            )

        subscription.canceled_at = datetime.utcnow()
        subscription.auto_renew = False

        if immediate:
            subscription.status = SubscriptionStatus.CANCELED
            subscription.end_date = datetime.utcnow()
        else:
            subscription.end_date = subscription.next_billing_date or datetime.utcnow() + timedelta(days=30)

        if reason:
            metadata = json.loads(subscription.metadata) if subscription.metadata else {}
            metadata["cancellation_reason"] = reason
            subscription.metadata = json.dumps(metadata)

        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def renew_subscription(self, subscription_id: int) -> Subscription:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        if subscription.status not in [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.GRACE_PERIOD,
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot renew subscription with current status",
            )

        subscription.status = SubscriptionStatus.ACTIVE
        subscription.next_billing_date = self._calculate_next_billing_date(
            datetime.utcnow(), subscription.billing_cycle
        )
        subscription.grace_period_end = None

        self.db.commit()
        self.db.refresh(subscription)

        invoice = self.generate_invoice(subscription_id)

        return subscription

    def handle_failed_payment(self, subscription_id: int) -> Subscription:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        subscription.status = SubscriptionStatus.PAST_DUE
        subscription.grace_period_end = datetime.utcnow() + timedelta(days=self.GRACE_PERIOD_DAYS)

        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def handle_expired_grace_period(self, subscription_id: int) -> Subscription:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        subscription.status = SubscriptionStatus.EXPIRED
        subscription.end_date = datetime.utcnow()

        self.db.commit()
        self.db.refresh(subscription)

        return subscription

    def check_subscriptions_for_renewal(self) -> List[Subscription]:
        now = datetime.utcnow()
        subscriptions_due = (
            self.db.query(Subscription)
            .filter(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.auto_renew == True,
                Subscription.next_billing_date <= now + timedelta(days=3),
                Subscription.next_billing_date > now - timedelta(days=1),
            )
            .all()
        )

        return subscriptions_due

    def check_expired_trials(self) -> List[Subscription]:
        now = datetime.utcnow()
        expired_trials = (
            self.db.query(Subscription)
            .filter(
                Subscription.status == SubscriptionStatus.TRIALING,
                Subscription.trial_end_date <= now,
            )
            .all()
        )

        return expired_trials

    def check_expired_grace_periods(self) -> List[Subscription]:
        now = datetime.utcnow()
        expired_grace = (
            self.db.query(Subscription)
            .filter(
                Subscription.status.in_([
                    SubscriptionStatus.PAST_DUE,
                    SubscriptionStatus.GRACE_PERIOD,
                ]),
                Subscription.grace_period_end <= now,
            )
            .all()
        )

        return expired_grace

    def generate_invoice(self, subscription_id: int) -> Invoice:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        now = datetime.utcnow()
        billing_period_start = subscription.next_billing_date or now
        billing_period_end = self._calculate_next_billing_date(
            billing_period_start, subscription.billing_cycle
        )

        invoice_number = self._generate_invoice_number(subscription.institution_id)

        amount = subscription.price
        tax_amount = amount * self.TAX_RATE
        total_amount = amount + tax_amount

        invoice = Invoice(
            subscription_id=subscription_id,
            institution_id=subscription.institution_id,
            invoice_number=invoice_number,
            status=InvoiceStatus.OPEN,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=subscription.currency,
            billing_period_start=billing_period_start,
            billing_period_end=billing_period_end,
            due_date=now + timedelta(days=7),
        )

        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)

        return invoice

    def get_invoice(self, invoice_id: int) -> Optional[Invoice]:
        return self.db.query(Invoice).filter(Invoice.id == invoice_id).first()

    def list_invoices(
        self,
        subscription_id: Optional[int] = None,
        institution_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Invoice], int]:
        query = self.db.query(Invoice)

        if subscription_id:
            query = query.filter(Invoice.subscription_id == subscription_id)
        if institution_id:
            query = query.filter(Invoice.institution_id == institution_id)
        if status:
            query = query.filter(Invoice.status == status)

        total = query.count()
        invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()

        return invoices, total

    def mark_invoice_paid(self, invoice_id: int) -> Invoice:
        invoice = self.get_invoice(invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(invoice)

        return invoice

    def create_payment(
        self,
        subscription_id: int,
        amount: Decimal,
        payment_method: Optional[str] = None,
    ) -> Payment:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        payment = Payment(
            subscription_id=subscription_id,
            institution_id=subscription.institution_id,
            amount=amount,
            currency=subscription.currency,
            status=PaymentStatus.PENDING,
            payment_method=payment_method,
        )

        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)

        return payment

    def create_razorpay_order(self, subscription_id: int) -> Dict[str, Any]:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        amount_in_paise = int(subscription.price * 100)
        
        order_data = {
            "order_id": f"order_{subscription_id}_{int(datetime.utcnow().timestamp())}",
            "amount": amount_in_paise,
            "currency": subscription.currency,
            "status": "created",
        }

        return order_data

    def verify_razorpay_payment(
        self,
        payment_id: int,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> Payment:
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )

        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        generated_signature = hmac.new(
            self.razorpay_key_secret.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()

        if generated_signature != razorpay_signature:
            payment.status = PaymentStatus.FAILED
            payment.failure_reason = "Signature verification failed"
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed",
            )

        payment.status = PaymentStatus.CAPTURED
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_order_id = razorpay_order_id
        payment.razorpay_signature = razorpay_signature
        payment.paid_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(payment)

        return payment

    def list_payments(
        self,
        subscription_id: Optional[int] = None,
        institution_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Payment], int]:
        query = self.db.query(Payment)

        if subscription_id:
            query = query.filter(Payment.subscription_id == subscription_id)
        if institution_id:
            query = query.filter(Payment.institution_id == institution_id)
        if status:
            query = query.filter(Payment.status == status)

        total = query.count()
        payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

        return payments, total

    def record_usage(
        self,
        subscription_id: int,
        metric_name: str,
        metric_value: Decimal,
        period_start: datetime,
        period_end: datetime,
    ) -> UsageRecord:
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        usage_record = UsageRecord(
            subscription_id=subscription_id,
            institution_id=subscription.institution_id,
            metric_name=metric_name,
            metric_value=metric_value,
            period_start=period_start,
            period_end=period_end,
            recorded_at=datetime.utcnow(),
        )

        self.db.add(usage_record)
        self.db.commit()
        self.db.refresh(usage_record)

        return usage_record

    def get_usage_records(
        self,
        subscription_id: Optional[int] = None,
        institution_id: Optional[int] = None,
        metric_name: Optional[str] = None,
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[UsageRecord], int]:
        query = self.db.query(UsageRecord)

        if subscription_id:
            query = query.filter(UsageRecord.subscription_id == subscription_id)
        if institution_id:
            query = query.filter(UsageRecord.institution_id == institution_id)
        if metric_name:
            query = query.filter(UsageRecord.metric_name == metric_name)
        if period_start:
            query = query.filter(UsageRecord.period_start >= period_start)
        if period_end:
            query = query.filter(UsageRecord.period_end <= period_end)

        total = query.count()
        usage_records = query.order_by(UsageRecord.recorded_at.desc()).offset(skip).limit(limit).all()

        return usage_records, total

    def _calculate_next_billing_date(
        self, current_date: datetime, billing_cycle: str
    ) -> datetime:
        if billing_cycle == BillingCycle.MONTHLY:
            return current_date + timedelta(days=30)
        elif billing_cycle == BillingCycle.QUARTERLY:
            return current_date + timedelta(days=90)
        elif billing_cycle == BillingCycle.YEARLY:
            return current_date + timedelta(days=365)
        else:
            raise ValueError(f"Invalid billing cycle: {billing_cycle}")

    def _calculate_prorated_amount(
        self, subscription: Subscription, old_price: Decimal, new_price: Decimal
    ) -> Decimal:
        if not subscription.next_billing_date:
            return new_price - old_price

        now = datetime.utcnow()
        total_period_days = (subscription.next_billing_date - subscription.start_date).days
        remaining_days = (subscription.next_billing_date - now).days

        if total_period_days <= 0:
            return new_price - old_price

        unused_amount = (old_price * remaining_days) / total_period_days
        new_period_amount = (new_price * remaining_days) / total_period_days

        prorated_amount = new_period_amount - unused_amount

        return max(prorated_amount, Decimal("0.00"))

    def _generate_invoice_number(self, institution_id: int) -> str:
        now = datetime.utcnow()
        timestamp = int(now.timestamp())
        return f"INV-{institution_id}-{timestamp}"
