import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.institution_health import (
    InstitutionHealthScore,
    InstitutionHealthAlert,
    InstitutionHealthHistory,
)
from src.models.role import Role
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.subscription import SubscriptionStatus
from src.utils.security import get_password_hash


@pytest.fixture
def super_admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    user = User(
        username="health_superadmin",
        email="health_superadmin@testschool.com",
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


def _health_score(
    institution_id: int,
    overall: float = 80.0,
    risk_level: str = "low",
    churn_probability: float = 0.1,
    trend: str = "stable",
) -> InstitutionHealthScore:
    return InstitutionHealthScore(
        institution_id=institution_id,
        overall_health_score=overall,
        payment_health_score=80.0,
        user_activity_score=80.0,
        support_ticket_score=80.0,
        feature_adoption_score=80.0,
        data_quality_score=80.0,
        churn_risk_score=churn_probability * 100,
        churn_probability=churn_probability,
        risk_level=risk_level,
        health_trend=trend,
        metrics_data={"payment": {"failed_payments_90d": 0}, "activity": {"mau_ratio": 50}},
        risk_factors=[],
        recommended_actions=[],
        last_calculated_at=datetime.utcnow(),
    )


@pytest.mark.integration
class TestInstitutionHealthAPI:
    """Integration tests for /api/v1/institution-health/* (all endpoints
    are `require_super_admin`-gated).

    Found and fixed real bugs while building this coverage (see
    src/api/v1/institution_health.py and
    src/services/institution_health_service.py for the inline notes):

    - `POST /alerts` (create_manual_alert): `InstitutionHealthAlert.
      health_score_id` is NOT NULL, but the endpoint passed `None` for any
      institution that didn't already have a calculated health score --
      an unhandled `IntegrityError` (500) on every such call. Fixed by
      calculating one on the fly first, matching how
      `get_institution_health` already lazily computes a missing score.
    - `calculate_payment_health_score` compared `subscription.status`
      against the literal strings `"cancelled"` (double L) and `"trial"`,
      but the real `SubscriptionStatus` enum values are `"canceled"`
      (one L) and `"trialing"` -- both branches were dead code, so a
      canceled subscription never took its -80 payment-score penalty and
      an expired trial never took its -50 penalty.
    - The same `"paid"` vs `"captured"` mismatch: `PaymentStatus` has no
      "paid" member (a successful payment's real status is
      `PaymentStatus.CAPTURED` = "captured"), so
      `successful_payments_90d` always reported 0 regardless of actual
      payment history, in both `calculate_payment_health_score` and the
      ML feature extractor `_extract_features_for_prediction`.
    - `_extract_features_for_prediction`'s "subscription_trial" feature
      and `train_churn_prediction_model`'s churn label both used the same
      wrong `"trial"`/`"cancelled"` literals, degrading the churn model's
      training data (a canceled subscription was never labeled as
      churned).
    """

    # ---- auth gating ----

    def test_dashboard_requires_super_admin(self, client: TestClient, auth_headers: dict):
        response = client.get(
            "/api/v1/institution-health/dashboard", headers=auth_headers
        )
        assert response.status_code == 403

    def test_dashboard_requires_auth(self, client: TestClient):
        response = client.get("/api/v1/institution-health/dashboard")
        assert response.status_code == 403

    # ---- GET /dashboard ----

    def test_dashboard_happy_path(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        db_session: Session,
    ):
        score = _health_score(institution.id, overall=25.0, risk_level="critical", churn_probability=0.8)
        db_session.add(score)
        db_session.commit()
        db_session.refresh(score)

        alert = InstitutionHealthAlert(
            health_score_id=score.id,
            institution_id=institution.id,
            alert_type="critical_health",
            severity="critical",
            title="Critical Health",
            description="Overall health critical",
            is_resolved=False,
            notification_sent=False,
        )
        db_session.add(alert)
        db_session.commit()

        response = client.get(
            "/api/v1/institution-health/dashboard", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        item = next(i for i in data["items"] if i["institution_id"] == institution.id)
        assert item["institution_name"] == institution.name
        assert item["risk_level"] == "critical"
        assert item["active_alerts_count"] == 1
        assert data["critical_count"] >= 1

    def test_dashboard_filters_by_risk_level(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        db_session.add(_health_score(institution.id, risk_level="low"))
        db_session.commit()

        response = client.get(
            "/api/v1/institution-health/dashboard",
            headers=super_admin_headers,
            params={"risk_level": "critical"},
        )
        assert response.status_code == 200
        data = response.json()
        assert all(i["risk_level"] == "critical" for i in data["items"])

    def test_dashboard_invalid_sort_by_rejected(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-health/dashboard",
            headers=super_admin_headers,
            params={"sort_by": "not_a_real_field"},
        )
        assert response.status_code == 422

    # ---- GET /institutions/{id} ----

    def test_get_institution_health_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-health/institutions/9999999",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_get_institution_health_computes_when_missing(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        # No InstitutionHealthScore row exists yet for this institution --
        # the endpoint should lazily calculate one.
        response = client.get(
            f"/api/v1/institution-health/institutions/{institution.id}",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["health_score"]["institution_id"] == institution.id
        assert data["health_score"]["institution_name"] == institution.name
        assert "risk_factors" in data["health_score"]
        assert "recommended_actions" in data["health_score"]
        # This fresh institution has no subscription at all, so
        # payment_health_score comes back 0 and _create_alerts_if_needed
        # auto-creates a "payment_issues" alert -- just assert the shape,
        # not emptiness.
        assert isinstance(data["active_alerts"], list)
        assert data["health_history"] == []
        assert isinstance(data["metrics_breakdown"], dict)

    def test_get_institution_health_existing_score_with_alerts_and_history(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        score = _health_score(institution.id, overall=55.0, risk_level="medium")
        db_session.add(score)
        db_session.commit()
        db_session.refresh(score)

        alert = InstitutionHealthAlert(
            health_score_id=score.id,
            institution_id=institution.id,
            alert_type="low_engagement",
            severity="high",
            title="Low Engagement",
            description="Activity dropped",
            is_resolved=False,
            notification_sent=False,
        )
        history = InstitutionHealthHistory(
            health_score_id=score.id,
            institution_id=institution.id,
            overall_health_score=60.0,
            payment_health_score=70.0,
            user_activity_score=70.0,
            support_ticket_score=70.0,
            feature_adoption_score=70.0,
            data_quality_score=70.0,
            churn_risk_score=20.0,
            churn_probability=0.2,
            risk_level="medium",
            recorded_at=datetime.utcnow() - timedelta(days=1, seconds=5),
        )
        db_session.add_all([alert, history])
        db_session.commit()

        response = client.get(
            f"/api/v1/institution-health/institutions/{institution.id}",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["health_score"]["overall_health_score"] == 55.0
        assert len(data["active_alerts"]) == 1
        assert data["active_alerts"][0]["title"] == "Low Engagement"
        assert len(data["health_history"]) == 1

    # ---- POST /institutions/{id}/calculate ----

    def test_calculate_health_score_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.post(
            "/api/v1/institution-health/institutions/9999999/calculate",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_calculate_health_score_happy_path(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        response = client.post(
            f"/api/v1/institution-health/institutions/{institution.id}/calculate",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution_id"] == institution.id
        assert 0 <= data["overall_health_score"] <= 100
        assert data["risk_level"] in {"low", "medium", "high", "critical"}

        row = (
            db_session.query(InstitutionHealthScore)
            .filter(InstitutionHealthScore.institution_id == institution.id)
            .first()
        )
        assert row is not None

    def test_calculate_health_score_applies_canceled_subscription_penalty(
        self,
        client: TestClient,
        super_admin_headers: dict,
        institution: Institution,
        db_session: Session,
    ):
        """Regression test for the "cancelled" (double L) vs "canceled"
        typo bug: a canceled subscription must now actually depress the
        payment health score."""
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="Starter",
            status=SubscriptionStatus.CANCELED,
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            start_date=datetime.utcnow() - timedelta(days=60),
            canceled_at=datetime.utcnow() - timedelta(days=5),
            auto_renew=False,
        )
        db_session.add(subscription)
        db_session.commit()

        response = client.post(
            f"/api/v1/institution-health/institutions/{institution.id}/calculate",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        # score starts at 100 and a canceled subscription takes -80.
        assert data["payment_health_score"] <= 20.0

    # ---- POST /calculate-all ----

    def test_calculate_all_health_scores(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/institution-health/calculate-all", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_institutions"] >= 1
        assert data["calculated"] + data["failed"] == data["total_institutions"]
        assert any(r["institution_id"] == institution.id for r in data["results"])

    # ---- GET /alerts, PUT /alerts/{id}/resolve, POST /alerts ----

    def test_get_all_alerts_with_filters(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        score = _health_score(institution.id)
        db_session.add(score)
        db_session.commit()
        db_session.refresh(score)

        resolved = InstitutionHealthAlert(
            health_score_id=score.id,
            institution_id=institution.id,
            alert_type="payment_issues",
            severity="urgent",
            title="Resolved Alert",
            description="Was resolved",
            is_resolved=True,
            resolved_at=datetime.utcnow(),
            notification_sent=False,
        )
        unresolved = InstitutionHealthAlert(
            health_score_id=score.id,
            institution_id=institution.id,
            alert_type="low_engagement",
            severity="high",
            title="Unresolved Alert",
            description="Still open",
            is_resolved=False,
            notification_sent=False,
        )
        db_session.add_all([resolved, unresolved])
        db_session.commit()

        response = client.get(
            "/api/v1/institution-health/alerts",
            headers=super_admin_headers,
            params={"is_resolved": False},
        )
        assert response.status_code == 200
        titles = {a["title"] for a in response.json()}
        assert "Unresolved Alert" in titles
        assert "Resolved Alert" not in titles

        response = client.get(
            "/api/v1/institution-health/alerts",
            headers=super_admin_headers,
            params={"severity": "urgent"},
        )
        assert response.status_code == 200
        assert all(a["severity"] == "urgent" for a in response.json())

    def test_resolve_alert_happy_path(
        self, client: TestClient, super_admin_headers: dict, super_admin_user: User, institution: Institution, db_session: Session
    ):
        score = _health_score(institution.id)
        db_session.add(score)
        db_session.commit()
        db_session.refresh(score)

        alert = InstitutionHealthAlert(
            health_score_id=score.id,
            institution_id=institution.id,
            alert_type="payment_issues",
            severity="urgent",
            title="Needs Resolving",
            description="desc",
            is_resolved=False,
            notification_sent=False,
        )
        db_session.add(alert)
        db_session.commit()
        db_session.refresh(alert)

        response = client.put(
            f"/api/v1/institution-health/alerts/{alert.id}/resolve",
            headers=super_admin_headers,
            json={"action_taken": "Contacted institution and resolved billing issue"},
        )
        assert response.status_code == 200

        db_session.refresh(alert)
        assert alert.is_resolved is True
        assert alert.resolved_at is not None
        assert alert.resolved_by == super_admin_user.id
        assert alert.action_taken == "Contacted institution and resolved billing issue"

    def test_resolve_alert_not_found(self, client: TestClient, super_admin_headers: dict):
        response = client.put(
            "/api/v1/institution-health/alerts/9999999/resolve",
            headers=super_admin_headers,
            json={"action_taken": "n/a"},
        )
        assert response.status_code == 404

    def test_create_manual_alert_happy_path_with_existing_score(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        score = _health_score(institution.id)
        db_session.add(score)
        db_session.commit()

        response = client.post(
            "/api/v1/institution-health/alerts",
            headers=super_admin_headers,
            json={
                "institution_id": institution.id,
                "alert_type": "manual_review",
                "severity": "medium",
                "title": "Manual Review Needed",
                "description": "Flagged by support team",
            },
        )
        assert response.status_code == 201
        assert "alert_id" in response.json()

    def test_create_manual_alert_without_existing_score_no_crash(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        # Regression test: previously raised an unhandled IntegrityError
        # (health_score_id NOT NULL violation) when no health score existed
        # yet for the institution.
        assert (
            db_session.query(InstitutionHealthScore)
            .filter(InstitutionHealthScore.institution_id == institution.id)
            .first()
            is None
        )

        response = client.post(
            "/api/v1/institution-health/alerts",
            headers=super_admin_headers,
            json={
                "institution_id": institution.id,
                "alert_type": "manual_review",
                "severity": "medium",
                "title": "Manual Review Needed",
                "description": "Flagged before any score existed",
            },
        )
        assert response.status_code == 201
        alert_id = response.json()["alert_id"]

        alert = db_session.query(InstitutionHealthAlert).filter(
            InstitutionHealthAlert.id == alert_id
        ).first()
        assert alert is not None
        assert alert.health_score_id is not None

        score = (
            db_session.query(InstitutionHealthScore)
            .filter(InstitutionHealthScore.institution_id == institution.id)
            .first()
        )
        assert score is not None
        assert alert.health_score_id == score.id

    def test_create_manual_alert_institution_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.post(
            "/api/v1/institution-health/alerts",
            headers=super_admin_headers,
            json={
                "institution_id": 9999999,
                "alert_type": "manual_review",
                "severity": "low",
                "title": "x",
                "description": "y",
            },
        )
        assert response.status_code == 404

    # ---- GET /churn-predictions ----

    def test_churn_predictions_filters_by_min_probability(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        high_risk = _health_score(institution.id, churn_probability=0.9, risk_level="critical")
        db_session.add(high_risk)
        db_session.commit()

        response = client.get(
            "/api/v1/institution-health/churn-predictions",
            headers=super_admin_headers,
            params={"min_probability": 0.5},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(p["institution_id"] == institution.id for p in data)
        entry = next(p for p in data if p["institution_id"] == institution.id)
        assert entry["churn_probability"] == 0.9

        response = client.get(
            "/api/v1/institution-health/churn-predictions",
            headers=super_admin_headers,
            params={"min_probability": 0.95},
        )
        assert response.status_code == 200
        assert all(p["institution_id"] != institution.id for p in response.json())

    def test_churn_predictions_invalid_probability_validation_error(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-health/churn-predictions",
            headers=super_admin_headers,
            params={"min_probability": 1.5},
        )
        assert response.status_code == 422

    # ---- GET /trends/{institution_id} ----

    def test_health_trend_not_found_institution(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-health/trends/9999999", headers=super_admin_headers
        )
        assert response.status_code == 404

    def test_health_trend_no_score_yet(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        response = client.get(
            f"/api/v1/institution-health/trends/{institution.id}",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_health_trend_happy_path(
        self, client: TestClient, super_admin_headers: dict, institution: Institution, db_session: Session
    ):
        score = _health_score(institution.id, overall=70.0)
        db_session.add(score)
        db_session.commit()

        history = InstitutionHealthHistory(
            health_score_id=score.id,
            institution_id=institution.id,
            overall_health_score=50.0,
            payment_health_score=50.0,
            user_activity_score=50.0,
            support_ticket_score=50.0,
            feature_adoption_score=50.0,
            data_quality_score=50.0,
            churn_risk_score=30.0,
            churn_probability=0.3,
            risk_level="medium",
            # get_health_trend's score_30d_ago query requires
            # `recorded_at <= (now - 30 days)`, so this needs to be older
            # than 30 days (not just within the last 30). MySQL DATETIME
            # here has no fractional-seconds precision, so backdate a
            # further few seconds past that boundary to avoid
            # same-second flakiness too.
            recorded_at=datetime.utcnow() - timedelta(days=35, seconds=5),
        )
        db_session.add(history)
        db_session.commit()

        response = client.get(
            f"/api/v1/institution-health/trends/{institution.id}",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["trend_direction"] == "improving"
        assert data["score_change_30d"] == 20.0
        assert "predicted_score_30d" in data
        assert 0 <= data["confidence"] <= 1

    # ---- ML model endpoints ----

    def test_train_churn_model_not_enough_data(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        # Fewer than 10 active institutions exist in this isolated test
        # transaction, so the service reports a clean 400 instead of
        # attempting to fit a model on too little data.
        response = client.post(
            "/api/v1/institution-health/ml-model/train",
            headers=super_admin_headers,
            json={"validation_split": 0.2},
        )
        assert response.status_code == 400
        assert "error" in response.json()["detail"].lower() or "enough" in response.json()["detail"].lower()

    def test_train_churn_model_invalid_validation_split(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.post(
            "/api/v1/institution-health/ml-model/train",
            headers=super_admin_headers,
            json={"validation_split": 0.9},
        )
        assert response.status_code == 422

    def test_train_churn_model_happy_path_with_enough_institutions(
        self, client: TestClient, super_admin_headers: dict, db_session: Session
    ):
        # Need >=10 active institutions in this same isolated transaction,
        # with at least one churned (canceled/expired) and one not, so the
        # classifier actually has two classes to learn from.
        institutions = []
        for i in range(11):
            suffix = uuid.uuid4().hex[:10]
            inst = Institution(
                name=f"ML Train School {i}-{suffix}",
                slug=f"ml-train-school-{i}-{suffix}",
                phone="+1234567890",
                address="1 Test Ave",
                is_active=True,
            )
            db_session.add(inst)
            institutions.append(inst)
        db_session.commit()
        for inst in institutions:
            db_session.refresh(inst)

        for idx, inst in enumerate(institutions):
            status_value = SubscriptionStatus.CANCELED if idx % 2 == 0 else SubscriptionStatus.ACTIVE
            sub = Subscription(
                institution_id=inst.id,
                plan_name="Starter",
                status=status_value,
                billing_cycle="monthly",
                price=Decimal("999.00"),
                currency="INR",
                start_date=datetime.utcnow() - timedelta(days=60),
            )
            db_session.add(sub)
        db_session.commit()

        response = client.post(
            "/api/v1/institution-health/ml-model/train",
            headers=super_admin_headers,
            json={},
        )
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "model_version" in data["metrics"]
        assert 0 <= data["metrics"]["accuracy"] <= 1

    def test_model_performance_not_found_when_no_active_model(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-health/ml-model/performance",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_model_performance_requires_super_admin(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.get(
            "/api/v1/institution-health/ml-model/performance", headers=auth_headers
        )
        assert response.status_code == 403
