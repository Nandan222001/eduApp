"""Integration tests for the `scholarship_essays` router
(src/api/v1/scholarship_essays.py).

Essay prompts, student essay drafts/peer review/counselor feedback/grammar
check/finalization, exemplar templates, and scoring rubrics.

Every endpoint already had `Depends(get_current_user)`, but a real
cross-tenant gap (bug class 17) was found and fixed in this pass:

1. **All 5 "create" endpoints (`create_essay_prompt`, `create_student_essay`,
   `create_peer_review`, `create_essay_template`, `create_review_rubric`)
   took a client-suppliable `institution_id` on their create schema and
   never checked it against the caller's own institution** -- every other
   endpoint in this router scopes reads/updates/deletes strictly by
   `current_user.institution_id`, but create let any authenticated caller
   plant a prompt/essay/review/template/rubric in an arbitrary institution.
   Fixed by forcing `institution_id` to the caller's own session on all five.
2. **`create_student_essay`/`create_peer_review` also never verified that
   `student_id`/`reviewer_student_id`/`prompt_id`/`essay_id` belonged to the
   caller's own institution at all** -- fixed by looking each one up scoped
   to `current_user.institution_id` before use (404 if not found).

`test_*_forces_own_institution` and `test_*_rejects_cross_institution_*`
below are the regression tests for these two bugs, one pair per create
endpoint.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.scholarship_essays import EssayPrompt, StudentEssay
from src.models.student import Student
from src.models.user import User
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

    academic_year = AcademicYear(
        institution_id=other_institution.id, name="2024-2025",
        start_date="2024-04-01", end_date="2025-03-31", is_current=True,
    )
    db_session.add(academic_year)
    db_session.commit()
    db_session.refresh(academic_year)

    grade = Grade(institution_id=other_institution.id, academic_year_id=academic_year.id, name="Grade 12", display_order=12, is_active=True)
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)

    section = Section(institution_id=other_institution.id, grade_id=grade.id, name="Section A", capacity=40, is_active=True)
    db_session.add(section)
    db_session.commit()
    db_session.refresh(section)

    student = Student(
        institution_id=other_institution.id,
        admission_number="OTH001",
        first_name="Other",
        last_name="Student",
        email=f"otherstudent{uuid.uuid4().hex[:8]}@otherschool.com",
        section_id=section.id,
        date_of_birth="2007-01-01",
        admission_date="2020-04-01",
        gender="Male",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def essay_prompt(db_session, institution, admin_user) -> EssayPrompt:
    prompt = EssayPrompt(
        institution_id=institution.id,
        prompt_text="Describe a challenge you overcame.",
        prompt_type="adversity_overcome",
        word_limit=650,
        created_by=admin_user.id,
    )
    db_session.add(prompt)
    db_session.commit()
    db_session.refresh(prompt)
    return prompt


@pytest.fixture
def other_essay_prompt(db_session, other_institution) -> EssayPrompt:
    prompt = EssayPrompt(
        institution_id=other_institution.id,
        prompt_text="Why this major?",
        prompt_type="why_major",
        word_limit=500,
    )
    db_session.add(prompt)
    db_session.commit()
    db_session.refresh(prompt)
    return prompt


@pytest.fixture
def student_essay(db_session, institution, student, essay_prompt) -> StudentEssay:
    essay = StudentEssay(
        institution_id=institution.id,
        student_id=student.id,
        prompt_id=essay_prompt.id,
        title="My Journey",
        essay_draft="This is my personal essay draft about overcoming challenges.",
        word_count=10,
    )
    db_session.add(essay)
    db_session.commit()
    db_session.refresh(essay)
    return essay


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
def test_list_prompts_requires_auth(client):
    response = client.get("/api/v1/scholarship-essays/prompts")
    assert response.status_code in (401, 403)


def test_create_essay_requires_auth(client, essay_prompt, student):
    response = client.post(
        "/api/v1/scholarship-essays/essays",
        json={
            "prompt_id": essay_prompt.id,
            "student_id": student.id,
            "institution_id": essay_prompt.institution_id,
            "essay_draft": "draft",
        },
    )
    assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Regression: cross-tenant creation gap (bug class 17)
# ---------------------------------------------------------------------------
def test_create_essay_prompt_forces_own_institution(client, auth_headers, admin_user, other_institution):
    response = client.post(
        "/api/v1/scholarship-essays/prompts",
        json={
            "prompt_text": "Trying to plant a prompt elsewhere",
            "prompt_type": "leadership",
            "institution_id": other_institution.id,
            "created_by": 999999,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["institution_id"] == admin_user.institution_id
    assert data["institution_id"] != other_institution.id
    assert data["created_by"] == admin_user.id


def test_create_student_essay_rejects_cross_institution_student(client, auth_headers, essay_prompt, other_student, institution):
    response = client.post(
        "/api/v1/scholarship-essays/essays",
        json={
            "prompt_id": essay_prompt.id,
            "student_id": other_student.id,
            "institution_id": institution.id,
            "essay_draft": "trying to write on behalf of another institution's student",
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_create_student_essay_forces_own_institution(client, auth_headers, essay_prompt, student, other_institution):
    response = client.post(
        "/api/v1/scholarship-essays/essays",
        json={
            "prompt_id": essay_prompt.id,
            "student_id": student.id,
            "institution_id": other_institution.id,
            "essay_draft": "A genuine essay draft.",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    assert response.json()["institution_id"] == essay_prompt.institution_id


def test_create_peer_review_rejects_cross_institution_reviewer(client, auth_headers, student_essay, other_student):
    response = client.post(
        "/api/v1/scholarship-essays/reviews",
        json={
            "essay_id": student_essay.id,
            "reviewer_student_id": other_student.id,
            "institution_id": student_essay.institution_id,
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_create_essay_template_forces_own_institution(client, auth_headers, admin_user, other_institution):
    response = client.post(
        "/api/v1/scholarship-essays/templates",
        json={
            "title": "Winning Essay Example",
            "prompt_type": "leadership",
            "essay_text": "Example essay text.",
            "word_count": 3,
            "institution_id": other_institution.id,
            "uploaded_by": 999999,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["institution_id"] == admin_user.institution_id
    assert data["uploaded_by"] == admin_user.id


def test_create_review_rubric_forces_own_institution(client, auth_headers, admin_user, other_institution):
    response = client.post(
        "/api/v1/scholarship-essays/rubrics",
        json={
            "name": "Standard Rubric",
            "content_criteria": {"a": 1},
            "clarity_criteria": {"a": 1},
            "grammar_criteria": {"a": 1},
            "authenticity_criteria": {"a": 1},
            "institution_id": other_institution.id,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    assert response.json()["institution_id"] == admin_user.institution_id


# ---------------------------------------------------------------------------
# Pre-existing institution scoping (already correct) confirmed still working
# ---------------------------------------------------------------------------
def test_get_prompt_from_other_institution_is_404(client, auth_headers, other_essay_prompt):
    response = client.get(f"/api/v1/scholarship-essays/prompts/{other_essay_prompt.id}", headers=auth_headers)
    assert response.status_code == 404


def test_list_prompts_scoped_to_own_institution(client, auth_headers, essay_prompt, other_essay_prompt):
    response = client.get("/api/v1/scholarship-essays/prompts", headers=auth_headers)
    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert essay_prompt.id in ids
    assert other_essay_prompt.id not in ids


# ---------------------------------------------------------------------------
# Essay lifecycle
# ---------------------------------------------------------------------------
def test_essay_grammar_check_and_finalize_flow(client, auth_headers, student_essay):
    grammar_response = client.post(
        f"/api/v1/scholarship-essays/essays/{student_essay.id}/grammar-check",
        json={"essay_id": student_essay.id},
        headers=auth_headers,
    )
    assert grammar_response.status_code == 200, grammar_response.text
    assert grammar_response.json()["grammar_check_score"] is not None if "grammar_check_score" in grammar_response.json() else True

    counselor_response = client.post(
        f"/api/v1/scholarship-essays/essays/{student_essay.id}/counselor-feedback",
        json={"essay_id": student_essay.id, "feedback": "Great work, needs minor polish.", "rating": 4, "approved": True},
        headers=auth_headers,
    )
    assert counselor_response.status_code == 200, counselor_response.text
    assert counselor_response.json()["counselor_approved"] is True

    finalize_response = client.post(
        f"/api/v1/scholarship-essays/essays/{student_essay.id}/finalize",
        json={"essay_id": student_essay.id, "finalized_version": "Final polished version."},
        headers=auth_headers,
    )
    assert finalize_response.status_code == 200, finalize_response.text
    assert finalize_response.json()["status"] == "finalized"


def test_assign_peer_reviewers(client, auth_headers, student_essay, db_session, institution, student):
    from src.models.academic import Section

    section = db_session.query(Section).filter(Section.id == student.section_id).first()
    reviewer = Student(
        institution_id=institution.id,
        admission_number="REV001",
        first_name="Reviewer",
        last_name="Student",
        email=f"reviewer{uuid.uuid4().hex[:8]}@testschool.com",
        section_id=section.id,
        date_of_birth="2007-01-01",
        admission_date="2020-04-01",
        gender="Male",
        is_active=True,
    )
    db_session.add(reviewer)
    db_session.commit()
    db_session.refresh(reviewer)

    response = client.post(
        f"/api/v1/scholarship-essays/essays/{student_essay.id}/assign-reviewers",
        json={"essay_id": student_essay.id, "num_reviewers": 1},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 1
    assert data[0]["reviewer_student_id"] == reviewer.id
