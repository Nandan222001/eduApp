import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student


@pytest.mark.integration
class TestSchoolAdminAPI:
    """Integration tests for /api/v1/school-admin/*, the real, mounted
    router (src/api/v1/school_admin.py) backed by
    src/models/school_admin.py, src/schemas/school_admin.py and
    src/services/school_admin_service.py. Certificate PDF generation uses
    reportlab locally (no external network call), so it is covered
    end-to-end here."""

    # ---- Certificates ----

    def test_create_certificate_template_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/school-admin/certificates/templates",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "template_name": "Standard Bonafide",
                "certificate_type": "bonafide",
                "template_config": {"header": "School Name", "footer": "Principal"},
                "is_default": True,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["template_name"] == "Standard Bonafide"
        assert data["is_default"] is True

        response = client.get(
            "/api/v1/school-admin/certificates/templates",
            headers=auth_headers,
            params={"certificate_type": "bonafide"},
        )
        assert response.status_code == 200
        templates = response.json()
        assert any(t["template_name"] == "Standard Bonafide" for t in templates)

    def test_create_certificate_template_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Rival School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/school-admin/certificates/templates",
            headers=auth_headers,
            json={
                "institution_id": other.id,
                "template_name": "Contraband",
                "certificate_type": "bonafide",
                "template_config": {},
            },
        )
        assert response.status_code == 403

    def test_issue_certificate_and_download_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/school-admin/certificates/issue",
            headers=auth_headers,
            params={"student_id": student.id},
            json={
                "certificate_type": "bonafide",
                "data": {"purpose": "Passport application", "academic_year": "2023-2024"},
                "remarks": "Issued on request",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["certificate_type"] == "bonafide"
        assert data["status"] == "issued"
        assert data["student_id"] == student.id
        cert_id = data["id"]
        assert data["serial_number"]

        response = client.get(
            f"/api/v1/school-admin/certificates/{cert_id}/download", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(response.content) > 0

        response = client.get(
            f"/api/v1/school-admin/certificates/student/{student.id}", headers=auth_headers
        )
        assert response.status_code == 200
        certs = response.json()
        assert any(c["id"] == cert_id for c in certs)

    def test_issue_certificate_nonexistent_student_404(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/school-admin/certificates/issue",
            headers=auth_headers,
            params={"student_id": 999999},
            json={"certificate_type": "bonafide", "data": {}},
        )
        assert response.status_code == 404

    # ---- Staff ----

    def test_create_get_update_delete_staff(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/school-admin/staff",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "employee_id": "EMP100",
                "first_name": "Alice",
                "last_name": "Wong",
                "email": "alice.wong@testschool.com",
                "department": "teaching",
                "basic_salary": "50000.00",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["employee_id"] == "EMP100"
        assert data["is_active"] is True
        assert data["status"] == "active"
        staff_id = data["id"]

        response = client.get(f"/api/v1/school-admin/staff/{staff_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["first_name"] == "Alice"

        response = client.put(
            f"/api/v1/school-admin/staff/{staff_id}",
            headers=auth_headers,
            json={"designation": "Senior Teacher", "status": "on_leave"},
        )
        assert response.status_code == 200
        assert response.json()["designation"] == "Senior Teacher"
        assert response.json()["status"] == "on_leave"

        response = client.delete(f"/api/v1/school-admin/staff/{staff_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/school-admin/staff/{staff_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_create_staff_duplicate_employee_id_rejected(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        payload = {
            "institution_id": institution.id,
            "employee_id": "EMP200",
            "first_name": "Bob",
            "last_name": "Lee",
            "department": "administration",
        }
        first = client.post("/api/v1/school-admin/staff", headers=auth_headers, json=payload)
        assert first.status_code == 201

        second = client.post("/api/v1/school-admin/staff", headers=auth_headers, json=payload)
        assert second.status_code == 400

    def test_create_staff_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Other School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/school-admin/staff",
            headers=auth_headers,
            json={
                "institution_id": other.id,
                "employee_id": "EMP300",
                "first_name": "Carl",
                "last_name": "Doe",
                "department": "teaching",
            },
        )
        assert response.status_code == 403

    def test_list_staff_and_filters_and_statistics(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        client.post(
            "/api/v1/school-admin/staff",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "employee_id": "EMP400",
                "first_name": "Dana",
                "last_name": "Kim",
                "department": "accounts",
            },
        )

        response = client.get("/api/v1/school-admin/staff", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(s["employee_id"] == "EMP400" for s in data["items"])

        response = client.get(
            "/api/v1/school-admin/staff",
            headers=auth_headers,
            params={"department": "accounts", "search": "Dana"},
        )
        assert response.status_code == 200
        assert all(s["department"] == "accounts" for s in response.json()["items"])

        response = client.get("/api/v1/school-admin/staff/statistics", headers=auth_headers)
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_staff"] >= 1
        assert "accounts" in stats["staff_by_department"]

    # ---- Payroll ----

    def test_generate_payroll_list_update_and_report(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        staff_resp = client.post(
            "/api/v1/school-admin/staff",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "employee_id": "EMP500",
                "first_name": "Eve",
                "last_name": "Park",
                "department": "teaching",
                "basic_salary": "40000.00",
            },
        )
        assert staff_resp.status_code == 201
        staff_id = staff_resp.json()["id"]

        response = client.post(
            "/api/v1/school-admin/staff/payroll/generate",
            headers=auth_headers,
            json={"month": 6, "year": 2026, "staff_ids": [staff_id]},
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] == 1
        assert result["failed"] == 0

        # Generating again for the same month/staff should fail this time (already exists)
        response = client.post(
            "/api/v1/school-admin/staff/payroll/generate",
            headers=auth_headers,
            json={"month": 6, "year": 2026, "staff_ids": [staff_id]},
        )
        assert response.status_code == 200
        assert response.json()["failed"] == 1

        response = client.get(
            "/api/v1/school-admin/staff/payroll",
            headers=auth_headers,
            params={"month": 6, "year": 2026},
        )
        assert response.status_code == 200
        payroll_data = response.json()
        assert payroll_data["total"] >= 1
        payroll_id = payroll_data["items"][0]["id"]

        response = client.put(
            f"/api/v1/school-admin/staff/payroll/{payroll_id}",
            headers=auth_headers,
            json={"payment_status": "paid"},
        )
        assert response.status_code == 200
        assert response.json()["payment_status"] == "paid"

        # This endpoint declares payroll_ids: list[int] as a bare parameter
        # (not wrapped in a pydantic model), so FastAPI treats it as a
        # single, un-embedded JSON body (the raw list) while payment_date/
        # transaction_reference -- plain scalar params -- are bound from
        # the query string.
        response = client.post(
            "/api/v1/school-admin/staff/payroll/bulk-process",
            headers=auth_headers,
            params={"payment_date": "2026-06-30"},
            json=[payroll_id],
        )
        assert response.status_code == 200, response.text
        assert response.json()["processed"] == 1

        response = client.get(
            "/api/v1/school-admin/staff/payroll/report",
            headers=auth_headers,
            params={"month": 6, "year": 2026},
        )
        assert response.status_code == 200
        report = response.json()
        assert report["total_employees"] >= 1
        assert report["paid_count"] >= 1
        assert isinstance(report["payrolls"], list)
        assert report["payrolls"][0]["staff_id"] == staff_id

    # ---- SMS ----

    def test_sms_template_crud_and_send(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/school-admin/sms/templates",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "template_name": "Fee Reminder",
                "template_type": "fee_reminder",
                "message_body": "Dear {{parent_name}}, fees are due.",
            },
        )
        assert response.status_code == 201
        template_id = response.json()["id"]

        response = client.get("/api/v1/school-admin/sms/templates", headers=auth_headers)
        assert response.status_code == 200
        assert any(t["id"] == template_id for t in response.json())

        response = client.put(
            f"/api/v1/school-admin/sms/templates/{template_id}",
            headers=auth_headers,
            json={"message_body": "Dear {{parent_name}}, fees are overdue."},
        )
        assert response.status_code == 200
        assert "overdue" in response.json()["message_body"]

        response = client.post(
            "/api/v1/school-admin/sms/send",
            headers=auth_headers,
            json={
                "template_id": template_id,
                "recipient_type": "parent",
                "recipient_ids": [1, 2, 3],
                "variables": {"parent_name": "Mr. Smith"},
            },
        )
        assert response.status_code == 200
        assert response.json()["sent_count"] == 3

        response = client.delete(
            f"/api/v1/school-admin/sms/templates/{template_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(
            f"/api/v1/school-admin/sms/templates/{template_id}", headers=auth_headers
        )
        assert response.status_code == 404

    # ---- Enquiries ----

    def test_enquiry_crud_status_workflow_and_statistics(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/school-admin/enquiries",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "enquiry_date": "2026-06-01",
                "student_name": "Future Student",
                "parent_name": "Parent Name",
                "parent_phone": "+911234567890",
                "source": "walk_in",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "new"
        enquiry_id = data["id"]

        response = client.get(f"/api/v1/school-admin/enquiries/{enquiry_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["student_name"] == "Future Student"

        response = client.put(
            f"/api/v1/school-admin/enquiries/{enquiry_id}",
            headers=auth_headers,
            json={"notes": "Called back, interested"},
        )
        assert response.status_code == 200
        assert response.json()["notes"] == "Called back, interested"

        response = client.put(
            f"/api/v1/school-admin/enquiries/{enquiry_id}/status",
            headers=auth_headers,
            json={"new_status": "converted"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "converted"

        response = client.get("/api/v1/school-admin/enquiries", headers=auth_headers)
        assert response.status_code == 200
        assert any(e["id"] == enquiry_id for e in response.json()["items"])

        response = client.get("/api/v1/school-admin/enquiries/statistics", headers=auth_headers)
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_enquiries"] >= 1
        assert stats["enquiries_by_status"].get("converted", 0) >= 1
        assert stats["conversion_rate"] > 0

        response = client.delete(
            f"/api/v1/school-admin/enquiries/{enquiry_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(f"/api/v1/school-admin/enquiries/{enquiry_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_enquiry_send_follow_up_sms(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        enquiry_resp = client.post(
            "/api/v1/school-admin/enquiries",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "enquiry_date": "2026-06-02",
                "student_name": "Another Prospect",
                "parent_name": "Another Parent",
                "parent_phone": "+911234567891",
                "source": "phone",
            },
        )
        enquiry_id = enquiry_resp.json()["id"]

        template_resp = client.post(
            "/api/v1/school-admin/sms/templates",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "template_name": "Enquiry Follow-up",
                "template_type": "enquiry_response",
                "message_body": "Hi {{parent_name}}, thanks for your enquiry.",
            },
        )
        template_id = template_resp.json()["id"]

        response = client.post(
            f"/api/v1/school-admin/enquiries/{enquiry_id}/send-sms",
            headers=auth_headers,
            params={"template_id": template_id},
        )
        assert response.status_code == 200

        response = client.get(f"/api/v1/school-admin/enquiries/{enquiry_id}", headers=auth_headers)
        assert response.json()["sms_sent_count"] == 1

    # ---- Student promotion ----

    def test_promote_students_with_criteria(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.put(
            "/api/v1/school-admin/students/promote",
            headers=auth_headers,
            json={
                "student_ids": [student.id],
                "target_grade_id": 1,
                "target_section_id": None,
                "effective_date": "2026-06-01",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_students"] == 1
        # No minimum_attendance/pass criteria supplied, so the student is
        # eligible by default and gets promoted.
        assert data["promoted_count"] == 1
        assert data["promoted_students"] == [student.id]

    def test_promote_students_with_attendance_criteria_no_data_fails(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.put(
            "/api/v1/school-admin/students/promote",
            headers=auth_headers,
            json={"student_ids": [student.id], "target_grade_id": 1},
            params={"minimum_attendance_percentage": 75},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["failed_count"] == 1
        assert student.id in data["failed_students"]
        assert "No attendance data available" in data["promotion_report"][0]["reasons"]
