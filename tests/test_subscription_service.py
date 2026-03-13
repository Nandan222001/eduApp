import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.services.subscription_service import SubscriptionService, SubscriptionPlans
from src.models.subscription import Subscription, Payment, Invoice
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    PlanName,
    BillingCycle,
    SubscriptionStatus,
    PaymentStatus,
    InvoiceStatus,
)


@pytest.mark.unit
class TestSubscriptionPlans:
    """Unit tests for SubscriptionPlans"""

    def test_get_plan_valid(self):
        """Test getting a valid plan"""
        plan = SubscriptionPlans.get_plan(PlanName.STARTER)
        
        assert plan is not None
        assert plan["display_name"] == "Starter"
        assert "monthly_price" in plan
        assert "features" in plan

    def test_get_plan_invalid(self):
        """Test getting an invalid plan"""
        plan = SubscriptionPlans.get_plan("INVALID_PLAN")
        
        assert plan is None

    def test_get_all_plans(self):
        """Test getting all plans"""
        plans = SubscriptionPlans.get_all_plans()
        
        assert len(plans) == 4
        assert PlanName.STARTER in plans
        assert PlanName.GROWTH in plans
        assert PlanName.PROFESSIONAL in plans
        assert PlanName.ENTERPRISE in plans

    def test_get_plan_price_monthly(self):
        """Test getting monthly plan price"""
        price = SubscriptionPlans.get_plan_price(PlanName.STARTER, BillingCycle.MONTHLY)
        
        assert price == Decimal("999.00")

    def test_get_plan_price_yearly(self):
        """Test getting yearly plan price"""
        price = SubscriptionPlans.get_plan_price(PlanName.STARTER, BillingCycle.YEARLY)
        
        assert price == Decimal("9999.00")

    def test_get_plan_price_invalid_plan(self):
        """Test getting price for invalid plan"""
        with pytest.raises(ValueError):
            SubscriptionPlans.get_plan_price("INVALID", BillingCycle.MONTHLY)

    def test_get_plan_price_invalid_cycle(self):
        """Test getting price for invalid billing cycle"""
        with pytest.raises(ValueError):
            SubscriptionPlans.get_plan_price(PlanName.STARTER, "invalid_cycle")


