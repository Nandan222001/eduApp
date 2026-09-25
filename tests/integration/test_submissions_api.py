"""
Integration tests for /api/v1/submissions (src/api/v1/submissions.py).

Covers: submitting/resubmitting work, late-submission handling, grading
(including the late-penalty calculation), submission file upload/delete (S3
calls mocked the same way as test_assignments_api.py -- patching
`src.services.assignment_service.s3_client`'s methods directly rather than
re-mocking boto3/moto, since the module-level `S3Client()` singleton has no
AWS creds in the test env and always raises "S3 is not configured properly"
otherwise), and cross-institution / cross-student authorization.

Real bugs found and fixed in src/api/v1/submissions.py while writing these
tests (see TESTING_PROGRESS.md for the authoritative changelog entry):

Every endpoint that looks up a submission by id, or by (assignment_id,
student_id), checked that the submission's assignment belonged to the
caller's institution, but NONE of them checked that a *student* caller was
looking at their *own* submission -- any authenticated student could view or
mutate any other student's submission within the same institution:
1. `create_or_update_submission` (`POST /`) let a student submit work under
   any `student_id` in the request body, not just their own. Fixed: a
   caller with a `student_profile` can now only submit as themselves.
2. `get_submission` (`GET /{submission_id}`) let any student in the
   institution view any other student's submission (text, marks, feedback,
   grader). Fixed with the same per-student ownership check.
3. `get_student_submission` (`GET /assignment/{assignment_id}/student/
   {student_id}`) let a student pass an arbitrary `student_id` and read
   that submission directly. Fixed.
4. `upload_submission_file`/`delete_submission_file` had the same gap --
   any student could attach or remove files on another student's
   submission. Fixed both.
`grade_submission` (`POST /{submission_id}/grade`) already had a correct,
separate teacher-ownership check and needed no change; its behavior is
exercised here as a working-as-intended baseline alongside the fixes above.
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
from src.models.academic import Grade, Section, Subject
from src.models.assignment import (
    Assignment,
    Submission,
    SubmissionFile,
    AssignmentStatus,
    SubmissionStatus,
)
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
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
def second_student_user(db_session: Session, institution: Institution, student_role: Role) -> User:
    user = User(
        username="student2_sub",
        email="student2_sub@testschool.com",
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
def second_student(
    db_session: Session, institution: Institution, second_student_user: User, section: Section
) -> Student:
    student = Student(
        institution_id=institution.id,
        user_id=second_student_user.id,
        admission_number="ADM-SUB-002",
        first_name=second_student_user.first_name,
        last_name=second_student_user.last_name,
        email=second_student_user.email,
        section_id=section.id,
        date_of_birth=datetime(2008, 6, 10).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Male",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def second_student_headers(client: TestClient, second_student_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_institution(db_session: Session) -> Institution:
    import uuid
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-sub-{suffix}",
        phone="+1234567895",
        address="789 Other Ave",
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
        title="Essay Assignment",
        due_date=datetime.utcnow() + timedelta(days=7),
        max_marks=Decimal("100"),
        passing_marks=Decimal("40"),
        allow_late_submission=False,
        status=AssignmentStatus.PUBLISHED,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def past_due_assignment_no_late(
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
        title="Overdue, No Late Allowed",
        due_date=datetime.utcnow() - timedelta(days=1),
        max_marks=Decimal("100"),
        allow_late_submission=False,
        status=AssignmentStatus.PUBLISHED,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def past_due_assignment_late_allowed(
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
        title="Overdue, Late Allowed",
        due_date=datetime.utcnow() - timedelta(days=1),
        max_marks=Decimal("100"),
        allow_late_submission=True,
        late_penalty_percentage=10.0,
        status=AssignmentStatus.PUBLISHED,
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def closed_assignment(
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
        title="Closed Assignment",
        due_date=datetime.utcnow() + timedelta(days=7),
        max_marks=Decimal("100"),
        status=AssignmentStatus.CLOSED,
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
def submission(db_session: Session, assignment: Assignment, student: Student) -> Submission:
    s = Submission(
        assignment_id=assignment.id,
        student_id=student.id,
        submission_text="My essay content",
        submitted_at=datetime.utcnow(),
        status=SubmissionStatus.SUBMITTED,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def mock_s3_upload():
    with patch(
        "src.services.assignment_service.s3_client.upload_file",
        return_value="https://test-bucket.s3.amazonaws.com/submissions/fake-key.txt",
    ) as mock_upload, patch(
        "src.services.assignment_service.s3_client.delete_file",
        return_value=True,
    ) as mock_delete:
        yield mock_upload, mock_delete


# ---------------------------------------------------------------------------
# create_or_update_submission
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestCreateOrUpdateSubmission:
    def test_student_submits_own_work(self, client, student_headers, assignment, student):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={
                "assignment_id": assignment.id,
                "student_id": student.id,
                "submission_text": "Here is my work",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "submitted"
        assert data["is_late"] is False
        assert data["submitted_at"] is not None

    def test_student_cannot_submit_for_another_student(
        self, client, student_headers, student, assignment, second_student
    ):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={
                "assignment_id": assignment.id,
                "student_id": second_student.id,
                "submission_text": "Impersonated work",
            },
        )
        assert response.status_code == 403

    def test_resubmission_updates_existing_submission(
        self, client, student_headers, assignment, student, submission
    ):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={
                "assignment_id": assignment.id,
                "student_id": student.id,
                "submission_text": "Updated content",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == submission.id
        assert data["submission_text"] == "Updated content"

    def test_admin_can_submit_on_behalf_of_a_student(
        self, client, auth_headers, assignment, student
    ):
        response = client.post(
            "/api/v1/submissions/",
            headers=auth_headers,
            json={
                "assignment_id": assignment.id,
                "student_id": student.id,
                "submission_text": "Admin-entered work",
            },
        )
        assert response.status_code == 201

    def test_assignment_not_found(self, client, student_headers, student):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={"assignment_id": 999999, "student_id": student.id, "submission_text": "x"},
        )
        assert response.status_code == 404

    def test_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment, student
    ):
        response = client.post(
            "/api/v1/submissions/",
            headers=auth_headers,
            json={
                "assignment_id": cross_institution_assignment.id,
                "student_id": student.id,
                "submission_text": "x",
            },
        )
        assert response.status_code == 403

    def test_closed_assignment_rejected(self, client, student_headers, closed_assignment, student):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={
                "assignment_id": closed_assignment.id,
                "student_id": student.id,
                "submission_text": "too late",
            },
        )
        assert response.status_code == 400

    def test_late_submission_rejected_when_not_allowed(
        self, client, student_headers, past_due_assignment_no_late, student
    ):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={
                "assignment_id": past_due_assignment_no_late.id,
                "student_id": student.id,
                "submission_text": "late work",
            },
        )
        assert response.status_code == 400

    def test_late_submission_accepted_when_allowed(
        self, client, student_headers, past_due_assignment_late_allowed, student
    ):
        response = client.post(
            "/api/v1/submissions/",
            headers=student_headers,
            json={
                "assignment_id": past_due_assignment_late_allowed.id,
                "student_id": student.id,
                "submission_text": "late but allowed",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_late"] is True
        assert data["status"] == "late_submitted"

    def test_unauthenticated_rejected(self, client, assignment, student):
        response = client.post(
            "/api/v1/submissions/",
            json={
                "assignment_id": assignment.id,
                "student_id": student.id,
                "submission_text": "x",
            },
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# get_submission
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestGetSubmission:
    def test_student_can_view_own_submission(self, client, student_headers, submission):
        response = client.get(f"/api/v1/submissions/{submission.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == submission.id

    def test_student_cannot_view_other_students_submission(
        self, client, second_student_headers, second_student, submission
    ):
        response = client.get(f"/api/v1/submissions/{submission.id}", headers=second_student_headers)
        assert response.status_code == 403

    def test_teacher_can_view_any_submission_in_institution(
        self, client, teacher_headers, submission
    ):
        response = client.get(f"/api/v1/submissions/{submission.id}", headers=teacher_headers)
        assert response.status_code == 200

    def test_admin_can_view(self, client, auth_headers, submission):
        response = client.get(f"/api/v1/submissions/{submission.id}", headers=auth_headers)
        assert response.status_code == 200

    def test_not_found(self, client, auth_headers):
        response = client.get("/api/v1/submissions/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment, db_session
    ):
        other_student = Student(
            institution_id=cross_institution_assignment.institution_id,
            admission_number="XSCH-SUB-001",
            first_name="Cross",
            last_name="Student",
            email="cross_student_sub@otherschool.com",
            date_of_birth=datetime(2008, 1, 1).date(),
            admission_date=datetime(2020, 1, 1).date(),
            is_active=True,
        )
        db_session.add(other_student)
        db_session.commit()

        other_submission = Submission(
            assignment_id=cross_institution_assignment.id,
            student_id=other_student.id,
            submission_text="x",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(other_submission)
        db_session.commit()

        response = client.get(
            f"/api/v1/submissions/{other_submission.id}", headers=auth_headers
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# get_student_submission
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestGetStudentSubmission:
    def test_student_can_view_own(self, client, student_headers, assignment, student, submission):
        response = client.get(
            f"/api/v1/submissions/assignment/{assignment.id}/student/{student.id}",
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["id"] == submission.id

    def test_student_cannot_view_others(
        self, client, second_student_headers, second_student, assignment, student, submission
    ):
        response = client.get(
            f"/api/v1/submissions/assignment/{assignment.id}/student/{student.id}",
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_teacher_can_view_any_student(
        self, client, teacher_headers, assignment, student, submission
    ):
        response = client.get(
            f"/api/v1/submissions/assignment/{assignment.id}/student/{student.id}",
            headers=teacher_headers,
        )
        assert response.status_code == 200

    def test_no_submission_returns_404(self, client, auth_headers, assignment, student):
        response = client.get(
            f"/api/v1/submissions/assignment/{assignment.id}/student/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_assignment_not_found(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/submissions/assignment/999999/student/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment, student
    ):
        response = client.get(
            f"/api/v1/submissions/assignment/{cross_institution_assignment.id}/student/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# grade_submission
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestGradeSubmission:
    def test_owning_teacher_grades_submission(self, client, teacher_headers, submission):
        response = client.post(
            f"/api/v1/submissions/{submission.id}/grade",
            headers=teacher_headers,
            json={"marks_obtained": 85, "grade": "A", "feedback": "Well done"},
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["marks_obtained"]) == 85
        assert data["status"] == "graded"
        assert data["graded_by"] is not None

    def test_late_submission_penalty_applied(
        self, client, teacher_headers, past_due_assignment_late_allowed, student, db_session
    ):
        late_submission = Submission(
            assignment_id=past_due_assignment_late_allowed.id,
            student_id=student.id,
            submission_text="late work",
            submitted_at=datetime.utcnow(),
            is_late=True,
            status=SubmissionStatus.LATE_SUBMITTED,
        )
        db_session.add(late_submission)
        db_session.commit()
        db_session.refresh(late_submission)

        response = client.post(
            f"/api/v1/submissions/{late_submission.id}/grade",
            headers=teacher_headers,
            json={"marks_obtained": 100},
        )
        assert response.status_code == 200
        # 10% late penalty on the assignment fixture -> 100 - 10 = 90
        assert float(response.json()["marks_obtained"]) == 90

    def test_marks_exceeding_max_marks_rejected(self, client, teacher_headers, submission):
        response = client.post(
            f"/api/v1/submissions/{submission.id}/grade",
            headers=teacher_headers,
            json={"marks_obtained": 9999},
        )
        assert response.status_code == 400

    def test_student_cannot_grade(self, client, student_headers, submission):
        response = client.post(
            f"/api/v1/submissions/{submission.id}/grade",
            headers=student_headers,
            json={"marks_obtained": 50},
        )
        assert response.status_code == 403

    def test_other_teacher_cannot_grade(self, client, submission, db_session, institution, teacher_role):
        other_teacher_user = User(
            username="other_grader",
            email="other_grader@testschool.com",
            first_name="Other",
            last_name="Grader",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=teacher_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(other_teacher_user)
        db_session.commit()
        db_session.refresh(other_teacher_user)

        other_teacher = Teacher(
            institution_id=institution.id,
            user_id=other_teacher_user.id,
            employee_id="EMP-GRADER-001",
            first_name=other_teacher_user.first_name,
            last_name=other_teacher_user.last_name,
            email=other_teacher_user.email,
            phone="+1234567899",
            date_of_birth=datetime(1990, 1, 1).date(),
            joining_date=datetime(2022, 1, 1).date(),
            qualification="B.Ed",
            specialization="General",
            is_active=True,
        )
        db_session.add(other_teacher)
        db_session.commit()

        login = client.post(
            "/api/v1/auth/login",
            json={"email": other_teacher_user.email, "password": "password123"},
        )
        other_teacher_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = client.post(
            f"/api/v1/submissions/{submission.id}/grade",
            headers=other_teacher_headers,
            json={"marks_obtained": 50},
        )
        assert response.status_code == 403

    def test_not_found(self, client, auth_headers):
        response = client.post(
            "/api/v1/submissions/999999/grade",
            headers=auth_headers,
            json={"marks_obtained": 50},
        )
        assert response.status_code == 404

    def test_cross_institution_forbidden(
        self, client, auth_headers, cross_institution_assignment, db_session
    ):
        other_student = Student(
            institution_id=cross_institution_assignment.institution_id,
            admission_number="XSCH-SUB-002",
            first_name="Cross",
            last_name="Grader",
            email="cross_grader_sub@otherschool.com",
            date_of_birth=datetime(2008, 1, 1).date(),
            admission_date=datetime(2020, 1, 1).date(),
            is_active=True,
        )
        db_session.add(other_student)
        db_session.commit()

        other_submission = Submission(
            assignment_id=cross_institution_assignment.id,
            student_id=other_student.id,
            submission_text="x",
            submitted_at=datetime.utcnow(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(other_submission)
        db_session.commit()

        response = client.post(
            f"/api/v1/submissions/{other_submission.id}/grade",
            headers=auth_headers,
            json={"marks_obtained": 50},
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# submission file upload/delete
# ---------------------------------------------------------------------------

@pytest.mark.integration
class TestSubmissionFiles:
    def test_student_uploads_own_file(self, client, student_headers, submission, mock_s3_upload):
        response = client.post(
            f"/api/v1/submissions/{submission.id}/files",
            headers=student_headers,
            files={"file": ("essay.pdf", io.BytesIO(b"pdf-bytes"), "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_name"] == "essay.pdf"
        assert data["file_size"] == len(b"pdf-bytes")

    def test_student_cannot_upload_to_others_submission(
        self, client, second_student_headers, second_student, submission, mock_s3_upload
    ):
        response = client.post(
            f"/api/v1/submissions/{submission.id}/files",
            headers=second_student_headers,
            files={"file": ("essay.pdf", io.BytesIO(b"pdf-bytes"), "application/pdf")},
        )
        assert response.status_code == 403

    def test_teacher_can_upload_to_any_submission(
        self, client, teacher_headers, submission, mock_s3_upload
    ):
        response = client.post(
            f"/api/v1/submissions/{submission.id}/files",
            headers=teacher_headers,
            files={"file": ("essay.pdf", io.BytesIO(b"pdf-bytes"), "application/pdf")},
        )
        assert response.status_code == 200

    def test_upload_not_found(self, client, auth_headers, mock_s3_upload):
        response = client.post(
            "/api/v1/submissions/999999/files",
            headers=auth_headers,
            files={"file": ("essay.pdf", io.BytesIO(b"data"), "application/pdf")},
        )
        assert response.status_code == 404

    def test_delete_file_happy_path(
        self, client, student_headers, submission, mock_s3_upload, db_session
    ):
        upload_response = client.post(
            f"/api/v1/submissions/{submission.id}/files",
            headers=student_headers,
            files={"file": ("essay.pdf", io.BytesIO(b"pdf-bytes"), "application/pdf")},
        )
        assert upload_response.status_code == 200
        file_row = (
            db_session.query(SubmissionFile)
            .filter(SubmissionFile.submission_id == submission.id)
            .first()
        )
        assert file_row is not None

        response = client.delete(
            f"/api/v1/submissions/{submission.id}/files/{file_row.id}", headers=student_headers
        )
        assert response.status_code == 204

    def test_student_cannot_delete_file_from_others_submission(
        self,
        client,
        student_headers,
        second_student_headers,
        second_student,
        submission,
        mock_s3_upload,
        db_session,
    ):
        upload_response = client.post(
            f"/api/v1/submissions/{submission.id}/files",
            headers=student_headers,
            files={"file": ("essay.pdf", io.BytesIO(b"pdf-bytes"), "application/pdf")},
        )
        file_row = (
            db_session.query(SubmissionFile)
            .filter(SubmissionFile.submission_id == submission.id)
            .first()
        )

        response = client.delete(
            f"/api/v1/submissions/{submission.id}/files/{file_row.id}",
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_delete_file_not_found(self, client, auth_headers, submission, mock_s3_upload):
        response = client.delete(
            f"/api/v1/submissions/{submission.id}/files/999999", headers=auth_headers
        )
        assert response.status_code == 404
