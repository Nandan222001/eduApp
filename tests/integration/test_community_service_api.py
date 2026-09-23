import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.user import User
from src.models.community_service import ServiceActivity, VerificationStatus


def _activity_payload(student_id: int, **overrides) -> dict:
    payload = {
        "student_id": student_id,
        "activity_name": "Weekend Food Drive",
        "organization_name": "Community Food Bank",
        "contact_person": "Alice Coordinator",
        "contact_email": "alice@foodbank.org",
        "contact_phone": "+15551234567",
        "activity_type": "volunteer",
        "date": "2026-01-10",
        "hours_logged": "5.50",
        "description": "Sorted and packed donated food.",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def teacher_headers(client: TestClient, teacher_user: User) -> dict:
    """Real-login auth headers for the `teacher_user`/`teacher` fixtures.

    Needed because /activities/{id}/reject requires a Teacher row (or
    is_superuser) tied to current_user, which the default admin_user/
    auth_headers fixtures don't provide.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
class TestCommunityServiceAPI:
    """Integration tests for /api/v1/community-service/*, the real, mounted
    router (src/api/v1/community_service.py, 1200 lines) backed by
    src/models/community_service.py and src/schemas/community_service.py.

    Found and fixed two real bugs while writing this coverage (see
    TESTING_PROGRESS.md):
    1. `func.case([(cond, val)], else_=0)` in four aggregate-report queries
       (portfolio detail, student report, institution report) raised
       TypeError("Function.__init__() got an unexpected keyword argument
       'else_'") at query-construction time -- func.case() builds a plain
       SQL function call named "case", not the CASE WHEN construct, and
       doesn't accept SQLAlchemy's case() kwargs at all. Fixed by importing
       and using the real `case()` construct.
    2. The `metadata` field on ServiceActivityResponse, OrganizationContact
       Response, GraduationRequirementResponse and ServiceCertificateResponse
       was declared as a plain `Optional[Dict[str, Any]]` with no alias, so
       Pydantic's from_attributes lookup resolved it to the ORM class's
       reserved SQLAlchemy `metadata` (the Declarative MetaData registry)
       instead of the `metadata_json` column attribute, raising a response
       validation error on any endpoint returning these schemas. Fixed with
       the same validation_alias/serialization_alias pattern already used in
       src/schemas/{merchandise,virtual_classroom,subscription,...}.py.

    No endpoint here makes a genuine external network call, so nothing is
    skipped for that reason (unlike test_merchandise_api.py's Razorpay/
    Printful calls)."""

    # ------------------------------------------------------------------
    # Activities: create / list / get / update / delete
    # ------------------------------------------------------------------

    def test_create_and_get_activity(self, client: TestClient, auth_headers: dict, student: Student):
        response = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["activity_name"] == "Weekend Food Drive"
        assert data["verification_status"] == "pending"
        assert data["student_name"] == f"{student.first_name} {student.last_name}"
        assert data["verification_link"]
        activity_id = data["id"]

        response = client.get(f"/api/v1/community-service/activities/{activity_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["organization_name"] == "Community Food Bank"
        assert data["student_name"] == f"{student.first_name} {student.last_name}"

    def test_get_activity_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/community-service/activities/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_create_activity_for_unknown_student_rejected(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(999999),
        )
        assert response.status_code == 404

    def test_list_activities_with_filters(self, client: TestClient, auth_headers: dict, student: Student):
        client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id, activity_type="volunteer", organization_name="Food Bank Co"),
        )
        client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id, activity_type="environmental", organization_name="Green Earth"),
        )

        response = client.get(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            params={"student_id": student.id, "activity_type": "environmental"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["organization_name"] == "Green Earth"

        response = client.get(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            params={"student_id": student.id, "organization_name": "food bank"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["organization_name"] == "Food Bank Co"

    def test_update_pending_activity(self, client: TestClient, auth_headers: dict, student: Student):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id),
        )
        activity_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/community-service/activities/{activity_id}",
            headers=auth_headers,
            json={"hours_logged": "8.00", "description": "Updated description"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["hours_logged"] == "8.00"
        assert data["description"] == "Updated description"

    def test_delete_pending_activity(self, client: TestClient, auth_headers: dict, student: Student):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id),
        )
        activity_id = create_resp.json()["id"]

        response = client.delete(f"/api/v1/community-service/activities/{activity_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/community-service/activities/{activity_id}", headers=auth_headers)
        assert response.status_code == 404

    # ------------------------------------------------------------------
    # External verification workflow (public token-based endpoint)
    # ------------------------------------------------------------------

    def test_verify_external_success_and_metadata_persisted(
        self, client: TestClient, auth_headers: dict, db_session: Session, student: Student
    ):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id),
        )
        activity_id = create_resp.json()["id"]

        activity = db_session.query(ServiceActivity).filter(ServiceActivity.id == activity_id).first()
        token = activity.verification_token
        assert token

        response = client.post(
            "/api/v1/community-service/verify-external",
            json={
                "verification_token": token,
                "signature_url": "https://example.com/sig.png",
                "comments": "Confirmed, great work.",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["activity_id"] == activity_id
        assert data["hours_verified"] == "5.50"

        # Re-fetch: verification_status flipped and metadata_json actually
        # persisted (this is the reserved-`metadata`-column mutation pattern
        # AGENTS.md flags -- must copy-then-reassign for SQLAlchemy to see
        # the diff, and the response schema alias bug above would also have
        # hidden this from a caller even if it did persist).
        get_resp = client.get(f"/api/v1/community-service/activities/{activity_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["verification_status"] == "verified"
        assert data["metadata"]["verifier_comments"] == "Confirmed, great work."

        # Cannot verify twice.
        response = client.post(
            "/api/v1/community-service/verify-external",
            json={"verification_token": token},
        )
        assert response.status_code == 400

        # And, now verified, cannot be updated or deleted any more.
        response = client.put(
            f"/api/v1/community-service/activities/{activity_id}",
            headers=auth_headers,
            json={"hours_logged": "1.00"},
        )
        assert response.status_code == 400

        response = client.delete(f"/api/v1/community-service/activities/{activity_id}", headers=auth_headers)
        assert response.status_code == 400

    def test_verify_external_invalid_token(self, client: TestClient):
        response = client.post(
            "/api/v1/community-service/verify-external",
            json={"verification_token": "does-not-exist"},
        )
        assert response.status_code == 404

    # ------------------------------------------------------------------
    # Reject workflow (teacher/admin only)
    # ------------------------------------------------------------------

    def test_reject_activity_requires_teacher_or_superuser(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id),
        )
        activity_id = create_resp.json()["id"]

        # admin_user has neither a Teacher row nor is_superuser -- forbidden.
        response = client.post(
            f"/api/v1/community-service/activities/{activity_id}/reject",
            headers=auth_headers,
            params={"reason": "Not enough detail"},
        )
        assert response.status_code == 403

    def test_reject_activity_as_teacher(
        self,
        client: TestClient,
        teacher_headers: dict,
        db_session: Session,
        institution: Institution,
        student: Student,
        teacher: Teacher,
    ):
        activity = ServiceActivity(
            institution_id=institution.id,
            student_id=student.id,
            activity_name="Park Cleanup",
            organization_name="City Parks Dept",
            contact_person="Bob Ranger",
            contact_email="bob@parks.org",
            activity_type="environmental",
            date="2026-01-05",
            hours_logged="3.00",
            verification_status=VerificationStatus.PENDING,
        )
        db_session.add(activity)
        db_session.commit()
        db_session.refresh(activity)

        response = client.post(
            f"/api/v1/community-service/activities/{activity.id}/reject",
            headers=teacher_headers,
            params={"reason": "Hours could not be confirmed"},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Activity rejected successfully"

        get_resp = client.get(f"/api/v1/community-service/activities/{activity.id}", headers=teacher_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["verification_status"] == "rejected"
        assert data["metadata"]["rejection_reason"] == "Hours could not be confirmed"

    # ------------------------------------------------------------------
    # Organization contacts
    # ------------------------------------------------------------------

    def test_create_list_and_update_organization(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/community-service/organizations",
            headers=auth_headers,
            json={
                "organization_name": "Riverside Animal Shelter",
                "contact_person": "Carla Vet",
                "contact_email": "carla@riverside-shelter.org",
                "organization_type": "nonprofit",
            },
        )
        assert response.status_code == 201
        org = response.json()
        assert org["is_verified"] is False
        assert org["metadata"] is None
        org_id = org["id"]

        # Duplicate (same institution + org name + contact email) rejected.
        dup = client.post(
            "/api/v1/community-service/organizations",
            headers=auth_headers,
            json={
                "organization_name": "Riverside Animal Shelter",
                "contact_person": "Carla Vet",
                "contact_email": "carla@riverside-shelter.org",
            },
        )
        assert dup.status_code == 400

        response = client.get(
            "/api/v1/community-service/organizations",
            headers=auth_headers,
            params={"search": "Riverside"},
        )
        assert response.status_code == 200
        assert any(o["id"] == org_id for o in response.json())

        response = client.put(
            f"/api/v1/community-service/organizations/{org_id}",
            headers=auth_headers,
            json={"is_verified": True, "notes": "Verified by phone call"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_verified"] is True
        assert data["notes"] == "Verified by phone call"

    # ------------------------------------------------------------------
    # Portfolio / graduation requirements / graduation status
    # ------------------------------------------------------------------

    def test_student_portfolio_and_graduation_status(
        self, client: TestClient, auth_headers: dict, db_session: Session, student: Student
    ):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id, activity_type="volunteer", hours_logged="10.00"),
        )
        activity_id = create_resp.json()["id"]
        activity = db_session.query(ServiceActivity).filter(ServiceActivity.id == activity_id).first()
        token = activity.verification_token
        client.post("/api/v1/community-service/verify-external", json={"verification_token": token})

        # Portfolio detail: exercises the previously-broken func.case()
        # aggregate query (org_data) plus the metadata alias fix.
        response = client.get(f"/api/v1/community-service/portfolio/{student.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["portfolio"]["verified_hours"] == "10.00"
        assert data["portfolio"]["student_name"] == f"{student.first_name} {student.last_name}"
        assert len(data["organization_breakdown"]) == 1
        assert data["organization_breakdown"][0]["verified_hours"] == "10.00"
        assert any(b["activity_type"] == "volunteer" for b in data["activity_breakdown"])

        # Graduation requirement covering "volunteer" hours.
        req_resp = client.post(
            "/api/v1/community-service/requirements",
            headers=auth_headers,
            json={
                "requirement_name": "Volunteer Hours Requirement",
                "required_hours": "10.00",
                "activity_type": "volunteer",
                "is_mandatory": True,
            },
        )
        assert req_resp.status_code == 201
        assert req_resp.json()["metadata"] is None

        list_resp = client.get("/api/v1/community-service/requirements", headers=auth_headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) >= 1

        req_id = req_resp.json()["id"]
        update_resp = client.put(
            f"/api/v1/community-service/requirements/{req_id}",
            headers=auth_headers,
            json={"required_hours": "12.00"},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["required_hours"] == "12.00"

        status_resp = client.get(f"/api/v1/community-service/graduation-status/{student.id}", headers=auth_headers)
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["total_requirements"] == 1
        # 10 verified hours against a (just-raised) 12-hour requirement.
        assert data["requirements"][0]["hours_completed"] == "10.00"
        assert data["requirements"][0]["is_completed"] is False
        assert data["is_on_track"] is False

    # ------------------------------------------------------------------
    # Certificates
    # ------------------------------------------------------------------

    def test_generate_certificate_requires_verified_hours(
        self, client: TestClient, auth_headers: dict, student: Student
    ):
        response = client.post(
            "/api/v1/community-service/certificates",
            headers=auth_headers,
            json={"certificate_type": "completion", "student_id": student.id},
        )
        assert response.status_code == 400

    def test_generate_and_list_certificate(
        self, client: TestClient, auth_headers: dict, db_session: Session, student: Student
    ):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id, hours_logged="4.00"),
        )
        activity_id = create_resp.json()["id"]
        activity = db_session.query(ServiceActivity).filter(ServiceActivity.id == activity_id).first()
        client.post("/api/v1/community-service/verify-external", json={"verification_token": activity.verification_token})

        response = client.post(
            "/api/v1/community-service/certificates",
            headers=auth_headers,
            json={"certificate_type": "completion", "student_id": student.id, "purpose": "College application"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["total_hours"] == "4.00"
        assert data["student_name"] == f"{student.first_name} {student.last_name}"
        assert data["certificate_number"].startswith("CS-")

        list_resp = client.get(
            "/api/v1/community-service/certificates",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert list_resp.status_code == 200
        certs = list_resp.json()
        assert len(certs) == 1
        assert certs[0]["student_name"] == f"{student.first_name} {student.last_name}"

    # ------------------------------------------------------------------
    # Reports (student + institution) and CSV export
    # ------------------------------------------------------------------

    def test_student_and_institution_reports(
        self, client: TestClient, auth_headers: dict, db_session: Session, student: Student
    ):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id, hours_logged="6.00"),
        )
        activity_id = create_resp.json()["id"]
        activity = db_session.query(ServiceActivity).filter(ServiceActivity.id == activity_id).first()
        client.post("/api/v1/community-service/verify-external", json={"verification_token": activity.verification_token})

        # Previously raised TypeError from func.case([(...)], else_=0) at
        # query-construction time in both the org breakdown and monthly
        # trends subqueries -- now fixed to use the real case() construct.
        response = client.get(f"/api/v1/community-service/reports/student/{student.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["verified_hours"] == "6.00"
        assert len(data["monthly_trends"]) == 1
        assert data["monthly_trends"][0]["verified_hours"] == "6.00"
        assert len(data["organization_breakdown"]) == 1

        response = client.get("/api/v1/community-service/reports/institution", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_students"] >= 1
        assert data["verified_hours"] == "6.00"
        assert len(data["top_organizations"]) == 1

    def test_export_csv(self, client: TestClient, auth_headers: dict, db_session: Session, student: Student):
        create_resp = client.post(
            "/api/v1/community-service/activities",
            headers=auth_headers,
            json=_activity_payload(student.id),
        )
        activity_id = create_resp.json()["id"]
        activity = db_session.query(ServiceActivity).filter(ServiceActivity.id == activity_id).first()
        client.post("/api/v1/community-service/verify-external", json={"verification_token": activity.verification_token})

        response = client.post(
            "/api/v1/community-service/export",
            headers=auth_headers,
            json={"student_id": student.id, "format": "csv", "include_unverified": True},
        )
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        body = response.text
        assert "Community Food Bank" in body
        assert "Student Name" in body.splitlines()[0]

    def test_export_unsupported_format_rejected(self, client: TestClient, auth_headers: dict, student: Student):
        # `format` is validated by the schema's regex to only "csv"|"pdf",
        # but the handler itself only implements "csv" -- PDF is a real,
        # documented gap in this environment (no PDF generation library is
        # wired up here), not a network dependency, so we assert the
        # handler's own explicit 400 rather than skip it.
        response = client.post(
            "/api/v1/community-service/export",
            headers=auth_headers,
            json={"student_id": student.id, "format": "pdf"},
        )
        assert response.status_code == 400
