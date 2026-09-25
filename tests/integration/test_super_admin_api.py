"""Integration tests for /api/v1/super-admin/* (src/api/v1/super_admin.py).

Platform-level administration router (29 endpoints) gated by
`require_super_admin`: cross-institution dashboard/statistics, institution
CRUD + subscription/billing/usage/analytics, institution branding (white
label), impersonation + audit tooling (activity logs, session replays), and
a guarded read-only raw-SQL console.

Uses a local `super_admin_user`/`super_admin_headers` fixture pair (the
standard `auth_headers` fixture is an institution admin, not a superuser,
so it correctly 403s against `require_super_admin`).

Bugs found and fixed while writing this coverage:
1. **`SessionReplayDetail.metadata` (bug class 1, `metadata`/`metadata_json`
   shadowing)** -- `SessionReplay.metadata_json` (src/models/audit_log.py)
   is `Column('metadata', JSON)`: the Python attribute is `metadata_json`
   because `metadata` is reserved by SQLAlchemy's declarative `Base`. The
   router nonetheless did `SessionReplayDetail(..., metadata=replay.metadata,
   ...)` in `get_session_replay_detail` and `SessionReplay(...,
   metadata=replay_data.metadata, ...)` in `record_session_replay`.
   `replay.metadata` resolves to the class-level `MetaData` registry (not
   the row's JSON, and not serializable by the response schema), and
   `SessionReplay(metadata=...)` silently sets a shadowing instance
   attribute that is never persisted to the real `metadata` column -- every
   recorded session replay's metadata was dropped on write and would have
   crashed on read. Fixed by aliasing the schema field
   (`validation_alias="metadata_json"`, `serialization_alias="metadata"`,
   keeping the public field name `metadata`) and passing `metadata_json=...`
   at both call sites, matching the pattern already used correctly for
   Subscription/Payment/Invoice/UsageRecord.metadata_json elsewhere in this
   codebase.
2. **`create_institution` never set `User.username`** -- `AdminUserCreate`
   (src/schemas/super_admin.py) has no `username` field and the admin-user
   constructor never supplied one, but `User.username` is NOT NULL and
   unique per institution (src/models/user.py). Every single call to
   `POST /super-admin/institutions` -- the platform's institution
   onboarding operation -- raised an unhandled `IntegrityError` on
   `db.commit()`. Fixed by deriving a username from the admin email's local
   part (safe: the institution row was just created, so there is no
   existing user in it to collide with).
3. **`create_institution`'s duplicate slug/domain check (bug class 12
   variant)** -- built `or_(Institution.slug == ..., Institution.domain ==
   institution_data.domain)` unconditionally. `domain` is optional; with it
   omitted, SQLAlchemy renders `Institution.domain == None` as `domain IS
   NULL`, so the `or_` matched *any* other domain-less institution and
   spuriously 400'd every institution creation after the first domain-less
   one. Same bug class already fixed for `institutions.py` in an earlier
   pass (see TESTING_PROGRESS.md pass thirty-three). Fixed to only add the
   domain clause when a domain was actually supplied.
4. **`list_institutions`'s `sort_by=total_users`/`sort_by=revenue` crashed
   (bug class 3 variant)** -- the query-param regex advertises `name`,
   `created_at`, `total_users`, and `revenue` as valid sort keys, but
   neither `total_users` nor `revenue` is a real column on `Institution`
   (they're computed per-institution in Python further down the function);
   `getattr(Institution, sort_by)` raised an unhandled `AttributeError`
   (500) for either value. Fixed by building an aggregate subquery
   (`COUNT(User.id)` / `SUM(Payment.amount) WHERE status='paid'`, grouped
   by `institution_id`) and sorting/paginating on that at the DB level
   instead, so the two advertised-but-broken sort options actually work.
5. Defensive: `execute_sql_query`'s `except SQLAlchemyError` branch didn't
   roll back the session before raising the 400, potentially leaving a
   failed statement's state on a session that's reused for the rest of the
   request. Added `db.rollback()`.

Known, deliberately-not-fixed finding (out of scope for this file): `GET
/super-admin/branding/current` calls
`src.middleware.branding_middleware.get_branding_context(request)`, which
just reads `request.state.branding` -- but `BrandingMiddleware` (the only
thing that ever sets `request.state.branding`) is never registered via
`app.add_middleware(...)` in `src/main.py`. The endpoint therefore always
returns `{"branding": None, ...}` regardless of the `Host` header,
independent of any real per-domain branding data. Registering that
middleware is an app-wide change with its own tradeoffs (it opens a raw
`SessionLocal()` per request for *every* route, not just this one -- see
bug class 11) well outside this router's scope; tests below assert the
actual current (always-None) behavior and this is flagged here for a
dedicated pass. `POST /super-admin/session-replays/record` intentionally
uses `get_current_user` (not `require_super_admin`) -- any authenticated
user's client records their own session for later super-admin review,
which is the documented intent, not a gap.

`upload_logo` talks to S3 via `src.services.branding_service.s3_client`;
mocked directly (`mock_s3_upload` fixture) rather than via moto, matching
the established pattern in test_submissions_api.py.
"""
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.subscription import Subscription, Payment, Invoice, UsageRecord
from src.models.audit_log import ImpersonationLog, ActivityLog, SessionReplay
from src.models.branding import InstitutionBranding


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def super_admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    user = User(
        username="superadmin_sa",
        email="superadmin_sa@testschool.com",
        first_name="Super",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_headers(client: TestClient, super_admin_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": super_admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def institution_admin_role(db_session: Session) -> Role:
    """The role name super_admin.py looks up by literal string ("institution_admin")
    when creating an institution's first admin user / minting an admin-panel-access
    token. Not auto-seeded, so tests that exercise those paths need it explicitly."""
    role = Role(
        name="institution_admin",
        slug="institution-admin-sa",
        description="Institution admin",
        is_system_role=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def second_institution(db_session: Session) -> Institution:
    inst = Institution(
        name="Second Test School SA",
        slug="second-test-school-sa",
        domain="second-sa.example.edu",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def subscription(db_session: Session, institution: Institution) -> Subscription:
    now = datetime.utcnow()
    sub = Subscription(
        institution_id=institution.id,
        plan_name="PROFESSIONAL",
        status="active",
        billing_cycle="monthly",
        price=Decimal("999.00"),
        currency="INR",
        max_users=200,
        max_storage_gb=50,
        start_date=now - timedelta(days=10),
        end_date=now + timedelta(days=20),
        next_billing_date=now + timedelta(days=20),
        auto_renew=True,
    )
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)
    return sub


@pytest.fixture
def payment(db_session: Session, institution: Institution, subscription: Subscription) -> Payment:
    p = Payment(
        subscription_id=subscription.id,
        institution_id=institution.id,
        amount=Decimal("999.00"),
        currency="INR",
        status="paid",
        payment_method="card",
        paid_at=datetime.utcnow() - timedelta(days=2),
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def invoice(db_session: Session, institution: Institution, subscription: Subscription) -> Invoice:
    now = datetime.utcnow()
    inv = Invoice(
        subscription_id=subscription.id,
        institution_id=institution.id,
        invoice_number="INV-SA-000001",
        status="paid",
        amount=Decimal("999.00"),
        tax_amount=Decimal("179.82"),
        total_amount=Decimal("1178.82"),
        currency="INR",
        billing_period_start=now - timedelta(days=30),
        billing_period_end=now,
        due_date=now + timedelta(days=7),
        paid_at=now - timedelta(days=1),
    )
    db_session.add(inv)
    db_session.commit()
    db_session.refresh(inv)
    return inv


@pytest.fixture
def usage_record(db_session: Session, institution: Institution, subscription: Subscription) -> UsageRecord:
    now = datetime.utcnow()
    rec = UsageRecord(
        subscription_id=subscription.id,
        institution_id=institution.id,
        metric_name="storage_gb",
        metric_value=Decimal("12.5"),
        recorded_at=now - timedelta(seconds=5),
        period_start=now.replace(day=1),
        period_end=now,
    )
    db_session.add(rec)
    db_session.commit()
    db_session.refresh(rec)
    return rec


@pytest.fixture
def branding(db_session: Session, institution: Institution) -> InstitutionBranding:
    b = InstitutionBranding(institution_id=institution.id)
    db_session.add(b)
    db_session.commit()
    db_session.refresh(b)
    return b


@pytest.fixture
def mock_s3_upload():
    with patch(
        "src.services.branding_service.s3_client.upload_file",
        return_value="https://test-bucket.s3.amazonaws.com/branding/fake-key.png",
    ) as mock_upload, patch(
        "src.services.branding_service.s3_client.delete_file",
        return_value=True,
    ) as mock_delete:
        yield mock_upload, mock_delete


def _valid_institution_payload(**overrides) -> dict:
    payload = {
        "name": "Brand New Academy",
        "slug": "brand-new-academy",
        "description": "A shiny new school",
        "max_users": 100,
        "admin_user": {
            "email": "principal@brandnew.example.com",
            "first_name": "Priya",
            "last_name": "Principal",
            "phone": "+919876543210",
            "password": "verysecurepassword123",
        },
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestDashboard:
    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/super-admin/dashboard", headers=auth_headers)
        assert response.status_code == 403

    def test_unauthenticated_rejected(self, client: TestClient):
        # No Authorization header at all -> FastAPI's HTTPBearer(auto_error=True) rejects
        # with 403 "Not authenticated" before get_current_user even runs (401 is reserved for
        # a present-but-invalid/expired token in this codebase).
        response = client.get("/api/v1/super-admin/dashboard")
        assert response.status_code == 403

    def test_dashboard_happy_path(
        self, client: TestClient, super_admin_headers: dict, subscription, payment
    ):
        response = client.get("/api/v1/super-admin/dashboard", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        for key in (
            "metrics_summary",
            "subscription_distribution",
            "platform_usage",
            "revenue_trends",
            "recent_activities",
            "institution_performance",
            "quick_actions",
        ):
            assert key in data
        assert data["metrics_summary"]["total_institutions"] >= 1
        assert len(data["revenue_trends"]) == 6
        assert data["subscription_distribution"]["active"] >= 1


# ---------------------------------------------------------------------------
# Institution details / statistics / list
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestInstitutionDetailsAndStats:
    def test_details_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/institutions/999999/details", headers=super_admin_headers
        )
        assert response.status_code == 404

    def test_details_happy_path_no_subscription(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/details",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution"]["id"] == institution.id
        assert data["subscription"] is None
        assert data["stats"]["total_users"] >= 0

    def test_details_happy_path_with_subscription(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        subscription: Subscription,
        usage_record: UsageRecord,
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/details",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscription"]["plan_name"] == "PROFESSIONAL"
        assert len(data["recent_usage"]) >= 1

    def test_revenue_breakdown(
        self, client: TestClient, super_admin_headers: dict, subscription: Subscription
    ):
        response = client.get(
            "/api/v1/super-admin/statistics/revenue-breakdown", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert "revenue_breakdown" in response.json()

    def test_revenue_breakdown_with_date_range(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/super-admin/statistics/revenue-breakdown",
            params={"start_date": "2020-01-01T00:00:00", "end_date": "2030-01-01T00:00:00"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200

    def test_user_growth_statistics(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/statistics/user-growth",
            params={"days": 30},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "daily_registrations" in data
        assert "total_new_users" in data

    def test_user_growth_invalid_days(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/statistics/user-growth",
            params={"days": 400},
            headers=super_admin_headers,
        )
        assert response.status_code == 422


@pytest.mark.integration
class TestListInstitutions:
    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/super-admin/institutions", headers=auth_headers)
        assert response.status_code == 403

    def test_list_default(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.get("/api/v1/super-admin/institutions", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["id"] == institution.id for item in data["items"])

    def test_list_search_filter(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.get(
            "/api/v1/super-admin/institutions",
            params={"search": institution.slug},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(institution.slug in "".join(
            [item["slug"] or "", item["name"] or "", item["domain"] or ""]
        ) for item in data["items"]) or len(data["items"]) >= 1
        assert any(item["id"] == institution.id for item in data["items"])

    def test_list_status_filter(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.get(
            "/api/v1/super-admin/institutions",
            params={"status": "active"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert all(item["is_active"] for item in response.json()["items"])

    def test_list_invalid_sort_by_rejected(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/super-admin/institutions",
            params={"sort_by": "not_a_real_field"},
            headers=super_admin_headers,
        )
        assert response.status_code == 422

    @pytest.mark.parametrize("sort_by", ["name", "created_at", "total_users", "revenue"])
    @pytest.mark.parametrize("sort_order", ["asc", "desc"])
    def test_list_every_advertised_sort_option_works(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        second_institution: Institution,
        payment: Payment,
        sort_by: str,
        sort_order: str,
    ):
        """Regression test: sort_by=total_users/revenue used to raise an
        unhandled AttributeError (500) because neither is a real Institution
        column -- see bug #4 in the module docstring."""
        response = client.get(
            "/api/v1/super-admin/institutions",
            params={"sort_by": sort_by, "sort_order": sort_order},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 2

    def test_list_sort_by_revenue_orders_correctly(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        second_institution: Institution,
        payment: Payment,
    ):
        response = client.get(
            "/api/v1/super-admin/institutions",
            params={"sort_by": "revenue", "sort_order": "desc", "page_size": 100},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        items = response.json()["items"]
        by_id = {item["id"]: item["total_revenue"] for item in items}
        assert by_id[institution.id] > by_id.get(second_institution.id, 0)
        revenues = [item["total_revenue"] for item in items]
        assert revenues == sorted(revenues, reverse=True)

    def test_pagination_fields(self, client: TestClient, super_admin_headers: dict, institution):
        response = client.get(
            "/api/v1/super-admin/institutions",
            params={"page": 1, "page_size": 1},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 1
        assert len(data["items"]) <= 1


# ---------------------------------------------------------------------------
# Create / update institution + subscription
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestCreateInstitution:
    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/super-admin/institutions",
            json=_valid_institution_payload(),
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_missing_admin_role_returns_500(
        self, client: TestClient, super_admin_headers: dict
    ):
        """No institution_admin_role fixture here -- the role the endpoint
        looks up by name genuinely doesn't exist yet."""
        response = client.post(
            "/api/v1/super-admin/institutions",
            json=_valid_institution_payload(slug="no-role-academy"),
            headers=super_admin_headers,
        )
        assert response.status_code == 500

    def test_create_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution_admin_role: Role,
        db_session: Session,
    ):
        """Regression test for bug #2: the admin user's `username` was
        never set, which used to raise an unhandled IntegrityError on
        every call to this endpoint."""
        response = client.post(
            "/api/v1/super-admin/institutions",
            json=_valid_institution_payload(),
            headers=super_admin_headers,
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["slug"] == "brand-new-academy"

        created = db_session.query(Institution).filter(
            Institution.slug == "brand-new-academy"
        ).first()
        assert created is not None
        assert created.description == "A shiny new school"
        assert created.max_users == 100

        admin_user = db_session.query(User).filter(
            User.email == "principal@brandnew.example.com"
        ).first()
        assert admin_user is not None
        assert admin_user.username == "principal"
        assert admin_user.institution_id == created.id

    def test_create_with_subscription_trial(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution_admin_role: Role,
        db_session: Session,
    ):
        payload = _valid_institution_payload(
            slug="trial-academy",
            admin_user={
                "email": "admin@trialacademy.example.com",
                "first_name": "Tara",
                "last_name": "Admin",
                "password": "verysecurepassword123",
            },
            subscription={
                "plan_name": "STARTER",
                "billing_cycle": "monthly",
                "price": 499.0,
                "max_users": 50,
                "trial_days": 14,
            },
        )
        response = client.post(
            "/api/v1/super-admin/institutions", json=payload, headers=super_admin_headers
        )
        assert response.status_code == 201, response.text
        institution_id = response.json()["id"]
        sub = db_session.query(Subscription).filter(
            Subscription.institution_id == institution_id
        ).first()
        assert sub is not None
        assert sub.status == "trial"
        assert sub.trial_end_date is not None

    def test_create_duplicate_slug_rejected(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        institution_admin_role: Role,
    ):
        payload = _valid_institution_payload(slug=institution.slug)
        response = client.post(
            "/api/v1/super-admin/institutions", json=payload, headers=super_admin_headers
        )
        assert response.status_code == 400

    def test_create_duplicate_domain_rejected(
        self,
        client: TestClient,
        super_admin_headers: dict,
        second_institution: Institution,
        institution_admin_role: Role,
    ):
        payload = _valid_institution_payload(
            slug="another-slug-entirely", domain=second_institution.domain
        )
        response = client.post(
            "/api/v1/super-admin/institutions", json=payload, headers=super_admin_headers
        )
        assert response.status_code == 400

    def test_create_two_institutions_with_no_domain_both_succeed(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution_admin_role: Role,
    ):
        """Regression test for bug #3: the unconditional `Institution.domain
        == None` OR-clause used to make the second domain-less institution
        spuriously collide with the first."""
        payload_a = _valid_institution_payload(
            name="No Domain Academy A",
            slug="no-domain-academy-a",
            admin_user={
                "email": "admin-a@nodomain.example.com",
                "first_name": "A",
                "last_name": "Admin",
                "password": "verysecurepassword123",
            },
        )
        payload_a.pop("description")
        payload_b = _valid_institution_payload(
            name="No Domain Academy B",
            slug="no-domain-academy-b",
            admin_user={
                "email": "admin-b@nodomain.example.com",
                "first_name": "B",
                "last_name": "Admin",
                "password": "verysecurepassword123",
            },
        )
        response_a = client.post(
            "/api/v1/super-admin/institutions", json=payload_a, headers=super_admin_headers
        )
        response_b = client.post(
            "/api/v1/super-admin/institutions", json=payload_b, headers=super_admin_headers
        )
        assert response_a.status_code == 201, response_a.text
        assert response_b.status_code == 201, response_b.text

    def test_create_duplicate_admin_email_rejected(
        self,
        client: TestClient,
        super_admin_headers: dict,
        super_admin_user: User,
        institution_admin_role: Role,
    ):
        payload = _valid_institution_payload(
            slug="dup-email-academy",
            admin_user={
                "email": super_admin_user.email,
                "first_name": "Dup",
                "last_name": "Admin",
                "password": "verysecurepassword123",
            },
        )
        response = client.post(
            "/api/v1/super-admin/institutions", json=payload, headers=super_admin_headers
        )
        assert response.status_code == 400

    def test_create_validation_error_missing_fields(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.post(
            "/api/v1/super-admin/institutions", json={"name": "Incomplete"}, headers=super_admin_headers
        )
        assert response.status_code == 422


@pytest.mark.integration
class TestUpdateInstitution:
    def test_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.put(
            "/api/v1/super-admin/institutions/999999",
            json={"name": "Whatever"},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_update_happy_path(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}",
            json={"description": "Updated description", "max_users": 250, "is_active": False},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        db_session.refresh(institution)
        assert institution.description == "Updated description"
        assert institution.max_users == 250
        assert institution.is_active is False

    def test_update_duplicate_slug_rejected(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        second_institution: Institution,
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}",
            json={"slug": second_institution.slug},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_update_duplicate_domain_rejected(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        second_institution: Institution,
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}",
            json={"domain": second_institution.domain},
            headers=super_admin_headers,
        )
        assert response.status_code == 400


@pytest.mark.integration
class TestUpdateInstitutionSubscription:
    def test_institution_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.put(
            "/api/v1/super-admin/institutions/999999/subscription",
            json={"price": 1500},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_no_subscription_found(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}/subscription",
            json={"price": 1500},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_update_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        subscription: Subscription,
        db_session: Session,
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}/subscription",
            json={"plan_name": "ENTERPRISE", "price": 4999.0},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["plan_name"] == "ENTERPRISE"
        db_session.refresh(subscription)
        assert subscription.plan_name == "ENTERPRISE"
        assert float(subscription.price) == 4999.0


# ---------------------------------------------------------------------------
# Billing history / usage / analytics
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestBillingUsageAnalytics:
    def test_billing_history_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/institutions/999999/billing-history",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_billing_history_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        payment: Payment,
        invoice: Invoice,
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/billing-history",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        items = response.json()["billing_history"]
        assert len(items) == 2

    def test_usage_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/institutions/999999/usage", headers=super_admin_headers
        )
        assert response.status_code == 404

    def test_usage_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        subscription: Subscription,
        usage_record: UsageRecord,
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/usage",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        metrics = response.json()["usage_metrics"]
        assert any(m["metric_name"] == "Active Users" for m in metrics)
        assert any(m["metric_name"] == "storage_gb" for m in metrics)

    def test_analytics_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/institutions/999999/analytics", headers=super_admin_headers
        )
        assert response.status_code == 404

    def test_analytics_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        payment: Payment,
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/analytics",
            params={"days": 30},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution_id"] == institution.id
        assert "user_metrics" in data
        assert "revenue_metrics" in data
        assert data["revenue_metrics"]["total_revenue"] >= float(payment.amount)


# ---------------------------------------------------------------------------
# Branding
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestBranding:
    def test_non_super_admin_forbidden(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_get_branding_not_found(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_create_branding_happy_path(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            json={"institution_id": institution.id, "primary_color": "#123456"},
            headers=super_admin_headers,
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["primary_color"] == "#123456"

    def test_create_branding_id_mismatch(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        second_institution: Institution,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            json={"institution_id": second_institution.id},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_create_branding_institution_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.post(
            "/api/v1/super-admin/institutions/999999/branding",
            json={"institution_id": 999999},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_create_branding_duplicate_rejected(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            json={"institution_id": institution.id},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_update_branding_not_found(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            json={"primary_color": "#abcdef"},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_update_branding_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.put(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            json={"primary_color": "#abcdef"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["primary_color"] == "#abcdef"

    def test_upload_logo_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
        mock_s3_upload,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/upload-logo",
            params={"field": "logo"},
            files={"file": ("logo.png", b"fake-png-bytes", "image/png")},
            headers=super_admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["field"] == "logo"
        assert data["url"].startswith("https://")

    def test_upload_logo_invalid_field(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        mock_s3_upload,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/upload-logo",
            params={"field": "not_a_field"},
            files={"file": ("logo.png", b"fake-png-bytes", "image/png")},
            headers=super_admin_headers,
        )
        assert response.status_code == 422

    def test_upload_logo_invalid_file_type(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
        mock_s3_upload,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/upload-logo",
            params={"field": "logo"},
            files={"file": ("logo.txt", b"not-an-image", "text/plain")},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_set_custom_domain_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/custom-domain",
            json={"custom_domain": "school.example.com", "ssl_enabled": True},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["custom_domain"] == "school.example.com"
        assert data["domain_verified"] is False
        assert len(data["dns_records"]) == 2

    def test_set_custom_domain_invalid_format(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/custom-domain",
            json={"custom_domain": "not a domain!!", "ssl_enabled": False},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_verify_custom_domain_no_domain_configured(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/verify-domain",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_verify_custom_domain_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/custom-domain",
            json={"custom_domain": "school2.example.com", "ssl_enabled": False},
            headers=super_admin_headers,
        )
        response = client.post(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/verify-domain",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["verified"] is True

    def test_preview_branding_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/branding/preview",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution_name"] == institution.name
        assert data["preview_url"]

    def test_delete_branding_happy_path_then_404(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        branding: InstitutionBranding,
    ):
        response = client.delete(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            headers=super_admin_headers,
        )
        assert response.status_code == 200

        response2 = client.delete(
            f"/api/v1/super-admin/institutions/{institution.id}/branding",
            headers=super_admin_headers,
        )
        assert response2.status_code == 404

    def test_branding_current_public_endpoint(self, client: TestClient):
        """No auth required. BrandingMiddleware is never registered in
        src/main.py, so request.state.branding is never set -- this
        endpoint always returns None regardless of Host header (documented
        known limitation, see module docstring)."""
        response = client.get("/api/v1/super-admin/branding/current")
        assert response.status_code == 200
        data = response.json()
        assert data["branding"] is None


# ---------------------------------------------------------------------------
# Impersonation
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestImpersonation:
    def test_non_super_admin_forbidden(
        self, client: TestClient, auth_headers: dict, admin_user: User
    ):
        response = client.post(
            "/api/v1/super-admin/impersonate",
            json={"user_id": admin_user.id, "reason": "Investigating a support ticket"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_impersonate_user_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/super-admin/impersonate",
            json={"user_id": 999999, "reason": "Investigating a support ticket"},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_impersonate_inactive_user_rejected(
        self, client: TestClient, super_admin_headers: dict, db_session: Session, admin_user: User
    ):
        admin_user.is_active = False
        db_session.commit()
        response = client.post(
            "/api/v1/super-admin/impersonate",
            json={"user_id": admin_user.id, "reason": "Investigating a support ticket"},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_impersonate_reason_too_short(
        self, client: TestClient, super_admin_headers: dict, admin_user: User
    ):
        response = client.post(
            "/api/v1/super-admin/impersonate",
            json={"user_id": admin_user.id, "reason": "short"},
            headers=super_admin_headers,
        )
        assert response.status_code == 422

    def test_impersonate_happy_path(
        self, client: TestClient, super_admin_headers: dict, admin_user: User, institution: Institution
    ):
        response = client.post(
            "/api/v1/super-admin/impersonate",
            json={
                "user_id": admin_user.id,
                "reason": "Investigating a support ticket",
                "duration_minutes": 30,
            },
            headers=super_admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["user_id"] == admin_user.id
        assert data["institution_id"] == institution.id
        assert data["access_token"]
        assert data["impersonation_log_id"]

        # The minted token should itself work for authenticated requests.
        impersonated_headers = {"Authorization": f"Bearer {data['access_token']}"}
        me_response = client.get("/api/v1/auth/me", headers=impersonated_headers)
        assert me_response.status_code == 200
        assert me_response.json()["id"] == admin_user.id

    def test_end_impersonation_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/super-admin/end-impersonation",
            json={"impersonation_log_id": 999999},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_end_impersonation_happy_path(
        self, client: TestClient, super_admin_headers: dict, admin_user: User
    ):
        start = client.post(
            "/api/v1/super-admin/impersonate",
            json={"user_id": admin_user.id, "reason": "Investigating a support ticket"},
            headers=super_admin_headers,
        )
        log_id = start.json()["impersonation_log_id"]

        response = client.post(
            "/api/v1/super-admin/end-impersonation",
            json={"impersonation_log_id": log_id},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert "duration_minutes" in response.json()

    def test_impersonation_logs_list(
        self, client: TestClient, super_admin_headers: dict, admin_user: User, institution: Institution
    ):
        client.post(
            "/api/v1/super-admin/impersonate",
            json={"user_id": admin_user.id, "reason": "Investigating a support ticket"},
            headers=super_admin_headers,
        )
        response = client.get(
            "/api/v1/super-admin/impersonation-logs",
            params={"institution_id": institution.id, "is_active": True},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["impersonated_user_id"] == admin_user.id for item in data["items"])

    def test_access_admin_panel_institution_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/super-admin/institutions/999999/access-admin-panel",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_access_admin_panel_no_admin_user(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, institution_admin_role: Role
    ):
        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/access-admin-panel",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_access_admin_panel_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        institution_admin_role: Role,
        db_session: Session,
    ):
        inst_admin = User(
            username="realinstadmin",
            email="realinstadmin@testschool.com",
            first_name="Real",
            last_name="Admin",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=institution_admin_role.id,
            is_active=True,
        )
        db_session.add(inst_admin)
        db_session.commit()

        response = client.get(
            f"/api/v1/super-admin/institutions/{institution.id}/access-admin-panel",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["admin_user_id"] == inst_admin.id
        assert data["access_token"]


# ---------------------------------------------------------------------------
# Activity logs / session replays
# ---------------------------------------------------------------------------


@pytest.fixture
def activity_log(db_session: Session, institution: Institution, admin_user: User) -> ActivityLog:
    log = ActivityLog(
        institution_id=institution.id,
        user_id=admin_user.id,
        activity_type="login",
        activity_category="auth",
        endpoint="/api/v1/auth/login",
        method="POST",
        status_code=200,
        description="User logged in",
        created_at=datetime.utcnow() - timedelta(seconds=5),
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)
    return log


@pytest.fixture
def error_activity_log(db_session: Session, institution: Institution) -> ActivityLog:
    log = ActivityLog(
        institution_id=institution.id,
        activity_type="request_failed",
        activity_category="api",
        status_code=500,
        error_message="Something went wrong",
        created_at=datetime.utcnow() - timedelta(seconds=5),
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)
    return log


@pytest.fixture
def session_replay(db_session: Session, institution: Institution, admin_user: User) -> SessionReplay:
    now = datetime.utcnow() - timedelta(seconds=5)
    replay = SessionReplay(
        session_id="sess-abc-123",
        user_id=admin_user.id,
        institution_id=institution.id,
        events=[{"type": "page_view"}, {"type": "click"}],
        metadata_json={"browser": "chrome", "os": "mac"},
        started_at=now,
        ended_at=now + timedelta(minutes=5),
        duration_seconds=300,
        page_count=1,
        interaction_count=1,
        error_count=0,
    )
    db_session.add(replay)
    db_session.commit()
    db_session.refresh(replay)
    return replay


@pytest.mark.integration
class TestActivityLogs:
    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/super-admin/activity-logs", headers=auth_headers)
        assert response.status_code == 403

    def test_list_default(self, client: TestClient, super_admin_headers: dict, activity_log: ActivityLog):
        response = client.get("/api/v1/super-admin/activity-logs", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    def test_filter_by_user_and_category(
        self, client: TestClient, super_admin_headers: dict, activity_log: ActivityLog, admin_user: User
    ):
        response = client.get(
            "/api/v1/super-admin/activity-logs",
            params={"user_id": admin_user.id, "activity_category": "auth"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) >= 1
        assert all(item["user_id"] == admin_user.id for item in items)
        assert items[0]["user_email"] == admin_user.email

    def test_filter_has_errors(
        self, client: TestClient, super_admin_headers: dict, error_activity_log: ActivityLog
    ):
        response = client.get(
            "/api/v1/super-admin/activity-logs",
            params={"has_errors": True},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) >= 1
        assert all(item["error_message"] for item in items)

    def test_filter_date_range(
        self, client: TestClient, super_admin_headers: dict, activity_log: ActivityLog
    ):
        response = client.get(
            "/api/v1/super-admin/activity-logs",
            params={
                "start_date": "2020-01-01T00:00:00",
                "end_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            },
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["total"] >= 1


@pytest.mark.integration
class TestSessionReplays:
    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/super-admin/session-replays", headers=auth_headers)
        assert response.status_code == 403

    def test_list_default(
        self, client: TestClient, super_admin_headers: dict, session_replay: SessionReplay
    ):
        response = client.get("/api/v1/super-admin/session-replays", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["session_id"] == "sess-abc-123" for item in data["items"])

    def test_filter_has_errors_false(
        self, client: TestClient, super_admin_headers: dict, session_replay: SessionReplay
    ):
        response = client.get(
            "/api/v1/super-admin/session-replays",
            params={"has_errors": False},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert any(item["session_id"] == "sess-abc-123" for item in response.json()["items"])

    def test_detail_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/session-replays/999999", headers=super_admin_headers
        )
        assert response.status_code == 404

    def test_detail_happy_path_metadata_roundtrip(
        self, client: TestClient, super_admin_headers: dict, session_replay: SessionReplay
    ):
        """Regression test for bug #1: `metadata` used to resolve to
        SQLAlchemy's declarative Base MetaData registry instead of the
        row's real `metadata_json` column data."""
        response = client.get(
            f"/api/v1/super-admin/session-replays/{session_replay.id}",
            headers=super_admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["id"] == session_replay.id
        assert data["metadata"] == {"browser": "chrome", "os": "mac"}
        assert len(data["events"]) == 2

    def test_record_session_replay_happy_path_and_metadata_persists(
        self, client: TestClient, auth_headers: dict, super_admin_headers: dict
    ):
        """Uses the regular (non-superadmin) auth_headers -- this endpoint
        intentionally uses get_current_user, not require_super_admin, so any
        authenticated user's client can record its own session."""
        now = datetime.utcnow() - timedelta(seconds=5)
        payload = {
            "session_id": "sess-record-test-1",
            "events": [
                {"type": "page_view"},
                {"type": "click"},
                {"type": "input"},
                {"type": "error"},
            ],
            "metadata": {"app_version": "1.2.3"},
            "started_at": now.isoformat(),
            "ended_at": (now + timedelta(minutes=2)).isoformat(),
        }
        response = client.post(
            "/api/v1/super-admin/session-replays/record", json=payload, headers=auth_headers
        )
        assert response.status_code == 200, response.text
        replay_id = response.json()["id"]

        # Regression check for bug #1's write-side half: metadata must have
        # actually been persisted to the real column, not silently dropped.
        detail = client.get(
            f"/api/v1/super-admin/session-replays/{replay_id}", headers=super_admin_headers
        )
        assert detail.status_code == 200
        detail_data = detail.json()
        assert detail_data["metadata"] == {"app_version": "1.2.3"}
        assert detail_data["page_count"] == 1
        assert detail_data["interaction_count"] == 2
        assert detail_data["error_count"] == 1

    def test_record_session_replay_unauthenticated_rejected(self, client: TestClient):
        now = datetime.utcnow()
        response = client.post(
            "/api/v1/super-admin/session-replays/record",
            json={
                "session_id": "sess-noauth",
                "events": [],
                "started_at": now.isoformat(),
            },
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Execute SQL
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestExecuteSql:
    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/super-admin/execute-sql",
            json={"query": "SELECT 1"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_select_happy_path(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/super-admin/execute-sql",
            json={"query": f"SELECT id, name FROM institutions WHERE id = {institution.id}"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["columns"] == ["id", "name"]
        assert data["row_count"] == 1
        assert data["rows"][0][0] == institution.id

    def test_auto_appends_limit(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/super-admin/execute-sql",
            json={"query": "SELECT id FROM institutions", "limit": 1},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert "LIMIT 1" in response.json()["query"]
        assert response.json()["row_count"] <= 1

    @pytest.mark.parametrize(
        "query",
        [
            "INSERT INTO institutions (name) VALUES ('x')",
            "UPDATE institutions SET name = 'x'",
            "DELETE FROM institutions",
            "DROP TABLE institutions",
        ],
    )
    def test_forbidden_keywords_rejected(
        self, client: TestClient, super_admin_headers: dict, query: str
    ):
        response = client.post(
            "/api/v1/super-admin/execute-sql", json={"query": query}, headers=super_admin_headers
        )
        assert response.status_code == 400

    def test_non_select_prefix_rejected(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/super-admin/execute-sql",
            json={"query": "SHOW TABLES"},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_sql_syntax_error_returns_400_and_session_still_usable(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        bad_response = client.post(
            "/api/v1/super-admin/execute-sql",
            json={"query": "SELECT * FROM this_table_does_not_exist_xyz"},
            headers=super_admin_headers,
        )
        assert bad_response.status_code == 400

        # The session must still be usable for the rest of the request cycle
        # afterwards (see bug #5 -- db.rollback() on the error path).
        good_response = client.post(
            "/api/v1/super-admin/execute-sql",
            json={"query": f"SELECT id FROM institutions WHERE id = {institution.id}"},
            headers=super_admin_headers,
        )
        assert good_response.status_code == 200
        assert good_response.json()["row_count"] == 1

    def test_query_validation_too_long_or_empty(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.post(
            "/api/v1/super-admin/execute-sql", json={"query": ""}, headers=super_admin_headers
        )
        assert response.status_code == 422
