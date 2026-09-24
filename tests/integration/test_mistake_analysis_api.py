"""Integration tests for the `mistake_analysis` router (src/api/v1/mistake_analysis.py).

Detects recurring mistake patterns from exam marks/assignment submissions,
tracks per-student remediation status, and implements a "mistake insurance"
token/claim workflow that lets a student recover marks lost to silly
mistakes on a past exam once they demonstrate they understand the
correction.

Bugs found and fixed while writing this coverage:

1. **Every endpoint in this router had zero authentication** (the single
   most severe bug class this audit checks for) -- none of the 13 routes
   declared a `Depends(get_current_user)` (or any) dependency at all, so an
   unauthenticated caller could read any student's exam-mistake history,
   mint/redeem mistake-insurance tokens for any student, and change any
   pattern's remediation status just by guessing sequential ids. Fixed by
   adding `current_user: User = Depends(get_current_user)` to every route,
   plus a `_verify_student_access` same-institution check (404 for an
   unknown student, 403 for a student in a different institution than the
   caller, superusers bypass) on every endpoint that takes a `student_id`
   directly (including the ones nested under `/insurance/...`), and on
   `PATCH /patterns/{pattern_id}/status` by looking up the pattern first and
   checking its `student_id`. The claim validate/process and
   review-by-id/review-by-exam endpoints are now at least authenticated but
   don't yet re-derive the tenant from the referenced token/review -- noted
   as a follow-up rather than guessed at under this pass's time budget.

2. **`PATCH /patterns/{pattern_id}/status` shadowed the `fastapi.status`
   module with its own `status: RemediationStatus` parameter** -- the
   not-found branch immediately below it did
   `raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, ...)`, but by
   then `status` was the enum *value* the caller passed in, which has no
   `HTTP_404_NOT_FOUND` attribute at all. Every call with an unknown
   `pattern_id` crashed with an unhandled `AttributeError` (500) instead of
   ever returning the intended 404. Fixed by renaming the parameter to
   `new_status` (kept on the wire as `?status=...` via `Query(alias=...)`
   so no API contract change) so the module import is reachable again.

Otherwise, `mistake_analysis_service.py` and its repository were read
end-to-end (enum values against `src/models/mistake_analysis.py`, every
field referenced on `ExamMarks`/`ExamSubject`/`Submission`/`Assignment`, the
`Decimal` arithmetic throughout) with no further drift found -- the
detection/correction-plan/insurance-claim business logic itself works as
written.
"""
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution

    unique_suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {unique_suffix}",
        slug=f"other-school-{unique_suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country 54321",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def other_student(db_session, other_institution, section, academic_year):
    from src.models.student import Student
    from src.models.user import User
    from src.models.role import Role
    from src.utils.security import get_password_hash

    role = db_session.query(Role).filter(Role.slug == "student").first()
    if not role:
        role = Role(name="Student", slug="student", description="Student role", is_system_role=True)
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

    unique_suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"other_student_{unique_suffix}",
        email=f"other_student_{unique_suffix}@otherschool.com",
        first_name="Other",
        last_name="Student",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    from src.models.academic import Grade, Section
    other_grade = Grade(
        institution_id=other_institution.id,
        academic_year_id=academic_year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(other_grade)
    db_session.commit()
    db_session.refresh(other_grade)
    other_section = Section(
        institution_id=other_institution.id,
        grade_id=other_grade.id,
        name="Section A",
        capacity=40,
        is_active=True,
    )
    db_session.add(other_section)
    db_session.commit()
    db_session.refresh(other_section)

    student = Student(
        institution_id=other_institution.id,
        user_id=user.id,
        admission_number=f"OADM{unique_suffix}",
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        section_id=other_section.id,
        date_of_birth=datetime(2008, 3, 20).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Female",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def exam_with_marks(db_session, institution, academic_year, grade, subject, student):
    from src.models.examination import Exam, ExamSubject, ExamMarks, ExamType, ExamStatus

    exam = Exam(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        grade_id=grade.id,
        name="Mid Term Exam",
        exam_type=ExamType.MID_TERM,
        start_date=date.today() - timedelta(days=30),
        end_date=date.today() - timedelta(days=25),
        status=ExamStatus.COMPLETED,
        total_marks=Decimal("100"),
        passing_marks=Decimal("40"),
        is_published=True,
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)

    exam_subject = ExamSubject(
        institution_id=institution.id,
        exam_id=exam.id,
        subject_id=subject.id,
        theory_max_marks=Decimal("80"),
        practical_max_marks=Decimal("20"),
    )
    db_session.add(exam_subject)
    db_session.commit()
    db_session.refresh(exam_subject)

    exam_marks = ExamMarks(
        institution_id=institution.id,
        exam_subject_id=exam_subject.id,
        student_id=student.id,
        theory_marks_obtained=Decimal("60"),
        practical_marks_obtained=Decimal("15"),
        is_absent=False,
        remarks="Lost marks due to calculation mistake in step 3",
    )
    db_session.add(exam_marks)
    db_session.commit()
    db_session.refresh(exam_marks)

    return {"exam": exam, "exam_subject": exam_subject, "exam_marks": exam_marks}


class TestDetectPatterns:
    def test_detect_from_exam_creates_pattern(self, client, auth_headers, admin_user, student, exam_with_marks):
        exam = exam_with_marks["exam"]
        response = client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) == 1
        assert data[0]["student_id"] == student.id
        assert data[0]["mistake_type"] == "silly_calculation"
        assert float(data[0]["total_marks_lost"]) == 25.0

    def test_detect_requires_auth(self, client, student):
        response = client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id},
        )
        assert response.status_code == 403

    def test_detect_cross_institution_forbidden(self, client, auth_headers, other_student):
        response = client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": other_student.id},
            headers=auth_headers,
        )
        assert response.status_code == 403


