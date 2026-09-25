"""Integration tests for the `goals` router (src/api/v1/goals.py).

Personal SMART goals (create/list/get/update/delete), milestone progress
tracking, and a per-user analytics summary. Every endpoint already had a
real `Depends(get_current_user)`, `GET /analytics` is correctly declared
before the catch-all `GET /{goal_id}` (no route-shadowing).

Bug found and fixed while writing this coverage: `GoalService`'s
`update_milestone_progress`/`complete_milestone` looked up the parent goal
by `goal_id` and returned it as "the result" unconditionally once that
lookup succeeded, but the repository call that actually updates the named
*milestone* (`GoalRepository.update_milestone_progress`/
`complete_milestone`) silently returns `None` with no other side effect
when `milestone_id` doesn't match any milestone under that goal -- that
`None` was never checked. So `PATCH /{goal_id}/milestones/{bad_id}` and
`POST /{goal_id}/milestones/{bad_id}/complete` both returned `200` with the
goal completely unchanged instead of `404`, for any milestone id that
didn't exist (as long as the goal id itself was valid). Fixed by checking
the repository's return value and returning `None` (which the router
already correctly turns into a 404) when the milestone lookup misses.

Also read `goal.py`/`repositories/goal.py` end to end against
`models/goal.py` otherwise -- `GoalStatus`/`MilestoneStatus` are
plain-string-compatible `str, Enum` columns and every string the repository
assigns (`"draft"`/`"active"`/`"failed"`/`"completed"`) matches a real enum
value, all `func.count(...)` calls are separate (no `.filter()` chained onto
them), and `progress_percentage`/`current_value` are always explicitly
int()/float() cast at the boundary that needs it.
"""
from datetime import date, timedelta

import pytest


BASE = "/api/v1/goals"


