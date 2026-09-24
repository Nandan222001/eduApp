"""Integration tests for the `homework_scanner` router
(src/api/v1/homework_scanner.py).

Uploads a homework photo (S3 calls mocked by patching the shared
`s3_client` singleton the service module imports, matching this codebase's
established pattern in test_assignments_api.py -- the module-level
singleton is constructed once at import time with no AWS creds in the test
env and would otherwise always raise "S3 is not configured properly"), then
runs OCR/problem-detection/solving/AI-feedback (all individually optional-
dependency-guarded, so they degrade gracefully rather than crash when
pytesseract/sympy/an OpenAI key aren't available), lists a student's scans,
fetches one, requests its analysis, and deletes it.

Two bugs found and fixed while writing this coverage:

1. **`HomeworkScanResponse.metadata` had no alias** (the "metadata/
   metadata_json shadowing" pattern found repeatedly elsewhere this
   session, e.g. `virtual_classroom.py`): with `from_attributes=True` and
   no alias, Pydantic populated the `metadata` field from `scan.metadata`
   -- the class-level SQLAlchemy `MetaData` registry object every
   Declarative model inherits from `Base` (the real column is mapped as
   `metadata_json`, since `metadata` is a reserved name on Declarative
   models). This failed response validation against
   `Optional[Dict[str, Any]]` unconditionally, so `POST /scans`, `GET
   /scans` and `GET /scans/{id}` all 500'd on every single response. Fixed
   with the same `validation_alias='metadata_json'`/
   `serialization_alias='metadata'` pattern already used in
   `schemas/virtual_classroom.py`.
2. **Cross-tenant data-isolation gap**: `get_scan`/`get_student_scans`/
   `analyze_scan`/`delete_scan` never filtered by `institution_id` at all,
   so any authenticated user from any institution could view, analyze or
   delete another institution's homework scans just by guessing a scan id
   or student id. Fixed by threading `institution_id` through every read/
   delete call in the service, scoped from `current_user.institution_id`
   in the router.
"""
import io
import uuid
from datetime import datetime
from unittest.mock import patch

import pytest


BASE = "/api/v1/homework-scanner"


