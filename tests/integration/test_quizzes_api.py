"""Integration tests for the `quizzes` router (src/api/v1/quizzes.py).

Covers quiz CRUD, bulk quiz+question creation, per-quiz question CRUD, quiz
attempts (start/submit/responses), the leaderboard, and analytics.

This router previously had **no authentication at all** on any of its 19
endpoints (no `Depends(get_current_user)` anywhere), unlike its sibling
routers (`question_bank.py`, `question_blueprints.py`,
`question_bookmarks.py`) which are all properly institution/owner-scoped.
Fixed as part of this pass: every endpoint now requires login, mutating
endpoints (create/update/delete quiz or question, publish, analytics)
require a teacher/admin role, and every resource lookup is scoped to the
caller's own institution (or, for attempts/responses, to the attempt's own
user or a teacher/admin of that institution) -- see AGENTS-facing bug
writeup in the commit message for the full list.
"""
import uuid
from datetime import datetime, timedelta

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizType, QuizStatus, QuestionType, QuizAttemptStatus
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local role-header fixtures (standard `auth_headers` in conftest.py is
# admin-role only; teacher_user/student_user exist but have no headers
# fixture by default).
# ---------------------------------------------------------------------------
@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_student(db_session, institution, student_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"student{suffix}",
        email=f"student{suffix}@testschool.com",
        first_name="Second",
        last_name="Student",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=student_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_student_headers(client, second_student) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_student.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# ---------------------------------------------------------------------------
# A second institution + teacher, for cross-institution 403/404 checks.
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
def other_teacher_role(db_session) -> Role:
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Teacher{suffix}", slug=f"teacher-{suffix}", description="Teacher role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_teacher_user(db_session, other_institution, other_teacher_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otherteacher{suffix}",
        email=f"otherteacher{suffix}@otherschool.com",
        first_name="Other",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_teacher_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_teacher_headers(client, other_teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# ---------------------------------------------------------------------------
# Quiz / question fixtures, built directly via the ORM for setup speed.
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_quiz(db_session, institution, teacher_user, grade, subject) -> Quiz:
    quiz = Quiz(
        institution_id=institution.id,
        creator_id=teacher_user.id,
        grade_id=grade.id,
        subject_id=subject.id,
        title="Sample Quiz",
        description="A sample quiz",
        quiz_type=QuizType.PRACTICE,
        status=QuizStatus.PUBLISHED,
        total_marks=0,
        enable_leaderboard=True,
        is_active=True,
    )
    db_session.add(quiz)
    db_session.commit()
    db_session.refresh(quiz)
    return quiz


@pytest.fixture
def mcq_question(db_session, sample_quiz) -> QuizQuestion:
    q = QuizQuestion(
        quiz_id=sample_quiz.id,
        question_type=QuestionType.MCQ,
        question_text="What is 2 + 2?",
        marks=5,
        order_index=0,
        options=[
            {"id": "a", "text": "3", "is_correct": False},
            {"id": "b", "text": "4", "is_correct": True},
        ],
    )
    db_session.add(q)
    sample_quiz.total_marks = 5
    db_session.commit()
    db_session.refresh(q)
    return q


@pytest.fixture
def true_false_question(db_session, sample_quiz) -> QuizQuestion:
    q = QuizQuestion(
        quiz_id=sample_quiz.id,
        question_type=QuestionType.TRUE_FALSE,
        question_text="The sky is blue.",
        marks=2,
        order_index=1,
        correct_answer="True",
    )
    db_session.add(q)
    sample_quiz.total_marks += 2
    db_session.commit()
    db_session.refresh(q)
    return q


@pytest.fixture
def fill_blank_question(db_session, sample_quiz) -> QuizQuestion:
    q = QuizQuestion(
        quiz_id=sample_quiz.id,
        question_type=QuestionType.FILL_BLANK,
        question_text="The capital of France is ____.",
        marks=3,
        order_index=2,
        correct_answer="Paris",
    )
    db_session.add(q)
    sample_quiz.total_marks += 3
    db_session.commit()
    db_session.refresh(q)
    return q


@pytest.fixture
def short_answer_question(db_session, sample_quiz) -> QuizQuestion:
    q = QuizQuestion(
        quiz_id=sample_quiz.id,
        question_type=QuestionType.SHORT_ANSWER,
        question_text="Explain photosynthesis.",
        marks=10,
        order_index=3,
    )
    db_session.add(q)
    sample_quiz.total_marks += 10
    db_session.commit()
    db_session.refresh(q)
    return q


def _quiz_payload(institution_id, creator_id, **overrides):
    payload = {
        "title": "New Quiz",
        "institution_id": institution_id,
        "creator_id": creator_id,
        "quiz_type": "practice",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Create quiz
# ---------------------------------------------------------------------------
class TestCreateQuiz:
    def test_create_quiz_as_teacher_success(self, client, teacher_headers, institution, teacher_user):
        response = client.post(
            "/api/v1/quizzes",
            json=_quiz_payload(institution.id, teacher_user.id, title="Algebra Basics"),
            headers=teacher_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Algebra Basics"
        assert data["status"] == "draft"
        assert data["total_marks"] == 0

    def test_create_quiz_as_admin_success(self, client, auth_headers, institution, admin_user):
        response = client.post(
            "/api/v1/quizzes",
            json=_quiz_payload(institution.id, admin_user.id),
            headers=auth_headers,
        )
        assert response.status_code == 201

    def test_create_quiz_as_student_forbidden(self, client, student_headers, institution, student_user):
        response = client.post(
            "/api/v1/quizzes",
            json=_quiz_payload(institution.id, student_user.id),
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_create_quiz_cross_institution_forbidden(self, client, teacher_headers, other_institution, teacher_user):
        response = client.post(
            "/api/v1/quizzes",
            json=_quiz_payload(other_institution.id, teacher_user.id),
            headers=teacher_headers,
        )
        assert response.status_code == 403

    def test_create_quiz_on_behalf_of_another_user_forbidden(self, client, teacher_headers, institution, admin_user):
        response = client.post(
            "/api/v1/quizzes",
            json=_quiz_payload(institution.id, admin_user.id),
            headers=teacher_headers,
        )
        assert response.status_code == 403

    def test_create_quiz_unauthenticated(self, client, institution, teacher_user):
        # No Authorization header at all -> FastAPI's HTTPBearer(auto_error=True) rejects
        # with 403 "Not authenticated" before get_current_user even runs (401 is reserved
        # for a present-but-invalid/expired token in this codebase).
        response = client.post(
            "/api/v1/quizzes",
            json=_quiz_payload(institution.id, teacher_user.id),
        )
        assert response.status_code == 403

    def test_create_quiz_missing_title_validation_error(self, client, teacher_headers, institution, teacher_user):
        payload = _quiz_payload(institution.id, teacher_user.id)
        del payload["title"]
        response = client.post("/api/v1/quizzes", json=payload, headers=teacher_headers)
        assert response.status_code == 422


class TestBulkCreateQuiz:
    def test_bulk_create_quiz_with_questions_success(self, client, teacher_headers, institution, teacher_user):
        payload = {
            "quiz": _quiz_payload(institution.id, teacher_user.id, title="Bulk Quiz"),
            "questions": [
                {
                    "question_type": "mcq",
                    "question_text": "1 + 1 = ?",
                    "marks": 4,
                    "options": [
                        {"id": "a", "text": "1", "is_correct": False},
                        {"id": "b", "text": "2", "is_correct": True},
                    ],
                },
                {
                    "question_type": "true_false",
                    "question_text": "Water boils at 100C.",
                    "marks": 6,
                    "correct_answer": "true",
                },
            ],
        }
        response = client.post("/api/v1/quizzes/bulk", json=payload, headers=teacher_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["total_marks"] == 10
        assert len(data["questions"]) == 2

    def test_bulk_create_quiz_as_student_forbidden(self, client, student_headers, institution, student_user):
        payload = {
            "quiz": _quiz_payload(institution.id, student_user.id),
            "questions": [],
        }
        response = client.post("/api/v1/quizzes/bulk", json=payload, headers=student_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# List quizzes
# ---------------------------------------------------------------------------
class TestListQuizzes:
    def test_list_quizzes_scoped_to_own_institution(
        self, client, teacher_headers, sample_quiz, db_session, other_institution, teacher_user
    ):
        # A quiz belonging to a different institution must never appear.
        other_quiz = Quiz(
            institution_id=other_institution.id,
            creator_id=teacher_user.id,
            title="Other Institution Quiz",
            total_marks=0,
        )
        db_session.add(other_quiz)
        db_session.commit()

        response = client.get("/api/v1/quizzes", headers=teacher_headers)
        assert response.status_code == 200
        titles = [q["title"] for q in response.json()]
        assert sample_quiz.title in titles
        assert "Other Institution Quiz" not in titles

    def test_list_quizzes_ignores_foreign_institution_id_query_param(
        self, client, teacher_headers, sample_quiz, other_institution
    ):
        # Even explicitly requesting another institution's id must not leak data.
        response = client.get(
            f"/api/v1/quizzes?institution_id={other_institution.id}",
            headers=teacher_headers,
        )
        assert response.status_code == 200
        titles = [q["title"] for q in response.json()]
        assert sample_quiz.title in titles

    def test_list_quizzes_search_filter(self, client, teacher_headers, sample_quiz):
        response = client.get("/api/v1/quizzes?search=Sample", headers=teacher_headers)
        assert response.status_code == 200
        assert any(q["id"] == sample_quiz.id for q in response.json())

    def test_list_quizzes_unauthenticated(self, client):
        response = client.get("/api/v1/quizzes")
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Get quiz / get quiz for student
# ---------------------------------------------------------------------------
class TestGetQuiz:
    def test_get_quiz_success(self, client, teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}", headers=teacher_headers)
        assert response.status_code == 200
        assert response.json()["id"] == sample_quiz.id

    def test_get_quiz_not_found(self, client, teacher_headers):
        response = client.get("/api/v1/quizzes/999999", headers=teacher_headers)
        assert response.status_code == 404

    def test_get_quiz_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}", headers=other_teacher_headers)
        assert response.status_code == 403


class TestGetQuizForStudent:
    def test_get_quiz_for_student_hides_correct_answers(self, client, student_headers, sample_quiz, mcq_question):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/student", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        for option in data["questions"][0]["options"]:
            assert "is_correct" not in option

    def test_get_quiz_for_student_not_found(self, client, student_headers):
        response = client.get("/api/v1/quizzes/999999/student", headers=student_headers)
        assert response.status_code == 404

    def test_get_quiz_for_student_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/student", headers=other_teacher_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Update / delete / publish quiz
# ---------------------------------------------------------------------------
class TestUpdateQuiz:
    def test_update_quiz_success(self, client, teacher_headers, sample_quiz):
        response = client.put(
            f"/api/v1/quizzes/{sample_quiz.id}",
            json={"title": "Updated Title"},
            headers=teacher_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    def test_update_quiz_as_student_forbidden(self, client, student_headers, sample_quiz):
        response = client.put(
            f"/api/v1/quizzes/{sample_quiz.id}",
            json={"title": "Hacked"},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_update_quiz_not_found(self, client, teacher_headers):
        response = client.put("/api/v1/quizzes/999999", json={"title": "X"}, headers=teacher_headers)
        assert response.status_code == 404

    def test_update_quiz_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.put(
            f"/api/v1/quizzes/{sample_quiz.id}",
            json={"title": "Hacked"},
            headers=other_teacher_headers,
        )
        assert response.status_code == 403


class TestDeleteQuiz:
    def test_delete_quiz_success(self, client, teacher_headers, sample_quiz):
        response = client.delete(f"/api/v1/quizzes/{sample_quiz.id}", headers=teacher_headers)
        assert response.status_code == 204
        get_response = client.get(f"/api/v1/quizzes/{sample_quiz.id}", headers=teacher_headers)
        assert get_response.status_code == 404

    def test_delete_quiz_as_student_forbidden(self, client, student_headers, sample_quiz):
        response = client.delete(f"/api/v1/quizzes/{sample_quiz.id}", headers=student_headers)
        assert response.status_code == 403

    def test_delete_quiz_not_found(self, client, teacher_headers):
        response = client.delete("/api/v1/quizzes/999999", headers=teacher_headers)
        assert response.status_code == 404

    def test_delete_quiz_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.delete(f"/api/v1/quizzes/{sample_quiz.id}", headers=other_teacher_headers)
        assert response.status_code == 403


class TestPublishQuiz:
    def test_publish_quiz_success(self, client, teacher_headers, db_session, institution, teacher_user):
        quiz = Quiz(institution_id=institution.id, creator_id=teacher_user.id, title="Draft Quiz", total_marks=0)
        db_session.add(quiz)
        db_session.commit()
        db_session.refresh(quiz)

        response = client.post(f"/api/v1/quizzes/{quiz.id}/publish", headers=teacher_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "published"

    def test_publish_quiz_as_student_forbidden(self, client, student_headers, sample_quiz):
        response = client.post(f"/api/v1/quizzes/{sample_quiz.id}/publish", headers=student_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Question endpoints
# ---------------------------------------------------------------------------
class TestQuizQuestions:
    def test_create_question_as_teacher_success_updates_total_marks(self, client, teacher_headers, sample_quiz):
        response = client.post(
            f"/api/v1/quizzes/{sample_quiz.id}/questions",
            json={
                "question_type": "mcq",
                "question_text": "3 + 3 = ?",
                "marks": 5,
                "quiz_id": sample_quiz.id,
                "options": [
                    {"id": "a", "text": "5", "is_correct": False},
                    {"id": "b", "text": "6", "is_correct": True},
                ],
            },
            headers=teacher_headers,
        )
        assert response.status_code == 201
        assert response.json()["quiz_id"] == sample_quiz.id

        quiz_response = client.get(f"/api/v1/quizzes/{sample_quiz.id}", headers=teacher_headers)
        assert quiz_response.json()["total_marks"] == 5

    def test_create_question_as_student_forbidden(self, client, student_headers, sample_quiz):
        response = client.post(
            f"/api/v1/quizzes/{sample_quiz.id}/questions",
            json={"question_type": "mcq", "question_text": "X?", "marks": 1, "quiz_id": sample_quiz.id},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_create_question_quiz_not_found_returns_404_not_500(self, client, teacher_headers):
        """Regression test: previously the router inserted the question row
        unconditionally before checking the quiz existed, so a bad quiz_id
        raised an unhandled FK IntegrityError (500) instead of a clean 404."""
        response = client.post(
            "/api/v1/quizzes/999999/questions",
            json={"question_type": "mcq", "question_text": "X?", "marks": 1, "quiz_id": 999999},
            headers=teacher_headers,
        )
        assert response.status_code == 404

    def test_create_question_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.post(
            f"/api/v1/quizzes/{sample_quiz.id}/questions",
            json={"question_type": "mcq", "question_text": "X?", "marks": 1, "quiz_id": sample_quiz.id},
            headers=other_teacher_headers,
        )
        assert response.status_code == 403

    def test_list_questions_success(self, client, teacher_headers, sample_quiz, mcq_question):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/questions", headers=teacher_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_list_questions_quiz_not_found(self, client, teacher_headers):
        response = client.get("/api/v1/quizzes/999999/questions", headers=teacher_headers)
        assert response.status_code == 404

    def test_list_questions_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/questions", headers=other_teacher_headers)
        assert response.status_code == 403

    def test_update_question_success_updates_total_marks(self, client, teacher_headers, sample_quiz, mcq_question):
        response = client.put(
            f"/api/v1/quizzes/questions/{mcq_question.id}",
            json={"marks": 10},
            headers=teacher_headers,
        )
        assert response.status_code == 200
        assert response.json()["marks"] == 10

        quiz_response = client.get(f"/api/v1/quizzes/{sample_quiz.id}", headers=teacher_headers)
        assert quiz_response.json()["total_marks"] == 10

    def test_update_question_as_student_forbidden(self, client, student_headers, mcq_question):
        response = client.put(
            f"/api/v1/quizzes/questions/{mcq_question.id}",
            json={"marks": 100},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_update_question_not_found(self, client, teacher_headers):
        response = client.put("/api/v1/quizzes/questions/999999", json={"marks": 1}, headers=teacher_headers)
        assert response.status_code == 404

    def test_update_question_cross_institution_forbidden(self, client, other_teacher_headers, mcq_question):
        response = client.put(
            f"/api/v1/quizzes/questions/{mcq_question.id}",
            json={"marks": 100},
            headers=other_teacher_headers,
        )
        assert response.status_code == 403

    def test_delete_question_success_updates_total_marks(self, client, teacher_headers, sample_quiz, mcq_question):
        response = client.delete(f"/api/v1/quizzes/questions/{mcq_question.id}", headers=teacher_headers)
        assert response.status_code == 204

        quiz_response = client.get(f"/api/v1/quizzes/{sample_quiz.id}", headers=teacher_headers)
        assert quiz_response.json()["total_marks"] == 0

    def test_delete_question_as_student_forbidden(self, client, student_headers, mcq_question):
        response = client.delete(f"/api/v1/quizzes/questions/{mcq_question.id}", headers=student_headers)
        assert response.status_code == 403

    def test_delete_question_not_found(self, client, teacher_headers):
        response = client.delete("/api/v1/quizzes/questions/999999", headers=teacher_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Quiz attempts
# ---------------------------------------------------------------------------
class TestStartQuizAttempt:
    def test_start_attempt_success(self, client, student_headers, sample_quiz, mcq_question, student_user):
        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": student_user.id},
            headers=student_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["quiz_id"] == sample_quiz.id
        assert data["user_id"] == student_user.id
        assert data["attempt_number"] == 1
        assert data["status"] == "in_progress"

    def test_start_attempt_for_another_user_forbidden(self, client, student_headers, sample_quiz, admin_user):
        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": admin_user.id},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_start_attempt_quiz_not_found(self, client, student_headers, student_user):
        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": 999999, "user_id": student_user.id},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_start_attempt_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz, other_teacher_user):
        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": other_teacher_user.id},
            headers=other_teacher_headers,
        )
        assert response.status_code == 403

    def test_start_attempt_max_attempts_reached(self, client, student_headers, db_session, sample_quiz, student_user):
        sample_quiz.max_attempts = 1
        db_session.commit()

        first = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": student_user.id},
            headers=student_headers,
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": student_user.id},
            headers=student_headers,
        )
        assert second.status_code == 400
        assert "Maximum attempts" in second.json()["detail"]

    def test_start_attempt_not_yet_available(self, client, student_headers, db_session, sample_quiz, student_user):
        sample_quiz.available_from = datetime.utcnow() + timedelta(days=1)
        db_session.commit()

        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": student_user.id},
            headers=student_headers,
        )
        assert response.status_code == 400
        assert "not yet available" in response.json()["detail"]

    def test_start_attempt_no_longer_available(self, client, student_headers, db_session, sample_quiz, student_user):
        sample_quiz.available_until = datetime.utcnow() - timedelta(days=1)
        db_session.commit()

        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": student_user.id},
            headers=student_headers,
        )
        assert response.status_code == 400
        assert "no longer available" in response.json()["detail"]


class TestGetAttempt:
    @pytest.fixture
    def student_attempt(self, db_session, sample_quiz, student_user) -> QuizAttempt:
        attempt = QuizAttempt(quiz_id=sample_quiz.id, user_id=student_user.id, total_questions=1)
        db_session.add(attempt)
        db_session.commit()
        db_session.refresh(attempt)
        return attempt

    def test_get_attempt_as_owner_success(self, client, student_headers, student_attempt):
        response = client.get(f"/api/v1/quizzes/attempts/{student_attempt.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == student_attempt.id

    def test_get_attempt_as_teacher_same_institution_success(self, client, teacher_headers, student_attempt):
        response = client.get(f"/api/v1/quizzes/attempts/{student_attempt.id}", headers=teacher_headers)
        assert response.status_code == 200

    def test_get_attempt_as_other_student_forbidden(self, client, second_student_headers, student_attempt):
        response = client.get(f"/api/v1/quizzes/attempts/{student_attempt.id}", headers=second_student_headers)
        assert response.status_code == 403

    def test_get_attempt_as_other_institution_teacher_forbidden(self, client, other_teacher_headers, student_attempt):
        response = client.get(f"/api/v1/quizzes/attempts/{student_attempt.id}", headers=other_teacher_headers)
        assert response.status_code == 403

    def test_get_attempt_not_found(self, client, teacher_headers):
        response = client.get("/api/v1/quizzes/attempts/999999", headers=teacher_headers)
        assert response.status_code == 404


class TestSubmitQuiz:
    def _start_attempt(self, client, headers, quiz_id, user_id):
        response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": quiz_id, "user_id": user_id},
            headers=headers,
        )
        assert response.status_code == 201
        return response.json()["id"]

    def test_submit_quiz_mcq_correct_answer_scores_full_marks(
        self, client, student_headers, sample_quiz, mcq_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)

        response = client.post(
            f"/api/v1/quizzes/attempts/{attempt_id}/submit",
            json={
                "attempt_id": attempt_id,
                "responses": [{"attempt_id": attempt_id, "question_id": mcq_question.id, "user_answer": "b"}],
                "time_taken_seconds": 60,
            },
            headers=student_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["score"] == 5
        assert data["correct_answers"] == 1
        assert data["percentage"] == 100.0

    def test_submit_quiz_true_false_case_insensitive(
        self, client, student_headers, sample_quiz, true_false_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)
        response = client.post(
            f"/api/v1/quizzes/attempts/{attempt_id}/submit",
            json={
                "attempt_id": attempt_id,
                "responses": [{"attempt_id": attempt_id, "question_id": true_false_question.id, "user_answer": "true"}],
                "time_taken_seconds": 10,
            },
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["correct_answers"] == 1

    def test_submit_quiz_fill_blank_strips_and_lowercases(
        self, client, student_headers, sample_quiz, fill_blank_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)
        response = client.post(
            f"/api/v1/quizzes/attempts/{attempt_id}/submit",
            json={
                "attempt_id": attempt_id,
                "responses": [
                    {"attempt_id": attempt_id, "question_id": fill_blank_question.id, "user_answer": "  paris  "}
                ],
                "time_taken_seconds": 15,
            },
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["correct_answers"] == 1

    def test_submit_quiz_short_answer_requires_manual_grading(
        self, client, student_headers, sample_quiz, short_answer_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)
        response = client.post(
            f"/api/v1/quizzes/attempts/{attempt_id}/submit",
            json={
                "attempt_id": attempt_id,
                "responses": [
                    {
                        "attempt_id": attempt_id,
                        "question_id": short_answer_question.id,
                        "user_answer": "Plants convert light to energy.",
                    }
                ],
                "time_taken_seconds": 120,
            },
            headers=student_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["correct_answers"] == 0
        assert data["incorrect_answers"] == 0
        assert data["score"] == 0

        responses = client.get(f"/api/v1/quizzes/attempts/{attempt_id}/responses", headers=student_headers)
        assert responses.status_code == 200
        assert responses.json()[0]["is_correct"] is None

    def test_submit_quiz_already_submitted_returns_400(
        self, client, student_headers, sample_quiz, mcq_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)
        body = {
            "attempt_id": attempt_id,
            "responses": [{"attempt_id": attempt_id, "question_id": mcq_question.id, "user_answer": "b"}],
            "time_taken_seconds": 60,
        }
        first = client.post(f"/api/v1/quizzes/attempts/{attempt_id}/submit", json=body, headers=student_headers)
        assert first.status_code == 200

        second = client.post(f"/api/v1/quizzes/attempts/{attempt_id}/submit", json=body, headers=student_headers)
        assert second.status_code == 400

    def test_submit_quiz_as_another_user_forbidden(
        self, client, student_headers, second_student_headers, sample_quiz, mcq_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)
        response = client.post(
            f"/api/v1/quizzes/attempts/{attempt_id}/submit",
            json={
                "attempt_id": attempt_id,
                "responses": [{"attempt_id": attempt_id, "question_id": mcq_question.id, "user_answer": "b"}],
                "time_taken_seconds": 60,
            },
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_submit_quiz_not_found(self, client, student_headers):
        response = client.post(
            "/api/v1/quizzes/attempts/999999/submit",
            json={"attempt_id": 999999, "responses": [], "time_taken_seconds": 1},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_submit_quiz_updates_leaderboard(
        self, client, student_headers, sample_quiz, mcq_question, student_user
    ):
        attempt_id = self._start_attempt(client, student_headers, sample_quiz.id, student_user.id)
        client.post(
            f"/api/v1/quizzes/attempts/{attempt_id}/submit",
            json={
                "attempt_id": attempt_id,
                "responses": [{"attempt_id": attempt_id, "question_id": mcq_question.id, "user_answer": "b"}],
                "time_taken_seconds": 60,
            },
            headers=student_headers,
        )

        leaderboard = client.get(f"/api/v1/quizzes/{sample_quiz.id}/leaderboard", headers=student_headers)
        assert leaderboard.status_code == 200
        entries = leaderboard.json()
        assert len(entries) == 1
        assert entries[0]["user_id"] == student_user.id
        assert entries[0]["best_score"] == 5
        assert entries[0]["rank"] == 1


class TestGetAttemptResponses:
    def test_get_attempt_responses_as_other_student_forbidden(
        self, client, student_headers, second_student_headers, sample_quiz, mcq_question, student_user
    ):
        attempt_response = client.post(
            "/api/v1/quizzes/attempts",
            json={"quiz_id": sample_quiz.id, "user_id": student_user.id},
            headers=student_headers,
        )
        attempt_id = attempt_response.json()["id"]

        response = client.get(f"/api/v1/quizzes/attempts/{attempt_id}/responses", headers=second_student_headers)
        assert response.status_code == 403

    def test_get_attempt_responses_not_found(self, client, teacher_headers):
        response = client.get("/api/v1/quizzes/attempts/999999/responses", headers=teacher_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------
class TestLeaderboard:
    def test_get_leaderboard_empty_success(self, client, teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/leaderboard", headers=teacher_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_leaderboard_quiz_not_found(self, client, teacher_headers):
        response = client.get("/api/v1/quizzes/999999/leaderboard", headers=teacher_headers)
        assert response.status_code == 404

    def test_get_leaderboard_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/leaderboard", headers=other_teacher_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
class TestQuizAnalytics:
    def test_get_quiz_analytics_as_teacher_success(self, client, teacher_headers, sample_quiz, mcq_question):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/analytics", headers=teacher_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["quiz_analytics"]["quiz_id"] == sample_quiz.id
        assert len(data["question_analytics"]) == 1
        assert "score_distribution" in data
        assert "time_distribution" in data

    def test_get_quiz_analytics_as_student_forbidden(self, client, student_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/analytics", headers=student_headers)
        assert response.status_code == 403

    def test_get_quiz_analytics_not_found(self, client, teacher_headers):
        response = client.get("/api/v1/quizzes/999999/analytics", headers=teacher_headers)
        assert response.status_code == 404

    def test_get_quiz_analytics_cross_institution_forbidden(self, client, other_teacher_headers, sample_quiz):
        response = client.get(f"/api/v1/quizzes/{sample_quiz.id}/analytics", headers=other_teacher_headers)
        assert response.status_code == 403