def _goal_payload(**overrides):
    payload = {
        "title": "Improve Math Grade",
        "description": "Raise my math grade to an A by end of term",
        "type": "performance",
        "specific": "Score above 90% on the next math exam",
        "measurable": "Exam score percentage",
        "achievable": "With 1 hour of daily practice",
        "relevant": "Math is my weakest subject this term",
        "time_bound": "By end of this term",
        "start_date": str(date.today()),
        "target_date": str(date.today() + timedelta(days=60)),
        "milestones": [
            {
                "title": "Complete chapter 1 review",
                "target_date": str(date.today() + timedelta(days=10)),
                "progress": 0,
            }
        ],
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def goal(client, auth_headers):
    response = client.post(BASE, json=_goal_payload(), headers=auth_headers)
    assert response.status_code == 201
    return response.json()


class TestGoalCRUD:
    def test_create_requires_auth(self, client):
        response = client.post(BASE, json=_goal_payload())
        assert response.status_code == 403

    def test_create_goal(self, client, auth_headers):
        response = client.post(BASE, json=_goal_payload(), headers=auth_headers)
        assert response.status_code == 201
        body = response.json()
        assert body["title"] == "Improve Math Grade"
        assert body["type"] == "performance"
        assert len(body["milestones"]) == 1
        # _determine_frontend_status treats any goal whose start_date has
        # already arrived as "in_progress" even at 0% progress (its
        # `progress_percentage > 0` branch and its no-progress-check branch
        # both return IN_PROGRESS) -- "not_started" only applies to a goal
        # whose start_date is still in the future.
        assert body["status"] == "in_progress"
        assert body["progress"] == 0

    def test_create_goal_with_future_start_date_is_not_started(self, client, auth_headers):
        response = client.post(
            BASE,
            json=_goal_payload(
                start_date=str(date.today() + timedelta(days=5)),
                target_date=str(date.today() + timedelta(days=65)),
            ),
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["status"] == "not_started"

    def test_list_goals_requires_auth(self, client):
        response = client.get(BASE)
        assert response.status_code == 403

    def test_list_goals(self, client, auth_headers, goal):
        response = client.get(BASE, headers=auth_headers)
        assert response.status_code == 200
        titles = [g["title"] for g in response.json()]
        assert "Improve Math Grade" in titles

    def test_list_goals_scoped_to_own_user(self, client, auth_headers, goal, teacher_user):
        """A different user's goal list must not include this user's goals
        -- get_goals_by_user filters by user_id, not just institution_id."""
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        teacher_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        response = client.get(BASE, headers=teacher_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_goal(self, client, auth_headers, goal):
        response = client.get(f"{BASE}/{goal['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == goal["id"]

    def test_get_goal_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_goal(self, client, auth_headers, goal):
        response = client.put(
            f"{BASE}/{goal['id']}", json={"title": "Improve Math Grade to A+"}, headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Improve Math Grade to A+"

    def test_update_goal_progress_marks_completed(self, client, auth_headers, goal):
        response = client.put(
            f"{BASE}/{goal['id']}", json={"progress": 100}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert body["progress"] == 100
        assert body["status"] == "completed"
        assert body["completed_date"] is not None

    def test_update_goal_not_found(self, client, auth_headers):
        response = client.put(f"{BASE}/999999", json={"title": "x"}, headers=auth_headers)
        assert response.status_code == 404

    def test_delete_goal(self, client, auth_headers, goal):
        response = client.delete(f"{BASE}/{goal['id']}", headers=auth_headers)
        assert response.status_code == 204

        get_resp = client.get(f"{BASE}/{goal['id']}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_delete_goal_not_found(self, client, auth_headers):
        response = client.delete(f"{BASE}/999999", headers=auth_headers)
        assert response.status_code == 404


class TestMilestones:
    def test_update_milestone_progress(self, client, auth_headers, goal):
        milestone_id = int(goal["milestones"][0]["id"])
        response = client.patch(
            f"{BASE}/{goal['id']}/milestones/{milestone_id}",
            json={"progress": 50},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        milestone = next(m for m in body["milestones"] if int(m["id"]) == milestone_id)
        assert milestone["progress"] == 50
        assert milestone["status"] == "in_progress"
        # Goal-level progress is recalculated as the average of milestones.
        assert body["progress"] == 50

    def test_update_milestone_progress_requires_auth(self, client, goal):
        milestone_id = int(goal["milestones"][0]["id"])
        response = client.patch(
            f"{BASE}/{goal['id']}/milestones/{milestone_id}", json={"progress": 50}
        )
        assert response.status_code == 403

    def test_update_milestone_progress_not_found(self, client, auth_headers, goal):
        response = client.patch(
            f"{BASE}/{goal['id']}/milestones/999999",
            json={"progress": 50},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_complete_milestone(self, client, auth_headers, goal):
        milestone_id = int(goal["milestones"][0]["id"])
        response = client.post(
            f"{BASE}/{goal['id']}/milestones/{milestone_id}/complete", headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        milestone = next(m for m in body["milestones"] if int(m["id"]) == milestone_id)
        assert milestone["status"] == "completed"
        assert milestone["progress"] == 100
        assert body["progress"] == 100
        assert body["status"] == "completed"

    def test_complete_milestone_requires_auth(self, client, goal):
        milestone_id = int(goal["milestones"][0]["id"])
        response = client.post(f"{BASE}/{goal['id']}/milestones/{milestone_id}/complete")
        assert response.status_code == 403

    def test_complete_milestone_not_found(self, client, auth_headers, goal):
        response = client.post(
            f"{BASE}/{goal['id']}/milestones/999999/complete", headers=auth_headers
        )
        assert response.status_code == 404


class TestAnalytics:
    def test_analytics_requires_auth(self, client):
        response = client.get(f"{BASE}/analytics")
        assert response.status_code == 403

    def test_analytics_empty(self, client, auth_headers):
        response = client.get(f"{BASE}/analytics", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total_goals"] == 0
        assert body["completion_rate"] == 0.0
        assert len(body["monthly_progress"]) == 7

    def test_analytics_reflects_created_and_completed_goals(self, client, auth_headers, goal):
        client.put(f"{BASE}/{goal['id']}", json={"progress": 100}, headers=auth_headers)

        response = client.get(f"{BASE}/analytics", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total_goals"] == 1
        assert body["completed_goals"] == 1
        assert body["completion_rate"] == 100.0
        assert body["goals_by_status"]["completed"] == 1

    def test_analytics_route_not_shadowed_by_goal_id_route(self, client, auth_headers):
        """GET /analytics must not be captured by GET /{goal_id} (it is
        declared first, so this is a straightforward non-regression check,
        not a bug found)."""
        response = client.get(f"{BASE}/analytics", headers=auth_headers)
        assert response.status_code == 200
        assert "total_goals" in response.json()
