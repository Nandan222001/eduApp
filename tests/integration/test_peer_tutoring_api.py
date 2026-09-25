"""Integration tests for the `peer_tutoring` router
(src/api/v1/peer_tutoring.py).

Student peer tutoring: tutor profiles, session lifecycle (schedule/start/
complete/cancel), reviews, endorsements, badges/incentives/points,
moderation (teacher/admin only), leaderboards, matching preferences and
matching, and incentive redemption/session participants/flagging.

This router was mid-fix when this session picked it up (a previous agent
was cut off partway through). Bugs found and fixed to finish the job (on
top of the auth + institution-scoping work already done by that prior
pass; see the router's own docstrings for the per-endpoint detail):

1. **The last three endpoints in the file (`redeem_incentive`,
   `get_session_participants`, `flag_session`) still had zero auth
   dependency and zero institution scoping** -- any unauthenticated client
   could redeem/view/flag any institution's incentives/sessions by id.
   Fixed to require `Depends(get_current_user)` and scope to the caller's
   institution, matching every other endpoint in the router.
2. **Five response schemas' `metadata` field silently returned the wrong
   value (bug class 15, `metadata`/`metadata_json` shadowing, on the *read*
   side this time)**: `TutoringSessionResponse`, `TutorIncentiveResponse`,
   `TutorPointHistoryResponse`, `TutorLeaderboardResponse` and
   `MatchingPreferenceResponse` all declared a plain `metadata: Optional[Dict]`
   field, but the ORM column is named `metadata_json` (mapped to the `metadata`
   SQL column, since `metadata` is a reserved SQLAlchemy attribute).
   Pydantic's `from_attributes` conversion looked up `.metadata` on the ORM
   object for a field with no alias, which resolves to SQLAlchemy's
   *class-level* `MetaData` registry object, not the actual JSON data --
   a guaranteed `ResponseValidationError` on every response using any of
   these five schemas. Fixed with the same `validation_alias='metadata_json',
   serialization_alias='metadata'` pattern already used everywhere else in
   this codebase (`gamification.py`, `collaboration.py`, etc).
3. **Cross-tenant/cross-owner gaps (bug class 17) in several create
   endpoints that had already gained auth but never validated the *other*
   ids in their payload**: `create_tutor_profile` (`profile.user_id`),
   `create_session` (`tutor_id`/`student_id`), `create_review` (`session_id`),
   `create_endorsement` (`tutor_id`), `create_moderation_log` (`session_id`)
   and `create_matching_preference` (`student_id`) could all reference an
   entity belonging to a *different* institution with no rejection. Fixed
   by validating each referenced id belongs to the caller's own institution
   before writing (and, for `create_tutor_profile`, requiring staff to
   create a profile on behalf of anyone but themselves).
"""
import uuid
from datetime import datetime, timedelta

import pytest

