"""Integration tests for the `plagiarism` router (src/api/v1/plagiarism.py).

Assignment-submission plagiarism checks, per-result review/visualization,
per-assignment reports, and per-institution privacy consent settings.

Bugs found and fixed:

1. **`current_user.role.name == "student"` compared the human-readable role
   label instead of `.slug` (bug class 12, the third time this exact shape
   was found this session after `data_management.py`/`content_marketplace.py`)**
   in `get_submission_results` -- since `Role.name` is "Student" (capitalized)
   while the comparison literal is `"student"`, this check was unconditionally
   `False`, so a student calling this endpoint always skipped their own-
   submission ownership check and could read *any* submission's plagiarism
   results across the whole institution regardless of whose it was. Already
   fixed (by a prior pass on this router) to `current_user.role.slug`.
2. **Four cross-tenant gaps (bug class 17) found and fixed this pass**:
   `create_plagiarism_check` (`data.assignment_id`), `list_assignment_checks`
   (`assignment_id`), `get_submission_results` (teacher/admin callers had no
   institution check at all -- only students did), and `get_plagiarism_report`
   (`assignment_id`) all let a teacher/admin from *any* institution read or
   kick off comparisons against another institution's assignments/submissions
   just by guessing an id. Fixed by validating the assignment (or, for
   submissions, the submission's parent assignment) belongs to the caller's
   own institution before doing anything else.
3. **`review_plagiarism_result` never checked the result being reviewed
   against the caller's institution (cross-tenant write, bug class 17)** --
   any teacher could mark any other institution's plagiarism result as
   reviewed/false-positive by id. Fixed by joining through the parent
   `PlagiarismCheck` to confirm institution ownership first.
4. **`GET /report/assignment/{id}` 100% failed with a `ResponseValidationError`
   whenever the report had at least one flagged, non-external-source
   high-similarity match (model/schema drift, bug class 11)** --
   `PlagiarismDetectionService.generate_plagiarism_report` built each
   `flagged_pairs` entry with only `submission_id_1`/`submission_id_2`/
   `similarity_score`/`matched_segments`, but the `ComparisonPair` schema
   also requires `student_name_1`/`student_name_2` (never populated) and a
   non-optional `submission_id_2` (left `None` whenever `matched_submission_id`
   was unset, e.g. an external-source match). Fixed by resolving both
   students' names via `Submission.student` and only building a pair when
   there is a genuine second submission to compare against.
"""
import uuid
from datetime import datetime, timedelta

import pytest

