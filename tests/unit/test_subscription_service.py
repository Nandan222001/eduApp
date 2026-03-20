import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch, Mock
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.services.subscription_service import SubscriptionService, SubscriptionPlans
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


@pytest.mark.unit
class TestCreateSubscription:
    """Unit tests for create_subscription method with different plan types and billing cycles"""

    def test_create_subscription_starter_monthly(self, db_session: Session, institution):
        """Test creating STARTER plan with MONTHLY billing"""
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
        assert subscription.billing_cycle == BillingCycle.MONTHLY
        assert subscription.price == Decimal("999.00")
        assert subscription.status == SubscriptionStatus.TRIALING
        assert subscription.max_users == 10
        assert subscription.max_storage_gb == 50
        assert subscription.trial_end_date is not None
        assert subscription.auto_renew is True

    def test_create_subscription_growth_quarterly(self, db_session: Session, institution):
        """Test creating GROWTH plan with QUARTERLY billing"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.QUARTERLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=0)
        
        assert subscription.plan_name == PlanName.GROWTH
        assert subscription.billing_cycle == BillingCycle.QUARTERLY
        assert subscription.price == Decimal("8099.00")
        assert subscription.status == SubscriptionStatus.ACTIVE
        assert subscription.max_users == 50
        assert subscription.max_storage_gb == 250
        assert subscription.trial_end_date is None

    def test_create_subscription_professional_yearly(self, db_session: Session, institution):
        """Test creating PROFESSIONAL plan with YEARLY billing"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            billing_cycle=BillingCycle.YEARLY,
            auto_renew=False
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=30)
        
        assert subscription.plan_name == PlanName.PROFESSIONAL
        assert subscription.billing_cycle == BillingCycle.YEARLY
        assert subscription.price == Decimal("79999.00")
        assert subscription.max_users == 200
        assert subscription.max_storage_gb == 1000
        assert subscription.auto_renew is False

    def test_create_subscription_enterprise_monthly(self, db_session: Session, institution):
        """Test creating ENTERPRISE plan with MONTHLY billing (unlimited users and storage)"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.ENTERPRISE,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=7)
        
        assert subscription.plan_name == PlanName.ENTERPRISE
        assert subscription.price == Decimal("19999.00")
        assert subscription.max_users is None
        assert subscription.max_storage_gb is None

    def test_create_subscription_no_trial(self, db_session: Session, institution):
        """Test subscription creation without trial period"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=0)
        
        assert subscription.status == SubscriptionStatus.ACTIVE
        assert subscription.trial_end_date is None
        assert subscription.next_billing_date is not None

    def test_create_subscription_custom_trial_period(self, db_session: Session, institution):
        """Test subscription creation with custom trial period"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=30)
        
        assert subscription.status == SubscriptionStatus.TRIALING
        trial_duration = (subscription.trial_end_date - subscription.start_date).days
        assert trial_duration == 30


@pytest.mark.unit
class TestSubscriptionUpgradeDowngrade:
    """Unit tests for subscription upgrade and downgrade with prorated billing"""

    def test_upgrade_subscription_with_proration(self, db_session: Session, institution):
        """Test upgrading subscription from STARTER to GROWTH with prorated calculation"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            max_users=10,
            max_storage_gb=50,
            start_date=datetime.utcnow() - timedelta(days=10),
            next_billing_date=datetime.utcnow() + timedelta(days=20),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        result = service.upgrade_subscription(subscription.id, PlanName.GROWTH)
        
        assert result["subscription"].plan_name == PlanName.GROWTH
        assert result["subscription"].price == Decimal("2999.00")
        assert result["subscription"].max_users == 50
        assert result["subscription"].max_storage_gb == 250
        assert "prorated_amount" in result
        assert result["prorated_amount"] >= 0
        assert result["immediate_charge"] is True

    def test_upgrade_subscription_trialing_to_professional(self, db_session: Session, institution):
        """Test upgrading subscription from GROWTH (trialing) to PROFESSIONAL"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.TRIALING,
            billing_cycle=BillingCycle.YEARLY,
            price=Decimal("29999.00"),
            currency="INR",
            max_users=50,
            max_storage_gb=250,
            start_date=datetime.utcnow() - timedelta(days=5),
            trial_end_date=datetime.utcnow() + timedelta(days=9),
            next_billing_date=datetime.utcnow() + timedelta(days=9),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        result = service.upgrade_subscription(subscription.id, PlanName.PROFESSIONAL)
        
        assert result["subscription"].plan_name == PlanName.PROFESSIONAL
        assert result["subscription"].price == Decimal("79999.00")
        assert result["subscription"].max_users == 200

    def test_downgrade_subscription_growth_to_starter(self, db_session: Session, institution):
        """Test downgrading subscription from GROWTH to STARTER"""
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
            start_date=datetime.utcnow() - timedelta(days=15),
            next_billing_date=datetime.utcnow() + timedelta(days=15),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        downgraded = service.downgrade_subscription(subscription.id, PlanName.STARTER)
        
        assert downgraded.plan_name == PlanName.STARTER
        assert downgraded.price == Decimal("999.00")
        assert downgraded.max_users == 10
        assert downgraded.max_storage_gb == 50

    def test_downgrade_subscription_professional_to_growth(self, db_session: Session, institution):
        """Test downgrading subscription from PROFESSIONAL to GROWTH"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.QUARTERLY,
            price=Decimal("21599.00"),
            currency="INR",
            max_users=200,
            max_storage_gb=1000,
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow() + timedelta(days=60),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        downgraded = service.downgrade_subscription(subscription.id, PlanName.GROWTH)
        
        assert downgraded.plan_name == PlanName.GROWTH
        assert downgraded.price == Decimal("8099.00")

    def test_upgrade_invalid_subscription_status(self, db_session: Session, institution):
        """Test upgrade fails for non-active/non-trialing subscription"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.CANCELED,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=False,
        )
        db_session.add(subscription)
        db_session.commit()
        
        with pytest.raises(HTTPException) as exc_info:
            service.upgrade_subscription(subscription.id, PlanName.GROWTH)
        
        assert exc_info.value.status_code == 400

    def test_downgrade_only_active_subscriptions(self, db_session: Session, institution):
        """Test downgrade only works for active subscriptions"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.PAST_DUE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        with pytest.raises(HTTPException) as exc_info:
            service.downgrade_subscription(subscription.id, PlanName.STARTER)
        
        assert exc_info.value.status_code == 400


