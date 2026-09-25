"""Integration tests for the `ml_monitoring` router (src/api/v1/ml_monitoring.py).

Model-health dashboard for the prediction ML models (drift detection,
performance degradation, confidence trends, comprehensive reports,
automatic retraining trigger, institution-wide overview, prediction
timeline, feature-importance trends). `GET /ml-monitoring/health` is a
plain liveness probe and is intentionally public.

Bugs found and fixed while writing this coverage:

1. **Every real endpoint (10 of 11) had zero authentication** (the most
   severe bug class this audit checks for) -- none declared any
   `Depends(get_current_user)`-style dependency, so an unauthenticated
   caller could pull drift/performance/confidence data for any model in
   the system, or **trigger a real retraining job**
   (`POST /models/{id}/retraining/trigger`) for any model, just by
   guessing/incrementing `model_id`. Fixed by adding
   `current_user: User = Depends(get_current_user)` to every endpoint
   except `/health`.
2. **No tenant/ownership check on `model_id` or `institution_id` at all**
   (bug class 12, cross-tenant gap) -- even once authenticated, nothing
   stopped an authenticated user from institution A from passing an
   arbitrary `model_id`/`institution_id` belonging to institution B and
   reading (or retraining) that institution's models. Added
   `_verify_model_access` (checked against `MLModel.institution_id`) to
   every `/models/{model_id}/...` route, and an equivalent inline check on
   `GET /institutions/{institution_id}/overview`. Superusers bypass both
   checks, matching this codebase's existing convention (e.g.
   `require_roles`).

3. **Every "insufficient data" early-return in `ModelMonitoringService` was
   missing the `checked_at` field its own response schema requires**
   (schema/service drift) -- `detect_prediction_drift` (2 branches),
   `detect_feature_drift`, `monitor_performance_degradation` (2 branches)
   and `analyze_confidence_trends` all return early with a short dict when
   there isn't enough data yet, but none of those dicts included
   `checked_at`, while `PredictionDriftResponse`/`FeatureDriftResponse`/
   `PerformanceDegradationResponse`/`ConfidenceTrendsResponse` all declare
   it as a required (non-`Optional`) `str`. Constructing the response model
   from the incomplete dict raised a pydantic `ValidationError` -- which,
   because `ValidationError` subclasses `ValueError`, was then swallowed by
   the router's `except ValueError as e: raise HTTPException(404, ...)`
   handler. The practical effect: **every drift/degradation/confidence
   endpoint returned a misleading 404 "not found" instead of the intended
   200 with `reason: "Insufficient ... predictions"` whenever a model was
   new or had too little recent prediction traffic** -- exactly the common
   case for a newly-deployed model, i.e. the routine, everyday path through
   this dashboard. Fixed by adding `'checked_at': datetime.utcnow().isoformat()`
   to all 6 early-return dicts.

Otherwise, `src/ml/model_monitoring.py` was read end-to-end (both
`ModelMonitoringService` and `MonitoringDashboardService`) and the
`MLModel`/`MLModelVersion`/`PerformancePrediction` models it queries -- no
`func.count(...).filter()`, async/sync, or Decimal-under-`Dict[str,Any]`
bugs found there; every numeric result is explicitly cast with
`float()`/`int()` before being returned, and the module correctly uses
sync SQLAlchemy throughout.
"""
from datetime import datetime, timedelta

import pytest

from src.models.ml_prediction import MLModel, MLModelVersion, ModelType, ModelStatus, PredictionType


@pytest.fixture
def ml_model(db_session, institution):
    model = MLModel(
        institution_id=institution.id,
        name="overall_predictor",
        model_type=ModelType.REGRESSION,
        prediction_type=PredictionType.OVERALL_PERCENTAGE,
        algorithm="random_forest",
        feature_names=["attendance_rate"],
        target_column="exam_percentage",
        status=ModelStatus.ACTIVE,
        is_active=True,
    )
    db_session.add(model)
    db_session.commit()
    db_session.refresh(model)
    return model


@pytest.fixture
def deployed_version(db_session, ml_model):
    version = MLModelVersion(
        model_id=ml_model.id,
        version="v1",
        model_path="/models/v1.pkl",
        training_samples=500,
        training_date=datetime.utcnow(),
        is_deployed=True,
        test_metrics={"r2_score": 0.85, "mae": 3.2, "rmse": 4.1},
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)
    return version


