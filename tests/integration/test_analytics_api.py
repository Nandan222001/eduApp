"""Integration tests for the `analytics` router (src/api/v1/analytics.py).

A generic, decoupled client-side analytics/telemetry ingest + aggregate
dashboard API: events, performance (Web Vitals) metrics, user sessions and
feature-usage tracking, plus read-only aggregate dashboards (totals,
feature adoption, user flow, retention cohorts, top events, performance
stats). Unlike almost every other router in this codebase, `user_id`/
`institution_id` here are free-form client-supplied UUID strings, not this
app's real integer User/Institution primary keys -- and none of its
endpoints (including the aggregate dashboards) require authentication. That
looks like a deliberate design choice for a drop-in, provider-agnostic
telemetry surface (comparable to a Segment/Mixpanel-style collector), so
this pass does not add auth requirements; it is flagged in the pass
write-up as worth a follow-up decision rather than fixed unilaterally here.

Bugs found and fixed while writing this coverage:

1. **The entire router was 100% non-functional (bug class 11: async/sync
   mismatch)** -- `analytics.py` and `AnalyticsRepository` were written
   against SQLAlchemy's async API (`AsyncSession`, `select(...)`,
   `await self.db.execute(...)`), but `src.database.get_db` (what
   `Depends(get_db)` actually yields, here as everywhere else in this
   codebase) is a plain synchronous `Session`. `await`ing a sync session's
   `.execute()`/`.commit()`/`.refresh()` return values (never coroutines)
   raised `TypeError: object ... can't be used in 'await' expression` on
   every single endpoint. Same bug shape as `feedback.py` in an earlier
   pass. Fixed by converting both files to the synchronous `Session` API
   (dropping `async`/`await` throughout; the existing `select()`/`execute()`
   Core-style calls needed no other changes since `Session.execute()` is a
   plain sync method with the same signature).
2. **`metadata`/`metadata_json` shadowing (bug class 1)** --
   `PerformanceMetric.metadata_json` is `Column('metadata', JSON)` (the
   Python attribute is `metadata_json` because `metadata` is reserved by
   SQLAlchemy's declarative `Base`), but `create_performance_metric` did
   `PerformanceMetric(**metric.model_dump())`, which included a raw
   `metadata=...` kwarg -- silently setting a shadowing instance attribute
   never persisted to the real column. Fixed by renaming the key to
   `metadata_json` before constructing the model.
3. **`POST /performance` was registered twice at the exact same path**,
   once for the single-metric endpoint (`track_performance_metric`) and
   again for the mobile batch endpoint (`track_performance_batch`).
   FastAPI/Starlette route purely by path+method in registration order with
   no fallback to a later handler when the first match's body fails
   validation, so the batch endpoint was completely unreachable -- every
   request landed on the single-metric handler and 422'd (wrong body
   shape). Fixed by moving the batch endpoint to its own path
   (`POST /performance/batch`), mirroring how the events batch endpoint
   already has its own distinct `/track` path rather than colliding with
   `/events`.
4. **`FeatureUsage.user_id`/every `institution_id`-scoped aggregate filter
   compared a raw `UUID` object against a plain `CHAR(36)` string column**
   -- these columns aren't a SQLAlchemy `Uuid` type, just free-form
   client-supplied string identifiers, and pymysql binds a `UUID` object
   differently in a `WHERE` clause than the plain string it stringified on
   `INSERT`. The comparison silently never matched what was actually
   stored: `track_feature_usage`'s "already tracked this user+feature?"
   lookup always fell through to "not found", creating a brand-new row
   (`usage_count` reset to `1`) on every single call for the same user
   instead of incrementing; and every `institution_id`-filtered dashboard
   endpoint (`/dashboard`, `/features/adoption`, `/user-flow`,
   `/retention/cohorts`, `/events/top`) silently returned wrong (global,
   not institution-scoped) results whenever a real `institution_id` was
   passed. Fixed by normalizing to `str(...)` before every such comparison.
5. **`PATCH /analytics/sessions/{session_id}` for an unknown `session_id`
   raised an unhandled `ResponseValidationError` (500)** instead of a
   clean 404 -- the repository returns `None` for "not found", but
   `response_model=UserSessionResponse` has no `Optional`/`None` case, so
   FastAPI's response serialization crashed trying to validate `None`
   against required fields. Fixed by raising `HTTPException(404)` when the
   repository returns `None`.
6. **The mobile batch endpoints never actually persisted anything** --
   both `track_events_batch` (`POST /track`) and `track_performance_batch`
   built their Pydantic schema objects using field names that don't exist
   on the schemas (`event_category`/`event_properties` instead of the real
   `event_type` (required)/`properties`; `value` instead of the real
   `metric_value` (required)). Every item always raised a
   `ValidationError` for the missing required field, silently swallowed by
   the `except Exception: continue` in the loop, so `processed_count` was
   always `0` regardless of what was submitted. Fixed the field mapping
   for both endpoints (accepting either name for backwards compatibility
   with whatever mobile client shape prompted the original field names).
"""
import uuid

