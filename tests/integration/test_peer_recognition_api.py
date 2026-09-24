"""Integration tests for the `peer_recognition` router
(src/api/v1/peer_recognition.py).

Peer-to-peer student recognitions (kindness/academic-help/etc.), likes, a
public appreciation wall, trending recognitions, badges, daily send limits,
and institution-level analytics.

Bugs found and fixed while writing/reviewing this coverage (most of the
auth/institution-scoping work was already done by a prior pass on this same
router before this session started; see the router's own docstrings for the
per-endpoint detail):

1. **Zero authentication on every endpoint, and every endpoint trusted
   arbitrary client-supplied `institution_id`/`student_id`/`from_student_id`
   query parameters** -- fixed by requiring `Depends(get_current_user)`
   everywhere, deriving `institution_id` from the caller, and deriving the
   *acting* student from the caller's own linked `Student` profile (never
   a client-supplied id) for `send_recognition`/`toggle_like`.
2. **`POST /analytics/update` had no role gate** -- any authenticated
   student could force a recompute of institution-wide analytics. Fixed
   with `require_roles(current_user, ["teacher", "admin", "super_admin"])`.
3. **`toggle_like` never scoped the recognition lookup to the caller's
   institution (cross-tenant gap, bug class 17)** -- a student could like/
   unlike another institution's recognition by guessing its id, mutating
   that institution's `likes_count`. Fixed by passing `institution_id`
   through to `PeerRecognitionService.toggle_like` and filtering on it.
4. **`POST /recognitions` (send_recognition) 100% failed on every successful
   send** (same shape as this session's earlier `content_marketplace.py`
   fix) -- `PeerRecognitionService.create_recognition` commits several more
   times *after* its own initial `db.refresh(recognition)` (incrementing
   the daily limit, awarding points, awarding badges, creating a
   notification), and this session's default `expire_on_commit=True`
   re-expires every attribute on `recognition` on each of those commits.
   The router then built its response from `recognition.__dict__` without
   refreshing again first, so by the time `PeerRecognitionResponse(**response_dict)`
   ran, the dict held only `_sa_instance_state` -- a pydantic
   `ValidationError` (500) on every call. Fixed with an explicit
   `db.refresh(recognition)` right before building the response dict.
"""
import uuid

import pytest

