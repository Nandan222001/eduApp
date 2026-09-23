from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import func, select, and_, desc, case
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from src.models.analytics import (
    AnalyticsEvent,
    PerformanceMetric,
    UserSession,
    FeatureUsage,
    UserRetention,
)
from src.schemas.analytics import (
    AnalyticsEventCreate,
    PerformanceMetricCreate,
    UserSessionCreate,
    UserSessionUpdate,
    FeatureUsageCreate,
)


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_event(self, event: AnalyticsEventCreate) -> AnalyticsEvent:
        """Create a new analytics event."""
        db_event = AnalyticsEvent(**event.model_dump())
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        return db_event

    def create_performance_metric(
        self, metric: PerformanceMetricCreate
    ) -> PerformanceMetric:
        """Create a new performance metric."""
        # `PerformanceMetric.metadata_json` is the real ORM attribute
        # (SQLAlchemy reserves `metadata` on Declarative models -- the DB
        # column itself is named 'metadata' via `Column('metadata', ...)`).
        # The incoming schema field is `metadata`, so it must be renamed
        # before hitting the model constructor: passing `metadata=...`
        # directly would silently shadow `Base.metadata` on the instance
        # instead of persisting to the mapped column.
        data = metric.model_dump()
        data["metadata_json"] = data.pop("metadata", None)
        db_metric = PerformanceMetric(**data)
        self.db.add(db_metric)
        self.db.commit()
        self.db.refresh(db_metric)
        return db_metric

    def create_or_update_session(
        self, session_data: UserSessionCreate
    ) -> UserSession:
        """Create a new user session or update existing one."""
        stmt = select(UserSession).where(
            UserSession.session_id == session_data.session_id
        )
        result = self.db.execute(stmt)
        db_session = result.scalar_one_or_none()

        if db_session:
            db_session.last_seen = datetime.utcnow()
            db_session.page_views += 1
        else:
            db_session = UserSession(**session_data.model_dump())
            self.db.add(db_session)

        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def update_session(
        self, session_id: str, update_data: UserSessionUpdate
    ) -> Optional[UserSession]:
        """Update a user session."""
        stmt = select(UserSession).where(UserSession.session_id == session_id)
        result = self.db.execute(stmt)
        db_session = result.scalar_one_or_none()

        if db_session:
            update_dict = update_data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(db_session, key, value)

            self.db.commit()
            self.db.refresh(db_session)

        return db_session

    def track_feature_usage(
        self, feature_data: FeatureUsageCreate
    ) -> FeatureUsage:
        """Track feature usage, incrementing count if already exists."""
        # `FeatureUsage.user_id` is a plain CHAR(36) column (a free-form
        # client-supplied identifier, not a SQLAlchemy Uuid type), but
        # `feature_data.user_id` is a Python `UUID` object. Comparing a raw
        # UUID object against a CHAR column works fine for an INSERT (the
        # DBAPI stringifies it consistently), but pymysql binds a `UUID`
        # object differently in a WHERE clause than the plain string it
        # actually stored -- the comparison silently never matches, so this
        # lookup always fell through to "not found" and created a brand new
        # row (usage_count reset to 1) on every single call, even for the
        # same user+feature. Comparing against `str(...)` matches what's
        # actually stored.
        user_id_str = str(feature_data.user_id) if feature_data.user_id else None
        stmt = select(FeatureUsage).where(
            and_(
                FeatureUsage.feature_name == feature_data.feature_name,
                FeatureUsage.user_id == user_id_str,
            )
        )
        result = self.db.execute(stmt)
        db_feature = result.scalar_one_or_none()

        if db_feature:
            db_feature.usage_count += 1
            db_feature.last_used_at = datetime.utcnow()
            if feature_data.properties:
                db_feature.properties = feature_data.properties
        else:
            db_feature = FeatureUsage(**feature_data.model_dump())
            self.db.add(db_feature)

        self.db.commit()
        self.db.refresh(db_feature)
        return db_feature

    def get_dashboard_stats(
        self, institution_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get dashboard statistics."""
        # See the identical comment in track_feature_usage: comparing a raw
        # UUID object against these CHAR(36) columns in a WHERE clause never
        # matches what INSERT actually stored, so every institution-scoped
        # call here silently returned institution-wide (or empty) results
        # instead of the requested institution's data. Normalize to str.
        institution_id = str(institution_id) if institution_id else None
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        base_filter = (
            UserSession.institution_id == institution_id if institution_id else True
        )

        # Total users
        total_users_stmt = select(func.count(func.distinct(UserSession.user_id))).where(
            and_(base_filter, UserSession.user_id.isnot(None))
        )
        total_users_result = self.db.execute(total_users_stmt)
        total_users = total_users_result.scalar() or 0

        # Active users
        active_today_stmt = select(
            func.count(func.distinct(UserSession.user_id))
        ).where(
            and_(
                base_filter,
                UserSession.user_id.isnot(None),
                UserSession.last_seen >= today,
            )
        )
        active_today_result = self.db.execute(active_today_stmt)
        active_today = active_today_result.scalar() or 0

        active_week_stmt = select(func.count(func.distinct(UserSession.user_id))).where(
            and_(
                base_filter,
                UserSession.user_id.isnot(None),
                UserSession.last_seen >= week_ago,
            )
        )
        active_week_result = self.db.execute(active_week_stmt)
        active_week = active_week_result.scalar() or 0

        active_month_stmt = select(
            func.count(func.distinct(UserSession.user_id))
        ).where(
            and_(
                base_filter,
                UserSession.user_id.isnot(None),
                UserSession.last_seen >= month_ago,
            )
        )
        active_month_result = self.db.execute(active_month_stmt)
        active_month = active_month_result.scalar() or 0

        # Session stats
        total_sessions_stmt = select(func.count(UserSession.id)).where(base_filter)
        total_sessions_result = self.db.execute(total_sessions_stmt)
        total_sessions = total_sessions_result.scalar() or 0

        # Calculate average session duration
        avg_duration_stmt = select(
            func.avg(
                func.timestampdiff(text('SECOND'), UserSession.first_seen, UserSession.last_seen)
            )
        ).where(base_filter)
        avg_duration_result = self.db.execute(avg_duration_stmt)
        avg_duration = avg_duration_result.scalar() or 0

        # Page views
        total_pageviews_stmt = select(func.sum(UserSession.page_views)).where(
            base_filter
        )
        total_pageviews_result = self.db.execute(total_pageviews_stmt)
        total_pageviews = total_pageviews_result.scalar() or 0

        avg_pages = total_pageviews / total_sessions if total_sessions > 0 else 0

        return {
            "total_users": total_users,
            "active_users_today": active_today,
            "active_users_week": active_week,
            "active_users_month": active_month,
            "total_sessions": total_sessions,
            "avg_session_duration": float(avg_duration),
            "total_page_views": total_pageviews,
            "avg_pages_per_session": float(avg_pages),
        }

    def get_feature_adoption_stats(
        self, institution_id: Optional[UUID] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get feature adoption statistics."""
        institution_id = str(institution_id) if institution_id else None
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        base_filter = (
            FeatureUsage.institution_id == institution_id if institution_id else True
        )

        stmt = (
            select(
                FeatureUsage.feature_name,
                func.count(func.distinct(FeatureUsage.user_id)).label("total_users"),
                func.sum(FeatureUsage.usage_count).label("total_usage"),
                func.count(
                    func.distinct(
                        case(
                            (FeatureUsage.last_used_at >= today, FeatureUsage.user_id),
                            else_=None,
                        )
                    )
                ).label("users_today"),
                func.count(
                    func.distinct(
                        case(
                            (FeatureUsage.last_used_at >= week_ago, FeatureUsage.user_id),
                            else_=None,
                        )
                    )
                ).label("users_week"),
                func.count(
                    func.distinct(
                        case(
                            (FeatureUsage.last_used_at >= month_ago, FeatureUsage.user_id),
                            else_=None,
                        )
                    )
                ).label("users_month"),
            )
            .where(base_filter)
            .group_by(FeatureUsage.feature_name)
            .order_by(desc("total_usage"))
            .limit(limit)
        )

        result = self.db.execute(stmt)
        rows = result.all()

        # Get total user count for adoption rate calculation
        total_users_stmt = select(
            func.count(func.distinct(FeatureUsage.user_id))
        ).where(and_(base_filter, FeatureUsage.user_id.isnot(None)))
        total_users_result = self.db.execute(total_users_stmt)
        total_users = total_users_result.scalar() or 1

        return [
            {
                "feature_name": row.feature_name,
                "total_users": row.total_users,
                "total_usage": row.total_usage,
                "unique_users_today": row.users_today,
                "unique_users_week": row.users_week,
                "unique_users_month": row.users_month,
                "adoption_rate": (row.total_users / total_users) * 100,
            }
            for row in rows
        ]

    def get_user_flow_analysis(
        self, institution_id: Optional[UUID] = None, limit: int = 10
    ) -> Dict[str, Any]:
        """Analyze user flow through pages."""
        institution_id = str(institution_id) if institution_id else None
        base_filter = (
            UserSession.institution_id == institution_id if institution_id else True
        )

        stmt = (
            select(
                UserSession.landing_page.label("page"),
                func.count(UserSession.id).label("count"),
            )
            .where(and_(base_filter, UserSession.landing_page.isnot(None)))
            .group_by(UserSession.landing_page)
            .order_by(desc("count"))
            .limit(limit)
        )

        result = self.db.execute(stmt)
        rows = result.all()

        total_sessions_stmt = select(func.count(UserSession.id)).where(base_filter)
        total_sessions_result = self.db.execute(total_sessions_stmt)
        total_sessions = total_sessions_result.scalar() or 0

        nodes = [
            {
                "page": row.page,
                "count": row.count,
                "drop_off_rate": ((total_sessions - row.count) / total_sessions * 100)
                if total_sessions > 0
                else 0,
            }
            for row in rows
        ]

        return {"nodes": nodes, "total_sessions": total_sessions}

    def get_retention_cohorts(
        self, institution_id: Optional[UUID] = None, cohort_days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get user retention by cohort."""
        institution_id = str(institution_id) if institution_id else None
        base_filter = (
            UserRetention.institution_id == institution_id if institution_id else True
        )

        stmt = (
            select(
                func.date_format(UserRetention.cohort_date, '%Y-%m-%d').label("cohort_date"),
                func.count(func.distinct(UserRetention.user_id)).label("users_count"),
                (
                    func.count(
                        func.distinct(
                            case(
                                (UserRetention.days_since_cohort == 1, UserRetention.user_id),
                                else_=None,
                            )
                        )
                    )
                    * 100.0
                    / func.count(func.distinct(UserRetention.user_id))
                ).label("retention_day_1"),
                (
                    func.count(
                        func.distinct(
                            case(
                                (UserRetention.days_since_cohort == 7, UserRetention.user_id),
                                else_=None,
                            )
                        )
                    )
                    * 100.0
                    / func.count(func.distinct(UserRetention.user_id))
                ).label("retention_day_7"),
                (
                    func.count(
                        func.distinct(
                            case(
                                (UserRetention.days_since_cohort == 14, UserRetention.user_id),
                                else_=None,
                            )
                        )
                    )
                    * 100.0
                    / func.count(func.distinct(UserRetention.user_id))
                ).label("retention_day_14"),
                (
                    func.count(
                        func.distinct(
                            case(
                                (UserRetention.days_since_cohort == 30, UserRetention.user_id),
                                else_=None,
                            )
                        )
                    )
                    * 100.0
                    / func.count(func.distinct(UserRetention.user_id))
                ).label("retention_day_30"),
            )
            .where(base_filter)
            .group_by(func.date_format(UserRetention.cohort_date, '%Y-%m-%d'))
            .order_by(desc("cohort_date"))
            .limit(cohort_days)
        )

        result = self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "cohort_date": row.cohort_date if row.cohort_date else "",
                "users_count": row.users_count,
                "retention_day_1": float(row.retention_day_1 or 0),
                "retention_day_7": float(row.retention_day_7 or 0),
                "retention_day_14": float(row.retention_day_14 or 0),
                "retention_day_30": float(row.retention_day_30 or 0),
            }
            for row in rows
        ]

    def get_top_events(
        self, institution_id: Optional[UUID] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get top analytics events."""
        institution_id = str(institution_id) if institution_id else None
        base_filter = (
            AnalyticsEvent.institution_id == institution_id if institution_id else True
        )

        stmt = (
            select(
                AnalyticsEvent.event_name,
                AnalyticsEvent.event_type,
                func.count(AnalyticsEvent.id).label("count"),
                func.count(func.distinct(AnalyticsEvent.user_id)).label("unique_users"),
            )
            .where(base_filter)
            .group_by(AnalyticsEvent.event_name, AnalyticsEvent.event_type)
            .order_by(desc("count"))
            .limit(limit)
        )

        result = self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "event_name": row.event_name,
                "event_type": row.event_type,
                "count": row.count,
                "unique_users": row.unique_users,
            }
            for row in rows
        ]

    def get_performance_stats(
        self, metric_name: Optional[str] = None, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get performance statistics."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        filters = [PerformanceMetric.created_at >= cutoff_date]
        if metric_name:
            filters.append(PerformanceMetric.metric_name == metric_name)

        stmt = (
            select(
                PerformanceMetric.metric_name,
                func.avg(PerformanceMetric.metric_value).label("avg_value"),
                func.avg(PerformanceMetric.metric_value).label("p50_value"),
                func.avg(PerformanceMetric.metric_value).label("p75_value"),
                func.avg(PerformanceMetric.metric_value).label("p95_value"),
                func.count(
                    case((PerformanceMetric.rating == "good", 1), else_=None)
                ).label("good_count"),
                func.count(
                    case((PerformanceMetric.rating == "needs-improvement", 1), else_=None)
                ).label("needs_improvement_count"),
                func.count(
                    case((PerformanceMetric.rating == "poor", 1), else_=None)
                ).label("poor_count"),
            )
            .where(and_(*filters))
            .group_by(PerformanceMetric.metric_name)
        )

        result = self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "metric_name": row.metric_name,
                "avg_value": float(row.avg_value or 0),
                "p50_value": float(row.p50_value or 0),
                "p75_value": float(row.p75_value or 0),
                "p95_value": float(row.p95_value or 0),
                "good_count": row.good_count,
                "needs_improvement_count": row.needs_improvement_count,
                "poor_count": row.poor_count,
            }
            for row in rows
        ]