import pytest


# ===========================================================================
# POST /analytics/events
# ===========================================================================
class TestTrackEvent:
    def test_track_event_happy_path(self, client):
        response = client.post(
            "/api/v1/analytics/events",
            json={
                "event_name": "page_view",
                "event_type": "page_view",
                "properties": {"page": "/dashboard"},
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["event_name"] == "page_view"
        assert body["event_type"] == "page_view"
        assert body["properties"] == {"page": "/dashboard"}
        assert "id" in body

    def test_track_event_captures_user_agent_and_ip(self, client):
        response = client.post(
            "/api/v1/analytics/events",
            json={"event_name": "click", "event_type": "click"},
            headers={"User-Agent": "pytest-agent/1.0"},
        )
        assert response.status_code == 201

    def test_track_event_missing_required_field(self, client):
        response = client.post(
            "/api/v1/analytics/events",
            json={"event_name": "click"},  # missing event_type
        )
        assert response.status_code == 422


# ===========================================================================
# POST /analytics/performance
# ===========================================================================
class TestTrackPerformanceMetric:
    def test_track_performance_metric_happy_path(self, client):
        response = client.post(
            "/api/v1/analytics/performance",
            json={
                "metric_name": "LCP",
                "metric_value": 1234.5,
                "rating": "good",
                "metadata": {"browser": "chrome"},
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["metric_name"] == "LCP"
        assert body["metric_value"] == 1234.5
        assert body["rating"] == "good"

    def test_track_performance_metric_missing_required_field(self, client):
        response = client.post(
            "/api/v1/analytics/performance",
            json={"metric_name": "LCP"},  # missing metric_value
        )
        assert response.status_code == 422

    def test_track_performance_metric_persists_metadata_json(self, client, db_session):
        """Regression test for the metadata/metadata_json shadowing bug:
        confirm the metadata dict is actually persisted to the DB column,
        not silently dropped onto a shadowing instance attribute."""
        from src.models.analytics import PerformanceMetric

        response = client.post(
            "/api/v1/analytics/performance",
            json={
                "metric_name": "FID",
                "metric_value": 12.0,
                "metadata": {"connection": "4g"},
            },
        )
        assert response.status_code == 201
        metric_id = response.json()["id"]

        row = db_session.query(PerformanceMetric).filter(
            PerformanceMetric.id == metric_id
        ).first()
        assert row is not None
        assert row.metadata_json == {"connection": "4g"}


# ===========================================================================
# POST /analytics/sessions, PATCH /analytics/sessions/{session_id}
# ===========================================================================
class TestUserSessions:
    def test_create_session(self, client):
        session_id = f"sess-{uuid.uuid4().hex[:12]}"
        response = client.post(
            "/api/v1/analytics/sessions",
            json={"session_id": session_id, "landing_page": "/home", "device_type": "desktop"},
        )
        assert response.status_code == 201
        body = response.json()
        assert body["session_id"] == session_id
        assert body["page_views"] == 0

    def test_create_or_update_session_increments_page_views(self, client):
        session_id = f"sess-{uuid.uuid4().hex[:12]}"
        first = client.post(
            "/api/v1/analytics/sessions",
            json={"session_id": session_id, "landing_page": "/home"},
        )
        assert first.status_code == 201
        assert first.json()["page_views"] == 0

        second = client.post(
            "/api/v1/analytics/sessions",
            json={"session_id": session_id, "landing_page": "/home"},
        )
        assert second.status_code == 201
        assert second.json()["page_views"] == 1
        assert second.json()["id"] == first.json()["id"]

    def test_update_session(self, client):
        session_id = f"sess-{uuid.uuid4().hex[:12]}"
        create_resp = client.post(
            "/api/v1/analytics/sessions",
            json={"session_id": session_id},
        )
        assert create_resp.status_code == 201

        update_resp = client.patch(
            f"/api/v1/analytics/sessions/{session_id}",
            json={"page_views": 5, "exit_page": "/checkout"},
        )
        assert update_resp.status_code == 200
        body = update_resp.json()
        assert body["page_views"] == 5

    def test_update_nonexistent_session_returns_404(self, client):
        response = client.patch(
            "/api/v1/analytics/sessions/does-not-exist",
            json={"page_views": 1},
        )
        assert response.status_code == 404


# ===========================================================================
# POST /analytics/features
# ===========================================================================
class TestFeatureUsage:
    def test_track_feature_usage_first_time(self, client):
        user_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/analytics/features",
            json={"feature_name": "export_report", "user_id": user_id},
        )
        assert response.status_code == 201
        body = response.json()
        assert body["feature_name"] == "export_report"
        assert body["usage_count"] == 1

    def test_track_feature_usage_increments_count(self, client):
        user_id = str(uuid.uuid4())
        payload = {"feature_name": "bulk_export", "user_id": user_id}
        first = client.post("/api/v1/analytics/features", json=payload)
        second = client.post("/api/v1/analytics/features", json=payload)
        assert first.status_code == 201
        assert second.status_code == 201
        assert second.json()["usage_count"] == 2
        assert second.json()["id"] == first.json()["id"]


# ===========================================================================
# POST /analytics/batch
# ===========================================================================
class TestBatchAnalytics:
    def test_track_batch_analytics(self, client):
        response = client.post(
            "/api/v1/analytics/batch",
            json={
                "events": [
                    {"event_name": "view", "event_type": "page_view"},
                    {"event_name": "click", "event_type": "click"},
                ],
                "performance_metrics": [
                    {"metric_name": "TTFB", "metric_value": 100.0},
                ],
            },
        )
        assert response.status_code == 202
        body = response.json()
        assert body["status"] == "accepted"
        assert body["events_count"] == 2
        assert body["metrics_count"] == 1

    def test_track_batch_analytics_empty(self, client):
        response = client.post("/api/v1/analytics/batch", json={})
        assert response.status_code == 202
        body = response.json()
        assert body["events_count"] == 0
        assert body["metrics_count"] == 0


# ===========================================================================
# POST /analytics/track (mobile events batch) -- regression coverage for
# the field-name-mapping bug that made this endpoint always process 0 items.
# ===========================================================================
class TestMobileEventsTrack:
    def test_track_events_batch_persists_events(self, client, db_session):
        from src.models.analytics import AnalyticsEvent

        response = client.post(
            "/api/v1/analytics/track",
            json={
                "events": [
                    {
                        "event_name": "app_open",
                        "event_type": "lifecycle",
                        "properties": {"cold_start": True},
                    },
                    {
                        "event_name": "screen_view",
                        "event_type": "navigation",
                    },
                ]
            },
        )
        assert response.status_code == 202
        body = response.json()
        assert body["total_count"] == 2
        assert body["processed_count"] == 2  # regression: used to always be 0

        count = db_session.query(AnalyticsEvent).filter(
            AnalyticsEvent.event_name.in_(["app_open", "screen_view"])
        ).count()
        assert count == 2

    def test_track_events_batch_accepts_legacy_category_field_name(self, client):
        """Mobile clients may still send `event_category`/`event_properties`
        -- the fix accepts either name for backwards compatibility."""
        response = client.post(
            "/api/v1/analytics/track",
            json={
                "events": [
                    {
                        "event_name": "legacy_event",
                        "event_category": "legacy",
                        "event_properties": {"legacy": True},
                    },
                ]
            },
        )
        assert response.status_code == 202
        assert response.json()["processed_count"] == 1

    def test_track_events_batch_skips_invalid_items(self, client):
        response = client.post(
            "/api/v1/analytics/track",
            json={
                "events": [
                    {"event_name": "no_type_at_all"},  # still invalid: no event_type anywhere
                    {"event_name": "valid_event", "event_type": "custom"},
                ]
            },
        )
        assert response.status_code == 202
        body = response.json()
        assert body["total_count"] == 2
        assert body["processed_count"] == 1


# ===========================================================================
# POST /analytics/performance/batch (mobile performance batch) --
# regression coverage for both the route-shadowing bug and the field-name-
# mapping bug.
# ===========================================================================
class TestMobilePerformanceTrack:
    def test_performance_batch_is_its_own_reachable_route(self, client):
        response = client.post(
            "/api/v1/analytics/performance/batch",
            json={"metrics": [{"metric_name": "CLS", "metric_value": 0.05}]},
        )
        assert response.status_code == 202
        body = response.json()
        assert body["processed_count"] == 1  # regression: used to always be 0

    def test_single_performance_endpoint_still_reachable(self, client):
        """The old duplicate-path bug meant the single-metric handler always
        won at `POST /performance` -- confirm it's still reachable and still
        behaves like a single-metric create, not a batch, now that the
        batch endpoint has moved off that path."""
        response = client.post(
            "/api/v1/analytics/performance",
            json={"metric_name": "INP", "metric_value": 50.0},
        )
        assert response.status_code == 201
        assert response.json()["metric_name"] == "INP"

    def test_performance_batch_accepts_legacy_value_field_name(self, client):
        response = client.post(
            "/api/v1/analytics/performance/batch",
            json={"metrics": [{"metric_name": "FCP", "value": 800.0}]},
        )
        assert response.status_code == 202
        assert response.json()["processed_count"] == 1

    def test_performance_batch_skips_invalid_items(self, client):
        response = client.post(
            "/api/v1/analytics/performance/batch",
            json={
                "metrics": [
                    {"metric_name": "no_value_anywhere"},
                    {"metric_name": "TTFB", "metric_value": 42.0},
                ]
            },
        )
        assert response.status_code == 202
        body = response.json()
        assert body["total_count"] == 2
        assert body["processed_count"] == 1


# ===========================================================================
# GET /analytics/dashboard and other aggregate stats endpoints
# ===========================================================================
class TestDashboardAndAggregates:
    def _seed_session(self, client, page_views=3):
        session_id = f"sess-{uuid.uuid4().hex[:12]}"
        user_id = str(uuid.uuid4())
        client.post(
            "/api/v1/analytics/sessions",
            json={
                "session_id": session_id,
                "user_id": user_id,
                "landing_page": "/home",
            },
        )
        client.patch(
            f"/api/v1/analytics/sessions/{session_id}",
            json={"page_views": page_views},
        )
        return session_id, user_id

    def test_get_dashboard_stats(self, client):
        self._seed_session(client)
        response = client.get("/api/v1/analytics/dashboard")
        assert response.status_code == 200
        body = response.json()
        assert "total_users" in body
        assert "avg_session_duration" in body
        assert isinstance(body["total_sessions"], int)

    def test_get_feature_adoption(self, client):
        user_id = str(uuid.uuid4())
        client.post(
            "/api/v1/analytics/features",
            json={"feature_name": "adoption_test_feature", "user_id": user_id},
        )
        response = client.get("/api/v1/analytics/features/adoption")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        names = [item["feature_name"] for item in body]
        assert "adoption_test_feature" in names

    def test_get_user_flow(self, client):
        self._seed_session(client)
        response = client.get("/api/v1/analytics/user-flow")
        assert response.status_code == 200
        body = response.json()
        assert "nodes" in body
        assert "total_sessions" in body

    def test_get_retention_cohorts(self, client):
        response = client.get("/api/v1/analytics/retention/cohorts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_top_events(self, client):
        client.post(
            "/api/v1/analytics/events",
            json={"event_name": "top_event_test", "event_type": "custom"},
        )
        response = client.get("/api/v1/analytics/events/top")
        assert response.status_code == 200
        body = response.json()
        names = [item["event_name"] for item in body]
        assert "top_event_test" in names

    def test_get_performance_stats(self, client):
        client.post(
            "/api/v1/analytics/performance",
            json={"metric_name": "stats_test_metric", "metric_value": 99.0, "rating": "good"},
        )
        response = client.get(
            "/api/v1/analytics/performance/stats",
            params={"metric_name": "stats_test_metric"},
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["metric_name"] == "stats_test_metric"
        assert body[0]["good_count"] == 1

    def test_get_performance_stats_no_matches(self, client):
        response = client.get(
            "/api/v1/analytics/performance/stats",
            params={"metric_name": "does-not-exist-metric"},
        )
        assert response.status_code == 200
        assert response.json() == []
