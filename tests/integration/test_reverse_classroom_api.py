"""Integration tests for the `reverse_classroom` router
(src/api/v1/reverse_classroom.py).

Teaching sessions where a student explains a topic, AI analysis of that
explanation, teaching "challenges", and per-student/topic progress
analytics.

This router was left mid-fix by a prior, interrupted pass: `create_teaching_session`,
`create_session_with_audio` and `list_teaching_sessions` already had auth +
institution scoping added, but the rest of the router (single-session
get/update/analyze/delete, all 5 challenge endpoints, both progress
endpoints, and bulk-analyze) had not been reviewed at all. Completed in this
pass:

1. **Zero authentication and zero institution scoping on 12 of the router's
   17 endpoints** -- `get_teaching_session`, `update_teaching_session`,
   `analyze_session`, `delete_teaching_session`, all 5 challenge endpoints,
   both progress endpoints, and `bulk_analyze_sessions` took a bare
   `session_id`/`challenge_id`/`student_id` with no `Depends(get_current_user)`
   and no institution filter at all -- any unauthenticated caller could read,
   mutate or delete any institution's teaching sessions and challenges, or
   pull another institution's student/topic progress analytics by id.
   Fixed by adding `Depends(get_current_user)` plus institution-id filtering
   to every one of these, matching the pattern already applied to the three
   endpoints from the interrupted pass.
2. **`get_topic_progress` trusted a client-supplied `institution_id` query
   parameter** instead of deriving it from the caller's session -- fixed to
   use `current_user.institution_id`.
3. **`bulk_analyze_sessions` called `analyze_session_background` with the
   pre-fix 2-argument signature** (`session.id, session.topic_id`) after the
   interrupted pass had already changed that function's signature to take
   the request-scoped `db` as its first argument (to avoid opening a second
   `SessionLocal()` against the wrong credentials) -- this call site was
   never updated, so it silently passed `session.id` in as `db` and
   `session.topic_id` in as `session_id` with `topic_id` missing entirely,
   raising a `TypeError` in every queued background task. Fixed to pass
   `db` through.

`test_bulk_analyze_queues_and_analyzes_sessions` is the regression test for
bug (3): before the fix, the queued background task never ran to completion
(a `TypeError`, silently swallowed by FastAPI's background-task runner), so
`is_analyzed` never flipped to `True`.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.academic import Topic, Chapter
from src.models.reverse_classroom import TeachingSession, TeachingChallenge
from src.models.student import Student
from src.models.user import User
from src.utils.security import get_password_hash


FAKE_ANALYSIS_JSON = """{
    "correctly_explained": ["basic definition"],
    "missing_concepts": ["edge cases"],
    "confused_concepts": [],
    "understanding_level_percent": 75,
    "clarity_score": 80,
    "detailed_feedback": "Good explanation overall.",
    "follow_up_questions": ["What happens at the boundary?"],
    "suggestions": ["Cover edge cases next time"]
}"""

FAKE_EVALUATION_JSON = """{
    "score": 85,
    "strengths": ["Clear structure"],
    "areas_for_improvement": ["More examples"],
    "feedback": "Solid response."
}"""


class _FakeChoice:
    def __init__(self, content):
        self.message = type("Msg", (), {"content": content})()


class _FakeCompletion:
    def __init__(self, content):
        self.choices = [_FakeChoice(content)]


@pytest.fixture
def mock_openai(monkeypatch):
    """Patch the OpenAI chat completion call used throughout the service so
    tests don't depend on network access or a real API key, and so analysis/
    challenge/evaluation flows produce deterministic, assertable results."""
    calls = {"content": FAKE_ANALYSIS_JSON}

    def fake_create(*args, **kwargs):
        return _FakeCompletion(calls["content"])

    import src.services.reverse_classroom_service as svc
    monkeypatch.setattr(svc.client.chat.completions, "create", fake_create)
    return calls


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


@pytest.fixture
def chapter(db_session, institution, grade, subject) -> Chapter:
    c = Chapter(
        institution_id=institution.id,
        subject_id=subject.id,
        grade_id=grade.id,
        name="Algebra Basics",
        display_order=1,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def topic(db_session, institution, chapter) -> Topic:
    t = Topic(
        institution_id=institution.id,
        chapter_id=chapter.id,
        name="Linear Equations",
        description="Solving linear equations",
        display_order=1,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def teaching_session(db_session, institution, student, topic) -> TeachingSession:
    s = TeachingSession(
        institution_id=institution.id,
        student_id=student.id,
        topic_id=topic.id,
        explanation_type="text",
        explanation_content="A linear equation is an equation of degree 1.",
        is_analyzed=False,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def other_teaching_session(db_session, other_institution) -> TeachingSession:
    from src.models.academic import AcademicYear, Grade, Section, Subject as SubjectModel

    academic_year = AcademicYear(
        institution_id=other_institution.id, name="2024-2025",
        start_date="2024-04-01", end_date="2025-03-31", is_current=True,
    )
    db_session.add(academic_year)
    db_session.commit()
    db_session.refresh(academic_year)

    grade = Grade(institution_id=other_institution.id, academic_year_id=academic_year.id, name="Grade 10", display_order=10, is_active=True)
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)

    section = Section(institution_id=other_institution.id, grade_id=grade.id, name="Section A", capacity=40, is_active=True)
    db_session.add(section)
    db_session.commit()
    db_session.refresh(section)

    other_subject = SubjectModel(institution_id=other_institution.id, name="Science", code=f"SCI{uuid.uuid4().hex[:6]}", is_active=True)
    db_session.add(other_subject)
    db_session.commit()
    db_session.refresh(other_subject)

    other_chapter = Chapter(institution_id=other_institution.id, subject_id=other_subject.id, grade_id=grade.id, name="Forces", display_order=1)
    db_session.add(other_chapter)
    db_session.commit()
    db_session.refresh(other_chapter)

    other_topic = Topic(institution_id=other_institution.id, chapter_id=other_chapter.id, name="Newton's Laws", display_order=1)
    db_session.add(other_topic)
    db_session.commit()
    db_session.refresh(other_topic)

    other_student = Student(
        institution_id=other_institution.id,
        admission_number="OTH001",
        first_name="Other",
        last_name="Student",
        email=f"otherstudent{uuid.uuid4().hex[:8]}@otherschool.com",
        section_id=section.id,
        date_of_birth="2008-03-20",
        admission_date="2020-04-01",
        gender="Female",
        is_active=True,
    )
    db_session.add(other_student)
    db_session.commit()
    db_session.refresh(other_student)

    s = TeachingSession(
        institution_id=other_institution.id,
        student_id=other_student.id,
        topic_id=other_topic.id,
        explanation_type="text",
        explanation_content="Force equals mass times acceleration.",
        is_analyzed=False,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def teaching_challenge(db_session, teaching_session) -> TeachingChallenge:
    c = TeachingChallenge(
        institution_id=teaching_session.institution_id,
        session_id=teaching_session.id,
        student_id=teaching_session.student_id,
        difficulty="explain_to_10yo",
        challenge_prompt="Explain linear equations to a 10 year old.",
        completed=False,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "method,path_suffix",
    [
        ("get", "sessions"),
        ("get", "challenges"),
    ],
)
def test_list_endpoints_require_auth(client, method, path_suffix):
    response = getattr(client, method)(f"/api/v1/reverse-classroom/{path_suffix}")
    assert response.status_code in (401, 403)


def test_get_session_requires_auth(client, teaching_session):
    response = client.get(f"/api/v1/reverse-classroom/sessions/{teaching_session.id}")
    assert response.status_code in (401, 403)


def test_get_progress_requires_auth(client, student):
    response = client.get(f"/api/v1/reverse-classroom/progress/student/{student.id}")
    assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Cross-tenant scoping
# ---------------------------------------------------------------------------
def test_get_session_from_other_institution_is_404(client, auth_headers, other_teaching_session):
    response = client.get(f"/api/v1/reverse-classroom/sessions/{other_teaching_session.id}", headers=auth_headers)
    assert response.status_code == 404


def test_update_session_from_other_institution_is_404(client, auth_headers, other_teaching_session):
    response = client.put(
        f"/api/v1/reverse-classroom/sessions/{other_teaching_session.id}",
        json={"explanation_content": "hacked"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_delete_session_from_other_institution_is_404(client, auth_headers, other_teaching_session):
    response = client.delete(f"/api/v1/reverse-classroom/sessions/{other_teaching_session.id}", headers=auth_headers)
    assert response.status_code == 404


def test_list_sessions_scoped_to_own_institution(client, auth_headers, teaching_session, other_teaching_session):
    response = client.get("/api/v1/reverse-classroom/sessions", headers=auth_headers)
    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert teaching_session.id in ids
    assert other_teaching_session.id not in ids


def test_create_challenge_for_other_institution_session_is_404(client, auth_headers, other_teaching_session):
    response = client.post(
        "/api/v1/reverse-classroom/challenges",
        json={"session_id": other_teaching_session.id, "difficulty": "explain_to_10yo"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_get_progress_for_other_institution_student_is_404(client, auth_headers, other_teaching_session):
    other_student_id = other_teaching_session.student_id
    response = client.get(f"/api/v1/reverse-classroom/progress/student/{other_student_id}", headers=auth_headers)
    assert response.status_code == 404


def test_get_topic_progress_uses_own_institution_not_query_param(client, other_admin_headers, topic, institution):
    """Regression test: `institution_id` used to be a client-supplied query
    param, letting a caller from a different institution pull this
    institution's topic analytics just by passing its id. Now it's derived
    from the caller's own session, so a foreign caller gets back an
    (empty/zeroed) response scoped to *their own* institution, never this
    one's data."""
    response = client.get(
        f"/api/v1/reverse-classroom/progress/topic/{topic.id}?institution_id={institution.id}",
        headers=other_admin_headers,
    )
    assert response.status_code == 200
    # Scoped to the caller's own (data-less) institution, not the one they
    # tried to pass in the query string.
    assert response.json()["total_sessions"] == 0


