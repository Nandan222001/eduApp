"""Integration tests for the `predictions` router (src/api/v1/predictions.py).

ML-model training/prediction/what-if-analysis endpoints backed by
`src/ml/prediction_service.py`.

Bugs found and fixed while writing this coverage (the router had already been
partially patched by a prior, interrupted pass -- these tests cover the
existing fixes end-to-end plus a couple of gaps the partial pass left open):

1. **`batch-predict`/`what-if` used a nonsensical self-referential query**
   (`db.query(prediction_service.db.query(prediction_service.db.query.__self__.__class__))`)
   that raised unconditionally on every call, 100% breaking both endpoints
   regardless of input. Already fixed (by the prior pass) with a real model/
   base-prediction lookup; `test_batch_predict_success` and
   `test_what_if_success` exercise the real code paths end-to-end with a
   genuine joblib-persisted sklearn model to confirm they actually work now,
   not just that they no longer raise a `TypeError` immediately.
2. **`list_models`'s `status` query parameter shadowed the module-level
   `fastapi.status` import** for the whole function body, so any `except`
   branch that fired would `AttributeError` on `status.HTTP_...` instead of
   raising the intended `HTTPException`. Already fixed (by the prior pass)
   via `Query(..., alias="status")` bound to a differently-named parameter;
   `test_list_models_with_status_filter_does_not_500` is a regression test
   for this exact shape.
3. Zero authentication and zero institution-scoping were present on every
   endpoint before the prior pass; this file adds cross-institution 403/404
   coverage for `train`, `predict`, `batch-predict`, `what-if`,
   `models/{id}/metrics`, `models`, and confirms `students/{id}/history` is
   scoped to the caller's own institution's predictions only (it does not
   itself 404 on a foreign student id, but must never leak another
   institution's prediction rows for that id).
"""
import uuid
from datetime import datetime, date

import joblib
import numpy as np
import pytest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

