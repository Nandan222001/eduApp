"""Integration tests for the `classroom_websocket` router
(src/api/v1/classroom_websocket.py).

Real-time WebSocket endpoint for a live virtual classroom (chat, video/audio
toggles, whiteboard, polls, hand-raising, recording events), plus three REST
helper endpoints (chat history, participant count, list of active
classrooms). Uses FastAPI TestClient's in-process `websocket_connect`, which
works over the ASGI transport directly and needs no real running server
(unlike the older tests/integration/test_websocket.py, which dials a real
`ws://localhost:8000` and skips when nothing is listening there).

Bug found and fixed while writing this coverage (missing-auth, the single
most severe bug class this session checks for first): **every endpoint in
this router had no authentication at all.** The WebSocket endpoint accepted
a plain, client-supplied `user_id: int` query parameter with zero
verification -- any client could connect to any classroom's live chat/
whiteboard/poll stream and have arbitrary messages, video/audio toggles,
raised hands etc. recorded and broadcast under a spoofed `user_id` of their
choosing. The three REST endpoints (`/chat-history`, `/participants-count`,
`/classrooms/active`) had no auth dependency either, leaking any
institution's classroom activity to any unauthenticated caller. Fixed to
match the pattern already established in `live_events_websocket.py`: the
WebSocket now takes a `token` query parameter resolved via
`get_current_user_ws`, every endpoint is scoped to the caller's own
institution via a `VirtualClassroom` lookup (a classroom id from another
institution now closes the socket / 404s rather than ever being reachable),
and the three REST endpoints now require `Depends(get_current_user)`.
"""
import json
import uuid
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect


WS_BASE = "/api/v1"


