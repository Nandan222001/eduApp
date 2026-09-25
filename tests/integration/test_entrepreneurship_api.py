"""Integration tests for the `entrepreneurship` router
(src/api/v1/entrepreneurship.py).

Student ventures, pitch competitions (with judge scoring), mentors +
mentor-venture mentorship relationships, and venture funding requests.
Every endpoint already had `Depends(get_current_user)`, so authentication
itself was intact; the bugs below are all in what an authenticated caller
was allowed to do.

Bugs found and fixed while writing this coverage:

1. **`POST /submissions/{submission_id}/score` silently dropped every
   judge's score after the first one on the same submission** --
   `PitchSubmission.judge_scores` is a plain JSON column, not wrapped in
   `sqlalchemy.ext.mutable.MutableDict`, so SQLAlchemy's change tracking
   only notices a *reassignment* of the column, not an in-place mutation of
   the dict object it already holds. The handler did
   `submission.judge_scores[str(judge_id)] = {...}` (a mutation). This
   happened to work the very first time a submission was scored (that call
   also does `submission.judge_scores = {}` immediately before it, which
   *is* a tracked reassignment), but for every subsequent judge scoring the
   same submission, `db.commit()` silently omitted `judge_scores` from its
   UPDATE entirely, and the following `db.refresh()` then overwrote the
   in-memory dict with the (still-missing-that-score) DB value -- losing
   the judge's score permanently, both from the response and from the
   database, while still reporting 200 OK. Confirmed both ways: DB row
   inspected directly after two judges scored, and via a second GET.
   Fixed by building a new dict and reassigning the column (tracked)
   instead of mutating in place.
2. **Cross-tenant write gap (bug class 12) across every
   create/update/delete endpoint in this router** -- `create_venture`,
   `update_venture`, `delete_venture`, `create_competition`,
   `update_competition`, `create_mentor`, `update_mentor`,
   `create_mentorship`, `update_mentorship`, `create_funding_request`, and
   `update_funding_request` never checked the caller's institution against
   either the client-supplied `institution_id` (on create) or the existing
   record's `institution_id` (on update/delete). Any authenticated user
   from institution A could create a venture/competition/mentor/
   mentorship/funding-request explicitly tagged with institution B's id,
   or update/delete institution B's existing records outright, just by
   knowing/guessing an id. This is distinct from this router's read-side
   endpoints (list/get/showcase), which are deliberately cross-institution
   by design (a public venture/competition/mentor discovery surface --
   every list endpoint takes an *optional* `institution_id` filter, and
   there's a dedicated, unfiltered `/showcase` endpoint), so those were
   left as-is. Fixed with a `_check_institution_access` helper (403 unless
   superuser, matching institution, or the target institution_id is
   `None` -- some records here, e.g. platform-wide mentors, are
   intentionally institution-less) applied to all 11 write sites.
3. **`POST /competitions/{id}/submit` and `POST /mentorships` never
   validated the `venture_id` they were given** -- both handed a
   client-supplied `venture_id` straight to their respective ORM
   constructors with zero existence check, so an unknown id raised an
   unhandled FK `IntegrityError` (500) instead of a clean 404. Fixed by
   looking the venture up first (404 if missing) in both handlers; this
   also closes the cross-tenant submission gap (a caller could otherwise
   submit *any* institution's venture into a competition, or start a
   mentorship for a venture it doesn't own) via the same
   `_check_institution_access` check applied to the looked-up venture.
"""
import uuid
from datetime import date, datetime, timedelta

import pytest