@pytest.mark.unit
class TestSubscriptionRenewal:
    """Unit tests for subscription renewal with auto-renew enabled/disabled"""

    def test_renew_subscription_auto_renew_enabled(self, db_session: Session, institution):
        """Test renewing subscription with auto-renew enabled"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        renewed = service.renew_subscription(subscription.id)
        
        assert renewed.status == SubscriptionStatus.ACTIVE
        assert renewed.next_billing_date > datetime.utcnow()
        assert renewed.grace_period_end is None

    def test_renew_subscription_auto_renew_disabled(self, db_session: Session, institution):
        """Test renewing subscription with auto-renew disabled"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.YEARLY,
            price=Decimal("29999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=365),
            next_billing_date=datetime.utcnow(),
            auto_renew=False,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        renewed = service.renew_subscription(subscription.id)
        
        assert renewed.status == SubscriptionStatus.ACTIVE
        assert renewed.next_billing_date > datetime.utcnow()

    def test_renew_subscription_from_past_due(self, db_session: Session, institution):
        """Test renewing subscription from PAST_DUE status"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.PAST_DUE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=35),
            next_billing_date=datetime.utcnow() - timedelta(days=5),
            grace_period_end=datetime.utcnow() + timedelta(days=2),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        renewed = service.renew_subscription(subscription.id)
        
        assert renewed.status == SubscriptionStatus.ACTIVE
        assert renewed.grace_period_end is None

    def test_renew_subscription_from_grace_period(self, db_session: Session, institution):
        """Test renewing subscription from GRACE_PERIOD status"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            status=SubscriptionStatus.GRACE_PERIOD,
            billing_cycle=BillingCycle.QUARTERLY,
            price=Decimal("21599.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=95),
            next_billing_date=datetime.utcnow() - timedelta(days=5),
            grace_period_end=datetime.utcnow() + timedelta(days=1),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        renewed = service.renew_subscription(subscription.id)
        
        assert renewed.status == SubscriptionStatus.ACTIVE
        assert renewed.grace_period_end is None

    def test_renew_subscription_generates_invoice(self, db_session: Session, institution):
        """Test that renewal generates an invoice"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        service.renew_subscription(subscription.id)
        
        invoices = db_session.query(Invoice).filter(
            Invoice.subscription_id == subscription.id
        ).all()
        
        assert len(invoices) > 0

    def test_check_subscriptions_for_renewal(self, db_session: Session, institution):
        """Test checking for subscriptions due for renewal"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=28),
            next_billing_date=datetime.utcnow() + timedelta(days=2),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        due_subscriptions = service.check_subscriptions_for_renewal()
        
        assert len(due_subscriptions) >= 1
        assert subscription.id in [s.id for s in due_subscriptions]


@pytest.mark.unit
class TestSuspendSubscription:
    """Unit tests for suspending subscription for payment failures"""

    def test_handle_failed_payment(self, db_session: Session, institution):
        """Test handling failed payment moves subscription to PAST_DUE"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        updated = service.handle_failed_payment(subscription.id)
        
        assert updated.status == SubscriptionStatus.PAST_DUE
        assert updated.grace_period_end is not None
        assert (updated.grace_period_end - datetime.utcnow()).days == 7

    def test_handle_failed_payment_grace_period(self, db_session: Session, institution):
        """Test that failed payment sets grace period correctly"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.QUARTERLY,
            price=Decimal("8099.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=90),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        updated = service.handle_failed_payment(subscription.id)
        
        grace_period_days = (updated.grace_period_end - datetime.utcnow()).days
        assert grace_period_days == service.GRACE_PERIOD_DAYS

    def test_handle_expired_grace_period(self, db_session: Session, institution):
        """Test handling expired grace period moves subscription to EXPIRED"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.PAST_DUE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=38),
            next_billing_date=datetime.utcnow() - timedelta(days=8),
            grace_period_end=datetime.utcnow() - timedelta(days=1),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        updated = service.handle_expired_grace_period(subscription.id)
        
        assert updated.status == SubscriptionStatus.EXPIRED
        assert updated.end_date is not None

    def test_check_expired_grace_periods(self, db_session: Session, institution):
        """Test checking for expired grace periods"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription1 = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.PAST_DUE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=40),
            grace_period_end=datetime.utcnow() - timedelta(days=1),
            auto_renew=True,
        )
        subscription2 = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.GRACE_PERIOD,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=35),
            grace_period_end=datetime.utcnow() - timedelta(hours=12),
            auto_renew=True,
        )
        db_session.add_all([subscription1, subscription2])
        db_session.commit()
        
        expired_grace = service.check_expired_grace_periods()
        
        assert len(expired_grace) >= 2


