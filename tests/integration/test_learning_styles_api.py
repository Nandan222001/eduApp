import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student
from src.models.user import User


def _login_headers(client: TestClient, user: User) -> dict:
    """Real login (not a hand-crafted JWT) so a matching session exists in
    the client fixture's fake Redis, same pattern as conftest's
    auth_headers fixture but for a non-admin user (here: a student user,
    needed for endpoints that read current_user.student_profile)."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password123"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
class TestLearningStylesAPI:
    """Integration tests for /api/v1/learning-styles/*, the real, mounted
    router (src/api/v1/learning_styles.py) backed by
    src/models/learning_styles.py and src/services/learning_styles_service.py,
    src/services/learning_content_recommendation_service.py,
    src/services/adaptive_learning_service.py (all written this session, see
    TESTING_PROGRESS.md). Covers the central profile/assessment
    create-read-update paths, the quiz-scoring endpoint that writes to the
    profile table directly, effectiveness recording + analytics, the
    adaptive-session lifecycle, and the recommendation/feed generation
    endpoints. No external network calls are involved anywhere in this
    router, so nothing needed to be skipped/mocked for that reason."""

    def test_create_get_update_profile(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        response = client.post(
            "/api/v1/learning-styles/profiles",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "visual_score": "0.40",
                "auditory_score": "0.30",
                "kinesthetic_score": "0.20",
                "reading_writing_score": "0.10",
                "social_vs_solitary": "social",
                "social_score": "0.60",
                "sequential_vs_global": "sequential",
                "sequential_score": "0.55",
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["dominant_style"] == "visual"
        assert data["total_assessments"] == 0
        assert data["is_verified"] is False

        response = client.get(
            f"/api/v1/learning-styles/profiles/{student.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["dominant_style"] == "visual"

        response = client.put(
            f"/api/v1/learning-styles/profiles/{student.id}",
            headers=auth_headers,
            json={
                "visual_score": "0.10",
                "auditory_score": "0.60",
                "kinesthetic_score": "0.20",
                "reading_writing_score": "0.10",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["dominant_style"] == "auditory"
        assert float(data["auditory_score"]) == 0.60

    def test_get_profile_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get(
            "/api/v1/learning-styles/profiles/999999", headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_profile_not_found(self, client: TestClient, auth_headers: dict):
        response = client.put(
            "/api/v1/learning-styles/profiles/999999",
            headers=auth_headers,
            json={"visual_score": "0.5"},
        )
        assert response.status_code == 404

    def test_assessment_create_start_submit_and_list(
        self,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        student_user: User,
    ):
        questions = [
            {"id": 1, "style_weights": {"visual": 1.0}},
            {"id": 2, "style_weights": {"auditory": 1.0}},
            {"id": 3, "style_weights": {"kinesthetic": 1.0}},
        ]
        response = client.post(
            "/api/v1/learning-styles/assessments",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "assessment_type": "vark",
                "questions": questions,
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "pending"
        assert data["student_id"] == student.id
        assessment_id = data["id"]

        response = client.post(
            f"/api/v1/learning-styles/assessments/{assessment_id}/start",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["started_at"] is not None

        # Submitting requires current_user.student_profile, so log in as the
        # student's own user account rather than the admin fixture.
        student_headers = _login_headers(client, student_user)
        response = client.post(
            "/api/v1/learning-styles/assessments/submit",
            headers=student_headers,
            json={
                "assessment_id": assessment_id,
                "responses": [
                    {"question_id": 1, "answer": "a"},
                    {"question_id": 2, "answer": "b"},
                    {"question_id": 3, "answer": "c"},
                ],
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None
        assert data["visual_score"] is not None
        assert data["cognitive_analysis"]["dominant_modality"] in (
            "visual",
            "auditory",
            "kinesthetic",
            "reading_writing",
        )

        response = client.get(
            f"/api/v1/learning-styles/assessments/student/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        listed = response.json()
        assert len(listed) == 1
        assert listed[0]["id"] == assessment_id

        # submit_assessment also rolls the scores up into the profile.
        response = client.get(
            f"/api/v1/learning-styles/profiles/{student.id}", headers=auth_headers
        )
        assert response.status_code == 200
        profile = response.json()
        assert profile["total_assessments"] == 1
        assert profile["last_assessment_date"] is not None

    def test_submit_student_assessment_quiz_path(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        """POST /students/{student_id}/assessment is a second, separate
        scoring path that writes straight to LearningStyleProfile (not via
        LearningStylesService) -- see the model's docstring comment."""
        answers = [
            {"category_impact": {"visual": 3, "reading_writing": 1}},
            {"category_impact": {"visual": 2}},
        ]
        response = client.post(
            f"/api/v1/learning-styles/students/{student.id}/assessment",
            headers=auth_headers,
            json=answers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["primary_style"] == "visual"
        assert data["secondary_style"] == "reading_writing"
        assert data["completed_at"] is not None
        assert data["preferences"]["preferred_formats"] == ["video", "article"]

        # Calling it again for the same student must update the existing
        # profile row in place, not error on the unique student_id column.
        answers2 = [{"category_impact": {"auditory": 5}}]
        response = client.post(
            f"/api/v1/learning-styles/students/{student.id}/assessment",
            headers=auth_headers,
            json=answers2,
        )
        assert response.status_code == 200
        assert response.json()["primary_style"] == "auditory"

        response = client.get(
            f"/api/v1/learning-styles/students/{student.id}/parent-guide",
            headers=auth_headers,
        )
        assert response.status_code == 200
        guide = response.json()
        assert guide["primary_style"] == "auditory"
        assert len(guide["strengths"]) > 0
        assert len(guide["home_strategies"]) > 0

    def test_content_tag_create_get_update(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/learning-styles/content-tags",
            headers=auth_headers,
            json={
                "content_type": "study_material",
                "content_id": 4321,
                "delivery_format": "video",
                "metadata": {"source": "test-suite"},
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["content_id"] == 4321
        # Confirms the metadata/metadata_json reserved-name split round-trips
        # correctly end to end (API key stays "metadata").
        assert data["metadata"] == {"source": "test-suite"}

        response = client.get(
            "/api/v1/learning-styles/content-tags/study_material/4321",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["metadata"] == {"source": "test-suite"}

        response = client.put(
            "/api/v1/learning-styles/content-tags/study_material/4321",
            headers=auth_headers,
            json={"difficulty_level": "easy"},
        )
        assert response.status_code == 200
        assert response.json()["difficulty_level"] == "easy"

    def test_content_tag_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get(
            "/api/v1/learning-styles/content-tags/study_material/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_effectiveness_record_and_analytics(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        response = client.post(
            "/api/v1/learning-styles/effectiveness",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "content_type": "study_material",
                "content_id": 7,
                "delivery_format": "video",
                "time_spent_seconds": 300,
                "completion_rate": "0.80",
                "engagement_score": "0.75",
                "pre_assessment_score": "60",
                "post_assessment_score": "80",
                "improvement": "20",
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["delivery_format"] == "video"

        response = client.get(
            f"/api/v1/learning-styles/analytics/effectiveness/{student.id}",
            headers=auth_headers,
            params={"days": 30},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_records"] == 1
        assert "video" in data["by_format"]
        assert data["by_format"]["video"]["count"] == 1
        assert data["overall_metrics"]["total_records"] == 1
        assert len(data["recommendations"]) == 1

        response = client.get(
            f"/api/v1/learning-styles/effectiveness/analysis/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        analysis = response.json()
        assert "video" in analysis
        assert analysis["video"]["usage_count"] == 1

    def test_adaptive_session_lifecycle(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        response = client.post(
            "/api/v1/learning-styles/adaptive-sessions",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "content_type": "study_material",
                "content_id": 55,
                "initial_format": "video",
                "initial_difficulty": "medium",
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["current_difficulty"] == "medium"
        assert data["current_format"] == "video"
        session_id = data["id"]

        response = client.post(
            f"/api/v1/learning-styles/adaptive-sessions/{session_id}/adjust-difficulty",
            headers=auth_headers,
            json={"success_rate": 0.9, "questions_attempted": 10, "questions_correct": 9},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["new_difficulty"] == "hard"
        assert data["previous_difficulty"] == "medium"

        response = client.post(
            f"/api/v1/learning-styles/adaptive-sessions/{session_id}/adjust-format",
            headers=auth_headers,
            json={
                "engagement_rate": 0.9,
                "time_spent_seconds": 60,
                "interaction_count": 5,
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["format_changed"] is False
        assert data["recommended_format"] == "video"

        response = client.post(
            f"/api/v1/learning-styles/adaptive-sessions/{session_id}/update-performance",
            headers=auth_headers,
            json={"score": 95},
        )
        assert response.status_code == 200

        response = client.post(
            f"/api/v1/learning-styles/adaptive-sessions/{session_id}/end",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["ended_at"] is not None

        response = client.get(
            f"/api/v1/learning-styles/adaptive-sessions/performance-trend/{student.id}",
            headers=auth_headers,
            params={"days": 30},
        )
        assert response.status_code == 200
        trend = response.json()
        assert trend["total_sessions"] == 1
        assert trend["average_success_rate"] == 0.9

    def test_end_adaptive_session_not_found(
        self, client: TestClient, auth_headers: dict
    ):
        # AdaptiveLearningService.end_learning_session returns None (via
        # `if session:`) when no row matches, and the router 404s on that.
        response = client.post(
            "/api/v1/learning-styles/adaptive-sessions/999999/end",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_generate_recommendations_and_feed_without_profile(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        """No LearningStyleProfile exists yet for this student -- both
        generation endpoints short-circuit to an empty list rather than
        erroring (LearningContentRecommendationService.generate_recommendations
        returns [] when profile is None)."""
        response = client.post(
            "/api/v1/learning-styles/recommendations/generate",
            headers=auth_headers,
            json={"student_id": student.id, "limit": 5},
        )
        assert response.status_code == 200
        assert response.json() == []

        response = client.post(
            "/api/v1/learning-styles/feed/generate",
            headers=auth_headers,
            json={"student_id": student.id, "limit": 5},
        )
        assert response.status_code == 200
        assert response.json() == []

        response = client.get(
            f"/api/v1/learning-styles/feed/{student.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == []

        response = client.get(
            f"/api/v1/learning-styles/recommendations/effectiveness/{student.id}",
            headers=auth_headers,
            params={"days": 30},
        )
        assert response.status_code == 200
        assert response.json()["total_recommendations"] == 0

    def test_default_assessment_questions_and_study_tips(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.get(
            "/api/v1/learning-styles/default-assessment-questions",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()["questions"]) == 5

        response = client.get(
            "/api/v1/learning-styles/questions", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 8

        response = client.get(
            "/api/v1/learning-styles/study-tips/visual", headers=auth_headers
        )
        assert response.status_code == 200
        tips = response.json()
        assert len(tips) > 0
        assert all(t["learning_style"] == "visual" for t in tips)

        response = client.get(
            "/api/v1/learning-styles/study-tips/all", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) > len(tips)

        response = client.get(
            "/api/v1/learning-styles/study-tips/unknown_style", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == []
