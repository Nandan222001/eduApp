"""Integration tests for the `notification_analytics` router
(src/api/v1/notification_analytics.py).

Institution-scoped analytics over the notification system: delivery/
engagement/channel/priority/group/timing metrics, a daily timeline,
top-sent notification types, a per-caller engagement summary, per-provider
delivery stats, and a combined dashboard endpoint. Every endpoint already
correctly declared `Depends(get_current_user)` and scopes by
`current_user.institution_id` -- no missing-auth bug here.

Bug found and fixed while writing this coverage:

1. **`func.case(...)` used in place of `sqlalchemy.case(...)`, in all 5
   conditional-aggregation query blocks of `notification_analytics_service.py`
   (`get_delivery_metrics`, `get_priority_breakdown`, `get_group_breakdown`,
   `get_timeline_data`, `get_top_notification_types` -- 11 call sites
   total).** `func.case(...)` doesn't build a SQL `CASE WHEN` expression at
   all -- `func.<name>` treats `<name>` as an arbitrary SQL function to
   call, and a generic SQLAlchemy `Function` doesn't accept an `else_=`
   keyword argument, so every one of these calls raised an immediate
   `TypeError: Function.__init__() got an unexpected keyword argument
   'else_'` while the query was still being *built*, before it ever reached
   the database. In practice this meant `GET /delivery-metrics`,
   `/priority-breakdown`, `/group-breakdown`, `/timeline`, `/top-types`,
   and `GET /dashboard` (which calls all of the above) were **100%
   non-functional, 500ing on every request** regardless of institution or
   data present. `/engagement-metrics`, `/timing-metrics`, `/user-engagement`
   and `/provider-stats` don't use this pattern and were already correct.
   Fixed by importing `case` from `sqlalchemy` directly and replacing all
   11 `func.case(` call sites with `case(` (confirmed the resulting SQL is
   now a real `CASE WHEN ... THEN ... ELSE ... END` expression).

Read the model (`src/models/notification.py`: `Notification`,
`NotificationEngagement`, `NotificationDelivery`) field-by-field against
every column referenced in the service -- no further drift found, and no
Decimal-under-`Dict[str,Any]` issue either (every returned metric is a
plain Python `int`/`float` from `len()`/`round()`/arithmetic, not a raw
`func.sum()` scalar).
"""
from datetime import datetime, timedelta

import pytest

from src.models.notification import (
    Notification,
    NotificationEngagement,
    NotificationDelivery,
    NotificationStatus,
    NotificationChannel,
    NotificationPriority,
    NotificationGroup,
)


def _make_notification(db_session, institution, user, **overrides):
    # created_at is backdated a few seconds: a MySQL DATETIME column with no
    # fractional-seconds precision rounds an inserted datetime.utcnow() UP
    # to the next second (per MySQL's rounding rules for a fsp=0 column),
    # which can push a just-created row's stored created_at a moment past
    # the `end_date = datetime.utcnow()` the router computes when the test
    # immediately queries it -- a flaky BETWEEN-filter false negative, not a
    # real app bug (see AGENTS/TESTING_PROGRESS bug class 5). Backdating the
    # fixture timestamp is the correct fix, not touching the app's query.
    defaults = dict(
        institution_id=institution.id,
        user_id=user.id,
        title="Test notification",
        message="Test message",
        notification_type="assignment_due",
        notification_group=NotificationGroup.ACADEMIC.value,
        priority=NotificationPriority.MEDIUM.value,
        channel=NotificationChannel.IN_APP.value,
        status=NotificationStatus.SENT.value,
        created_at=datetime.utcnow() - timedelta(seconds=5),
    )
    defaults.update(overrides)
    notif = Notification(**defaults)
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)
    return notif


