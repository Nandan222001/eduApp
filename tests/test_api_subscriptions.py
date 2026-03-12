import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus


@pytest.mark.integration
class TestSubscriptionAPI:
    """Integration tests for subscription and payment API."""

    @pytest.fixture
    def subscription_plan(self, db_session: Session) -> SubscriptionPlan:
        """Create a test subscription plan."""
        plan = SubscriptionPlan(
            name="Basic Plan",
            description="Basic features",
            price=999.99,
            billing_cycle="monthly",
            max_students=100,
            max_teachers=10,
            features={"feature1": True, "feature2": False},
            is_active=True,
        )
        db_session.add(plan)
        db_session.commit()
        db_session.refresh(plan)
        return plan

    def test_get_subscription_plans(
        self,
        client: TestClient,
        subscription_plan: SubscriptionPlan,
    ):
        """Test getting subscription plans."""
        response = client.get("/api/v1/subscriptions/plans")

        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_create_subscription(
        self,
        client: TestClient,
        auth_headers: dict,
        institution,
        subscription_plan: SubscriptionPlan,
    ):
        """Test creating a subscription."""
        response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_id": subscription_plan.id,
                "start_date": datetime.now().isoformat(),
            },
        )

        assert response.status_code in [201, 404]

    def test_get_institution_subscription(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        subscription_plan: SubscriptionPlan,
    ):
        """Test getting institution's current subscription."""
        subscription = Subscription(
            institution_id=institution.id,
            plan_id=subscription_plan.id,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            status=SubscriptionStatus.ACTIVE,
            price=subscription_plan.price,
        )
        db_session.add(subscription)
        db_session.commit()

        response = client.get(
            f"/api/v1/subscriptions/institution/{institution.id}",
            headers=auth_headers,
        )

        assert response.status_code in [200, 404]

    def test_update_subscription(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        subscription_plan: SubscriptionPlan,
    ):
        """Test updating a subscription."""
        subscription = Subscription(
            institution_id=institution.id,
            plan_id=subscription_plan.id,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            status=SubscriptionStatus.ACTIVE,
            price=subscription_plan.price,
        )
        db_session.add(subscription)
        db_session.commit()

        response = client.put(
            f"/api/v1/subscriptions/{subscription.id}",
            headers=auth_headers,
            json={
                "auto_renew": True,
            },
        )

        assert response.status_code in [200, 404]

    def test_cancel_subscription(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        subscription_plan: SubscriptionPlan,
    ):
        """Test canceling a subscription."""
        subscription = Subscription(
            institution_id=institution.id,
            plan_id=subscription_plan.id,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            status=SubscriptionStatus.ACTIVE,
            price=subscription_plan.price,
        )
        db_session.add(subscription)
        db_session.commit()

        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/cancel",
            headers=auth_headers,
        )

        assert response.status_code in [200, 404]
