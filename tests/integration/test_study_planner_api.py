"""Integration tests for the `study_planner` router (src/api/v1/study_planner.py).

Study plans, weak-area tracking, daily tasks (with adaptive rescheduling),
topic assignments, progress tracking, and calendar sync.

This router's own diff (institution-access checks on every endpoint, plus
the `metadata`/`metadata_json` write-side shadowing fix in
`study_planner_repository.py`) was already complete and correct before this
pass, verified by reading the whole router and repository end-to-end.

Real bug found and fixed while writing this coverage (not previously caught
by a diff review alone, since it only manifests when an endpoint's response
is actually serialized):

1. **`metadata`/`metadata_json` shadowing on the *read* side, in
   `src/schemas/study_planner.py`** -- `StudyPlanResponse`,
   `DailyStudyTaskResponse`, and (in `src/schemas/weakness_detection.py`)
   `QuestionRecommendationResponse` all declare a `metadata` field built
   `from_attributes` off a SQLAlchemy ORM object. Every declarative model
   inherits a class-level `metadata` attribute (the `MetaData` registry)
   from `Base`, which shadows the real, mapped `metadata_json` column for
   any instance that hasn't set an *instance* attribute literally named
   `metadata` -- so `getattr(obj, "metadata")` (exactly what
   `from_attributes` validation does for a field named `metadata`) always
   returned that `MetaData()` object, never the actual JSON value. This
   raised `pydantic_core.ValidationError: Input should be a valid
   dictionary` on **every single call** to any endpoint returning a
   `StudyPlanResponse` or `DailyStudyTaskResponse` -- i.e. nearly this
   entire router (`POST/GET/PATCH /plans`, `POST /plans/generate`,
   `POST/GET/PATCH /tasks`, `POST /tasks/daily`, `POST /tasks/complete`,
   `POST /tasks/reschedule`, `POST /tasks/adaptive-reschedule`, `POST
   /calendar/sync`) -- unconditionally, regardless of whether
   `metadata_json` was even populated. Fixed with a shared
   `model_validator(mode="before")` that reads the real mapped columns
   (including `metadata_json` under the `metadata` key) before pydantic's
   own attribute extraction ever sees the object.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest

from src.models.institution import Institution
from src.models.study_planner import (
    StudyPlan, WeakArea, DailyStudyTask, TopicAssignment, StudyProgress,
    StudyPlanStatus, TaskStatus, TaskPriority
)


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def other_institution(db_session):
    import uuid
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
def study_plan(db_session, institution, student) -> StudyPlan:
    plan = StudyPlan(
        institution_id=institution.id,
        student_id=student.id,
        name="JEE Prep Plan",
        description="Preparation plan",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        hours_per_day=Decimal("3.0"),
        status=StudyPlanStatus.ACTIVE,
        calendar_sync_enabled=False,
        adaptive_rescheduling_enabled=True,
    )
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)
    return plan


@pytest.fixture
def weak_area(db_session, institution, student, subject) -> WeakArea:
    wa = WeakArea(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        weakness_score=Decimal("70.0"),
        average_score=Decimal("50.0"),
        attempts_count=2,
        is_resolved=False,
    )
    db_session.add(wa)
    db_session.commit()
    db_session.refresh(wa)
    return wa


@pytest.fixture
def daily_task(db_session, institution, student, study_plan, subject) -> DailyStudyTask:
    task = DailyStudyTask(
        institution_id=institution.id,
        study_plan_id=study_plan.id,
        student_id=student.id,
        task_date=date.today(),
        subject_id=subject.id,
        title="Review Algebra",
        priority=TaskPriority.MEDIUM,
        estimated_duration_minutes=60,
        status=TaskStatus.PENDING,
        completion_percentage=Decimal("0"),
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    return task


@pytest.fixture
def topic_assignment(db_session, institution, study_plan, subject) -> TopicAssignment:
    ta = TopicAssignment(
        institution_id=institution.id,
        study_plan_id=study_plan.id,
        subject_id=subject.id,
        priority_score=Decimal("75.0"),
        allocated_hours=Decimal("5.0"),
        completed_hours=Decimal("0"),
        is_completed=False,
    )
    db_session.add(ta)
    db_session.commit()
    db_session.refresh(ta)
    return ta


# ---------------------------------------------------------------------------
# Auth / institution access
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestAuthAndInstitutionAccess:
    def test_list_plans_requires_auth(self, client, institution):
        response = client.get(
            "/api/v1/study-planner/plans", params={"institution_id": institution.id}
        )
        assert response.status_code in (401, 403)

    def test_list_plans_cross_institution_403(self, client, auth_headers, other_institution):
        response = client.get(
            "/api/v1/study-planner/plans", headers=auth_headers,
            params={"institution_id": other_institution.id},
        )
        assert response.status_code == 403

    def test_create_plan_cross_institution_403(self, client, auth_headers, other_institution, student):
        response = client.post(
            "/api/v1/study-planner/plans",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "student_id": student.id,
                "name": "X",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=10)),
            },
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Study plans
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestStudyPlans:
    def test_create_plan_with_metadata_round_trips(self, client, auth_headers, institution, student):
        """Regression test for both the write-side (`create_study_plan`
        popping `metadata` before the constructor) and read-side
        (`StudyPlanResponse`'s `metadata`/`MetaData` shadowing) fixes."""
        response = client.post(
            "/api/v1/study-planner/plans",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "name": "Board Exam Plan",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=20)),
                "hours_per_day": 2.5,
                "metadata": {"source": "manual", "priority": 1},
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["name"] == "Board Exam Plan"
        assert data["metadata"] == {"source": "manual", "priority": 1}
        assert data["status"] == "draft"

    def test_get_plan(self, client, auth_headers, institution, study_plan):
        response = client.get(
            f"/api/v1/study-planner/plans/{study_plan.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["id"] == study_plan.id

    def test_get_plan_not_found(self, client, auth_headers, institution):
        response = client.get(
            "/api/v1/study-planner/plans/999999",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 404

    def test_list_plans(self, client, auth_headers, institution, study_plan):
        response = client.get(
            "/api/v1/study-planner/plans",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        ids = [p["id"] for p in response.json()]
        assert study_plan.id in ids

    def test_update_plan(self, client, auth_headers, institution, study_plan):
        response = client.patch(
            f"/api/v1/study-planner/plans/{study_plan.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"name": "Updated Plan Name", "metadata": {"revised": True}},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["name"] == "Updated Plan Name"
        assert data["metadata"] == {"revised": True}

    def test_delete_plan(self, client, auth_headers, institution, study_plan):
        response = client.delete(
            f"/api/v1/study-planner/plans/{study_plan.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 204

        get_response = client.get(
            f"/api/v1/study-planner/plans/{study_plan.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert get_response.status_code == 404

    def test_generate_study_plan(self, client, auth_headers, institution, student, weak_area):
        response = client.post(
            "/api/v1/study-planner/plans/generate",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "student_id": student.id,
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=6)),
                "hours_per_day": 2,
                "include_weekends": True,
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["study_plan"]["status"] == "active"
        assert len(data["topic_assignments"]) >= 1
        assert len(data["daily_tasks"]) >= 1
        assert data["summary"]["total_topics"] == len(data["topic_assignments"])


# ---------------------------------------------------------------------------
# Weak areas
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestWeakAreas:
    def test_create_weak_area(self, client, auth_headers, institution, student, subject):
        response = client.post(
            "/api/v1/study-planner/weak-areas",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "subject_id": subject.id,
                "weakness_score": 65.0,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["weakness_score"] == "65.00" or float(response.json()["weakness_score"]) == 65.0

    def test_list_weak_areas(self, client, auth_headers, institution, weak_area):
        response = client.get(
            "/api/v1/study-planner/weak-areas",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        ids = [w["id"] for w in response.json()]
        assert weak_area.id in ids

    def test_update_weak_area(self, client, auth_headers, institution, weak_area):
        response = client.patch(
            f"/api/v1/study-planner/weak-areas/{weak_area.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"is_resolved": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_resolved"] is True
        assert data["resolved_at"] is not None


# ---------------------------------------------------------------------------
# Topics prioritization
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestTopicPrioritization:
    def test_prioritize_topics(self, client, auth_headers, institution, student, weak_area):
        response = client.post(
            "/api/v1/study-planner/topics/prioritize",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"student_id": student.id, "include_weak_areas_only": True},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_topics"] == 1
        assert data["priorities"][0]["subject_id"] == weak_area.subject_id


# ---------------------------------------------------------------------------
# Daily tasks
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestDailyTasks:
    def test_create_task(self, client, auth_headers, institution, study_plan, student, subject):
        response = client.post(
            "/api/v1/study-planner/tasks",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "study_plan_id": study_plan.id,
                "student_id": student.id,
                "task_date": str(date.today()),
                "subject_id": subject.id,
                "title": "Practice Problems",
                "estimated_duration_minutes": 45,
                "metadata": {"source": "manual"},
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["title"] == "Practice Problems"
        assert data["metadata"] == {"source": "manual"}

    def test_get_task(self, client, auth_headers, institution, daily_task):
        response = client.get(
            f"/api/v1/study-planner/tasks/{daily_task.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["id"] == daily_task.id

    def test_list_tasks(self, client, auth_headers, institution, daily_task):
        response = client.get(
            "/api/v1/study-planner/tasks",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        ids = [t["id"] for t in response.json()]
        assert daily_task.id in ids

    def test_get_daily_tasks_summary(self, client, auth_headers, institution, student, daily_task):
        response = client.post(
            "/api/v1/study-planner/tasks/daily",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"student_id": student.id, "date": str(date.today())},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_tasks"] == 1
        assert data["pending_tasks"] == 1

    def test_update_task(self, client, auth_headers, institution, daily_task):
        response = client.patch(
            f"/api/v1/study-planner/tasks/{daily_task.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"status": "in_progress"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"

    def test_complete_task(self, client, auth_headers, institution, daily_task):
        response = client.post(
            "/api/v1/study-planner/tasks/complete",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"task_id": daily_task.id, "actual_duration_minutes": 50, "completion_percentage": 100},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    def test_reschedule_task(self, client, auth_headers, institution, daily_task):
        new_date = date.today() + timedelta(days=3)
        response = client.post(
            "/api/v1/study-planner/tasks/reschedule",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"task_id": daily_task.id, "new_date": str(new_date), "reason": "sick day"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["task_date"] == str(new_date)
        assert data["rescheduled_from_date"] == str(date.today())
        assert data["status"] == "pending"

    def test_adaptive_reschedule(self, client, auth_headers, institution, study_plan, daily_task):
        response = client.post(
            "/api/v1/study-planner/tasks/adaptive-reschedule",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"study_plan_id": study_plan.id, "reason": "fell behind"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "rescheduled_tasks_count" in data


# ---------------------------------------------------------------------------
# Topic assignments
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestTopicAssignments:
    def test_create_topic_assignment(self, client, auth_headers, institution, study_plan, subject):
        response = client.post(
            "/api/v1/study-planner/topic-assignments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "study_plan_id": study_plan.id,
                "subject_id": subject.id,
                "priority_score": 60.0,
                "allocated_hours": 4.0,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["subject_id"] == subject.id

    def test_list_topic_assignments(self, client, auth_headers, institution, topic_assignment):
        response = client.get(
            "/api/v1/study-planner/topic-assignments",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        ids = [t["id"] for t in response.json()]
        assert topic_assignment.id in ids

    def test_update_topic_assignment(self, client, auth_headers, institution, topic_assignment):
        response = client.patch(
            f"/api/v1/study-planner/topic-assignments/{topic_assignment.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"is_completed": True, "completed_hours": 5.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] is True


# ---------------------------------------------------------------------------
# Progress
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestProgress:
    def test_get_study_progress(self, client, auth_headers, institution, study_plan, daily_task):
        # Completing a task computes and stores a StudyProgress row for
        # that day (see `_update_study_progress`).
        client.post(
            "/api/v1/study-planner/tasks/complete",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"task_id": daily_task.id, "completion_percentage": 100},
        )

        response = client.get(
            "/api/v1/study-planner/progress",
            headers=auth_headers,
            params={"institution_id": institution.id, "study_plan_id": study_plan.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["total_tasks"] == 1
        assert data[0]["completed_tasks"] == 1


# ---------------------------------------------------------------------------
# Calendar sync
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestCalendarSync:
    def test_sync_calendar(self, client, auth_headers, institution, study_plan, daily_task):
        response = client.post(
            "/api/v1/study-planner/calendar/sync",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "study_plan_id": study_plan.id,
                "calendar_provider": "google",
                "sync_url": "https://cal.example.com/x",
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["synced_tasks_count"] == 1

    def test_sync_calendar_plan_not_found(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/study-planner/calendar/sync",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "study_plan_id": 999999,
                "calendar_provider": "google",
                "sync_url": "https://cal.example.com/x",
            },
        )
        assert response.status_code == 404
