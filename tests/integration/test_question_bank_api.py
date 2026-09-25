"""Integration tests for the `question_bank` router (src/api/v1/question_bank.py).

Covers CRUD for the institution's reusable question bank (`QuestionBank`
rows, distinct from `quizzes.py`'s per-quiz `QuizQuestion`), search/filter
listing, facets/statistics, verification, image upload, usage tracking, and
AI tag suggestions.

Found and fixed one real cross-institution authorization gap in this router
as part of this pass: `GET /question-bank/paper/{paper_id}` never checked
that the requested `PreviousYearPaper` belonged to the caller's own
institution before returning its questions -- any authenticated user of any
institution could read another institution's question bank by paper id.
"""
import io
import uuid
from unittest.mock import patch

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.previous_year_papers import QuestionBank, PreviousYearPaper
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# A second institution + admin, for cross-institution 403/404 checks.
# ---------------------------------------------------------------------------
@pytest.fixture
def other_institution(db_session) -> Institution:
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
def other_admin_role(db_session) -> Role:
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_admin_role.id,
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


@pytest.fixture
def previous_year_paper(db_session, institution, grade, subject) -> PreviousYearPaper:
    paper = PreviousYearPaper(
        institution_id=institution.id,
        title="Board Exam 2023",
        board="cbse",
        year=2023,
        grade_id=grade.id,
        subject_id=subject.id,
    )
    db_session.add(paper)
    db_session.commit()
    db_session.refresh(paper)
    return paper