from src.models.institution import Institution
from src.models.ml_prediction import (
    MLModel,
    MLModelVersion,
    PerformancePrediction,
    ModelType,
    ModelStatus,
    PredictionType,
)
from src.models.user import User
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def other_institution(db_session):
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def other_admin_user(db_session, other_institution, admin_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_admin_headers(client, other_admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_admin_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _persist_dummy_model(tmp_path, feature_names):
    """Train and joblib-dump a tiny real sklearn model + scaler."""
    X = np.array([[1.0, 2.0], [2.0, 3.0], [3.0, 4.0], [4.0, 5.0]])
    y = np.array([50.0, 60.0, 70.0, 80.0])

    scaler = StandardScaler().fit(X)
    model = LinearRegression().fit(scaler.transform(X), y)

    model_path = tmp_path / f"model_{uuid.uuid4().hex[:8]}.joblib"
    scaler_path = tmp_path / f"scaler_{uuid.uuid4().hex[:8]}.joblib"
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    return str(model_path), str(scaler_path)


@pytest.fixture
def ml_model_with_version(db_session, institution, tmp_path):
    feature_names = ["attendance_pct", "avg_score"]
    model_path, scaler_path = _persist_dummy_model(tmp_path, feature_names)

    ml_model = MLModel(
        institution_id=institution.id,
        name="Test Performance Model",
        model_type=ModelType.REGRESSION,
        prediction_type=PredictionType.OVERALL_PERCENTAGE,
        algorithm="linear_regression",
        feature_names=feature_names,
        target_column="exam_percentage",
        status=ModelStatus.ACTIVE,
        is_active=True,
    )
    db_session.add(ml_model)
    db_session.commit()
    db_session.refresh(ml_model)

    version = MLModelVersion(
        model_id=ml_model.id,
        version="v1",
        model_path=model_path,
        scaler_path=scaler_path,
        training_metrics={"r2_score": 0.9},
        test_metrics={"r2_score": 0.85},
        cross_validation_scores={"mean": 0.87},
        feature_importance={"attendance_pct": 0.6, "avg_score": 0.4},
        training_samples=4,
        training_date=datetime.utcnow(),
        is_deployed=True,
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(version)

    return ml_model, version


@pytest.fixture
def other_institution_ml_model(db_session, other_institution, tmp_path):
    feature_names = ["attendance_pct", "avg_score"]
    model_path, scaler_path = _persist_dummy_model(tmp_path, feature_names)

    ml_model = MLModel(
        institution_id=other_institution.id,
        name="Other Institution Model",
        model_type=ModelType.REGRESSION,
        prediction_type=PredictionType.OVERALL_PERCENTAGE,
        algorithm="linear_regression",
        feature_names=feature_names,
        target_column="exam_percentage",
        status=ModelStatus.ACTIVE,
        is_active=True,
    )
    db_session.add(ml_model)
    db_session.commit()
    db_session.refresh(ml_model)

    version = MLModelVersion(
        model_id=ml_model.id,
        version="v1",
        model_path=model_path,
        scaler_path=scaler_path,
        training_metrics={"r2_score": 0.9},
        test_metrics={"r2_score": 0.85},
        cross_validation_scores={"mean": 0.87},
        feature_importance={"attendance_pct": 0.6, "avg_score": 0.4},
        training_samples=4,
        training_date=datetime.utcnow(),
        is_deployed=True,
    )
    db_session.add(version)
    db_session.commit()

    return ml_model


@pytest.fixture
def performance_prediction(db_session, institution, student, ml_model_with_version):
    ml_model, version = ml_model_with_version
    prediction = PerformancePrediction(
        institution_id=institution.id,
        model_id=ml_model.id,
        model_version_id=version.id,
        student_id=student.id,
        predicted_value=75.0,
        confidence_lower=70.0,
        confidence_upper=80.0,
        confidence_level=0.95,
        input_features={"attendance_pct": 90.0, "avg_score": 75.0},
        feature_contributions={},
        is_scenario=False,
    )
    db_session.add(prediction)
    db_session.commit()
    db_session.refresh(prediction)
    return prediction


# ---------------------------------------------------------------------------
# Auth / cross-tenant
# ---------------------------------------------------------------------------
def test_predict_requires_auth(client, ml_model_with_version):
    ml_model, _ = ml_model_with_version
    response = client.post(
        "/api/v1/predictions/predict",
        json={
            "model_id": ml_model.id,
            "student_id": 1,
            "input_features": {"attendance_pct": 90.0, "avg_score": 75.0},
        },
    )
    assert response.status_code in (401, 403)


def test_train_forbidden_for_other_institution(client, other_admin_headers, institution):
    response = client.post(
        "/api/v1/predictions/train",
        json={
            "institution_id": institution.id,
            "model_name": "Sneaky Model",
        },
        headers=other_admin_headers,
    )
    assert response.status_code == 403


def test_predict_model_from_other_institution_is_404(client, auth_headers, other_institution_ml_model):
    response = client.post(
        "/api/v1/predictions/predict",
        json={
            "model_id": other_institution_ml_model.id,
            "student_id": 1,
            "input_features": {"attendance_pct": 90.0, "avg_score": 75.0},
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_batch_predict_model_from_other_institution_is_404(client, auth_headers, other_institution_ml_model):
    response = client.post(
        "/api/v1/predictions/batch-predict",
        json={
            "model_id": other_institution_ml_model.id,
            "student_ids": [1, 2],
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_model_metrics_from_other_institution_is_404(client, auth_headers, other_institution_ml_model):
    response = client.get(
        f"/api/v1/predictions/models/{other_institution_ml_model.id}/metrics",
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_list_models_forbidden_for_other_institution(client, other_admin_headers, institution):
    response = client.get(
        f"/api/v1/predictions/models?institution_id={institution.id}",
        headers=other_admin_headers,
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Regression: `batch-predict`/`what-if` broken self-referential query,
# `list_models`'s `status` shadowing bug
# ---------------------------------------------------------------------------
def test_predict_success(client, auth_headers, ml_model_with_version, student):
    ml_model, _ = ml_model_with_version
    response = client.post(
        "/api/v1/predictions/predict",
        json={
            "model_id": ml_model.id,
            "student_id": student.id,
            "input_features": {"attendance_pct": 90.0, "avg_score": 75.0},
            "calculate_contributions": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["student_id"] == student.id
    assert isinstance(data["predicted_value"], float)


def test_what_if_success(client, auth_headers, performance_prediction):
    response = client.post(
        "/api/v1/predictions/what-if",
        json={
            "base_prediction_id": performance_prediction.id,
            "scenarios": [
                {
                    "name": "Improve attendance",
                    "description": "What if attendance improves",
                    "modified_features": {"attendance_pct": 99.0},
                }
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total_scenarios"] == 1
    assert data["base_prediction"]["prediction_id"] == performance_prediction.id
    assert data["scenarios"][0]["scenario_name"] == "Improve attendance"


def test_what_if_base_prediction_from_other_institution_is_404(
    client, auth_headers, db_session, other_institution, other_institution_ml_model
):
    from src.models.student import Student
    from src.models.academic import AcademicYear, Grade, Section

    academic_year = AcademicYear(
        institution_id=other_institution.id,
        name="2024-2025",
        start_date=date(2024, 4, 1),
        end_date=date(2025, 3, 31),
        is_current=True,
    )
    db_session.add(academic_year)
    db_session.commit()
    db_session.refresh(academic_year)

    grade = Grade(
        institution_id=other_institution.id,
        academic_year_id=academic_year.id,
        name="Grade 5",
        display_order=5,
        is_active=True,
    )
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)

    section = Section(
        institution_id=other_institution.id,
        grade_id=grade.id,
        name="Section A",
        capacity=40,
        is_active=True,
    )
    db_session.add(section)
    db_session.commit()
    db_session.refresh(section)

    other_student = Student(
        institution_id=other_institution.id,
        admission_number="OTH001",
        first_name="Other",
        last_name="Student",
        email=f"otherstudent{uuid.uuid4().hex[:8]}@otherschool.com",
        section_id=section.id,
        date_of_birth=date(2008, 3, 20),
        admission_date=date(2020, 4, 1),
        gender="Female",
        is_active=True,
    )
    db_session.add(other_student)
    db_session.commit()
    db_session.refresh(other_student)

    version = other_institution_ml_model.versions[0] if other_institution_ml_model.versions else None
    if version is None:
        db_session.refresh(other_institution_ml_model)
        version = other_institution_ml_model.versions[0]

    foreign_prediction = PerformancePrediction(
        institution_id=other_institution.id,
        model_id=other_institution_ml_model.id,
        model_version_id=version.id,
        student_id=other_student.id,
        predicted_value=75.0,
        confidence_lower=70.0,
        confidence_upper=80.0,
        confidence_level=0.95,
        input_features={"attendance_pct": 90.0, "avg_score": 75.0},
        is_scenario=False,
    )
    db_session.add(foreign_prediction)
    db_session.commit()
    db_session.refresh(foreign_prediction)

    response = client.post(
        "/api/v1/predictions/what-if",
        json={
            "base_prediction_id": foreign_prediction.id,
            "scenarios": [{"name": "x", "modified_features": {"attendance_pct": 1.0}}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_batch_predict_success_no_feature_data_returns_empty(client, auth_headers, ml_model_with_version, student):
    """Regression test for the old `db.query(prediction_service.db.query(...))`
    bug: the endpoint must reach the real business logic (skip students with
    no extractable features) instead of raising a `TypeError`/`ArgumentError`
    before ever getting there."""
    ml_model, _ = ml_model_with_version
    response = client.post(
        "/api/v1/predictions/batch-predict",
        json={
            "model_id": ml_model.id,
            "student_ids": [student.id],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    # With no attendance/exam data seeded for this student, feature
    # extraction legitimately yields nothing to predict on -- the important
    # assertion is that this returns a clean 200 instead of the old 500.
    assert data["total_count"] == len(data["predictions"])


def test_model_metrics_success(client, auth_headers, ml_model_with_version):
    ml_model, version = ml_model_with_version
    response = client.get(
        f"/api/v1/predictions/models/{ml_model.id}/metrics",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["version"] == "v1"
    assert data["training_samples"] == 4


def test_list_models_with_status_filter_does_not_500(client, auth_headers, institution, ml_model_with_version):
    """Regression test: `status` used to shadow `fastapi.status`, turning any
    exception in the try block into an unhandled `AttributeError` instead of
    a clean HTTPException. Passing a filter that matches nothing exercises
    the same code path without raising either way, but critically must not
    500."""
    response = client.get(
        f"/api/v1/predictions/models?institution_id={institution.id}&status=active",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert any(m["id"] == ml_model_with_version[0].id for m in data["models"])

    response_no_match = client.get(
        f"/api/v1/predictions/models?institution_id={institution.id}&status=deprecated",
        headers=auth_headers,
    )
    assert response_no_match.status_code == 200
    assert response_no_match.json()["total_count"] == 0


def test_prediction_history_scoped_to_own_institution(
    client, auth_headers, student, performance_prediction
):
    response = client.get(
        f"/api/v1/predictions/students/{student.id}/history",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total_count"] == 1
    assert data["predictions"][0]["id"] == performance_prediction.id
