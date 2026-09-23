import json
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

import src.config as config_module
from src.models.institution import Institution
from src.models.subscription import Subscription, Payment, Invoice
from src.schemas.subscription import SubscriptionStatus, PaymentStatus, InvoiceStatus


def _institution(db_session: Session) -> Institution:
    suffix = uuid.uuid4().hex[:10]
    institution = Institution(
        name=f"Webhook School {suffix}",
        slug=f"webhook-school-{suffix}",
        phone="+1234567890",
        address="123 Webhook St",
        is_active=True,
    )
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


@pytest.mark.integration
class TestWebhooksAPI:
    """Integration tests for /api/v1/webhooks/razorpay.

    This router (src/api/v1/webhooks.py) is a public, unauthenticated
    endpoint by design -- Razorpay itself calls it -- gated instead by an
    HMAC signature check against `settings.razorpay_webhook_secret`. In
    this test environment that secret defaults to "" (falsy), so the
    signature check is skipped entirely unless a test explicitly sets one;
    a subset of tests below set a real secret via monkeypatch to exercise
    that gate directly instead of relying on the
    `verify_razorpay_webhook_signature`-patching pattern already used by
    tests/integration/test_subscriptions_api.py.

    No bugs were found in this router itself while building this coverage
    (the `service.list_invoices(...)` tuple-unpacking in
    handle_payment_captured, `invoices[0][0]`, is correct -- list_invoices
    returns `(items, total)`)."""

    def _webhook_secret_enabled(self, monkeypatch):
        monkeypatch.setattr(config_module.settings, "razorpay_webhook_secret", "whsec_test_123")

    # ---- signature verification ----

    def test_missing_signature_rejected_when_secret_configured(
        self, client: TestClient, monkeypatch
    ):
        self._webhook_secret_enabled(monkeypatch)
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={"event": "payment.captured", "payload": {}},
        )
        assert response.status_code == 401

    def test_invalid_signature_rejected_when_secret_configured(
        self, client: TestClient, monkeypatch
    ):
        self._webhook_secret_enabled(monkeypatch)
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={"event": "payment.captured", "payload": {}},
            headers={"X-Razorpay-Signature": "not-the-real-signature"},
        )
        assert response.status_code == 401

    def test_valid_signature_accepted_when_secret_configured(
        self, client: TestClient, monkeypatch
    ):
        self._webhook_secret_enabled(monkeypatch)
        import hmac
        import hashlib

        payload_bytes = json.dumps({"event": "unknown.event", "payload": {}}).encode()
        signature = hmac.new(
            b"whsec_test_123", payload_bytes, hashlib.sha256
        ).hexdigest()

        response = client.post(
            "/api/v1/webhooks/razorpay",
            data=payload_bytes,
            headers={
                "X-Razorpay-Signature": signature,
                "Content-Type": "application/json",
            },
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ignored", "event": "unknown.event"}

    def test_no_secret_configured_skips_signature_check(self, client: TestClient):
        # Default test-env settings.razorpay_webhook_secret == "" -> no
        # signature required at all.
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={"event": "unknown.event", "payload": {}},
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ignored", "event": "unknown.event"}

    def test_invalid_json_payload_returns_400(self, client: TestClient):
        response = client.post(
            "/api/v1/webhooks/razorpay",
            data=b"not-json{{{",
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "irrelevant",
            },
        )
        assert response.status_code == 400

    def test_unknown_event_type_is_ignored(self, client: TestClient):
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={"event": "some.unhandled.event", "payload": {}},
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ignored", "event": "some.unhandled.event"}

    # ---- payment.captured ----

    def test_payment_captured_updates_payment_and_marks_invoice_paid(
        self, client: TestClient, db_session: Session
    ):
        institution = _institution(db_session)
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

        invoice = Invoice(
            subscription_id=subscription.id,
            institution_id=institution.id,
            invoice_number=f"INV-{uuid.uuid4().hex[:10]}",
            status=InvoiceStatus.OPEN,
            amount=Decimal("2999.00"),
            tax_amount=Decimal("0.00"),
            total_amount=Decimal("2999.00"),
            currency="INR",
            billing_period_start=datetime.utcnow(),
            billing_period_end=datetime.utcnow() + timedelta(days=30),
            due_date=datetime.utcnow() + timedelta(days=7),
        )
        payment = Payment(
            subscription_id=subscription.id,
            institution_id=institution.id,
            amount=Decimal("2999.00"),
            currency="INR",
            status=PaymentStatus.PENDING,
            razorpay_order_id="order_wh_test1",
        )
        db_session.add_all([invoice, payment])
        db_session.commit()

        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "payment.captured",
                "payload": {
                    "payment": {
                        "entity": {
                            "id": "pay_wh_test1",
                            "order_id": "order_wh_test1",
                            "amount": 299900,
                        }
                    }
                },
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        db_session.refresh(payment)
        db_session.refresh(invoice)
        assert payment.status == PaymentStatus.CAPTURED
        assert payment.razorpay_payment_id == "pay_wh_test1"
        assert payment.paid_at is not None
        assert invoice.status == InvoiceStatus.PAID

    def test_payment_captured_no_matching_payment(self, client: TestClient):
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "payment.captured",
                "payload": {
                    "payment": {
                        "entity": {"id": "pay_none", "order_id": "order_does_not_exist"}
                    }
                },
            },
        )
        assert response.status_code == 200
        assert response.json() == {"status": "no_matching_payment"}

    # ---- payment.failed ----

    def test_payment_failed_sets_failure_reason_and_grace_period(
        self, client: TestClient, db_session: Session
    ):
        institution = _institution(db_session)
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
            razorpay_order_id="order_wh_fail1",
        )
        db_session.add(payment)
        db_session.commit()

        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "payment.failed",
                "payload": {
                    "payment": {
                        "entity": {
                            "id": "pay_wh_fail1",
                            "order_id": "order_wh_fail1",
                            "error_reason": "card_declined",
                        }
                    }
                },
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        db_session.refresh(payment)
        db_session.refresh(subscription)
        assert payment.status == PaymentStatus.FAILED
        assert payment.failure_reason == "card_declined"
        assert subscription.status == SubscriptionStatus.PAST_DUE
        assert subscription.grace_period_end is not None

    def test_payment_failed_no_matching_payment(self, client: TestClient):
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "payment.failed",
                "payload": {
                    "payment": {"entity": {"id": "pay_none", "order_id": "no_such_order"}}
                },
            },
        )
        assert response.status_code == 200
        assert response.json() == {"status": "no_matching_payment"}

    # ---- subscription.charged ----

    def test_subscription_charged_renews_subscription(
        self, client: TestClient, db_session: Session
    ):
        institution = _institution(db_session)
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Professional",
            status=SubscriptionStatus.PAST_DUE,
            billing_cycle="monthly",
            price=Decimal("7999.00"),
            currency="INR",
            razorpay_subscription_id="sub_wh_charge1",
            start_date=datetime.utcnow() - timedelta(days=30),
            grace_period_end=datetime.utcnow() + timedelta(days=2),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "subscription.charged",
                "payload": {"subscription": {"entity": {"id": "sub_wh_charge1"}}},
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        db_session.refresh(subscription)
        assert subscription.status == SubscriptionStatus.ACTIVE
        assert subscription.grace_period_end is None

    def test_subscription_charged_no_matching_subscription(self, client: TestClient):
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "subscription.charged",
                "payload": {"subscription": {"entity": {"id": "sub_does_not_exist"}}},
            },
        )
        assert response.status_code == 200
        assert response.json() == {"status": "no_matching_subscription"}

    # ---- subscription.cancelled ----

    def test_subscription_cancelled_cancels_subscription(
        self, client: TestClient, db_session: Session
    ):
        institution = _institution(db_session)
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Growth",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            razorpay_subscription_id="sub_wh_cancel1",
            start_date=datetime.utcnow() - timedelta(days=10),
            next_billing_date=datetime.utcnow() + timedelta(days=20),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "subscription.cancelled",
                "payload": {"subscription": {"entity": {"id": "sub_wh_cancel1"}}},
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        db_session.refresh(subscription)
        assert subscription.canceled_at is not None
        assert subscription.auto_renew is False

    # ---- subscription.paused / subscription.resumed ----

    def test_subscription_paused_then_resumed(
        self, client: TestClient, db_session: Session
    ):
        institution = _institution(db_session)
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Starter",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            razorpay_subscription_id="sub_wh_pause1",
            start_date=datetime.utcnow() - timedelta(days=5),
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "subscription.paused",
                "payload": {"subscription": {"entity": {"id": "sub_wh_pause1"}}},
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        db_session.refresh(subscription)
        assert subscription.status == SubscriptionStatus.PAUSED

        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "subscription.resumed",
                "payload": {"subscription": {"entity": {"id": "sub_wh_pause1"}}},
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        db_session.refresh(subscription)
        assert subscription.status == SubscriptionStatus.ACTIVE

    def test_subscription_paused_no_matching_subscription(self, client: TestClient):
        response = client.post(
            "/api/v1/webhooks/razorpay",
            json={
                "event": "subscription.paused",
                "payload": {"subscription": {"entity": {"id": "sub_does_not_exist"}}},
            },
        )
        assert response.status_code == 200
        assert response.json() == {"status": "no_matching_subscription"}
