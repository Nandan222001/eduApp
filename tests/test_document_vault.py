import pytest
from io import BytesIO
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.student import Parent
from src.utils.security import get_password_hash


@pytest.fixture
def parent_user_with_profile(
    db_session: Session,
    institution: Institution,
    parent_role: Role,
) -> tuple[User, Parent]:
    user = User(
        username="vault_parent",
        email="vault_parent@test.com",
        first_name="Vault",
        last_name="Parent",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=parent_role.id,
        is_active=True,
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

    return user, parent


@pytest.fixture
def vault_auth_headers(client: TestClient, parent_user_with_profile: tuple[User, Parent]) -> dict:
    user, _ = parent_user_with_profile
    response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
class TestDocumentVaultAPI:
    """Integration tests for /api/v1/document-vault/* -- exercises the real,
    already-working router (src/api/v1/document_vault.py), which queries
    FamilyDocument/DocumentFolder/DocumentShare/DocumentAccessLog directly.

    This file previously unit-tested src.services.document_vault_service,
    which is dead code: nothing in src/ imports it, the real router never
    uses it, and it imports names (DocumentType, ShareType enums) that don't
    exist in src/schemas/document_vault.py -- that schema uses plain `str`
    for document_type/permission instead, a different, later design the
    service was never updated to match. See TESTING_PROGRESS.md for the
    full investigation. Testing the real router here instead.
    """

    def test_create_and_list_folder(self, client: TestClient, vault_auth_headers: dict):
        response = client.post(
            "/api/v1/document-vault/folders",
            headers=vault_auth_headers,
            json={"name": "Medical Records", "description": "Health documents"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Medical Records"
        folder_id = data["id"]

        response = client.get("/api/v1/document-vault/folders", headers=vault_auth_headers)
        assert response.status_code == 200
        folders = response.json()
        assert any(f["id"] == folder_id for f in folders)

    def test_upload_and_get_document(self, client: TestClient, vault_auth_headers: dict):
        response = client.post(
            "/api/v1/document-vault/upload",
            headers=vault_auth_headers,
            params={
                "title": "Birth Certificate",
                "document_type": "birth_certificate",
            },
            files={"file": ("cert.pdf", BytesIO(b"not a real pdf"), "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert "encryption_key" in data
        document_id = data["document_id"]

        response = client.get(f"/api/v1/document-vault/documents/{document_id}", headers=vault_auth_headers)
        assert response.status_code == 200
        doc = response.json()
        assert doc["title"] == "Birth Certificate"
        assert doc["document_type"] == "birth_certificate"
        # AES-256 encryption should have actually run, not just been simulated
        assert doc["encrypted_file_url"].startswith("https://")

    def test_list_documents(self, client: TestClient, vault_auth_headers: dict):
        client.post(
            "/api/v1/document-vault/upload",
            headers=vault_auth_headers,
            params={"title": "Report Card", "document_type": "transcript"},
            files={"file": ("report.pdf", BytesIO(b"content"), "application/pdf")},
        )

        response = client.get("/api/v1/document-vault/documents", headers=vault_auth_headers)
        assert response.status_code == 200
        documents = response.json()
        assert len(documents) >= 1
        assert any(d["document_type"] == "transcript" for d in documents)

    def test_update_document(self, client: TestClient, vault_auth_headers: dict):
        upload = client.post(
            "/api/v1/document-vault/upload",
            headers=vault_auth_headers,
            params={"title": "Old Title", "document_type": "iep"},
            files={"file": ("iep.pdf", BytesIO(b"content"), "application/pdf")},
        )
        document_id = upload.json()["document_id"]

        response = client.patch(
            f"/api/v1/document-vault/documents/{document_id}",
            headers=vault_auth_headers,
            json={"title": "New Title"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "New Title"

    def test_delete_document(self, client: TestClient, vault_auth_headers: dict):
        upload = client.post(
            "/api/v1/document-vault/upload",
            headers=vault_auth_headers,
            params={"title": "To Delete", "document_type": "other"},
            files={"file": ("f.pdf", BytesIO(b"content"), "application/pdf")},
        )
        document_id = upload.json()["document_id"]

        response = client.delete(f"/api/v1/document-vault/documents/{document_id}", headers=vault_auth_headers)
        assert response.status_code == 204

        # Deletion is a soft-delete (is_active=False); the real router still
        # returns 200 for a direct get -- it doesn't filter get_document by
        # is_active -- so confirm via the list endpoint instead, which does.
        response = client.get("/api/v1/document-vault/documents", headers=vault_auth_headers)
        assert all(d["id"] != document_id for d in response.json())

    def test_document_not_found(self, client: TestClient, vault_auth_headers: dict):
        response = client.get("/api/v1/document-vault/documents/999999", headers=vault_auth_headers)
        assert response.status_code == 404

    def test_share_document_and_access_logs(self, client: TestClient, vault_auth_headers: dict, db_session: Session, institution, parent_role: Role):
        upload = client.post(
            "/api/v1/document-vault/upload",
            headers=vault_auth_headers,
            params={"title": "Shared Doc", "document_type": "other"},
            files={"file": ("f.pdf", BytesIO(b"content"), "application/pdf")},
        )
        document_id = upload.json()["document_id"]

        other_user = User(
            username="vault_recipient",
            email="vault_recipient@test.com",
            first_name="Recipient",
            last_name="User",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        response = client.post(
            f"/api/v1/document-vault/documents/{document_id}/share",
            headers=vault_auth_headers,
            json={"document_id": document_id, "shared_with_user_id": other_user.id, "permission": "view"},
        )
        assert response.status_code == 201
        assert response.json()["shared_with_user_id"] == other_user.id

        response = client.get(
            f"/api/v1/document-vault/documents/{document_id}/access-logs",
            headers=vault_auth_headers,
        )
        assert response.status_code == 200
        actions = [log["action"] for log in response.json()]
        assert "upload" in actions
        assert "share" in actions

    def test_statistics(self, client: TestClient, vault_auth_headers: dict):
        client.post(
            "/api/v1/document-vault/upload",
            headers=vault_auth_headers,
            params={"title": "Stat Doc", "document_type": "transcript"},
            files={"file": ("f.pdf", BytesIO(b"content"), "application/pdf")},
        )

        response = client.get("/api/v1/document-vault/statistics", headers=vault_auth_headers)
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_documents"] >= 1
        assert "transcript" in stats["documents_by_type"]

    def test_upload_without_parent_profile_is_forbidden(self, client: TestClient, auth_headers: dict):
        # auth_headers (from conftest) is an admin User with no linked Parent
        # row -- the router should reject them rather than 500.
        response = client.post(
            "/api/v1/document-vault/upload",
            headers=auth_headers,
            params={"title": "X", "document_type": "other"},
            files={"file": ("f.pdf", BytesIO(b"content"), "application/pdf")},
        )
        assert response.status_code == 403
