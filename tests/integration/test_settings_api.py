import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.user_settings import UserSettings, UserDevice, AccountDeletionRequest
from src.utils.security import get_password_hash


@pytest.mark.integration
class TestSettingsAPI:
    """Integration tests for /api/v1/settings/* and /api/v1/profile/*.

    Found and fixed one real bug while building this coverage (see
    src/api/v1/settings.py for the inline note):

    - `POST /settings/devices/{device_id}/logout` typed `device_id` as a
      plain `str` path param and called `int(device_id)` on it -- any
      non-numeric device_id raised an unhandled `ValueError` (500) instead
      of FastAPI's normal clean 422 for a bad path param. Fixed by typing
      the path param itself as `int`.
    """

    # ---- GET/PUT /settings ----

    def test_get_settings_requires_auth(self, client: TestClient):
        response = client.get("/api/v1/settings")
        assert response.status_code == 403

    def test_get_settings_creates_defaults_on_first_access(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session
    ):
        assert (
            db_session.query(UserSettings)
            .filter(UserSettings.user_id == admin_user.id)
            .first()
            is None
        )

        response = client.get("/api/v1/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["theme"]["mode"] == "auto"
        assert data["language"] == "en"
        assert data["timezone"] == "UTC"
        assert data["notifications"]["message_received"]["email"] is True
        assert data["privacy"]["profile_public"] is True

        settings_row = (
            db_session.query(UserSettings)
            .filter(UserSettings.user_id == admin_user.id)
            .first()
        )
        assert settings_row is not None

    def test_update_settings_full_payload(self, client: TestClient, auth_headers: dict):
        payload = {
            "notifications": {
                "assignment_created": {"email": False, "push": True, "sms": False, "in_app": True},
                "assignment_graded": {"email": True, "push": True, "sms": False, "in_app": True},
                "exam_scheduled": {"email": True, "push": True, "sms": False, "in_app": True},
                "exam_result_published": {"email": True, "push": True, "sms": False, "in_app": True},
                "announcement_posted": {"email": True, "push": True, "sms": False, "in_app": True},
                "message_received": {"email": True, "push": True, "sms": False, "in_app": True},
                "goal_achieved": {"email": True, "push": True, "sms": False, "in_app": True},
                "badge_earned": {"email": True, "push": True, "sms": False, "in_app": True},
                "attendance_marked": {"email": True, "push": True, "sms": False, "in_app": True},
                "fee_due": {"email": True, "push": True, "sms": False, "in_app": True},
                "material_shared": {"email": True, "push": True, "sms": False, "in_app": True},
                "doubt_answered": {"email": True, "push": True, "sms": False, "in_app": True},
            },
            "theme": {"mode": "dark", "primary_color": "#112233", "font_size": "large", "compact_mode": True},
            "privacy": {
                "profile_public": False,
                "show_in_leaderboard": False,
                "show_email": True,
                "show_phone": True,
                "allow_messages": False,
                "show_online_status": False,
            },
            "language": "fr",
            "timezone": "Asia/Kolkata",
        }
        response = client.put("/api/v1/settings", headers=auth_headers, json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["theme"]["mode"] == "dark"
        assert data["theme"]["compact_mode"] is True
        assert data["privacy"]["profile_public"] is False
        assert data["language"] == "fr"
        assert data["timezone"] == "Asia/Kolkata"
        assert data["notifications"]["assignment_created"]["email"] is False

    def test_update_settings_invalid_theme_mode_validation_error(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.put(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": {"mode": "neon", "font_size": "medium", "compact_mode": False}},
        )
        assert response.status_code == 422

    # ---- notifications sub-resource ----

    def test_get_and_update_notification_preferences(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.get("/api/v1/settings/notifications", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message_received"]["email"] is True

        payload = response.json()
        payload["message_received"]["email"] = False
        response = client.put(
            "/api/v1/settings/notifications", headers=auth_headers, json=payload
        )
        assert response.status_code == 200
        assert response.json()["message_received"]["email"] is False

        response = client.get("/api/v1/settings/notifications", headers=auth_headers)
        assert response.json()["message_received"]["email"] is False

    # ---- theme sub-resource ----

    def test_get_and_update_theme_settings(self, client: TestClient, auth_headers: dict):
        response = client.put(
            "/api/v1/settings/theme",
            headers=auth_headers,
            json={"mode": "light", "font_size": "small", "compact_mode": True},
        )
        assert response.status_code == 200
        assert response.json()["mode"] == "light"

        response = client.get("/api/v1/settings/theme", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["mode"] == "light"
        assert response.json()["font_size"] == "small"

    def test_update_theme_invalid_font_size_validation_error(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.put(
            "/api/v1/settings/theme",
            headers=auth_headers,
            json={"mode": "light", "font_size": "huge", "compact_mode": False},
        )
        assert response.status_code == 422

    # ---- privacy sub-resource ----

    def test_get_and_update_privacy_settings(self, client: TestClient, auth_headers: dict):
        response = client.put(
            "/api/v1/settings/privacy",
            headers=auth_headers,
            json={
                "profile_public": False,
                "show_in_leaderboard": False,
                "show_email": True,
                "show_phone": False,
                "allow_messages": True,
                "show_online_status": False,
            },
        )
        assert response.status_code == 200
        assert response.json()["profile_public"] is False

        response = client.get("/api/v1/settings/privacy", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["show_email"] is True

    # ---- avatar ----

    def test_upload_avatar_happy_path(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/profile/avatar",
            headers=auth_headers,
            files={"file": ("avatar.png", b"fake-image-bytes", "image/png")},
        )
        assert response.status_code == 200
        assert "avatarUrl" in response.json()

    def test_upload_avatar_invalid_content_type_rejected(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/profile/avatar",
            headers=auth_headers,
            files={"file": ("notes.txt", b"hello", "text/plain")},
        )
        assert response.status_code == 400

    def test_delete_avatar(self, client: TestClient, auth_headers: dict):
        response = client.delete("/api/v1/profile/avatar", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Avatar deleted successfully"

    # ---- change password ----

    def test_change_password_happy_path(
        self, client: TestClient, auth_headers: dict, admin_user: User
    ):
        response = client.post(
            "/api/v1/profile/change-password",
            headers=auth_headers,
            json={
                "current_password": "password123",
                "new_password": "newpassword456",
                "confirm_password": "newpassword456",
            },
        )
        assert response.status_code == 200

        # New password now works for a fresh login.
        login = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "newpassword456"},
        )
        assert login.status_code == 200

    def test_change_password_wrong_current_password(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/profile/change-password",
            headers=auth_headers,
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword456",
                "confirm_password": "newpassword456",
            },
        )
        assert response.status_code == 400

    def test_change_password_mismatched_confirmation(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/profile/change-password",
            headers=auth_headers,
            json={
                "current_password": "password123",
                "new_password": "newpassword456",
                "confirm_password": "somethingelse789",
            },
        )
        assert response.status_code == 400

    def test_change_password_too_short_validation_error(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/profile/change-password",
            headers=auth_headers,
            json={
                "current_password": "password123",
                "new_password": "short",
                "confirm_password": "short",
            },
        )
        assert response.status_code == 422

    # ---- connected devices ----

    def test_get_connected_devices(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session
    ):
        device = UserDevice(
            user_id=admin_user.id,
            device_name="Chrome on Mac",
            device_type="desktop",
            browser="Chrome",
            os="macOS",
            ip_address="127.0.0.1",
            is_current=True,
        )
        db_session.add(device)
        db_session.commit()

        response = client.get("/api/v1/settings/devices", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["device_name"] == "Chrome on Mac"
        assert data[0]["is_current"] is True

    def test_logout_device_happy_path(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session
    ):
        device = UserDevice(
            user_id=admin_user.id,
            device_name="Old Phone",
            device_type="mobile",
            ip_address="127.0.0.1",
            is_current=False,
        )
        db_session.add(device)
        db_session.commit()
        db_session.refresh(device)

        response = client.post(
            f"/api/v1/settings/devices/{device.id}/logout", headers=auth_headers
        )
        assert response.status_code == 200
        assert (
            db_session.query(UserDevice).filter(UserDevice.id == device.id).first() is None
        )

    def test_logout_device_not_found(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/settings/devices/999999/logout", headers=auth_headers
        )
        assert response.status_code == 404

    def test_logout_device_non_numeric_id_returns_422_not_500(
        self, client: TestClient, auth_headers: dict
    ):
        # Regression test for the int(device_id) crash bug fixed above.
        response = client.post(
            "/api/v1/settings/devices/not-a-number/logout", headers=auth_headers
        )
        assert response.status_code == 422

    def test_logout_current_device_rejected(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session
    ):
        device = UserDevice(
            user_id=admin_user.id,
            device_name="This Device",
            device_type="desktop",
            ip_address="127.0.0.1",
            is_current=True,
        )
        db_session.add(device)
        db_session.commit()
        db_session.refresh(device)

        response = client.post(
            f"/api/v1/settings/devices/{device.id}/logout", headers=auth_headers
        )
        assert response.status_code == 400

    def test_logout_device_cross_user_not_found(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        teacher_role: Role,
        db_session: Session,
    ):
        other_user = User(
            username="dev_owner",
            email="dev_owner@testschool.com",
            first_name="Dev",
            last_name="Owner",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=teacher_role.id,
            is_active=True,
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        device = UserDevice(
            user_id=other_user.id,
            device_name="Someone Else's Phone",
            device_type="mobile",
            ip_address="127.0.0.1",
            is_current=False,
        )
        db_session.add(device)
        db_session.commit()
        db_session.refresh(device)

        # admin (auth_headers) must not be able to log out another user's device.
        response = client.post(
            f"/api/v1/settings/devices/{device.id}/logout", headers=auth_headers
        )
        assert response.status_code == 404

    def test_logout_all_devices(
        self, client: TestClient, auth_headers: dict, admin_user: User, db_session: Session
    ):
        current = UserDevice(
            user_id=admin_user.id,
            device_name="Current",
            device_type="desktop",
            ip_address="127.0.0.1",
            is_current=True,
        )
        other1 = UserDevice(
            user_id=admin_user.id,
            device_name="Other 1",
            device_type="mobile",
            ip_address="127.0.0.1",
            is_current=False,
        )
        other2 = UserDevice(
            user_id=admin_user.id,
            device_name="Other 2",
            device_type="tablet",
            ip_address="127.0.0.1",
            is_current=False,
        )
        db_session.add_all([current, other1, other2])
        db_session.commit()

        response = client.post(
            "/api/v1/settings/devices/logout-all", headers=auth_headers
        )
        assert response.status_code == 200

        remaining = (
            db_session.query(UserDevice)
            .filter(UserDevice.user_id == admin_user.id)
            .all()
        )
        assert len(remaining) == 1
        assert remaining[0].is_current is True

    # ---- account deletion ----

    def test_request_account_deletion_happy_path(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/settings/delete-account",
            headers=auth_headers,
            json={"reason": "No longer needed", "feedback": "Great app", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data

    def test_request_account_deletion_wrong_password(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/settings/delete-account",
            headers=auth_headers,
            json={"reason": "No longer needed", "password": "wrongpassword"},
        )
        assert response.status_code == 400

    def test_request_account_deletion_duplicate_pending_rejected(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/settings/delete-account",
            headers=auth_headers,
            json={"reason": "First reason", "password": "password123"},
        )
        assert response.status_code == 200

        response = client.post(
            "/api/v1/settings/delete-account",
            headers=auth_headers,
            json={"reason": "Second reason", "password": "password123"},
        )
        assert response.status_code == 400

    def test_cancel_account_deletion_happy_path(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/settings/delete-account",
            headers=auth_headers,
            json={"reason": "Testing cancel", "password": "password123"},
        )
        assert response.status_code == 200

        response = client.post(
            "/api/v1/settings/cancel-deletion", headers=auth_headers
        )
        assert response.status_code == 200

        # A new deletion request can be made again after cancelling.
        response = client.post(
            "/api/v1/settings/delete-account",
            headers=auth_headers,
            json={"reason": "New request", "password": "password123"},
        )
        assert response.status_code == 200

    def test_cancel_account_deletion_no_pending_request_404(
        self, client: TestClient, auth_headers: dict
    ):
        response = client.post(
            "/api/v1/settings/cancel-deletion", headers=auth_headers
        )
        assert response.status_code == 404