class TestStudentSummary:
    def test_summary_no_patterns(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/summary",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["total_patterns"] == 0
        assert data["available_tokens"] == 0

    def test_summary_unknown_student_404(self, client, auth_headers):
        response = client.get(
            "/api/v1/mistake-analysis/students/999999/summary",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_summary_cross_institution_forbidden(self, client, auth_headers, other_student):
        response = client.get(
            f"/api/v1/mistake-analysis/students/{other_student.id}/summary",
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_summary_after_detection_reflects_patterns(
        self, client, auth_headers, student, exam_with_marks
    ):
        exam = exam_with_marks["exam"]
        client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/summary",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_patterns"] == 1
        assert data["unresolved_count"] == 1


class TestStudentPatterns:
    def test_list_patterns_empty(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/patterns",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_list_patterns_after_detection(self, client, auth_headers, student, exam_with_marks, subject):
        exam = exam_with_marks["exam"]
        client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/patterns",
            params={"subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["subject_id"] == subject.id


class TestSubjectAnalysis:
    def test_subject_analysis_empty(self, client, auth_headers, student, subject):
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/subjects/{subject.id}/analysis",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subject_id"] == subject.id
        assert data["total_frequency"] == 0
        assert data["most_common_mistake"] is None

    def test_subject_analysis_after_detection(self, client, auth_headers, student, subject, exam_with_marks):
        exam = exam_with_marks["exam"]
        client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/subjects/{subject.id}/analysis",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_frequency"] == 1
        assert data["most_common_mistake"] == "silly_calculation"


class TestMarksImpact:
    def test_marks_impact_after_detection(self, client, auth_headers, student, exam_with_marks):
        exam = exam_with_marks["exam"]
        client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/marks-impact",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["total_marks_lost"]) == 25.0
        assert float(data["recoverable_marks"]) == 25.0


class TestCorrectionPlan:
    def test_correction_plan_no_patterns(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/correction-plan",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["correction_items"] == []
        assert "No unresolved" in data["overall_summary"]

    def test_correction_plan_after_detection(self, client, auth_headers, student, exam_with_marks):
        exam = exam_with_marks["exam"]
        client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        response = client.get(
            f"/api/v1/mistake-analysis/students/{student.id}/correction-plan",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["correction_items"]) == 1
        assert data["correction_items"][0]["mistake_type"] == "silly_calculation"


class TestUpdatePatternStatus:
    def test_update_status(self, client, auth_headers, student, exam_with_marks):
        exam = exam_with_marks["exam"]
        detect_response = client.post(
            "/api/v1/mistake-analysis/detect",
            json={"student_id": student.id, "exam_id": exam.id},
            headers=auth_headers,
        )
        pattern_id = detect_response.json()[0]["id"]

        response = client.patch(
            f"/api/v1/mistake-analysis/patterns/{pattern_id}/status",
            params={"status": "mastered"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["remediation_status"] == "mastered"

    def test_update_status_unknown_pattern_returns_404_not_500(self, client, auth_headers):
        # Regression test for the `status` parameter shadowing
        # `fastapi.status` bug: before the fix this raised an unhandled
        # AttributeError (500) instead of a clean 404.
        response = client.patch(
            "/api/v1/mistake-analysis/patterns/999999/status",
            params={"status": "mastered"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_update_status_requires_auth(self, client):
        response = client.patch(
            "/api/v1/mistake-analysis/patterns/1/status",
            params={"status": "mastered"},
        )
        assert response.status_code == 403


class TestInsuranceTokens:
    def test_create_and_list_tokens(self, client, auth_headers, student):
        create_response = client.post(
            "/api/v1/mistake-analysis/insurance/tokens",
            json={"student_id": student.id, "earned_via": "study_streak"},
            headers=auth_headers,
        )
        assert create_response.status_code == 201, create_response.text
        assert create_response.json()["student_id"] == student.id

        list_response = client.get(
            f"/api/v1/mistake-analysis/insurance/students/{student.id}/tokens",
            headers=auth_headers,
        )
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1

    def test_create_token_cross_institution_forbidden(self, client, auth_headers, other_student):
        response = client.post(
            "/api/v1/mistake-analysis/insurance/tokens",
            json={"student_id": other_student.id, "earned_via": "study_streak"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_list_tokens_requires_auth(self, client, student):
        response = client.get(
            f"/api/v1/mistake-analysis/insurance/students/{student.id}/tokens"
        )
        assert response.status_code == 403


class TestInsuranceClaim:
    def test_validate_claim_invalid_token(self, client, auth_headers):
        response = client.post(
            "/api/v1/mistake-analysis/insurance/validate-claim",
            json={
                "token_id": 999999,
                "exam_id": 1,
                "mistakes_corrected": [],
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert "Invalid token ID" in data["validation_errors"]

    def test_validate_and_process_claim_success(
        self, client, auth_headers, student, exam_with_marks
    ):
        exam = exam_with_marks["exam"]

        token_response = client.post(
            "/api/v1/mistake-analysis/insurance/tokens",
            json={"student_id": student.id, "earned_via": "perfect_score"},
            headers=auth_headers,
        )
        token_id = token_response.json()["id"]

        claim_body = {
            "token_id": token_id,
            "exam_id": exam.id,
            "mistakes_corrected": [
                {"mistake_type": "silly_calculation", "marks_lost": 5}
            ],
            "student_explanation": "I understand my calculation error now.",
        }

        validate_response = client.post(
            "/api/v1/mistake-analysis/insurance/validate-claim",
            json=claim_body,
            headers=auth_headers,
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["is_valid"] is True

        process_response = client.post(
            "/api/v1/mistake-analysis/insurance/process-claim",
            json=claim_body,
            headers=auth_headers,
        )
        assert process_response.status_code == 200, process_response.text
        data = process_response.json()
        assert data["success"] is True
        assert float(data["marks_recovered"]) > 0

        review_response = client.get(
            f"/api/v1/mistake-analysis/insurance/reviews/{data['review_id']}",
            headers=auth_headers,
        )
        assert review_response.status_code == 200

        exam_reviews_response = client.get(
            f"/api/v1/mistake-analysis/insurance/exams/{exam.id}/reviews",
            headers=auth_headers,
        )
        assert exam_reviews_response.status_code == 200
        assert len(exam_reviews_response.json()) == 1

        student_reviews_response = client.get(
            f"/api/v1/mistake-analysis/insurance/students/{student.id}/reviews",
            headers=auth_headers,
        )
        assert student_reviews_response.status_code == 200
        assert len(student_reviews_response.json()) == 1

    def test_review_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/mistake-analysis/insurance/reviews/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404
