from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import func, select, and_, desc, case
from sqlalchemy.ext.asyncio import AsyncSession
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
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_event(self, event: AnalyticsEventCreate) -> AnalyticsEvent:
        """Create a new analytics event."""
        db_event = AnalyticsEvent(**event.model_dump())
        self.db.add(db_event)
        await self.db.commit()
        await self.db.refresh(db_event)
        return db_event

    async def create_performance_metric(
        self, metric: PerformanceMetricCreate
    ) -> PerformanceMetric:
        """Create a new performance metric."""
        db_metric = PerformanceMetric(**metric.model_dump())
        self.db.add(db_metric)
        await self.db.commit()
        await self.db.refresh(db_metric)
        return db_metric

    async def create_or_update_session(
        self, session_data: UserSessionCreate
    ) -> UserSession:
        """Create a new user session or update existing one."""
        stmt = select(UserSession).where(
            UserSession.session_id == session_data.session_id
        )
        result = await self.db.execute(stmt)
        db_session = result.scalar_one_or_none()

        if db_session:
            db_session.last_seen = datetime.utcnow()
            db_session.page_views += 1
        else:
            db_session = UserSession(**session_data.model_dump())
            self.db.add(db_session)

        await self.db.commit()
        await self.db.refresh(db_session)
        return db_session

    async def update_session(
        self, session_id: str, update_data: UserSessionUpdate
    ) -> Optional[UserSession]:
        """Update a user session."""
        stmt = select(UserSession).where(UserSession.session_id == session_id)
        result = await self.db.execute(stmt)
        db_session = result.scalar_one_or_none()

        if db_session:
            update_dict = update_data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(db_session, key, value)
            
            await self.db.commit()
            await self.db.refresh(db_session)

        return db_session

    async def track_feature_usage(
        self, feature_data: FeatureUsageCreate
    ) -> FeatureUsage:
        """Track feature usage, incrementing count if already exists."""
        stmt = select(FeatureUsage).where(
            and_(
                FeatureUsage.feature_name == feature_data.feature_name,
                FeatureUsage.user_id == feature_data.user_id,
            )
        )
        result = await self.db.execute(stmt)
        db_feature = result.scalar_one_or_none()

        if db_feature:
            db_feature.usage_count += 1
            db_feature.last_used_at = datetime.utcnow()
            if feature_data.properties:
                db_feature.properties = feature_data.properties
        else:
            db_feature = FeatureUsage(**feature_data.model_dump())
            self.db.add(db_feature)

        await self.db.commit()
        await self.db.refresh(db_feature)
        return db_feature

    async def get_dashboard_stats(
        self, institution_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get dashboard statistics."""
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
        total_users_result = await self.db.execute(total_users_stmt)
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
        active_today_result = await self.db.execute(active_today_stmt)
        active_today = active_today_result.scalar() or 0

        active_week_stmt = select(func.count(func.distinct(UserSession.user_id))).where(
            and_(
                base_filter,
                UserSession.user_id.isnot(None),
                UserSession.last_seen >= week_ago,
            )
        )
        active_week_result = await self.db.execute(active_week_stmt)
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
        active_month_result = await self.db.execute(active_month_stmt)
        active_month = active_month_result.scalar() or 0

        # Session stats
        total_sessions_stmt = select(func.count(UserSession.id)).where(base_filter)
        total_sessions_result = await self.db.execute(total_sessions_stmt)
        total_sessions = total_sessions_result.scalar() or 0

        # Calculate average session duration
        avg_duration_stmt = select(
            func.avg(
                func.extract(
                    "epoch", UserSession.last_seen - UserSession.first_seen
                )
            )
        ).where(base_filter)
        avg_duration_result = await self.db.execute(avg_duration_stmt)
        avg_duration = avg_duration_result.scalar() or 0

        # Page views
        total_pageviews_stmt = select(func.sum(UserSession.page_views)).where(
            base_filter
        )
        total_pageviews_result = await self.db.execute(total_pageviews_stmt)
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

    async def get_feature_adoption_stats(
        self, institution_id: Optional[UUID] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get feature adoption statistics."""
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

        result = await self.db.execute(stmt)
        rows = result.all()

        # Get total user count for adoption rate calculation
        total_users_stmt = select(
            func.count(func.distinct(FeatureUsage.user_id))
        ).where(and_(base_filter, FeatureUsage.user_id.isnot(None)))
        total_users_result = await self.db.execute(total_users_stmt)
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

    async def get_user_flow_analysis(
        self, institution_id: Optional[UUID] = None, limit: int = 10
    ) -> Dict[str, Any]:
        """Analyze user flow through pages."""
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

        result = await self.db.execute(stmt)
        rows = result.all()

        total_sessions_stmt = select(func.count(UserSession.id)).where(base_filter)
        total_sessions_result = await self.db.execute(total_sessions_stmt)
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

    async def get_retention_cohorts(
        self, institution_id: Optional[UUID] = None, cohort_days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get user retention by cohort."""
        base_filter = (
            UserRetention.institution_id == institution_id if institution_id else True
        )

        stmt = (
            select(
                func.date_trunc("day", UserRetention.cohort_date).label("cohort_date"),
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
            .group_by(func.date_trunc("day", UserRetention.cohort_date))
            .order_by(desc("cohort_date"))
            .limit(cohort_days)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "cohort_date": row.cohort_date.isoformat() if row.cohort_date else "",
                "users_count": row.users_count,
                "retention_day_1": float(row.retention_day_1 or 0),
                "retention_day_7": float(row.retention_day_7 or 0),
                "retention_day_14": float(row.retention_day_14 or 0),
                "retention_day_30": float(row.retention_day_30 or 0),
            }
            for row in rows
        ]

    async def get_top_events(
        self, institution_id: Optional[UUID] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get top analytics events."""
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

        result = await self.db.execute(stmt)
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

    async def get_performance_stats(
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
                func.percentile_cont(0.5).within_group(
                    PerformanceMetric.metric_value
                ).label("p50_value"),
                func.percentile_cont(0.75).within_group(
                    PerformanceMetric.metric_value
                ).label("p75_value"),
                func.percentile_cont(0.95).within_group(
                    PerformanceMetric.metric_value
                ).label("p95_value"),
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

        result = await self.db.execute(stmt)
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
