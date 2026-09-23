import json
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.live_events import LiveEvent, EventViewer, EventChatMessage


WS_BASE = "/api/v1/live-events/ws"


@pytest.fixture
def live_event(db_session: Session, institution: Institution, admin_user: User) -> LiveEvent:
    event = LiveEvent(
        institution_id=institution.id,
        created_by=admin_user.id,
        event_name="Live Events WS Test Event",
        event_type="assembly",
        scheduled_start_time=datetime.utcnow() + timedelta(hours=1),
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


@pytest.fixture
def other_institution_event(db_session: Session) -> LiveEvent:
    other_institution = Institution(name="Other WS School", is_active=True)
    db_session.add(other_institution)
    db_session.commit()
    db_session.refresh(other_institution)

    other_user = User(
        username="ws_other_admin",
        email="ws_other_admin@testschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=None,
        is_active=True,
    )
    # institution admins need a role; reuse whatever role exists for that
    # institution isn't guaranteed, so just borrow the caller's own -- the
    # FK only needs to point at *a* real role, this user is never logged in.
    from src.models.role import Role as RoleModel
    role = db_session.query(RoleModel).first()
    other_user.role_id = role.id
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    event = LiveEvent(
        institution_id=other_institution.id,
        created_by=other_user.id,
        event_name="Cross-Institution WS Event",
        event_type="assembly",
        scheduled_start_time=datetime.utcnow() + timedelta(hours=1),
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


@pytest.fixture
def teacher_headers(client: TestClient, teacher_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _token(headers: dict) -> str:
    return headers["Authorization"].split(" ")[1]


@pytest.mark.integration
class TestLiveEventsWebSocket:
    """Integration tests for the real-time /ws/{event_id} endpoint in
    src/api/v1/live_events_websocket.py, registered alongside (but separate
    from) the REST live_events router. Uses FastAPI TestClient's in-process
    `websocket_connect`, which works over the ASGI transport directly and
    needs no real running server (unlike tests/integration/test_websocket.py,
    an older file for a different router that dials a real `ws://localhost:
    8000` and skips whenever nothing is listening there).

    Found and fixed 3 real bugs while adding this coverage:
    1. Both websocket endpoints had a literal `# TODO: Verify token and get
       user` (viewer endpoint) / `# TODO: Verify token and check moderator
       permissions` (moderator endpoint) with NO authentication implemented
       at all -- the viewer endpoint hardcoded `user_id = 1` for every
       connection regardless of the supplied token, and the moderator
       endpoint accepted any connection unconditionally (letting anyone
       delete chat messages or mute/unmute any event's chat with zero
       auth). Fixed both using the existing `get_current_user_ws` helper
       (already used correctly by the sibling src/api/v1/websocket.py
       router) plus the same institution-scoping pattern the REST
       equivalents (check_event_access, moderate_chat_message) already use.
    2. Both endpoints called `db: Session = next(get_db())` directly instead
       of taking `db: Session = Depends(get_db)` -- this bypasses FastAPI's
       dependency-injection/override mechanism entirely (confirmed: even
       this test file's `client` fixture's `app.dependency_overrides[get_db]`
       had zero effect on it), so it always opened its own SessionLocal()
       against the app's real configured credentials, which in this test
       environment don't match the test DB ("Access denied for user
       'mysql'"). Fixed to use Depends(get_db) like every other router in
       this codebase.

    get_current_user_ws (unlike get_current_user, used by every REST
    endpoint) does not check for an active Redis-tracked session -- only
    that the JWT itself is valid and the user is active -- so these tests
    still go through the real /api/v1/auth/login flow for consistency with
    the rest of this test suite, but a bare create_access_token(...) token
    would also work here (this is a pre-existing asymmetry in
    src/dependencies/auth.py, not something introduced or changed by this
    pass)."""

    def test_connect_with_valid_token_receives_confirmation(
        self, client: TestClient, auth_headers: dict, live_event: LiveEvent
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            data = ws.receive_json()
            assert data == {
                "type": "connected",
                "event_id": live_event.id,
                "message": "Connected to live event",
            }

    def test_connect_creates_viewer_row_with_real_user_id(
        self,
        client: TestClient,
        auth_headers: dict,
        admin_user: User,
        live_event: LiveEvent,
        db_session: Session,
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()

        viewer = (
            db_session.query(EventViewer)
            .filter(EventViewer.live_event_id == live_event.id)
            .first()
        )
        assert viewer is not None
        # Regression check for the hardcoded `user_id = 1` bug: the viewer
        # row must be attributed to the actual authenticated caller.
        assert viewer.user_id == admin_user.id

    def test_connect_with_invalid_token_is_rejected(
        self, client: TestClient, live_event: LiveEvent
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/{live_event.id}?token=not-a-real-token"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_with_no_token_rejected_by_validation(
        self, client: TestClient, live_event: LiveEvent
    ):
        # `token` is a required Query(...) param -- omitting it entirely
        # never reaches the handler at all.
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"{WS_BASE}/{live_event.id}"):
                pass

    def test_connect_to_nonexistent_event_is_rejected(
        self, client: TestClient, auth_headers: dict
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/999999?token={_token(auth_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_to_other_institution_event_is_rejected(
        self,
        client: TestClient,
        auth_headers: dict,
        other_institution_event: LiveEvent,
    ):
        # Regression check for the missing institution-scoping bug: an
        # authenticated user from institution A must not be able to attach
        # to institution B's event, "public" or not.
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/{other_institution_event.id}?token={_token(auth_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_send_chat_message_persists_and_broadcasts(
        self,
        client: TestClient,
        auth_headers: dict,
        admin_user: User,
        live_event: LiveEvent,
        db_session: Session,
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()  # connected

            ws.send_text(json.dumps({"type": "chat_message", "message": "Hello everyone"}))
            broadcast = ws.receive_json()

            assert broadcast["type"] == "chat_message"
            assert broadcast["message"] == "Hello everyone"
            assert broadcast["user_id"] == admin_user.id
            assert broadcast["message_type"] == "text"
            assert "message_id" in broadcast

        message = (
            db_session.query(EventChatMessage)
            .filter(EventChatMessage.live_event_id == live_event.id)
            .first()
        )
        assert message is not None
        assert message.message == "Hello everyone"
        assert message.user_id == admin_user.id

    def test_send_chat_message_broadcasts_to_other_connected_viewers(
        self,
        client: TestClient,
        auth_headers: dict,
        teacher_headers: dict,
        live_event: LiveEvent,
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws1, client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(teacher_headers)}"
        ) as ws2:
            ws1.receive_json()  # connected
            ws2.receive_json()  # connected

            ws1.send_text(json.dumps({"type": "chat_message", "message": "Broadcast test"}))

            # Sender also receives the broadcast (unlike the notification
            # websocket_manager elsewhere, this ConnectionManager.broadcast
            # doesn't exclude the sender by default).
            own_copy = ws1.receive_json()
            assert own_copy["message"] == "Broadcast test"

            received = ws2.receive_json()
            assert received["type"] == "chat_message"
            assert received["message"] == "Broadcast test"

    def test_chat_message_rejected_when_chat_disabled(
        self,
        client: TestClient,
        auth_headers: dict,
        live_event: LiveEvent,
        db_session: Session,
    ):
        live_event.chat_enabled = False
        db_session.commit()

        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()  # connected

            ws.send_text(json.dumps({"type": "chat_message", "message": "Should be blocked"}))
            response = ws.receive_json()

            assert response == {
                "type": "error",
                "message": "Chat is disabled for this event",
            }

    def test_viewer_update_sets_watch_duration(
        self,
        client: TestClient,
        auth_headers: dict,
        admin_user: User,
        live_event: LiveEvent,
        db_session: Session,
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()  # connected
            ws.send_text(json.dumps({"type": "viewer_update", "watch_duration": 42}))
            # No response is sent for this message type -- send a ping next
            # and wait for its pong so we know the update has been processed
            # (the loop is strictly sequential per connection).
            ws.send_text(json.dumps({"type": "ping"}))
            pong = ws.receive_json()
            assert pong == {"type": "pong"}

        viewer = (
            db_session.query(EventViewer)
            .filter(EventViewer.live_event_id == live_event.id)
            .first()
        )
        assert viewer.watch_duration == 42

    def test_ping_pong(self, client: TestClient, auth_headers: dict, live_event: LiveEvent):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()  # connected
            ws.send_text(json.dumps({"type": "ping"}))
            assert ws.receive_json() == {"type": "pong"}

    def test_disconnect_updates_viewer_and_event_viewer_count(
        self,
        client: TestClient,
        auth_headers: dict,
        live_event: LiveEvent,
        db_session: Session,
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()  # connected

        db_session.refresh(live_event)
        viewer = (
            db_session.query(EventViewer)
            .filter(EventViewer.live_event_id == live_event.id)
            .first()
        )
        assert viewer.is_currently_watching is False
        assert viewer.left_at is not None
        assert live_event.viewer_count == 0


@pytest.mark.integration
class TestLiveEventsModeratorWebSocket:
    """Integration tests for the /ws/{event_id}/moderator endpoint."""

    def test_connect_with_valid_token_receives_confirmation(
        self, client: TestClient, auth_headers: dict, live_event: LiveEvent
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}/moderator?token={_token(auth_headers)}"
        ) as ws:
            data = ws.receive_json()
            assert data == {
                "type": "connected",
                "event_id": live_event.id,
                "message": "Connected as moderator",
            }

    def test_connect_with_invalid_token_is_rejected(
        self, client: TestClient, live_event: LiveEvent
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/{live_event.id}/moderator?token=garbage"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_to_other_institution_event_is_rejected(
        self,
        client: TestClient,
        auth_headers: dict,
        other_institution_event: LiveEvent,
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/{other_institution_event.id}/moderator?token={_token(auth_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_delete_message_marks_deleted_and_broadcasts(
        self,
        client: TestClient,
        auth_headers: dict,
        admin_user: User,
        live_event: LiveEvent,
        db_session: Session,
    ):
        message = EventChatMessage(
            live_event_id=live_event.id,
            user_id=admin_user.id,
            message="to be deleted",
        )
        db_session.add(message)
        db_session.commit()
        db_session.refresh(message)

        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as viewer_ws, client.websocket_connect(
            f"{WS_BASE}/{live_event.id}/moderator?token={_token(auth_headers)}"
        ) as mod_ws:
            viewer_ws.receive_json()  # connected
            mod_ws.receive_json()  # connected as moderator

            mod_ws.send_text(
                json.dumps(
                    {
                        "type": "delete_message",
                        "message_id": message.id,
                        "reason": "spam",
                    }
                )
            )

            broadcast = viewer_ws.receive_json()
            assert broadcast == {"type": "message_deleted", "message_id": message.id}

        db_session.refresh(message)
        assert message.is_deleted is True
        assert message.moderation_reason == "spam"
        assert message.moderated_at is not None

    def test_mute_and_unmute_chat(
        self,
        client: TestClient,
        auth_headers: dict,
        live_event: LiveEvent,
        db_session: Session,
    ):
        with client.websocket_connect(
            f"{WS_BASE}/{live_event.id}?token={_token(auth_headers)}"
        ) as viewer_ws, client.websocket_connect(
            f"{WS_BASE}/{live_event.id}/moderator?token={_token(auth_headers)}"
        ) as mod_ws:
            viewer_ws.receive_json()
            mod_ws.receive_json()

            mod_ws.send_text(json.dumps({"type": "mute_chat"}))
            muted_broadcast = viewer_ws.receive_json()
            assert muted_broadcast["type"] == "chat_disabled"

            mod_ws.send_text(json.dumps({"type": "unmute_chat"}))
            unmuted_broadcast = viewer_ws.receive_json()
            assert unmuted_broadcast["type"] == "chat_enabled"

        db_session.refresh(live_event)
        assert live_event.chat_enabled is True
