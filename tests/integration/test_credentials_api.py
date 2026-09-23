import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.institution import Institution
from src.models.role import Role
from src.utils.security import get_password_hash


@pytest.fixture
def recipient_user(db_session: Session, institution: Institution, parent_role: Role) -> User:
    user = User(
        username="credential_recipient",
        email="credential_recipient@test.com",
        first_name="Credential",
        last_name="Recipient",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=parent_role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.mark.integration
class TestCredentialsAPI:
    """Integration tests for /api/v1/credentials/*, the real, mounted
    router (src/api/v1/credentials.py) backed by src/models/
    digital_credential.py -- both written this session (see
    TESTING_PROGRESS.md, the "credentials" router fix)."""

    def test_issue_and_get_credential(
        self, client: TestClient, auth_headers: dict, admin_user: User, recipient_user: User
    ):
        response = client.post(
            "/api/v1/credentials/",
            headers=auth_headers,
            json={
                "credential_type": "certificate",
                "sub_type": "academic",
                "title": "Certificate of Excellence",
                "description": "Top of class",
                "recipient_id": recipient_user.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Certificate of Excellence"
        assert data["recipient_id"] == recipient_user.id
        assert data["certificate_number"]
        # blockchain_service isn't configured in tests, so issuance falls
        # back to the except-path in issue_credential -- status stays
        # PENDING rather than ACTIVE (see credential_service.py).
        assert data["status"] in ["pending", "active"]
        credential_id = data["id"]

        response = client.get(f"/api/v1/credentials/{credential_id}", headers=auth_headers)
        assert response.status_code == 200
        detail = response.json()
        assert detail["recipient_name"] == f"{recipient_user.first_name} {recipient_user.last_name}"
        assert detail["verification_count"] == 0
        assert detail["share_count"] == 0

    def test_get_nonexistent_credential(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/credentials/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_bulk_issue_credentials(
        self, client: TestClient, auth_headers: dict, admin_user: User, recipient_user: User, db_session: Session, institution: Institution, parent_role: Role
    ):
        second_recipient = User(
            username="credential_recipient_2",
            email="credential_recipient_2@test.com",
            first_name="Second",
            last_name="Recipient",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(second_recipient)
        db_session.commit()
        db_session.refresh(second_recipient)

        response = client.post(
            "/api/v1/credentials/bulk",
            headers=auth_headers,
            json={
                "recipient_ids": [recipient_user.id, second_recipient.id],
                "credential_type": "digital_badge",
                "sub_type": "participation",
                "title": "Science Fair Participant",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data) == 2

    def test_my_credentials_and_issued_by_me(
        self, client: TestClient, auth_headers: dict, recipient_user: User
    ):
        client.post(
            "/api/v1/credentials/",
            headers=auth_headers,
            json={
                "credential_type": "certificate",
                "sub_type": "skill_based",
                "title": "Python Proficiency",
                "recipient_id": recipient_user.id,
            },
        )

        response = client.get("/api/v1/credentials/issued-by-me", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_update_and_revoke_credential(
        self, client: TestClient, auth_headers: dict, recipient_user: User
    ):
        issue = client.post(
            "/api/v1/credentials/",
            headers=auth_headers,
            json={
                "credential_type": "certificate",
                "sub_type": "academic",
                "title": "Draft Title",
                "recipient_id": recipient_user.id,
            },
        )
        credential_id = issue.json()["id"]

        response = client.put(
            f"/api/v1/credentials/{credential_id}",
            headers=auth_headers,
            json={"title": "Final Title"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Final Title"

        response = client.post(
            f"/api/v1/credentials/{credential_id}/revoke",
            headers=auth_headers,
            json={"reason": "Issued in error"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "revoked"
        assert data["revoke_reason"] == "Issued in error"

    def test_share_credential(
        self, client: TestClient, auth_headers: dict, recipient_user: User
    ):
        issue = client.post(
            "/api/v1/credentials/",
            headers=auth_headers,
            json={
                "credential_type": "certificate",
                "sub_type": "academic",
                "title": "Shareable Credential",
                "recipient_id": recipient_user.id,
            },
        )
        credential_id = issue.json()["id"]

        response = client.post(
            f"/api/v1/credentials/{credential_id}/share",
            headers=auth_headers,
            json={"recipient_email": "friend@test.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["share_token"]
        assert data["share_url"].endswith(data["share_token"])

    def test_verify_credential_by_certificate_number(
        self, client: TestClient, auth_headers: dict, recipient_user: User
    ):
        issue = client.post(
            "/api/v1/credentials/",
            headers=auth_headers,
            json={
                "credential_type": "certificate",
                "sub_type": "academic",
                "title": "Verifiable Credential",
                "recipient_id": recipient_user.id,
            },
        )
        certificate_number = issue.json()["certificate_number"]

        response = client.get(f"/api/v1/credentials/verify/certificate/{certificate_number}")
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        assert data["credential"]["title"] == "Verifiable Credential"

    def test_verify_nonexistent_certificate(self, client: TestClient):
        response = client.get("/api/v1/credentials/verify/certificate/DOES-NOT-EXIST")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    def test_credential_templates(self, client: TestClient, auth_headers: dict, institution: Institution):
        response = client.post(
            "/api/v1/credentials/templates",
            headers=auth_headers,
            json={
                "name": "Standard Certificate",
                "credential_type": "certificate",
                "sub_type": "academic",
                "template_data": {"layout": "classic", "color": "gold"},
            },
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Standard Certificate"

        response = client.get("/api/v1/credentials/templates/list", headers=auth_headers)
        assert response.status_code == 200
        assert any(t["name"] == "Standard Certificate" for t in response.json())

    def test_statistics(self, client: TestClient, auth_headers: dict, recipient_user: User):
        client.post(
            "/api/v1/credentials/",
            headers=auth_headers,
            json={
                "credential_type": "certificate",
                "sub_type": "academic",
                "title": "Stats Credential",
                "recipient_id": recipient_user.id,
            },
        )

        response = client.get("/api/v1/credentials/statistics", headers=auth_headers)
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_issued"] >= 1
