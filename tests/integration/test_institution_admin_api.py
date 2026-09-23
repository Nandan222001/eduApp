import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.role import Role
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.subscription import Subscription, Invoice, Payment
from src.models.user import User
from src.schemas.subscription import SubscriptionStatus, PaymentStatus, InvoiceStatus
from src.utils.security import get_password_hash


def _make_subscription(institution_id: int, status: str = SubscriptionStatus.ACTIVE) -> Subscription:
    return Subscription(
        institution_id=institution_id,
        plan_name="Growth",
        status=status,
        billing_cycle="monthly",
        price=Decimal("2999.00"),
        currency="INR",
        max_users=50,
        max_storage_gb=250,
        start_date=datetime.utcnow() - timedelta(days=10),
        next_billing_date=datetime.utcnow() + timedelta(days=20),
        auto_renew=True,
    )


@pytest.fixture
def second_institution(db_session: Session) -> Institution:
    suffix = uuid.uuid4().hex[:12]
    institution = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1234567891",
        address="456 Other Street",
        is_active=True,
    )
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


@pytest.mark.integration
class TestInstitutionAdminAPI:
    """Integration tests for /api/v1/institution-admin/*.

    This router is the admin-facing billing dashboard for an institution's
    own subscription. Found and fixed real bugs while building this
    coverage (see src/api/v1/institution_admin.py for the inline notes):

    - The entire router had NO auth dependency at all, and hardcoded
      `institution_id = 1` -- `GET /institution-admin/subscription`
      returned institution #1's full billing dashboard (subscription,
      invoices, payment history) to any anonymous caller, and every
      mutating payment-method/add-on stub endpoint was equally open. Fixed
      by requiring a logged-in admin/institution_admin and scoping every
      query to `current_user.institution_id`.
    - `GET /subscription` computed `student_count`/`teacher_count` via
      `User.role == "student"`/`"teacher"` -- `User.role` is a
      relationship (to `Role`), not a plain string column, so this raised
      `sqlalchemy.exc.ArgumentError` on every single call that reached
      that point (any institution with an active/trialing subscription).
      This was the router's one real endpoint, and it was 100%
      non-functional whenever data existed to actually return. Fixed by
      counting through the dedicated `Student`/`Teacher` tables instead.
    - `POST /payment-methods` indexed the raw request dict directly
      (`data["card_number"]`, ...) -- a request missing any of those keys
      raised an unhandled `KeyError` (500) instead of a clean validation
      error. Fixed with an explicit required-field check returning 422.
    """

    # ---- GET /subscription ----

    def test_get_subscription_requires_auth(self, client: TestClient):
        # No Authorization header at all -> FastAPI's HTTPBearer(auto_error=True)
        # rejects with 403 before get_current_user even runs (401 is reserved
        # for a present-but-invalid/expired token in this codebase).
        response = client.get("/api/v1/institution-admin/subscription")
        assert response.status_code == 403

    def test_get_subscription_no_active_subscription_404(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-admin/subscription", headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_subscription_dashboard_happy_path(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        db_session: Session,
    ):
        subscription = _make_subscription(institution.id)
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        invoice = Invoice(
            subscription_id=subscription.id,
            institution_id=institution.id,
            invoice_number=f"INV-{uuid.uuid4().hex[:10]}",
            status=InvoiceStatus.PAID,
            amount=Decimal("2999.00"),
            tax_amount=Decimal("0.00"),
            total_amount=Decimal("2999.00"),
            currency="INR",
            billing_period_start=datetime.utcnow() - timedelta(days=30),
            billing_period_end=datetime.utcnow(),
            due_date=datetime.utcnow() - timedelta(days=25),
            paid_at=datetime.utcnow() - timedelta(days=28),
        )
        payment = Payment(
            subscription_id=subscription.id,
            institution_id=institution.id,
            amount=Decimal("2999.00"),
            currency="INR",
            status=PaymentStatus.CAPTURED,
            paid_at=datetime.utcnow() - timedelta(days=28),
        )
        db_session.add_all([invoice, payment])
        db_session.commit()

        student = Student(
            institution_id=institution.id,
            first_name="S",
            last_name="One",
            is_active=True,
        )
        teacher = Teacher(
            institution_id=institution.id,
            first_name="T",
            last_name="One",
            email=f"teacher-{uuid.uuid4().hex[:8]}@testschool.com",
            is_active=True,
        )
        inactive_student = Student(
            institution_id=institution.id,
            first_name="S",
            last_name="Inactive",
            is_active=False,
        )
        db_session.add_all([student, teacher, inactive_student])
        db_session.commit()

        response = client.get(
            "/api/v1/institution-admin/subscription", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()

        assert data["subscription"]["id"] == subscription.id
        assert data["subscription"]["institution_id"] == institution.id
        assert len(data["availablePlans"]) == 4
        assert {p["name"] for p in data["availablePlans"]} == {
            "Starter",
            "Growth",
            "Professional",
            "Enterprise",
        }
        assert len(data["invoices"]) == 1
        assert data["invoices"][0]["id"] == invoice.id

        # This is the endpoint that previously 500'd with ArgumentError
        # (User.role == "student") -- now counts via Student/Teacher.
        assert data["usage"]["students_used"] == 1
        assert data["usage"]["teachers_used"] == 1

        assert data["limits"]["max_users"] == subscription.max_users
        assert len(data["history"]) >= 2  # subscription-created entry + payment entry
        assert data["history"][0]["type"] == "created"
        assert data["history"][1]["type"] == "payment"
        assert "paymentMethods" in data
        assert "addOns" in data
        assert data["activeAddOns"] == []

    def test_get_subscription_scoped_to_own_institution(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        second_institution: Institution,
        db_session: Session,
    ):
        """A subscription belonging to a different institution must never
        be visible through this endpoint (regression test for the
        hardcoded institution_id=1 bug)."""
        other_subscription = _make_subscription(second_institution.id)
        db_session.add(other_subscription)
        db_session.commit()

        response = client.get(
            "/api/v1/institution-admin/subscription", headers=auth_headers
        )
        # The calling admin's own institution has no subscription of its
        # own, so this must 404 rather than leak the other institution's.
        assert response.status_code == 404

    def test_get_subscription_student_role_forbidden(
        self, client: TestClient, db_session: Session, institution: Institution, student_role: Role
    ):
        user = User(
            username="stu_billing",
            email="stu_billing@testschool.com",
            first_name="Stu",
            last_name="Dent",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        login = client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": "password123"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = client.get(
            "/api/v1/institution-admin/subscription", headers=headers
        )
        assert response.status_code == 403

    # ---- payment-methods / add-ons (stub endpoints) ----

    def test_add_payment_method_requires_auth(self, client: TestClient):
        response = client.post(
            "/api/v1/institution-admin/payment-methods",
            json={
                "card_number": "4111111111111111",
                "card_holder": "Jane Doe",
                "expiry_month": "01",
                "expiry_year": "2030",
            },
        )
        assert response.status_code == 403

    def test_add_payment_method_happy_path(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/institution-admin/payment-methods",
            headers=auth_headers,
            json={
                "card_number": "4111111111111111",
                "card_holder": "Jane Doe",
                "expiry_month": "01",
                "expiry_year": "2030",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["card_number"] == "4111111111111111"
        assert data["is_default"] is False

    def test_add_payment_method_missing_fields_returns_422(
        self, client: TestClient, auth_headers: dict
    ):
        # Previously raised an unhandled KeyError (500) on a missing key.
        response = client.post(
            "/api/v1/institution-admin/payment-methods",
            headers=auth_headers,
            json={"card_number": "4111111111111111"},
        )
        assert response.status_code == 422
        assert "card_holder" in response.json()["detail"]

    def test_delete_payment_method(self, client: TestClient, auth_headers: dict):
        response = client.delete(
            "/api/v1/institution-admin/payment-methods/1", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Payment method deleted"

    def test_delete_payment_method_requires_auth(self, client: TestClient):
        response = client.delete("/api/v1/institution-admin/payment-methods/1")
        assert response.status_code == 403

    def test_set_default_payment_method(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/institution-admin/payment-methods/1/set-default",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Default payment method updated"

    def test_enable_addon(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/institution-admin/add-ons/1/enable", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Add-on enabled"

    def test_enable_addon_requires_auth(self, client: TestClient):
        response = client.post("/api/v1/institution-admin/add-ons/1/enable")
        assert response.status_code == 403

    def test_disable_addon(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/institution-admin/add-ons/1/disable", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Add-on disabled"

    def test_addon_bad_id_validation_error(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/institution-admin/add-ons/not-a-number/enable", headers=auth_headers
        )
        assert response.status_code == 422