@pytest.mark.unit
class TestUsageLimits:
    """Unit tests for calculate_usage and enforce usage limits"""

    def test_record_usage_active_users(self, db_session: Session, institution):
        """Test recording usage for active users"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            max_users=10,
            max_storage_gb=50,
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        usage = service.record_usage(
            subscription.id,
            metric_name="active_users",
            metric_value=Decimal("8"),
            period_start=datetime.utcnow() - timedelta(days=1),
            period_end=datetime.utcnow()
        )
        
        assert usage.id is not None
        assert usage.metric_name == "active_users"
        assert usage.metric_value == Decimal("8")
        assert usage.subscription_id == subscription.id

    def test_record_usage_storage(self, db_session: Session, institution):
        """Test recording usage for storage"""
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
        db_session.refresh(subscription)
        
        usage = service.record_usage(
            subscription.id,
            metric_name="storage_gb",
            metric_value=Decimal("180.5"),
            period_start=datetime.utcnow() - timedelta(days=1),
            period_end=datetime.utcnow()
        )
        
        assert usage.metric_name == "storage_gb"
        assert usage.metric_value == Decimal("180.5")

    def test_check_max_users_limit_starter(self, db_session: Session, institution):
        """Test checking max users limit for STARTER plan"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            max_users=10,
            max_storage_gb=50,
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        assert subscription.max_users == 10

    def test_check_max_storage_limit_professional(self, db_session: Session, institution):
        """Test checking max storage limit for PROFESSIONAL plan"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.YEARLY,
            price=Decimal("79999.00"),
            currency="INR",
            max_users=200,
            max_storage_gb=1000,
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=365),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        assert subscription.max_storage_gb == 1000

    def test_enterprise_unlimited_users(self, db_session: Session, institution):
        """Test that ENTERPRISE plan has unlimited users"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.ENTERPRISE,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=0)
        
        assert subscription.max_users is None

    def test_enterprise_unlimited_storage(self, db_session: Session, institution):
        """Test that ENTERPRISE plan has unlimited storage"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.ENTERPRISE,
            billing_cycle=BillingCycle.YEARLY,
            auto_renew=True
        )
        
        subscription = service.create_subscription(subscription_data, trial_days=0)
        
        assert subscription.max_storage_gb is None

    def test_get_usage_records_by_metric(self, db_session: Session, institution):
        """Test getting usage records filtered by metric name"""
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
        db_session.refresh(subscription)
        
        service.record_usage(
            subscription.id,
            "active_users",
            Decimal("45"),
            datetime.utcnow() - timedelta(days=1),
            datetime.utcnow()
        )
        service.record_usage(
            subscription.id,
            "storage_gb",
            Decimal("200"),
            datetime.utcnow() - timedelta(days=1),
            datetime.utcnow()
        )
        
        records, total = service.get_usage_records(
            subscription_id=subscription.id,
            metric_name="active_users"
        )
        
        assert total >= 1
        assert all(r.metric_name == "active_users" for r in records)

    def test_get_usage_records_by_period(self, db_session: Session, institution):
        """Test getting usage records filtered by period"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            max_users=10,
            max_storage_gb=50,
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        period_start = datetime.utcnow() - timedelta(days=7)
        period_end = datetime.utcnow()
        
        service.record_usage(
            subscription.id,
            "active_users",
            Decimal("8"),
            period_start,
            period_end
        )
        
        records, total = service.get_usage_records(
            subscription_id=subscription.id,
            period_start=period_start - timedelta(days=1),
            period_end=period_end + timedelta(days=1)
        )
        
        assert total >= 1