from src.models.entrepreneurship import (
    StudentVenture,
    PitchCompetition,
    PitchSubmission,
    EntrepreneurshipMentor,
    MentorshipRelationship,
    VentureFundingRequest,
    VentureStatus,
    CompetitionStatus,
    MentorshipStatus,
    FundingStatus,
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
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


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


@pytest.fixture
def venture(db_session, institution, student) -> StudentVenture:
    v = StudentVenture(
        institution_id=institution.id,
        venture_name="EcoBottle",
        founder_students=[student.id],
        primary_founder_id=student.id,
        business_idea="Reusable smart water bottles.",
        problem_statement="Single-use plastic waste.",
        solution="A durable, trackable reusable bottle.",
        target_market="Eco-conscious students.",
        venture_status=VentureStatus.IDEA,
    )
    db_session.add(v)
    db_session.commit()
    db_session.refresh(v)
    return v


@pytest.fixture
def competition(db_session, institution) -> PitchCompetition:
    c = PitchCompetition(
        institution_id=institution.id,
        competition_name="Spring Pitch Fest",
        description="Annual student pitch competition.",
        judges=[1, 2],
        submission_deadline=datetime.utcnow() + timedelta(days=7),
        status=CompetitionStatus.OPEN,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def mentor(db_session, institution) -> EntrepreneurshipMentor:
    m = EntrepreneurshipMentor(
        institution_id=institution.id,
        first_name="Jane",
        last_name="Mentor",
        email="jane.mentor@example.com",
        expertise_areas=[{"area": "fintech"}],
        mentoring_capacity=5,
        current_mentees=0,
        available_for_mentoring=True,
    )
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)
    return m


def _venture_payload(institution_id, primary_founder_id, **overrides):
    payload = {
        "institution_id": institution_id,
        "primary_founder_id": primary_founder_id,
        "venture_name": "New Venture",
        "founder_students": [primary_founder_id],
        "business_idea": "A great new idea.",
        "problem_statement": "A real problem.",
        "solution": "An elegant solution.",
        "target_market": "Everyone.",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Ventures
# ---------------------------------------------------------------------------
class TestVentures:
    def test_create_venture_requires_auth(self, client, institution, student):
        response = client.post(
            "/api/v1/entrepreneurship/ventures",
            json=_venture_payload(institution.id, student.id),
        )
        assert response.status_code in (401, 403)

    def test_create_venture(self, client, student_headers, institution, student):
        response = client.post(
            "/api/v1/entrepreneurship/ventures",
            json=_venture_payload(institution.id, student.id),
            headers=student_headers,
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["venture_name"] == "New Venture"
        assert data["venture_status"] == "idea"

    def test_create_venture_cross_institution_denied(
        self, client, student_headers, other_institution, student
    ):
        response = client.post(
            "/api/v1/entrepreneurship/ventures",
            json=_venture_payload(other_institution.id, student.id),
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_list_ventures(self, client, student_headers, venture):
        response = client.get("/api/v1/entrepreneurship/ventures", headers=student_headers)
        assert response.status_code == 200
        assert any(v["id"] == venture.id for v in response.json())

    def test_get_venture(self, client, student_headers, venture):
        response = client.get(f"/api/v1/entrepreneurship/ventures/{venture.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == venture.id

    def test_get_venture_not_found(self, client, student_headers):
        response = client.get("/api/v1/entrepreneurship/ventures/999999", headers=student_headers)
        assert response.status_code == 404

    def test_update_venture(self, client, student_headers, venture):
        response = client.put(
            f"/api/v1/entrepreneurship/ventures/{venture.id}",
            json={"venture_status": "development"},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["venture_status"] == "development"

    def test_update_venture_cross_institution_denied(
        self, client, other_admin_headers, venture
    ):
        response = client.put(
            f"/api/v1/entrepreneurship/ventures/{venture.id}",
            json={"venture_status": "development"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403

    def test_delete_venture_soft_deletes(self, client, db_session, student_headers, venture):
        response = client.delete(
            f"/api/v1/entrepreneurship/ventures/{venture.id}",
            headers=student_headers,
        )
        assert response.status_code == 204
        db_session.refresh(venture)
        assert venture.is_active is False

    def test_delete_venture_cross_institution_denied(
        self, client, other_admin_headers, venture
    ):
        response = client.delete(
            f"/api/v1/entrepreneurship/ventures/{venture.id}",
            headers=other_admin_headers,
        )
        assert response.status_code == 403

    def test_showcase(self, client, student_headers, venture):
        response = client.get("/api/v1/entrepreneurship/showcase", headers=student_headers)
        assert response.status_code == 200
        assert any(v["id"] == venture.id for v in response.json())


# ---------------------------------------------------------------------------
# Competitions + submissions + scoring
# ---------------------------------------------------------------------------
class TestCompetitionsAndScoring:
    def test_create_competition(self, client, teacher_headers, institution):
        response = client.post(
            "/api/v1/entrepreneurship/competitions",
            json={
                "institution_id": institution.id,
                "competition_name": "Fall Pitch Fest",
                "description": "A fall competition.",
                "submission_deadline": (datetime.utcnow() + timedelta(days=14)).isoformat(),
            },
            headers=teacher_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["status"] == "upcoming"

    def test_create_competition_cross_institution_denied(
        self, client, teacher_headers, other_institution
    ):
        response = client.post(
            "/api/v1/entrepreneurship/competitions",
            json={
                "institution_id": other_institution.id,
                "competition_name": "Cross Tenant Fest",
                "description": "Should be denied.",
                "submission_deadline": (datetime.utcnow() + timedelta(days=14)).isoformat(),
            },
            headers=teacher_headers,
        )
        assert response.status_code == 403

    def test_submit_pitch(self, client, student_headers, competition, venture):
        response = client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": venture.id},
            headers=student_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["venture_id"] == venture.id

    def test_submit_pitch_unknown_venture_returns_404(self, client, student_headers, competition):
        response = client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": 999999},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_submit_pitch_cross_institution_venture_denied(
        self, client, other_admin_headers, competition, venture
    ):
        response = client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": venture.id},
            headers=other_admin_headers,
        )
        assert response.status_code == 403

    def test_duplicate_submission_rejected(self, client, student_headers, competition, venture):
        client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": venture.id},
            headers=student_headers,
        )
        response = client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": venture.id},
            headers=student_headers,
        )
        assert response.status_code == 400

    def test_score_submission_multiple_judges_all_persist(
        self, client, db_session, student_headers, competition, venture
    ):
        """Regression test for the judge_scores in-place-mutation bug: a
        second judge's score must not silently overwrite/erase the first.
        """
        submit_resp = client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": venture.id},
            headers=student_headers,
        )
        submission_id = submit_resp.json()["id"]

        first = client.post(
            f"/api/v1/entrepreneurship/submissions/{submission_id}/score",
            json={
                "submission_id": submission_id,
                "judge_id": 1,
                "scores": {"innovation": "8", "clarity": "9"},
                "feedback": "Great start.",
            },
            headers=student_headers,
        )
        assert first.status_code == 200, first.text
        assert set(first.json()["judge_scores"].keys()) == {"1"}

        second = client.post(
            f"/api/v1/entrepreneurship/submissions/{submission_id}/score",
            json={
                "submission_id": submission_id,
                "judge_id": 2,
                "scores": {"innovation": "6", "clarity": "7"},
                "feedback": "Needs polish.",
            },
            headers=student_headers,
        )
        assert second.status_code == 200, second.text
        data = second.json()
        assert set(data["judge_scores"].keys()) == {"1", "2"}, (
            "judge 1's score was lost -- judge_scores in-place mutation bug regressed"
        )

        # Re-fetch from a clean query to confirm it was actually persisted,
        # not just reflected in this one response.
        submission = (
            db_session.query(PitchSubmission).filter(PitchSubmission.id == submission_id).first()
        )
        db_session.refresh(submission)
        assert set(submission.judge_scores.keys()) == {"1", "2"}
        expected_total = (8 + 9 + 6 + 7) / 4
        assert float(submission.total_score) == pytest.approx(expected_total)

    def test_score_submission_non_judge_rejected(self, client, student_headers, competition, venture):
        submit_resp = client.post(
            f"/api/v1/entrepreneurship/competitions/{competition.id}/submit",
            json={"competition_id": competition.id, "venture_id": venture.id},
            headers=student_headers,
        )
        submission_id = submit_resp.json()["id"]

        response = client.post(
            f"/api/v1/entrepreneurship/submissions/{submission_id}/score",
            json={
                "submission_id": submission_id,
                "judge_id": 999,
                "scores": {"innovation": "8"},
            },
            headers=student_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Mentors + mentorships
# ---------------------------------------------------------------------------
class TestMentorsAndMentorships:
    def test_create_mentor(self, client, teacher_headers, institution):
        response = client.post(
            "/api/v1/entrepreneurship/mentors",
            json={
                "institution_id": institution.id,
                "first_name": "Alex",
                "last_name": "Advisor",
                "email": "alex.advisor@example.com",
                "expertise_areas": [{"area": "marketing"}],
            },
            headers=teacher_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["email"] == "alex.advisor@example.com"

    def test_create_mentor_cross_institution_denied(
        self, client, teacher_headers, other_institution
    ):
        response = client.post(
            "/api/v1/entrepreneurship/mentors",
            json={
                "institution_id": other_institution.id,
                "first_name": "Alex",
                "last_name": "Advisor",
                "email": "alex.advisor2@example.com",
                "expertise_areas": [{"area": "marketing"}],
            },
            headers=teacher_headers,
        )
        assert response.status_code == 403

    def test_create_platform_wide_mentor_allowed(self, client, teacher_headers):
        """institution_id is nullable -- a platform-wide mentor (no
        institution) should be creatable by anyone authenticated.
        """
        response = client.post(
            "/api/v1/entrepreneurship/mentors",
            json={
                "first_name": "Platform",
                "last_name": "Mentor",
                "email": "platform.mentor@example.com",
                "expertise_areas": [{"area": "general"}],
            },
            headers=teacher_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["institution_id"] is None

    def test_match_mentor(self, client, student_headers, venture, mentor):
        response = client.post(
            "/api/v1/entrepreneurship/mentorships/match",
            json={"venture_id": venture.id},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        assert any(m["id"] == mentor.id for m in response.json())

    def test_create_mentorship(self, client, student_headers, venture, mentor):
        response = client.post(
            "/api/v1/entrepreneurship/mentorships",
            json={
                "institution_id": venture.institution_id,
                "mentor_id": mentor.id,
                "venture_id": venture.id,
                "goals": ["Find product-market fit"],
            },
            headers=student_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["status"] == "pending"

    def test_create_mentorship_unknown_venture_returns_404(self, client, student_headers, mentor):
        response = client.post(
            "/api/v1/entrepreneurship/mentorships",
            json={
                "institution_id": mentor.institution_id,
                "mentor_id": mentor.id,
                "venture_id": 999999,
            },
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_update_mentorship_activates_and_increments_mentee_count(
        self, client, db_session, student_headers, venture, mentor
    ):
        create_resp = client.post(
            "/api/v1/entrepreneurship/mentorships",
            json={
                "institution_id": venture.institution_id,
                "mentor_id": mentor.id,
                "venture_id": venture.id,
            },
            headers=student_headers,
        )
        mentorship_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/entrepreneurship/mentorships/{mentorship_id}",
            json={"status": "active"},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "active"

        db_session.refresh(mentor)
        assert mentor.current_mentees == 1

    def test_update_mentorship_cross_institution_denied(
        self, client, student_headers, other_admin_headers, venture, mentor
    ):
        create_resp = client.post(
            "/api/v1/entrepreneurship/mentorships",
            json={
                "institution_id": venture.institution_id,
                "mentor_id": mentor.id,
                "venture_id": venture.id,
            },
            headers=student_headers,
        )
        mentorship_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/entrepreneurship/mentorships/{mentorship_id}",
            json={"status": "active"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Funding requests
# ---------------------------------------------------------------------------
class TestFundingRequests:
    def test_create_funding_request(self, client, student_headers, venture):
        response = client.post(
            "/api/v1/entrepreneurship/funding-requests",
            json={
                "institution_id": venture.institution_id,
                "venture_id": venture.id,
                "amount_requested": "5000.00",
                "funding_purpose": "Prototype manufacturing.",
                "justification": "We need funds to build our MVP hardware.",
            },
            headers=student_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["status"] == "requested"

    def test_create_funding_request_cross_institution_denied(
        self, client, student_headers, other_institution, venture
    ):
        response = client.post(
            "/api/v1/entrepreneurship/funding-requests",
            json={
                "institution_id": other_institution.id,
                "venture_id": venture.id,
                "amount_requested": "5000.00",
                "funding_purpose": "Prototype manufacturing.",
                "justification": "We need funds to build our MVP hardware.",
            },
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_disburse_funding_updates_venture(
        self, client, db_session, teacher_headers, student_headers, venture
    ):
        create_resp = client.post(
            "/api/v1/entrepreneurship/funding-requests",
            json={
                "institution_id": venture.institution_id,
                "venture_id": venture.id,
                "amount_requested": "5000.00",
                "funding_purpose": "Prototype manufacturing.",
                "justification": "We need funds to build our MVP hardware.",
            },
            headers=student_headers,
        )
        request_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/entrepreneurship/funding-requests/{request_id}",
            json={"status": "disbursed", "disbursed_amount": "5000.00"},
            headers=teacher_headers,
        )
        assert response.status_code == 200, response.text

        db_session.refresh(venture)
        assert float(venture.funding_received) == 5000.00
        assert venture.venture_status == VentureStatus.DEVELOPMENT

    def test_update_funding_request_cross_institution_denied(
        self, client, student_headers, other_admin_headers, venture
    ):
        create_resp = client.post(
            "/api/v1/entrepreneurship/funding-requests",
            json={
                "institution_id": venture.institution_id,
                "venture_id": venture.id,
                "amount_requested": "5000.00",
                "funding_purpose": "Prototype manufacturing.",
                "justification": "We need funds to build our MVP hardware.",
            },
            headers=student_headers,
        )
        request_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/entrepreneurship/funding-requests/{request_id}",
            json={"status": "under_review"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403

    def test_get_funding_request_not_found(self, client, student_headers):
        response = client.get(
            "/api/v1/entrepreneurship/funding-requests/999999",
            headers=student_headers,
        )
        assert response.status_code == 404
