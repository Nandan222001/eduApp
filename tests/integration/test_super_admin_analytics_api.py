"""Integration tests for the `super_admin_analytics` router
(src/api/v1/super_admin_analytics.py).

Cross-institution analytics: attendance/exam/engagement/teacher-effectiveness
metrics, benchmarks, rankings, trend analysis, anomaly detection, best
practices, cohort analysis, and CSV/JSON export -- all gated behind
`require_super_admin`.

Real bugs found and fixed while writing this coverage:

1. **`Submission.institution_id` doesn't exist as a column** -- only
   `Assignment` carries `institution_id`; `Submission` only has
   `assignment_id`. Referencing `Submission.institution_id` (at 4 separate
   call sites: `total_submissions`, `graded_submissions`, `submitted_count`,
   and the grading-time query) raised an `AttributeError` on every single
   call to `GET /super-admin/analytics/cross-institution` regardless of
   data (model/schema drift, bug class 11) -- the endpoint was completely
   broken. Fixed by joining through `Assignment` and filtering on its
   `institution_id` at all 4 sites.
2. **`func.extract('epoch', ...)` for average grading time is
   PostgreSQL-only syntax** -- MySQL's `EXTRACT()` only accepts unit
   keywords like DAY/HOUR/SECOND, not `epoch`, so this raised an
   `OperationalError` (bug class 1, unsupported MySQL SQL) as soon as bug
   #1 above was fixed enough to reach this line. Fixed by pulling the raw
   `(graded_at, submitted_at)` pairs and averaging the timedeltas in Python
   instead of in SQL.

`require_super_admin` was already a real, correctly-implemented
superuser-only dependency (not just any authenticated user) on both
endpoints, so no auth gap was found here beyond the two crashes above.
"""
import csv
import io
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest

