"""Integration tests for the `document_vault` router (src/api/v1/document_vault.py).

Parent-facing personal document vault: encrypted (AES-256, simulated S3
upload -- `boto3` is imported but never actually called; the router builds
a fake `s3://` URL string and stores the "encryption" locally, so no S3
mocking is needed here) document storage organized into folders, OCR text
extraction (best-effort -- falls back to an empty-text/0-confidence result
when `pytesseract`/the `tesseract` binary isn't available, which is the
case in this sandbox), granular per-document sharing, and FERPA-style
access logging.

Per the task brief: `src/models/document_vault.py` was already fully
rewritten in an earlier pass to match this router + `src/schemas/
document_vault.py` (the model used to be built around an entirely
different, non-folder design and every `FamilyDocument(...)` call in the
router raised `TypeError`). Re-verified field-by-field against every
`FamilyDocument(...)`/`DocumentFolder(...)`/`DocumentShare(...)`/
`DocumentAccessLog(...)` construction site and `.attribute` access in the
router while writing this coverage: no remaining drift found -- the model
now matches the router/schema everywhere.

Bug found and fixed while writing this coverage:

1. **Cross-tenant/same-resource-owner crash (bug class 12 variant) in 5
   endpoints** -- `get_document`, `update_document`, `delete_document`,
   `share_document`, and `get_access_logs` all did
   `if document.parent_id != parent_profile.id:` without first checking
   whether `parent_profile` (looked up by `Parent.user_id ==
   current_user.id`) was `None`. Any authenticated user with no `Parent`
   row at all (a teacher, student, admin, or a parent from a completely
   different flow) hitting any of these 5 endpoints on *any* existing
   `document_id` raised an unhandled `AttributeError:
   'NoneType' object has no attribute 'id'` -- a 500 instead of a clean
   403. Fixed by short-circuiting to the 403 branch when `parent_profile`
   is `None`, matching the guard every other endpoint in this router
   already has.
"""
import io
import uuid
from datetime import datetime, timedelta

import pytest
from PIL import Image

