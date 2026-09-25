"""Integration tests for the `messages` router (src/api/v1/messages.py).

Covers private user-to-user messaging: send, inbox, sent, unread count,
conversation-by-user, single message, thread, mark-read, mark-all-read,
delete (soft + permanent), and search.

`MessagingService.get_message_by_id` (and everything built on top of it --
`get_message`, `get_message_thread`, `mark_as_read`, `delete_message`,
`search_messages`) already scopes strictly to
`sender_id == user_id OR recipient_id == user_id`, so no cross-user/
cross-institution authorization gap was found here (unlike `submissions.py`
in a previous pass) -- this was verified carefully per this task's explicit
callout to check `messages.py` for exactly that gap.

No Celery `.delay()` calls; the one async side effect (`websocket_manager.
send_message_notification`) degrades to a safe no-op with no active
connections in tests (`ConnectionManager.send_personal_message` only acts
`if user_id in self.active_connections`), so nothing needs to be mocked or
skipped for it.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.user import User
from src.models.notification import Message
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_teacher_user(db_session, institution, teacher_role) -> User:
    """A second user in the SAME institution as `teacher_user`/`admin_user`,
    used for same-institution-but-different-user ownership checks."""
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"teacher2_{suffix}",
        email=f"teacher2_{suffix}@testschool.com",
        first_name="Second",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=teacher_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_teacher_headers(client, second_teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


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
def other_institution_user(db_session, other_institution, other_admin_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheruser{suffix}",
        email=f"otheruser{suffix}@otherschool.com",
        first_name="Other",
        last_name="User",
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
def other_institution_headers(client, other_institution_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_institution_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _send(client, headers, recipient_id, subject="Hi", content="Hello there", parent_id=None):
    payload = {"recipient_id": recipient_id, "subject": subject, "content": content}
    if parent_id is not None:
        payload["parent_id"] = parent_id
    return client.post("/api/v1/messages/", json=payload, headers=headers)


# ===========================================================================
# POST /messages/  (send_message)
# ===========================================================================
class TestSendMessage:
    def test_requires_auth(self, client, teacher_user):
        response = client.post(
            "/api/v1/messages/",
            json={"recipient_id": teacher_user.id, "content": "hi"},
        )
        assert response.status_code == 403

    def test_send_message_happy_path(self, client, auth_headers, teacher_user):
        response = _send(client, auth_headers, teacher_user.id, subject="Welcome", content="Hello teacher")
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["subject"] == "Welcome"
        assert data["content"] == "Hello teacher"
        assert data["recipient_id"] == teacher_user.id
        assert data["is_read"] is False
        assert "id" in data
        assert "institution_id" in data

    def test_send_message_without_subject(self, client, auth_headers, teacher_user):
        response = client.post(
            "/api/v1/messages/",
            json={"recipient_id": teacher_user.id, "content": "No subject here"},
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["subject"] is None

    def test_send_message_to_nonexistent_recipient_400(self, client, auth_headers):
        response = _send(client, auth_headers, 999999999)
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()

    def test_send_message_cross_institution_recipient_400(self, client, auth_headers, other_institution_user):
        """A recipient in a different institution is not a valid target."""
        response = _send(client, auth_headers, other_institution_user.id)
        assert response.status_code == 400

    def test_send_message_missing_content_422(self, client, auth_headers, teacher_user):
        response = client.post(
            "/api/v1/messages/",
            json={"recipient_id": teacher_user.id},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_send_reply_with_parent_id(self, client, auth_headers, teacher_user, teacher_headers, admin_user):
        original = _send(client, teacher_headers, admin_user.id, subject="Original", content="Original content")
        assert original.status_code == 201
        parent_id = original.json()["id"]

        reply = _send(client, auth_headers, teacher_user.id, subject="Re: Original", content="Reply content", parent_id=parent_id)
        assert reply.status_code == 201
        assert reply.json()["parent_id"] == parent_id


# ===========================================================================
# GET /messages/inbox
# ===========================================================================
class TestInbox:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/messages/inbox")
        assert response.status_code == 403

    def test_inbox_shows_received_messages(self, client, auth_headers, teacher_headers, teacher_user, admin_user):
        _send(client, teacher_headers, admin_user.id, subject="For admin", content="Hi admin")
        response = client.get("/api/v1/messages/inbox", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(m["subject"] == "For admin" for m in data)

    def test_inbox_does_not_show_sent_messages(self, client, auth_headers, teacher_user):
        _send(client, auth_headers, teacher_user.id, subject="Sent by admin", content="hi")
        response = client.get("/api/v1/messages/inbox", headers=auth_headers)
        assert response.status_code == 200
        assert all(m["subject"] != "Sent by admin" for m in response.json())

    def test_inbox_unread_only_filter(self, client, auth_headers, teacher_headers, teacher_user, admin_user):
        sent = _send(client, teacher_headers, admin_user.id, subject="Unread test", content="hi")
        message_id = sent.json()["id"]
        client.patch(f"/api/v1/messages/{message_id}/read", headers=auth_headers)

        response = client.get("/api/v1/messages/inbox", params={"unread_only": True}, headers=auth_headers)
        assert response.status_code == 200
        assert all(m["id"] != message_id for m in response.json())

    def test_inbox_pagination_params(self, client, auth_headers):
        response = client.get("/api/v1/messages/inbox", params={"skip": 0, "limit": 5}, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) <= 5

    def test_inbox_invalid_limit_422(self, client, auth_headers):
        response = client.get("/api/v1/messages/inbox", params={"limit": 0}, headers=auth_headers)
        assert response.status_code == 422


# ===========================================================================
# GET /messages/sent
# ===========================================================================
class TestSentMessages:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/messages/sent")
        assert response.status_code == 403

    def test_sent_shows_only_own_sent_messages(self, client, auth_headers, teacher_user):
        _send(client, auth_headers, teacher_user.id, subject="From admin", content="hi")
        response = client.get("/api/v1/messages/sent", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(m["subject"] == "From admin" for m in data)
        assert all(m["sender_id"] == data[0]["sender_id"] for m in data)


# ===========================================================================
# GET /messages/unread-count
# ===========================================================================
class TestUnreadCount:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/messages/unread-count")
        assert response.status_code == 403

    def test_unread_count_increments(self, client, auth_headers, teacher_headers, teacher_user, admin_user):
        before = client.get("/api/v1/messages/unread-count", headers=auth_headers).json()["unread_count"]
        _send(client, teacher_headers, admin_user.id, subject="Count me", content="hi")
        after = client.get("/api/v1/messages/unread-count", headers=auth_headers).json()["unread_count"]
        assert after == before + 1


# ===========================================================================
# GET /messages/conversation/{other_user_id}
# ===========================================================================
class TestConversation:
    def test_requires_auth(self, client, teacher_user):
        response = client.get(f"/api/v1/messages/conversation/{teacher_user.id}")
        assert response.status_code == 403

    def test_conversation_returns_both_directions(self, client, auth_headers, teacher_headers, teacher_user, admin_user):
        _send(client, auth_headers, teacher_user.id, subject="A->T", content="hello")
        _send(client, teacher_headers, admin_user.id, subject="T->A", content="hi back")

        response = client.get(f"/api/v1/messages/conversation/{teacher_user.id}", headers=auth_headers)
        assert response.status_code == 200
        subjects = {m["subject"] for m in response.json()}
        assert {"A->T", "T->A"}.issubset(subjects)

    def test_conversation_with_uninvolved_user_is_empty(self, client, auth_headers, second_teacher_user, teacher_user, teacher_headers, admin_user):
        # Message between teacher_user and second_teacher_user shouldn't leak
        # into admin's conversation view with second_teacher_user.
        _send(client, teacher_headers, second_teacher_user.id, subject="T->T2", content="hi")
        response = client.get(f"/api/v1/messages/conversation/{second_teacher_user.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []


# ===========================================================================
# GET /messages/{message_id}
# ===========================================================================
class TestGetMessage:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/messages/1")
        assert response.status_code == 403

    def test_get_message_404(self, client, auth_headers):
        response = client.get("/api/v1/messages/999999999", headers=auth_headers)
        assert response.status_code == 404

    def test_sender_can_view_own_message(self, client, auth_headers, teacher_user):
        sent = _send(client, auth_headers, teacher_user.id, subject="View me", content="hi")
        message_id = sent.json()["id"]
        response = client.get(f"/api/v1/messages/{message_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == message_id

    def test_recipient_can_view_message(self, client, auth_headers, teacher_headers, teacher_user):
        sent = _send(client, auth_headers, teacher_user.id, subject="View me 2", content="hi")
        message_id = sent.json()["id"]
        response = client.get(f"/api/v1/messages/{message_id}", headers=teacher_headers)
        assert response.status_code == 200

    def test_uninvolved_user_in_same_institution_cannot_view_404(
        self, client, auth_headers, teacher_headers, teacher_user, second_teacher_headers
    ):
        """Cross-owner authorization: a message strictly between admin and
        teacher_user must not be readable by a third user in the SAME
        institution."""
        sent = _send(client, auth_headers, teacher_user.id, subject="Private", content="secret")
        message_id = sent.json()["id"]
        response = client.get(f"/api/v1/messages/{message_id}", headers=second_teacher_headers)
        assert response.status_code == 404


# ===========================================================================
# GET /messages/{message_id}/thread
# ===========================================================================
class TestMessageThread:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/messages/1/thread")
        assert response.status_code == 403

    def test_thread_404_when_not_found(self, client, auth_headers):
        response = client.get("/api/v1/messages/999999999/thread", headers=auth_headers)
        assert response.status_code == 404

    def test_thread_includes_root_and_reply(self, client, auth_headers, teacher_headers, teacher_user, admin_user):
        original = _send(client, auth_headers, teacher_user.id, subject="Root", content="root msg")
        root_id = original.json()["id"]
        reply = _send(client, teacher_headers, admin_user.id, subject="Re: Root", content="reply msg", parent_id=root_id)
        assert reply.status_code == 201

        response = client.get(f"/api/v1/messages/{root_id}/thread", headers=auth_headers)
        assert response.status_code == 200
        ids = {m["id"] for m in response.json()}
        assert root_id in ids
        assert reply.json()["id"] in ids

    def test_thread_not_visible_to_uninvolved_user(
        self, client, auth_headers, teacher_user, second_teacher_headers
    ):
        original = _send(client, auth_headers, teacher_user.id, subject="Root2", content="root msg")
        root_id = original.json()["id"]
        response = client.get(f"/api/v1/messages/{root_id}/thread", headers=second_teacher_headers)
        assert response.status_code == 404


# ===========================================================================
# PATCH /messages/{message_id}/read
# ===========================================================================
class TestMarkMessageRead:
    def test_requires_auth(self, client):
        response = client.patch("/api/v1/messages/1/read")
        assert response.status_code == 403

    def test_mark_read_404(self, client, auth_headers):
        response = client.patch("/api/v1/messages/999999999/read", headers=auth_headers)
        assert response.status_code == 404

    def test_recipient_can_mark_read(self, client, auth_headers, teacher_headers, teacher_user):
        sent = _send(client, auth_headers, teacher_user.id, subject="Mark me", content="hi")
        message_id = sent.json()["id"]

        response = client.patch(f"/api/v1/messages/{message_id}/read", headers=teacher_headers)
        assert response.status_code == 200
        assert response.json()["is_read"] is True
        assert response.json()["read_at"] is not None

    def test_sender_cannot_mark_own_sent_message_read(self, client, auth_headers, teacher_user):
        """Only the recipient can mark a message read -- the sender hitting
        this endpoint on their own sent message gets a 404 (service scopes
        strictly to `recipient_id == user_id`)."""
        sent = _send(client, auth_headers, teacher_user.id, subject="Sender attempt", content="hi")
        message_id = sent.json()["id"]
        response = client.patch(f"/api/v1/messages/{message_id}/read", headers=auth_headers)
        assert response.status_code == 404


# ===========================================================================
# POST /messages/mark-all-read
# ===========================================================================
class TestMarkAllRead:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/messages/mark-all-read")
        assert response.status_code == 403

    def test_mark_all_read(self, client, auth_headers, teacher_headers, teacher_user, admin_user):
        _send(client, teacher_headers, admin_user.id, subject="M1", content="hi")
        _send(client, teacher_headers, admin_user.id, subject="M2", content="hi")

        response = client.post("/api/v1/messages/mark-all-read", headers=auth_headers)
        assert response.status_code == 200
        assert "Marked" in response.json()["message"]

        unread = client.get("/api/v1/messages/unread-count", headers=auth_headers).json()["unread_count"]
        assert unread == 0


# ===========================================================================
# DELETE /messages/{message_id}
# ===========================================================================
class TestDeleteMessage:
    def test_requires_auth(self, client):
        response = client.delete("/api/v1/messages/1")
        assert response.status_code == 403

    def test_delete_404(self, client, auth_headers):
        response = client.delete("/api/v1/messages/999999999", headers=auth_headers)
        assert response.status_code == 404

    def test_soft_delete_by_recipient_hides_from_their_inbox_only(
        self, client, auth_headers, teacher_headers, teacher_user, admin_user
    ):
        sent = _send(client, auth_headers, teacher_user.id, subject="To delete", content="hi")
        message_id = sent.json()["id"]

        response = client.delete(f"/api/v1/messages/{message_id}", headers=teacher_headers)
        assert response.status_code == 200

        # Gone from recipient's inbox.
        inbox = client.get("/api/v1/messages/inbox", headers=teacher_headers).json()
        assert all(m["id"] != message_id for m in inbox)

        # Still visible to sender in their sent list.
        sent_list = client.get("/api/v1/messages/sent", headers=auth_headers).json()
        assert any(m["id"] == message_id for m in sent_list)

    def test_permanent_delete_removes_row(self, client, auth_headers, teacher_user, db_session):
        sent = _send(client, auth_headers, teacher_user.id, subject="Permanent", content="hi")
        message_id = sent.json()["id"]

        response = client.delete(f"/api/v1/messages/{message_id}", params={"permanent": True}, headers=auth_headers)
        assert response.status_code == 200

        db_session.expire_all()
        assert db_session.query(Message).filter(Message.id == message_id).first() is None

    def test_uninvolved_user_cannot_delete_others_message(
        self, client, auth_headers, teacher_user, second_teacher_headers
    ):
        sent = _send(client, auth_headers, teacher_user.id, subject="Not yours", content="hi")
        message_id = sent.json()["id"]
        response = client.delete(f"/api/v1/messages/{message_id}", headers=second_teacher_headers)
        assert response.status_code == 404


# ===========================================================================
# GET /messages/search/
# ===========================================================================
class TestSearchMessages:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/messages/search/", params={"q": "hi"})
        assert response.status_code == 403

    def test_search_missing_query_422(self, client, auth_headers):
        response = client.get("/api/v1/messages/search/", headers=auth_headers)
        assert response.status_code == 422

    def test_search_finds_by_subject_and_content(self, client, auth_headers, teacher_user):
        _send(client, auth_headers, teacher_user.id, subject="Findable Unique Subject", content="irrelevant body")
        _send(client, auth_headers, teacher_user.id, subject="Other", content="irrelevant body 2")

        response = client.get("/api/v1/messages/search/", params={"q": "Findable"}, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any("Findable" in (m["subject"] or "") for m in data)

    def test_search_only_matches_own_messages(self, client, auth_headers, teacher_headers, teacher_user, second_teacher_user, second_teacher_headers):
        # A message between teacher_user and second_teacher_user, searched by admin.
        _send(client, teacher_headers, second_teacher_user.id, subject="Unrelated to admin XYZUNIQUE", content="hi")
        response = client.get("/api/v1/messages/search/", params={"q": "XYZUNIQUE"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []
