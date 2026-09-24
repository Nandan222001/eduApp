"""Integration tests for the `study_buddy` router
(src/api/v1/study_buddy.py).

An AI study-buddy chat, per-student sessions/messages, study-pattern
analysis, daily plans, motivational messages, and insights.

Every endpoint already had `Depends(get_current_user)`, but the router had
almost no institution scoping at all -- 9 of its 10 endpoints took a bare
`student_id`/`session_id`/`insight_id` with zero verification that it
belonged to the caller's own institution (bug class 17, and a genuinely
severe one here: any authenticated user from any institution could read
another institution's student chat sessions/transcripts/insights, or end/
mark-read their records, just by guessing an id). Bugs found and fixed:

1. **Cross-tenant gap on `get_sessions`, `get_session`, `end_session`,
   `get_session_messages`, `analyze_study_patterns`, `get_daily_plan`,
   `get_motivational_message`, `get_insights`, `mark_insight_read`.** Fixed
   by threading `institution_id` through the service layer (sessions/
   insights) or verifying the target student belongs to the caller's own
   institution first (patterns/plan/motivational-message), consistently
   returning 404 for anything outside the caller's institution.
2. **`StudyBuddyInsight`/`StudyBuddyMessage.metadata` schema/model attribute
   mismatch (bug class 15)** -- both ORM models map their `metadata` DB
   column to the Python attribute `metadata_json` (SQLAlchemy's declarative
   `Base` reserves the bare `metadata` name for the class-level `MetaData`
   object), but both response schemas declared a plain `metadata` field.
   Under `from_attributes`, that read the class-level `MetaData` instance
   instead of the JSON payload and failed Pydantic validation -- a guaranteed
   500 on `GET /sessions/{id}/messages` or `GET /insights/{id}` for any
   record that actually carried metadata. Fixed by aliasing the field to
   read/write `metadata_json` while keeping the public field name `metadata`.
   Also, `create_insight` (currently unreachable from any endpoint) built its
   ORM object with `metadata=metadata`, which would have raised
   `TypeError: 'metadata' is an invalid keyword argument` on any call --
   fixed to use `metadata_json=metadata`.
3. **`analyze_study_patterns`'s `performance_trend` referenced
   `result.subject`, which does not exist on `ExamResult`** (it's a per-exam
   summary row with no subject relationship -- that lives on the joined
   `ExamSubject`/`ExamMarks` rows) -- an unconditional `AttributeError` for
   any student with any exam result in the last 30 days. Fixed to use the
   exam's own name instead.

`test_get_session_messages_returns_metadata_correctly` and
`test_get_insights_returns_metadata_correctly` are the regression tests for
bug (2); `test_analyze_study_patterns_with_exam_result` is the regression
test for bug (3).
"""
import uuid
from datetime import date, datetime, timedelta

import pytest

