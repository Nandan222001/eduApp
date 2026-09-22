import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.academic import AcademicYear, Grade
from src.models.student import Student


@pytest.mark.integration
class TestFeesAPI:
    """Integration tests for /api/v1/fees/*, an established, pre-existing
    router (src/api/v1/fees.py) backed directly by ORM queries -- one of
    the ~95 registered backend routers picked up as part of the broader
    Phase-2/3 backend route-module audit (see TESTING_PROGRESS.md)."""

    def test_create_and_get_fee_structure(
        self, client: TestClient, auth_headers: dict, institution: Institution, academic_year: AcademicYear, grade: Grade
    ):
        response = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Tuition Fee",
                "category": "tuition",
                "amount": "5000.00",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Tuition Fee"
        structure_id = data["id"]

        response = client.get(f"/api/v1/fees/structures/{structure_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["amount"] == "5000.00"

    def test_create_fee_structure_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session, academic_year: AcademicYear, grade: Grade
    ):
        other = Institution(name="Other School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": other.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Contraband Fee",
                "category": "tuition",
                "amount": "100.00",
            },
        )
        assert response.status_code == 403

    def test_list_update_delete_fee_structure(
        self, client: TestClient, auth_headers: dict, institution: Institution, academic_year: AcademicYear, grade: Grade
    ):
        create = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Lab Fee",
                "category": "lab",
                "amount": "500.00",
            },
        )
        structure_id = create.json()["id"]

        response = client.get(
            "/api/v1/fees/structures", headers=auth_headers, params={"category": "lab"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(s["id"] == structure_id for s in data["items"])

        response = client.put(
            f"/api/v1/fees/structures/{structure_id}",
            headers=auth_headers,
            json={"amount": "600.00"},
        )
        assert response.status_code == 200
        assert response.json()["amount"] == "600.00"

        response = client.delete(f"/api/v1/fees/structures/{structure_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/fees/structures/{structure_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_record_payment_and_get_receipt(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        student: Student,
    ):
        structure = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Exam Fee",
                "category": "exam",
                "amount": "1000.00",
            },
        ).json()

        payment = client.post(
            "/api/v1/fees/payments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "fee_structure_id": structure["id"],
                "payment_date": str(date.today()),
                "amount_paid": "1000.00",
                "payment_method": "cash",
            },
        )
        assert payment.status_code == 201
        data = payment.json()
        assert data["receipt_number"] == f"RCP-{institution.id}-000001"
        assert data["total_amount"] == "1000.00"
        receipt_number = data["receipt_number"]

        # Receipt numbers increment sequentially per institution.
        second_payment = client.post(
            "/api/v1/fees/payments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "fee_structure_id": structure["id"],
                "payment_date": str(date.today()),
                "amount_paid": "200.00",
                "late_fee": "50.00",
                "payment_method": "cash",
            },
        )
        assert second_payment.json()["receipt_number"] == f"RCP-{institution.id}-000002"
        assert second_payment.json()["total_amount"] == "250.00"

        response = client.get(f"/api/v1/fees/receipts/{receipt_number}", headers=auth_headers)
        assert response.status_code == 200
        receipt = response.json()
        assert receipt["student_name"] == f"{student.first_name} {student.last_name}"
        assert receipt["total_amount"] == "1000.00"

    def test_list_payments_with_filters(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        student: Student,
    ):
        structure = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Sports Fee",
                "category": "sports",
                "amount": "300.00",
            },
        ).json()

        client.post(
            "/api/v1/fees/payments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "fee_structure_id": structure["id"],
                "payment_date": str(date.today()),
                "amount_paid": "300.00",
                "payment_method": "upi",
            },
        )

        response = client.get(
            "/api/v1/fees/payments", headers=auth_headers, params={"student_id": student.id}
        )
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_get_nonexistent_payment(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/fees/payments/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_outstanding_dues(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        student: Student,
    ):
        structure = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Annual Fee",
                "category": "tuition",
                "amount": "2000.00",
            },
        ).json()

        client.post(
            "/api/v1/fees/payments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "fee_structure_id": structure["id"],
                "payment_date": str(date.today()),
                "amount_paid": "500.00",
                "payment_method": "cash",
            },
        )

        response = client.get(
            "/api/v1/fees/outstanding-dues", headers=auth_headers, params={"grade_id": grade.id}
        )
        assert response.status_code == 200
        data = response.json()
        entry = next(d for d in data if d["student_id"] == student.id)
        assert float(entry["total_fees"]) == 2000.0
        assert float(entry["amount_paid"]) == 500.0
        assert float(entry["outstanding_amount"]) == 1500.0

    def test_waiver_create_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student, academic_year: AcademicYear, grade: Grade
    ):
        structure = client.post(
            "/api/v1/fees/structures",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Transport Fee",
                "category": "transport",
                "amount": "800.00",
            },
        ).json()

        response = client.post(
            "/api/v1/fees/waivers",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "fee_structure_id": structure["id"],
                "waiver_percentage": "50",
                "waiver_amount": "400.00",
                "reason": "Financial hardship",
                "valid_from": str(date.today()),
            },
        )
        assert response.status_code == 201
        assert response.json()["approved_by"] is not None

        response = client.get(
            "/api/v1/fees/waivers", headers=auth_headers, params={"student_id": student.id}
        )
        assert response.status_code == 200
        assert response.json()["total"] >= 1
