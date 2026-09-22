import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.student import Student, Parent
from src.models.teacher import Teacher
from src.utils.security import get_password_hash

BASE = "/api/v1/parent-teacher-collab"


# ---------------------------------------------------------------------------
# Fixtures: parent identity (following tests/integration/test_parents_api.py's
# parent_user_with_profile / parent_auth_headers pattern) plus a couple of
# convenience fixtures that build a goal/conference/action-plan/thread up
# front for tests that only need to act on an already-existing row.
# ---------------------------------------------------------------------------


@pytest.fixture
def parent_user_with_profile(
    db_session: Session, institution: Institution, parent_role: Role
) -> tuple[User, Parent]:
    user = User(
        username="collab_parent",
        email="collab_parent@test.com",
        first_name="Collab",
        last_name="Parent",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=parent_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    parent = Parent(
        institution_id=institution.id,
        user_id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone="+1234567890",
        relation_type="mother",
        is_primary_contact=True,
        is_active=True,
    )
    db_session.add(parent)
    db_session.commit()
    db_session.refresh(parent)

    return user, parent


@pytest.fixture
def parent_auth_headers(client: TestClient, parent_user_with_profile: tuple[User, Parent]) -> dict:
    user, _ = parent_user_with_profile
    # Real login (not a hand-crafted JWT) so a matching session exists in
    # the client fixture's fake Redis -- get_current_user needs both.
    response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def teacher_auth_headers(client: TestClient, teacher_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def goal_payload(student: Student, teacher: Teacher, parent_user_with_profile: tuple[User, Parent]) -> dict:
    _, parent = parent_user_with_profile
    return {
        "student_id": student.id,
        "teacher_id": teacher.id,
        "parent_id": parent.id,
        "title": "Improve reading fluency",
        "description": "Daily 15-minute reading practice",
        "category": "academic",
        "measurable_target": "Read at grade level fluently",
        "target_value": "100.00",
        "unit": "words per minute",
        "start_date": str(date.today()),
        "target_date": str(date.today() + timedelta(days=60)),
        "metadata": {"source": "conference"},
    }


@pytest.fixture
def created_goal(client: TestClient, auth_headers: dict, goal_payload: dict) -> dict:
    response = client.post(f"{BASE}/goals", json=goal_payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def conference_payload(student: Student, teacher: Teacher, parent_user_with_profile: tuple[User, Parent]) -> dict:
    _, parent = parent_user_with_profile
    start = datetime.utcnow() + timedelta(days=3)
    return {
        "student_id": student.id,
        "teacher_id": teacher.id,
        "parent_id": parent.id,
        "title": "Term 1 progress review",
        "description": "Discuss mid-term progress",
        "scheduled_start": start.isoformat(),
        "scheduled_end": (start + timedelta(minutes=30)).isoformat(),
        "location": "Room 12",
        "meeting_type": "video_conference",
        "video_conference_platform": "zoom",
        "agenda": [{"topic": "Attendance", "duration_minutes": 10, "notes": None}],
    }


@pytest.fixture
def action_plan_payload(student: Student, teacher: Teacher, parent_user_with_profile: tuple[User, Parent]) -> dict:
    _, parent = parent_user_with_profile
    return {
        "student_id": student.id,
        "teacher_id": teacher.id,
        "parent_id": parent.id,
        "title": "Reading support plan",
        "description": "Joint plan to support reading",
        "focus_area": "literacy",
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=30)),
        "teacher_commitments": [{"commitment": "Provide weekly reading list", "target_date": str(date.today() + timedelta(days=7))}],
        "parent_commitments": [{"commitment": "Read with child nightly", "target_date": str(date.today() + timedelta(days=7))}],
    }


@pytest.fixture
def thread_payload(student: Student, teacher: Teacher, parent_user_with_profile: tuple[User, Parent]) -> dict:
    _, parent = parent_user_with_profile
    return {
        "student_id": student.id,
        "teacher_id": teacher.id,
        "parent_id": parent.id,
        "subject": "Homework question",
        "translation_enabled": True,
        "parent_preferred_language": "es",
    }


@pytest.mark.integration
class TestCollaborationGoals:
    """Integration tests for /api/v1/parent-teacher-collab/goals, backed
    by src/models/collaboration.py's CollaborationGoal/CollaborationGoalProgress
    (both written this session)."""

    def test_create_goal(self, client: TestClient, auth_headers: dict, created_goal: dict, student: Student):
        assert created_goal["student_id"] == student.id
        assert created_goal["status"] == "proposed"
        assert Decimal(str(created_goal["current_value"])) == Decimal("0")
        assert created_goal["metadata"] == {"source": "conference"}
        assert created_goal["progress_updates"] == []

    def test_list_goals_filtered_by_student(
        self, client: TestClient, auth_headers: dict, created_goal: dict, student: Student
    ):
        response = client.get(f"{BASE}/goals", params={"student_id": student.id}, headers=auth_headers)
        assert response.status_code == 200, response.text
        goals = response.json()
        assert len(goals) == 1
        assert goals[0]["id"] == created_goal["id"]

    def test_get_goal_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get(f"{BASE}/goals/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_teacher_agrees_to_goal(
        self, client: TestClient, teacher_auth_headers: dict, created_goal: dict
    ):
        response = client.post(f"{BASE}/goals/{created_goal['id']}/agree", headers=teacher_auth_headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["goal"]["teacher_agreed_at"] is not None
        assert body["goal"]["parent_agreed_at"] is None
        # Only one side has agreed, so the goal stays proposed.
        assert body["goal"]["status"] == "proposed"

    def test_both_parties_agree_activates_goal(
        self,
        client: TestClient,
        teacher_auth_headers: dict,
        parent_auth_headers: dict,
        created_goal: dict,
    ):
        client.post(f"{BASE}/goals/{created_goal['id']}/agree", headers=teacher_auth_headers)
        response = client.post(f"{BASE}/goals/{created_goal['id']}/agree", headers=parent_auth_headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["goal"]["parent_agreed_at"] is not None
        assert body["goal"]["teacher_agreed_at"] is not None
        assert body["goal"]["status"] == "active"

    def test_add_goal_progress_achieves_target(
        self, client: TestClient, auth_headers: dict, created_goal: dict
    ):
        response = client.post(
            f"{BASE}/goals/{created_goal['id']}/progress",
            json={
                "goal_id": created_goal["id"],
                "new_value": "100.00",
                "notes": "Hit the target",
                "evidence_urls": ["https://example.com/e1"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        progress = response.json()
        assert Decimal(str(progress["previous_value"])) == Decimal("0")
        assert Decimal(str(progress["new_value"])) == Decimal("100.00")
        assert Decimal(str(progress["progress_percentage"])) == Decimal("100.00")

        goal = client.get(f"{BASE}/goals/{created_goal['id']}", headers=auth_headers).json()
        assert goal["status"] == "achieved"
        assert goal["achieved_at"] is not None
        assert len(goal["progress_updates"]) == 1


@pytest.mark.integration
class TestConferences:
    """Integration tests for /api/v1/parent-teacher-collab/conferences,
    backed by src/models/collaboration.py's ParentTeacherConference."""

    def test_schedule_video_conference_gets_real_url(
        self, client: TestClient, auth_headers: dict, conference_payload: dict
    ):
        response = client.post(f"{BASE}/conferences", json=conference_payload, headers=auth_headers)
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["status"] == "scheduled"
        assert body["meeting_type"] == "video_conference"
        # video_conference_url is built from conference.id -- it must be a
        # real numeric id, not the literal string "None".
        assert body["video_conference_url"] == f"https://meet.example.com/{body['id']}"
        assert body["video_conference_id"] == f"meeting-{body['id']}"

    def test_get_conference_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get(f"{BASE}/conferences/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_start_and_complete_conference(
        self, client: TestClient, auth_headers: dict, conference_payload: dict
    ):
        created = client.post(f"{BASE}/conferences", json=conference_payload, headers=auth_headers).json()
        conf_id = created["id"]

        start_resp = client.post(f"{BASE}/conferences/{conf_id}/start", headers=auth_headers)
        assert start_resp.status_code == 200, start_resp.text
        started = start_resp.json()
        assert started["status"] == "in_progress"
        assert started["actual_start"] is not None

        complete_resp = client.post(f"{BASE}/conferences/{conf_id}/complete", headers=auth_headers)
        assert complete_resp.status_code == 200, complete_resp.text
        completed = complete_resp.json()
        assert completed["status"] == "completed"
        assert completed["actual_end"] is not None

    def test_list_conferences_filtered_by_date_range(
        self, client: TestClient, auth_headers: dict, conference_payload: dict
    ):
        client.post(f"{BASE}/conferences", json=conference_payload, headers=auth_headers)
        far_future = (date.today() + timedelta(days=400)).isoformat()
        response = client.get(
            f"{BASE}/conferences",
            params={"from_date": far_future},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []


@pytest.mark.integration
class TestSharedActionPlans:
    """Integration tests for /api/v1/parent-teacher-collab/action-plans and
    its nested teacher-/parent-commitments, backed by
    src/models/collaboration.py's SharedActionPlan/TeacherCommitment/
    ParentCommitment."""

    def test_create_action_plan_with_commitments(
        self, client: TestClient, auth_headers: dict, action_plan_payload: dict
    ):
        response = client.post(f"{BASE}/action-plans", json=action_plan_payload, headers=auth_headers)
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["status"] == "active"
        assert len(body["teacher_commitments"]) == 1
        assert len(body["parent_commitments"]) == 1
        assert body["teacher_commitments"][0]["commitment"] == "Provide weekly reading list"
        assert body["teacher_commitments"][0]["status"] == "pending"

    def test_get_action_plan_includes_nested_commitments(
        self, client: TestClient, auth_headers: dict, action_plan_payload: dict
    ):
        created = client.post(f"{BASE}/action-plans", json=action_plan_payload, headers=auth_headers).json()
        response = client.get(f"{BASE}/action-plans/{created['id']}", headers=auth_headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert len(body["teacher_commitments"]) == 1
        assert len(body["parent_commitments"]) == 1

    def test_update_teacher_commitment_to_completed_sets_timestamp(
        self, client: TestClient, auth_headers: dict, action_plan_payload: dict
    ):
        created = client.post(f"{BASE}/action-plans", json=action_plan_payload, headers=auth_headers).json()
        commitment_id = created["teacher_commitments"][0]["id"]

        response = client.put(
            f"{BASE}/teacher-commitments/{commitment_id}",
            json={"status": "completed", "progress_notes": "Done"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "completed"
        assert body["completed_at"] is not None

    def test_update_parent_commitment(
        self, client: TestClient, auth_headers: dict, action_plan_payload: dict
    ):
        created = client.post(f"{BASE}/action-plans", json=action_plan_payload, headers=auth_headers).json()
        commitment_id = created["parent_commitments"][0]["id"]

        response = client.put(
            f"{BASE}/parent-commitments/{commitment_id}",
            json={"status": "in_progress"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "in_progress"

    def test_add_teacher_commitment_to_existing_plan(
        self, client: TestClient, auth_headers: dict, action_plan_payload: dict
    ):
        created = client.post(f"{BASE}/action-plans", json=action_plan_payload, headers=auth_headers).json()
        response = client.post(
            f"{BASE}/action-plans/{created['id']}/teacher-commitments",
            json={"commitment": "Send weekly progress email"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["action_plan_id"] == created["id"]


@pytest.mark.integration
class TestHomeLearningActivities:
    """Integration tests for /api/v1/parent-teacher-collab/home-activities,
    backed by src/models/collaboration.py's HomeLearningActivity."""

    def test_create_and_get_home_learning_activity(
        self,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        teacher: Teacher,
        parent_user_with_profile: tuple[User, Parent],
    ):
        _, parent = parent_user_with_profile
        payload = {
            "student_id": student.id,
            "teacher_id": teacher.id,
            "parent_id": parent.id,
            "title": "Read a chapter book",
            "description": "Read 20 minutes and note new vocabulary",
            "learning_objectives": ["fluency", "vocabulary"],
            "estimated_duration_minutes": 20,
            "difficulty_level": "easy",
            "suggested_date": str(date.today()),
        }
        response = client.post(f"{BASE}/home-activities", json=payload, headers=auth_headers)
        assert response.status_code == 201, response.text
        activity = response.json()
        assert activity["student_completed"] is False

        response = client.get(f"{BASE}/home-activities/{activity['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Read a chapter book"
        return activity

    def test_parent_feedback_and_student_completed_set_timestamps(
        self,
        client: TestClient,
        auth_headers: dict,
        parent_auth_headers: dict,
        student: Student,
        teacher: Teacher,
        parent_user_with_profile: tuple[User, Parent],
    ):
        _, parent = parent_user_with_profile
        payload = {
            "student_id": student.id,
            "teacher_id": teacher.id,
            "parent_id": parent.id,
            "title": "Practice multiplication tables",
            "description": "Practice tables 1-10",
        }
        activity = client.post(f"{BASE}/home-activities", json=payload, headers=auth_headers).json()

        response = client.put(
            f"{BASE}/home-activities/{activity['id']}",
            json={"parent_feedback": "Great effort tonight", "student_completed": True},
            headers=parent_auth_headers,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["parent_feedback"] == "Great effort tonight"
        assert body["parent_feedback_at"] is not None
        assert body["student_completed"] is True
        assert body["student_completed_at"] is not None

    def test_list_home_activities_completed_filter(
        self,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        teacher: Teacher,
        parent_user_with_profile: tuple[User, Parent],
    ):
        _, parent = parent_user_with_profile
        payload = {
            "student_id": student.id,
            "teacher_id": teacher.id,
            "parent_id": parent.id,
            "title": "Spelling practice",
            "description": "Practice this week's spelling list",
        }
        client.post(f"{BASE}/home-activities", json=payload, headers=auth_headers)

        response = client.get(
            f"{BASE}/home-activities",
            params={"student_id": student.id, "completed": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []


@pytest.mark.integration
class TestMessageThreads:
    """Integration tests for /api/v1/parent-teacher-collab/message-threads
    and /messages, backed by src/models/collaboration.py's
    ParentTeacherMessageThread/ParentTeacherMessage."""

    def test_create_thread_is_idempotent_for_same_participants(
        self, client: TestClient, auth_headers: dict, thread_payload: dict
    ):
        first = client.post(f"{BASE}/message-threads", json=thread_payload, headers=auth_headers)
        assert first.status_code == 201, first.text
        second = client.post(f"{BASE}/message-threads", json=thread_payload, headers=auth_headers)
        assert second.status_code == 201, second.text
        assert first.json()["id"] == second.json()["id"]

    def test_send_message_with_translation_enabled(
        self, client: TestClient, auth_headers: dict, teacher_auth_headers: dict, thread_payload: dict
    ):
        thread = client.post(f"{BASE}/message-threads", json=thread_payload, headers=auth_headers).json()

        response = client.post(
            f"{BASE}/message-threads/{thread['id']}/messages",
            json={"thread_id": thread["id"], "content": "How is homework going?"},
            headers=teacher_auth_headers,
        )
        assert response.status_code == 200, response.text
        message = response.json()
        assert message["content"] == "How is homework going?"
        assert message["translated_content"] == {"es": "How is homework going?"}
        assert message["is_read"] is False

        thread_after = client.get(f"{BASE}/message-threads/{thread['id']}", headers=auth_headers).json()
        assert thread_after["last_message_at"] is not None

    def test_mark_message_read(
        self, client: TestClient, auth_headers: dict, thread_payload: dict
    ):
        thread = client.post(f"{BASE}/message-threads", json=thread_payload, headers=auth_headers).json()
        message = client.post(
            f"{BASE}/message-threads/{thread['id']}/messages",
            json={"thread_id": thread["id"], "content": "Reminder about the field trip"},
            headers=auth_headers,
        ).json()

        response = client.patch(f"{BASE}/messages/{message['id']}/read", headers=auth_headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["is_read"] is True
        assert body["read_at"] is not None

    def test_get_messages_for_thread(
        self, client: TestClient, auth_headers: dict, thread_payload: dict
    ):
        thread = client.post(f"{BASE}/message-threads", json=thread_payload, headers=auth_headers).json()
        client.post(
            f"{BASE}/message-threads/{thread['id']}/messages",
            json={"thread_id": thread["id"], "content": "First message"},
            headers=auth_headers,
        )
        response = client.get(f"{BASE}/message-threads/{thread['id']}/messages", headers=auth_headers)
        assert response.status_code == 200, response.text
        messages = response.json()
        assert len(messages) == 1
        assert messages[0]["content"] == "First message"


@pytest.mark.integration
class TestCollaborationDocuments:
    """Integration tests for /api/v1/parent-teacher-collab/documents,
    backed by src/models/collaboration.py's CollaborationDocument."""

    @pytest.fixture
    def document_payload(
        self, student: Student, teacher: Teacher, parent_user_with_profile: tuple[User, Parent]
    ) -> dict:
        _, parent = parent_user_with_profile
        return {
            "student_id": student.id,
            "teacher_id": teacher.id,
            "parent_id": parent.id,
            "document_type": "iep",
            "title": "Individualized Education Plan",
            "document_url": "https://example.com/docs/iep.pdf",
            "metadata": {"revision": 1},
        }

    def test_create_document_and_full_signature_flow(
        self,
        client: TestClient,
        auth_headers: dict,
        parent_auth_headers: dict,
        teacher_auth_headers: dict,
        document_payload: dict,
    ):
        created = client.post(f"{BASE}/documents", json=document_payload, headers=auth_headers)
        assert created.status_code == 201, created.text
        doc = created.json()
        assert doc["status"] == "pending"
        assert doc["metadata"] == {"revision": 1}

        parent_signed = client.post(
            f"{BASE}/documents/{doc['id']}/parent-sign",
            json={"signature_url": "https://example.com/sig/parent.png"},
            headers=parent_auth_headers,
        )
        assert parent_signed.status_code == 200, parent_signed.text
        assert parent_signed.json()["status"] == "parent_signed"

        teacher_signed = client.post(
            f"{BASE}/documents/{doc['id']}/teacher-sign",
            json={"signature_url": "https://example.com/sig/teacher.png"},
            headers=teacher_auth_headers,
        )
        assert teacher_signed.status_code == 200, teacher_signed.text
        body = teacher_signed.json()
        assert body["status"] == "fully_signed"
        assert body["parent_signed_at"] is not None
        assert body["teacher_signed_at"] is not None

    def test_reject_document(
        self, client: TestClient, auth_headers: dict, document_payload: dict
    ):
        doc = client.post(f"{BASE}/documents", json=document_payload, headers=auth_headers).json()
        response = client.post(
            f"{BASE}/documents/{doc['id']}/reject",
            json={"rejection_reason": "Needs revision"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "rejected"
        assert body["rejection_reason"] == "Needs revision"
        assert body["rejected_at"] is not None

    def test_get_document_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get(f"{BASE}/documents/999999", headers=auth_headers)
        assert response.status_code == 404