from src.models.institution import Institution
from src.models.student import Student
from src.models.study_buddy import StudyBuddySession, StudyBuddyMessage, StudyBuddyInsight
from src.models.user import User
from src.services.study_buddy_service import StudyBuddyService
from src.utils.security import get_password_hash


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
def other_student(db_session, other_institution) -> Student:
    from src.models.academic import AcademicYear, Grade, Section

    academic_year = AcademicYear(institution_id=other_institution.id, name="2024-2025", start_date="2024-04-01", end_date="2025-03-31", is_current=True)
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
    student = Student(
        institution_id=other_institution.id, admission_number="OTH001", first_name="Other", last_name="Student",
        email=f"otherstudent{uuid.uuid4().hex[:8]}@otherschool.com", section_id=section.id,
        date_of_birth="2007-01-01", admission_date="2020-04-01", gender="Male", is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def buddy_session(db_session, institution, student) -> StudyBuddySession:
    s = StudyBuddySession(
        institution_id=institution.id,
        student_id=student.id,
        session_title="Help with algebra",
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def other_buddy_session(db_session, other_institution, other_student) -> StudyBuddySession:
    s = StudyBuddySession(
        institution_id=other_institution.id,
        student_id=other_student.id,
        session_title="Other institution's private session",
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def buddy_insight(db_session, institution, student) -> StudyBuddyInsight:
    service = StudyBuddyService(db_session)
    return service.create_insight(
        institution_id=institution.id,
        student_id=student.id,
        insight_type="weak_area",
        title="Focus on Algebra",
        content="You've been struggling with linear equations.",
        priority=2,
        metadata={"source": "test"},
    )


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
def test_get_sessions_requires_auth(client, student):
    response = client.get(f"/api/v1/study-buddy/sessions?student_id={student.id}")
    assert response.status_code in (401, 403)


def test_chat_requires_auth(client):
    response = client.post("/api/v1/study-buddy/chat", json={"message": "hi"})
    assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Cross-tenant scoping regression
# ---------------------------------------------------------------------------
def test_create_session_rejects_cross_institution_student(client, auth_headers, other_student):
    response = client.post(
        "/api/v1/study-buddy/sessions",
        json={"student_id": other_student.id, "session_title": "Sneaky session"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_get_sessions_rejects_cross_institution_student(client, auth_headers, other_student):
    response = client.get(f"/api/v1/study-buddy/sessions?student_id={other_student.id}", headers=auth_headers)
    assert response.status_code == 404


def test_get_session_from_other_institution_is_404(client, auth_headers, other_buddy_session):
    response = client.get(f"/api/v1/study-buddy/sessions/{other_buddy_session.id}", headers=auth_headers)
    assert response.status_code == 404


def test_end_session_from_other_institution_is_404(client, auth_headers, other_buddy_session):
    response = client.post(f"/api/v1/study-buddy/sessions/{other_buddy_session.id}/end", headers=auth_headers)
    assert response.status_code == 404


def test_get_session_messages_from_other_institution_is_404(client, auth_headers, other_buddy_session):
    response = client.get(f"/api/v1/study-buddy/sessions/{other_buddy_session.id}/messages", headers=auth_headers)
    assert response.status_code == 404


def test_analyze_patterns_rejects_cross_institution_student(client, auth_headers, other_student):
    response = client.get(f"/api/v1/study-buddy/analyze-patterns/{other_student.id}", headers=auth_headers)
    assert response.status_code == 404


def test_daily_plan_rejects_cross_institution_student(client, auth_headers, other_student):
    response = client.get(f"/api/v1/study-buddy/daily-plan/{other_student.id}", headers=auth_headers)
    assert response.status_code == 404


def test_motivational_message_rejects_cross_institution_student(client, auth_headers, other_student):
    response = client.get(f"/api/v1/study-buddy/motivational-message/{other_student.id}", headers=auth_headers)
    assert response.status_code == 404


def test_get_insights_rejects_cross_institution_student(client, auth_headers, other_student):
    response = client.get(f"/api/v1/study-buddy/insights/{other_student.id}", headers=auth_headers)
    assert response.status_code == 404


def test_mark_insight_read_from_other_institution_is_404(client, auth_headers, db_session, other_institution, other_student):
    service = StudyBuddyService(db_session)
    foreign_insight = service.create_insight(
        institution_id=other_institution.id,
        student_id=other_student.id,
        insight_type="weak_area",
        title="Foreign insight",
        content="Should not be readable cross-tenant.",
    )
    response = client.post(f"/api/v1/study-buddy/insights/{foreign_insight.id}/mark-read", headers=auth_headers)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Happy paths
# ---------------------------------------------------------------------------
def test_create_and_get_session(client, auth_headers, student):
    response = client.post(
        "/api/v1/study-buddy/sessions",
        json={"student_id": student.id, "session_title": "Physics help"},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    session_id = response.json()["id"]

    get_response = client.get(f"/api/v1/study-buddy/sessions/{session_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == session_id


def test_end_session(client, auth_headers, buddy_session):
    response = client.post(f"/api/v1/study-buddy/sessions/{buddy_session.id}/end", headers=auth_headers)
    assert response.status_code == 200, response.text
    assert response.json()["is_active"] is False


def test_chat_creates_session_without_openai_configured(client, student_headers, student):
    """settings.openai_api_key defaults to empty in tests, so the service's
    `if not self.openai_client` fallback path is exercised -- verifies the
    chat endpoint's own-profile-derived student_id logic works end to end."""
    response = client.post(
        "/api/v1/study-buddy/chat",
        json={"message": "Can you help me with algebra?"},
        headers=student_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["session_id"] is not None
    assert "not configured" in data["response"].lower()


def test_daily_plan_success(client, auth_headers, student):
    response = client.get(f"/api/v1/study-buddy/daily-plan/{student.id}", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["date"] == date.today().strftime("%Y-%m-%d")
    assert isinstance(data["tasks"], list)


def test_motivational_message_success(client, auth_headers, student):
    response = client.get(f"/api/v1/study-buddy/motivational-message/{student.id}", headers=auth_headers)
    assert response.status_code == 200, response.text
    assert "message" in response.json()


# ---------------------------------------------------------------------------
# Regression: metadata/metadata_json attribute mismatch
# ---------------------------------------------------------------------------
def test_get_session_messages_returns_metadata_correctly(client, auth_headers, buddy_session, db_session):
    message = StudyBuddyMessage(
        session_id=buddy_session.id,
        role="user",
        content="What is a linear equation?",
        metadata_json={"tokens": 12},
    )
    db_session.add(message)
    db_session.commit()

    response = client.get(f"/api/v1/study-buddy/sessions/{buddy_session.id}/messages", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 1
    assert data[0]["metadata"] == {"tokens": 12}


def test_get_insights_returns_metadata_correctly(client, auth_headers, student, buddy_insight):
    response = client.get(f"/api/v1/study-buddy/insights/{student.id}", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 1
    assert data[0]["metadata"] == {"source": "test"}


def test_mark_insight_read_success(client, auth_headers, buddy_insight):
    response = client.post(f"/api/v1/study-buddy/insights/{buddy_insight.id}/mark-read", headers=auth_headers)
    assert response.status_code == 200, response.text
    assert response.json()["is_read"] is True


# ---------------------------------------------------------------------------
# Regression: `result.subject` AttributeError in analyze_study_patterns
# ---------------------------------------------------------------------------
def test_analyze_study_patterns_with_exam_result(client, auth_headers, db_session, institution, student, academic_year, grade):
    from src.models.examination import Exam, ExamResult, ExamType, ExamStatus

    exam = Exam(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        grade_id=grade.id,
        name="Mid-Term Exam",
        exam_type=ExamType.UNIT_TEST if hasattr(ExamType, "UNIT_TEST") else list(ExamType)[0],
        start_date=date.today() - timedelta(days=5),
        end_date=date.today() - timedelta(days=4),
        status=ExamStatus.COMPLETED if hasattr(ExamStatus, "COMPLETED") else list(ExamStatus)[0],
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)

    result = ExamResult(
        institution_id=institution.id,
        exam_id=exam.id,
        student_id=student.id,
        total_marks_obtained=72,
        total_max_marks=100,
        percentage=72.0,
        is_pass=True,
    )
    db_session.add(result)
    db_session.commit()

    response = client.get(f"/api/v1/study-buddy/analyze-patterns/{student.id}", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data["performance_trend"]) == 1
    assert data["performance_trend"][0]["subject"] == "Mid-Term Exam"
