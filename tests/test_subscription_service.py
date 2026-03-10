import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from src.services.subscription_service import SubscriptionService, SubscriptionPlans
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    PlanName,
    BillingCycle,
    SubscriptionStatus,
)
from src.models.subscription import Subscription
from src.models.institution import Institution


@pytest.fixture
def subscription_service(db: Session) -> SubscriptionService:
    return SubscriptionService(db, "test_key_id", "test_key_secret")


@pytest.fixture
def institution(db: Session) -> Institution:
    institution = Institution(
        name="Test Institution",
        slug="test-institution",
        domain="test.com",
        is_active=True,
    )
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution


class TestSubscriptionPlans:
    def test_get_plan(self) -> None:
        plan = SubscriptionPlans.get_plan(PlanName.STARTER)
        assert plan is not None
        assert plan["display_name"] == "Starter"
        assert plan["monthly_price"] == Decimal("999.00")

    def test_get_all_plans(self) -> None:
        plans = SubscriptionPlans.get_all_plans()
        assert len(plans) == 4
        assert PlanName.STARTER in plans
        assert PlanName.GROWTH in plans
        assert PlanName.PROFESSIONAL in plans
        assert PlanName.ENTERPRISE in plans

    def test_get_plan_price(self) -> None:
        price = SubscriptionPlans.get_plan_price(PlanName.GROWTH, BillingCycle.MONTHLY)
        assert price == Decimal("2999.00")

    def test_invalid_plan(self) -> None:
        plan = SubscriptionPlans.get_plan("NonExistent")
        assert plan is None


class TestSubscriptionService:
    def test_create_subscription(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data, trial_days=14)

        assert subscription.id is not None
        assert subscription.institution_id == institution.id
        assert subscription.plan_name == PlanName.STARTER
        assert subscription.status == SubscriptionStatus.TRIALING
        assert subscription.price == Decimal("999.00")
        assert subscription.trial_end_date is not None

    def test_get_subscription(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        created = subscription_service.create_subscription(subscription_data)
        retrieved = subscription_service.get_subscription(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.plan_name == PlanName.GROWTH

    def test_list_subscriptions(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            billing_cycle=BillingCycle.YEARLY,
            auto_renew=True,
        )

        subscription_service.create_subscription(subscription_data)

        subscriptions, total = subscription_service.list_subscriptions(
            institution_id=institution.id
        )

        assert total >= 1
        assert len(subscriptions) >= 1
        assert subscriptions[0].institution_id == institution.id

    def test_update_subscription(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data)

        update_data = SubscriptionUpdate(
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.QUARTERLY,
        )

        updated = subscription_service.update_subscription(subscription.id, update_data)

        assert updated.plan_name == PlanName.GROWTH
        assert updated.billing_cycle == BillingCycle.QUARTERLY
        assert updated.price == Decimal("8099.00")

    def test_cancel_subscription(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data, trial_days=0)
        subscription.status = SubscriptionStatus.ACTIVE
        subscription_service.db.commit()

        canceled = subscription_service.cancel_subscription(subscription.id, immediate=False)

        assert canceled.canceled_at is not None
        assert canceled.auto_renew is False
        assert canceled.end_date is not None

    def test_generate_invoice(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.PROFESSIONAL,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data, trial_days=0)

        invoice = subscription_service.generate_invoice(subscription.id)

        assert invoice.id is not None
        assert invoice.subscription_id == subscription.id
        assert invoice.amount == subscription.price
        assert invoice.tax_amount == subscription.price * Decimal("0.18")
        assert invoice.total_amount == invoice.amount + invoice.tax_amount

    def test_record_usage(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.GROWTH,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data)

        now = datetime.utcnow()
        period_start = now.replace(day=1)
        period_end = now

        usage_record = subscription_service.record_usage(
            subscription.id,
            "api_calls",
            Decimal("10000"),
            period_start,
            period_end,
        )

        assert usage_record.id is not None
        assert usage_record.subscription_id == subscription.id
        assert usage_record.metric_name == "api_calls"
        assert usage_record.metric_value == Decimal("10000")

    def test_create_payment(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data)

        payment = subscription_service.create_payment(
            subscription.id,
            subscription.price,
            "razorpay",
        )

        assert payment.id is not None
        assert payment.subscription_id == subscription.id
        assert payment.amount == subscription.price
        assert payment.status == "pending"

    def test_upgrade_subscription(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data, trial_days=0)
        subscription.status = SubscriptionStatus.ACTIVE
        subscription_service.db.commit()

        result = subscription_service.upgrade_subscription(subscription.id, PlanName.GROWTH)

        upgraded = result["subscription"]
        assert upgraded.plan_name == PlanName.GROWTH
        assert upgraded.price == Decimal("2999.00")
        assert "prorated_amount" in result

    def test_calculate_prorated_amount(
        self, subscription_service: SubscriptionService, institution: Institution
    ) -> None:
        subscription_data = SubscriptionCreate(
            institution_id=institution.id,
            plan_name=PlanName.STARTER,
            billing_cycle=BillingCycle.MONTHLY,
            auto_renew=True,
        )

        subscription = subscription_service.create_subscription(subscription_data, trial_days=0)
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.start_date = datetime.utcnow()
        subscription.next_billing_date = datetime.utcnow() + timedelta(days=15)
        subscription_service.db.commit()

        old_price = Decimal("999.00")
        new_price = Decimal("2999.00")

        prorated = subscription_service._calculate_prorated_amount(
            subscription, old_price, new_price
        )

        assert prorated >= Decimal("0.00")
        assert prorated <= new_price
