"""Integration tests for the `live_events` router (src/api/v1/live_events.py),
registered at /api/v1/live-events. Covers live event CRUD, stream key/start/end
management, access control (public/parents-only/specific-grades + ticketed),
viewer join/leave tracking, chat + moderation rules, analytics, recording
upload/archive, and the ticket/revenue flow.

The separate websocket-only router (src/api/v1/live_events_websocket.py) is
out of scope here.

No real Redis/Celery is touched by this router. It does use FastAPI's own
`BackgroundTasks` (not Celery) for `setup_stream_platform` (on create) and
`process_recording` (on stream end, when auto_record is set) -- these open
their own `SessionLocal()` rather than using the request's injected `db`,
which is the right call architecturally (the injected session is already
closed by the time a BackgroundTask runs), but in this environment
`SessionLocal()`'s default credentials don't match test_db, so those two
background tasks fail to even query. That failure is caught and logged now
(see the bug list below) rather than propagating -- so exercising create/
end-stream here verifies the *response*, not that the platform integration
actually completed, matching the established pattern of not exercising
Celery-backed side effects end-to-end. YouTubeLiveService/VimeoLiveService
themselves need no such skip: with no YOUTUBE_API_KEY/VIMEO_ACCESS_TOKEN
configured, they cleanly return canned mock data instead of making a real
network call, so `generate_stream_key`/`start_stream`/`end_stream` are fully
exercised for real.

Found and fixed real bugs while building this coverage:
1. `join_event` (POST /{event_id}/viewers) built `EventViewer(live_event_id=
   event_id, user_id=..., **viewer_data.model_dump())`, but
   `EventViewerCreate` itself has a required `live_event_id` field, so the
   dict unpack ALSO contained `live_event_id` -> `TypeError: EventViewer()
   got multiple values for keyword argument 'live_event_id'` on every single
   call. Joining any live event as a viewer was 100% broken. Fixed by
   excluding `live_event_id` from the dump (the path parameter is the
   authoritative source, same as every sibling endpoint in this file).
2. `send_chat_message` (POST /{event_id}/chat) had the identical bug:
   `EventChatMessage(live_event_id=event_id, user_id=..., **message_data.
   model_dump())` where `EventChatMessageCreate` also has a required
   `live_event_id` field -> same `TypeError` on every call. Sending any
   chat message was 100% broken. Fixed the same way.
3. `StreamAnalyticsResponse` (src/schemas/live_event.py) was missing
   `model_config = ConfigDict(from_attributes=True)`. `get_event_analytics`
   constructs `EventAnalytics(stream_quality=<list of raw StreamAnalytics
   ORM rows>, ...)` directly (not via `.model_validate()`), and Pydantic v2
   only accepts attribute-based (non-dict, non-BaseModel) values for a
   nested model field when that field's own model opts in via
   `from_attributes=True`. Without it, `GET /{event_id}/analytics` raised
   `pydantic_core.ValidationError: Input should be a valid dictionary or
   instance of StreamAnalyticsResponse` for any event that actually had
   stream-quality snapshots recorded (empty list happened to slip through
   silently, which is why this was latent). Fixed by adding the config,
   matching every other ORM-backed response schema in this file.
4. `setup_stream_platform`/`process_recording` (the two BackgroundTasks
   helpers at the bottom of the router) had no try/except around their
   bodies. Starlette's `BackgroundTask.__call__` has no try/except of its
   own, so any exception raised inside them -- a real external-API failure
   in production, or simply this environment's SessionLocal() credential
   mismatch -- propagates straight through the ASGI response-sending
   pipeline *after* the response has already been handed to the client.
   Confirmed directly: this makes `TestClient.post(...)` itself raise the
   background task's exception rather than returning a response, which
   would 100% break every test that creates a live event or ends a stream
   with auto_record on -- and in real production it risks the same
   unhandled-exception noise/connection issues for a task that has nothing
   to do with the response already sent. Wrapped both bodies in
   try/except Exception with logger.exception(...).
"""
import uuid
from datetime import datetime, timedelta

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.student import Student
from src.models.academic import Grade, Section
from src.models.live_events import (
    LiveEvent,
    EventViewer,
    EventChatMessage,
    EventTicket,
    ChatModerationRule,
    StreamAnalytics,
)
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def live_event(db_session, institution, admin_user) -> LiveEvent:
    event = LiveEvent(
        institution_id=institution.id,
        created_by=admin_user.id,
        event_name="Founders Day Assembly",
        event_type="assembly",
        scheduled_start_time=datetime.utcnow() + timedelta(days=1),
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


# A second institution + admin, for cross-institution 403/404 checks.
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
def other_admin_role(db_session) -> Role:
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
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _event_payload(institution_id: int, **overrides) -> dict:
    payload = {
        "institution_id": institution_id,
        "event_name": "Annual Sports Day",
        "event_type": "sports_game",
        "description": "Live stream of the annual sports day.",
        "scheduled_start_time": (datetime.utcnow() + timedelta(days=2)).isoformat(),
    }
    payload.update(overrides)
    return payload


# ===========================================================================
# Live event CRUD
# ===========================================================================
@pytest.mark.integration
class TestLiveEventCRUD:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/live-events/")
        # FastAPI's HTTPBearer returns 403 (not 401) for a missing
        # Authorization header -- matches every other protected router here.
        assert response.status_code == 403

    def test_create_live_event(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/live-events/",
            headers=auth_headers,
            json=_event_payload(institution.id),
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["event_name"] == "Annual Sports Day"
        assert data["institution_id"] == institution.id
        assert data["status"] == "scheduled"
        assert data["stream_platform"] == "youtube"
        assert data["viewer_count"] == 0
        assert data["id"] is not None

    def test_create_live_event_cross_institution_forbidden(
        self, client, auth_headers, other_institution
    ):
        response = client.post(
            "/api/v1/live-events/",
            headers=auth_headers,
            json=_event_payload(other_institution.id),
        )
        assert response.status_code == 403

    def test_list_live_events(self, client, auth_headers, live_event):
        response = client.get("/api/v1/live-events/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["id"] == live_event.id for item in data["items"])

    def test_list_live_events_filters_by_event_type_and_status(
        self, client, auth_headers, live_event
    ):
        response = client.get(
            "/api/v1/live-events/",
            headers=auth_headers,
            params={"event_type": "assembly", "status": "scheduled"},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(item["id"] == live_event.id for item in data["items"])

        response = client.get(
            "/api/v1/live-events/",
            headers=auth_headers,
            params={"event_type": "concert"},
        )
        assert response.status_code == 200
        assert all(item["id"] != live_event.id for item in response.json()["items"])

    def test_list_live_events_does_not_leak_across_institutions(
        self, client, other_admin_headers, live_event
    ):
        response = client.get("/api/v1/live-events/", headers=other_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(item["id"] != live_event.id for item in data["items"])

    def test_get_live_event_with_details(self, client, auth_headers, live_event):
        response = client.get(f"/api/v1/live-events/{live_event.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == live_event.id
        assert data["current_viewer_count"] == 0
        assert data["total_messages"] == 0
        assert data["tickets_sold"] == 0
        assert data["revenue"] == 0

    def test_get_nonexistent_event_404(self, client, auth_headers):
        response = client.get("/api/v1/live-events/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_event_cross_institution_404(self, client, other_admin_headers, live_event):
        response = client.get(f"/api/v1/live-events/{live_event.id}", headers=other_admin_headers)
        assert response.status_code == 404

    def test_update_live_event(self, client, auth_headers, live_event):
        response = client.put(
            f"/api/v1/live-events/{live_event.id}",
            headers=auth_headers,
            json={"event_name": "Renamed Assembly", "chat_enabled": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["event_name"] == "Renamed Assembly"
        assert data["chat_enabled"] is False

    def test_update_nonexistent_event_404(self, client, auth_headers):
        response = client.put(
            "/api/v1/live-events/999999", headers=auth_headers, json={"event_name": "X"}
        )
        assert response.status_code == 404

    def test_update_event_cross_institution_404(self, client, other_admin_headers, live_event):
        response = client.put(
            f"/api/v1/live-events/{live_event.id}",
            headers=other_admin_headers,
            json={"event_name": "Hijacked"},
        )
        assert response.status_code == 404

    def test_delete_live_event(self, client, auth_headers, live_event):
        response = client.delete(f"/api/v1/live-events/{live_event.id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/live-events/{live_event.id}", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_nonexistent_event_404(self, client, auth_headers):
        response = client.delete("/api/v1/live-events/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_event_cross_institution_404(self, client, other_admin_headers, live_event):
        response = client.delete(f"/api/v1/live-events/{live_event.id}", headers=other_admin_headers)
        assert response.status_code == 404


# ===========================================================================
# Stream management
# ===========================================================================
@pytest.mark.integration
class TestStreamManagement:
    def test_generate_stream_key_youtube_mock(self, client, auth_headers, live_event):
        """No YOUTUBE_API_KEY configured in this environment, so
        YouTubeLiveService cleanly falls back to its mock broadcast instead
        of making a real network call -- fully exercised, nothing skipped."""
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/stream/generate-key", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["stream_key"]
        assert data["stream_url"]
        assert data["rtmp_url"]
        assert "OBS" in data["instructions"]

    def test_generate_stream_key_generic_platform(self, client, auth_headers, db_session, live_event):
        live_event.stream_platform = "agora"
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/stream/generate-key", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["stream_key"]
        assert data["rtmp_url"] is None

    def test_generate_stream_key_nonexistent_event_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/live-events/999999/stream/generate-key", headers=auth_headers
        )
        assert response.status_code == 404

    def test_start_and_end_stream(self, client, auth_headers, live_event):
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/stream/start", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "live"

        # Starting again while already live is rejected.
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/stream/start", headers=auth_headers
        )
        assert response.status_code == 400

        # Ending schedules process_recording as a BackgroundTask (auto_record
        # defaults to True) -- verifies the response itself is unaffected by
        # that background task's now-caught SessionLocal() failure.
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/stream/end", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ended"

    def test_start_stream_nonexistent_event_404(self, client, auth_headers):
        response = client.post("/api/v1/live-events/999999/stream/start", headers=auth_headers)
        assert response.status_code == 404

    def test_end_stream_sets_viewers_not_watching(
        self, client, auth_headers, db_session, live_event, admin_user
    ):
        viewer = EventViewer(live_event_id=live_event.id, user_id=admin_user.id, is_currently_watching=True)
        db_session.add(viewer)
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/stream/end", headers=auth_headers
        )
        assert response.status_code == 200

        db_session.refresh(viewer)
        assert viewer.is_currently_watching is False
        assert viewer.left_at is not None


# ===========================================================================
# Access control
# ===========================================================================
@pytest.mark.integration
class TestAccessControl:
    def test_public_event_has_access(self, client, auth_headers, live_event):
        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_access"] is True
        assert data["requires_ticket"] is False

    def test_parents_only_event_denies_non_student(self, client, auth_headers, db_session, live_event):
        live_event.restricted_access = "parents_only"
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_access"] is False
        assert data["reason"] == "Parents only"

    def test_parents_only_event_allows_student(
        self, client, student_headers, db_session, live_event, student
    ):
        live_event.restricted_access = "parents_only"
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=student_headers
        )
        assert response.status_code == 200
        assert response.json()["has_access"] is True

    def test_specific_grades_event_allowed_section(
        self, client, student_headers, db_session, live_event, student, section
    ):
        live_event.restricted_access = "specific_grades"
        live_event.allowed_section_ids = [section.id]
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=student_headers
        )
        assert response.status_code == 200
        assert response.json()["has_access"] is True

    def test_specific_grades_event_allowed_grade(
        self, client, student_headers, db_session, live_event, student, section, grade
    ):
        live_event.restricted_access = "specific_grades"
        live_event.allowed_grade_ids = [grade.id]
        live_event.allowed_section_ids = None
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=student_headers
        )
        assert response.status_code == 200
        assert response.json()["has_access"] is True

    def test_specific_grades_event_denies_unlisted_student(
        self, client, student_headers, db_session, live_event, student
    ):
        live_event.restricted_access = "specific_grades"
        live_event.allowed_section_ids = [999999]
        live_event.allowed_grade_ids = [999999]
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=student_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_access"] is False

    def test_specific_grades_event_denies_non_student(self, client, auth_headers, db_session, live_event):
        live_event.restricted_access = "specific_grades"
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_access"] is False
        assert data["reason"] == "Restricted to specific grades"

    def test_monetized_event_requires_ticket_then_grants_access(
        self, client, auth_headers, db_session, live_event, admin_user
    ):
        live_event.monetization_enabled = True
        live_event.ticket_price = 500
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_access"] is False
        assert data["requires_ticket"] is True
        assert data["ticket_price"] == 500

        ticket = EventTicket(
            live_event_id=live_event.id,
            user_id=admin_user.id,
            ticket_code="TKT-TEST-1",
            amount_paid=500,
            currency="INR",
            payment_status="completed",
        )
        db_session.add(ticket)
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/access-check", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["has_access"] is True

    def test_access_check_nonexistent_event_404(self, client, auth_headers):
        response = client.get("/api/v1/live-events/999999/access-check", headers=auth_headers)
        assert response.status_code == 404


# ===========================================================================
# Viewer management
# ===========================================================================
@pytest.mark.integration
class TestViewers:
    def test_join_event(self, client, auth_headers, live_event):
        """Regression test for bug #1: join_event used to raise TypeError
        (duplicate 'live_event_id' keyword) on every call."""
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "device_type": "mobile", "browser": "chrome"},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["live_event_id"] == live_event.id
        assert data["is_currently_watching"] is True
        assert data["device_type"] == "mobile"

    def test_join_event_twice_while_watching_returns_same_viewer(
        self, client, auth_headers, live_event
    ):
        first = client.post(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            json={"live_event_id": live_event.id},
        )
        second = client.post(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            json={"live_event_id": live_event.id},
        )
        assert first.status_code == 201
        assert second.status_code == 201
        assert first.json()["id"] == second.json()["id"]

    def test_join_event_updates_viewer_and_view_counts(
        self, client, auth_headers, db_session, live_event
    ):
        client.post(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            json={"live_event_id": live_event.id},
        )
        db_session.refresh(live_event)
        assert live_event.viewer_count == 1
        assert live_event.peak_viewer_count == 1
        assert live_event.total_views == 1

    def test_join_nonexistent_event_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/live-events/999999/viewers",
            headers=auth_headers,
            json={"live_event_id": 999999},
        )
        assert response.status_code == 404

    def test_update_viewer_session(self, client, auth_headers, live_event):
        join_response = client.post(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            json={"live_event_id": live_event.id},
        )
        viewer_id = join_response.json()["id"]

        response = client.put(
            f"/api/v1/live-events/{live_event.id}/viewers/{viewer_id}",
            headers=auth_headers,
            json={"is_currently_watching": False, "watch_duration": 120},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_currently_watching"] is False
        assert data["watch_duration"] == 120

    def test_update_nonexistent_viewer_404(self, client, auth_headers, live_event):
        response = client.put(
            f"/api/v1/live-events/{live_event.id}/viewers/999999",
            headers=auth_headers,
            json={"watch_duration": 10},
        )
        assert response.status_code == 404

    def test_list_event_viewers(self, client, auth_headers, live_event):
        client.post(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            json={"live_event_id": live_event.id},
        )

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/viewers", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["user_email"] is not None
        assert data[0]["user_name"]

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/viewers",
            headers=auth_headers,
            params={"currently_watching": False},
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_list_viewers_nonexistent_event_404(self, client, auth_headers):
        response = client.get("/api/v1/live-events/999999/viewers", headers=auth_headers)
        assert response.status_code == 404


# ===========================================================================
# Chat + moderation
# ===========================================================================
@pytest.mark.integration
class TestChat:
    def test_send_and_list_chat_messages(self, client, auth_headers, live_event):
        """Regression test for bug #2: send_chat_message used to raise
        TypeError (duplicate 'live_event_id' keyword) on every call."""
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "Hello everyone!"},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["message"] == "Hello everyone!"
        assert data["is_deleted"] is False
        assert data["is_flagged"] is False

        response = client.get(f"/api/v1/live-events/{live_event.id}/chat", headers=auth_headers)
        assert response.status_code == 200
        messages = response.json()
        assert len(messages) == 1
        assert messages[0]["user_email"] is not None

    def test_send_chat_message_disabled_400(self, client, auth_headers, db_session, live_event):
        live_event.chat_enabled = False
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "Hi"},
        )
        assert response.status_code == 400

    def test_send_chat_message_nonexistent_event_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/live-events/999999/chat",
            headers=auth_headers,
            json={"live_event_id": 999999, "message": "Hi"},
        )
        assert response.status_code == 404

    def test_chat_message_flagged_by_moderation_rule(
        self, client, auth_headers, db_session, institution, live_event
    ):
        rule = ChatModerationRule(
            institution_id=institution.id,
            rule_type="banned_word",
            rule_value="badword",
            action="flag",
        )
        db_session.add(rule)
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "this has a badword in it"},
        )
        assert response.status_code == 201
        assert response.json()["is_flagged"] is True

    def test_chat_message_deleted_by_moderation_rule(
        self, client, auth_headers, db_session, institution, live_event
    ):
        rule = ChatModerationRule(
            institution_id=institution.id,
            rule_type="banned_word",
            rule_value="forbidden",
            action="delete",
        )
        db_session.add(rule)
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "this is forbidden content"},
        )
        assert response.status_code == 400

    def test_chat_message_blocked_by_moderation_rule(
        self, client, auth_headers, db_session, institution, live_event
    ):
        rule = ChatModerationRule(
            institution_id=institution.id,
            rule_type="banned_word",
            rule_value="banme",
            action="block_user",
        )
        db_session.add(rule)
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "please banme now"},
        )
        assert response.status_code == 403

    def test_moderate_chat_message(self, client, auth_headers, live_event):
        send_response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "Delete this please"},
        )
        message_id = send_response.json()["id"]

        response = client.put(
            f"/api/v1/live-events/chat/{message_id}/moderate",
            headers=auth_headers,
            json={"is_deleted": True, "moderation_reason": "inappropriate"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_deleted"] is True
        assert data["moderated_by"] is not None
        assert data["moderated_at"] is not None

        response = client.get(f"/api/v1/live-events/{live_event.id}/chat", headers=auth_headers)
        assert response.json() == []

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            params={"include_deleted": True},
        )
        assert len(response.json()) == 1

    def test_moderate_nonexistent_message_404(self, client, auth_headers):
        response = client.put(
            "/api/v1/live-events/chat/999999/moderate",
            headers=auth_headers,
            json={"is_deleted": True},
        )
        assert response.status_code == 404

    def test_moderate_message_cross_institution_404(
        self, client, other_admin_headers, auth_headers, live_event
    ):
        send_response = client.post(
            f"/api/v1/live-events/{live_event.id}/chat",
            headers=auth_headers,
            json={"live_event_id": live_event.id, "message": "hi"},
        )
        message_id = send_response.json()["id"]

        response = client.put(
            f"/api/v1/live-events/chat/{message_id}/moderate",
            headers=other_admin_headers,
            json={"is_deleted": True},
        )
        assert response.status_code == 404


# ===========================================================================
# Moderation rules
# ===========================================================================
@pytest.mark.integration
class TestModerationRules:
    def test_create_and_list_moderation_rule(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/live-events/moderation-rules",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "rule_type": "banned_word",
                "rule_value": "spam,scam",
                "action": "delete",
                "severity": "high",
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["rule_type"] == "banned_word"
        assert data["is_active"] is True

        response = client.get("/api/v1/live-events/moderation-rules", headers=auth_headers)
        assert response.status_code == 200
        assert any(r["id"] == data["id"] for r in response.json())

    def test_create_moderation_rule_cross_institution_forbidden(
        self, client, auth_headers, other_institution
    ):
        response = client.post(
            "/api/v1/live-events/moderation-rules",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "rule_type": "banned_word",
                "rule_value": "x",
            },
        )
        assert response.status_code == 403

    def test_moderation_rules_scoped_to_institution(
        self, client, auth_headers, other_admin_headers, institution
    ):
        client.post(
            "/api/v1/live-events/moderation-rules",
            headers=auth_headers,
            json={"institution_id": institution.id, "rule_type": "banned_word", "rule_value": "x"},
        )
        response = client.get("/api/v1/live-events/moderation-rules", headers=other_admin_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_update_moderation_rule(self, client, auth_headers, institution, db_session):
        rule = ChatModerationRule(
            institution_id=institution.id, rule_type="banned_word", rule_value="old"
        )
        db_session.add(rule)
        db_session.commit()
        db_session.refresh(rule)

        response = client.put(
            f"/api/v1/live-events/moderation-rules/{rule.id}",
            headers=auth_headers,
            json={"rule_value": "new", "is_active": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False

    def test_update_nonexistent_moderation_rule_404(self, client, auth_headers):
        response = client.put(
            "/api/v1/live-events/moderation-rules/999999",
            headers=auth_headers,
            json={"rule_value": "x"},
        )
        assert response.status_code == 404

    def test_delete_moderation_rule(self, client, auth_headers, institution, db_session):
        rule = ChatModerationRule(
            institution_id=institution.id, rule_type="banned_word", rule_value="bye"
        )
        db_session.add(rule)
        db_session.commit()
        db_session.refresh(rule)

        response = client.delete(
            f"/api/v1/live-events/moderation-rules/{rule.id}", headers=auth_headers
        )
        assert response.status_code == 204

    def test_delete_moderation_rule_cross_institution_404(
        self, client, other_admin_headers, institution, db_session
    ):
        rule = ChatModerationRule(
            institution_id=institution.id, rule_type="banned_word", rule_value="bye"
        )
        db_session.add(rule)
        db_session.commit()
        db_session.refresh(rule)

        response = client.delete(
            f"/api/v1/live-events/moderation-rules/{rule.id}", headers=other_admin_headers
        )
        assert response.status_code == 404


# ===========================================================================
# Analytics
# ===========================================================================
@pytest.mark.integration
class TestAnalytics:
    def test_event_analytics_basic(self, client, auth_headers, live_event):
        response = client.get(
            f"/api/v1/live-events/{live_event.id}/analytics", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["live_event_id"] == live_event.id
        assert data["viewer_analytics"]["total_viewers"] == 0
        assert data["revenue_analytics"] is None
        assert data["stream_quality"] == []

    def test_event_analytics_with_stream_quality_rows(
        self, client, auth_headers, db_session, live_event
    ):
        """Regression test for bug #3: without from_attributes=True on
        StreamAnalyticsResponse, this raised a pydantic ValidationError
        whenever the event had any StreamAnalytics rows at all."""
        snapshot = StreamAnalytics(
            live_event_id=live_event.id,
            timestamp=datetime.utcnow() - timedelta(seconds=5),
            viewer_count=10,
            chat_messages_count=3,
            average_bitrate=2500,
            buffering_events=1,
        )
        db_session.add(snapshot)
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/analytics", headers=auth_headers
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data["stream_quality"]) == 1
        assert data["stream_quality"][0]["viewer_count"] == 10
        assert data["stream_quality"][0]["average_bitrate"] == 2500

    def test_event_analytics_with_monetization(
        self, client, auth_headers, db_session, live_event, admin_user
    ):
        live_event.monetization_enabled = True
        live_event.ticket_price = 200
        ticket = EventTicket(
            live_event_id=live_event.id,
            user_id=admin_user.id,
            ticket_code="TKT-ANALYTICS-1",
            amount_paid=200,
            currency="INR",
            payment_status="completed",
        )
        db_session.add(ticket)
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/analytics", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["revenue_analytics"]["tickets_sold"] == 1
        assert data["revenue_analytics"]["total_revenue"] == 200

    def test_analytics_nonexistent_event_404(self, client, auth_headers):
        response = client.get("/api/v1/live-events/999999/analytics", headers=auth_headers)
        assert response.status_code == 404


# ===========================================================================
# Recording management
# ===========================================================================
@pytest.mark.integration
class TestRecording:
    def test_upload_recording(self, client, auth_headers, live_event):
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/recording/upload",
            headers=auth_headers,
            json={"recording_url": "https://example.com/rec.mp4", "recording_s3_key": "rec/1.mp4"},
        )
        assert response.status_code == 200
        assert response.json()["recording_url"] == "https://example.com/rec.mp4"

    def test_upload_recording_nonexistent_event_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/live-events/999999/recording/upload",
            headers=auth_headers,
            json={"recording_url": "https://example.com/rec.mp4"},
        )
        assert response.status_code == 404

    def test_archive_recording(self, client, auth_headers, live_event):
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/recording/archive",
            headers=auth_headers,
            json={"notes": "moved to cold storage"},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Recording archived successfully"

    def test_archive_recording_nonexistent_event_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/live-events/999999/recording/archive", headers=auth_headers, json={}
        )
        assert response.status_code == 404


# ===========================================================================
# Tickets / revenue
# ===========================================================================
@pytest.mark.integration
class TestTickets:
    def test_purchase_ticket(self, client, auth_headers, db_session, live_event):
        live_event.monetization_enabled = True
        live_event.ticket_price = 300
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets", headers=auth_headers
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["amount_paid"] == 300
        assert data["payment_status"] == "pending"
        assert data["ticket_code"].startswith(f"TKT-{live_event.id}-")

    def test_purchase_ticket_not_monetized_400(self, client, auth_headers, live_event):
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets", headers=auth_headers
        )
        assert response.status_code == 400

    def test_purchase_ticket_nonexistent_event_404(self, client, auth_headers):
        response = client.post("/api/v1/live-events/999999/tickets", headers=auth_headers)
        assert response.status_code == 404

    def test_purchase_ticket_idempotent_when_already_completed(
        self, client, auth_headers, db_session, live_event, admin_user
    ):
        live_event.monetization_enabled = True
        live_event.ticket_price = 300
        existing = EventTicket(
            live_event_id=live_event.id,
            user_id=admin_user.id,
            ticket_code="TKT-EXISTING-1",
            amount_paid=300,
            currency="INR",
            payment_status="completed",
        )
        db_session.add(existing)
        db_session.commit()
        db_session.refresh(existing)

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets", headers=auth_headers
        )
        assert response.status_code == 201
        assert response.json()["id"] == existing.id

    def test_get_my_ticket(self, client, auth_headers, db_session, live_event, admin_user):
        response = client.get(
            f"/api/v1/live-events/{live_event.id}/tickets/my-ticket", headers=auth_headers
        )
        assert response.status_code == 404

        ticket = EventTicket(
            live_event_id=live_event.id,
            user_id=admin_user.id,
            ticket_code="TKT-MINE-1",
            amount_paid=100,
            currency="INR",
            payment_status="pending",
        )
        db_session.add(ticket)
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/tickets/my-ticket", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["ticket_code"] == "TKT-MINE-1"

    def test_list_event_tickets_with_filter(
        self, client, auth_headers, db_session, live_event, admin_user, other_admin_user
    ):
        db_session.add_all([
            EventTicket(
                live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-L-1",
                amount_paid=100, currency="INR", payment_status="completed",
            ),
            EventTicket(
                live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-L-2",
                amount_paid=100, currency="INR", payment_status="pending",
            ),
        ])
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/tickets", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 2

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/tickets",
            headers=auth_headers,
            params={"payment_status": "completed"},
        )
        assert response.status_code == 200
        tickets = response.json()
        assert len(tickets) == 1
        assert tickets[0]["ticket_code"] == "TKT-L-1"

    def test_list_event_tickets_nonexistent_event_404(self, client, auth_headers):
        response = client.get("/api/v1/live-events/999999/tickets", headers=auth_headers)
        assert response.status_code == 404

    def test_redeem_ticket(self, client, auth_headers, db_session, live_event, admin_user):
        ticket = EventTicket(
            live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-REDEEM-1",
            amount_paid=100, currency="INR", payment_status="pending",
        )
        db_session.add(ticket)
        db_session.commit()
        db_session.refresh(ticket)

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/{ticket.id}/redeem",
            headers=auth_headers,
        )
        assert response.status_code == 400  # payment not completed yet

        ticket.payment_status = "completed"
        db_session.commit()

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/{ticket.id}/redeem",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["ticket"]["is_redeemed"] is True

        # Redeeming again is idempotent, not an error.
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/{ticket.id}/redeem",
            headers=auth_headers,
        )
        assert response.status_code == 200

    def test_redeem_nonexistent_ticket_404(self, client, auth_headers, live_event):
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/999999/redeem", headers=auth_headers
        )
        assert response.status_code == 404

    def test_refund_ticket(self, client, auth_headers, db_session, live_event, admin_user):
        ticket = EventTicket(
            live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-REFUND-1",
            amount_paid=100, currency="INR", payment_status="completed",
        )
        db_session.add(ticket)
        db_session.commit()
        db_session.refresh(ticket)

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/{ticket.id}/refund",
            headers=auth_headers,
            params={"reason": "event cancelled"},
        )
        assert response.status_code == 200
        assert response.json()["ticket"]["is_refunded"] is True

        # Refunding again is rejected.
        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/{ticket.id}/refund",
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_refund_ticket_cross_institution_404(
        self, client, other_admin_headers, db_session, live_event, admin_user
    ):
        ticket = EventTicket(
            live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-REFUND-X",
            amount_paid=100, currency="INR", payment_status="completed",
        )
        db_session.add(ticket)
        db_session.commit()
        db_session.refresh(ticket)

        response = client.post(
            f"/api/v1/live-events/{live_event.id}/tickets/{ticket.id}/refund",
            headers=other_admin_headers,
        )
        assert response.status_code == 404

    def test_get_event_revenue(self, client, auth_headers, db_session, live_event, admin_user):
        live_event.monetization_enabled = True
        db_session.add_all([
            EventTicket(
                live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-REV-1",
                amount_paid=100, currency="INR", payment_status="completed",
            ),
            EventTicket(
                live_event_id=live_event.id, user_id=admin_user.id, ticket_code="TKT-REV-2",
                amount_paid=50, currency="INR", payment_status="completed", is_refunded=True,
            ),
        ])
        db_session.commit()

        response = client.get(
            f"/api/v1/live-events/{live_event.id}/revenue", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_revenue"] == 100
        assert data["refunded_amount"] == 50
        assert data["net_revenue"] == 50
        assert data["total_tickets"] == 2

    def test_get_event_revenue_not_monetized_400(self, client, auth_headers, live_event):
        response = client.get(
            f"/api/v1/live-events/{live_event.id}/revenue", headers=auth_headers
        )
        assert response.status_code == 400

    def test_get_event_revenue_nonexistent_event_404(self, client, auth_headers):
        response = client.get("/api/v1/live-events/999999/revenue", headers=auth_headers)
        assert response.status_code == 404
