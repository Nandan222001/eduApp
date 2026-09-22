import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.subscription import Subscription
from src.schemas.subscription import SubscriptionStatus


@pytest.mark.integration
class TestSubscriptionAPI:
    """Integration tests for subscription and payment API.

    Subscriptions use a denormalized `plan_name` string (see
    src/models/subscription.py) rather than a separate SubscriptionPlan
    table -- the catalog of available plans is an in-code registry
    (SubscriptionPlans in src/services/subscription_service.py), not a DB
    model. This file previously referenced a SubscriptionPlan model/plan_id
    FK that never existed in the app.
    """

    def _make_subscription(self, db_session: Session, institution) -> Subscription:
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.ACTIVE.value,
            billing_cycle="monthly",
            price=2699.00,
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        return subscription

    def test_get_subscription_plans(self, client: TestClient):
        """Test getting the in-code catalog of subscription plans."""
        response = client.get("/api/v1/subscriptions/plans")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "name" in data[0]
        assert "monthly_price" in data[0]

    def test_create_subscription(
        self,
        client: TestClient,
        institution,
    ):
        """Test creating a subscription."""
        response = client.post(
            "/api/v1/subscriptions/",
            json={
                "institution_id": institution.id,
                "plan_name": "Growth",
                "billing_cycle": "monthly",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["plan_name"] == "Growth"

    def test_get_institution_subscription(
        self,
        client: TestClient,
        db_session: Session,
        institution,
    ):
        """Test getting institution's current subscription."""
        self._make_subscription(db_session, institution)

        response = client.get(f"/api/v1/subscriptions/institution/{institution.id}")

        assert response.status_code == 200
        assert response.json()["institution_id"] == institution.id

    def test_update_subscription(
        self,
        client: TestClient,
        db_session: Session,
        institution,
    ):
        """Test updating a subscription."""
        subscription = self._make_subscription(db_session, institution)

        response = client.patch(
            f"/api/v1/subscriptions/{subscription.id}",
            json={
                "auto_renew": False,
            },
        )

        assert response.status_code == 200
        assert response.json()["auto_renew"] is False

    def test_cancel_subscription(
        self,
        client: TestClient,
        db_session: Session,
        institution,
    ):
        """Test canceling a subscription."""
        subscription = self._make_subscription(db_session, institution)

        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/cancel",
            json={"immediate": True, "reason": "Testing cancellation"},
        )

        assert response.status_code == 200
        assert response.json()["status"] == SubscriptionStatus.CANCELED.value