# ---------------------------------------------------------------------------
# CRUD + AI-analysis flows
# ---------------------------------------------------------------------------
def test_create_and_get_session(client, auth_headers, student, topic):
    response = client.post(
        "/api/v1/reverse-classroom/sessions",
        json={
            "student_id": student.id,
            "topic_id": topic.id,
            "explanation_type": "text",
            "explanation_content": "A linear equation has degree one.",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    session_id = response.json()["id"]

    get_response = client.get(f"/api/v1/reverse-classroom/sessions/{session_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == session_id


def test_create_session_for_other_institution_student_is_404(client, auth_headers, other_teaching_session):
    response = client.post(
        "/api/v1/reverse-classroom/sessions",
        json={
            "student_id": other_teaching_session.student_id,
            "topic_id": other_teaching_session.topic_id,
            "explanation_type": "text",
            "explanation_content": "trying to create cross tenant",
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_analyze_session_success(client, auth_headers, teaching_session, mock_openai):
    response = client.post(f"/api/v1/reverse-classroom/sessions/{teaching_session.id}/analyze", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["understanding_level_percent"] == 75
    assert data["correctly_explained"] == ["basic definition"]


def test_create_and_submit_challenge(client, auth_headers, teaching_session, mock_openai):
    create_response = client.post(
        "/api/v1/reverse-classroom/challenges",
        json={"session_id": teaching_session.id, "difficulty": "explain_to_10yo"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    challenge_id = create_response.json()["id"]

    mock_openai["content"] = FAKE_EVALUATION_JSON
    submit_response = client.post(
        f"/api/v1/reverse-classroom/challenges/{challenge_id}/submit",
        json={"student_response": "I would explain it using a balance scale analogy."},
        headers=auth_headers,
    )
    assert submit_response.status_code == 200, submit_response.text
    data = submit_response.json()
    assert data["completed"] is True
    assert data["score"] == 85


def test_delete_challenge(client, auth_headers, teaching_challenge):
    response = client.delete(f"/api/v1/reverse-classroom/challenges/{teaching_challenge.id}", headers=auth_headers)
    assert response.status_code == 204

    follow_up = client.get(f"/api/v1/reverse-classroom/challenges/{teaching_challenge.id}", headers=auth_headers)
    assert follow_up.status_code == 404


def test_get_student_progress_success(client, auth_headers, student, teaching_session):
    response = client.get(f"/api/v1/reverse-classroom/progress/student/{student.id}", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["student_id"] == student.id
    assert data["total_sessions"] >= 1


# ---------------------------------------------------------------------------
# Regression: bulk-analyze's stale `analyze_session_background` call
# ---------------------------------------------------------------------------
def test_bulk_analyze_queues_and_analyzes_sessions(client, auth_headers, teaching_session, mock_openai):
    response = client.post(
        "/api/v1/reverse-classroom/sessions/bulk-analyze",
        json={"session_ids": [teaching_session.id]},
        headers=auth_headers,
    )
    assert response.status_code == 202, response.text
    assert teaching_session.id in response.json()["session_ids"]

    # The queued background task must have actually run to completion (the
    # old call passed the wrong arguments to `analyze_session_background`,
    # which raised `TypeError` in the background and never persisted this).
    get_response = client.get(f"/api/v1/reverse-classroom/sessions/{teaching_session.id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["is_analyzed"] is True
    assert get_response.json()["understanding_level_percent"] == 75


def test_bulk_analyze_scoped_to_own_institution(client, auth_headers, other_teaching_session):
    response = client.post(
        "/api/v1/reverse-classroom/sessions/bulk-analyze",
        json={"session_ids": [other_teaching_session.id]},
        headers=auth_headers,
    )
    assert response.status_code == 404
