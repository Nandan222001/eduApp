"""Integration tests for the `olympics` router (src/api/v1/olympics.py).

Inter-school/inter-class competitions: competitions, events, entries
(submit/grade), teams, leaderboards (persisted + live via Redis), and two
real-time WebSocket channels.

Bugs found and fixed while writing/reviewing this coverage (most of the
auth/institution-scoping work was already done by a prior pass on this same
router before this session started; see the router's own docstrings for the
per-endpoint detail):

1. **Zero authentication and zero institution scoping on every REST endpoint
   and both WebSocket channels** -- every create endpoint trusted an
   arbitrary client-supplied `institution_id` query parameter, every
   get/update endpoint had no ownership check at all, and both WebSocket
   endpoints (`/ws/competition/{id}`, `/ws/competition/{id}/event/{id}`)
   accepted a raw, unverified `user_id` query parameter (full impersonation).
   Fixed by requiring `Depends(get_current_user)` on every REST endpoint
   (deriving `institution_id` from the caller), and by resolving the
   WebSocket caller's identity from a `token` query parameter via
   `get_current_user_ws`, matching the pattern already used by
   `classroom_websocket.py`/`live_events_websocket.py`.

2. **`POST /competitions/{id}/leaderboard/update` 100% failed with a
   pydantic `ValidationError` whenever the competition had at least one
   ranked participant (model/schema drift, bug class 11).**
   `OlympicsService._calculate_competition_rankings` built each ranking
   entry with keys `student_id`/`student_name`/`total_score`, but the
   router unpacks those dicts straight into `LeaderboardEntry(**entry_data)`,
   whose schema requires `participant_id`/`participant_name`/`score`
   instead -- so the endpoint raised a 500 on every call once any student
   had a graded entry. Fixed by renaming the dict keys built in
   `_calculate_competition_rankings` to match `LeaderboardEntry` exactly.
"""
import uuid
from datetime import datetime, timedelta

import pytest
from starlette.websockets import WebSocketDisconnect

from src.models.olympics import (
    Competition, CompetitionEvent, CompetitionEntry, CompetitionTeam,
    CompetitionType, CompetitionScope, EventType, CompetitionStatus,
)
from src.models.student import Student
from src.models.user import User
from src.utils.security import get_password_hash

WS_BASE = "/api/v1/olympics"


