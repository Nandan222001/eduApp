"""Integration tests for the `parent_roi` router (src/api/v1/parent_roi.py).

Generates and reads a parent's ROI report (fees paid, money/time saved,
tuition cost avoidance, platform engagement, ROI percentage) from real
academic/attendance/fee data.

Two bugs found and fixed while writing this coverage:

1. **No authentication on any endpoint at all** (the single most severe bug
   class this session checks for first): every endpoint in this router
   trusted an unauthenticated, client-supplied `institution_id` directly --
   any caller, logged in or not, could generate or read any parent's/
   institution's financial ROI report (fees paid, money saved, engagement
   score) just by guessing IDs, with no way to prove they belonged to that
   institution at all. Fixed by adding `Depends(get_current_user)` to every
   endpoint and always deriving `institution_id` from
   `current_user.institution_id` rather than trusting the caller, matching
   every other router in this codebase; `list_institution_roi_reports` now
   403s if the path's `institution_id` doesn't match the caller's own, and
   `get_parent_roi_report`/`get_roi_report_by_id` are scoped to the caller's
   institution in the service layer.
2. **Model/schema drift (bug class 11), two separate instances**:
   `_calculate_fees_paid` filtered on `FeePayment.status == 'completed'`,
   but `FeePayment` has no `status` column -- the real column is
   `payment_status`. `_calculate_grade_delta` filtered/summed
   `ExamResult.marks_obtained`, but `ExamResult` has no such column either
   -- the real columns are `total_marks_obtained`/`total_max_marks` (raw,
   per-exam-varying scale) and `percentage` (already normalized 0-100,
   matching what "grade improvement percentage" actually needs). Both
   raised `AttributeError` unconditionally, making `POST /reports/generate`
   (the only way to produce a report) 100% broken for any parent with fee
   payments or the student having exam results in range -- i.e. broken for
   essentially any real parent. Fixed to use the real column names
   (`payment_status`, and `percentage` for the grade-delta calculation).
   While fixing the fees bug, also scoped `_calculate_fees_paid`'s
   `children_ids` lookup to `Student.institution_id == institution_id` --
   `StudentParent` itself carries no institution_id, so a parent linked to
   children at more than one institution would otherwise have had another
   institution's fee payments folded into this institution's report.
"""
import uuid
from datetime import date, timedelta

import pytest


BASE = "/api/v1/parent-roi"


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution

    unique_suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {unique_suffix}",
        slug=f"other-school-{unique_suffix}",
        phone="+1234567891",
        address="456 Other Street, Other City, Other State, Other Country 54321",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def roi_parent(db_session, institution, parent_user):
    from src.models.student import Parent

    return db_session.query(Parent).filter(Parent.user_id == parent_user.id).first()


@pytest.fixture
def roi_student(db_session, institution, roi_parent, section, academic_year):
    from src.models.student import Student, StudentParent
    from datetime import datetime as dt

    s = Student(
        institution_id=institution.id,
        admission_number="ADM-ROI-1",
        first_name="Roi",
        last_name="Child",
        section_id=section.id,
        date_of_birth=dt(2010, 3, 20).date(),
        admission_date=dt(2020, 4, 1).date(),
        gender="Male",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)

    link = StudentParent(
        student_id=s.id, parent_id=roi_parent.id, relation_type="father", is_primary_contact=True
    )
    db_session.add(link)
    db_session.commit()
    return s


@pytest.fixture
def fee_payment(db_session, institution, roi_student, grade, academic_year):
    from src.models.fee import FeeStructure, FeePayment

    structure = FeeStructure(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        grade_id=grade.id,
        name="Tuition Fee",
        category="tuition",
        amount="10000.00",
    )
    db_session.add(structure)
    db_session.commit()
    db_session.refresh(structure)

    payment = FeePayment(
        institution_id=institution.id,
        student_id=roi_student.id,
        fee_structure_id=structure.id,
        receipt_number=f"RCPT-{uuid.uuid4().hex[:10]}",
        payment_date=date(2023, 6, 15),
        amount_paid="10000.00",
        total_amount="10000.00",
        payment_method="online",
        payment_status="completed",
    )
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    return payment


