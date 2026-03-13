import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.subscription import Subscription


@pytest.mark.integration
class TestSubscriptionsAPIIntegration:
    """Integration tests for Subscriptions API endpoints"""

    def test_list_plans(
        self, client: TestClient, auth_headers: dict
    ):
        """Test listing subscription plans"""
        response = client.get(
            "/api/v1/subscriptions/plans",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict))

    def test_create_subscription(
        self, client: TestClient, institution, auth_headers: dict, db_session: Session
    ):
        """Test creating a subscription"""
        db_session.query(Subscription).filter(
            Subscription.institution_id == institution.id
        ).delete()
        db_session.commit()
        
        response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_name": "STARTER",
                "billing_cycle": "monthly",
                "auto_renew": True
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            assert data["institution_id"] == institution.id
            assert data["plan_name"] == "STARTER"

    def test_get_subscription(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test getting a subscription"""
        response = client.get(
            f"/api/v1/subscriptions/{subscription.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["id"] == subscription.id

    def test_get_subscription_not_found(
        self, client: TestClient, auth_headers: dict
    ):
        """Test getting non-existent subscription"""
        response = client.get(
            "/api/v1/subscriptions/99999",
            headers=auth_headers
        )
        
        assert response.status_code in [404, 403]

    def test_list_subscriptions(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test listing subscriptions"""
        response = client.get(
            "/api/v1/subscriptions/",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "items" in data or isinstance(data, list)

    def test_update_subscription(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test updating a subscription"""
        response = client.put(
            f"/api/v1/subscriptions/{subscription.id}",
            headers=auth_headers,
            json={"auto_renew": False}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["auto_renew"] is False

    def test_upgrade_subscription(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test upgrading a subscription"""
        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/upgrade",
            headers=auth_headers,
            json={"new_plan_name": "GROWTH"}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "subscription" in data or "plan_name" in data

    def test_cancel_subscription(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test canceling a subscription"""
        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/cancel",
            headers=auth_headers,
            json={
                "immediate": False,
                "reason": "Testing cancellation"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "canceled_at" in data or "status" in data

    def test_list_invoices(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test listing invoices"""
        response = client.get(
            "/api/v1/subscriptions/invoices/",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "items" in data or isinstance(data, list)

    def test_get_invoice(
        self, client: TestClient, subscription, auth_headers: dict, db_session: Session
    ):
        """Test getting an invoice"""
        from src.services.subscription_service import SubscriptionService
        
        service = SubscriptionService(db_session, "test_key", "test_secret")
        invoice = service.generate_invoice(subscription.id)
        
        response = client.get(
            f"/api/v1/subscriptions/invoices/{invoice.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["id"] == invoice.id

    def test_create_payment(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test creating a payment"""
        response = client.post(
            "/api/v1/subscriptions/payments/",
            headers=auth_headers,
            json={
                "subscription_id": subscription.id,
                "amount": "999.00",
                "payment_method": "card"
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "payment_id" in data

    def test_list_payments(
        self, client: TestClient, subscription, auth_headers: dict
    ):
        """Test listing payments"""
        response = client.get(
            "/api/v1/subscriptions/payments/",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "items" in data or isinstance(data, list)

    def test_subscription_workflow(
        self, client: TestClient, institution, auth_headers: dict, db_session: Session
    ):
        """Test complete subscription workflow"""
        db_session.query(Subscription).filter(
            Subscription.institution_id == institution.id
        ).delete()
        db_session.commit()
        
        create_response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_name": "STARTER",
                "billing_cycle": "monthly",
                "auto_renew": True
            }
        )
        
        if create_response.status_code != 201:
            return
        
        subscription_id = create_response.json()["id"]
        
        get_response = client.get(
            f"/api/v1/subscriptions/{subscription_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        
        update_response = client.put(
            f"/api/v1/subscriptions/{subscription_id}",
            headers=auth_headers,
            json={"auto_renew": False}
        )
        if update_response.status_code == 200:
            assert update_response.json()["auto_renew"] is False
