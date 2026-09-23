"""Integration tests for the `question_bookmarks` router
(src/api/v1/question_bookmarks.py).

Covers bookmarking a question-bank question (create is idempotent per
user+question), listing a user's own bookmarks, get/update/delete by id, and
checking whether a question is bookmarked. Unlike several other routers
audited this session, this one already scopes every by-id lookup to
`bookmark.user_id != current_user.id -> 403`, so no student can view or
delete another student's bookmark -- no source bugs were found here.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.previous_year_papers import QuestionBank, QuestionBookmark
from src.utils.security import get_password_hash


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


@pytest.fixture
def second_question(db_session, institution, grade, subject) -> QuestionBank:
    question = QuestionBank(
        institution_id=institution.id,
        question_text="What is the capital of Germany?",
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


@pytest.fixture
def sample_bookmark(db_session, student_user, institution, sample_question) -> QuestionBookmark:
    bookmark = QuestionBookmark(
        user_id=student_user.id,
        institution_id=institution.id,
        question_id=sample_question.id,
        notes="Review before exam",
        tags="important",
    )
    db_session.add(bookmark)
    db_session.commit()
    db_session.refresh(bookmark)
    return bookmark


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
class TestCreateBookmark:
    def test_create_bookmark_success(self, client, student_headers, sample_question, student_user, institution):
        response = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": sample_question.id, "notes": "Revisit this", "tags": "algebra"},
            headers=student_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["question_id"] == sample_question.id
        assert data["user_id"] == student_user.id
        assert data["institution_id"] == institution.id
        assert data["notes"] == "Revisit this"

    def test_create_bookmark_is_idempotent_per_user_and_question(
        self, client, student_headers, sample_question
    ):
        first = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": sample_question.id, "notes": "First note"},
            headers=student_headers,
        )
        second = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": sample_question.id, "notes": "Second note, should be ignored"},
            headers=student_headers,
        )
        assert first.status_code == 201
        assert second.status_code == 201
        assert first.json()["id"] == second.json()["id"]
        # Existing bookmark is returned as-is, not overwritten by the second call.
        assert second.json()["notes"] == "First note"

    def test_create_bookmark_two_different_users_get_separate_bookmarks(
        self, client, student_headers, second_student_headers, sample_question
    ):
        first = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": sample_question.id},
            headers=student_headers,
        )
        second = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": sample_question.id},
            headers=second_student_headers,
        )
        assert first.json()["id"] != second.json()["id"]

    def test_create_bookmark_unauthenticated(self, client, sample_question):
        response = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": sample_question.id},
        )
        assert response.status_code == 403

    def test_create_bookmark_missing_question_id_validation_error(self, client, student_headers):
        response = client.post("/api/v1/question-bookmarks/", json={}, headers=student_headers)
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------
class TestListBookmarks:
    def test_list_bookmarks_scoped_to_own_user(
        self, client, student_headers, second_student_headers, sample_bookmark, second_question, second_student
    ):
        create_resp = client.post(
            "/api/v1/question-bookmarks/",
            json={"question_id": second_question.id},
            headers=second_student_headers,
        )
        assert create_resp.status_code == 201

        response = client.get("/api/v1/question-bookmarks/", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == sample_bookmark.id

    def test_list_bookmarks_pagination(self, client, student_headers, sample_question, second_question):
        client.post("/api/v1/question-bookmarks/", json={"question_id": sample_question.id}, headers=student_headers)
        client.post("/api/v1/question-bookmarks/", json={"question_id": second_question.id}, headers=student_headers)

        response = client.get("/api/v1/question-bookmarks/?skip=0&limit=1", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 1

    def test_list_bookmarks_unauthenticated(self, client):
        response = client.get("/api/v1/question-bookmarks/")
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Get / update / delete by id
# ---------------------------------------------------------------------------
class TestGetBookmark:
    def test_get_bookmark_success(self, client, student_headers, sample_bookmark):
        response = client.get(f"/api/v1/question-bookmarks/{sample_bookmark.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == sample_bookmark.id

    def test_get_bookmark_not_found(self, client, student_headers):
        response = client.get("/api/v1/question-bookmarks/999999", headers=student_headers)
        assert response.status_code == 404

    def test_get_bookmark_owned_by_another_student_forbidden(
        self, client, second_student_headers, sample_bookmark
    ):
        response = client.get(f"/api/v1/question-bookmarks/{sample_bookmark.id}", headers=second_student_headers)
        assert response.status_code == 403


class TestUpdateBookmark:
    def test_update_bookmark_success(self, client, student_headers, sample_bookmark):
        response = client.put(
            f"/api/v1/question-bookmarks/{sample_bookmark.id}",
            json={"notes": "Updated notes", "tags": "revised"},
            headers=student_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes"
        assert data["tags"] == "revised"

    def test_update_bookmark_not_found(self, client, student_headers):
        response = client.put(
            "/api/v1/question-bookmarks/999999",
            json={"notes": "X"},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_update_bookmark_owned_by_another_student_forbidden(
        self, client, second_student_headers, sample_bookmark
    ):
        response = client.put(
            f"/api/v1/question-bookmarks/{sample_bookmark.id}",
            json={"notes": "Hacked"},
            headers=second_student_headers,
        )
        assert response.status_code == 403


class TestDeleteBookmark:
    def test_delete_bookmark_success(self, client, student_headers, sample_bookmark):
        response = client.delete(f"/api/v1/question-bookmarks/{sample_bookmark.id}", headers=student_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/question-bookmarks/{sample_bookmark.id}", headers=student_headers)
        assert get_response.status_code == 404

    def test_delete_bookmark_not_found(self, client, student_headers):
        response = client.delete("/api/v1/question-bookmarks/999999", headers=student_headers)
        assert response.status_code == 404

    def test_delete_bookmark_owned_by_another_student_forbidden(
        self, client, student_headers, second_student_headers, sample_bookmark
    ):
        """A student must never be able to delete another student's
        bookmark -- this is the exact cross-owner gap called out as a
        pattern to check for in this router specifically."""
        response = client.delete(f"/api/v1/question-bookmarks/{sample_bookmark.id}", headers=second_student_headers)
        assert response.status_code == 403

        # And it must still exist afterwards.
        still_there = client.get(f"/api/v1/question-bookmarks/{sample_bookmark.id}", headers=student_headers)
        assert still_there.status_code == 200


# ---------------------------------------------------------------------------
# Check bookmark status
# ---------------------------------------------------------------------------
class TestCheckBookmark:
    def test_check_bookmark_true_when_bookmarked(self, client, student_headers, sample_bookmark, sample_question):
        response = client.get(f"/api/v1/question-bookmarks/check/{sample_question.id}", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_bookmarked"] is True
        assert data["bookmark"]["id"] == sample_bookmark.id

    def test_check_bookmark_false_when_not_bookmarked(self, client, student_headers, second_question):
        response = client.get(f"/api/v1/question-bookmarks/check/{second_question.id}", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_bookmarked"] is False
        assert data["bookmark"] is None

    def test_check_bookmark_is_per_user(self, client, second_student_headers, sample_bookmark, sample_question):
        """Another student bookmarking nothing must not see the first
        student's bookmark reflected back for the same question."""
        response = client.get(f"/api/v1/question-bookmarks/check/{sample_question.id}", headers=second_student_headers)
        assert response.status_code == 200
        assert response.json()["is_bookmarked"] is False

    def test_check_bookmark_unauthenticated(self, client, sample_question):
        response = client.get(f"/api/v1/question-bookmarks/check/{sample_question.id}")
        assert response.status_code == 403