def _token(headers: dict) -> str:
    return headers["Authorization"].split(" ")[1]


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution

    unique_suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {unique_suffix}",
        slug=f"other-school-{unique_suffix}",
        phone="+1234567891",
        address="456 Other Street, Other City, Other State, Other Country 54321",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def classroom(db_session, institution, teacher):
    from src.models.virtual_classroom import VirtualClassroom

    c = VirtualClassroom(
        institution_id=institution.id,
        teacher_id=teacher.id,
        title="Algebra Live Class",
        channel_name=f"channel-{uuid.uuid4().hex[:12]}",
        scheduled_start_time=datetime.utcnow(),
        scheduled_end_time=datetime.utcnow() + timedelta(hours=1),
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def other_institution_classroom(db_session, other_institution):
    from src.models.virtual_classroom import VirtualClassroom
    from src.models.teacher import Teacher
    from src.models.user import User
    from src.models.role import Role
    from src.utils.security import get_password_hash

    role = Role(name="Teacher Other", slug=f"teacher-other-{uuid.uuid4().hex[:8]}", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    other_teacher_user = User(
        username=f"other_teacher_{uuid.uuid4().hex[:8]}",
        email=f"other_teacher_{uuid.uuid4().hex[:8]}@testschool.com",
        first_name="Other",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=role.id,
        is_active=True,
    )
    db_session.add(other_teacher_user)
    db_session.commit()
    db_session.refresh(other_teacher_user)

    other_teacher = Teacher(
        institution_id=other_institution.id,
        user_id=other_teacher_user.id,
        employee_id="EMP-OTHER-1",
        first_name=other_teacher_user.first_name,
        last_name=other_teacher_user.last_name,
        email=other_teacher_user.email,
        is_active=True,
    )
    db_session.add(other_teacher)
    db_session.commit()
    db_session.refresh(other_teacher)

    c = VirtualClassroom(
        institution_id=other_institution.id,
        teacher_id=other_teacher.id,
        title="Foreign Institution Class",
        channel_name=f"channel-{uuid.uuid4().hex[:12]}",
        scheduled_start_time=datetime.utcnow(),
        scheduled_end_time=datetime.utcnow() + timedelta(hours=1),
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


class TestClassroomWebSocket:
    def test_connect_with_valid_token_receives_history_and_confirmation(
        self, client: TestClient, auth_headers: dict, admin_user, classroom
    ):
        with client.websocket_connect(
            f"{WS_BASE}/classroom/{classroom.id}?token={_token(auth_headers)}"
        ) as ws:
            # ClassroomWebSocketManager.connect() adds the connecting
            # websocket to `active_connections` *before* broadcasting
            # "user_joined", so the newly-connected client also receives its
            # own join event first (pre-existing manager behavior, not
            # something this pass's auth fix changed).
            joined_msg = ws.receive_json()
            assert joined_msg["event"] == "user_joined"

            history_msg = ws.receive_json()
            assert history_msg["event"] == "chat_history"
            assert history_msg["messages"] == []

            connected_msg = ws.receive_json()
            assert connected_msg["event"] == "connected"
            assert connected_msg["classroom_id"] == classroom.id
            # Regression check: user_id must come from the authenticated
            # token, never a client-supplied query parameter.
            assert connected_msg["user_id"] == admin_user.id

    def test_connect_with_invalid_token_is_rejected(self, client: TestClient, classroom):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/classroom/{classroom.id}?token=not-a-real-token"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_with_no_token_rejected_by_validation(self, client: TestClient, classroom):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"{WS_BASE}/classroom/{classroom.id}"):
                pass

    def test_connect_to_nonexistent_classroom_is_rejected(self, client: TestClient, auth_headers):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/classroom/999999?token={_token(auth_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_to_other_institution_classroom_is_rejected(
        self, client: TestClient, auth_headers, other_institution_classroom
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/classroom/{other_institution_classroom.id}?token={_token(auth_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_send_chat_message_broadcasts_under_real_user_id(
        self, client: TestClient, auth_headers, admin_user, classroom
    ):
        with client.websocket_connect(
            f"{WS_BASE}/classroom/{classroom.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()  # user_joined (self)
            ws.receive_json()  # chat_history
            ws.receive_json()  # connected

            ws.send_text(json.dumps({"type": "chat_message", "message": "Hello class"}))

            broadcast = ws.receive_json()
            assert broadcast["event"] == "chat_message"
            assert broadcast["user_id"] == admin_user.id
            assert broadcast["message"] == "Hello class"

    def test_two_participants_see_join_and_chat_events(
        self, client: TestClient, auth_headers, teacher_user, institution, classroom, db_session
    ):
        teacher_headers_resp = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        teacher_token = teacher_headers_resp.json()["access_token"]

        with client.websocket_connect(
            f"{WS_BASE}/classroom/{classroom.id}?token={_token(auth_headers)}"
        ) as ws1:
            ws1.receive_json()  # user_joined (self)
            ws1.receive_json()  # chat_history
            ws1.receive_json()  # connected

            with client.websocket_connect(
                f"{WS_BASE}/classroom/{classroom.id}?token={teacher_token}"
            ) as ws2:
                # ws1 should see a user_joined event for ws2's user
                joined = ws1.receive_json()
                assert joined["event"] == "user_joined"
                assert joined["participant_count"] == 2

                ws2.receive_json()  # user_joined (self)
                ws2.receive_json()  # chat_history
                ws2.receive_json()  # connected


class TestChatHistoryEndpoint:
    def test_requires_auth(self, client, classroom):
        response = client.get(f"{WS_BASE}/classroom/{classroom.id}/chat-history")
        assert response.status_code == 403

    def test_returns_empty_history_initially(self, client, auth_headers, classroom):
        response = client.get(
            f"{WS_BASE}/classroom/{classroom.id}/chat-history", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == {"messages": []}

    def test_404_for_nonexistent_classroom(self, client, auth_headers):
        response = client.get(
            f"{WS_BASE}/classroom/999999/chat-history", headers=auth_headers
        )
        assert response.status_code == 404

    def test_404_for_other_institution_classroom(self, client, auth_headers, other_institution_classroom):
        response = client.get(
            f"{WS_BASE}/classroom/{other_institution_classroom.id}/chat-history",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestParticipantsCountEndpoint:
    def test_requires_auth(self, client, classroom):
        response = client.get(f"{WS_BASE}/classroom/{classroom.id}/participants-count")
        assert response.status_code == 403

    def test_returns_zero_with_no_connections(self, client, auth_headers, classroom):
        response = client.get(
            f"{WS_BASE}/classroom/{classroom.id}/participants-count", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == {"classroom_id": classroom.id, "participant_count": 0}

    def test_404_for_other_institution_classroom(self, client, auth_headers, other_institution_classroom):
        response = client.get(
            f"{WS_BASE}/classroom/{other_institution_classroom.id}/participants-count",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestActiveClassroomsEndpoint:
    def test_requires_auth(self, client):
        response = client.get(f"{WS_BASE}/classrooms/active")
        assert response.status_code == 403

    def test_empty_when_nothing_connected(self, client, auth_headers):
        response = client.get(f"{WS_BASE}/classrooms/active", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == {"active_classrooms": []}

    def test_lists_connected_classroom_scoped_to_own_institution(
        self, client: TestClient, auth_headers, classroom, other_institution_classroom
    ):
        with client.websocket_connect(
            f"{WS_BASE}/classroom/{classroom.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.receive_json()
            ws.receive_json()

            response = client.get(f"{WS_BASE}/classrooms/active", headers=auth_headers)
            assert response.status_code == 200
            body = response.json()
            classroom_ids = [c["classroom_id"] for c in body["active_classrooms"]]
            assert classroom.id in classroom_ids
            # The other institution's classroom must never surface here even
            # if it happened to have live connections of its own.
            assert other_institution_classroom.id not in classroom_ids
