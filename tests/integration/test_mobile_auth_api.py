"""Integration tests for the `mobile_auth` router (src/api/v1/mobile_auth.py).

Despite the router's name, this is NOT a login/registration router --
every one of its 11 endpoints is a self-service settings/device-management
endpoint for an already-authenticated mobile app user (biometric setup,
device registration, PIN setup/verify, sensitive-operation re-auth logging,
security settings, device list/trust/remove, auth-event history), and every
endpoint already correctly declared `Depends(get_current_user)` -- no
missing-auth bug here (unlike several other routers audited this session).

Bug found and fixed while writing this coverage:

1. **`metadata=`/`metadata_json` shadowing (bug class 1), 4 occurrences**
   -- `MobileAuthEvent`/`SensitiveOperationLog` map their JSON metadata
   column as `metadata_json = Column('metadata', JSON, ...)` (since
   `metadata` is reserved by SQLAlchemy's declarative `Base`), but
   `setup_biometric`, `setup_pin`, and `verify_sensitive_operation` (twice,
   once for the `SensitiveOperationLog` row and once for its `MobileAuthEvent`)
   all constructed the model with a raw `metadata=` kwarg. SQLAlchemy's
   default declarative `__init__` does a plain `setattr(self, k, v)` per
   kwarg, so this silently set an unmapped instance attribute that shadows
   the class-level `Base.metadata` for that instance -- it never touches
   the real `metadata_json`/`metadata` column, so the value was silently
   dropped and every affected row's `metadata` column stayed NULL instead
   of persisting `{"enabled": ...}` / the caller's `operation_details`
   dict. Fixed all 4 sites to `metadata_json=`.

Read `src/models/user_settings.py` (`UserSettings`, `UserDevice`) and
`src/models/mobile_auth.py` (`MobileAuthEvent`, `BiometricSession`,
`SensitiveOperationLog`, `PinAttempt`) field-by-field against every
constructor call in the router -- no other drift found. No
`func.count(...).filter()`, async/sync, or cross-tenant issues either:
every query is already scoped to `current_user.id`.
"""
import uuid

import pytest

from src.models.mobile_auth import MobileAuthEvent, SensitiveOperationLog
from src.models.user_settings import UserSettings, UserDevice