@pytest.fixture
def mock_s3_upload():
    with patch(
        "src.services.homework_scanner_service.s3_client.upload_file",
        return_value="https://test-bucket.s3.amazonaws.com/homework_scans/fake-key.jpg",
    ) as mock_upload:
        yield mock_upload


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
def scan_student(db_session, institution, student_user, section, academic_year):
    from src.models.student import Student

    s = Student(
        institution_id=institution.id,
        user_id=student_user.id,
        admission_number="ADM-HW-1",
        first_name=student_user.first_name,
        last_name=student_user.last_name,
        email=student_user.email,
        section_id=section.id,
        date_of_birth=datetime(2008, 3, 20).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Female",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def scan(client, auth_headers, mock_s3_upload, scan_student, subject):
    files = {"file": ("homework.png", io.BytesIO(b"fake image bytes"), "image/png")}
    data = {"student_id": str(scan_student.id), "subject_id": str(subject.id), "scan_title": "Algebra HW"}
    response = client.post(f"{BASE}/scans", files=files, data=data, headers=auth_headers)
    assert response.status_code == 201
    return response.json()


class TestCreateScan:
    def test_requires_auth(self, client, scan_student):
        files = {"file": ("homework.png", io.BytesIO(b"fake"), "image/png")}
        data = {"student_id": str(scan_student.id)}
        response = client.post(f"{BASE}/scans", files=files, data=data)
        assert response.status_code == 403

    def test_rejects_non_image_file(self, client, auth_headers, scan_student):
        files = {"file": ("notes.txt", io.BytesIO(b"not an image"), "text/plain")}
        data = {"student_id": str(scan_student.id)}
        response = client.post(f"{BASE}/scans", files=files, data=data, headers=auth_headers)
        assert response.status_code == 400

    def test_create_scan_success(self, client, auth_headers, mock_s3_upload, scan_student, subject):
        files = {"file": ("homework.png", io.BytesIO(b"fake image bytes"), "image/png")}
        data = {"student_id": str(scan_student.id), "subject_id": str(subject.id), "scan_title": "Algebra HW"}
        response = client.post(f"{BASE}/scans", files=files, data=data, headers=auth_headers)
        assert response.status_code == 201
        body = response.json()
        assert body["student_id"] == scan_student.id
        assert body["scan_title"] == "Algebra HW"
        assert body["processing_status"] in ("completed", "failed")
        mock_s3_upload.assert_called_once()


class TestGetScans:
    def test_requires_auth(self, client, scan_student):
        response = client.get(f"{BASE}/scans", params={"student_id": scan_student.id})
        assert response.status_code == 403

    def test_list_scans_for_student(self, client, auth_headers, scan, scan_student):
        response = client.get(
            f"{BASE}/scans", params={"student_id": scan_student.id}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == scan["id"]

    def test_list_scans_cross_tenant_isolation(
        self, client, auth_headers, scan, scan_student, other_institution, db_session
    ):
        """Regression test for the cross-tenant gap: a scan belonging to
        another institution must never surface for this institution's
        caller, even when querying by the same student_id value."""
        from src.models.homework_scanner import HomeworkScan

        foreign_scan = HomeworkScan(
            institution_id=other_institution.id,
            student_id=scan_student.id,
            image_url="https://example.com/foreign.png",
            s3_key="foreign/key.png",
            processing_status="completed",
        )
        db_session.add(foreign_scan)
        db_session.commit()
        db_session.refresh(foreign_scan)

        response = client.get(
            f"{BASE}/scans", params={"student_id": scan_student.id}, headers=auth_headers
        )
        assert response.status_code == 200
        ids = [s["id"] for s in response.json()]
        assert foreign_scan.id not in ids

    def test_get_scan_by_id(self, client, auth_headers, scan):
        response = client.get(f"{BASE}/scans/{scan['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == scan["id"]
        # Regression check for the metadata/MetaData shadowing bug: this
        # field must serialize as a plain dict/None, never crash.
        assert response.json()["metadata"] is None or isinstance(response.json()["metadata"], dict)

    def test_get_scan_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/scans/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_scan_cross_tenant_isolation(
        self, client, auth_headers, scan_student, other_institution, db_session
    ):
        from src.models.homework_scanner import HomeworkScan

        foreign_scan = HomeworkScan(
            institution_id=other_institution.id,
            student_id=scan_student.id,
            image_url="https://example.com/foreign.png",
            s3_key="foreign/key.png",
            processing_status="completed",
        )
        db_session.add(foreign_scan)
        db_session.commit()
        db_session.refresh(foreign_scan)

        response = client.get(f"{BASE}/scans/{foreign_scan.id}", headers=auth_headers)
        assert response.status_code == 404


class TestAnalyzeScan:
    def test_requires_auth(self, client, scan):
        response = client.get(f"{BASE}/scans/{scan['id']}/analyze")
        assert response.status_code == 403

    def test_analyze_scan(self, client, auth_headers, scan):
        response = client.get(f"{BASE}/scans/{scan['id']}/analyze", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["scan_id"] == scan["id"]
        assert "recommendations" in body
        assert body["overall_difficulty"] in ("easy", "medium", "hard")

    def test_analyze_scan_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/scans/999999/analyze", headers=auth_headers)
        assert response.status_code == 404

    def test_analyze_scan_cross_tenant_isolation(
        self, client, auth_headers, scan_student, other_institution, db_session
    ):
        from src.models.homework_scanner import HomeworkScan

        foreign_scan = HomeworkScan(
            institution_id=other_institution.id,
            student_id=scan_student.id,
            image_url="https://example.com/foreign.png",
            s3_key="foreign/key.png",
            processing_status="completed",
        )
        db_session.add(foreign_scan)
        db_session.commit()
        db_session.refresh(foreign_scan)

        response = client.get(f"{BASE}/scans/{foreign_scan.id}/analyze", headers=auth_headers)
        assert response.status_code == 404


class TestDeleteScan:
    def test_requires_auth(self, client, scan):
        response = client.delete(f"{BASE}/scans/{scan['id']}")
        assert response.status_code == 403

    def test_delete_scan(self, client, auth_headers, scan):
        response = client.delete(f"{BASE}/scans/{scan['id']}", headers=auth_headers)
        assert response.status_code == 204

        get_resp = client.get(f"{BASE}/scans/{scan['id']}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_delete_scan_not_found(self, client, auth_headers):
        response = client.delete(f"{BASE}/scans/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_scan_cross_tenant_isolation(
        self, client, auth_headers, scan_student, other_institution, db_session
    ):
        """A caller must not be able to delete another institution's scan
        even by guessing its id."""
        from src.models.homework_scanner import HomeworkScan

        foreign_scan = HomeworkScan(
            institution_id=other_institution.id,
            student_id=scan_student.id,
            image_url="https://example.com/foreign.png",
            s3_key="foreign/key.png",
            processing_status="completed",
        )
        db_session.add(foreign_scan)
        db_session.commit()
        db_session.refresh(foreign_scan)

        response = client.delete(f"{BASE}/scans/{foreign_scan.id}", headers=auth_headers)
        assert response.status_code == 404

        still_there = db_session.query(HomeworkScan).filter(
            HomeworkScan.id == foreign_scan.id
        ).first()
        assert still_there is not None
