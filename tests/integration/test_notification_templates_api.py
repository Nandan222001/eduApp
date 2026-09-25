"""Integration tests for the `notification_templates` router
(src/api/v1/notification_templates.py).

Covers institution-scoped notification templates: create, list (with
notification_type/channel/is_active filters), get, update, delete. This
router talks directly to the `NotificationTemplate` model with no service
layer, and every lookup/mutation is correctly scoped to
`institution_id == current_user.institution_id`.

`channel`/`notification_type` are plain `String` columns on the model (not
a SQLAlchemy `Enum`), so no bug-class-2 `.value`/enum-name mismatch applies
here; the schema-level `NotificationChannel` enum just validates the
request/response shape.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.user import User
from src.models.notification import NotificationTemplate
from src.utils.security import get_password_hash


@pytest.fixture
def other_institution(db_session) -> Institution:
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def other_admin_role(db_session):
    from src.models.role import Role
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_admin_headers(client, other_admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_admin_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _payload(**overrides):
    payload = {
        "name": "Assignment Due Soon",
        "notification_type": "assignment_reminder",
        "channel": "email",
        "subject_template": "Assignment due: {{title}}",
        "body_template": "Your assignment {{title}} is due on {{due_date}}.",
        "variables": ["title", "due_date"],
        "is_active": True,
    }
    payload.update(overrides)
    return payload


# ===========================================================================
# POST /notification-templates/
# ===========================================================================
class TestCreateTemplate:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/notification-templates/", json=_payload())
        assert response.status_code == 403

    def test_create_happy_path(self, client, auth_headers, institution):
        response = client.post("/api/v1/notification-templates/", json=_payload(), headers=auth_headers)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["name"] == "Assignment Due Soon"
        assert data["channel"] == "email"
        assert data["institution_id"] == institution.id
        assert data["is_active"] is True
        assert "id" in data

    def test_create_missing_required_field_422(self, client, auth_headers):
        payload = _payload()
        del payload["body_template"]
        response = client.post("/api/v1/notification-templates/", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_create_invalid_channel_422(self, client, auth_headers):
        response = client.post("/api/v1/notification-templates/", json=_payload(channel="fax"), headers=auth_headers)
        assert response.status_code == 422

    def test_create_defaults_is_active_true(self, client, auth_headers):
        payload = _payload()
        del payload["is_active"]
        response = client.post("/api/v1/notification-templates/", json=payload, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["is_active"] is True


# ===========================================================================
# GET /notification-templates/
# ===========================================================================
class TestListTemplates:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/notification-templates/")
        assert response.status_code == 403

    def test_list_scoped_to_institution(self, client, auth_headers, other_admin_headers):
        client.post("/api/v1/notification-templates/", json=_payload(name="Mine"), headers=auth_headers)
        client.post("/api/v1/notification-templates/", json=_payload(name="Theirs"), headers=other_admin_headers)

        response = client.get("/api/v1/notification-templates/", headers=auth_headers)
        assert response.status_code == 200
        names = {t["name"] for t in response.json()}
        assert "Mine" in names
        assert "Theirs" not in names

    def test_list_filter_by_notification_type(self, client, auth_headers):
        client.post("/api/v1/notification-templates/", json=_payload(name="TypeA", notification_type="type_a"), headers=auth_headers)
        client.post("/api/v1/notification-templates/", json=_payload(name="TypeB", notification_type="type_b"), headers=auth_headers)

        response = client.get("/api/v1/notification-templates/", params={"notification_type": "type_a"}, headers=auth_headers)
        assert response.status_code == 200
        names = {t["name"] for t in response.json()}
        assert "TypeA" in names
        assert "TypeB" not in names

    def test_list_filter_by_channel(self, client, auth_headers):
        client.post("/api/v1/notification-templates/", json=_payload(name="EmailOne", channel="email"), headers=auth_headers)
        client.post("/api/v1/notification-templates/", json=_payload(name="SmsOne", channel="sms"), headers=auth_headers)

        response = client.get("/api/v1/notification-templates/", params={"channel": "sms"}, headers=auth_headers)
        assert response.status_code == 200
        names = {t["name"] for t in response.json()}
        assert "SmsOne" in names
        assert "EmailOne" not in names

    def test_list_filter_by_is_active(self, client, auth_headers):
        active = client.post("/api/v1/notification-templates/", json=_payload(name="Active1"), headers=auth_headers).json()
        inactive = client.post("/api/v1/notification-templates/", json=_payload(name="Inactive1"), headers=auth_headers).json()
        client.put(f"/api/v1/notification-templates/{inactive['id']}", json={"is_active": False}, headers=auth_headers)

        response = client.get("/api/v1/notification-templates/", params={"is_active": False}, headers=auth_headers)
        assert response.status_code == 200
        names = {t["name"] for t in response.json()}
        assert "Inactive1" in names
        assert "Active1" not in names

    def test_list_pagination(self, client, auth_headers):
        response = client.get("/api/v1/notification-templates/", params={"skip": 0, "limit": 5}, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) <= 5

    def test_list_invalid_limit_422(self, client, auth_headers):
        response = client.get("/api/v1/notification-templates/", params={"limit": 0}, headers=auth_headers)
        assert response.status_code == 422


# ===========================================================================
# GET /notification-templates/{template_id}
# ===========================================================================
class TestGetTemplate:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/notification-templates/1")
        assert response.status_code == 403

    def test_get_404(self, client, auth_headers):
        response = client.get("/api/v1/notification-templates/999999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_happy_path(self, client, auth_headers):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Fetch Me"), headers=auth_headers).json()
        response = client.get(f"/api/v1/notification-templates/{created['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Fetch Me"

    def test_get_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Secret Template"), headers=auth_headers).json()
        response = client.get(f"/api/v1/notification-templates/{created['id']}", headers=other_admin_headers)
        assert response.status_code == 404


# ===========================================================================
# PUT /notification-templates/{template_id}
# ===========================================================================
class TestUpdateTemplate:
    def test_requires_auth(self, client):
        response = client.put("/api/v1/notification-templates/1", json={"name": "New"})
        assert response.status_code == 403

    def test_update_404(self, client, auth_headers):
        response = client.put("/api/v1/notification-templates/999999999", json={"name": "New"}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_happy_path(self, client, auth_headers, db_session):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Old Name"), headers=auth_headers).json()
        response = client.put(
            f"/api/v1/notification-templates/{created['id']}",
            json={"name": "New Name", "body_template": "Updated body"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"
        assert response.json()["body_template"] == "Updated body"

        db_session.expire_all()
        row = db_session.query(NotificationTemplate).filter(NotificationTemplate.id == created["id"]).first()
        assert row.name == "New Name"

    def test_update_partial_does_not_touch_other_fields(self, client, auth_headers):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Partial"), headers=auth_headers).json()
        response = client.put(
            f"/api/v1/notification-templates/{created['id']}",
            json={"is_active": False},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False
        assert data["name"] == "Partial"
        assert data["body_template"] == created["body_template"]

    def test_update_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Mine Only"), headers=auth_headers).json()
        response = client.put(
            f"/api/v1/notification-templates/{created['id']}",
            json={"name": "Hacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 404


# ===========================================================================
# DELETE /notification-templates/{template_id}
# ===========================================================================
class TestDeleteTemplate:
    def test_requires_auth(self, client):
        response = client.delete("/api/v1/notification-templates/1")
        assert response.status_code == 403

    def test_delete_404(self, client, auth_headers):
        response = client.delete("/api/v1/notification-templates/999999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_happy_path(self, client, auth_headers):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Delete Me"), headers=auth_headers).json()
        response = client.delete(f"/api/v1/notification-templates/{created['id']}", headers=auth_headers)
        assert response.status_code == 200

        follow_up = client.get(f"/api/v1/notification-templates/{created['id']}", headers=auth_headers)
        assert follow_up.status_code == 404

    def test_delete_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/notification-templates/", json=_payload(name="Not Yours"), headers=auth_headers).json()
        response = client.delete(f"/api/v1/notification-templates/{created['id']}", headers=other_admin_headers)
        assert response.status_code == 404
