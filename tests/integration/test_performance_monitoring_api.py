import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.performance_monitoring import (
    APIPerformanceMetric,
    DatabaseQueryMetric,
    CacheMetric,
    PerformanceAlert,
    AlertSeverity,
    AlertStatus,
)
from src.services.performance_monitoring_service import PerformanceMonitoringService


@pytest.fixture
def super_admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    user = User(
        username="perfmon_superadmin",
        email="perfmon_superadmin@testschool.com",
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


@pytest.fixture
def api_metric(db_session: Session) -> APIPerformanceMetric:
    m = APIPerformanceMetric(
        endpoint="/api/v1/assignments",
        method="GET",
        status_code=200,
        response_time_ms=150.0,
        # Explicit timestamp a few seconds in the past: the column has no
        # fractional-seconds precision, so MySQL rounds a just-inserted
        # `datetime.utcnow()` (with microseconds) to the nearest whole
        # second -- which can round *past* the query's own `end_time`
        # (computed a few microseconds later, unrounded) and drop the row
        # from a `BETWEEN` filter. Irrelevant for this endpoint's real
        # windows (hours/days), but flaky for a test inserting and
        # querying within the same instant.
        timestamp=datetime.utcnow() - timedelta(seconds=5),
    )
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)
    return m


@pytest.fixture
def db_query_metrics(db_session: Session) -> list:
    metrics = [
        DatabaseQueryMetric(
            query_hash="abc123",
            query_type="SELECT",
            table_name="assignments",
            execution_time_ms=1200.0,
            rows_affected=50,
            is_slow=True,
            timestamp=datetime.utcnow() - timedelta(seconds=5),
        ),
        DatabaseQueryMetric(
            query_hash="def456",
            query_type="SELECT",
            table_name="assignments",
            execution_time_ms=20.0,
            rows_affected=5,
            is_slow=False,
            timestamp=datetime.utcnow() - timedelta(seconds=5),
        ),
    ]
    db_session.add_all(metrics)
    db_session.commit()
    return metrics


@pytest.fixture
def cache_metrics(db_session: Session) -> list:
    metrics = [
        CacheMetric(
            cache_key_pattern="student:*",
            operation="get",
            hit=True,
            execution_time_ms=2.0,
            value_size_bytes=128,
            timestamp=datetime.utcnow() - timedelta(seconds=5),
        ),
        CacheMetric(
            cache_key_pattern="student:*",
            operation="get",
            hit=False,
            execution_time_ms=3.0,
            value_size_bytes=None,
            timestamp=datetime.utcnow() - timedelta(seconds=5),
        ),
    ]
    db_session.add_all(metrics)
    db_session.commit()
    return metrics