from src.models.academic import AcademicYear, Grade
from src.models.assignment import Assignment, AssignmentStatus, Submission, SubmissionStatus
from src.models.attendance import Attendance, AttendanceStatus
from src.models.examination import Exam, ExamResult, ExamType, ExamStatus
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def super_admin_user(db_session, institution, admin_role) -> User:
    user = User(
        username="rpg_superadmin",
        email="rpg_superadmin@testschool.com",
        first_name="Super",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_headers(client, super_admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": super_admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def exam(db_session, institution, academic_year, grade) -> Exam:
    e = Exam(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        grade_id=grade.id,
        name="Midterm",
        exam_type=ExamType.UNIT_TEST if hasattr(ExamType, "UNIT_TEST") else list(ExamType)[0],
        start_date=date.today() - timedelta(days=10),
        end_date=date.today() - timedelta(days=9),
        status=ExamStatus.COMPLETED if hasattr(ExamStatus, "COMPLETED") else list(ExamStatus)[0],
        total_marks=Decimal("100"),
        passing_marks=Decimal("35"),
        is_published=True,
    )
    db_session.add(e)
    db_session.commit()
    db_session.refresh(e)
    return e


@pytest.fixture
def exam_result(db_session, institution, exam, student) -> ExamResult:
    result = ExamResult(
        institution_id=institution.id,
        exam_id=exam.id,
        student_id=student.id,
        total_marks_obtained=Decimal("80.00"),
        total_max_marks=Decimal("100.00"),
        percentage=Decimal("80.00"),
        grade="A",
        is_pass=True,
        subjects_passed=1,
        subjects_failed=0,
        generated_at=datetime.utcnow() - timedelta(days=5),
    )
    db_session.add(result)
    db_session.commit()
    db_session.refresh(result)
    return result


@pytest.fixture
def attendance_record(db_session, institution, student) -> Attendance:
    record = Attendance(
        institution_id=institution.id,
        student_id=student.id,
        date=date.today() - timedelta(days=1),
        status=AttendanceStatus.PRESENT,
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)
    return record


@pytest.fixture
def assignment(db_session, institution, teacher, grade, subject) -> Assignment:
    a = Assignment(
        institution_id=institution.id,
        teacher_id=teacher.id,
        grade_id=grade.id,
        subject_id=subject.id,
        title="Algebra Homework",
        max_marks=Decimal("100"),
        status=AssignmentStatus.PUBLISHED if hasattr(AssignmentStatus, "PUBLISHED") else list(AssignmentStatus)[0],
        is_active=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def graded_submission(db_session, assignment, student) -> Submission:
    now = datetime.utcnow()
    s = Submission(
        assignment_id=assignment.id,
        student_id=student.id,
        submission_text="My work",
        submitted_at=now - timedelta(days=2),
        marks_obtained=Decimal("90.00"),
        graded_at=now - timedelta(days=1),
        status=SubmissionStatus.GRADED,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestAuth:
    def test_cross_institution_requires_auth(self, client):
        response = client.get("/api/v1/super-admin/analytics/cross-institution")
        assert response.status_code in (401, 403)

    def test_cross_institution_rejects_non_superuser(self, client, auth_headers):
        response = client.get(
            "/api/v1/super-admin/analytics/cross-institution", headers=auth_headers
        )
        assert response.status_code == 403

    def test_export_rejects_non_superuser(self, client, auth_headers):
        response = client.get(
            "/api/v1/super-admin/analytics/export", headers=auth_headers
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Cross-institution analytics
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestCrossInstitutionAnalytics:
    def test_returns_metrics_for_seeded_institution(
        self,
        client,
        super_admin_headers,
        institution,
        exam_result,
        attendance_record,
        graded_submission,
    ):
        response = client.get(
            "/api/v1/super-admin/analytics/cross-institution", headers=super_admin_headers
        )
        assert response.status_code == 200, response.text
        data = response.json()

        assert "institution_metrics" in data
        inst_metric = next(
            (m for m in data["institution_metrics"] if m["institution_id"] == institution.id),
            None,
        )
        assert inst_metric is not None
        assert inst_metric["total_students"] >= 1
        assert inst_metric["average_attendance"] == 100.0
        assert inst_metric["exam_pass_rate"] == 100.0
        assert inst_metric["average_exam_score"] == 80.0

        # Sub-structures are all present and well-typed.
        assert "benchmarks" in data
        assert "rankings" in data
        assert "trends" in data
        assert isinstance(data["anomalies"], list)
        assert isinstance(data["best_practices"], list)
        assert "cohort_analysis" in data

    def test_grading_time_computed_without_crashing(
        self, client, super_admin_headers, institution, graded_submission
    ):
        """Regression test for the `Submission.institution_id` AttributeError
        and the MySQL-incompatible `EXTRACT(epoch FROM ...)` grading-time
        query -- previously an unconditional 500 on every call."""
        response = client.get(
            "/api/v1/super-admin/analytics/cross-institution", headers=super_admin_headers
        )
        assert response.status_code == 200, response.text
        data = response.json()
        inst_metric = next(
            m for m in data["institution_metrics"] if m["institution_id"] == institution.id
        )
        # graded_submission was graded 1 day after it was submitted.
        assert inst_metric["average_grading_time_days"] == pytest.approx(1.0, abs=0.05)
        assert inst_metric["assignment_completion_rate"] > 0

    def test_filters_by_plan(self, client, super_admin_headers, institution, exam_result):
        response = client.get(
            "/api/v1/super-admin/analytics/cross-institution",
            headers=super_admin_headers,
            params={"plan": "NonexistentPlan"},
        )
        assert response.status_code in (200, 404)
        if response.status_code == 200:
            data = response.json()
            assert all(
                m["institution_id"] != institution.id for m in data["institution_metrics"]
            )

    def test_filters_by_date_range_excludes_out_of_range_data(
        self, client, super_admin_headers, institution, exam_result
    ):
        future_start = datetime.utcnow() + timedelta(days=365)
        future_end = future_start + timedelta(days=1)
        response = client.get(
            "/api/v1/super-admin/analytics/cross-institution",
            headers=super_admin_headers,
            params={
                "start_date": future_start.isoformat(),
                "end_date": future_end.isoformat(),
            },
        )
        assert response.status_code == 200
        data = response.json()
        inst_metric = next(
            m for m in data["institution_metrics"] if m["institution_id"] == institution.id
        )
        # No exam results in that future window.
        assert inst_metric["exam_pass_rate"] == 0
        assert inst_metric["average_exam_score"] == 0


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestExport:
    def test_export_json(self, client, super_admin_headers, institution, exam_result):
        response = client.get(
            "/api/v1/super-admin/analytics/export",
            headers=super_admin_headers,
            params={"format": "json"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "institution_metrics" in data

    def test_export_csv(self, client, super_admin_headers, institution, exam_result):
        response = client.get(
            "/api/v1/super-admin/analytics/export",
            headers=super_admin_headers,
            params={"format": "csv"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")

        reader = csv.reader(io.StringIO(response.text))
        rows = list(reader)
        assert rows[0][0] == "Institution ID"
        assert any(row and row[0] == str(institution.id) for row in rows[1:])
