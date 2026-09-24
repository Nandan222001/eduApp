"""Integration tests for the `student_employment` router
(src/api/v1/student_employment.py).

Job listings, work permits, student employment records, and job
applications.

Every endpoint already had `Depends(get_current_user)`, but real bugs were
found and fixed in this pass:

1. **Route-shadowing (bug class 7)**: `GET /work-permits/{permit_id}` and
   `PUT /work-permits/{permit_id}` were registered ahead of
   `GET /work-permits/expiring`, and `GET /employments/{employment_id}` /
   `PUT /employments/{employment_id}` were registered ahead of
   `GET /employments/verification-pending`. Since both routes in each pair
   share the same 2-segment shape and method, and the dynamic route's path
   param had no type converter, Starlette matched the dynamic route first,
   failed to convert `"expiring"`/`"verification-pending"` to `int`, and
   returned an unhandled 422 instead of ever reaching the static route.
   Fixed with the `{permit_id:int}`/`{employment_id:int}` path converter, so
   Starlette skips the dynamic route entirely when the segment isn't an int.
   `test_expiring_work_permits_not_shadowed` and
   `test_verification_pending_not_shadowed` are the regression tests.
2. **Cross-tenant creation gap (bug class 17) on all 4 create endpoints**
   (`create_job_listing`, `create_job_application`, `create_work_permit`,
   `create_student_employment`) -- `institution_id`/`student_id` are
   client-suppliable on every create schema and were never checked against
   the caller's own institution, while every read/update/delete endpoint
   scopes strictly by `current_user.institution_id`. Fixed by validating
   `institution_id` matches the caller and that `student_id` (and, for
   applications, `job_listing_id`; for employment, `work_permit_id`) belongs
   to the caller's own institution before creating the row.
"""
import uuid
from datetime import date, timedelta

import pytest

from src.models.institution import Institution
from src.models.student import Student
from src.models.student_employment import StudentJobListing, WorkPermit, StudentEmployment
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
def job_listing(db_session, institution) -> StudentJobListing:
    listing = StudentJobListing(
        institution_id=institution.id,
        employer_name="Local Cafe",
        job_title="Barista",
        job_type="part_time",
        description="Serve coffee and snacks.",
        is_active=True,
        posting_date=date.today(),
    )
    db_session.add(listing)
    db_session.commit()
    db_session.refresh(listing)
    return listing


@pytest.fixture
def work_permit(db_session, institution, student) -> WorkPermit:
    permit = WorkPermit(
        institution_id=institution.id,
        student_id=student.id,
        permit_type="state_specific",
        issue_date=date.today(),
        expiry_date=date.today() + timedelta(days=10),
        is_active=True,
    )
    db_session.add(permit)
    db_session.commit()
    db_session.refresh(permit)
    return permit


@pytest.fixture
def student_employment(db_session, institution, student) -> StudentEmployment:
    employment = StudentEmployment(
        institution_id=institution.id,
        student_id=student.id,
        employer="Local Cafe",
        job_title="Barista",
        job_type="part_time",
        start_date=date.today(),
        is_current=True,
        is_active=True,
        verified_for_graduation=False,
    )
    db_session.add(employment)
    db_session.commit()
    db_session.refresh(employment)
    return employment


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
def test_list_job_listings_requires_auth(client):
    response = client.get("/api/v1/student-employment/job-listings")
    assert response.status_code in (401, 403)


def test_create_work_permit_requires_auth(client, institution, student):
    response = client.post(
        "/api/v1/student-employment/work-permits",
        json={
            "institution_id": institution.id,
            "student_id": student.id,
            "permit_type": "state_specific",
            "issue_date": str(date.today()),
            "expiry_date": str(date.today() + timedelta(days=30)),
        },
    )
    assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Route-shadowing regression
# ---------------------------------------------------------------------------
def test_expiring_work_permits_not_shadowed(client, auth_headers, work_permit):
    response = client.get("/api/v1/student-employment/work-permits/expiring?days=30", headers=auth_headers)
    assert response.status_code == 200, response.text
    ids = [p["id"] for p in response.json()]
    assert work_permit.id in ids


def test_verification_pending_not_shadowed(client, auth_headers, student_employment):
    response = client.get("/api/v1/student-employment/employments/verification-pending", headers=auth_headers)
    assert response.status_code == 200, response.text
    ids = [e["id"] for e in response.json()]
    assert student_employment.id in ids


