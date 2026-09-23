"""Integration tests for the `announcements` router (src/api/v1/announcements.py).

Covers institution-scoped announcements: create, list (with is_published
filter), "my announcements" (audience-matched, published-only), get by id,
update (only while unpublished), delete (only while unpublished), and
publish.

`AnnouncementService` scopes every lookup/mutation by
`institution_id == current_user.institution_id`, so cross-institution 404s
are exercised throughout. `publish_announcement`'s `_broadcast_announcement`
step creates a real `Notification` row per target user via
`NotificationService.create_notification` (no Celery `.delay()`/redis
involved), so publishing with an `all` audience is exercised directly
rather than mocked.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.user import User
from src.models.notification import Announcement
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures: a second institution + admin for cross-institution checks.
# ---------------------------------------------------------------------------
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


@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_payload(**overrides):
    payload = {
        "title": "System Maintenance",
        "content": "The portal will be down for maintenance tonight.",
        "audience_type": "all",
        "priority": "medium",
        "channels": ["in_app"],
    }
    payload.update(overrides)
    return payload


# ===========================================================================
# POST /announcements/
# ===========================================================================
class TestCreateAnnouncement:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/announcements/", json=_create_payload())
        assert response.status_code == 403

    def test_create_happy_path(self, client, auth_headers, admin_user, institution):
        response = client.post("/api/v1/announcements/", json=_create_payload(), headers=auth_headers)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["title"] == "System Maintenance"
        assert data["institution_id"] == institution.id
        assert data["created_by"] == admin_user.id
        assert data["is_published"] is False
        assert data["published_at"] is None

    def test_create_missing_required_field_422(self, client, auth_headers):
        payload = _create_payload()
        del payload["title"]
        response = client.post("/api/v1/announcements/", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_create_invalid_audience_type_422(self, client, auth_headers):
        response = client.post("/api/v1/announcements/", json=_create_payload(audience_type="bogus"), headers=auth_headers)
        assert response.status_code == 422

    def test_create_invalid_channel_422(self, client, auth_headers):
        response = client.post("/api/v1/announcements/", json=_create_payload(channels=["carrier_pigeon"]), headers=auth_headers)
        assert response.status_code == 422

    def test_create_with_audience_filter_and_attachments(self, client, auth_headers):
        payload = _create_payload(
            audience_type="role",
            audience_filter={"role_ids": [1, 2]},
            attachments=[{"name": "doc.pdf", "url": "https://example.com/doc.pdf"}],
        )
        response = client.post("/api/v1/announcements/", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["audience_filter"] == {"role_ids": [1, 2]}
        assert data["attachments"] == [{"name": "doc.pdf", "url": "https://example.com/doc.pdf"}]


# ===========================================================================
# GET /announcements/
# ===========================================================================
class TestListAnnouncements:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/announcements/")
        assert response.status_code == 403

    def test_list_returns_institution_scoped_announcements(self, client, auth_headers, other_admin_headers):
        client.post("/api/v1/announcements/", json=_create_payload(title="Mine"), headers=auth_headers)
        client.post("/api/v1/announcements/", json=_create_payload(title="Theirs"), headers=other_admin_headers)

        response = client.get("/api/v1/announcements/", headers=auth_headers)
        assert response.status_code == 200
        titles = {a["title"] for a in response.json()}
        assert "Mine" in titles
        assert "Theirs" not in titles

    def test_list_is_published_filter(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="ToPublish"), headers=auth_headers).json()
        client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)
        client.post("/api/v1/announcements/", json=_create_payload(title="Draft"), headers=auth_headers)

        published = client.get("/api/v1/announcements/", params={"is_published": True}, headers=auth_headers).json()
        assert any(a["title"] == "ToPublish" for a in published)
        assert all(a["is_published"] for a in published)

        drafts = client.get("/api/v1/announcements/", params={"is_published": False}, headers=auth_headers).json()
        assert any(a["title"] == "Draft" for a in drafts)
        assert all(not a["is_published"] for a in drafts)

    def test_list_pagination(self, client, auth_headers):
        response = client.get("/api/v1/announcements/", params={"skip": 0, "limit": 5}, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) <= 5

    def test_list_invalid_limit_422(self, client, auth_headers):
        response = client.get("/api/v1/announcements/", params={"limit": 0}, headers=auth_headers)
        assert response.status_code == 422


# ===========================================================================
# GET /announcements/my-announcements
# ===========================================================================
class TestMyAnnouncements:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/announcements/my-announcements")
        assert response.status_code == 403

    def test_only_published_and_audience_matched_shown(self, client, auth_headers, teacher_headers):
        # Unpublished -- should not show.
        client.post("/api/v1/announcements/", json=_create_payload(title="Unpublished"), headers=auth_headers)

        # Published, audience "all" -- should show to the teacher.
        published = client.post("/api/v1/announcements/", json=_create_payload(title="Published All"), headers=auth_headers).json()
        client.post(f"/api/v1/announcements/{published['id']}/publish", headers=auth_headers)

        response = client.get("/api/v1/announcements/my-announcements", headers=teacher_headers)
        assert response.status_code == 200
        titles = {a["title"] for a in response.json()}
        assert "Published All" in titles
        assert "Unpublished" not in titles

    def test_role_audience_filters_correctly(self, client, auth_headers, teacher_headers, teacher_user):
        # Audience restricted to a role_id the teacher does NOT have.
        payload = _create_payload(title="Wrong Role", audience_type="role", audience_filter={"role_ids": [999999]})
        created = client.post("/api/v1/announcements/", json=payload, headers=auth_headers).json()
        client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)

        response = client.get("/api/v1/announcements/my-announcements", headers=teacher_headers)
        assert response.status_code == 200
        assert all(a["title"] != "Wrong Role" for a in response.json())

        # Now scope it to the teacher's actual role_id -- should show.
        payload2 = _create_payload(title="Right Role", audience_type="role", audience_filter={"role_ids": [teacher_user.role_id]})
        created2 = client.post("/api/v1/announcements/", json=payload2, headers=auth_headers).json()
        client.post(f"/api/v1/announcements/{created2['id']}/publish", headers=auth_headers)

        response2 = client.get("/api/v1/announcements/my-announcements", headers=teacher_headers)
        assert any(a["title"] == "Right Role" for a in response2.json())


# ===========================================================================
# GET /announcements/{announcement_id}
# ===========================================================================
class TestGetAnnouncement:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/announcements/1")
        assert response.status_code == 403

    def test_get_404(self, client, auth_headers):
        response = client.get("/api/v1/announcements/999999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_happy_path(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Fetch Me"), headers=auth_headers).json()
        response = client.get(f"/api/v1/announcements/{created['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Fetch Me"

    def test_get_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Secret"), headers=auth_headers).json()
        response = client.get(f"/api/v1/announcements/{created['id']}", headers=other_admin_headers)
        assert response.status_code == 404


# ===========================================================================
# PUT /announcements/{announcement_id}
# ===========================================================================
class TestUpdateAnnouncement:
    def test_requires_auth(self, client):
        response = client.put("/api/v1/announcements/1", json={"title": "New"})
        assert response.status_code == 403

    def test_update_404(self, client, auth_headers):
        response = client.put("/api/v1/announcements/999999999", json={"title": "New"}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_happy_path(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Old Title"), headers=auth_headers).json()
        response = client.put(
            f"/api/v1/announcements/{created['id']}",
            json={"title": "New Title", "priority": "high"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "New Title"
        assert response.json()["priority"] == "high"

    def test_update_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Mine Only"), headers=auth_headers).json()
        response = client.put(
            f"/api/v1/announcements/{created['id']}",
            json={"title": "Hacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 404

    def test_update_after_publish_blocked(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="To Publish"), headers=auth_headers).json()
        client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)

        response = client.put(
            f"/api/v1/announcements/{created['id']}",
            json={"title": "Should Fail"},
            headers=auth_headers,
        )
        assert response.status_code == 404
        assert "already published" in response.json()["detail"].lower()


# ===========================================================================
# DELETE /announcements/{announcement_id}
# ===========================================================================
class TestDeleteAnnouncement:
    def test_requires_auth(self, client):
        response = client.delete("/api/v1/announcements/1")
        assert response.status_code == 403

    def test_delete_404(self, client, auth_headers):
        response = client.delete("/api/v1/announcements/999999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_happy_path(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Delete Me"), headers=auth_headers).json()
        response = client.delete(f"/api/v1/announcements/{created['id']}", headers=auth_headers)
        assert response.status_code == 200

        follow_up = client.get(f"/api/v1/announcements/{created['id']}", headers=auth_headers)
        assert follow_up.status_code == 404

    def test_delete_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Not Yours"), headers=auth_headers).json()
        response = client.delete(f"/api/v1/announcements/{created['id']}", headers=other_admin_headers)
        assert response.status_code == 404

    def test_delete_after_publish_blocked(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Published Delete"), headers=auth_headers).json()
        client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)

        response = client.delete(f"/api/v1/announcements/{created['id']}", headers=auth_headers)
        assert response.status_code == 404


# ===========================================================================
# POST /announcements/{announcement_id}/publish
# ===========================================================================
class TestPublishAnnouncement:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/announcements/1/publish")
        assert response.status_code == 403

    def test_publish_404(self, client, auth_headers):
        response = client.post("/api/v1/announcements/999999999/publish", headers=auth_headers)
        assert response.status_code == 404

    def test_publish_happy_path(self, client, auth_headers, db_session):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Go Live"), headers=auth_headers).json()
        response = client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_published"] is True
        assert data["published_at"] is not None

        db_session.expire_all()
        row = db_session.query(Announcement).filter(Announcement.id == created["id"]).first()
        assert row.is_published is True

    def test_publish_idempotent(self, client, auth_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Idempotent"), headers=auth_headers).json()
        first = client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)
        second = client.post(f"/api/v1/announcements/{created['id']}/publish", headers=auth_headers)
        assert first.status_code == 200
        assert second.status_code == 200
        assert second.json()["is_published"] is True

    def test_publish_cross_institution_404(self, client, auth_headers, other_admin_headers):
        created = client.post("/api/v1/announcements/", json=_create_payload(title="Cross Publish"), headers=auth_headers).json()
        response = client.post(f"/api/v1/announcements/{created['id']}/publish", headers=other_admin_headers)
        assert response.status_code == 404