class TestGenerateReport:
    def test_requires_auth(self, client, roi_student):
        response = client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": roi_student.id, "academic_year": "2023-2024"},
        )
        assert response.status_code == 403

    def test_generate_report(self, client, auth_headers, roi_parent, roi_student, fee_payment):
        response = client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": roi_parent.id, "academic_year": "2023-2024"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["parent_id"] == roi_parent.id
        assert body["academic_year"] == "2023-2024"
        assert body["fees_paid"] == 10000.0
        assert body["money_saved"] > 0
        assert isinstance(body["roi_percentage"], float)

    def test_generate_report_no_children_400(self, client, auth_headers):
        response = client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": 999999, "academic_year": "2023-2024"},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_generate_report_does_not_trust_other_institution(
        self, client, auth_headers, roi_parent, roi_student, fee_payment, other_institution
    ):
        """institution_id is always derived from the caller's own session,
        never a client-supplied value -- even though this endpoint no
        longer accepts an institution_id parameter at all post-fix, confirm
        the report it creates is attributed to the caller's real
        institution."""
        response = client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": roi_parent.id, "academic_year": "2023-2024"},
            headers=auth_headers,
        )
        assert response.status_code == 200


class TestGetParentReport:
    def test_requires_auth(self, client, roi_parent):
        response = client.get(
            f"{BASE}/reports/parent/{roi_parent.id}", params={"academic_year": "2023-2024"}
        )
        assert response.status_code == 403

    def test_get_report(self, client, auth_headers, roi_parent, roi_student, fee_payment):
        client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": roi_parent.id, "academic_year": "2023-2024"},
            headers=auth_headers,
        )
        response = client.get(
            f"{BASE}/reports/parent/{roi_parent.id}",
            params={"academic_year": "2023-2024"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["parent_id"] == roi_parent.id

    def test_get_report_not_found(self, client, auth_headers, roi_parent):
        response = client.get(
            f"{BASE}/reports/parent/{roi_parent.id}",
            params={"academic_year": "2099-2100"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_get_report_scoped_to_own_institution(
        self, client, auth_headers, roi_parent, roi_student, fee_payment, other_institution, db_session
    ):
        """A report that exists but belongs to another institution must
        404, not leak across institutions."""
        from src.models.parent_roi import ParentROIReport

        foreign_report = ParentROIReport(
            institution_id=other_institution.id,
            parent_id=roi_parent.id,
            academic_year="2023-2024",
            fees_paid="500.00",
            performance_improvement={},
            features_used={},
            engagement_score=50.0,
            roi_percentage=10.0,
        )
        db_session.add(foreign_report)
        db_session.commit()

        response = client.get(
            f"{BASE}/reports/parent/{roi_parent.id}",
            params={"academic_year": "2023-2024"},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestListInstitutionReports:
    def test_requires_auth(self, client, institution):
        response = client.get(f"{BASE}/reports/institution/{institution.id}")
        assert response.status_code == 403

    def test_list_reports(self, client, auth_headers, institution, roi_parent, roi_student, fee_payment):
        client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": roi_parent.id, "academic_year": "2023-2024"},
            headers=auth_headers,
        )
        response = client.get(f"{BASE}/reports/institution/{institution.id}", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["parent_id"] == roi_parent.id

    def test_cannot_list_other_institution_reports(self, client, auth_headers, other_institution):
        """Regression test for the missing-auth bug: the caller must not be
        able to view another institution's ROI reports by path parameter
        alone."""
        response = client.get(
            f"{BASE}/reports/institution/{other_institution.id}", headers=auth_headers
        )
        assert response.status_code == 403


class TestGetReportById:
    def test_requires_auth(self, client, roi_parent, roi_student, fee_payment):
        response = client.get(f"{BASE}/reports/1")
        assert response.status_code == 403

    def test_get_by_id(self, client, auth_headers, roi_parent, roi_student, fee_payment):
        gen_resp = client.post(
            f"{BASE}/reports/generate",
            params={"parent_id": roi_parent.id, "academic_year": "2023-2024"},
            headers=auth_headers,
        )
        report_id = gen_resp.json()["id"]

        response = client.get(f"{BASE}/reports/{report_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == report_id

    def test_get_by_id_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/reports/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_by_id_scoped_to_own_institution(
        self, client, auth_headers, roi_parent, other_institution, db_session
    ):
        from src.models.parent_roi import ParentROIReport

        foreign_report = ParentROIReport(
            institution_id=other_institution.id,
            parent_id=roi_parent.id,
            academic_year="2023-2024",
            fees_paid="500.00",
            performance_improvement={},
            features_used={},
            engagement_score=50.0,
            roi_percentage=10.0,
        )
        db_session.add(foreign_report)
        db_session.commit()
        db_session.refresh(foreign_report)

        response = client.get(f"{BASE}/reports/{foreign_report.id}", headers=auth_headers)
        assert response.status_code == 404