class TestBiometricSetup:
    def test_setup_biometric_enable(self, client, auth_headers, db_session, admin_user):
        response = client.post(
            "/api/v1/mobile-auth/biometric/setup",
            json={"enabled": True, "biometric_type": "face_id", "device_fingerprint": "fp-1"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["enabled"] is True
        assert data["biometric_type"] == "face_id"

        settings = db_session.query(UserSettings).filter(UserSettings.user_id == admin_user.id).first()
        assert settings is not None
        assert settings.biometric_enabled is True

        event = db_session.query(MobileAuthEvent).filter(
            MobileAuthEvent.user_id == admin_user.id,
            MobileAuthEvent.event_type == "biometric_setup",
        ).first()
        assert event is not None
        # Regression check for the metadata/metadata_json shadowing bug:
        # this must actually persist, not silently stay NULL.
        assert event.metadata_json == {"enabled": True}

    def test_setup_biometric_requires_auth(self, client):
        response = client.post(
            "/api/v1/mobile-auth/biometric/setup",
            json={"enabled": True, "biometric_type": "face_id"},
        )
        assert response.status_code == 403


class TestDeviceRegistration:
    def test_register_new_device(self, client, auth_headers, db_session, admin_user):
        fingerprint = f"fp-{uuid.uuid4().hex[:12]}"
        response = client.post(
            "/api/v1/mobile-auth/device/register",
            json={
                "device_name": "iPhone 15",
                "device_type": "ios",
                "device_fingerprint": fingerprint,
                "device_model": "iPhone15,2",
                "os_version": "17.0",
                "app_version": "1.0.0",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["is_new"] is True
        assert data["is_trusted"] is False

        device = db_session.query(UserDevice).filter(UserDevice.id == data["device_id"]).first()
        assert device is not None
        assert device.user_id == admin_user.id
        assert device.device_fingerprint == fingerprint

    def test_register_existing_device_updates(self, client, auth_headers):
        fingerprint = f"fp-{uuid.uuid4().hex[:12]}"
        first = client.post(
            "/api/v1/mobile-auth/device/register",
            json={
                "device_name": "iPhone 15",
                "device_type": "ios",
                "device_fingerprint": fingerprint,
            },
            headers=auth_headers,
        )
        device_id = first.json()["device_id"]

        second = client.post(
            "/api/v1/mobile-auth/device/register",
            json={
                "device_name": "iPhone 15 Pro",
                "device_type": "ios",
                "device_fingerprint": fingerprint,
            },
            headers=auth_headers,
        )
        assert second.status_code == 200
        data = second.json()
        assert data["is_new"] is False
        assert data["device_id"] == device_id

    def test_register_device_requires_auth(self, client):
        response = client.post(
            "/api/v1/mobile-auth/device/register",
            json={"device_name": "x", "device_type": "ios", "device_fingerprint": "y"},
        )
        assert response.status_code == 403


class TestPinSetupAndVerify:
    def test_setup_and_verify_pin(self, client, auth_headers):
        setup_response = client.post(
            "/api/v1/mobile-auth/pin/setup",
            json={"pin": "1234", "enabled": True},
            headers=auth_headers,
        )
        assert setup_response.status_code == 200, setup_response.text

        verify_response = client.post(
            "/api/v1/mobile-auth/pin/verify",
            json={"pin": "1234"},
            headers=auth_headers,
        )
        assert verify_response.status_code == 200, verify_response.text
        assert verify_response.json()["message"] == "PIN verified successfully"

    def test_verify_wrong_pin_fails(self, client, auth_headers):
        client.post(
            "/api/v1/mobile-auth/pin/setup",
            json={"pin": "1234", "enabled": True},
            headers=auth_headers,
        )
        response = client.post(
            "/api/v1/mobile-auth/pin/verify",
            json={"pin": "9999"},
            headers=auth_headers,
        )
        assert response.status_code == 401

    def test_verify_pin_not_set_up(self, client, auth_headers):
        response = client.post(
            "/api/v1/mobile-auth/pin/verify",
            json={"pin": "1234"},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_pin_setup_persists_metadata(self, client, auth_headers, db_session, admin_user):
        client.post(
            "/api/v1/mobile-auth/pin/setup",
            json={"pin": "1234", "enabled": True},
            headers=auth_headers,
        )
        event = db_session.query(MobileAuthEvent).filter(
            MobileAuthEvent.user_id == admin_user.id,
            MobileAuthEvent.event_type == "pin_setup",
        ).first()
        assert event is not None
        assert event.metadata_json == {"enabled": True}

    def test_pin_setup_requires_auth(self, client):
        response = client.post(
            "/api/v1/mobile-auth/pin/setup",
            json={"pin": "1234", "enabled": True},
        )
        assert response.status_code == 403


class TestSensitiveOperation:
    def test_verify_sensitive_operation_persists_metadata(self, client, auth_headers, db_session, admin_user):
        response = client.post(
            "/api/v1/mobile-auth/sensitive-operation/verify",
            json={
                "operation_type": "password_change",
                "operation_details": "changing password",
                "auth_method": "biometric",
                "auth_success": True,
                "metadata": {"source": "settings_page"},
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text

        log_entry = db_session.query(SensitiveOperationLog).filter(
            SensitiveOperationLog.user_id == admin_user.id,
            SensitiveOperationLog.operation_type == "password_change",
        ).first()
        assert log_entry is not None
        # Regression check for the metadata/metadata_json shadowing bug.
        assert log_entry.metadata_json == {"source": "settings_page"}

        event = db_session.query(MobileAuthEvent).filter(
            MobileAuthEvent.user_id == admin_user.id,
            MobileAuthEvent.event_type == "sensitive_operation",
        ).first()
        assert event is not None
        assert event.metadata_json == {
            "operation_type": "password_change",
            "operation_details": "changing password",
        }

    def test_sensitive_operation_requires_auth(self, client):
        response = client.post(
            "/api/v1/mobile-auth/sensitive-operation/verify",
            json={
                "operation_type": "password_change",
                "auth_method": "biometric",
                "auth_success": True,
            },
        )
        assert response.status_code == 403


class TestSecuritySettings:
    def test_get_default_security_settings(self, client, auth_headers):
        response = client.get(
            "/api/v1/mobile-auth/security-settings",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["biometric_enabled"] is False
        assert data["pin_enabled"] is False

    def test_update_security_settings(self, client, auth_headers):
        response = client.put(
            "/api/v1/mobile-auth/security-settings",
            json={"session_timeout_minutes": 60, "auto_lock_minutes": 10},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["session_timeout_minutes"] == 60
        assert data["auto_lock_minutes"] == 10

    def test_security_settings_requires_auth(self, client):
        response = client.get("/api/v1/mobile-auth/security-settings")
        assert response.status_code == 403


class TestDevices:
    def test_list_devices(self, client, auth_headers):
        client.post(
            "/api/v1/mobile-auth/device/register",
            json={
                "device_name": "iPhone 15",
                "device_type": "ios",
                "device_fingerprint": f"fp-{uuid.uuid4().hex[:12]}",
            },
            headers=auth_headers,
        )
        response = client.get("/api/v1/mobile-auth/devices", headers=auth_headers)
        assert response.status_code == 200, response.text
        assert len(response.json()) == 1

    def test_trust_and_remove_device(self, client, auth_headers):
        register_response = client.post(
            "/api/v1/mobile-auth/device/register",
            json={
                "device_name": "iPhone 15",
                "device_type": "ios",
                "device_fingerprint": f"fp-{uuid.uuid4().hex[:12]}",
            },
            headers=auth_headers,
        )
        device_id = register_response.json()["device_id"]

        trust_response = client.post(
            f"/api/v1/mobile-auth/devices/{device_id}/trust",
            headers=auth_headers,
        )
        assert trust_response.status_code == 200, trust_response.text

        list_response = client.get("/api/v1/mobile-auth/devices", headers=auth_headers)
        assert list_response.json()[0]["is_trusted"] is True

        remove_response = client.delete(
            f"/api/v1/mobile-auth/devices/{device_id}",
            headers=auth_headers,
        )
        assert remove_response.status_code == 200

        list_after_response = client.get("/api/v1/mobile-auth/devices", headers=auth_headers)
        assert list_after_response.json() == []

    def test_trust_unknown_device_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/mobile-auth/devices/999999/trust",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_remove_unknown_device_404(self, client, auth_headers):
        response = client.delete(
            "/api/v1/mobile-auth/devices/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_devices_requires_auth(self, client):
        response = client.get("/api/v1/mobile-auth/devices")
        assert response.status_code == 403


class TestAuthEvents:
    def test_list_auth_events(self, client, auth_headers):
        client.post(
            "/api/v1/mobile-auth/biometric/setup",
            json={"enabled": True, "biometric_type": "face_id"},
            headers=auth_headers,
        )
        response = client.get("/api/v1/mobile-auth/auth-events", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) == 1
        assert data[0]["event_type"] == "biometric_setup"

    def test_auth_events_requires_auth(self, client):
        response = client.get("/api/v1/mobile-auth/auth-events")
        assert response.status_code == 403
