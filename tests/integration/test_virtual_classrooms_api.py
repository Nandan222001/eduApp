import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.teacher import Teacher
from src.models.user import User
from src.models.virtual_classroom import VirtualClassroom, ClassroomStatus


@pytest.fixture
def classroom(db_session: Session, institution: Institution, teacher: Teacher) -> VirtualClassroom:
    """A scheduled classroom, created directly so tests can control its
    state (SCHEDULED/LIVE/ENDED) without going through every endpoint."""
    classroom = VirtualClassroom(
        institution_id=institution.id,
        teacher_id=teacher.id,
        title="Algebra II",
        description="Live algebra review session",
        channel_name=f"classroom_{uuid.uuid4().hex[:12]}",
        scheduled_start_time=datetime.utcnow(),
        scheduled_end_time=datetime.utcnow() + timedelta(hours=1),
        max_participants=50,
        is_recording_enabled=True,
        is_breakout_rooms_enabled=True,
        status=ClassroomStatus.SCHEDULED.value,
    )
    db_session.add(classroom)
    db_session.commit()
    db_session.refresh(classroom)
    return classroom


@pytest.mark.integration
class TestVirtualClassroomsAPI:
    """Integration tests for /api/v1/virtual-classrooms/*, /api/v1/breakout-rooms/*,
    /api/v1/polls/* and /api/v1/quizzes/* (src/api/v1/virtual_classrooms.py),
    backed by src/services/virtual_classroom_service.py and
    src/models/virtual_classroom.py (both written this session, see
    TESTING_PROGRESS.md's "virtual_classrooms" router fix). The router has
    no auth dependency (institution_id/teacher_id/user_id are plain query
    params), matching ml_training's pattern, so no auth_headers are needed."""

    def test_create_classroom(
        self, client: TestClient, institution: Institution, teacher: Teacher
    ):
        response = client.post(
            "/api/v1/virtual-classrooms",
            params={"institution_id": institution.id, "teacher_id": teacher.id},
            json={
                "title": "Physics 101",
                "description": "Intro to mechanics",
                "scheduled_start_time": datetime.utcnow().isoformat(),
                "scheduled_end_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
                "is_recording_enabled": True,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Physics 101"
        assert data["institution_id"] == institution.id
        assert data["teacher_id"] == teacher.id
        assert data["status"] == "scheduled"
        assert data["channel_name"]
        assert data["participant_count"] == 0
        assert data["current_participants"] == 0

    def test_get_classroom(self, client: TestClient, classroom: VirtualClassroom):
        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == classroom.id
        assert data["title"] == "Algebra II"

    def test_get_nonexistent_classroom(self, client: TestClient):
        response = client.get("/api/v1/virtual-classrooms/999999")
        assert response.status_code == 404

    def test_list_classrooms_with_filters(
        self, client: TestClient, classroom: VirtualClassroom, institution: Institution
    ):
        response = client.get(
            "/api/v1/virtual-classrooms",
            params={"institution_id": institution.id, "teacher_id": classroom.teacher_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["id"] == classroom.id for item in data["items"])

    def test_update_classroom(self, client: TestClient, classroom: VirtualClassroom):
        response = client.put(
            f"/api/v1/virtual-classrooms/{classroom.id}",
            json={"title": "Algebra II (Updated)", "max_participants": 75},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Algebra II (Updated)"
        assert data["max_participants"] == 75

    def test_start_and_end_classroom(self, client: TestClient, classroom: VirtualClassroom):
        response = client.post(f"/api/v1/virtual-classrooms/{classroom.id}/start")
        assert response.status_code == 200
        assert response.json()["status"] == "live"

        # Starting an already-live classroom is rejected.
        response = client.post(f"/api/v1/virtual-classrooms/{classroom.id}/start")
        assert response.status_code == 400

        response = client.post(f"/api/v1/virtual-classrooms/{classroom.id}/end")
        assert response.status_code == 200
        assert response.json()["status"] == "ended"

    def test_join_and_leave_classroom(
        self, client: TestClient, classroom: VirtualClassroom, student_user: User
    ):
        client.post(f"/api/v1/virtual-classrooms/{classroom.id}/start")

        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/join",
            json={"user_id": student_user.id, "role": "participant"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["token"]
        assert data["channel_name"] == classroom.channel_name
        assert data["app_id"] == ""
        assert data["participant"]["user_id"] == student_user.id
        assert data["classroom"]["current_participants"] == 1

        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}/participants")
        assert response.status_code == 200
        participants = response.json()
        assert len(participants) == 1
        assert participants[0]["user_id"] == student_user.id

        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/leave",
            params={"user_id": student_user.id},
        )
        assert response.status_code == 200

    def test_join_classroom_not_live_fails(
        self, client: TestClient, classroom: VirtualClassroom, student_user: User
    ):
        # classroom fixture starts out SCHEDULED, not LIVE.
        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/join",
            json={"user_id": student_user.id},
        )
        assert response.status_code == 400

    def test_create_and_list_breakout_rooms(
        self, client: TestClient, classroom: VirtualClassroom, student_user: User, teacher_user: User
    ):
        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/breakout-rooms",
            json={
                "name": "Group A",
                "participant_user_ids": [student_user.id, teacher_user.id],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Group A"
        assert data["status"] == "active"
        assert data["participant_count"] == 2

        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}/breakout-rooms")
        assert response.status_code == 200
        rooms = response.json()
        assert len(rooms) == 1
        assert rooms[0]["participant_count"] == 2

    def test_join_and_close_breakout_room(
        self, client: TestClient, classroom: VirtualClassroom, student_user: User
    ):
        create_resp = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/breakout-rooms",
            json={"name": "Group B", "participant_user_ids": [student_user.id]},
        )
        room_id = create_resp.json()["id"]

        # Regression test: the router used to build this room lookup as
        # `db.query(service.db.query.__self__.__class__).get(breakout_room_id)`
        # -- querying the SQLAlchemy Session class itself as a mapped entity --
        # which raised an error on every call. Now fixed to query BreakoutRoom.
        response = client.post(
            f"/api/v1/breakout-rooms/{room_id}/join",
            params={"user_id": student_user.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["token"]
        assert data["breakout_room"]["id"] == room_id
        assert data["breakout_room"]["participant_count"] == 1

        response = client.post(f"/api/v1/breakout-rooms/{room_id}/close")
        assert response.status_code == 200

        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}/breakout-rooms")
        assert response.json()[0]["status"] == "closed"

    def test_poll_create_respond_and_results(
        self, client: TestClient, classroom: VirtualClassroom, teacher_user: User, student_user: User
    ):
        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/polls",
            params={"user_id": teacher_user.id},
            json={
                "question": "Do you understand quadratics?",
                "options": [{"text": "Yes", "value": "yes"}, {"text": "No", "value": "no"}],
            },
        )
        assert response.status_code == 201
        poll_id = response.json()["id"]
        assert response.json()["status"] == "draft"

        response = client.post(f"/api/v1/polls/{poll_id}/start")
        assert response.status_code == 200
        assert response.json()["status"] == "active"

        response = client.post(
            f"/api/v1/polls/{poll_id}/respond",
            params={"user_id": student_user.id},
            json={"selected_options": ["yes"]},
        )
        assert response.status_code == 200
        assert response.json()["selected_options"] == ["yes"]

        response = client.get(f"/api/v1/polls/{poll_id}/results")
        assert response.status_code == 200
        results = response.json()
        assert results["total_responses"] == 1
        assert results["results"]["yes"]["count"] == 1

        response = client.post(f"/api/v1/polls/{poll_id}/end")
        assert response.status_code == 200
        assert response.json()["status"] == "ended"
        assert response.json()["total_responses"] == 1

    def test_list_classroom_polls_after_ended(
        self, client: TestClient, classroom: VirtualClassroom, teacher_user: User
    ):
        create_resp = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/polls",
            params={"user_id": teacher_user.id},
            json={
                "question": "Ready for the quiz?",
                "options": [{"text": "Yes", "value": "yes"}],
            },
        )
        poll_id = create_resp.json()["id"]
        client.post(f"/api/v1/polls/{poll_id}/start")
        client.post(f"/api/v1/polls/{poll_id}/end")

        # Regression test: get_classroom_polls used to do
        # `if poll.status.value == "ended":` -- but ClassroomPoll.status is a
        # plain String column, not a SQLAlchemy Enum, so `poll.status` comes
        # back as a plain str with no `.value` attribute, raising
        # AttributeError on every call once any poll existed.
        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}/polls")
        assert response.status_code == 200
        polls = response.json()
        assert len(polls) == 1
        assert polls[0]["status"] == "ended"
        assert polls[0]["results"] is not None

    def test_quiz_create_submit_and_end(
        self, client: TestClient, classroom: VirtualClassroom, teacher_user: User, student_user: User
    ):
        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/quizzes",
            params={"user_id": teacher_user.id},
            json={
                "title": "Quick Check",
                "questions": [
                    {
                        "question": "2 + 2 = ?",
                        "type": "short_answer",
                        "correct_answer": "4",
                        "points": 1,
                    },
                    {
                        "question": "Capital of France?",
                        "type": "short_answer",
                        "correct_answer": "Paris",
                        "points": 1,
                    },
                ],
                "passing_score": 50,
            },
        )
        assert response.status_code == 201
        quiz_id = response.json()["id"]
        assert response.json()["total_submissions"] == 0

        response = client.post(f"/api/v1/quizzes/{quiz_id}/start")
        assert response.status_code == 200
        assert response.json()["status"] == "active"

        response = client.post(
            f"/api/v1/quizzes/{quiz_id}/submit",
            params={"user_id": student_user.id},
            json={
                "answers": [
                    {"question_id": "2 + 2 = ?", "answer": "4"},
                    {"question_id": "Capital of France?", "answer": "Paris"},
                ]
            },
        )
        assert response.status_code == 200
        submission = response.json()
        assert submission["score"] == 100
        assert submission["is_passed"] is True
        assert submission["correct_answers"] == 2

        response = client.post(f"/api/v1/quizzes/{quiz_id}/end")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ended"
        assert data["total_submissions"] == 1
        assert data["average_score"] == 100

    def test_save_whiteboard(self, client: TestClient, classroom: VirtualClassroom):
        response = client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/whiteboard",
            json={"session_data": {"strokes": [{"x": 1, "y": 2}]}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["classroom_id"] == classroom.id
        assert data["session_data"] == {"strokes": [{"x": 1, "y": 2}]}

    def test_classroom_analytics(
        self, client: TestClient, classroom: VirtualClassroom, teacher_user: User, student_user: User
    ):
        client.post(f"/api/v1/virtual-classrooms/{classroom.id}/start")
        client.post(
            f"/api/v1/virtual-classrooms/{classroom.id}/join",
            json={"user_id": student_user.id},
        )

        # Regression test: get_classroom_analytics used to return a dict with
        # keys (polls_created, quizzes_created, recordings_count) that don't
        # match the ClassroomAnalytics schema's required fields
        # (peak_concurrent_users, total_messages, poll_engagement_rate,
        # quiz_completion_rate, recording_views) -- `ClassroomAnalytics(**analytics)`
        # raised a pydantic ValidationError on every call.
        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}/analytics")
        assert response.status_code == 200
        data = response.json()
        assert data["classroom_id"] == classroom.id
        assert data["total_participants"] == 1
        assert data["peak_concurrent_users"] == 1
        assert data["total_messages"] == 0
        assert data["poll_engagement_rate"] == 0
        assert data["quiz_completion_rate"] == 0
        assert data["recording_views"] == 0
        assert data["breakout_rooms_created"] == 0

    def test_analytics_nonexistent_classroom(self, client: TestClient):
        response = client.get("/api/v1/virtual-classrooms/999999/analytics")
        assert response.status_code == 400

    def test_start_and_stop_recording(self, client: TestClient, classroom: VirtualClassroom):
        with patch(
            "src.services.agora_service.AgoraService.acquire_recording_resource",
            new_callable=AsyncMock,
        ) as mock_acquire, patch(
            "src.services.agora_service.AgoraService.start_recording",
            new_callable=AsyncMock,
        ) as mock_start:
            mock_acquire.return_value = {"resourceId": "res-123"}
            mock_start.return_value = {"sid": "sid-123"}

            # Regression test: start_recording used to construct
            # `ClassroomRecording(..., metadata={...})`, but the mapped
            # attribute is `metadata_json` (`metadata` is reserved by
            # SQLAlchemy's Declarative Base) -- this raised
            # TypeError: 'metadata' is an invalid keyword argument for
            # ClassroomRecording on every call.
            response = client.post(
                f"/api/v1/virtual-classrooms/{classroom.id}/recordings/start"
            )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "recording"
        assert data["metadata"]["acquire_response"]["resourceId"] == "res-123"
        recording_id = data["id"]

        with patch(
            "src.services.agora_service.AgoraService.stop_recording",
            new_callable=AsyncMock,
        ) as mock_stop:
            mock_stop.return_value = {"stopped": True}

            # Regression test: stop_recording used to read/write
            # `recording.metadata` (the class-level MetaData object, not the
            # stored JSON), and `metadata["stop_response"] = ...` raised
            # TypeError: 'MetaData' object does not support item assignment.
            response = client.post(
                f"/api/v1/virtual-classrooms/recordings/{recording_id}/stop"
            )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processing"
        assert data["metadata"]["stop_response"] == {"stopped": True}

        response = client.get(f"/api/v1/virtual-classrooms/{classroom.id}/recordings")
        assert response.status_code == 200
        assert len(response.json()) == 1