class TestDeliveryMetrics:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/notification-analytics/delivery-metrics")
        assert response.status_code == 403

    def test_delivery_metrics_counts(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, status=NotificationStatus.SENT.value)
        _make_notification(db_session, institution, admin_user, status=NotificationStatus.SENT.value)
        _make_notification(db_session, institution, admin_user, status=NotificationStatus.FAILED.value)

        response = client.get(
            "/api/v1/notification-analytics/delivery-metrics",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total"] == 3
        assert data["delivered"] == 2
        assert data["failed"] == 1

    def test_delivery_metrics_channel_filter(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, channel=NotificationChannel.EMAIL.value)
        _make_notification(db_session, institution, admin_user, channel=NotificationChannel.SMS.value)

        response = client.get(
            "/api/v1/notification-analytics/delivery-metrics",
            params={"channel": NotificationChannel.EMAIL.value},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1


class TestEngagementMetrics:
    def test_engagement_metrics(self, client, auth_headers, db_session, institution, admin_user):
        notif = _make_notification(
            db_session, institution, admin_user,
            status=NotificationStatus.SENT.value,
            read_at=datetime.utcnow(),
        )
        engagement = NotificationEngagement(
            notification_id=notif.id,
            user_id=admin_user.id,
            action="clicked",
        )
        db_session.add(engagement)
        db_session.commit()

        response = client.get(
            "/api/v1/notification-analytics/engagement-metrics",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_sent"] == 1
        assert data["total_read"] == 1
        assert data["total_clicked"] == 1
        assert data["unique_clickers"] == 1


class TestChannelPriorityGroupBreakdown:
    def test_channel_breakdown_structure(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, channel=NotificationChannel.EMAIL.value)

        response = client.get(
            "/api/v1/notification-analytics/channel-breakdown",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert set(NotificationChannel) == {NotificationChannel(k) for k in data.keys()}
        assert data[NotificationChannel.EMAIL.value]["total"] == 1

    def test_priority_breakdown_structure(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, priority=NotificationPriority.HIGH.value)

        response = client.get(
            "/api/v1/notification-analytics/priority-breakdown",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data[NotificationPriority.HIGH.value]["total"] == 1

    def test_group_breakdown_structure(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, notification_group=NotificationGroup.FEES.value)

        response = client.get(
            "/api/v1/notification-analytics/group-breakdown",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data[NotificationGroup.FEES.value]["total"] == 1


class TestTimingMetrics:
    def test_timing_metrics(self, client, auth_headers, db_session, institution, admin_user):
        created = datetime.utcnow() - timedelta(days=1)
        _make_notification(
            db_session, institution, admin_user,
            created_at=created,
            sent_at=created + timedelta(minutes=5),
        )
        response = client.get(
            "/api/v1/notification-analytics/timing-metrics",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["avg_delivery_time_seconds"] >= 0


class TestTimeline:
    def test_timeline_returns_daily_buckets(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, status=NotificationStatus.SENT.value)

        response = client.get(
            "/api/v1/notification-analytics/timeline",
            params={"granularity": "day"},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        total_across_days = sum(day["total"] for day in data)
        assert total_across_days == 1


class TestTopTypes:
    def test_top_notification_types(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, notification_type="assignment_due")
        _make_notification(db_session, institution, admin_user, notification_type="assignment_due")
        _make_notification(db_session, institution, admin_user, notification_type="grade_posted")

        response = client.get(
            "/api/v1/notification-analytics/top-types",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data[0]["notification_type"] == "assignment_due"
        assert data[0]["count"] == 2


class TestUserEngagement:
    def test_user_engagement_summary(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user, read_at=datetime.utcnow())

        response = client.get(
            "/api/v1/notification-analytics/user-engagement",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_received"] == 1
        assert data["total_read"] == 1


class TestProviderStats:
    def test_provider_stats(self, client, auth_headers, db_session, institution, admin_user):
        notif = _make_notification(db_session, institution, admin_user)
        delivery = NotificationDelivery(
            notification_id=notif.id,
            channel=NotificationChannel.EMAIL.value,
            status="sent",
        )
        db_session.add(delivery)
        db_session.commit()

        response = client.get(
            "/api/v1/notification-analytics/provider-stats",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data[NotificationChannel.EMAIL.value]["total"] == 1
        assert data[NotificationChannel.EMAIL.value]["sent"] == 1


class TestDashboard:
    def test_dashboard_combines_all_sections(self, client, auth_headers, db_session, institution, admin_user):
        _make_notification(db_session, institution, admin_user)

        response = client.get(
            "/api/v1/notification-analytics/dashboard",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        for key in (
            "delivery_metrics", "engagement_metrics", "channel_breakdown",
            "priority_breakdown", "group_breakdown", "timing_metrics",
            "top_types", "timeline",
        ):
            assert key in data

    def test_dashboard_requires_auth(self, client):
        response = client.get("/api/v1/notification-analytics/dashboard")
        assert response.status_code == 403