@pytest.fixture
def other_institution_model(db_session):
    from src.models.institution import Institution
    import uuid

    unique_suffix = uuid.uuid4().hex[:12]
    other_inst = Institution(
        name=f"Other School {unique_suffix}",
        slug=f"other-school-{unique_suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country 54321",
        is_active=True,
    )
    db_session.add(other_inst)
    db_session.commit()
    db_session.refresh(other_inst)

    model = MLModel(
        institution_id=other_inst.id,
        name="other_predictor",
        model_type=ModelType.REGRESSION,
        prediction_type=PredictionType.OVERALL_PERCENTAGE,
        algorithm="random_forest",
        feature_names=["attendance_rate"],
        target_column="exam_percentage",
        status=ModelStatus.ACTIVE,
        is_active=True,
    )
    db_session.add(model)
    db_session.commit()
    db_session.refresh(model)
    return model


class TestHealthCheck:
    def test_health_check_is_public(self, client):
        response = client.get("/api/v1/ml-monitoring/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthRequired:
    def test_drift_predictions_requires_auth(self, client, ml_model):
        response = client.get(f"/api/v1/ml-monitoring/models/{ml_model.id}/drift/predictions")
        assert response.status_code == 403

    def test_retraining_trigger_requires_auth(self, client, ml_model):
        response = client.post(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/retraining/trigger",
            json={},
        )
        assert response.status_code == 403

    def test_institution_overview_requires_auth(self, client, institution):
        response = client.get(f"/api/v1/ml-monitoring/institutions/{institution.id}/overview")
        assert response.status_code == 403


class TestModelAccessScoping:
    def test_unknown_model_404(self, client, auth_headers):
        response = client.get(
            "/api/v1/ml-monitoring/models/999999/drift/predictions",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_model_403(self, client, auth_headers, other_institution_model):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{other_institution_model.id}/drift/predictions",
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_cross_institution_overview_403(self, client, auth_headers, other_institution_model):
        response = client.get(
            f"/api/v1/ml-monitoring/institutions/{other_institution_model.institution_id}/overview",
            headers=auth_headers,
        )
        assert response.status_code == 403


class TestDriftEndpoints:
    def test_prediction_drift_no_active_version_404(self, client, auth_headers, ml_model):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/drift/predictions",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_prediction_drift_insufficient_data(self, client, auth_headers, ml_model, deployed_version):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/drift/predictions",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["drift_detected"] is False
        assert data["reason"] == "Insufficient recent predictions"

    def test_feature_drift_insufficient_data(self, client, auth_headers, ml_model, deployed_version):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/drift/features",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["drift_detected"] is False


class TestPerformanceAndConfidence:
    def test_performance_degradation_with_baseline_metrics(self, client, auth_headers, ml_model, deployed_version):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/performance/degradation",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["degradation_detected"] is False
        assert data["reason"] == "Insufficient recent predictions"

    def test_confidence_trends_insufficient_data(self, client, auth_headers, ml_model, deployed_version):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/confidence/trends",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["trend_detected"] is False


class TestComprehensiveReport:
    def test_comprehensive_report(self, client, auth_headers, ml_model, deployed_version):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/report/comprehensive",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["model_id"] == ml_model.id
        assert data["model_name"] == ml_model.name
        assert data["model_health_score"] == 100.0
        assert data["health_status"] == "excellent"
        assert data["retraining_recommended"] is False

    def test_comprehensive_report_no_version_404(self, client, auth_headers, ml_model):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/report/comprehensive",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestRetrainingTrigger:
    def test_trigger_retraining_returns_200_even_on_internal_failure(self, client, auth_headers, ml_model):
        # trigger_automatic_retraining wraps the actual training pipeline
        # call in try/except and always returns 200 with a
        # retraining_status field ("success" or "failed") -- it never
        # raises for a training failure, only for an unknown model_id.
        response = client.post(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/retraining/trigger",
            json={"auto_promote": False},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["retraining_status"] in ("success", "failed")

    def test_trigger_retraining_unknown_model_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/ml-monitoring/models/999999/retraining/trigger",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestInstitutionOverview:
    def test_overview_own_institution(self, client, auth_headers, institution, ml_model):
        response = client.get(
            f"/api/v1/ml-monitoring/institutions/{institution.id}/overview",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["total_models"] == 1


class TestTimelineAndFeatureImportance:
    def test_prediction_timeline_empty(self, client, auth_headers, ml_model):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/timeline/predictions",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["model_id"] == ml_model.id
        assert data["total_predictions"] == 0
        assert data["timeline"] == []

    def test_feature_importance_trends_no_versions(self, client, auth_headers, ml_model):
        response = client.get(
            f"/api/v1/ml-monitoring/models/{ml_model.id}/features/importance-trends",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["model_id"] == ml_model.id
        assert data["versions_analyzed"] == 0
