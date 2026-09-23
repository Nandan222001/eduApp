"""Integration tests for the `feedback` router (src/api/v1/feedback.py).

Covers user-submitted feedback: submit, list own feedback, get by id,
stats summary. `Feedback` is a purely user-owned resource (no
institution_id at all), and every lookup already scopes strictly to
`user_id == current_user.id` -- this was checked carefully per this
task's explicit callout on `feedback.py` for a same-owner authorization
gap, and none was found; the existing scoping was already correct.

Two real bugs were found and fixed in `src/api/v1/feedback.py` before
writing these tests (see the commit message for full detail):

1. Every endpoint declared `db: AsyncSession = Depends(get_db)` and used
   `await db.execute(...)` / `await db.commit()` / `await db.refresh(...)`,
   but `src.database.get_db` only ever yields a plain synchronous
   `sqlalchemy.orm.Session` (confirmed via `SessionLocal = sessionmaker(...)`
   with no async engine anywhere in this codebase) -- `await`-ing a
   `Session.execute()`/`.commit()`/`.refresh()` call raises
   `TypeError: object ... can't be used in 'await' expression` immediately,
   so literally every endpoint in this router was completely broken. Fixed
   by switching to a plain `Session` and dropping `async`/`await`
   throughout, matching every sibling router in this codebase.
2. Bug class 1 (bare `metadata` field shadowing the real `metadata_json`
   column): `Feedback.metadata_json = Column('metadata', JSON, ...)` is the
   real mapped attribute, but `submit_feedback` constructed
   `FeedbackModel(..., metadata=feedback.metadata or {})`. Since `metadata`
   IS a valid `hasattr` on the declarative base (SQLAlchemy's own schema
   `MetaData` registry), the declarative constructor doesn't raise -- it
   silently does `setattr(self, "metadata", ...)`, shadowing the class-level
   `Base.metadata` descriptor on the instance and never actually populating
   the real `metadata_json` column (which falls back to its `default=dict`
   of `{}` instead). Fixed to pass `metadata_json=feedback.metadata or {}`
   at the constructor call site.

No Celery `.delay()` calls or Redis-backed features in this router.
"""
import uuid

import pytest

from src.models.user import User
from src.models.feedback import Feedback
from src.models.role import Role
from src.utils.security import get_password_hash