@pytest.fixture
def alert(db_session: Session) -> PerformanceAlert:
    a = PerformanceAlert(
        alert_type="high_response_time",
        severity=AlertSeverity.HIGH,
        title="Slow endpoint detected",
        description="/api/v1/assignments is responding slowly",
        metric_value=2500.0,
        threshold_value=1000.0,
        timestamp=datetime.utcnow() - timedelta(seconds=5),
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.mark.integration
class TestPerformanceMonitoringAPI:
    """Integration tests for /api/v1/performance-monitoring/*, one of the
    routers that existed but was never registered anywhere until
    TESTING_PROGRESS.md's twenty-third pass. Every endpoint requires
    require_super_admin. Resource-utilization/active-users metrics are
    exercised against empty data (their real source, ResourceUtilizationMetric
    rows and Redis session keys, aren't populated by anything in this test
    environment) plus real DB-backed metrics for the API/alerts endpoints."""

    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/performance-monitoring/performance/dashboard", headers=auth_headers)
        assert response.status_code == 403

    def test_dashboard_with_no_data(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/performance-monitoring/performance/dashboard", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["api_performance"]["total_requests"] == 0
        assert data["resource_utilization"]["current_cpu_percent"] == 0.0

    def test_api_performance_with_real_metric(
        self, client: TestClient, super_admin_headers: dict, api_metric: APIPerformanceMetric
    ):
        response = client.get(
            "/api/v1/performance-monitoring/performance/api", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_requests"] == 1
        assert data["avg_response_time_ms"] == 150.0

    def test_database_cache_and_task_queue_performance_empty(
        self, client: TestClient, super_admin_headers: dict
    ):
        for path in ["database", "cache", "tasks"]:
            response = client.get(
                f"/api/v1/performance-monitoring/performance/{path}", headers=super_admin_headers
            )
            assert response.status_code == 200

    def test_database_performance_with_real_metrics(
        self, client: TestClient, super_admin_headers: dict, db_query_metrics: list
    ):
        # Exercises func.sum(func.cast(DatabaseQueryMetric.is_slow, Integer))
        # in _get_slowest_queries -- unlike func.case, func.cast is
        # special-cased by SQLAlchemy and renders as a real CAST(...) AS
        # INTEGER expression, so this is confirmed correct, not a bug.
        response = client.get(
            "/api/v1/performance-monitoring/performance/database", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_queries"] == 2
        assert data["slow_queries_count"] == 1
        slowest = data["slowest_queries"]
        assert len(slowest) == 2
        slow_counts = {q["slow_query_count"] for q in slowest}
        assert slow_counts == {0, 1}

    def test_cache_performance_with_real_metrics(
        self, client: TestClient, super_admin_headers: dict, cache_metrics: list
    ):
        # Exercises func.sum(func.cast(CacheMetric.hit, Integer)) in
        # _get_cache_stats_by_pattern and _get_cache_operations_over_time.
        response = client.get(
            "/api/v1/performance-monitoring/performance/cache", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_operations"] == 2
        assert data["total_hits"] == 1
        assert data["total_misses"] == 1
        assert data["overall_hit_rate"] == 50.0
        pattern_stats = data["cache_stats_by_pattern"]
        assert len(pattern_stats) == 1
        assert pattern_stats[0]["hits"] == 1
        assert pattern_stats[0]["misses"] == 1

    def test_resource_utilization_and_active_users_empty(
        self, client: TestClient, super_admin_headers: dict
    ):
        response = client.get(
            "/api/v1/performance-monitoring/performance/resources", headers=super_admin_headers
        )
        assert response.status_code == 200

        response = client.get(
            "/api/v1/performance-monitoring/performance/active-users", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert response.json()["total_unique_users"] == 0

    def test_alerts_list_acknowledge_and_resolve(
        self, client: TestClient, super_admin_headers: dict, alert: PerformanceAlert
    ):
        response = client.get(
            "/api/v1/performance-monitoring/performance/alerts", headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_alerts"] == 1
        assert data["active_alerts"] == 1
        assert data["alerts_by_severity"]["high"] == 1

        response = client.post(
            "/api/v1/performance-monitoring/performance/alerts/acknowledge",
            headers=super_admin_headers,
            json={"alert_ids": [alert.id]},
        )
        assert response.status_code == 200
        assert response.json()["count"] == 1

        response = client.post(
            "/api/v1/performance-monitoring/performance/alerts/resolve",
            headers=super_admin_headers,
            json={"alert_ids": [alert.id]},
        )
        assert response.status_code == 200

        response = client.get(
            "/api/v1/performance-monitoring/performance/alerts",
            headers=super_admin_headers,
            params={"status": "resolved"},
        )
        assert response.json()["total_alerts"] == 1

    def test_thresholds_get_and_update(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/performance-monitoring/performance/thresholds", headers=super_admin_headers
        )
        assert response.status_code == 200
        thresholds = response.json()
        assert thresholds["api_response_time_warning_ms"] == 1000.0

        response = client.put(
            "/api/v1/performance-monitoring/performance/thresholds",
            headers=super_admin_headers,
            json={"thresholds": thresholds},
        )
        assert response.status_code == 200

    def test_create_alert_persists_metadata(self, db_session: Session):
        # create_alert is called from src/tasks/performance_monitoring_tasks.py
        # (15 call sites) with a `metadata=` kwarg -- the ORM column is
        # `metadata_json` (metadata is reserved on Declarative Base), so
        # passing `metadata=` into the constructor silently shadowed the
        # class attribute instead of writing the real column, discarding
        # the metadata dict on every automated alert this service creates.
        service = PerformanceMonitoringService(db_session)
        created = service.create_alert(
            alert_type="high_error_rate",
            severity=AlertSeverity.CRITICAL,
            title="High error rate",
            description="Error rate exceeded threshold",
            metadata={"endpoint": "/api/v1/exams", "error_rate": 0.42},
        )
        db_session.refresh(created)
        assert created.metadata_json == {"endpoint": "/api/v1/exams", "error_rate": 0.42}