@pytest.mark.unit
class TestInvoiceGeneration:
    """Unit tests for invoice generation with correct amounts"""

    def test_generate_invoice_correct_amounts(self, db_session: Session, institution):
        """Test invoice generation with correct amount, tax, and total"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice = service.generate_invoice(subscription.id)
        
        expected_amount = Decimal("999.00")
        expected_tax = expected_amount * service.TAX_RATE
        expected_total = expected_amount + expected_tax
        
        assert invoice.amount == expected_amount
        assert invoice.tax_amount == expected_tax
        assert invoice.total_amount == expected_total
        assert invoice.currency == "INR"
        assert invoice.status == InvoiceStatus.OPEN

    def test_generate_invoice_growth_plan(self, db_session: Session, institution):
        """Test invoice generation for GROWTH plan"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.QUARTERLY,
            price=Decimal("8099.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=90),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice = service.generate_invoice(subscription.id)
        
        expected_amount = Decimal("8099.00")
        expected_tax = expected_amount * Decimal("0.18")
        expected_total = expected_amount + expected_tax
        
        assert invoice.amount == expected_amount
        assert invoice.tax_amount == expected_tax
        assert invoice.total_amount == expected_total

    def test_generate_invoice_professional_yearly(self, db_session: Session, institution):
        """Test invoice generation for PROFESSIONAL yearly plan"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.YEARLY,
            price=Decimal("79999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=365),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice = service.generate_invoice(subscription.id)
        
        expected_amount = Decimal("79999.00")
        expected_tax = expected_amount * Decimal("0.18")
        
        assert invoice.amount == expected_amount
        assert invoice.tax_amount == expected_tax

    def test_generate_invoice_has_unique_number(self, db_session: Session, institution):
        """Test that generated invoices have unique invoice numbers"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice1 = service.generate_invoice(subscription.id)
        invoice2 = service.generate_invoice(subscription.id)
        
        assert invoice1.invoice_number != invoice2.invoice_number

    def test_generate_invoice_has_billing_period(self, db_session: Session, institution):
        """Test that invoice has correct billing period"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice = service.generate_invoice(subscription.id)
        
        assert invoice.billing_period_start is not None
        assert invoice.billing_period_end is not None
        assert invoice.billing_period_end > invoice.billing_period_start

    def test_generate_invoice_has_due_date(self, db_session: Session, institution):
        """Test that invoice has due date"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice = service.generate_invoice(subscription.id)
        
        assert invoice.due_date is not None
        assert invoice.due_date > datetime.utcnow()

    def test_mark_invoice_paid(self, db_session: Session, institution):
        """Test marking invoice as paid"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        invoice = service.generate_invoice(subscription.id)
        paid_invoice = service.mark_invoice_paid(invoice.id)
        
        assert paid_invoice.status == InvoiceStatus.PAID
        assert paid_invoice.paid_at is not None


@pytest.mark.unit
class TestRazorpayIntegration:
    """Unit tests for Razorpay payment gateway integration with mocks"""

    @patch('src.services.subscription_service.SubscriptionService.create_razorpay_order')
    def test_create_razorpay_order_mock(self, mock_create_order, db_session: Session, institution):
        """Test creating Razorpay order with mock"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        mock_create_order.return_value = {
            "order_id": "order_mock123",
            "amount": 99900,
            "currency": "INR",
            "status": "created"
        }
        
        order = service.create_razorpay_order(subscription.id)
        
        assert order["order_id"] == "order_mock123"
        assert order["amount"] == 99900
        assert order["currency"] == "INR"
        assert order["status"] == "created"

    def test_create_razorpay_order_amount_in_paise(self, db_session: Session, institution):
        """Test that Razorpay order amount is in paise"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        order = service.create_razorpay_order(subscription.id)
        
        assert order["amount"] == 299900

    def test_verify_razorpay_payment_success(self, db_session: Session, institution):
        """Test successful Razorpay payment verification"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
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
        assert verified_payment.razorpay_order_id == razorpay_order_id
        assert verified_payment.paid_at is not None

    def test_verify_razorpay_payment_invalid_signature(self, db_session: Session, institution):
        """Test Razorpay payment verification fails with invalid signature"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        payment = service.create_payment(subscription.id, Decimal("999.00"))
        
        with pytest.raises(HTTPException) as exc_info:
            service.verify_razorpay_payment(
                payment.id,
                "order_test123",
                "pay_test123",
                "invalid_signature"
            )
        
        assert exc_info.value.status_code == 400
        
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.FAILED
        assert payment.failure_reason == "Signature verification failed"

    @patch('src.services.subscription_service.SubscriptionService.verify_razorpay_payment')
    def test_verify_razorpay_payment_mock(self, mock_verify, db_session: Session, institution):
        """Test Razorpay payment verification with mock"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        payment = service.create_payment(subscription.id, Decimal("2999.00"))
        
        mock_payment = Mock()
        mock_payment.id = payment.id
        mock_payment.status = PaymentStatus.CAPTURED
        mock_payment.razorpay_payment_id = "pay_mock123"
        mock_payment.razorpay_order_id = "order_mock123"
        mock_payment.paid_at = datetime.utcnow()
        
        mock_verify.return_value = mock_payment
        
        verified = service.verify_razorpay_payment(
            payment.id,
            "order_mock123",
            "pay_mock123",
            "mock_signature"
        )
        
        assert verified.status == PaymentStatus.CAPTURED
        assert verified.razorpay_payment_id == "pay_mock123"

    def test_create_payment_with_razorpay_method(self, db_session: Session, institution):
        """Test creating payment with Razorpay method"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.YEARLY,
            price=Decimal("79999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=365),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        payment = service.create_payment(
            subscription.id,
            Decimal("79999.00"),
            payment_method="razorpay"
        )
        
        assert payment.id is not None
        assert payment.amount == Decimal("79999.00")
        assert payment.payment_method == "razorpay"
        assert payment.status == PaymentStatus.PENDING

    @patch('src.services.subscription_service.SubscriptionService.create_razorpay_order')
    def test_razorpay_order_for_different_plans(self, mock_create_order, db_session: Session, institution):
        """Test creating Razorpay orders for different plan types"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        plans = [
            (PlanName.STARTER, BillingCycle.MONTHLY, Decimal("999.00"), 99900),
            (PlanName.GROWTH, BillingCycle.QUARTERLY, Decimal("8099.00"), 809900),
            (PlanName.PROFESSIONAL, BillingCycle.YEARLY, Decimal("79999.00"), 7999900),
        ]
        
        for plan_name, billing_cycle, price, expected_paise in plans:
            subscription = Subscription(
                institution_id=institution.id,
                plan_name=plan_name,
                status=SubscriptionStatus.ACTIVE,
                billing_cycle=billing_cycle,
                price=price,
                currency="INR",
                start_date=datetime.utcnow(),
                next_billing_date=datetime.utcnow() + timedelta(days=30),
                auto_renew=True,
            )
            db_session.add(subscription)
            db_session.commit()
            db_session.refresh(subscription)
            
            mock_create_order.return_value = {
                "order_id": f"order_{plan_name}",
                "amount": expected_paise,
                "currency": "INR",
                "status": "created"
            }
            
            order = service.create_razorpay_order(subscription.id)
            assert order["amount"] == expected_paise

    def test_list_payments_by_status(self, db_session: Session, institution):
        """Test listing payments filtered by status"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        payment1 = service.create_payment(subscription.id, Decimal("999.00"))
        payment2 = service.create_payment(subscription.id, Decimal("999.00"))
        
        payments, total = service.list_payments(
            subscription_id=subscription.id,
            status=PaymentStatus.PENDING
        )
        
        assert total >= 2
        assert all(p.status == PaymentStatus.PENDING for p in payments)


@pytest.mark.unit
class TestProrationCalculations:
    """Unit tests for prorated billing calculations"""

    def test_calculate_prorated_amount_upgrade(self, db_session: Session, institution):
        """Test prorated amount calculation for upgrade"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        start_date = datetime.utcnow() - timedelta(days=10)
        next_billing = datetime.utcnow() + timedelta(days=20)
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=start_date,
            next_billing_date=next_billing,
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        old_price = Decimal("999.00")
        new_price = Decimal("2999.00")
        
        prorated = service._calculate_prorated_amount(subscription, old_price, new_price)
        
        assert prorated >= 0
        assert isinstance(prorated, Decimal)

    def test_calculate_prorated_amount_ensures_positive(self, db_session: Session, institution):
        """Test that prorated amount is always positive or zero"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=25),
            next_billing_date=datetime.utcnow() + timedelta(days=5),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        prorated = service._calculate_prorated_amount(
            subscription,
            Decimal("2999.00"),
            Decimal("999.00")
        )
        
        assert prorated >= 0

    def test_calculate_prorated_amount_mid_cycle(self, db_session: Session, institution):
        """Test prorated amount calculation in middle of billing cycle"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.MONTHLY,
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=15),
            next_billing_date=datetime.utcnow() + timedelta(days=15),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        old_price = Decimal("999.00")
        new_price = Decimal("2999.00")
        
        prorated = service._calculate_prorated_amount(subscription, old_price, new_price)
        
        price_difference = new_price - old_price
        assert prorated > 0
        assert prorated < price_difference

    def test_calculate_next_billing_date_monthly(self, db_session: Session):
        """Test calculating next billing date for monthly cycle"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        current_date = datetime(2024, 1, 1)
        next_date = service._calculate_next_billing_date(current_date, BillingCycle.MONTHLY)
        
        assert next_date == current_date + timedelta(days=30)

    def test_calculate_next_billing_date_quarterly(self, db_session: Session):
        """Test calculating next billing date for quarterly cycle"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        current_date = datetime(2024, 1, 1)
        next_date = service._calculate_next_billing_date(current_date, BillingCycle.QUARTERLY)
        
        assert next_date == current_date + timedelta(days=90)

    def test_calculate_next_billing_date_yearly(self, db_session: Session):
        """Test calculating next billing date for yearly cycle"""
        service = SubscriptionService(db_session, "test_key", "test_secret")
        
        current_date = datetime(2024, 1, 1)
        next_date = service._calculate_next_billing_date(current_date, BillingCycle.YEARLY)
        
        assert next_date == current_date + timedelta(days=365)
