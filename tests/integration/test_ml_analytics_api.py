import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student
from src.models.ml_prediction import (
    MLModel,
    MLModelVersion,
    PerformancePrediction,
    ModelType,
    ModelStatus,
    PredictionType,
)


@pytest.fixture
def ml_model(db_session: Session, institution: Institution) -> MLModel:
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
def model_version(db_session: Session, ml_model: MLModel) -> MLModelVersion:
    version = MLModelVersion(
        model_id=ml_model.id,
        version="v1",
        model_path="/models/v1.pkl",
        training_samples=500,
        training_date=datetime.utcnow(),
        is_deployed=True,
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)
    return version


@pytest.fixture
def prediction(
    db_session: Session,
    institution: Institution,
    ml_model: MLModel,
    model_version: MLModelVersion,
    student: Student,
) -> PerformancePrediction:
    pred = PerformancePrediction(
        institution_id=institution.id,
        model_id=ml_model.id,
        model_version_id=model_version.id,
        student_id=student.id,
        predicted_value=82.5,
        confidence_lower=75.0,
        confidence_upper=90.0,
        confidence_level=0.9,
        input_features={"attendance_rate": 0.95},
        feature_contributions={"attendance_rate": 0.6},
        is_scenario=False,
        predicted_at=datetime.utcnow() - timedelta(days=1),
    )
    db_session.add(pred)
    db_session.commit()
    db_session.refresh(pred)
    return pred


@pytest.mark.integration
class TestMlAnalyticsAPI:
    """Integration tests for /api/v1/ml-analytics/*, the real, mounted
    router (src/api/v1/ml_analytics.py) backed by
    src/services/ml_analytics_integration_service.py. That service wraps
    traditional-analytics and ML-monitoring lookups in try/except and
    degrades to null/empty summaries on failure, so the unified-dashboard
    and schedule-monitoring endpoints are exercised against a minimal
    institution with no exam/attendance/model data (the light, robust
    path). Model-performance-analytics and accuracy-analysis exercise
    src/ml/model_monitoring.py's ModelMonitoringService against a real
    model+version+prediction fixture set."""

    def test_unified_dashboard_empty_institution(self, client: TestClient, institution: Institution):
        response = client.get(
            f"/api/v1/ml-analytics/institutions/{institution.id}/unified-dashboard",
            params={"days": 7},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["ml_models_summary"] == []

    def test_unified_dashboard_with_model(self, client: TestClient, institution: Institution, ml_model: MLModel):
        response = client.get(
            f"/api/v1/ml-analytics/institutions/{institution.id}/unified-dashboard"
        )
        assert response.status_code == 200
        data = response.json()
        summaries = data["ml_models_summary"]
        assert len(summaries) == 1
        assert summaries[0]["name"] == "overall_predictor"
        assert summaries[0]["status"] == "active"

    def test_student_ml_insights_no_predictions(self, client: TestClient, institution: Institution, student: Student):
        response = client.get(
            f"/api/v1/ml-analytics/students/{student.id}/ml-insights",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_predictions"] is False
        assert data["student_id"] == student.id

    def test_student_ml_insights_with_prediction(
        self, client: TestClient, institution: Institution, student: Student, prediction: PerformancePrediction
    ):
        response = client.get(
            f"/api/v1/ml-analytics/students/{student.id}/ml-insights",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_predictions"] is True
        assert data["total_predictions"] == 1
        assert data["latest_prediction"]["predicted_value"] == 82.5
        assert data["latest_prediction"]["model_name"] == "overall_predictor"
        assert data["prediction_trend"]["trend"] == "insufficient_data"

    def test_model_performance_analytics_nonexistent_model(self, client: TestClient):
        response = client.post(
            "/api/v1/ml-analytics/models/999999/accuracy-analysis",
            json={"actual_results": {}, "days": 30},
        )
        # Service filters by model_id with no existence check for
        # accuracy-analysis (unlike performance-analytics) -> empty
        # predictions -> analysis_available False, not a 404.
        assert response.status_code == 200
        assert response.json()["analysis_available"] is False

    def test_model_performance_analytics_404_for_get(self, client: TestClient):
        response = client.get("/api/v1/ml-analytics/models/999999/performance-analytics")
        assert response.status_code == 404

    def test_model_performance_analytics(
        self, client: TestClient, ml_model: MLModel, prediction: PerformancePrediction
    ):
        response = client.get(f"/api/v1/ml-analytics/models/{ml_model.id}/performance-analytics")
        assert response.status_code == 200
        data = response.json()
        assert data["model_id"] == ml_model.id
        assert data["model_name"] == "overall_predictor"
        assert data["usage_statistics"]["total_predictions"] == 1

    def test_accuracy_analysis_with_matching_student(
        self, client: TestClient, ml_model: MLModel, student: Student, prediction: PerformancePrediction
    ):
        response = client.post(
            f"/api/v1/ml-analytics/models/{ml_model.id}/accuracy-analysis",
            json={"actual_results": {str(student.id): 85.0}, "days": 30},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_available"] is True
        assert data["sample_size"] == 1
        assert data["accuracy_metrics"]["mae"] == pytest.approx(2.5)

    def test_schedule_monitoring_no_active_models(self, client: TestClient, institution: Institution):
        response = client.post(
            f"/api/v1/ml-analytics/institutions/{institution.id}/schedule-monitoring"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["institution_id"] == institution.id
        assert data["total_models_checked"] == 0
        assert data["check_results"] == []