# ---------------------------------------------------------------------------
# Cross-tenant creation gap regression
# ---------------------------------------------------------------------------
def test_create_job_listing_forbidden_for_other_institution(client, auth_headers, other_institution):
    response = client.post(
        "/api/v1/student-employment/job-listings",
        json={
            "institution_id": other_institution.id,
            "employer_name": "Sneaky Corp",
            "job_title": "Intern",
            "job_type": "internship",
            "description": "desc",
        },
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_create_work_permit_rejects_cross_institution_student(client, other_admin_headers, institution, student):
    response = client.post(
        "/api/v1/student-employment/work-permits",
        json={
            "institution_id": student.institution_id,
            "student_id": student.id,
            "permit_type": "state_specific",
            "issue_date": str(date.today()),
            "expiry_date": str(date.today() + timedelta(days=30)),
        },
        headers=other_admin_headers,
    )
    # institution_id in the body belongs to `institution`, not the caller's
    # own (`other_institution`), so this must be rejected before the student
    # lookup is even reached.
    assert response.status_code == 403


def test_create_student_employment_rejects_cross_institution_student(client, auth_headers, other_admin_user, db_session, other_institution):
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
    other_student = Student(
        institution_id=other_institution.id, admission_number="OTH001", first_name="Other", last_name="Student",
        email=f"otherstudent{uuid.uuid4().hex[:8]}@otherschool.com", section_id=section.id,
        date_of_birth="2007-01-01", admission_date="2020-04-01", gender="Male", is_active=True,
    )
    db_session.add(other_student)
    db_session.commit()
    db_session.refresh(other_student)

    response = client.post(
        "/api/v1/student-employment/employments",
        json={
            "institution_id": other_student.institution_id,
            "student_id": other_student.id,
            "employer": "Some Employer",
            "job_title": "Cashier",
            "job_type": "part_time",
            "start_date": str(date.today()),
        },
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_create_job_application_rejects_cross_institution_job_listing(client, other_admin_headers, job_listing, other_institution, db_session):
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
    other_student = Student(
        institution_id=other_institution.id, admission_number="OTH002", first_name="Other2", last_name="Student",
        email=f"otherstudent2{uuid.uuid4().hex[:8]}@otherschool.com", section_id=section.id,
        date_of_birth="2007-01-01", admission_date="2020-04-01", gender="Male", is_active=True,
    )
    db_session.add(other_student)
    db_session.commit()
    db_session.refresh(other_student)

    response = client.post(
        "/api/v1/student-employment/applications",
        json={
            "institution_id": other_institution.id,
            "student_id": other_student.id,
            "job_listing_id": job_listing.id,
        },
        headers=other_admin_headers,
    )
    # `job_listing` belongs to the first institution, not `other_institution`.
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# CRUD + statistics
# ---------------------------------------------------------------------------
def test_create_and_get_job_listing(client, auth_headers, institution):
    response = client.post(
        "/api/v1/student-employment/job-listings",
        json={
            "institution_id": institution.id,
            "employer_name": "Book Store",
            "job_title": "Shelf Stocker",
            "job_type": "part_time",
            "description": "Stock shelves after school.",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    listing_id = response.json()["id"]

    get_response = client.get(f"/api/v1/student-employment/job-listings/{listing_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["employer_name"] == "Book Store"


def test_verify_employment_for_graduation(client, auth_headers, student_employment):
    response = client.post(
        f"/api/v1/student-employment/employments/{student_employment.id}/verify",
        json={"employment_id": student_employment.id, "verified_for_graduation": True},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["verified_for_graduation"] is True


def test_employment_statistics_overview(client, auth_headers, job_listing, student_employment, work_permit):
    response = client.get("/api/v1/student-employment/statistics/overview", headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["active_job_listings"] >= 1
    assert data["active_employments"] >= 1
    assert data["active_work_permits"] >= 1
    assert data["pending_verifications"] >= 1


def test_job_listing_from_other_institution_is_404(client, other_admin_headers, job_listing):
    response = client.get(f"/api/v1/student-employment/job-listings/{job_listing.id}", headers=other_admin_headers)
    assert response.status_code == 404
