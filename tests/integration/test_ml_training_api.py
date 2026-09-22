import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.ml_prediction import MLModel, MLModelVersion, ModelType, ModelStatus, PredictionType


@pytest.fixture
def ml_model(db_session: Session, institution: Institution) -> MLModel:
    model = MLModel(
        institution_id=institution.id,
        name="performance_predictor",
        description="Predicts overall percentage",
        model_type=ModelType.REGRESSION,
        prediction_type=PredictionType.OVERALL_PERCENTAGE,
        algorithm="random_forest",
        feature_names=["attendance_rate", "assignment_avg"],
        target_column="exam_percentage",
        status=ModelStatus.ACTIVE,
        is_active=True,
    )
    db_session.add(model)
    db_session.commit()
    db_session.refresh(model)
    return model


@pytest.fixture
def champion_version(db_session: Session, ml_model: MLModel) -> MLModelVersion:
    version = MLModelVersion(
        model_id=ml_model.id,
        version="v1",
        model_path="/models/v1.pkl",
        training_metrics={"r2_score": 0.78},
        test_metrics={"r2_score": 0.75},
        validation_metrics={"r2_score": 0.7},
        cross_validation_scores={"mean": 0.72},
        feature_importance={"attendance_rate": 0.6, "assignment_avg": 0.4},
        training_samples=500,
        training_date=datetime.utcnow() - timedelta(days=5),
        is_deployed=True,
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)
    return version


@pytest.fixture
def challenger_version(db_session: Session, ml_model: MLModel) -> MLModelVersion:
    version = MLModelVersion(
        model_id=ml_model.id,
        version="v2",
        model_path="/models/v2.pkl",
        test_metrics={"r2_score": 0.85},
        validation_metrics={"r2_score": 0.8},
        cross_validation_scores={"mean": 0.82},
        training_samples=600,
        training_date=datetime.utcnow(),
        is_deployed=False,
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)
    return version


@pytest.mark.integration
class TestMlTrainingAPI:
    """Integration tests for /api/v1/ml-training/*, the real, mounted
    router (src/api/v1/ml_training.py) backed by src/models/ml_training.py
    (both written this session, see TESTING_PROGRESS.md's "ml_training"
    router fix). Covers the pure-DB endpoints; /train and
    /compare-and-promote dispatch real Celery tasks (no eager-mode broker
    in this test environment) so aren't exercised end-to-end here."""

    def test_get_training_schedule_defaults(self, client: TestClient, institution: Institution):
        response = client.get(f"/api/v1/ml-training/schedule/{institution.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["ml_training"]["enabled"] is False
        assert data["ml_training"]["model_name"] == "performance_predictor"

    def test_update_and_get_training_schedule(self, client: TestClient, institution: Institution):
        response = client.put(
            f"/api/v1/ml-training/schedule/{institution.id}",
            json={
                "config": {
                    "enabled": True,
                    "frequency_days": 14,
                    "model_name": "exam_predictor",
                    "algorithm": "gradient_boosting",
                }
            },
        )
        assert response.status_code == 200
        assert response.json()["ml_training"]["enabled"] is True

        response = client.get(f"/api/v1/ml-training/schedule/{institution.id}")
        assert response.status_code == 200
        data = response.json()["ml_training"]
        assert data["enabled"] is True
        assert data["frequency_days"] == 14
        assert data["model_name"] == "exam_predictor"

    def test_get_training_schedule_nonexistent_institution(self, client: TestClient):
        response = client.get("/api/v1/ml-training/schedule/999999")
        assert response.status_code == 404

    def test_training_history_for_model(
        self, client: TestClient, ml_model: MLModel, champion_version: MLModelVersion, challenger_version: MLModelVersion
    ):
        response = client.get(f"/api/v1/ml-training/history/{ml_model.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["model_name"] == "performance_predictor"
        assert data["total_count"] == 2
        versions = {item["version"] for item in data["history"]}
        assert versions == {"v1", "v2"}

    def test_training_history_nonexistent_model(self, client: TestClient):
        response = client.get("/api/v1/ml-training/history/999999")
        assert response.status_code == 404

    def test_all_training_history_for_institution(
        self, client: TestClient, institution: Institution, ml_model: MLModel, champion_version: MLModelVersion
    ):
        response = client.get(
            "/api/v1/ml-training/history",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["model_id"] == ml_model.id

    def test_model_version_detail(self, client: TestClient, champion_version: MLModelVersion):
        response = client.get(f"/api/v1/ml-training/version/{champion_version.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "v1"
        assert data["test_metrics"]["r2_score"] == 0.75

    def test_compare_model_versions(
        self, client: TestClient, champion_version: MLModelVersion, challenger_version: MLModelVersion
    ):
        response = client.post(
            "/api/v1/ml-training/compare",
            json={
                "champion_version_id": champion_version.id,
                "challenger_version_id": challenger_version.id,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["promote_challenger"] is True
        assert data["improvement"]["r2_improvement"] > 0

    def test_promote_model_version(
        self, client: TestClient, admin_user, champion_version: MLModelVersion, challenger_version: MLModelVersion
    ):
        response = client.post(
            "/api/v1/ml-training/promote",
            params={"deployed_by": admin_user.id},
            json={"model_version_id": challenger_version.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["promoted_version"] == "v2"
        assert data["previous_champion"] == "v1"

    def test_ab_test_status(
        self, client: TestClient, ml_model: MLModel, champion_version: MLModelVersion, challenger_version: MLModelVersion
    ):
        response = client.get(f"/api/v1/ml-training/ab-test/{ml_model.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["ab_test_enabled"] is True
        assert data["champion"]["version"] == "v1"
        assert data["challenger"]["version"] == "v2"

    def test_metrics_summary(
        self, client: TestClient, institution: Institution, ml_model: MLModel, champion_version: MLModelVersion, challenger_version: MLModelVersion
    ):
        response = client.get(
            "/api/v1/ml-training/metrics/summary",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_models"] == 1
        assert data["total_versions"] == 2
        assert data["best_r2_score"] == 0.85
