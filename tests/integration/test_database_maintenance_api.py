import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

import src.redis_client as redis_module
from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.services.database_maintenance_service import DatabaseMaintenanceService


@pytest.fixture
def super_admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    user = User(
        username="dbmaint_superadmin",
        email="dbmaint_superadmin@testschool.com",
        first_name="Super",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_headers(client: TestClient, super_admin_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": super_admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class _FakeRedis:
    """Minimal stand-in for redis.asyncio.Redis, only implementing get()."""

    def __init__(self, value):
        self._value = value

    async def get(self, key):
        return self._value


@pytest.mark.integration
class TestDatabaseMaintenanceAPI:
    """Integration tests for /api/v1/database-maintenance/*, one of the
    routers that existed but was never registered anywhere until
    TESTING_PROGRESS.md's twenty-third pass. Every endpoint requires
    require_super_admin.

    Endpoints that dispatch real Celery tasks via .delay() (vacuum-analyze,
    cleanup-dead-tuples, create-partitions, cleanup-old-partitions, reindex,
    update-statistics, plus the cache-miss branch of index-recommendations/
    slow-queries/table-bloat) aren't exercised end-to-end here -- there's no
    eager-mode broker in this test environment, matching the established
    skip pattern for Celery-backed endpoints elsewhere (see
    test_notifications_api.py). The cache-*hit* branch of those three
    endpoints is instead verified directly against the service with a fake
    Redis client (see test_cache_hit_endpoints_return_cached_data), since it
    doesn't touch Celery at all.

    Found and fixed real bugs while building this coverage:
    - drop_unused_index derived the table name via
      `index_name.split('_')[0]`, which for every index in this codebase's
      own naming convention (idx_*/ix_*) produces "idx"/"ix", not a real
      table -- the endpoint failed for any index name actually returned by
      /index-stats or /duplicate-indexes. Also built its DROP INDEX
      statement by directly interpolating the path-parameter index_name
      into raw SQL. Fixed by looking up the real table name from
      information_schema.STATISTICS via a parameterized query and
      validating index_name against an identifier allow-list before use.
    - get_index_recommendations/get_slow_queries/get_table_bloat_report
      (service) serialized their Redis cache entries with eval()/str() --
      arbitrary code execution if that cache key is ever attacker-writable.
      Fixed to json.dumps()/json.loads().
    - All Redis access in this module (service + the Celery tasks in
      src/tasks/database_maintenance_tasks.py, plus the same pattern found
      by inspection in src/tasks/rate_limit_tasks.py and
      src/services/performance_monitoring_service.py.get_active_users) used
      `from src.redis_client import redis_client`, which binds the name to
      whatever src.redis_client.redis_client equals at IMPORT time (None,
      since the real client is only assigned later by init_redis() on app
      startup) -- Python's `from module import name` copies the value once
      and never sees the module reassign it later. Every one of these calls
      was therefore permanently talking to a `None` cached at import, not
      the live client, in every environment (not just this test one).
      Fixed by importing and calling the `get_redis()` accessor instead,
      which reads the module attribute fresh on every call.
    - Also called `redis_client.get(...)`/`.setex(...)`/`.keys(...)`/etc
      without `await`, even though redis_client is a `redis.asyncio.Redis`
      -- every one of those calls actually returned an unawaited coroutine
      object (never a real result), silently masked wherever the code also
      happened to check truthiness/iterate first. Fixed by making the
      calling methods async and awaiting properly (services), or by adding
      a small async helper run via asyncio.run() from the synchronous
      Celery task bodies, which is safe there since a Celery worker task
      has no already-running event loop (unlike the async FastAPI route
      handler case fixed earlier this session in performance_monitoring)."""

    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/stats", headers=auth_headers
        )
        assert response.status_code == 403

    def test_database_stats(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/stats", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "size" in data["database"]

    def test_partition_info(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/partitions", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_maintenance_schedule(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/schedule", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        # None of the db_maintenance Celery tasks are actually registered in
        # celery_app.conf.beat_schedule under a "db-maintenance-" prefixed
        # key (get_maintenance_schedule filters on that prefix) -- so this
        # always comes back empty. Documenting the current (gap) behavior
        # rather than fabricating an expected schedule.
        assert data["tasks"] == {}

    def test_table_stats_found_and_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/database-maintenance/table-stats/users", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["data"]["table_name"] == "users"

        response = client.get(
            "/api/v1/database-maintenance/table-stats/no_such_table_xyz",
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_index_stats_all_and_filtered(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/database-maintenance/index-stats", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["count"] > 0
        first_index = data["data"][0]["index"]

        response = client.get(
            "/api/v1/database-maintenance/index-stats",
            headers=super_admin_headers,
            params={"index_name": first_index},
        )
        assert response.status_code == 200
        assert all(row["index"] == first_index for row in response.json()["data"])

    def test_table_sizes(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/table-sizes",
            headers=super_admin_headers,
            params={"limit": 5},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["data"]) <= 5

    def test_long_running_queries_empty(
        self, client: TestClient, super_admin_headers: dict
    ):
        # Test connections are all short-lived, so nothing exceeds the
        # (very high) default 60s threshold.
        response = client.get(
            "/api/v1/database-maintenance/long-running-queries",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_duplicate_indexes(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/duplicate-indexes",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_missing_indexes(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/missing-indexes",
            headers=super_admin_headers,
            params={"min_seq_scans": 0},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_bloat_estimate(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/bloat-estimate", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_maintenance_progress(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/database-maintenance/maintenance-progress",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["data"] == []

    def test_reset_query_stats(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/database-maintenance/reset-query-stats",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_drop_unused_index_not_found(
        self, client: TestClient, super_admin_headers: dict
    ):
        # Fixed bug: previously always tried "DROP INDEX <name> ON <name
        # split on '_'>[0]" (nonsense for this codebase's idx_*/ix_* naming
        # convention). Now looks the real table up first and reports a
        # clean "not found" for a nonexistent index instead of a raw SQL
        # error against a bogus table name.
        response = client.delete(
            "/api/v1/database-maintenance/indexes/no_such_index_xyz",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "error"
        assert "not found" in response.json()["message"]

    def test_drop_unused_index_rejects_unsafe_name(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.delete(
            "/api/v1/database-maintenance/indexes/bad;%20DROP%20TABLE%20users",
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "error"
        assert "Invalid index name" in response.json()["message"]

    async def test_cache_hit_endpoints_return_cached_data(self, monkeypatch):
        # Directly verifies the eval()->json.loads() fix and the
        # frozen-None-import->get_redis() fix for all three cache-backed
        # service methods, using a fake async Redis client (real Redis
        # isn't running in this environment, and the module-level
        # redis_client global is never live-patchable via FastAPI's
        # dependency-override mechanism since these methods call get_redis()
        # directly rather than through Depends()).
        recommendations = {
            "generated_at": "2024-01-01T00:00:00",
            "unused_indexes": [],
            "rarely_used_indexes": [],
            "total_indexes_analyzed": 3,
        }
        monkeypatch.setattr(
            redis_module, "redis_client", _FakeRedis(json.dumps(recommendations))
        )
        result = await DatabaseMaintenanceService.get_index_recommendations()
        assert result == {"status": "success", "source": "cache", "data": recommendations}

        slow_queries = {"generated_at": "2024-01-01T00:00:00", "queries": [{"calls": 5}]}
        monkeypatch.setattr(
            redis_module, "redis_client", _FakeRedis(json.dumps(slow_queries))
        )
        result = await DatabaseMaintenanceService.get_slow_queries()
        assert result == {"status": "success", "source": "cache", "data": slow_queries}

        bloat_report = {"generated_at": "2024-01-01T00:00:00", "tables": [{"table": "users"}]}
        monkeypatch.setattr(
            redis_module, "redis_client", _FakeRedis(json.dumps(bloat_report))
        )
        result = await DatabaseMaintenanceService.get_table_bloat_report()
        assert result == {"status": "success", "source": "cache", "data": bloat_report}