def _token(headers: dict) -> str:
    return headers["Authorization"].split(" ")[1]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def admin_headers(client, admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution
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
    role = Role(name="Other Admin", slug=f"admin-{uuid.uuid4().hex[:8]}", is_system_role=True)
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
def competition(db_session, institution) -> Competition:
    c = Competition(
        institution_id=institution.id,
        title="Math Olympiad 2026",
        description="Annual math competition",
        competition_type=CompetitionType.MATH_OLYMPIAD,
        scope=CompetitionScope.SCHOOL,
        status=CompetitionStatus.ONGOING,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def event(db_session, institution, competition) -> CompetitionEvent:
    e = CompetitionEvent(
        institution_id=institution.id,
        competition_id=competition.id,
        event_name="Round 1",
        event_type=EventType.INDIVIDUAL,
        max_participants=50,
    )
    db_session.add(e)
    db_session.commit()
    db_session.refresh(e)
    return e


@pytest.fixture
def entry(db_session, institution, event, student) -> CompetitionEntry:
    e = CompetitionEntry(
        institution_id=institution.id,
        event_id=event.id,
        participant_student_id=student.id,
        score=0,
        status="registered",
    )
    db_session.add(e)
    db_session.commit()
    db_session.refresh(e)
    return e


# ---------------------------------------------------------------------------
# Auth + institution scoping
# ---------------------------------------------------------------------------
class TestAuthAndScoping:
    def test_list_competitions_requires_auth(self, client):
        response = client.get("/api/v1/olympics/competitions")
        assert response.status_code in (401, 403)

    def test_create_competition_requires_auth(self, client):
        response = client.post(
            "/api/v1/olympics/competitions",
            json={
                "title": "No Auth Comp",
                "competition_type": "math_olympiad",
                "scope": "school",
                "start_date": datetime.utcnow().isoformat(),
                "end_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            },
        )
        assert response.status_code in (401, 403)

    def test_create_competition_ignores_institution_id_and_uses_caller(
        self, client, auth_headers, admin_user, institution
    ):
        response = client.post(
            "/api/v1/olympics/competitions",
            json={
                "title": "Science Bowl",
                "competition_type": "science_experiment",
                "scope": "class",
                "start_date": datetime.utcnow().isoformat(),
                "end_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["institution_id"] == institution.id

    def test_get_competition_from_other_institution_is_404(
        self, client, other_admin_headers, competition
    ):
        response = client.get(
            f"/api/v1/olympics/competitions/{competition.id}", headers=other_admin_headers
        )
        assert response.status_code == 404

    def test_get_own_competition_succeeds(self, client, auth_headers, competition):
        response = client.get(
            f"/api/v1/olympics/competitions/{competition.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["id"] == competition.id

    def test_update_competition_from_other_institution_is_404(
        self, client, other_admin_headers, competition
    ):
        response = client.put(
            f"/api/v1/olympics/competitions/{competition.id}",
            json={"title": "Hijacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 404

    def test_list_competition_events_from_other_institution_is_404(
        self, client, other_admin_headers, competition
    ):
        response = client.get(
            f"/api/v1/olympics/competitions/{competition.id}/events",
            headers=other_admin_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------
class TestEvents:
    def test_create_and_get_event(self, client, auth_headers, competition):
        response = client.post(
            "/api/v1/olympics/events",
            json={
                "competition_id": competition.id,
                "event_name": "Finals",
                "event_type": "individual",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        event_id = response.json()["id"]

        get_resp = client.get(f"/api/v1/olympics/events/{event_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["event_name"] == "Finals"

    def test_get_event_from_other_institution_is_404(
        self, client, other_admin_headers, event
    ):
        response = client.get(f"/api/v1/olympics/events/{event.id}", headers=other_admin_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Entries: submit + grade
# ---------------------------------------------------------------------------
class TestEntriesSubmitAndGrade:
    def test_create_entry_submit_and_grade(self, client, auth_headers, event, student):
        create_resp = client.post(
            "/api/v1/olympics/entries",
            json={
                "event_id": event.id,
                "participant_student_id": student.id,
            },
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        entry_id = create_resp.json()["id"]

        submit_resp = client.post(
            "/api/v1/olympics/entries/submit",
            json={
                "entry_id": entry_id,
                "answer_data": {"q1": "42"},
                "time_taken": 120,
            },
            headers=auth_headers,
        )
        assert submit_resp.status_code == 200
        assert submit_resp.json()["status"] == "submitted"

        grade_resp = client.post(
            "/api/v1/olympics/entries/grade",
            json={
                "entry_id": entry_id,
                "score": "95.5",
                "feedback": "Great job",
            },
            headers=auth_headers,
        )
        assert grade_resp.status_code == 200
        assert grade_resp.json()["status"] == "graded"
        assert float(grade_resp.json()["score"]) == 95.5

    def test_submit_answer_for_other_institution_entry_is_404(
        self, client, other_admin_headers, entry
    ):
        response = client.post(
            "/api/v1/olympics/entries/submit",
            json={"entry_id": entry.id, "answer_data": {"q1": "x"}},
            headers=other_admin_headers,
        )
        assert response.status_code == 404

    def test_grade_submission_for_other_institution_entry_is_404(
        self, client, other_admin_headers, entry
    ):
        response = client.post(
            "/api/v1/olympics/entries/grade",
            json={"entry_id": entry.id, "score": "10"},
            headers=other_admin_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Teams + rankings
# ---------------------------------------------------------------------------
class TestTeamsAndRankings:
    def test_create_team_and_calculate_scores(self, client, auth_headers, event, student):
        team_resp = client.post(
            "/api/v1/olympics/teams",
            json={
                "event_id": event.id,
                "team_name": "Team Alpha",
                "members": [student.id],
            },
            headers=auth_headers,
        )
        assert team_resp.status_code == 201
        team_id = team_resp.json()["id"]

        entry_resp = client.post(
            "/api/v1/olympics/entries",
            json={
                "event_id": event.id,
                "participant_student_id": student.id,
                "team_id": team_id,
            },
            headers=auth_headers,
        )
        assert entry_resp.status_code == 201
        entry_id = entry_resp.json()["id"]

        client.post(
            "/api/v1/olympics/entries/grade",
            json={"entry_id": entry_id, "score": "88"},
            headers=auth_headers,
        )

        calc_resp = client.post(
            f"/api/v1/olympics/events/{event.id}/calculate-team-scores", headers=auth_headers
        )
        assert calc_resp.status_code == 200

        team_get = client.get(f"/api/v1/olympics/teams/{team_id}", headers=auth_headers)
        assert float(team_get.json()["total_score"]) == 88.0

    def test_calculate_rankings(self, client, auth_headers, event, entry):
        client.post(
            "/api/v1/olympics/entries/grade",
            json={"entry_id": entry.id, "score": "50"},
            headers=auth_headers,
        )
        response = client.post(
            f"/api/v1/olympics/events/{event.id}/calculate-rankings", headers=auth_headers
        )
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# Leaderboard (persisted + live)
# ---------------------------------------------------------------------------
class TestLeaderboard:
    def test_update_and_get_leaderboard(self, client, auth_headers, competition, event, entry):
        client.post(
            "/api/v1/olympics/entries/grade",
            json={"entry_id": entry.id, "score": "77"},
            headers=auth_headers,
        )

        update_resp = client.post(
            f"/api/v1/olympics/competitions/{competition.id}/leaderboard/update",
            params={"scope": "school"},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200

        get_resp = client.get(
            f"/api/v1/olympics/competitions/{competition.id}/leaderboard",
            params={"scope": "school"},
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["total_participants"] >= 1

    def test_live_score_update_and_leaderboard(self, client, auth_headers, event, student):
        update_resp = client.post(
            f"/api/v1/olympics/events/{event.id}/live-score/update",
            params={"participant_id": student.id, "score": 42.0},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["score"] == 42.0

        live_resp = client.get(
            f"/api/v1/olympics/events/{event.id}/live-leaderboard", headers=auth_headers
        )
        assert live_resp.status_code == 200
        entries = live_resp.json()["entries"]
        assert any(e["participant_id"] == student.id for e in entries)

    def test_live_score_update_for_other_institution_event_is_404(
        self, client, other_admin_headers, event
    ):
        response = client.post(
            f"/api/v1/olympics/events/{event.id}/live-score/update",
            params={"participant_id": 1, "score": 10.0},
            headers=other_admin_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------
class TestCertificates:
    def test_generate_certificates_skips_other_institution_entries(
        self, client, auth_headers, other_admin_headers, entry
    ):
        # entry belongs to `institution`; requesting certificates for it as
        # a caller from a *different* institution must silently skip it
        # rather than generating a certificate for someone else's entry.
        response = client.post(
            "/api/v1/olympics/entries/certificates/generate",
            json={"entry_ids": [entry.id]},
            headers=other_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["certificates"] == []

    def test_generate_certificates_for_own_entry(self, client, auth_headers, entry, db_session):
        entry.score = 100
        db_session.commit()
        response = client.post(
            "/api/v1/olympics/entries/certificates/generate",
            json={"entry_ids": [entry.id]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["certificates"] != []


# ---------------------------------------------------------------------------
# WebSockets
# ---------------------------------------------------------------------------
class TestCompetitionWebSocket:
    def test_connect_with_valid_token_and_echo(self, client, auth_headers, competition):
        with client.websocket_connect(
            f"{WS_BASE}/ws/competition/{competition.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.send_text("hello")
            reply = ws.receive_text()
            assert reply == "Message received: hello"

    def test_connect_with_invalid_token_is_rejected(self, client, competition):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/ws/competition/{competition.id}?token=not-a-real-token"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_to_other_institution_competition_is_rejected(
        self, client, other_admin_headers, competition
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/ws/competition/{competition.id}?token={_token(other_admin_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008

    def test_connect_to_nonexistent_competition_is_rejected(self, client, auth_headers):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/ws/competition/999999?token={_token(auth_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008


class TestEventWebSocket:
    def test_connect_with_valid_token_and_echo(self, client, auth_headers, competition, event):
        with client.websocket_connect(
            f"{WS_BASE}/ws/competition/{competition.id}/event/{event.id}?token={_token(auth_headers)}"
        ) as ws:
            ws.send_text("ping")
            reply = ws.receive_text()
            assert reply == "Message received: ping"

    def test_connect_to_other_institution_event_is_rejected(
        self, client, other_admin_headers, competition, event
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"{WS_BASE}/ws/competition/{competition.id}/event/{event.id}?token={_token(other_admin_headers)}"
            ):
                pass
        assert exc_info.value.code == 1008
