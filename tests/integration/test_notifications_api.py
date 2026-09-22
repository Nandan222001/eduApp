import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.user import User
from src.models.notification import Notification, NotificationChannel


@pytest.fixture
def notification(db_session: Session, institution: Institution, admin_user: User) -> Notification:
    notif = Notification(
        institution_id=institution.id,
        user_id=admin_user.id,
        title="Assignment Due Soon",
        message="Your assignment is due tomorrow.",
        notification_type="assignment_reminder",
        channel=NotificationChannel.IN_APP.value,
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)
    return notif


@pytest.mark.integration
class TestNotificationsAPI:
    """Integration tests for /api/v1/notifications/*, an established,
    pre-existing router (src/api/v1/notifications.py) backed by
    src/services/notification_service.py -- one of the ~95 registered
    backend routers picked up as part of the broader Phase-2/3 backend
    route-module audit (see TESTING_PROGRESS.md). There is no
    create-notification-via-API endpoint in this router (notifications
    are created by other services/Celery tasks), so the `notification`
    fixture inserts a row directly. /bulk and /digest/send dispatch real
    Celery tasks (`.delay(...)`) with no eager-mode broker in this test
    environment, so aren't exercised end-to-end here, matching the
    established skip pattern for Celery-backed endpoints elsewhere."""

    def test_list_and_get_notification(
        self, client: TestClient, auth_headers: dict, notification: Notification
    ):
        response = client.get("/api/v1/notifications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(n["id"] == notification.id for n in data)

        response = client.get(f"/api/v1/notifications/{notification.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Assignment Due Soon"

    def test_get_nonexistent_notification(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/notifications/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_mark_notification_read_and_stats(
        self, client: TestClient, auth_headers: dict, notification: Notification
    ):
        response = client.get("/api/v1/notifications/stats", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

        response = client.patch(f"/api/v1/notifications/{notification.id}/read", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "read"

    def test_mark_all_read_and_delete(
        self, client: TestClient, auth_headers: dict, notification: Notification
    ):
        response = client.post("/api/v1/notifications/mark-all-read", headers=auth_headers)
        assert response.status_code == 200

        response = client.delete(f"/api/v1/notifications/{notification.id}", headers=auth_headers)
        assert response.status_code == 200

        response = client.get(f"/api/v1/notifications/{notification.id}", headers=auth_headers)
        assert response.status_code == 404

    def test_notification_preferences_get_and_update(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/notifications/preferences/me", headers=auth_headers)
        assert response.status_code == 200

        response = client.put(
            "/api/v1/notifications/preferences/me",
            headers=auth_headers,
            json={"email_enabled": False, "push_enabled": True},
        )
        assert response.status_code == 200
        assert response.json()["email_enabled"] is False

    def test_quiet_hours_and_dnd_and_digest_mode(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/notifications/preferences/quiet-hours",
            headers=auth_headers,
            params={"enabled": True, "start_time": "22:00", "end_time": "07:00"},
        )
        assert response.status_code == 200
        assert response.json()["quiet_hours_enabled"] is True

        response = client.post(
            "/api/v1/notifications/preferences/dnd", headers=auth_headers, params={"enabled": True}
        )
        assert response.status_code == 200
        assert response.json()["dnd_enabled"] is True

        response = client.post(
            "/api/v1/notifications/preferences/digest-mode",
            headers=auth_headers,
            params={"digest_mode": "daily"},
        )
        assert response.status_code == 200
        assert response.json()["digest_mode"] == "daily"

        # quiet_hours_start/end is 22:00-07:00 (crosses midnight); whether
        # "now" falls inside it depends on wall-clock time, so just assert
        # the endpoint runs and returns a boolean rather than pinning a
        # specific true/false outcome.
        response = client.get("/api/v1/notifications/test/quiet-hours", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json()["in_quiet_hours"], bool)

    def test_preview_notification(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/notifications/preview",
            headers=auth_headers,
            json={
                "title": "Assignment Due Soon",
                "message": "Your assignment is due tomorrow.",
                "notification_type": "assignment_reminder",
                "channel": "in_app",
                "priority": "medium",
            },
        )
        assert response.status_code == 200

    def test_device_register_list_and_unregister(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/notifications/register-device",
            headers=auth_headers,
            json={
                "token": "ExponentPushToken[test-token-123]",
                "platform": "ios",
                "device_name": "Test iPhone",
            },
        )
        assert response.status_code == 200
        assert response.json()["token"] == "ExponentPushToken[test-token-123]"

        response = client.get("/api/v1/notifications/devices", headers=auth_headers)
        assert response.status_code == 200
        assert any(d["token"] == "ExponentPushToken[test-token-123]" for d in response.json())

        response = client.delete(
            "/api/v1/notifications/register-device/ExponentPushToken[test-token-123]",
            headers=auth_headers,
        )
        assert response.status_code == 200

    def test_engagement_tracking(
        self, client: TestClient, auth_headers: dict, notification: Notification
    ):
        response = client.post(
            "/api/v1/notifications/engagement",
            headers=auth_headers,
            json={"notification_id": notification.id, "action": "opened"},
        )
        assert response.status_code == 200
        assert response.json()["action"] == "opened"