@pytest.fixture
def second_admin_user(db_session, institution, admin_role) -> User:
    """A second user in the SAME institution, for same-owner authorization checks."""
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"admin2_{suffix}",
        email=f"admin2_{suffix}@testschool.com",
        first_name="Second",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_admin_headers(client, second_admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_admin_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _payload(**overrides):
    payload = {
        "category": "bug",
        "subject": "Login page broken",
        "message": "Clicking submit does nothing on Safari.",
        "rating": 3,
    }
    payload.update(overrides)
    return payload


# ===========================================================================
# POST /feedback
# ===========================================================================
class TestSubmitFeedback:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/feedback", json=_payload())
        assert response.status_code == 403

    def test_submit_happy_path(self, client, auth_headers, admin_user, db_session):
        response = client.post("/api/v1/feedback", json=_payload(), headers=auth_headers)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["message"] == "Feedback submitted successfully"
        assert data["status"] == "pending"
        assert "feedback_id" in data

        db_session.expire_all()
        row = db_session.query(Feedback).filter(Feedback.id == data["feedback_id"]).first()
        assert row is not None
        assert row.user_id == admin_user.id
        assert row.category == "bug"
        assert row.subject == "Login page broken"
        assert row.status == "pending"

    def test_submit_persists_metadata_json_column(self, client, auth_headers, db_session):
        """Regression test for the metadata/metadata_json shadowing bug:
        the value sent as `metadata` in the request must actually land in
        the real `metadata_json` column, not get silently dropped."""
        response = client.post(
            "/api/v1/feedback",
            json=_payload(metadata={"browser": "Safari", "version": "17.0"}),
            headers=auth_headers,
        )
        assert response.status_code == 201
        feedback_id = response.json()["feedback_id"]

        db_session.expire_all()
        row = db_session.query(Feedback).filter(Feedback.id == feedback_id).first()
        assert row.metadata_json == {"browser": "Safari", "version": "17.0"}

    def test_submit_without_metadata_defaults_empty_dict(self, client, auth_headers, db_session):
        response = client.post("/api/v1/feedback", json=_payload(), headers=auth_headers)
        assert response.status_code == 201
        feedback_id = response.json()["feedback_id"]

        db_session.expire_all()
        row = db_session.query(Feedback).filter(Feedback.id == feedback_id).first()
        assert row.metadata_json == {}

    def test_submit_missing_subject_422(self, client, auth_headers):
        payload = _payload()
        del payload["subject"]
        response = client.post("/api/v1/feedback", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_submit_missing_message_422(self, client, auth_headers):
        payload = _payload()
        del payload["message"]
        response = client.post("/api/v1/feedback", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_submit_rating_out_of_range_422(self, client, auth_headers):
        response = client.post("/api/v1/feedback", json=_payload(rating=6), headers=auth_headers)
        assert response.status_code == 422

    def test_submit_without_rating(self, client, auth_headers):
        payload = _payload()
        del payload["rating"]
        response = client.post("/api/v1/feedback", json=payload, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["status"] == "pending"

    def test_submit_subject_too_long_422(self, client, auth_headers):
        response = client.post("/api/v1/feedback", json=_payload(subject="x" * 201), headers=auth_headers)
        assert response.status_code == 422


# ===========================================================================
# GET /feedback/my-feedback
# ===========================================================================
class TestMyFeedback:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/feedback/my-feedback")
        assert response.status_code == 403

    def test_returns_only_own_feedback(self, client, auth_headers, second_admin_headers):
        client.post("/api/v1/feedback", json=_payload(subject="Mine"), headers=auth_headers)
        client.post("/api/v1/feedback", json=_payload(subject="Theirs"), headers=second_admin_headers)

        response = client.get("/api/v1/feedback/my-feedback", headers=auth_headers)
        assert response.status_code == 200
        subjects = {f["subject"] for f in response.json()}
        assert "Mine" in subjects
        assert "Theirs" not in subjects

    def test_pagination(self, client, auth_headers):
        for i in range(3):
            client.post("/api/v1/feedback", json=_payload(subject=f"Item {i}"), headers=auth_headers)

        response = client.get("/api/v1/feedback/my-feedback", params={"skip": 0, "limit": 2}, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) <= 2

    def test_empty_list_when_no_feedback(self, client, second_admin_headers):
        response = client.get("/api/v1/feedback/my-feedback", headers=second_admin_headers)
        assert response.status_code == 200
        assert response.json() == []


# ===========================================================================
# GET /feedback/stats/summary
# ===========================================================================
class TestFeedbackStats:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/feedback/stats/summary")
        assert response.status_code == 403

    def test_stats_all_zero_when_no_feedback(self, client, second_admin_headers):
        response = client.get("/api/v1/feedback/stats/summary", headers=second_admin_headers)
        assert response.status_code == 200
        assert response.json() == {"total": 0, "pending": 0, "reviewed": 0, "resolved": 0}

    def test_stats_counts_by_status(self, client, auth_headers, admin_user, db_session):
        client.post("/api/v1/feedback", json=_payload(subject="Pending One"), headers=auth_headers)
        second = client.post("/api/v1/feedback", json=_payload(subject="To Resolve"), headers=auth_headers)

        # Manually flip status for the second one (no PATCH endpoint on this
        # router to change status -- it's presumably admin-only elsewhere).
        row = db_session.query(Feedback).filter(Feedback.id == second.json()["feedback_id"]).first()
        row.status = "resolved"
        db_session.commit()

        response = client.get("/api/v1/feedback/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["pending"] == 1
        assert data["resolved"] == 1
        assert data["reviewed"] == 0

    def test_stats_scoped_to_own_user(self, client, auth_headers, second_admin_headers):
        client.post("/api/v1/feedback", json=_payload(), headers=auth_headers)
        response = client.get("/api/v1/feedback/stats/summary", headers=second_admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] == 0


# ===========================================================================
# GET /feedback/{feedback_id}
# ===========================================================================
class TestGetFeedback:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/feedback/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 403

    def test_get_404_nonexistent(self, client, auth_headers):
        response = client.get("/api/v1/feedback/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert response.status_code == 404

    def test_get_invalid_uuid_422(self, client, auth_headers):
        response = client.get("/api/v1/feedback/not-a-uuid", headers=auth_headers)
        assert response.status_code == 422

    def test_get_happy_path(self, client, auth_headers):
        created = client.post("/api/v1/feedback", json=_payload(subject="Fetch Me"), headers=auth_headers)
        feedback_id = created.json()["feedback_id"]

        response = client.get(f"/api/v1/feedback/{feedback_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == feedback_id
        assert data["subject"] == "Fetch Me"
        assert data["status"] == "pending"

    def test_get_by_other_user_404(self, client, auth_headers, second_admin_headers):
        """Cross-owner authorization: another user in the SAME institution
        must not be able to read someone else's feedback submission by id."""
        created = client.post("/api/v1/feedback", json=_payload(subject="Private Feedback"), headers=auth_headers)
        feedback_id = created.json()["feedback_id"]

        response = client.get(f"/api/v1/feedback/{feedback_id}", headers=second_admin_headers)
        assert response.status_code == 404
