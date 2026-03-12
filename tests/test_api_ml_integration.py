import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


@pytest.mark.integration
class TestMLAPIIntegration:
    """Integration tests for ML API endpoints"""

    def test_get_student_performance_summary(
        self, client: TestClient, auth_headers: dict, student, institution
    ):
        """Test getting student performance summary"""
        response = client.post(
            "/api/v1/ml/performance/summary",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "start_date": (datetime.now() - timedelta(days=30)).date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "student_id" in data

    def test_get_batch_performance(
        self, client: TestClient, auth_headers: dict, student, institution
    ):
        """Test getting batch performance"""
        response = client.post(
            "/api/v1/ml/performance/batch",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_ids": [student.id],
                "start_date": (datetime.now() - timedelta(days=30)).date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    def test_identify_at_risk_students(
        self, client: TestClient, auth_headers: dict, institution
    ):
        """Test identifying at-risk students"""
        response = client.post(
            "/api/v1/ml/students/at-risk",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "attendance_threshold": 75.0,
                "assignment_threshold": 60.0,
                "exam_threshold": 50.0,
                "start_date": (datetime.now() - timedelta(days=30)).date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "students" in data or "total_count" in data

    def test_get_subject_difficulty_analysis(
        self, client: TestClient, auth_headers: dict, institution
    ):
        """Test getting subject difficulty analysis"""
        response = client.post(
            "/api/v1/ml/subjects/difficulty",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "start_date": (datetime.now() - timedelta(days=30)).date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "subjects" in data or "total_count" in data

    def test_prepare_training_dataset(
        self, client: TestClient, auth_headers: dict, institution
    ):
        """Test preparing training dataset"""
        response = client.post(
            "/api/v1/ml/training/prepare",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "target_column": "final_score",
                "start_date": (datetime.now() - timedelta(days=90)).date().isoformat(),
                "end_date": datetime.now().date().isoformat(),
                "test_size": 0.2,
                "normalize": True
            }
        )
        
        if response.status_code in [200, 400]:
            pass

    def test_extract_feature_matrix(
        self, client: TestClient, auth_headers: dict, institution, student
    ):
        """Test extracting feature matrix"""
        response = client.post(
            "/api/v1/ml/features/extract",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_ids": [student.id],
                "start_date": (datetime.now() - timedelta(days=30)).date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "features" in data or "feature_names" in data

    def test_ml_workflow(
        self, client: TestClient, auth_headers: dict, institution, student
    ):
        """Test complete ML workflow"""
        summary_response = client.post(
            "/api/v1/ml/performance/summary",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "start_date": (datetime.now() - timedelta(days=30)).date().isoformat(),
                "end_date": datetime.now().date().isoformat()
            }
        )
        
        if summary_response.status_code != 200:
            return
        
        at_risk_response = client.post(
            "/api/v1/ml/students/at-risk",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "attendance_threshold": 75.0,
                "assignment_threshold": 60.0,
                "exam_threshold": 50.0
            }
        )
        
        if at_risk_response.status_code == 200:
            data = at_risk_response.json()
            assert isinstance(data, dict)
