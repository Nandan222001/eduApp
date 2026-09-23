import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.user import User


@pytest.mark.integration
class TestGamificationAPI:
    """Integration tests for /api/v1/gamification/*, an established,
    pre-existing router (src/api/v1/gamification.py) backed by
    src/services/gamification_service.py -- one of the ~95 registered
    backend routers picked up as part of the broader Phase-2/3 backend
    route-module audit (see TESTING_PROGRESS.md's "twentieth pass").
    No auth dependency exists on this router at all (institution_id/
    user_id are plain query params), matching its own pre-existing
    design -- not something introduced or masked by these tests."""

    def test_badge_create_get_list_update(self, client: TestClient, institution: Institution):
        response = client.post(
            "/api/v1/gamification/badges",
            params={"institution_id": institution.id},
            json={"name": "Perfect Attendance", "badge_type": "attendance", "points_required": 100},
        )
        assert response.status_code == 201
        badge_id = response.json()["id"]

        response = client.get(f"/api/v1/gamification/badges/{badge_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Perfect Attendance"

        response = client.get("/api/v1/gamification/badges", params={"institution_id": institution.id})
        assert response.status_code == 200
        assert any(b["id"] == badge_id for b in response.json())

        response = client.put(
            f"/api/v1/gamification/badges/{badge_id}",
            json={"points_required": 150},
        )
        assert response.status_code == 200
        assert response.json()["points_required"] == 150

    def test_get_nonexistent_badge(self, client: TestClient):
        response = client.get("/api/v1/gamification/badges/999999")
        assert response.status_code == 404

    def test_award_badge_and_get_user_badges(
        self, client: TestClient, institution: Institution, admin_user: User
    ):
        badge = client.post(
            "/api/v1/gamification/badges",
            params={"institution_id": institution.id},
            json={"name": "Top Scorer", "badge_type": "exam"},
        ).json()

        response = client.post(
            "/api/v1/gamification/badges/award",
            params={"institution_id": institution.id},
            json={"user_id": admin_user.id, "badge_id": badge["id"], "points_awarded": 20},
        )
        assert response.status_code == 201
        assert response.json()["points_awarded"] == 20

        # get_user_badges reads UserBadge.metadata_json via a response schema
        # that used to have a bare, unaliased `metadata` field -- a plain
        # SQLAlchemy declarative instance always resolves bare `metadata` to
        # its class-level MetaData registry (never None), so without the
        # alias this 500'd on every real row via a Pydantic ValidationError.
        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/badges",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_points_add_and_history_and_user_points(
        self, client: TestClient, institution: Institution, admin_user: User
    ):
        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/points",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["total_points"] == 0

        response = client.post(
            "/api/v1/gamification/points/add",
            params={"institution_id": institution.id},
            json={"user_id": admin_user.id, "points": 50, "event_type": "assignment_submit"},
        )
        assert response.status_code == 200
        assert response.json()["points_awarded"] == 50

        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/points",
            params={"institution_id": institution.id},
        )
        assert response.json()["total_points"] == 50

        # get_point_history reads PointHistory.metadata_json -- same
        # reserved-name schema bug as get_user_badges above.
        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/point-history",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["points"] == 50

    def test_leaderboard_and_user_stats_and_showcase(
        self, client: TestClient, institution: Institution, admin_user: User
    ):
        client.post(
            "/api/v1/gamification/points/add",
            params={"institution_id": institution.id},
            json={"user_id": admin_user.id, "points": 30, "event_type": "exam_pass"},
        )

        response = client.get(
            "/api/v1/gamification/leaderboard",
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
        )
        assert response.status_code == 200
        assert response.json()["total_users"] >= 1

        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/stats",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["total_points"] == 30

        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/showcase",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["total_points"] == 30

    def test_achievement_create_list_and_user_achievements(
        self, client: TestClient, institution: Institution
    ):
        response = client.post(
            "/api/v1/gamification/achievements",
            params={"institution_id": institution.id},
            json={
                "name": "Marathon Learner",
                "achievement_type": "goal",
                "requirements": {"assignments_completed": 50},
            },
        )
        assert response.status_code == 201

        response = client.get(
            "/api/v1/gamification/achievements", params={"institution_id": institution.id}
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_user_streaks_and_daily_login(
        self, client: TestClient, institution: Institution, admin_user: User
    ):
        # get_user_streaks reads StreakTracker.metadata_json -- same
        # reserved-name schema bug, exercised here with an empty list first.
        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/streaks",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json() == []

        response = client.post(
            f"/api/v1/gamification/users/{admin_user.id}/daily-login",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Daily login recorded"
        assert response.json()["streak"] == 1

        response = client.get(
            f"/api/v1/gamification/users/{admin_user.id}/streaks",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        # Logging in again the same day is a no-op.
        response = client.post(
            f"/api/v1/gamification/users/{admin_user.id}/daily-login",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Already logged in today"

    def test_leaderboard_db_create_list_and_get(self, client: TestClient, institution: Institution):
        response = client.post(
            "/api/v1/gamification/leaderboards",
            params={"institution_id": institution.id},
            json={"name": "Weekly Points", "leaderboard_type": "global", "period": "weekly"},
        )
        assert response.status_code == 201
        leaderboard_id = response.json()["id"]

        response = client.get(
            "/api/v1/gamification/leaderboards", params={"institution_id": institution.id}
        )
        assert response.status_code == 200
        assert any(lb["id"] == leaderboard_id for lb in response.json())

        # get_leaderboard_with_entries returns LeaderboardEntryDBResponse
        # items -- same reserved-name schema bug, exercised here with an
        # empty entries list (none regenerated yet).
        response = client.get(f"/api/v1/gamification/leaderboards/{leaderboard_id}")
        assert response.status_code == 200
        assert response.json()["entries"] == []
