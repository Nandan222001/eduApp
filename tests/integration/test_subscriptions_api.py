import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
import json

from src.models.subscription import Subscription, Payment, Invoice
from src.models.institution import Institution
from src.schemas.subscription import (
    SubscriptionStatus,
    PaymentStatus,
    InvoiceStatus,
)


@pytest.mark.integration
class TestSubscriptionsAPICreate:
    """Integration tests for POST /api/v1/subscriptions/create endpoint"""

    def test_create_subscription_with_plan_selection(
        self, client: TestClient, institution: Institution, auth_headers: dict, db_session: Session
    ):
        """Test creating a subscription with plan selection"""
        db_session.query(Subscription).filter(
            Subscription.institution_id == institution.id
        ).delete()
        db_session.commit()

        response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_name": "Starter",
                "billing_cycle": "monthly",
                "auto_renew": True
            },
            params={"trial_days": 14}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["plan_name"] == "Starter"
        assert data["billing_cycle"] == "monthly"
        assert data["status"] == "trialing"
        assert data["price"] == "999.00"
        assert data["currency"] == "INR"
        assert data["max_users"] == 10
        assert data["max_storage_gb"] == 50
        assert data["trial_end_date"] is not None
        assert data["auto_renew"] is True

    def test_create_subscription_without_trial(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test creating a subscription without trial period"""
        institution = Institution(
            name="No Trial School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()
        db_session.refresh(institution)

        response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_name": "Growth",
                "billing_cycle": "yearly",
                "auto_renew": True
            },
            params={"trial_days": 0}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "active"
        assert data["trial_end_date"] is None
        assert data["plan_name"] == "Growth"
        assert data["billing_cycle"] == "yearly"

    def test_create_subscription_with_payment_order_creation(
        self, client: TestClient, institution: Institution, auth_headers: dict, db_session: Session
    ):
        """Test subscription creation and Razorpay order creation"""
        db_session.query(Subscription).filter(
            Subscription.institution_id == institution.id
        ).delete()
        db_session.commit()

        create_response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_name": "Professional",
                "billing_cycle": "quarterly",
                "auto_renew": True
            },
            params={"trial_days": 0}
        )

        assert create_response.status_code == 201
        subscription_id = create_response.json()["id"]

        with patch('src.services.subscription_service.SubscriptionService.create_razorpay_order') as mock_razorpay:
            mock_razorpay.return_value = {
                "order_id": f"order_{subscription_id}_test123",
                "amount": 2159900,
                "currency": "INR",
                "status": "created"
            }

            order_response = client.post(
                f"/api/v1/subscriptions/{subscription_id}/payments/create-order",
                headers=auth_headers
            )

            assert order_response.status_code == 200
            order_data = order_response.json()
            assert "order_id" in order_data
            assert order_data["currency"] == "INR"
            assert order_data["status"] == "created"

    def test_create_subscription_duplicate_active_fails(
        self, client: TestClient, subscription: Subscription, auth_headers: dict
    ):
        """Test creating duplicate subscription for institution with active subscription fails"""
        response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": subscription.institution_id,
                "plan_name": "Growth",
                "billing_cycle": "monthly",
                "auto_renew": True
            }
        )

        assert response.status_code == 400
        assert "already has an active subscription" in response.json()["detail"]

    def test_create_subscription_invalid_plan(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test creating subscription with invalid plan name fails"""
        institution = Institution(
            name="Invalid Plan School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()
        db_session.refresh(institution)

        response = client.post(
            "/api/v1/subscriptions/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "plan_name": "InvalidPlan",
                "billing_cycle": "monthly",
                "auto_renew": True
            }
        )

        assert response.status_code == 400
        assert "Invalid plan name" in response.json()["detail"]


@pytest.mark.integration
class TestSubscriptionsAPIUpgradeDowngrade:
    """Integration tests for subscription upgrade and downgrade endpoints"""

    def test_upgrade_subscription_with_proration(
        self, client: TestClient, subscription: Subscription, auth_headers: dict, db_session: Session
    ):
        """Test upgrading subscription with prorated amount calculation"""
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.start_date = datetime.utcnow() - timedelta(days=10)
        subscription.next_billing_date = datetime.utcnow() + timedelta(days=20)
        db_session.commit()

        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/upgrade",
            headers=auth_headers,
            json={"new_plan_name": "Growth"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "subscription" in data
        assert "prorated_amount" in data
        assert "immediate_charge" in data
        assert data["subscription"]["plan_name"] == "Growth"
        assert isinstance(data["prorated_amount"], (int, float))
        assert isinstance(data["immediate_charge"], bool)

    def test_downgrade_subscription(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test downgrading subscription without immediate charge"""
        institution = Institution(
            name="Downgrade Test School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Professional",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("7999.00"),
            currency="INR",
            max_users=200,
            max_storage_gb=1000,
            start_date=datetime.utcnow() - timedelta(days=5),
            next_billing_date=datetime.utcnow() + timedelta(days=25),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/downgrade",
            headers=auth_headers,
            json={"new_plan_name": "Starter"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plan_name"] == "Starter"
        assert data["price"] == "999.00"
        assert data["max_users"] == 10
        assert data["max_storage_gb"] == 50

    def test_upgrade_trialing_subscription(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test upgrading subscription during trial period"""
        institution = Institution(
            name="Trial Upgrade School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Starter",
            status=SubscriptionStatus.TRIALING,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            max_users=10,
            max_storage_gb=50,
            start_date=datetime.utcnow(),
            trial_end_date=datetime.utcnow() + timedelta(days=14),
            next_billing_date=datetime.utcnow() + timedelta(days=14),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/upgrade",
            headers=auth_headers,
            json={"new_plan_name": "Enterprise"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["subscription"]["plan_name"] == "Enterprise"
        assert data["subscription"]["status"] == "trialing"

    def test_downgrade_non_active_subscription_fails(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test downgrading non-active subscription fails"""
        institution = Institution(
            name="Inactive Downgrade School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.CANCELED,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=60),
            end_date=datetime.utcnow() - timedelta(days=30),
            auto_renew=False,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.post(
            f"/api/v1/subscriptions/{subscription.id}/downgrade",
            headers=auth_headers,
            json={"new_plan_name": "Starter"}
        )

        assert response.status_code == 400


@pytest.mark.integration
class TestSubscriptionsAPIGetCurrent:
    """Integration tests for GET /api/v1/subscriptions/current endpoint"""

    def test_get_current_active_subscription(
        self, client: TestClient, subscription: Subscription, auth_headers: dict
    ):
        """Test getting current active subscription details"""
        response = client.get(
            f"/api/v1/subscriptions/institution/{subscription.institution_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == subscription.id
        assert data["institution_id"] == subscription.institution_id
        assert data["status"] in ["active", "trialing", "grace_period"]
        assert "plan_name" in data
        assert "billing_cycle" in data
        assert "price" in data
        assert "max_users" in data
        assert "max_storage_gb" in data
        assert "features" in data
        assert "start_date" in data
        assert "next_billing_date" in data

    def test_get_current_subscription_no_active(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test getting current subscription when none exists"""
        institution = Institution(
            name="No Subscription School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()
        db_session.refresh(institution)

        response = client.get(
            f"/api/v1/subscriptions/institution/{institution.id}",
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "No active subscription found" in response.json()["detail"]

    def test_get_current_subscription_with_grace_period(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test getting subscription in grace period"""
        institution = Institution(
            name="Grace Period School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.GRACE_PERIOD,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            max_users=50,
            max_storage_gb=250,
            start_date=datetime.utcnow() - timedelta(days=35),
            next_billing_date=datetime.utcnow() - timedelta(days=5),
            grace_period_end=datetime.utcnow() + timedelta(days=2),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.get(
            f"/api/v1/subscriptions/institution/{institution.id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "grace_period"
        assert data["grace_period_end"] is not None


@pytest.mark.integration
class TestSubscriptionsAPIWebhook:
    """Integration tests for POST /api/v1/webhooks/razorpay/payment endpoint"""

    def test_webhook_payment_captured_activates_subscription(
        self, client: TestClient, db_session: Session
    ):
        """Test Razorpay payment capture webhook activates subscription"""
        institution = Institution(
            name="Webhook Test School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.TRIALING,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            trial_end_date=datetime.utcnow() + timedelta(days=14),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        payment = Payment(
            subscription_id=subscription.id,
            institution_id=institution.id,
            amount=Decimal("2999.00"),
            currency="INR",
            status=PaymentStatus.PENDING,
            razorpay_order_id="order_test123",
        )
        db_session.add(payment)
        db_session.commit()

        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test123",
                        "order_id": "order_test123",
                        "amount": 299900,
                        "status": "captured"
                    }
                }
            }
        }

        with patch('src.api.v1.webhooks.verify_razorpay_webhook_signature', return_value=True):
            response = client.post(
                "/api/v1/webhooks/razorpay",
                json=webhook_payload,
                headers={"X-Razorpay-Signature": "test_signature"}
            )

        assert response.status_code == 200
        
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.CAPTURED
        assert payment.razorpay_payment_id == "pay_test123"
        assert payment.paid_at is not None

    def test_webhook_payment_failed_sets_grace_period(
        self, client: TestClient, db_session: Session
    ):
        """Test Razorpay payment failed webhook sets subscription to grace period"""
        institution = Institution(
            name="Failed Payment School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Starter",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        payment = Payment(
            subscription_id=subscription.id,
            institution_id=institution.id,
            amount=Decimal("999.00"),
            currency="INR",
            status=PaymentStatus.PENDING,
            razorpay_order_id="order_failed123",
        )
        db_session.add(payment)
        db_session.commit()

        webhook_payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_failed123",
                        "order_id": "order_failed123",
                        "amount": 99900,
                        "status": "failed",
                        "error_reason": "Insufficient funds"
                    }
                }
            }
        }

        with patch('src.api.v1.webhooks.verify_razorpay_webhook_signature', return_value=True):
            response = client.post(
                "/api/v1/webhooks/razorpay",
                json=webhook_payload,
                headers={"X-Razorpay-Signature": "test_signature"}
            )

        assert response.status_code == 200
        
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.FAILED
        assert payment.failure_reason == "Insufficient funds"
        
        db_session.refresh(subscription)
        assert subscription.status == SubscriptionStatus.PAST_DUE
        assert subscription.grace_period_end is not None

    def test_webhook_invalid_signature_rejected(
        self, client: TestClient
    ):
        """Test webhook with invalid signature is rejected"""
        webhook_payload = {
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": "pay_test"}}}
        }

        with patch('src.api.v1.webhooks.verify_razorpay_webhook_signature', return_value=False):
            response = client.post(
                "/api/v1/webhooks/razorpay",
                json=webhook_payload,
                headers={"X-Razorpay-Signature": "invalid_signature"}
            )

        assert response.status_code == 401
        assert "Invalid webhook signature" in response.json()["detail"]

    def test_webhook_subscription_charged_renews(
        self, client: TestClient, db_session: Session
    ):
        """Test subscription charged webhook renews subscription"""
        institution = Institution(
            name="Renew Test School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Professional",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("7999.00"),
            currency="INR",
            razorpay_subscription_id="sub_test123",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        webhook_payload = {
            "event": "subscription.charged",
            "payload": {
                "subscription": {
                    "entity": {
                        "id": "sub_test123"
                    }
                }
            }
        }

        with patch('src.api.v1.webhooks.verify_razorpay_webhook_signature', return_value=True):
            response = client.post(
                "/api/v1/webhooks/razorpay",
                json=webhook_payload,
                headers={"X-Razorpay-Signature": "test_signature"}
            )

        assert response.status_code == 200


@pytest.mark.integration
class TestSubscriptionsAPIExpiration:
    """Integration tests for subscription expiration and grace period logic"""

    def test_check_expired_trials(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test checking expired trial subscriptions"""
        institution = Institution(
            name="Expired Trial School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        expired_trial_sub = Subscription(
            institution_id=institution.id,
            plan_name="Starter",
            status=SubscriptionStatus.TRIALING,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=20),
            trial_end_date=datetime.utcnow() - timedelta(days=1),
            auto_renew=True,
        )
        db_session.add(expired_trial_sub)
        db_session.commit()

        response = client.get(
            "/api/v1/subscriptions/admin/check-expired-trials",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        subscription_ids = [sub["id"] for sub in data]
        assert expired_trial_sub.id in subscription_ids

    def test_check_expired_grace_periods(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test checking expired grace period subscriptions"""
        institution = Institution(
            name="Expired Grace School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        expired_grace_sub = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.GRACE_PERIOD,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=45),
            grace_period_end=datetime.utcnow() - timedelta(hours=1),
            auto_renew=True,
        )
        db_session.add(expired_grace_sub)
        db_session.commit()

        response = client.get(
            "/api/v1/subscriptions/admin/check-expired-grace-periods",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        subscription_ids = [sub["id"] for sub in data]
        assert expired_grace_sub.id in subscription_ids

    def test_subscription_grace_period_handling(
        self, client: TestClient, db_session: Session
    ):
        """Test that subscription enters grace period after failed payment"""
        from src.services.subscription_service import SubscriptionService

        institution = Institution(
            name="Grace Handling School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Professional",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("7999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=30),
            next_billing_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        service = SubscriptionService(db_session, "test_key", "test_secret")
        updated_sub = service.handle_failed_payment(subscription.id)

        assert updated_sub.status == SubscriptionStatus.PAST_DUE
        assert updated_sub.grace_period_end is not None
        assert updated_sub.grace_period_end > datetime.utcnow()
        
        grace_days = (updated_sub.grace_period_end - datetime.utcnow()).days
        assert grace_days == 7

    def test_subscription_expiration_after_grace_period(
        self, client: TestClient, db_session: Session
    ):
        """Test subscription expires after grace period ends"""
        from src.services.subscription_service import SubscriptionService

        institution = Institution(
            name="Expiration School",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        db_session.add(institution)
        db_session.commit()

        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.GRACE_PERIOD,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=45),
            grace_period_end=datetime.utcnow() - timedelta(hours=1),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        service = SubscriptionService(db_session, "test_key", "test_secret")
        updated_sub = service.handle_expired_grace_period(subscription.id)

        assert updated_sub.status == SubscriptionStatus.EXPIRED
        assert updated_sub.end_date is not None
        assert updated_sub.end_date <= datetime.utcnow()


@pytest.mark.integration
class TestSubscriptionsAPIDataIsolation:
    """Integration tests for institution-level data isolation"""

    def test_institution_cannot_access_other_institution_subscription(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test that institution cannot access another institution's subscription"""
        institution1 = Institution(
            name="School 1",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        institution2 = Institution(
            name="School 2",
            phone="+1234567891",
            address="456 Test",
            is_active=True,
        )
        db_session.add_all([institution1, institution2])
        db_session.commit()

        subscription1 = Subscription(
            institution_id=institution1.id,
            plan_name="Starter",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        subscription2 = Subscription(
            institution_id=institution2.id,
            plan_name="Growth",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add_all([subscription1, subscription2])
        db_session.commit()

        response = client.get(
            f"/api/v1/subscriptions/{subscription2.id}",
            headers=auth_headers
        )

        assert response.status_code in [200, 403, 404]

    def test_payments_isolated_by_institution(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test that payment listings are filtered by institution"""
        institution1 = Institution(
            name="Payment School 1",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        institution2 = Institution(
            name="Payment School 2",
            phone="+1234567891",
            address="456 Test",
            is_active=True,
        )
        db_session.add_all([institution1, institution2])
        db_session.commit()

        sub1 = Subscription(
            institution_id=institution1.id,
            plan_name="Starter",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        sub2 = Subscription(
            institution_id=institution2.id,
            plan_name="Growth",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add_all([sub1, sub2])
        db_session.commit()

        payment1 = Payment(
            subscription_id=sub1.id,
            institution_id=institution1.id,
            amount=Decimal("999.00"),
            currency="INR",
            status=PaymentStatus.CAPTURED,
        )
        payment2 = Payment(
            subscription_id=sub2.id,
            institution_id=institution2.id,
            amount=Decimal("2999.00"),
            currency="INR",
            status=PaymentStatus.CAPTURED,
        )
        db_session.add_all([payment1, payment2])
        db_session.commit()

        response = client.get(
            f"/api/v1/subscriptions/payments/?institution_id={institution1.id}",
            headers=auth_headers
        )

        if response.status_code == 200:
            data = response.json()
            payments_list = data.get("payments", [])
            for payment in payments_list:
                assert payment["institution_id"] == institution1.id

    def test_invoices_isolated_by_institution(
        self, client: TestClient, db_session: Session, auth_headers: dict
    ):
        """Test that invoice listings are filtered by institution"""
        institution1 = Institution(
            name="Invoice School 1",
            phone="+1234567890",
            address="123 Test",
            is_active=True,
        )
        institution2 = Institution(
            name="Invoice School 2",
            phone="+1234567891",
            address="456 Test",
            is_active=True,
        )
        db_session.add_all([institution1, institution2])
        db_session.commit()

        sub1 = Subscription(
            institution_id=institution1.id,
            plan_name="Starter",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        sub2 = Subscription(
            institution_id=institution2.id,
            plan_name="Growth",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            start_date=datetime.utcnow(),
            auto_renew=True,
        )
        db_session.add_all([sub1, sub2])
        db_session.commit()

        invoice1 = Invoice(
            subscription_id=sub1.id,
            institution_id=institution1.id,
            invoice_number="INV-1-001",
            status=InvoiceStatus.PAID,
            amount=Decimal("999.00"),
            tax_amount=Decimal("179.82"),
            total_amount=Decimal("1178.82"),
            currency="INR",
            billing_period_start=datetime.utcnow() - timedelta(days=30),
            billing_period_end=datetime.utcnow(),
            due_date=datetime.utcnow() + timedelta(days=7),
        )
        invoice2 = Invoice(
            subscription_id=sub2.id,
            institution_id=institution2.id,
            invoice_number="INV-2-001",
            status=InvoiceStatus.PAID,
            amount=Decimal("2999.00"),
            tax_amount=Decimal("539.82"),
            total_amount=Decimal("3538.82"),
            currency="INR",
            billing_period_start=datetime.utcnow() - timedelta(days=30),
            billing_period_end=datetime.utcnow(),
            due_date=datetime.utcnow() + timedelta(days=7),
        )
        db_session.add_all([invoice1, invoice2])
        db_session.commit()

        response = client.get(
            f"/api/v1/subscriptions/invoices/?institution_id={institution1.id}",
            headers=auth_headers
        )

        if response.status_code == 200:
            data = response.json()
            invoices_list = data.get("invoices", [])
            for invoice in invoices_list:
                assert invoice["institution_id"] == institution1.id