from src.models.document_vault import FamilyDocument, DocumentFolder, DocumentShare, DocumentAccessLog
from src.models.student import Parent, Student
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures: this router needs a `parent` role/user (with a linked
# Parent row), which the standard `auth_headers` (admin role) doesn't
# provide. `parent_user`/`parent_role` already exist in tests/conftest.py.
# ---------------------------------------------------------------------------
@pytest.fixture
def parent_headers(client, parent_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": parent_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def parent_record(db_session, parent_user) -> Parent:
    return db_session.query(Parent).filter(Parent.user_id == parent_user.id).first()


@pytest.fixture
def document(db_session, institution, parent_record) -> FamilyDocument:
    doc = FamilyDocument(
        institution_id=institution.id,
        parent_id=parent_record.id,
        title="Birth Certificate",
        document_type="birth_certificate",
        file_name="cert.pdf",
        file_size=1024,
        file_type="application/pdf",
        mime_type="application/pdf",
        encrypted_file_url="https://s3.amazonaws.com/bucket/documents/1/1/cert.pdf",
        s3_key=f"documents/test/{uuid.uuid4().hex}",
        encryption_key_hash="a" * 64,
        encryption_iv="b" * 32,
        ferpa_compliant=True,
        is_sensitive=True,
        access_log_enabled=True,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


@pytest.fixture
def folder(db_session, institution, parent_record) -> DocumentFolder:
    f = DocumentFolder(
        institution_id=institution.id,
        parent_id=parent_record.id,
        name="Medical Records",
    )
    db_session.add(f)
    db_session.commit()
    db_session.refresh(f)
    return f


# A second parent (different user, same institution) for same-institution
# but different-owner access checks.
@pytest.fixture
def other_parent_user(db_session, institution, parent_role):
    from src.models.user import User
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otherparent{suffix}",
        email=f"otherparent{suffix}@testschool.com",
        first_name="Other",
        last_name="Parent",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=parent_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    parent = Parent(
        institution_id=institution.id,
        user_id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        relation_type="mother",
        is_primary_contact=True,
        is_active=True,
    )
    db_session.add(parent)
    db_session.commit()
    db_session.refresh(parent)
    return user


@pytest.fixture
def other_parent_headers(client, other_parent_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_parent_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _tiny_png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color="white").save(buf, format="PNG")
    return buf.getvalue()


# ===========================================================================
# POST /document-vault/folders, GET /document-vault/folders
# ===========================================================================
class TestFolders:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/document-vault/folders", json={"name": "X"})
        assert response.status_code == 403

    def test_non_parent_user_403(self, client, auth_headers):
        response = client.post(
            "/api/v1/document-vault/folders", json={"name": "X"}, headers=auth_headers
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "Parent profile not found"

    def test_create_folder(self, client, parent_headers):
        response = client.post(
            "/api/v1/document-vault/folders",
            json={"name": "Medical", "description": "Medical docs", "color": "#ff0000"},
            headers=parent_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["name"] == "Medical"
        assert body["is_active"] is True

    def test_create_nested_folder(self, client, parent_headers, folder):
        response = client.post(
            "/api/v1/document-vault/folders",
            json={"name": "Sub", "parent_folder_id": folder.id},
            headers=parent_headers,
        )
        assert response.status_code == 201
        assert response.json()["parent_folder_id"] == folder.id

    def test_list_folders_top_level_only(self, client, parent_headers, folder):
        response = client.get("/api/v1/document-vault/folders", headers=parent_headers)
        assert response.status_code == 200
        names = [f["name"] for f in response.json()]
        assert "Medical Records" in names

    def test_list_folders_by_parent_folder(self, client, parent_headers, folder, db_session, parent_record):
        sub = DocumentFolder(
            institution_id=folder.institution_id,
            parent_id=parent_record.id,
            parent_folder_id=folder.id,
            name="Sub Folder",
        )
        db_session.add(sub)
        db_session.commit()

        response = client.get(
            "/api/v1/document-vault/folders",
            params={"parent_folder_id": folder.id},
            headers=parent_headers,
        )
        assert response.status_code == 200
        names = [f["name"] for f in response.json()]
        assert names == ["Sub Folder"]

    def test_list_folders_scoped_to_own_parent(self, client, parent_headers, folder, other_parent_headers):
        response = client.get("/api/v1/document-vault/folders", headers=other_parent_headers)
        assert response.status_code == 200
        assert response.json() == []


# ===========================================================================
# POST /document-vault/upload
# ===========================================================================
class TestUpload:
    def test_requires_auth(self, client):
        response = client.post(
            "/api/v1/document-vault/upload",
            params={"title": "X", "document_type": "other"},
            files={"file": ("x.png", _tiny_png_bytes(), "image/png")},
        )
        assert response.status_code == 403

    def test_non_parent_user_403(self, client, auth_headers):
        response = client.post(
            "/api/v1/document-vault/upload",
            params={"title": "X", "document_type": "other"},
            files={"file": ("x.png", _tiny_png_bytes(), "image/png")},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_upload_document(self, client, parent_headers, db_session):
        response = client.post(
            "/api/v1/document-vault/upload",
            params={"title": "Vaccination Record", "document_type": "immunization_record"},
            files={"file": ("record.png", _tiny_png_bytes(), "image/png")},
            headers=parent_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert "document_id" in body
        assert body["upload_url"].startswith("https://s3.amazonaws.com/")
        assert body["encryption_key"]

        doc = db_session.query(FamilyDocument).filter(
            FamilyDocument.id == body["document_id"]
        ).first()
        assert doc is not None
        assert doc.title == "Vaccination Record"
        assert doc.file_size == len(_tiny_png_bytes())
        # Upload always logs an access-log entry for FERPA compliance.
        log = db_session.query(DocumentAccessLog).filter(
            DocumentAccessLog.document_id == doc.id, DocumentAccessLog.action == "upload"
        ).first()
        assert log is not None

    def test_upload_document_with_student_and_folder(self, client, parent_headers, folder, db_session, parent_record, institution, section, academic_year):
        student = Student(
            institution_id=institution.id,
            admission_number=f"ADM-{uuid.uuid4().hex[:6]}",
            first_name="Kid",
            last_name="One",
            section_id=section.id,
            is_active=True,
        )
        db_session.add(student)
        db_session.commit()
        db_session.refresh(student)

        response = client.post(
            "/api/v1/document-vault/upload",
            params={
                "title": "Report Card",
                "document_type": "transcript",
                "student_id": student.id,
                "folder_id": folder.id,
            },
            files={"file": ("report.png", _tiny_png_bytes(), "image/png")},
            headers=parent_headers,
        )
        assert response.status_code == 200
        doc_id = response.json()["document_id"]
        doc = db_session.query(FamilyDocument).filter(FamilyDocument.id == doc_id).first()
        assert doc.student_id == student.id
        assert doc.folder_id == folder.id


# ===========================================================================
# GET /document-vault/documents
# ===========================================================================
class TestListDocuments:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/document-vault/documents")
        assert response.status_code == 403

    def test_non_parent_user_403(self, client, auth_headers):
        response = client.get("/api/v1/document-vault/documents", headers=auth_headers)
        assert response.status_code == 403

    def test_list_documents(self, client, parent_headers, document):
        response = client.get("/api/v1/document-vault/documents", headers=parent_headers)
        assert response.status_code == 200
        ids = [d["id"] for d in response.json()]
        assert document.id in ids

    def test_list_documents_filter_by_type(self, client, parent_headers, document):
        response = client.get(
            "/api/v1/document-vault/documents",
            params={"document_type": "birth_certificate"},
            headers=parent_headers,
        )
        assert response.status_code == 200
        assert all(d["document_type"] == "birth_certificate" for d in response.json())

        response = client.get(
            "/api/v1/document-vault/documents",
            params={"document_type": "no-such-type"},
            headers=parent_headers,
        )
        assert response.json() == []

    def test_list_documents_scoped_to_own_parent(self, client, other_parent_headers, document):
        response = client.get("/api/v1/document-vault/documents", headers=other_parent_headers)
        assert response.status_code == 200
        assert response.json() == []


# ===========================================================================
# GET /document-vault/documents/{document_id}
# ===========================================================================
class TestGetDocument:
    def test_get_own_document(self, client, parent_headers, document):
        response = client.get(f"/api/v1/document-vault/documents/{document.id}", headers=parent_headers)
        assert response.status_code == 200
        assert response.json()["id"] == document.id

    def test_get_document_404(self, client, parent_headers):
        response = client.get("/api/v1/document-vault/documents/999999", headers=parent_headers)
        assert response.status_code == 404

    def test_get_document_wrong_owner_403(self, client, other_parent_headers, document):
        response = client.get(f"/api/v1/document-vault/documents/{document.id}", headers=other_parent_headers)
        assert response.status_code == 403

    def test_get_document_no_parent_profile_403_not_500(self, client, auth_headers, document):
        """Regression test: previously crashed with an unhandled
        AttributeError (500) instead of a clean 403 for a caller with no
        Parent row at all."""
        response = client.get(f"/api/v1/document-vault/documents/{document.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_get_shared_document(self, client, other_parent_headers, other_parent_user, document, db_session, parent_headers, parent_user):
        share = DocumentShare(
            document_id=document.id,
            shared_with_user_id=other_parent_user.id,
            shared_by_id=parent_user.id,
            permission="view",
        )
        db_session.add(share)
        db_session.commit()

        response = client.get(f"/api/v1/document-vault/documents/{document.id}", headers=other_parent_headers)
        assert response.status_code == 200

    def test_get_document_logs_access(self, client, parent_headers, document, db_session):
        client.get(f"/api/v1/document-vault/documents/{document.id}", headers=parent_headers)
        log = db_session.query(DocumentAccessLog).filter(
            DocumentAccessLog.document_id == document.id, DocumentAccessLog.action == "view"
        ).first()
        assert log is not None


# ===========================================================================
# PATCH /document-vault/documents/{document_id}
# ===========================================================================
class TestUpdateDocument:
    def test_update_own_document(self, client, parent_headers, document):
        response = client.patch(
            f"/api/v1/document-vault/documents/{document.id}",
            json={"title": "Updated Title", "status": "archived"},
            headers=parent_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["title"] == "Updated Title"
        assert body["status"] == "archived"

    def test_update_document_404(self, client, parent_headers):
        response = client.patch(
            "/api/v1/document-vault/documents/999999", json={"title": "X"}, headers=parent_headers
        )
        assert response.status_code == 404

    def test_update_document_wrong_owner_403(self, client, other_parent_headers, document):
        response = client.patch(
            f"/api/v1/document-vault/documents/{document.id}",
            json={"title": "Hijacked"},
            headers=other_parent_headers,
        )
        assert response.status_code == 403

    def test_update_document_no_parent_profile_403_not_500(self, client, auth_headers, document):
        response = client.patch(
            f"/api/v1/document-vault/documents/{document.id}",
            json={"title": "X"},
            headers=auth_headers,
        )
        assert response.status_code == 403


# ===========================================================================
# DELETE /document-vault/documents/{document_id}
# ===========================================================================
class TestDeleteDocument:
    def test_delete_own_document_soft_deletes(self, client, parent_headers, document, db_session):
        response = client.delete(f"/api/v1/document-vault/documents/{document.id}", headers=parent_headers)
        assert response.status_code == 204

        db_session.refresh(document)
        assert document.is_active is False

    def test_delete_document_404(self, client, parent_headers):
        response = client.delete("/api/v1/document-vault/documents/999999", headers=parent_headers)
        assert response.status_code == 404

    def test_delete_document_wrong_owner_403(self, client, other_parent_headers, document):
        response = client.delete(f"/api/v1/document-vault/documents/{document.id}", headers=other_parent_headers)
        assert response.status_code == 403

    def test_delete_document_no_parent_profile_403_not_500(self, client, auth_headers, document):
        response = client.delete(f"/api/v1/document-vault/documents/{document.id}", headers=auth_headers)
        assert response.status_code == 403


# ===========================================================================
# POST /document-vault/documents/{document_id}/share
# ===========================================================================
class TestShareDocument:
    def test_share_document(self, client, parent_headers, document, other_parent_user):
        response = client.post(
            f"/api/v1/document-vault/documents/{document.id}/share",
            json={"document_id": document.id, "shared_with_user_id": other_parent_user.id, "permission": "view"},
            headers=parent_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["shared_with_user_id"] == other_parent_user.id
        assert body["permission"] == "view"

    def test_share_document_404(self, client, parent_headers, other_parent_user):
        response = client.post(
            "/api/v1/document-vault/documents/999999/share",
            json={"document_id": 999999, "shared_with_user_id": other_parent_user.id},
            headers=parent_headers,
        )
        assert response.status_code == 404

    def test_share_document_wrong_owner_403(self, client, other_parent_headers, document, other_parent_user):
        response = client.post(
            f"/api/v1/document-vault/documents/{document.id}/share",
            json={"document_id": document.id, "shared_with_user_id": other_parent_user.id},
            headers=other_parent_headers,
        )
        assert response.status_code == 403

    def test_share_document_no_parent_profile_403_not_500(self, client, auth_headers, document, other_parent_user):
        response = client.post(
            f"/api/v1/document-vault/documents/{document.id}/share",
            json={"document_id": document.id, "shared_with_user_id": other_parent_user.id},
            headers=auth_headers,
        )
        assert response.status_code == 403


# ===========================================================================
# GET /document-vault/documents/{document_id}/access-logs
# ===========================================================================
class TestAccessLogs:
    def test_get_access_logs(self, client, parent_headers, document):
        # A GET on the document itself creates a 'view' log first.
        client.get(f"/api/v1/document-vault/documents/{document.id}", headers=parent_headers)

        response = client.get(
            f"/api/v1/document-vault/documents/{document.id}/access-logs", headers=parent_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) >= 1
        assert body[0]["action"] in ("view", "share", "update", "delete", "upload")

    def test_get_access_logs_404(self, client, parent_headers):
        response = client.get(
            "/api/v1/document-vault/documents/999999/access-logs", headers=parent_headers
        )
        assert response.status_code == 404

    def test_get_access_logs_wrong_owner_403(self, client, other_parent_headers, document):
        response = client.get(
            f"/api/v1/document-vault/documents/{document.id}/access-logs", headers=other_parent_headers
        )
        assert response.status_code == 403

    def test_get_access_logs_no_parent_profile_403_not_500(self, client, auth_headers, document):
        response = client.get(
            f"/api/v1/document-vault/documents/{document.id}/access-logs", headers=auth_headers
        )
        assert response.status_code == 403


# ===========================================================================
# GET /document-vault/statistics
# ===========================================================================
class TestStatistics:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/document-vault/statistics")
        assert response.status_code == 403

    def test_non_parent_user_403(self, client, auth_headers):
        response = client.get("/api/v1/document-vault/statistics", headers=auth_headers)
        assert response.status_code == 403

    def test_statistics_empty(self, client, other_parent_headers):
        response = client.get("/api/v1/document-vault/statistics", headers=other_parent_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total_documents"] == 0
        assert body["documents_by_type"] == {}
        assert body["total_storage_mb"] == 0

    def test_statistics_with_documents(self, client, parent_headers, document):
        response = client.get("/api/v1/document-vault/statistics", headers=parent_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total_documents"] == 1
        assert body["documents_by_type"] == {"birth_certificate": 1}
        assert body["documents_by_status"] == {"active": 1}
        assert body["recent_uploads"] == 1
        assert body["total_storage_mb"] == pytest.approx(1024 / (1024 * 1024))

    def test_statistics_expiring_soon(self, client, parent_headers, db_session, parent_record, institution):
        expiring = FamilyDocument(
            institution_id=institution.id,
            parent_id=parent_record.id,
            title="Passport",
            document_type="passport",
            file_name="passport.pdf",
            file_size=500,
            file_type="application/pdf",
            encrypted_file_url="https://s3.amazonaws.com/bucket/x",
            s3_key=f"documents/test/{uuid.uuid4().hex}",
            encryption_key_hash="c" * 64,
            encryption_iv="d" * 32,
            expiry_date=datetime.utcnow() + timedelta(days=10),
        )
        db_session.add(expiring)
        db_session.commit()

        response = client.get("/api/v1/document-vault/statistics", headers=parent_headers)
        assert response.status_code == 200
        assert response.json()["expiring_soon"] == 1
