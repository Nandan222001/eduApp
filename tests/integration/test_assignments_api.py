"""
Integration tests for /api/v1/assignments (src/api/v1/assignments.py).

Covers: assignment CRUD, role/ownership restrictions (teacher-owns-assignment,
students cannot create), assignment file upload/delete (S3 calls mocked by
patching the shared `s3_client` singleton the service module imports --
`upload_file`/`delete_file` are patched on `src.services.assignment_service.
s3_client` directly rather than re-mocking boto3/moto, since the module-level
singleton is constructed once at import time with no AWS creds in the test
env and would otherwise always raise "S3 is not configured properly"),
submission listing/statistics/analytics under the assignment prefix, the
rubric CRUD sub-resource, rubric-based grading, and bulk submission download.

Bugs found and fixed in src/api/v1/assignments.py while writing these tests
(see TESTING_PROGRESS.md for the authoritative changelog entry):
1. `list_assignment_submissions`'s `status: Optional[SubmissionStatus] =
   Query(None)` path parameter shadowed the `status` module imported from
   fastapi (`from fastapi import ... status ...`) within the SAME function,
   which then did `raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
   ...)` a few lines later -- an AttributeError (`None`/a SubmissionStatus
   enum member has no `.HTTP_404_NOT_FOUND`) on every 404/403 path for this
   endpoint. Renamed the local/query parameter to `submission_status` (kept
   the wire-level query string name as `status` via `Query(..., alias=
   "status")` so no API consumer/frontend contract changes).
2. `create_assignment` had no role check at all beyond institution match --
   any authenticated user in the institution (including a student) could
   create an assignment as any teacher. Added: students are rejected, and a
   teacher may only create an assignment with their own `teacher_id`.
3. `update_assignment`/`delete_assignment` were missing the same
   teacher-owns-this-assignment check `get_assignment` already enforces
   (verified against `tests/integration/test_teachers_api.py::
   test_teacher_cannot_view_other_teacher_assignments`, which already
   expects this for GET) -- any teacher in the institution could edit or
   delete a colleague's assignment. Added the matching check to both.
4. `grade_submission_with_rubric` passed `grader_id=current_user.id` (a
   `users.id`) straight into `Submission.graded_by`, which is a
   `ForeignKey('teachers.id')` -- an IntegrityError on any real grading call
   unless a user's id happened to collide with a teacher's id. It also had
   no teacher-role/ownership check at all (any authenticated user, including
   a student, could call it). Fixed to resolve the caller's real `Teacher`
   row and enforce `assignment.teacher_id == teacher.id`, matching the
   already-correct pattern in `submissions.py`'s `grade_submission`.
"""
import io
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.teacher import Teacher
from src.models.student import Student
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.assignment import (
    Assignment,
    AssignmentFile,
    Submission,
    RubricCriteria,
    AssignmentStatus,
    SubmissionStatus,
)
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures (auth headers + a second teacher/institution for
# ownership/cross-tenant checks) -- following the pattern established in
# tests/integration/test_family_api.py and test_database_maintenance_api.py.
# ---------------------------------------------------------------------------

@pytest.fixture
def teacher_headers(client: TestClient, teacher_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def student_headers(client: TestClient, student_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_teacher_user(db_session: Session, institution: Institution, teacher_role: Role) -> User:
    user = User(
        username="teacher2_assign",
        email="teacher2_assign@testschool.com",
        first_name="Second",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=teacher_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_teacher(db_session: Session, institution: Institution, second_teacher_user: User) -> Teacher:
    teacher = Teacher(
        institution_id=institution.id,
        user_id=second_teacher_user.id,
        employee_id="EMP-ASSIGN-002",
        first_name=second_teacher_user.first_name,
        last_name=second_teacher_user.last_name,
        email=second_teacher_user.email,
        phone="+1234567893",
        date_of_birth=datetime(1987, 4, 12).date(),
        joining_date=datetime(2019, 8, 1).date(),
        qualification="M.Sc Physics",
        specialization="Physics",
        is_active=True,
    )
    db_session.add(teacher)
    db_session.commit()
    db_session.refresh(teacher)
    return teacher


@pytest.fixture
def second_teacher_headers(client: TestClient, second_teacher_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_institution(db_session: Session) -> Institution:
    import uuid
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1234567894",
        address="456 Other Street",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def assignment(
    db_session: Session,
    institution: Institution,
    teacher: Teacher,
    grade: Grade,
    section: Section,
    subject: Subject,
) -> Assignment:
    a = Assignment(
        institution_id=institution.id,
        teacher_id=teacher.id,
        grade_id=grade.id,
        section_id=section.id,
        subject_id=subject.id,
        title="Algebra Homework",
        description="Solve chapters 1-3",
        due_date=datetime.utcnow() + timedelta(days=7),
        max_marks=Decimal("100"),
        passing_marks=Decimal("40"),
        status=AssignmentStatus.PUBLISHED,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def cross_institution_assignment(
    db_session: Session,
    second_institution: Institution,
    teacher: Teacher,
    grade: Grade,
    section: Section,
    subject: Subject,
) -> Assignment:
    """An assignment that belongs to a different institution than the
    standard `institution`/`teacher_user`/`student_user` fixtures."""
    a = Assignment(
        institution_id=second_institution.id,
        teacher_id=teacher.id,
        grade_id=grade.id,
        section_id=section.id,
        subject_id=subject.id,
        title="Other Institution Assignment",
        max_marks=Decimal("100"),
        status=AssignmentStatus.PUBLISHED,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def mock_s3_upload():
    """Patch the shared s3_client singleton's upload/delete methods on the
    module the assignment service actually imports them into, matching this
    codebase's established patch-the-consuming-namespace convention (see
    TESTING_PROGRESS.md fix #31)."""
    with patch(
        "src.services.assignment_service.s3_client.upload_file",
        return_value="https://test-bucket.s3.amazonaws.com/assignments/fake-key.txt",
    ) as mock_upload, patch(
        "src.services.assignment_service.s3_client.delete_file",
        return_value=True,
    ) as mock_delete:
        yield mock_upload, mock_delete


# ---------------------------------------------------------------------------
# create_assignment
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestCreateAssignment:
    def test_admin_creates_assignment(
        self, client, auth_headers, institution, teacher, grade, section, subject
    ):
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "New Assignment",
                "description": "Do the thing",
                "due_date": (datetime.utcnow() + timedelta(days=5)).isoformat(),
                "max_marks": 100,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Assignment"
        assert data["status"] == "draft"
        assert data["is_active"] is True

    def test_teacher_creates_own_assignment(
        self, client, teacher_headers, institution, teacher, grade, section, subject
    ):
        response = client.post(
            "/api/v1/assignments/",
            headers=teacher_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Teacher Own Assignment",
                "max_marks": 100,
            },
        )
        assert response.status_code == 201
        assert response.json()["teacher_id"] == teacher.id

    def test_teacher_cannot_create_for_another_teacher(
        self, client, teacher_headers, teacher, institution, second_teacher, grade, section, subject
    ):
        response = client.post(
            "/api/v1/assignments/",
            headers=teacher_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": second_teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Impersonation Attempt",
                "max_marks": 100,
            },
        )
        assert response.status_code == 403

    def test_student_cannot_create_assignment(
        self, client, student_headers, student, institution, teacher, grade, section, subject
    ):
        response = client.post(
            "/api/v1/assignments/",
            headers=student_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Student Attempt",
                "max_marks": 100,
            },
        )
        assert response.status_code == 403

    def test_cross_institution_forbidden(
        self, client, auth_headers, teacher, grade, section, subject
    ):
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "institution_id": 999999,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Wrong Institution",
                "max_marks": 100,
            },
        )
        assert response.status_code == 403

    def test_due_date_before_publish_date_rejected(
        self, client, auth_headers, institution, teacher, grade, section, subject
    ):
        now = datetime.utcnow()
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Bad Dates",
                "max_marks": 100,
                "publish_date": (now + timedelta(days=5)).isoformat(),
                "due_date": (now + timedelta(days=1)).isoformat(),
            },
        )
        assert response.status_code == 400

    def test_close_date_before_due_date_rejected(
        self, client, auth_headers, institution, teacher, grade, section, subject
    ):
        now = datetime.utcnow()
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Bad Close Date",
                "max_marks": 100,
                "due_date": (now + timedelta(days=5)).isoformat(),
                "close_date": (now + timedelta(days=1)).isoformat(),
            },
        )
        assert response.status_code == 400

    def test_passing_marks_exceeding_max_marks_rejected_at_schema_level(
        self, client, auth_headers, institution, teacher, grade, section, subject
    ):
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "Bad Marks",
                "max_marks": 50,
                "passing_marks": 60,
            },
        )
        assert response.status_code == 422

    def test_unauthenticated_rejected(self, client, institution, teacher, grade, section, subject):
        response = client.post(
            "/api/v1/assignments/",
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "title": "No Auth",
                "max_marks": 100,
            },
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# list_assignments
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestListAssignments:
    def test_list_returns_own_institution_only(
        self, client, auth_headers, assignment, cross_institution_assignment
    ):
        response = client.get("/api/v1/assignments/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        ids = [item["id"] for item in data["items"]]
        assert assignment.id in ids
        assert cross_institution_assignment.id not in ids
        assert data["total"] >= 1

    def test_list_filter_by_status(self, client, auth_headers, assignment):
        response = client.get(
            "/api/v1/assignments/", headers=auth_headers, params={"status": "published"}
        )
        assert response.status_code == 200
        assert assignment.id in [item["id"] for item in response.json()["items"]]

        response2 = client.get(
            "/api/v1/assignments/", headers=auth_headers, params={"status": "archived"}
        )
        assert response2.status_code == 200
        assert assignment.id not in [item["id"] for item in response2.json()["items"]]

    def test_list_pagination_params(self, client, auth_headers, assignment):
        response = client.get(
            "/api/v1/assignments/", headers=auth_headers, params={"skip": 0, "limit": 1}
        )
        assert response.status_code == 200
        assert len(response.json()["items"]) <= 1

    def test_list_unauthenticated(self, client):
        response = client.get("/api/v1/assignments/")
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# get_assignment
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestGetAssignment:
    def test_get_happy_path(self, client, auth_headers, assignment):
        response = client.get(f"/api/v1/assignments/{assignment.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == assignment.id
        assert "attachment_files" in data

    def test_get_not_found(self, client, auth_headers):
        response = client.get("/api/v1/assignments/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_forbidden(self, client, auth_headers, cross_institution_assignment):
        response = client.get(
            f"/api/v1/assignments/{cross_institution_assignment.id}", headers=auth_headers
        )
        assert response.status_code == 403

    def test_teacher_can_view_own_assignment(self, client, teacher_headers, assignment):
        response = client.get(f"/api/v1/assignments/{assignment.id}", headers=teacher_headers)
        assert response.status_code == 200

    def test_teacher_cannot_view_other_teachers_assignment(
        self, client, second_teacher_headers, second_teacher, assignment
    ):
        response = client.get(f"/api/v1/assignments/{assignment.id}", headers=second_teacher_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# update_assignment
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestUpdateAssignment:
    def test_admin_updates_assignment(self, client, auth_headers, assignment):
        response = client.put(
            f"/api/v1/assignments/{assignment.id}",
            headers=auth_headers,
            json={"title": "Updated Title", "max_marks": 150},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert float(data["max_marks"]) == 150

    def test_owning_teacher_updates_assignment(self, client, teacher_headers, assignment):
        response = client.put(
            f"/api/v1/assignments/{assignment.id}",
            headers=teacher_headers,
            json={"title": "Teacher Updated"},
        )
        assert response.status_code == 200

    def test_other_teacher_cannot_update(self, client, second_teacher_headers, second_teacher, assignment):
        response = client.put(
            f"/api/v1/assignments/{assignment.id}",
            headers=second_teacher_headers,
            json={"title": "Hijacked"},
        )
        assert response.status_code == 403

    def test_update_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/assignments/999999", headers=auth_headers, json={"title": "X"}
        )
        assert response.status_code == 404

    def test_update_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment
    ):
        response = client.put(
            f"/api/v1/assignments/{cross_institution_assignment.id}",
            headers=auth_headers,
            json={"title": "X"},
        )
        assert response.status_code == 403

    def test_update_passing_marks_exceeds_max_marks(self, client, auth_headers, assignment):
        response = client.put(
            f"/api/v1/assignments/{assignment.id}",
            headers=auth_headers,
            json={"passing_marks": 999},
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# delete_assignment
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestDeleteAssignment:
    def test_admin_deletes_assignment(self, client, auth_headers, assignment):
        response = client.delete(f"/api/v1/assignments/{assignment.id}", headers=auth_headers)
        assert response.status_code == 204

        follow_up = client.get(f"/api/v1/assignments/{assignment.id}", headers=auth_headers)
        assert follow_up.status_code == 404

    def test_owning_teacher_deletes_assignment(self, client, teacher_headers, assignment):
        response = client.delete(f"/api/v1/assignments/{assignment.id}", headers=teacher_headers)
        assert response.status_code == 204

    def test_other_teacher_cannot_delete(self, client, second_teacher_headers, second_teacher, assignment):
        response = client.delete(
            f"/api/v1/assignments/{assignment.id}", headers=second_teacher_headers
        )
        assert response.status_code == 403

    def test_delete_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/assignments/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment
    ):
        response = client.delete(
            f"/api/v1/assignments/{cross_institution_assignment.id}", headers=auth_headers
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# assignment file upload/delete
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestAssignmentFiles:
    def test_upload_file_happy_path(self, client, auth_headers, assignment, mock_s3_upload):
        response = client.post(
            f"/api/v1/assignments/{assignment.id}/files",
            headers=auth_headers,
            files={"file": ("notes.txt", io.BytesIO(b"hello world"), "text/plain")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_name"] == "notes.txt"
        assert data["file_size"] == len(b"hello world")

    def test_upload_file_not_found(self, client, auth_headers, mock_s3_upload):
        response = client.post(
            "/api/v1/assignments/999999/files",
            headers=auth_headers,
            files={"file": ("notes.txt", io.BytesIO(b"data"), "text/plain")},
        )
        assert response.status_code == 404

    def test_upload_file_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment, mock_s3_upload
    ):
        response = client.post(
            f"/api/v1/assignments/{cross_institution_assignment.id}/files",
            headers=auth_headers,
            files={"file": ("notes.txt", io.BytesIO(b"data"), "text/plain")},
        )
        assert response.status_code == 403

    def test_delete_file_happy_path(self, client, auth_headers, assignment, mock_s3_upload, db_session):
        upload_response = client.post(
            f"/api/v1/assignments/{assignment.id}/files",
            headers=auth_headers,
            files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert upload_response.status_code == 200
        file_row = (
            db_session.query(AssignmentFile)
            .filter(AssignmentFile.assignment_id == assignment.id)
            .first()
        )
        assert file_row is not None

        response = client.delete(
            f"/api/v1/assignments/{assignment.id}/files/{file_row.id}", headers=auth_headers
        )
        assert response.status_code == 204

    def test_delete_file_not_found(self, client, auth_headers, assignment, mock_s3_upload):
        response = client.delete(
            f"/api/v1/assignments/{assignment.id}/files/999999", headers=auth_headers
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# list_assignment_submissions (regression coverage for the `status`-shadowing
# bug: hitting the 404/403 branches must return clean HTTP errors, not a
# 500 from an AttributeError on the shadowed `status` module).
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestListAssignmentSubmissions:
    def test_list_submissions_happy_path(self, client, auth_headers, assignment, student, db_session):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="my work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/{assignment.id}/submissions", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["student_id"] == student.id

    def test_list_submissions_filter_by_status(self, client, auth_headers, assignment, student, db_session):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="my work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/{assignment.id}/submissions",
            headers=auth_headers,
            params={"status": "submitted"},
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

        response2 = client.get(
            f"/api/v1/assignments/{assignment.id}/submissions",
            headers=auth_headers,
            params={"status": "graded"},
        )
        assert response2.status_code == 200
        assert response2.json()["total"] == 0

    def test_list_submissions_not_found_returns_404_not_500(self, client, auth_headers):
        """Regression test: previously crashed with an unhandled
        AttributeError (500) because the `status` path parameter shadowed
        the fastapi `status` module used by this exact 404 branch."""
        response = client.get(
            "/api/v1/assignments/999999/submissions", headers=auth_headers
        )
        assert response.status_code == 404

    def test_list_submissions_cross_institution_returns_403_not_500(
        self, client, auth_headers, cross_institution_assignment
    ):
        """Same regression as above, for the 403 branch."""
        response = client.get(
            f"/api/v1/assignments/{cross_institution_assignment.id}/submissions",
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_list_submissions_with_status_filter_not_found_still_404(self, client, auth_headers):
        """Even with the `status` query param actually populated (a real
        SubmissionStatus enum member, not None), the endpoint must still
        return 404 for a missing assignment instead of crashing."""
        response = client.get(
            "/api/v1/assignments/999999/submissions",
            headers=auth_headers,
            params={"status": "graded"},
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# get_submission_statistics / get_assignment_analytics
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestAssignmentStatisticsAndAnalytics:
    def test_statistics_happy_path(self, client, auth_headers, assignment, student, db_session):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="work",
            submitted_at=datetime.utcnow(),
            marks_obtained=Decimal("80"),
            status=SubmissionStatus.GRADED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/{assignment.id}/statistics", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["assignment_id"] == assignment.id
        assert data["graded_count"] == 1

    def test_statistics_not_found(self, client, auth_headers):
        response = client.get("/api/v1/assignments/999999/statistics", headers=auth_headers)
        assert response.status_code == 404

    def test_statistics_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment
    ):
        response = client.get(
            f"/api/v1/assignments/{cross_institution_assignment.id}/statistics",
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_analytics_happy_path(self, client, auth_headers, assignment):
        response = client.get(
            f"/api/v1/assignments/{assignment.id}/analytics", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == assignment.title

    def test_analytics_not_found(self, client, auth_headers):
        response = client.get("/api/v1/assignments/999999/analytics", headers=auth_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# get_assignment_with_rubric
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestAssignmentWithRubric:
    def test_get_with_rubric_happy_path(self, client, auth_headers, assignment):
        response = client.get(
            f"/api/v1/assignments/{assignment.id}/with-rubric", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["rubric_criteria"] == []

    def test_get_with_rubric_not_found(self, client, auth_headers):
        response = client.get("/api/v1/assignments/999999/with-rubric", headers=auth_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# rubric criteria CRUD
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestRubricCriteria:
    def test_create_criteria_happy_path(self, client, auth_headers, assignment):
        response = client.post(
            f"/api/v1/assignments/{assignment.id}/rubric",
            headers=auth_headers,
            json={
                "name": "Content Quality",
                "description": "How good is the content",
                "max_points": 10,
                "order": 0,
                "levels": [
                    {"name": "Excellent", "points": 10, "order": 0},
                    {"name": "Poor", "points": 2, "order": 1},
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Content Quality"
        assert len(data["levels"]) == 2

    def test_create_criteria_assignment_not_found(self, client, auth_headers):
        response = client.post(
            "/api/v1/assignments/999999/rubric",
            headers=auth_headers,
            json={"name": "X", "max_points": 10},
        )
        assert response.status_code == 404

    def test_create_criteria_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment
    ):
        response = client.post(
            f"/api/v1/assignments/{cross_institution_assignment.id}/rubric",
            headers=auth_headers,
            json={"name": "X", "max_points": 10},
        )
        assert response.status_code == 403

    def test_update_criteria_happy_path(self, client, auth_headers, assignment, db_session):
        criteria = RubricCriteria(
            assignment_id=assignment.id, name="Grammar", max_points=Decimal("5")
        )
        db_session.add(criteria)
        db_session.commit()

        response = client.put(
            f"/api/v1/assignments/{assignment.id}/rubric/{criteria.id}",
            headers=auth_headers,
            json={"name": "Grammar & Spelling", "max_points": 8},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Grammar & Spelling"
        assert float(data["max_points"]) == 8

    def test_update_criteria_not_found(self, client, auth_headers, assignment):
        response = client.put(
            f"/api/v1/assignments/{assignment.id}/rubric/999999",
            headers=auth_headers,
            json={"name": "X"},
        )
        assert response.status_code == 404

    def test_delete_criteria_happy_path(self, client, auth_headers, assignment, db_session):
        criteria = RubricCriteria(
            assignment_id=assignment.id, name="Formatting", max_points=Decimal("5")
        )
        db_session.add(criteria)
        db_session.commit()
        criteria_id = criteria.id

        response = client.delete(
            f"/api/v1/assignments/{assignment.id}/rubric/{criteria_id}", headers=auth_headers
        )
        assert response.status_code == 204

    def test_delete_criteria_not_found(self, client, auth_headers, assignment):
        response = client.delete(
            f"/api/v1/assignments/{assignment.id}/rubric/999999", headers=auth_headers
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# grade_submission_with_rubric (regression coverage for the graded_by FK
# bug + missing teacher-role check)
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestGradeSubmissionWithRubric:
    def test_owning_teacher_grades_with_rubric(
        self, client, teacher_headers, assignment, student, db_session
    ):
        criteria = RubricCriteria(
            assignment_id=assignment.id, name="Content", max_points=Decimal("10")
        )
        db_session.add(criteria)
        db_session.commit()
        db_session.refresh(criteria)

        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()
        db_session.refresh(submission)

        response = client.post(
            f"/api/v1/assignments/submissions/{submission.id}/grade-with-rubric",
            headers=teacher_headers,
            json={
                "marks_obtained": 9,
                "grade": "A",
                "feedback": "Great job",
                "rubric_grades": [{"criteria_id": criteria.id, "points_awarded": 9}],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "graded"
        assert data["graded_by"] is not None

        # graded_by must reference the real teachers.id row, not the user id.
        db_session.expire_all()
        graded = db_session.query(Submission).filter(Submission.id == submission.id).first()
        assert graded.graded_by == assignment.teacher_id

    def test_student_cannot_grade_with_rubric(
        self, client, student_headers, assignment, student, db_session
    ):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.post(
            f"/api/v1/assignments/submissions/{submission.id}/grade-with-rubric",
            headers=student_headers,
            json={"marks_obtained": 9, "rubric_grades": []},
        )
        assert response.status_code == 403

    def test_other_teacher_cannot_grade_with_rubric(
        self, client, second_teacher_headers, second_teacher, assignment, student, db_session
    ):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.post(
            f"/api/v1/assignments/submissions/{submission.id}/grade-with-rubric",
            headers=second_teacher_headers,
            json={"marks_obtained": 9, "rubric_grades": []},
        )
        assert response.status_code == 403

    def test_grade_with_rubric_not_found(self, client, teacher_headers):
        response = client.post(
            "/api/v1/assignments/submissions/999999/grade-with-rubric",
            headers=teacher_headers,
            json={"marks_obtained": 9, "rubric_grades": []},
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# get_submission_with_grades
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestGetSubmissionWithGrades:
    def test_happy_path(self, client, auth_headers, assignment, student, db_session):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/submissions/{submission.id}/with-grades", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == submission.id
        assert data["rubric_grades"] == []

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/assignments/submissions/999999/with-grades", headers=auth_headers
        )
        assert response.status_code == 404

    def test_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment, db_session
    ):
        other_student = Student(
            institution_id=cross_institution_assignment.institution_id,
            admission_number="XSCH001",
            first_name="Cross",
            last_name="Student",
            email="cross_student_assign@otherschool.com",
            date_of_birth=datetime(2008, 1, 1).date(),
            admission_date=datetime(2020, 1, 1).date(),
            is_active=True,
        )
        db_session.add(other_student)
        db_session.commit()

        submission = Submission(
            assignment_id=cross_institution_assignment.id,
            student_id=other_student.id,
            submission_text="work",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/submissions/{submission.id}/with-grades", headers=auth_headers
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# bulk_download_submissions
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestBulkDownloadSubmissions:
    def test_happy_path(self, client, auth_headers, assignment, student, db_session):
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text="my essay text",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/{assignment.id}/submissions/download", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"
        assert "attachment" in response.headers["content-disposition"]

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/assignments/999999/submissions/download", headers=auth_headers
        )
        assert response.status_code == 404

    def test_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment
    ):
        response = client.get(
            f"/api/v1/assignments/{cross_institution_assignment.id}/submissions/download",
            headers=auth_headers,
        )
        assert response.status_code == 403