@pytest.fixture
def sample_question(db_session, institution, grade, subject) -> QuestionBank:
    question = QuestionBank(
        institution_id=institution.id,
        question_text="What is the capital of France?",
        question_type="short_answer",
        grade_id=grade.id,
        subject_id=subject.id,
        difficulty_level="easy",
        bloom_taxonomy_level="remember",
        marks=2,
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    return question


def _question_payload(institution_id, grade_id, subject_id, **overrides):
    payload = {
        "institution_id": institution_id,
        "question_text": "What is 5 + 7?",
        "question_type": "numerical",
        "grade_id": grade_id,
        "subject_id": subject_id,
        "difficulty_level": "medium",
        "bloom_taxonomy_level": "apply",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
class TestCreateQuestion:
    def test_create_question_success(self, client, auth_headers, institution, grade, subject):
        response = client.post(
            "/api/v1/question-bank/",
            json=_question_payload(institution.id, grade.id, subject.id),
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["question_text"] == "What is 5 + 7?"
        assert data["is_verified"] is False
        assert data["usage_count"] == 0

    def test_create_question_cross_institution_forbidden(self, client, auth_headers, other_institution, grade, subject):
        response = client.post(
            "/api/v1/question-bank/",
            json=_question_payload(other_institution.id, grade.id, subject.id),
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_question_missing_required_field_validation_error(self, client, auth_headers, institution, grade, subject):
        payload = _question_payload(institution.id, grade.id, subject.id)
        del payload["question_text"]
        response = client.post("/api/v1/question-bank/", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_create_question_unauthenticated(self, client, institution, grade, subject):
        response = client.post(
            "/api/v1/question-bank/",
            json=_question_payload(institution.id, grade.id, subject.id),
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------
class TestListQuestions:
    def test_list_questions_scoped_to_own_institution(
        self, client, auth_headers, sample_question, db_session, other_institution, grade, subject
    ):
        other_question = QuestionBank(
            institution_id=other_institution.id,
            question_text="Other institution question",
            question_type="short_answer",
            grade_id=grade.id,
            subject_id=subject.id,
            difficulty_level="easy",
            bloom_taxonomy_level="remember",
        )
        db_session.add(other_question)
        db_session.commit()

        response = client.get("/api/v1/question-bank/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        texts = [q["question_text"] for q in data["items"]]
        assert sample_question.question_text in texts
        assert "Other institution question" not in texts
        assert data["total"] == 1

    def test_list_questions_filter_by_difficulty(self, client, auth_headers, sample_question, institution, grade, subject):
        hard_question = _question_payload(institution.id, grade.id, subject.id, difficulty_level="hard")
        client.post("/api/v1/question-bank/", json=hard_question, headers=auth_headers)

        response = client.get("/api/v1/question-bank/?difficulty_level=hard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["difficulty_level"] == "hard"

    def test_list_questions_search_filter(self, client, auth_headers, sample_question):
        response = client.get("/api/v1/question-bank/?search=capital", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total"] == 1

    def test_list_questions_unauthenticated(self, client):
        response = client.get("/api/v1/question-bank/")
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Facets / statistics
# ---------------------------------------------------------------------------
class TestFacets:
    def test_get_facets_success(self, client, auth_headers, sample_question):
        response = client.get("/api/v1/question-bank/facets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "question_types" in data
        assert "difficulty_levels" in data
        assert "bloom_levels" in data
        assert data["difficulty_levels"].get("easy") == 1


class TestStatistics:
    def test_get_statistics_success(self, client, auth_headers, sample_question, institution, grade, subject, admin_user):
        verified_payload = _question_payload(institution.id, grade.id, subject.id)
        created = client.post("/api/v1/question-bank/", json=verified_payload, headers=auth_headers).json()
        client.post(
            f"/api/v1/question-bank/{created['id']}/verify",
            json={"is_verified": True, "verified_by": admin_user.id},
            headers=auth_headers,
        )

        response = client.get("/api/v1/question-bank/statistics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_questions"] == 2
        assert data["verified_count"] == 1
        assert data["unverified_count"] == 1


# ---------------------------------------------------------------------------
# Questions by paper
# ---------------------------------------------------------------------------
class TestGetQuestionsByPaper:
    def test_get_questions_by_paper_success(self, client, auth_headers, previous_year_paper, db_session, institution, grade, subject):
        q = QuestionBank(
            institution_id=institution.id,
            paper_id=previous_year_paper.id,
            question_text="Paper-linked question",
            question_type="short_answer",
            grade_id=grade.id,
            subject_id=subject.id,
            difficulty_level="easy",
            bloom_taxonomy_level="remember",
        )
        db_session.add(q)
        db_session.commit()

        response = client.get(f"/api/v1/question-bank/paper/{previous_year_paper.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["question_text"] == "Paper-linked question"

    def test_get_questions_by_paper_not_found(self, client, auth_headers):
        response = client.get("/api/v1/question-bank/paper/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_questions_by_paper_cross_institution_forbidden(self, client, other_admin_headers, previous_year_paper):
        """Regression test: this endpoint previously did zero institution
        scoping at all, letting any authenticated user of any institution
        read another institution's question bank by paper id."""
        response = client.get(f"/api/v1/question-bank/paper/{previous_year_paper.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Get / update / delete single question
# ---------------------------------------------------------------------------
class TestGetQuestion:
    def test_get_question_success(self, client, auth_headers, sample_question):
        response = client.get(f"/api/v1/question-bank/{sample_question.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == sample_question.id

    def test_get_question_not_found(self, client, auth_headers):
        response = client.get("/api/v1/question-bank/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_question_cross_institution_forbidden(self, client, other_admin_headers, sample_question):
        response = client.get(f"/api/v1/question-bank/{sample_question.id}", headers=other_admin_headers)
        assert response.status_code == 403


class TestUpdateQuestion:
    def test_update_question_success(self, client, auth_headers, sample_question):
        response = client.put(
            f"/api/v1/question-bank/{sample_question.id}",
            json={"question_text": "Updated question text"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["question_text"] == "Updated question text"

    def test_update_question_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/question-bank/999999",
            json={"question_text": "X"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_update_question_cross_institution_forbidden(self, client, other_admin_headers, sample_question):
        response = client.put(
            f"/api/v1/question-bank/{sample_question.id}",
            json={"question_text": "Hacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


class TestDeleteQuestion:
    def test_delete_question_success(self, client, auth_headers, sample_question):
        response = client.delete(f"/api/v1/question-bank/{sample_question.id}", headers=auth_headers)
        assert response.status_code == 204
        get_response = client.get(f"/api/v1/question-bank/{sample_question.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_question_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/question-bank/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_question_cross_institution_forbidden(self, client, other_admin_headers, sample_question):
        response = client.delete(f"/api/v1/question-bank/{sample_question.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------
class TestVerifyQuestion:
    def test_verify_question_success(self, client, auth_headers, sample_question, admin_user):
        response = client.post(
            f"/api/v1/question-bank/{sample_question.id}/verify",
            json={"is_verified": True, "verified_by": admin_user.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_verified"] is True
        assert data["verified_by"] == admin_user.id
        assert data["verified_at"] is not None

    def test_unverify_question_clears_verifier(self, client, auth_headers, sample_question, admin_user):
        client.post(
            f"/api/v1/question-bank/{sample_question.id}/verify",
            json={"is_verified": True, "verified_by": admin_user.id},
            headers=auth_headers,
        )
        response = client.post(
            f"/api/v1/question-bank/{sample_question.id}/verify",
            json={"is_verified": False, "verified_by": admin_user.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_verified"] is False
        assert data["verified_by"] is None
        assert data["verified_at"] is None

    def test_verify_question_not_found(self, client, auth_headers, admin_user):
        response = client.post(
            "/api/v1/question-bank/999999/verify",
            json={"is_verified": True, "verified_by": admin_user.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_verify_question_cross_institution_forbidden(self, client, other_admin_headers, sample_question, other_admin_user):
        response = client.post(
            f"/api/v1/question-bank/{sample_question.id}/verify",
            json={"is_verified": True, "verified_by": other_admin_user.id},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Upload image
# ---------------------------------------------------------------------------
class TestUploadImage:
    def test_upload_image_success(self, client, auth_headers, sample_question):
        with patch(
            "src.services.previous_year_papers_service.s3_client.upload_file",
            return_value="https://s3.example.com/question_images/test.jpg",
        ):
            response = client.post(
                f"/api/v1/question-bank/{sample_question.id}/upload-image",
                files={"file": ("diagram.jpg", io.BytesIO(b"fake-image-bytes"), "image/jpeg")},
                headers=auth_headers,
            )
        assert response.status_code == 200
        assert response.json()["image_url"] == "https://s3.example.com/question_images/test.jpg"

    def test_upload_image_rejects_non_image_content_type(self, client, auth_headers, sample_question):
        response = client.post(
            f"/api/v1/question-bank/{sample_question.id}/upload-image",
            files={"file": ("notes.txt", io.BytesIO(b"plain text"), "text/plain")},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_upload_image_rejects_oversized_file(self, client, auth_headers, sample_question):
        oversized = io.BytesIO(b"0" * (5 * 1024 * 1024 + 1))
        response = client.post(
            f"/api/v1/question-bank/{sample_question.id}/upload-image",
            files={"file": ("big.jpg", oversized, "image/jpeg")},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_upload_image_not_found(self, client, auth_headers):
        response = client.post(
            "/api/v1/question-bank/999999/upload-image",
            files={"file": ("diagram.jpg", io.BytesIO(b"fake"), "image/jpeg")},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_upload_image_cross_institution_forbidden(self, client, other_admin_headers, sample_question):
        response = client.post(
            f"/api/v1/question-bank/{sample_question.id}/upload-image",
            files={"file": ("diagram.jpg", io.BytesIO(b"fake"), "image/jpeg")},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Usage count
# ---------------------------------------------------------------------------
class TestIncrementUsageCount:
    def test_increment_usage_count_success(self, client, auth_headers, sample_question):
        response = client.post(f"/api/v1/question-bank/{sample_question.id}/use", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/question-bank/{sample_question.id}", headers=auth_headers)
        assert get_response.json()["usage_count"] == 1

    def test_increment_usage_count_not_found(self, client, auth_headers):
        response = client.post("/api/v1/question-bank/999999/use", headers=auth_headers)
        assert response.status_code == 404

    def test_increment_usage_count_cross_institution_forbidden(self, client, other_admin_headers, sample_question):
        response = client.post(f"/api/v1/question-bank/{sample_question.id}/use", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# AI tag suggestions
# ---------------------------------------------------------------------------
class TestSuggestTags:
    def test_suggest_tags_success(self, client, auth_headers, sample_question):
        response = client.post(f"/api/v1/question-bank/{sample_question.id}/suggest-tags", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["question_id"] == sample_question.id
        assert "suggested_tags" in data
        assert "confidence_score" in data

    def test_suggest_tags_not_found(self, client, auth_headers):
        response = client.post("/api/v1/question-bank/999999/suggest-tags", headers=auth_headers)
        assert response.status_code == 404

    def test_suggest_tags_cross_institution_forbidden(self, client, other_admin_headers, sample_question):
        response = client.post(f"/api/v1/question-bank/{sample_question.id}/suggest-tags", headers=other_admin_headers)
        assert response.status_code == 403