from src.models.peer_recognition import PeerRecognition, RecognitionType
from src.models.student import Student
from src.models.user import User
from src.utils.security import get_password_hash


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution
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
def other_student_role(db_session):
    from src.models.role import Role
    role = Role(name="Other Student", slug=f"student-{uuid.uuid4().hex[:8]}", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_student_user(db_session, other_institution, other_student_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otherstudent{suffix}",
        email=f"otherstudent{suffix}@otherschool.com",
        first_name="Other",
        last_name="Student",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_student_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_student(db_session, other_institution, other_student_user) -> Student:
    s = Student(
        institution_id=other_institution.id,
        user_id=other_student_user.id,
        admission_number="OTH001",
        first_name="Other",
        last_name="Student",
        email=other_student_user.email,
        date_of_birth="2008-01-01",
        admission_date="2020-04-01",
        gender="Male",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def other_student_headers(client, other_student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_student_user.email, "password": "password123"},
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
def second_student_user(db_session, institution, student_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"student2_{suffix}",
        email=f"student2_{suffix}@testschool.com",
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
def second_student(db_session, institution, second_student_user) -> Student:
    s = Student(
        institution_id=institution.id,
        user_id=second_student_user.id,
        admission_number="ADM002",
        first_name="Second",
        last_name="Student",
        email=second_student_user.email,
        date_of_birth="2008-02-02",
        admission_date="2020-04-01",
        gender="Male",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def recognition(db_session, institution, student, second_student) -> PeerRecognition:
    r = PeerRecognition(
        institution_id=institution.id,
        from_student_id=second_student.id,
        to_student_id=student.id,
        recognition_type=RecognitionType.KINDNESS,
        message="Thanks for helping me study!",
        is_public=True,
    )
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)
    return r


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TestAuth:
    def test_appreciation_wall_requires_auth(self, client):
        response = client.get("/api/v1/peer-recognition/appreciation-wall")
        assert response.status_code in (401, 403)

    def test_send_recognition_requires_auth(self, client):
        response = client.post(
            "/api/v1/peer-recognition/recognitions",
            json={"to_student_id": 1, "recognition_type": "kindness", "message": "hi"},
        )
        assert response.status_code in (401, 403)

    def test_update_analytics_requires_staff_role(self, client, student_headers, student):
        response = client.post(
            "/api/v1/peer-recognition/analytics/update", headers=student_headers
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Sending recognitions
# ---------------------------------------------------------------------------
class TestSendRecognition:
    def test_send_recognition_derives_acting_student_from_caller(
        self, client, student_headers, student, second_student
    ):
        response = client.post(
            "/api/v1/peer-recognition/recognitions",
            json={
                "to_student_id": second_student.id,
                "recognition_type": "teamwork",
                "message": "Great teamwork today!",
            },
            headers=student_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["from_student_id"] == student.id
        assert data["to_student_id"] == second_student.id

    def test_cannot_recognize_self(self, client, student_headers, student):
        response = client.post(
            "/api/v1/peer-recognition/recognitions",
            json={
                "to_student_id": student.id,
                "recognition_type": "kindness",
                "message": "I am great",
            },
            headers=student_headers,
        )
        assert response.status_code == 400

    def test_cannot_recognize_student_in_other_institution(
        self, client, student_headers, student, other_student
    ):
        response = client.post(
            "/api/v1/peer-recognition/recognitions",
            json={
                "to_student_id": other_student.id,
                "recognition_type": "kindness",
                "message": "Cross tenant attempt",
            },
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_daily_limit_enforced(self, client, student_headers, student, second_student, db_session):
        from src.models.peer_recognition import DailyRecognitionLimit
        from datetime import date

        limit = DailyRecognitionLimit(
            institution_id=student.institution_id,
            student_id=student.id,
            limit_date=date.today(),
            recognitions_sent=10,
            max_daily_limit=10,
        )
        db_session.add(limit)
        db_session.commit()

        response = client.post(
            "/api/v1/peer-recognition/recognitions",
            json={
                "to_student_id": second_student.id,
                "recognition_type": "kindness",
                "message": "Should be blocked",
            },
            headers=student_headers,
        )
        assert response.status_code == 429


# ---------------------------------------------------------------------------
# Likes (cross-tenant fix)
# ---------------------------------------------------------------------------
class TestToggleLike:
    def test_toggle_like_as_owning_institution(self, client, student_headers, recognition):
        response = client.post(
            f"/api/v1/peer-recognition/recognitions/{recognition.id}/like",
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["liked"] is True
        assert response.json()["likes_count"] == 1

        # toggling again unlikes it
        response2 = client.post(
            f"/api/v1/peer-recognition/recognitions/{recognition.id}/like",
            headers=student_headers,
        )
        assert response2.json()["liked"] is False
        assert response2.json()["likes_count"] == 0

    def test_toggle_like_from_other_institution_is_404(
        self, client, other_student_headers, other_student, recognition
    ):
        response = client.post(
            f"/api/v1/peer-recognition/recognitions/{recognition.id}/like",
            headers=other_student_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Reads: wall, received, trending, stats, badges
# ---------------------------------------------------------------------------
class TestReads:
    def test_appreciation_wall_shows_public_recognitions(
        self, client, student_headers, recognition
    ):
        response = client.get(
            "/api/v1/peer-recognition/appreciation-wall", headers=student_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 1
        assert data["recognitions"][0]["id"] == recognition.id

    def test_get_received_recognitions(self, client, student_headers, student, recognition):
        response = client.get(
            "/api/v1/peer-recognition/recognitions/received",
            params={"student_id": student.id},
            headers=student_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_student_recognition_stats(self, client, student_headers, student, recognition):
        response = client.get(
            f"/api/v1/peer-recognition/students/{student.id}/stats", headers=student_headers
        )
        assert response.status_code == 200
        assert response.json()["received_count"] == 1

    def test_recognition_types_listed(self, client, student_headers):
        response = client.get(
            "/api/v1/peer-recognition/recognition-types", headers=student_headers
        )
        assert response.status_code == 200
        values = [item["value"] for item in response.json()]
        assert "kindness" in values


# ---------------------------------------------------------------------------
# Analytics (staff only)
# ---------------------------------------------------------------------------
class TestAnalytics:
    def test_admin_can_update_and_get_daily_analytics(
        self, client, auth_headers, recognition
    ):
        update_resp = client.post(
            "/api/v1/peer-recognition/analytics/update", headers=auth_headers
        )
        assert update_resp.status_code == 200

        get_resp = client.get(
            "/api/v1/peer-recognition/analytics/daily", headers=auth_headers
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["total_recognitions"] == 1

    def test_positivity_index(self, client, auth_headers, recognition):
        response = client.get(
            "/api/v1/peer-recognition/analytics/positivity-index", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total_recognitions"] == 1