from src.models.peer_tutoring import TutorProfile, TutoringSession, SessionStatus, SessionType
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
def other_teacher_role(db_session):
    from src.models.role import Role
    role = Role(name="Other Teacher", slug=f"teacher-{uuid.uuid4().hex[:8]}", is_system_role=True)
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


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def tutor_profile(db_session, institution, teacher_user) -> TutorProfile:
    t = TutorProfile(
        institution_id=institution.id,
        user_id=teacher_user.id,
        subjects={"1": {"level": 8}},
        availability={"monday": ["10:00-12:00"]},
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def other_tutor_profile(db_session, other_institution, other_teacher_user) -> TutorProfile:
    t = TutorProfile(
        institution_id=other_institution.id,
        user_id=other_teacher_user.id,
        subjects={"1": {"level": 5}},
        availability={},
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def session_obj(db_session, institution, tutor_profile, student) -> TutoringSession:
    s = TutoringSession(
        institution_id=institution.id,
        tutor_id=tutor_profile.id,
        student_id=student.id,
        title="Algebra help",
        scheduled_start=datetime.utcnow(),
        scheduled_end=datetime.utcnow() + timedelta(hours=1),
        status=SessionStatus.SCHEDULED,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TestAuth:
    def test_list_tutors_requires_auth(self, client):
        response = client.get("/api/v1/peer-tutoring/tutors")
        assert response.status_code in (401, 403)

    def test_redeem_incentive_requires_auth(self, client):
        response = client.post("/api/v1/peer-tutoring/incentives/1/redeem")
        assert response.status_code in (401, 403)

    def test_get_session_participants_requires_auth(self, client):
        response = client.get("/api/v1/peer-tutoring/sessions/1/participants")
        assert response.status_code in (401, 403)

    def test_flag_session_requires_auth(self, client):
        response = client.post(
            "/api/v1/peer-tutoring/sessions/1/flag", params={"reason": "spam"}
        )
        assert response.status_code in (401, 403)

    def test_create_moderation_log_requires_staff_role(
        self, client, student_headers, session_obj
    ):
        response = client.post(
            "/api/v1/peer-tutoring/moderation",
            json={
                "session_id": session_obj.id,
                "action_type": "warning",
                "reason": "Late to session",
            },
            headers=student_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Tutor profiles
# ---------------------------------------------------------------------------
class TestTutorProfiles:
    def test_create_own_tutor_profile(self, client, teacher_headers, teacher_user, institution):
        response = client.post(
            "/api/v1/peer-tutoring/tutors",
            json={
                "user_id": teacher_user.id,
                "subjects": {"1": {"level": 9}},
                "availability": {"tuesday": ["09:00-10:00"]},
            },
            headers=teacher_headers,
        )
        assert response.status_code == 201
        assert response.json()["institution_id"] == institution.id

    def test_student_cannot_create_profile_for_another_user(
        self, client, student_headers, teacher_user
    ):
        response = client.post(
            "/api/v1/peer-tutoring/tutors",
            json={
                "user_id": teacher_user.id,
                "subjects": {"1": {"level": 9}},
                "availability": {},
            },
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_get_tutor_profile_from_other_institution_is_404(
        self, client, other_teacher_headers, tutor_profile
    ):
        response = client.get(
            f"/api/v1/peer-tutoring/tutors/{tutor_profile.id}", headers=other_teacher_headers
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Sessions: create, cross-tenant, lifecycle
# ---------------------------------------------------------------------------
class TestSessions:
    def test_create_session_with_cross_institution_tutor_is_rejected(
        self, client, auth_headers, other_tutor_profile, student
    ):
        response = client.post(
            "/api/v1/peer-tutoring/sessions",
            json={
                "tutor_id": other_tutor_profile.id,
                "student_id": student.id,
                "title": "Cross tenant session",
                "scheduled_start": datetime.utcnow().isoformat(),
                "scheduled_end": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_full_session_lifecycle(self, client, auth_headers, tutor_profile, student):
        create_resp = client.post(
            "/api/v1/peer-tutoring/sessions",
            json={
                "tutor_id": tutor_profile.id,
                "student_id": student.id,
                "title": "Geometry help",
                "scheduled_start": datetime.utcnow().isoformat(),
                "scheduled_end": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            },
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        session_id = create_resp.json()["id"]

        start_resp = client.post(
            f"/api/v1/peer-tutoring/sessions/{session_id}/start",
            json={"meeting_url": "https://meet.example.com/xyz"},
            headers=auth_headers,
        )
        assert start_resp.status_code == 200
        assert start_resp.json()["status"] == "in_progress"

        complete_resp = client.post(
            f"/api/v1/peer-tutoring/sessions/{session_id}/complete",
            json={"tutor_notes": "Went well"},
            headers=auth_headers,
        )
        assert complete_resp.status_code == 200
        assert complete_resp.json()["status"] == "completed"

        participants_resp = client.get(
            f"/api/v1/peer-tutoring/sessions/{session_id}/participants", headers=auth_headers
        )
        assert participants_resp.status_code == 200

    def test_cancel_session_attributes_to_caller(self, client, auth_headers, admin_user, session_obj):
        response = client.post(
            f"/api/v1/peer-tutoring/sessions/{session_obj.id}/cancel",
            json={"cancellation_reason": "Conflict"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["cancelled_by"] == admin_user.id

    def test_flag_session(self, client, auth_headers, session_obj):
        response = client.post(
            f"/api/v1/peer-tutoring/sessions/{session_obj.id}/flag",
            params={"reason": "inappropriate content"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["session_id"] == session_obj.id

    def test_flag_session_from_other_institution_is_404(
        self, client, other_teacher_headers, session_obj
    ):
        response = client.post(
            f"/api/v1/peer-tutoring/sessions/{session_obj.id}/flag",
            params={"reason": "x"},
            headers=other_teacher_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class TestReviews:
    def test_create_review_for_own_completed_session(
        self, client, auth_headers, student_headers, tutor_profile, student, session_obj, db_session
    ):
        session_obj.status = SessionStatus.COMPLETED
        db_session.commit()

        response = client.post(
            "/api/v1/peer-tutoring/reviews",
            json={
                "session_id": session_obj.id,
                "rating": 5,
                "review_text": "Excellent tutor!",
            },
            headers=student_headers,
        )
        assert response.status_code == 201
        assert response.json()["student_id"] == student.id

    def test_create_review_for_cross_institution_session_is_rejected(
        self, client, student_headers, student, other_institution, db_session
    ):
        from src.models.peer_tutoring import TutorProfile as TP, TutoringSession as TS

        other_tutor = TP(
            institution_id=other_institution.id,
            user_id=student.user_id,
            subjects={},
            availability={},
        )
        db_session.add(other_tutor)
        db_session.commit()
        db_session.refresh(other_tutor)

        other_session = TS(
            institution_id=other_institution.id,
            tutor_id=other_tutor.id,
            student_id=student.id,
            title="Other inst session",
            scheduled_start=datetime.utcnow(),
            scheduled_end=datetime.utcnow() + timedelta(hours=1),
            status=SessionStatus.COMPLETED,
        )
        db_session.add(other_session)
        db_session.commit()
        db_session.refresh(other_session)

        response = client.post(
            "/api/v1/peer-tutoring/reviews",
            json={"session_id": other_session.id, "rating": 5},
            headers=student_headers,
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# Endorsements
# ---------------------------------------------------------------------------
class TestEndorsements:
    def test_create_endorsement_attributes_to_caller(
        self, client, auth_headers, admin_user, tutor_profile
    ):
        response = client.post(
            "/api/v1/peer-tutoring/endorsements",
            json={"tutor_id": tutor_profile.id, "endorsement_type": "subject_expertise"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["endorser_id"] == admin_user.id

    def test_create_endorsement_for_cross_institution_tutor_is_rejected(
        self, client, auth_headers, other_tutor_profile
    ):
        response = client.post(
            "/api/v1/peer-tutoring/endorsements",
            json={"tutor_id": other_tutor_profile.id, "endorsement_type": "subject_expertise"},
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Moderation (staff only)
# ---------------------------------------------------------------------------
class TestModeration:
    def test_teacher_can_create_and_resolve_moderation_log(
        self, client, auth_headers, session_obj
    ):
        create_resp = client.post(
            "/api/v1/peer-tutoring/moderation",
            json={
                "session_id": session_obj.id,
                "action_type": "warning",
                "reason": "Off-topic content",
            },
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        log_id = create_resp.json()["id"]

        resolve_resp = client.put(
            f"/api/v1/peer-tutoring/moderation/{log_id}/resolve",
            json={"resolution_notes": "Addressed with tutor"},
            headers=auth_headers,
        )
        assert resolve_resp.status_code == 200
        assert resolve_resp.json()["resolved"] is True

    def test_moderation_log_for_cross_institution_session_is_rejected(
        self, client, auth_headers, other_institution, other_tutor_profile, student, db_session
    ):
        from src.models.peer_tutoring import TutoringSession as TS

        other_session = TS(
            institution_id=other_institution.id,
            tutor_id=other_tutor_profile.id,
            student_id=student.id,
            title="Other inst session",
            scheduled_start=datetime.utcnow(),
            scheduled_end=datetime.utcnow() + timedelta(hours=1),
            status=SessionStatus.SCHEDULED,
        )
        db_session.add(other_session)
        db_session.commit()
        db_session.refresh(other_session)

        response = client.post(
            "/api/v1/peer-tutoring/moderation",
            json={
                "session_id": other_session.id,
                "action_type": "warning",
                "reason": "Cross tenant attempt",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Leaderboard, matching preferences, incentives
# ---------------------------------------------------------------------------
class TestLeaderboardMatchingIncentives:
    def test_leaderboard_update_and_get(self, client, auth_headers, tutor_profile, db_session):
        tutor_profile.status = "active"
        db_session.commit()

        update_resp = client.post("/api/v1/peer-tutoring/leaderboard/update", headers=auth_headers)
        assert update_resp.status_code == 200

        get_resp = client.get("/api/v1/peer-tutoring/leaderboard", headers=auth_headers)
        assert get_resp.status_code == 200

    def test_create_matching_preference_for_cross_institution_student_is_rejected(
        self, client, auth_headers, other_institution, db_session
    ):
        from src.models.student import Student
        from src.models.user import User as UserModel
        from src.models.role import Role

        role = Role(name="Other Student2", slug=f"student2-{uuid.uuid4().hex[:8]}", is_system_role=True)
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        other_user = UserModel(
            username=f"crossstudent{uuid.uuid4().hex[:8]}",
            email=f"crossstudent{uuid.uuid4().hex[:8]}@other.com",
            first_name="Cross",
            last_name="Student",
            hashed_password=get_password_hash("password123"),
            institution_id=other_institution.id,
            role_id=role.id,
            is_active=True,
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        other_student = Student(
            institution_id=other_institution.id,
            user_id=other_user.id,
            admission_number="CROSS001",
            first_name="Cross",
            last_name="Student",
            email=other_user.email,
            date_of_birth="2008-01-01",
            admission_date="2020-04-01",
            gender="Female",
            is_active=True,
        )
        db_session.add(other_student)
        db_session.commit()
        db_session.refresh(other_student)

        response = client.post(
            "/api/v1/peer-tutoring/matching-preferences",
            json={"student_id": other_student.id, "preferred_subjects": [1]},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_matching_preference_and_match(self, client, auth_headers, student, tutor_profile, db_session):
        tutor_profile.status = "active"
        tutor_profile.subjects = {"1": {"level": 9}}
        db_session.commit()

        pref_resp = client.post(
            "/api/v1/peer-tutoring/matching-preferences",
            json={"student_id": student.id, "preferred_subjects": [1]},
            headers=auth_headers,
        )
        assert pref_resp.status_code == 201

        match_resp = client.post(
            "/api/v1/peer-tutoring/match",
            json={"student_id": student.id, "subject_id": 1},
            headers=auth_headers,
        )
        assert match_resp.status_code == 200
        assert match_resp.json()["total_matches"] >= 1

    def test_redeem_incentive_scoped_to_institution(
        self, client, auth_headers, other_teacher_headers, tutor_profile, db_session
    ):
        from src.models.peer_tutoring import TutorIncentive, IncentiveType

        incentive = TutorIncentive(
            institution_id=tutor_profile.institution_id,
            tutor_id=tutor_profile.id,
            incentive_type=IncentiveType.SERVICE_HOURS,
            title="20 Hours Service Award",
        )
        db_session.add(incentive)
        db_session.commit()
        db_session.refresh(incentive)

        cross_resp = client.post(
            f"/api/v1/peer-tutoring/incentives/{incentive.id}/redeem",
            headers=other_teacher_headers,
        )
        assert cross_resp.status_code == 404

        own_resp = client.post(
            f"/api/v1/peer-tutoring/incentives/{incentive.id}/redeem", headers=auth_headers
        )
        assert own_resp.status_code == 200
        assert own_resp.json()["is_redeemed"] is True

    def test_check_incentive_eligibility(self, client, auth_headers, tutor_profile):
        response = client.get(
            f"/api/v1/peer-tutoring/tutors/{tutor_profile.id}/incentive-eligibility",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 3