@pytest.mark.unit
class TestSubscriptionService:
    """Unit tests for SubscriptionService"""

    def test_create_subscription_success(
        self, db_session: Session, institution
    ):
        """Test successful subscription creation"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=14)
        
        assert subscription.id is not None
        assert subscription.institution_id == institution.id
        assert subscription.plan_name == PlanName.STARTER
        assert subscription.status == SubscriptionStatus.TRIALING
        assert subscription.trial_end_date is not None

    def test_create_subscription_no_trial(
        self, db_session: Session, institution
    ):
        """Test subscription creation without trial"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.YEARLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=0)
        
        assert subscription.status == SubscriptionStatus.ACTIVE
        assert subscription.trial_end_date is None

    def test_create_subscription_institution_not_found(
        self, db_session: Session
    ):
        """Test subscription creation with invalid institution"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=99999,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.create_subscription(subscription_data)
        
        assert exc_info.value.status_code == 404

    def test_create_subscription_already_active(
        self, db_session: Session, institution, subscription
    ):
        """Test creating subscription when one already exists"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.create_subscription(subscription_data)
        
        assert exc_info.value.status_code == 400

    def test_get_subscription(
        self, db_session: Session, subscription
    ):
        """Test getting a subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = service.get_subscription(subscription.id)
        
        assert result is not None
        assert result.id == subscription.id

    def test_get_subscription_not_found(
        self, db_session: Session
    ):
        """Test getting non-existent subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = service.get_subscription(99999)
        
        assert result is None

    def test_get_institution_subscription(
        self, db_session: Session, institution, subscription
    ):
        """Test getting institution's active subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = service.get_institution_subscription(institution.id)
        
        assert result is not None
        assert result.institution_id == institution.id

    def test_list_subscriptions(
        self, db_session: Session, institution, subscription
    ):
        """Test listing subscriptions"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscriptions, total = service.list_subscriptions(
            institution_id=institution.id
        )
        
        assert total >= 1
        assert len(subscriptions) >= 1

    def test_list_subscriptions_with_status_filter(
        self, db_session: Session, institution, subscription
    ):
        """Test listing subscriptions with status filter"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscriptions, total = service.list_subscriptions(
            institution_id=institution.id,
            status=SubscriptionStatus.ACTIVE
        )
        
        assert all(s.status == SubscriptionStatus.ACTIVE for s in subscriptions)

    def test_update_subscription(
        self, db_session: Session, subscription
    ):
        """Test updating subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        update_data = SubscriptionUpdate(auto_renew=False)
        
        updated = service.update_subscription(subscription.id, update_data)
        
        assert updated.auto_renew is False

    def test_update_subscription_plan_and_billing(
        self, db_session: Session, subscription
    ):
        """Test updating subscription plan and billing cycle"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        update_data = SubscriptionUpdate(
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.YEARLY
        )
        
        updated = service.update_subscription(subscription.id, update_data)
        
        assert updated.plan_name == PlanName.GROWTH
        assert updated.billing_cycle == BillingCycle.YEARLY
        assert updated.price > subscription.price

    def test_update_subscription_not_found(
        self, db_session: Session
    ):
        """Test updating non-existent subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        update_data = SubscriptionUpdate(auto_renew=False)
        
        with pytest.raises(HTTPException) as exc_info:
            service.update_subscription(99999, update_data)
        
        assert exc_info.value.status_code == 404

    def test_upgrade_subscription(
        self, db_session: Session, subscription
    ):
        """Test upgrading subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        result = service.upgrade_subscription(subscription.id, PlanName.GROWTH)
        
        assert result["subscription"].plan_name == PlanName.GROWTH
        assert "prorated_amount" in result

    def test_upgrade_subscription_not_found(
        self, db_session: Session
    ):
        """Test upgrading non-existent subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        with pytest.raises(HTTPException) as exc_info:
            service.upgrade_subscription(99999, PlanName.GROWTH)
        
        assert exc_info.value.status_code == 404

    def test_downgrade_subscription(
        self, db_session: Session, institution
    ):
        """Test downgrading subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            max_users=50,
            max_storage_gb=250,
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        downgraded = service.downgrade_subscription(subscription.id, PlanName.STARTER)
        
        assert downgraded.plan_name == PlanName.STARTER

    def test_cancel_subscription(
        self, db_session: Session, subscription
    ):
        """Test canceling subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        canceled = service.cancel_subscription(
            subscription.id,
            immediate=False,
            reason="Testing"
        )
        
        assert canceled.canceled_at is not None
        assert canceled.auto_renew is False
        assert canceled.end_date is not None

    def test_cancel_subscription_immediate(
        self, db_session: Session, subscription
    ):
        """Test immediately canceling subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        canceled = service.cancel_subscription(subscription.id, immediate=True)
        
        assert canceled.status == SubscriptionStatus.CANCELED

    def test_cancel_already_canceled_subscription(
        self, db_session: Session, subscription
    ):
        """Test canceling already canceled subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription.status = SubscriptionStatus.CANCELED
        db_session.commit()
        
        with pytest.raises(HTTPException) as exc_info:
            service.cancel_subscription(subscription.id)
        
        assert exc_info.value.status_code == 400

    def test_renew_subscription(
        self, db_session: Session, subscription
    ):
        """Test renewing subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        renewed = service.renew_subscription(subscription.id)
        
        assert renewed.status == SubscriptionStatus.ACTIVE
        assert renewed.next_billing_date > datetime.utcnow()

    def test_handle_failed_payment(
        self, db_session: Session, subscription
    ):
        """Test handling failed payment"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        updated = service.handle_failed_payment(subscription.id)
        
        assert updated.status == SubscriptionStatus.PAST_DUE
        assert updated.grace_period_end is not None

    def test_handle_expired_grace_period(
        self, db_session: Session, subscription
    ):
        """Test handling expired grace period"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        updated = service.handle_expired_grace_period(subscription.id)
        
        assert updated.status == SubscriptionStatus.EXPIRED
        assert updated.end_date is not None

    def test_check_subscriptions_for_renewal(
        self, db_session: Session, institution
    ):
        """Test checking subscriptions due for renewal"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=2),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        due_subscriptions = service.check_subscriptions_for_renewal()
        
        assert len(due_subscriptions) >= 1

    def test_check_expired_trials(
        self, db_session: Session, institution
    ):
        """Test checking expired trials"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.TRIALING,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=15),
            trial_end_date=datetime.utcnow() - timedelta(days=1),
            next_billing_date=datetime.utcnow() + timedelta(days=15),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        expired_trials = service.check_expired_trials()
        
        assert len(expired_trials) >= 1

    def test_generate_invoice(
        self, db_session: Session, subscription
    ):
        """Test generating invoice"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        invoice = service.generate_invoice(subscription.id)
        
        assert invoice.id is not None
        assert invoice.subscription_id == subscription.id
        assert invoice.status == InvoiceStatus.OPEN
        assert invoice.amount == subscription.price
        assert invoice.tax_amount > 0
        assert invoice.total_amount > invoice.amount

    def test_mark_invoice_paid(
        self, db_session: Session, subscription
    ):
        """Test marking invoice as paid"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        invoice = service.generate_invoice(subscription.id)
        paid_invoice = service.mark_invoice_paid(invoice.id)
        
        assert paid_invoice.status == InvoiceStatus.PAID
        assert paid_invoice.paid_at is not None

    def test_create_payment(
        self, db_session: Session, subscription
    ):
        """Test creating payment"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        payment = service.create_payment(
            subscription.id,
            Decimal("999.00"),
            payment_method="card"
        )
        
        assert payment.id is not None
        assert payment.subscription_id == subscription.id
        assert payment.status == PaymentStatus.PENDING

    def test_create_razorpay_order(
        self, db_session: Session, subscription
    ):
        """Test creating Razorpay order"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        order = service.create_razorpay_order(subscription.id)
        
        assert "order_id" in order
        assert "amount" in order
        assert order["currency"] == "INR"

    def test_verify_razorpay_payment_success(
        self, db_session: Session, subscription
    ):
        """Test successful Razorpay payment verification"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        payment = service.create_payment(subscription.id, Decimal("999.00"))
        
        razorpay_order_id = "order_test123"
        razorpay_payment_id = "pay_test123"
        
        import hmac
        import hashlib
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        razorpay_signature = hmac.new(
            "test_secret".encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        verified_payment = service.verify_razorpay_payment(
            payment.id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
        
        assert verified_payment.status == PaymentStatus.CAPTURED
        assert verified_payment.razorpay_payment_id == razorpay_payment_id

    def test_verify_razorpay_payment_invalid_signature(
        self, db_session: Session, subscription
    ):
        """Test Razorpay payment verification with invalid signature"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        payment = service.create_payment(subscription.id, Decimal("999.00"))
        
        with pytest.raises(HTTPException) as exc_info:
            service.verify_razorpay_payment(
                payment.id,
                "order_test123",
                "pay_test123",
                "invalid_signature"
            )
        
        assert exc_info.value.status_code == 400

    def test_record_usage(
        self, db_session: Session, subscription
    ):
        """Test recording usage"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        usage = service.record_usage(
            subscription.id,
            metric_name="active_users",
            metric_value=Decimal("5.0"),
            period_start=datetime.utcnow() - timedelta(days=1),
            period_end=datetime.utcnow()
        )
        
        assert usage.id is not None
        assert usage.metric_name == "active_users"
        assert usage.metric_value == Decimal("5.0")

    def test_get_usage_records(
        self, db_session: Session, subscription
    ):
        """Test getting usage records"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        service.record_usage(
            subscription.id,
            "active_users",
            Decimal("5.0"),
            datetime.utcnow() - timedelta(days=1),
            datetime.utcnow()
        )
        
        records, total = service.get_usage_records(
            subscription_id=subscription.id
        )
        
        assert total >= 1
        assert len(records) >= 1

    def test_calculate_next_billing_date_monthly(
        self, db_session: Session
    ):
        """Test calculating next billing date for monthly cycle"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        current_date = datetime(2024, 1, 1)
        next_date = service._calculate_next_billing_date(
            current_date,
            BillingCycle.MONTHLY
        )
        
        assert next_date == current_date + timedelta(days=30)

    def test_calculate_prorated_amount(
        self, db_session: Session, subscription
    ):
        """Test calculating prorated amount"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        old_price = Decimal("999.00")
        new_price = Decimal("2999.00")
        
        prorated = service._calculate_prorated_amount(
            subscription,
            old_price,
            new_price
        )
        
        assert prorated >= 0