from src.models.assignment import Assignment, Submission, AssignmentStatus
from src.models.plagiarism import PlagiarismCheck, PlagiarismResult, PlagiarismCheckStatus
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
    role = Role(name="Other Teacher", slug="teacher", is_system_role=True)
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
def second_student_headers(client, second_student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_student(db_session, institution, second_student_user, section, academic_year):
    from src.models.student import Student
    s = Student(
        institution_id=institution.id,
        user_id=second_student_user.id,
        admission_number="ADM002",
        first_name="Second",
        last_name="Student",
        email=second_student_user.email,
        section_id=section.id,
        date_of_birth=datetime(2008, 4, 1).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Male",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def assignment(db_session, institution, teacher, grade, subject) -> Assignment:
    a = Assignment(
        institution_id=institution.id,
        teacher_id=teacher.id,
        grade_id=grade.id,
        subject_id=subject.id,
        title="Essay on Photosynthesis",
        status=AssignmentStatus.PUBLISHED,
        max_marks=100,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def submission(db_session, assignment, student) -> Submission:
    s = Submission(
        assignment_id=assignment.id,
        student_id=student.id,
        submission_text="Photosynthesis is the process by which plants make food.",
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def other_assignment(db_session, other_institution):
    from src.models.teacher import Teacher
    from src.models.academic import AcademicYear, Grade, Subject
    from src.models.user import User as UserModel
    from src.models.role import Role

    role = Role(name="Cross Teacher", slug=f"teacher-x-{uuid.uuid4().hex[:8]}", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    teacher_user = UserModel(
        username=f"crossteacher{uuid.uuid4().hex[:8]}",
        email=f"crossteacher{uuid.uuid4().hex[:8]}@other.com",
        first_name="Cross",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=role.id,
        is_active=True,
    )
    db_session.add(teacher_user)
    db_session.commit()
    db_session.refresh(teacher_user)

    other_teacher = Teacher(
        institution_id=other_institution.id,
        user_id=teacher_user.id,
        employee_id=f"EMPX{uuid.uuid4().hex[:6]}",
        first_name="Cross",
        last_name="Teacher",
        email=teacher_user.email,
        phone="+1234567899",
        date_of_birth=datetime(1985, 5, 15).date(),
        joining_date=datetime(2020, 6, 1).date(),
        qualification="M.Sc",
        specialization="Science",
        is_active=True,
    )
    db_session.add(other_teacher)
    db_session.commit()
    db_session.refresh(other_teacher)

    year = AcademicYear(
        institution_id=other_institution.id,
        name="2023-2024",
        start_date=datetime(2023, 4, 1).date(),
        end_date=datetime(2024, 3, 31).date(),
        is_current=True,
        is_active=True,
    )
    db_session.add(year)
    db_session.commit()
    db_session.refresh(year)

    other_grade = Grade(
        institution_id=other_institution.id,
        academic_year_id=year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(other_grade)
    db_session.commit()
    db_session.refresh(other_grade)

    other_subject = Subject(
        institution_id=other_institution.id,
        name="Science",
        code="SCI10",
        is_active=True,
    )
    db_session.add(other_subject)
    db_session.commit()
    db_session.refresh(other_subject)

    a = Assignment(
        institution_id=other_institution.id,
        teacher_id=other_teacher.id,
        grade_id=other_grade.id,
        subject_id=other_subject.id,
        title="Other institution's assignment",
        status=AssignmentStatus.PUBLISHED,
        max_marks=100,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def check(db_session, institution, assignment) -> PlagiarismCheck:
    c = PlagiarismCheck(
        institution_id=institution.id,
        assignment_id=assignment.id,
        status=PlagiarismCheckStatus.COMPLETED,
        completed_at=datetime.utcnow(),
        processing_time_seconds=1.23,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def result(db_session, check, submission) -> PlagiarismResult:
    r = PlagiarismResult(
        check_id=check.id,
        submission_id=submission.id,
        similarity_score=0.85,
        matched_segments_count=2,
        matched_text_percentage=40.0,
    )
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)
    return r


# ---------------------------------------------------------------------------
# Auth + role gating
# ---------------------------------------------------------------------------
class TestAuthAndRoles:
    def test_create_check_requires_auth(self, client):
        response = client.post(
            "/api/v1/plagiarism/checks",
            json={"assignment_id": 1},
        )
        assert response.status_code in (401, 403)

    def test_create_check_requires_teacher_or_admin_role(
        self, client, student_headers, assignment
    ):
        response = client.post(
            "/api/v1/plagiarism/checks",
            json={"assignment_id": assignment.id},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_create_privacy_consent_requires_admin_role(self, client, second_student_headers):
        response = client.post(
            "/api/v1/plagiarism/privacy-consent",
            json={"institution_id": 1},
            headers=second_student_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Creating checks + cross-tenant scoping
# ---------------------------------------------------------------------------
class TestCreateCheck:
    def test_teacher_creates_check_for_own_assignment(self, client, auth_headers, assignment):
        response = client.post(
            "/api/v1/plagiarism/checks",
            json={"assignment_id": assignment.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["assignment_id"] == assignment.id

    def test_create_check_for_other_institution_assignment_is_404(
        self, client, auth_headers, other_assignment
    ):
        response = client.post(
            "/api/v1/plagiarism/checks",
            json={"assignment_id": other_assignment.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_list_assignment_checks_for_other_institution_is_404(
        self, client, auth_headers, other_assignment
    ):
        response = client.get(
            f"/api/v1/plagiarism/checks/assignment/{other_assignment.id}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_list_assignment_checks_for_own_assignment(self, client, auth_headers, assignment, check):
        response = client.get(
            f"/api/v1/plagiarism/checks/assignment/{assignment.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1


# ---------------------------------------------------------------------------
# Submission results: ownership + cross-tenant
# ---------------------------------------------------------------------------
class TestSubmissionResults:
    def test_student_can_see_own_submission_results(
        self, client, student_headers, submission, result
    ):
        response = client.get(
            f"/api/v1/plagiarism/results/submission/{submission.id}", headers=student_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_student_cannot_see_another_students_submission_results(
        self, client, second_student_headers, submission, result
    ):
        response = client.get(
            f"/api/v1/plagiarism/results/submission/{submission.id}", headers=second_student_headers
        )
        assert response.status_code == 403

    def test_teacher_from_other_institution_cannot_see_submission_results(
        self, client, other_teacher_headers, submission, result
    ):
        response = client.get(
            f"/api/v1/plagiarism/results/submission/{submission.id}", headers=other_teacher_headers
        )
        assert response.status_code == 404

    def test_teacher_can_see_own_institution_submission_results(
        self, client, auth_headers, submission, result
    ):
        response = client.get(
            f"/api/v1/plagiarism/results/submission/{submission.id}", headers=auth_headers
        )
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# Result details, review, visualization
# ---------------------------------------------------------------------------
class TestResultReview:
    def test_review_result_updates_decision(self, client, teacher_headers, teacher, result):
        response = client.post(
            f"/api/v1/plagiarism/results/{result.id}/review",
            json={"review_decision": "confirmed_plagiarism", "review_notes": "Clear match"},
            headers=teacher_headers,
        )
        assert response.status_code == 200
        assert response.json()["review_decision"] == "confirmed_plagiarism"

    def test_review_result_from_other_institution_is_404(
        self, client, other_teacher_headers, other_teacher_user, db_session, result
    ):
        from src.models.teacher import Teacher

        other_teacher = Teacher(
            institution_id=other_teacher_user.institution_id,
            user_id=other_teacher_user.id,
            employee_id=f"EMPY{uuid.uuid4().hex[:6]}",
            first_name="Other",
            last_name="Teacher",
            email=other_teacher_user.email,
            phone="+1234567898",
            date_of_birth=datetime(1985, 5, 15).date(),
            joining_date=datetime(2020, 6, 1).date(),
            qualification="M.Sc",
            specialization="Science",
            is_active=True,
        )
        db_session.add(other_teacher)
        db_session.commit()

        response = client.post(
            f"/api/v1/plagiarism/results/{result.id}/review",
            json={"review_decision": "dismissed"},
            headers=other_teacher_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
class TestReport:
    def test_report_for_other_institution_assignment_is_404(
        self, client, auth_headers, other_assignment
    ):
        response = client.get(
            f"/api/v1/plagiarism/report/assignment/{other_assignment.id}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_report_for_assignment_with_no_completed_checks_is_404(
        self, client, auth_headers, assignment
    ):
        response = client.get(
            f"/api/v1/plagiarism/report/assignment/{assignment.id}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_report_for_own_assignment_with_completed_check(
        self, client, auth_headers, assignment, check, result
    ):
        response = client.get(
            f"/api/v1/plagiarism/report/assignment/{assignment.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["assignment_title"] == assignment.title

    def test_report_includes_flagged_pair_with_student_names(
        self, client, auth_headers, assignment, check, submission, second_student, db_session
    ):
        second_submission = Submission(
            assignment_id=assignment.id,
            student_id=second_student.id,
            submission_text="Photosynthesis lets plants make food from sunlight.",
        )
        db_session.add(second_submission)
        db_session.commit()
        db_session.refresh(second_submission)

        matched_result = PlagiarismResult(
            check_id=check.id,
            submission_id=submission.id,
            matched_submission_id=second_submission.id,
            similarity_score=0.9,
            matched_segments_count=3,
            matched_text_percentage=60.0,
        )
        db_session.add(matched_result)
        db_session.commit()

        response = client.get(
            f"/api/v1/plagiarism/report/assignment/{assignment.id}", headers=auth_headers
        )
        assert response.status_code == 200
        pairs = response.json()["flagged_pairs"]
        assert len(pairs) == 1
        assert pairs[0]["submission_id_1"] == submission.id
        assert pairs[0]["submission_id_2"] == second_submission.id
        assert "Student" in pairs[0]["student_name_1"]
        assert "Second" in pairs[0]["student_name_2"]


# ---------------------------------------------------------------------------
# Privacy consent
# ---------------------------------------------------------------------------
class TestPrivacyConsent:
    def test_admin_creates_and_gets_privacy_consent(self, client, auth_headers, institution):
        create_resp = client.post(
            "/api/v1/plagiarism/privacy-consent",
            json={
                "institution_id": institution.id,
                "allow_cross_institution_comparison": True,
                "data_retention_days": 180,
            },
            headers=auth_headers,
        )
        assert create_resp.status_code == 200
        assert create_resp.json()["allow_cross_institution_comparison"] is True

        get_resp = client.get("/api/v1/plagiarism/privacy-consent", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["data_retention_days"] == 180
