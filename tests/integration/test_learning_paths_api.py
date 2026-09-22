import uuid
from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.academic import Chapter, Topic, Grade, Subject
from src.models.institution import Institution
from src.models.learning_path import TopicSequence, SpacedRepetitionSchedule
from src.models.role import Role
from src.models.student import Student
from src.models.user import User
from src.utils.security import get_password_hash


def _create_topics(db_session: Session, institution: Institution, subject: Subject, grade: Grade, count: int = 3):
    """Create a chapter and `count` topics under it, for topic-sequence/
    prerequisite/visualization endpoints that need real Topic rows."""
    unique = uuid.uuid4().hex[:8]
    chapter = Chapter(
        institution_id=institution.id,
        subject_id=subject.id,
        grade_id=grade.id,
        name=f"Chapter {unique}",
        is_active=True,
    )
    db_session.add(chapter)
    db_session.commit()
    db_session.refresh(chapter)

    topics = []
    for i in range(count):
        topic = Topic(
            institution_id=institution.id,
            chapter_id=chapter.id,
            name=f"Topic {unique}-{i}",
            is_active=True,
        )
        db_session.add(topic)
        topics.append(topic)
    db_session.commit()
    for t in topics:
        db_session.refresh(t)
    return topics


def _create_learning_path(client: TestClient, headers: dict, student: Student, grade: Grade, **overrides) -> dict:
    payload = {
        "student_id": student.id,
        "grade_id": grade.id,
        "name": "Algebra Mastery Path",
        "description": "A path to master algebra basics",
    }
    payload.update(overrides)
    response = client.post("/api/v1/learning-paths", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.integration
class TestLearningPathsAPI:
    """Integration tests for /api/v1/learning-paths/* (src/api/v1/learning_paths.py),
    backed by src/models/learning_path.py and src/schemas/learning_path.py.

    AI-prediction-driven sequencing (`generate_personalized_sequence`) and
    difficulty adaptation are exercised with their real, local, deterministic
    algorithms (topological sort, SM-2 spaced repetition) -- there is no
    external network/AI-model call in this router to skip, unlike
    Razorpay/Printful in test_merchandise_api.py.
    """

    # ---- create / list / get / update / delete -------------------------

    def test_create_and_get_learning_path(
        self, client: TestClient, auth_headers: dict, student: Student, grade: Grade
    ):
        data = _create_learning_path(client, auth_headers, student, grade)
        assert data["status"] == "active"
        assert data["current_difficulty"] == "beginner"
        assert data["learning_velocity"] == 1.0
        assert data["completion_percentage"] == 0.0
        path_id = data["id"]

        response = client.get(f"/api/v1/learning-paths/{path_id}", headers=auth_headers)
        assert response.status_code == 200
        detail = response.json()
        assert detail["name"] == "Algebra Mastery Path"
        assert detail["milestones"] == []
        assert detail["topic_sequences"] == []

    def test_get_nonexistent_learning_path(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/learning-paths/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_learning_path_other_institution_hidden(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        student: Student, grade: Grade,
    ):
        data = _create_learning_path(client, auth_headers, student, grade)

        # A second institution with its own admin, logged in for real, must
        # not be able to see a learning path scoped to the first institution.
        other = Institution(name="Rival Learning School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        role = Role(name="Admin", slug=f"admin-{uuid.uuid4().hex[:8]}", is_system_role=True)
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        other_email = f"rival-admin-{uuid.uuid4().hex[:8]}@rivalschool.com"
        other_admin = User(
            username=f"rivaladmin{uuid.uuid4().hex[:8]}",
            email=other_email,
            first_name="Rival",
            last_name="Admin",
            hashed_password=get_password_hash("password123"),
            institution_id=other.id,
            role_id=role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(other_admin)
        db_session.commit()

        login = client.post(
            "/api/v1/auth/login", json={"email": other_email, "password": "password123"}
        )
        assert login.status_code == 200, login.text
        other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = client.get(f"/api/v1/learning-paths/{data['id']}", headers=other_headers)
        assert response.status_code == 404

    def test_list_learning_paths_with_filters(
        self, client: TestClient, auth_headers: dict, student: Student, grade: Grade, subject: Subject
    ):
        _create_learning_path(client, auth_headers, student, grade, name="Path A")
        path_b = _create_learning_path(
            client, auth_headers, student, grade, name="Path B", subject_id=subject.id
        )

        response = client.get("/api/v1/learning-paths", headers=auth_headers)
        assert response.status_code == 200
        all_paths = response.json()
        assert len(all_paths) >= 2

        response = client.get(
            "/api/v1/learning-paths", headers=auth_headers, params={"subject_id": subject.id}
        )
        assert response.status_code == 200
        filtered = response.json()
        assert all(p["subject_id"] == subject.id for p in filtered)
        assert any(p["id"] == path_b["id"] for p in filtered)

        response = client.get(
            "/api/v1/learning-paths", headers=auth_headers, params={"status": "active"}
        )
        assert response.status_code == 200
        assert all(p["status"] == "active" for p in response.json())

        response = client.get(
            "/api/v1/learning-paths", headers=auth_headers, params={"status": "completed"}
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_update_learning_path(
        self, client: TestClient, auth_headers: dict, student: Student, grade: Grade
    ):
        data = _create_learning_path(client, auth_headers, student, grade)
        response = client.patch(
            f"/api/v1/learning-paths/{data['id']}",
            headers=auth_headers,
            json={"status": "paused", "name": "Renamed Path"},
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["status"] == "paused"
        assert updated["name"] == "Renamed Path"

    def test_update_nonexistent_learning_path(self, client: TestClient, auth_headers: dict):
        response = client.patch(
            "/api/v1/learning-paths/999999", headers=auth_headers, json={"name": "x"}
        )
        assert response.status_code == 404

    def test_delete_learning_path(
        self, client: TestClient, auth_headers: dict, student: Student, grade: Grade
    ):
        data = _create_learning_path(client, auth_headers, student, grade)
        response = client.delete(f"/api/v1/learning-paths/{data['id']}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/learning-paths/{data['id']}", headers=auth_headers)
        assert response.status_code == 404

    # ---- milestones ------------------------------------------------------

    def test_create_milestone(
        self, client: TestClient, auth_headers: dict, student: Student, grade: Grade
    ):
        path = _create_learning_path(client, auth_headers, student, grade)
        response = client.post(
            f"/api/v1/learning-paths/{path['id']}/milestones",
            headers=auth_headers,
            json={
                "title": "Foundations",
                "milestone_order": 1,
                "required_topic_ids": [1, 2, 3],
                "reward_points": 50,
            },
        )
        assert response.status_code == 201, response.text
        milestone = response.json()
        assert milestone["status"] == "locked"
        assert milestone["reward_points"] == 50
        assert milestone["learning_path_id"] == path["id"]

    # ---- generate personalized sequence (main workflow) -------------------

    def test_generate_personalized_sequence(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, student: Student, grade: Grade, subject: Subject,
    ):
        topics = _create_topics(db_session, institution, subject, grade, count=4)
        response = client.post(
            "/api/v1/learning-paths/generate",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "grade_id": grade.id,
                "subject_id": subject.id,
                "topic_ids": [t.id for t in topics],
                "include_ai_predictions": True,
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert len(data["topic_sequences"]) == 4
        assert len(data["milestones"]) >= 1
        # First topic in sequence should be unlocked, others locked
        unlocked = [ts for ts in data["topic_sequences"] if ts["is_unlocked"]]
        assert len(unlocked) == 1

    # ---- progress / visualization aggregate endpoints ----------------------

    def test_progress_and_visualization_endpoints(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, student: Student, grade: Grade, subject: Subject,
    ):
        topics = _create_topics(db_session, institution, subject, grade, count=2)
        generated = client.post(
            "/api/v1/learning-paths/generate",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "grade_id": grade.id,
                "subject_id": subject.id,
                "topic_ids": [t.id for t in topics],
            },
        ).json()
        path_id = generated["id"]

        response = client.get(f"/api/v1/learning-paths/{path_id}/progress", headers=auth_headers)
        assert response.status_code == 200, response.text
        progress = response.json()
        assert progress["topics_total"] == 2
        assert progress["topics_completed"] == 0
        assert progress["velocity_trend"] == "stable"

        response = client.get(f"/api/v1/learning-paths/{path_id}/visualization", headers=auth_headers)
        assert response.status_code == 200, response.text
        viz = response.json()
        assert len(viz["nodes"]) == 2
        assert viz["progress_summary"]["total_topics"] == 2
        assert viz["progress_summary"]["status"] == "active"

    # ---- mastery update workflow --------------------------------------------

    def test_update_mastery_marks_topic_completed_and_unlocks_next(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, student: Student, grade: Grade, subject: Subject,
    ):
        topics = _create_topics(db_session, institution, subject, grade, count=2)
        generated = client.post(
            "/api/v1/learning-paths/generate",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "grade_id": grade.id,
                "subject_id": subject.id,
                "topic_ids": [t.id for t in topics],
            },
        ).json()
        first_sequence_id = next(
            ts["id"] for ts in generated["topic_sequences"] if ts["sequence_order"] == 1
        )

        # update_mastery blends the new score in as a 70/30 weighted average
        # of the existing mastery_score, so a single call from a 0.0
        # baseline can never cross the 0.9 "mastered" threshold. Seed the
        # sequence close to threshold first (as if several prior sessions
        # had already happened), matching a student on their final review.
        seq = db_session.query(TopicSequence).filter(TopicSequence.id == first_sequence_id).first()
        seq.mastery_score = 0.9
        db_session.commit()

        response = client.post(
            "/api/v1/learning-paths/mastery/update",
            headers=auth_headers,
            json={
                "topic_sequence_id": first_sequence_id,
                "performance_score": 1.0,
                "time_spent_minutes": 20,
                "correct_answers": 10,
                "total_questions": 10,
            },
        )
        assert response.status_code == 200, response.text

        detail = client.get(
            f"/api/v1/learning-paths/{generated['id']}", headers=auth_headers
        ).json()
        first = next(ts for ts in detail["topic_sequences"] if ts["id"] == first_sequence_id)
        assert first["mastery_level"] == "mastered"
        assert first["completed_at"] is not None

        second = next(ts for ts in detail["topic_sequences"] if ts["id"] != first_sequence_id)
        assert second["is_unlocked"] is True

    def test_update_mastery_nonexistent_topic_sequence(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/learning-paths/mastery/update",
            headers=auth_headers,
            json={
                "topic_sequence_id": 999999,
                "performance_score": 0.5,
                "time_spent_minutes": 5,
                "correct_answers": 1,
                "total_questions": 2,
            },
        )
        assert response.status_code == 404

    # ---- performance recording -----------------------------------------------

    def test_record_performance(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, student: Student, grade: Grade, subject: Subject,
    ):
        topics = _create_topics(db_session, institution, subject, grade, count=1)
        generated = client.post(
            "/api/v1/learning-paths/generate",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "grade_id": grade.id,
                "subject_id": subject.id,
                "topic_ids": [t.id for t in topics],
            },
        ).json()
        sequence_id = generated["topic_sequences"][0]["id"]

        response = client.post(
            "/api/v1/learning-paths/performance",
            headers=auth_headers,
            json={
                "topic_sequence_id": sequence_id,
                "quiz_score": 0.8,
                "time_spent_minutes": 15,
                "correct_answers": 8,
                "total_questions": 10,
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["quiz_score"] == 0.8

    # ---- spaced repetition workflow ----------------------------------------

    def test_spaced_repetition_create_review_and_due_listing(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, student: Student, grade: Grade, subject: Subject,
    ):
        topic = _create_topics(db_session, institution, subject, grade, count=1)[0]

        response = client.post(
            "/api/v1/learning-paths/spaced-repetition",
            headers=auth_headers,
            params={"student_id": student.id},
            json={"topic_id": topic.id},
        )
        assert response.status_code == 201, response.text
        schedule = response.json()
        assert schedule["repetition_number"] == 0
        assert schedule["easiness_factor"] == 2.5
        schedule_id = schedule["id"]

        # Not due yet (next_review_date is tomorrow) -> shouldn't appear.
        response = client.get(
            "/api/v1/learning-paths/spaced-repetition/due",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        assert all(s["id"] != schedule_id for s in response.json())

        # Force it into the past directly, mirroring how a real overdue
        # review would look, then confirm the due-listing picks it up.
        db_row = db_session.query(SpacedRepetitionSchedule).filter(
            SpacedRepetitionSchedule.id == schedule_id
        ).first()
        db_row.next_review_date = date.today() - timedelta(days=1)
        db_session.commit()

        response = client.get(
            "/api/v1/learning-paths/spaced-repetition/due",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        assert any(s["id"] == schedule_id for s in response.json())

        response = client.patch(
            f"/api/v1/learning-paths/spaced-repetition/{schedule_id}",
            headers=auth_headers,
            json={"review_quality": 5, "time_spent_minutes": 10, "score": 1.0},
        )
        assert response.status_code == 200, response.text
        updated = response.json()
        assert updated["repetition_number"] == 1
        assert updated["total_reviews"] == 1
        assert updated["last_review_date"] == date.today().isoformat()

    def test_update_spaced_repetition_schedule_not_found(self, client: TestClient, auth_headers: dict):
        response = client.patch(
            "/api/v1/learning-paths/spaced-repetition/999999",
            headers=auth_headers,
            json={"review_quality": 3},
        )
        assert response.status_code == 404

    # ---- velocity calculation / trend ----------------------------------------

    def test_velocity_calculate_and_trend(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, student: Student, grade: Grade, subject: Subject,
    ):
        topics = _create_topics(db_session, institution, subject, grade, count=2)
        generated = client.post(
            "/api/v1/learning-paths/generate",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "grade_id": grade.id,
                "subject_id": subject.id,
                "topic_ids": [t.id for t in topics],
            },
        ).json()
        path_id = generated["id"]

        # Mark a topic sequence completed within the calculation window.
        seq = db_session.query(TopicSequence).filter(
            TopicSequence.learning_path_id == path_id
        ).first()
        seq.completed_at = datetime.utcnow()
        seq.mastery_score = 0.9
        db_session.commit()

        response = client.post(
            f"/api/v1/learning-paths/{path_id}/velocity/calculate",
            headers=auth_headers,
            params={"period_days": 7},
        )
        assert response.status_code == 200, response.text
        velocity = response.json()
        assert velocity["topics_completed"] == 1
        assert velocity["learning_path_id"] == path_id

        response = client.get(
            f"/api/v1/learning-paths/{path_id}/velocity/trend",
            headers=auth_headers,
            params={"periods": 4},
        )
        assert response.status_code == 200
        trend = response.json()
        assert len(trend) == 1
        assert trend[0]["id"] == velocity["id"]

    def test_velocity_calculate_nonexistent_path(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/learning-paths/999999/velocity/calculate", headers=auth_headers
        )
        assert response.status_code == 404

    # ---- prerequisites ---------------------------------------------------------

    def test_prerequisite_relationship_lifecycle(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, subject: Subject, grade: Grade,
    ):
        topic, prereq_topic = _create_topics(db_session, institution, subject, grade, count=2)

        response = client.post(
            "/api/v1/learning-paths/prerequisites",
            headers=auth_headers,
            json={"topic_id": topic.id, "prerequisite_topic_id": prereq_topic.id, "strength": 0.9},
        )
        assert response.status_code == 201, response.text
        relationship = response.json()
        assert relationship["strength"] == 0.9
        rel_id = relationship["id"]

        response = client.get(
            f"/api/v1/learning-paths/prerequisites/{topic.id}", headers=auth_headers
        )
        assert response.status_code == 200
        listed = response.json()
        assert len(listed) == 1
        assert listed[0]["prerequisite_topic_id"] == prereq_topic.id

        response = client.delete(
            f"/api/v1/learning-paths/prerequisites/{rel_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(
            f"/api/v1/learning-paths/prerequisites/{topic.id}", headers=auth_headers
        )
        assert response.json() == []

    def test_self_referencing_prerequisite_rejected(
        self, client: TestClient, auth_headers: dict, db_session: Session,
        institution: Institution, subject: Subject, grade: Grade,
    ):
        topic = _create_topics(db_session, institution, subject, grade, count=1)[0]
        response = client.post(
            "/api/v1/learning-paths/prerequisites",
            headers=auth_headers,
            json={"topic_id": topic.id, "prerequisite_topic_id": topic.id},
        )
        assert response.status_code == 400

    def test_prerequisite_relationship_nonexistent_topic(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/learning-paths/prerequisites",
            headers=auth_headers,
            json={"topic_id": 999998, "prerequisite_topic_id": 999999},
        )
        assert response.status_code == 404
