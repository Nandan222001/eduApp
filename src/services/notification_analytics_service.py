from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from src.models.notification import (
    Notification,
    NotificationAnalytics,
    NotificationEngagement,
    NotificationDelivery,
    NotificationStatus,
    NotificationChannel,
    NotificationPriority,
    NotificationGroup
)


class NotificationAnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_delivery_metrics(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime,
        channel: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get delivery rate metrics"""
        query = self.db.query(
            func.count(Notification.id).label('total'),
            func.sum(
                func.case(
                    (Notification.status == NotificationStatus.SENT.value, 1),
                    else_=0
                )
            ).label('delivered'),
            func.sum(
                func.case(
                    (Notification.status == NotificationStatus.FAILED.value, 1),
                    else_=0
                )
            ).label('failed')
        ).filter(
            and_(
                Notification.institution_id == institution_id,
                Notification.created_at >= start_date,
                Notification.created_at <= end_date
            )
        )
        
        if channel:
            query = query.filter(Notification.channel == channel)
        
        result = query.first()
        
        total = result.total or 0
        delivered = result.delivered or 0
        failed = result.failed or 0
        
        delivery_rate = (delivered / total * 100) if total > 0 else 0
        failure_rate = (failed / total * 100) if total > 0 else 0
        
        return {
            "total": total,
            "delivered": delivered,
            "failed": failed,
            "delivery_rate": round(delivery_rate, 2),
            "failure_rate": round(failure_rate, 2)
        }

    def get_engagement_metrics(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get engagement metrics (read rate, click rate)"""
        notifications = self.db.query(Notification).filter(
            and_(
                Notification.institution_id == institution_id,
                Notification.created_at >= start_date,
                Notification.created_at <= end_date,
                Notification.status == NotificationStatus.SENT.value
            )
        ).all()
        
        total_sent = len(notifications)
        total_read = sum(1 for n in notifications if n.read_at is not None)
        
        # Count clicks from engagements
        notification_ids = [n.id for n in notifications]
        total_clicked = self.db.query(func.count(NotificationEngagement.id)).filter(
            and_(
                NotificationEngagement.notification_id.in_(notification_ids),
                NotificationEngagement.action == 'clicked'
            )
        ).scalar() or 0
        
        # Count unique users who clicked
        unique_clickers = self.db.query(func.count(func.distinct(NotificationEngagement.user_id))).filter(
            and_(
                NotificationEngagement.notification_id.in_(notification_ids),
                NotificationEngagement.action == 'clicked'
            )
        ).scalar() or 0
        
        read_rate = (total_read / total_sent * 100) if total_sent > 0 else 0
        click_rate = (total_clicked / total_read * 100) if total_read > 0 else 0
        
        return {
            "total_sent": total_sent,
            "total_read": total_read,
            "total_clicked": total_clicked,
            "unique_clickers": unique_clickers,
            "read_rate": round(read_rate, 2),
            "click_rate": round(click_rate, 2)
        }

    def get_channel_breakdown(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """Get metrics broken down by channel"""
        channels = {}
        
        for channel in NotificationChannel:
            metrics = self.get_delivery_metrics(
                institution_id,
                start_date,
                end_date,
                channel=channel.value
            )
            
            # Get channel-specific engagement
            notifications = self.db.query(Notification).filter(
                and_(
                    Notification.institution_id == institution_id,
                    Notification.channel == channel.value,
                    Notification.created_at >= start_date,
                    Notification.created_at <= end_date
                )
            ).all()
            
            read_count = sum(1 for n in notifications if n.read_at is not None)
            
            channels[channel.value] = {
                **metrics,
                "read_count": read_count,
                "read_rate": round((read_count / metrics["total"] * 100) if metrics["total"] > 0 else 0, 2)
            }
        
        return channels

    def get_priority_breakdown(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """Get metrics broken down by priority"""
        priorities = {}
        
        for priority in NotificationPriority:
            query = self.db.query(
                func.count(Notification.id).label('total'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.SENT.value, 1),
                        else_=0
                    )
                ).label('delivered'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.READ.value, 1),
                        else_=0
                    )
                ).label('read')
            ).filter(
                and_(
                    Notification.institution_id == institution_id,
                    Notification.priority == priority.value,
                    Notification.created_at >= start_date,
                    Notification.created_at <= end_date
                )
            ).first()
            
            total = query.total or 0
            delivered = query.delivered or 0
            read = query.read or 0
            
            priorities[priority.value] = {
                "total": total,
                "delivered": delivered,
                "read": read,
                "delivery_rate": round((delivered / total * 100) if total > 0 else 0, 2),
                "read_rate": round((read / delivered * 100) if delivered > 0 else 0, 2)
            }
        
        return priorities

    def get_group_breakdown(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """Get metrics broken down by notification group"""
        groups = {}
        
        for group in NotificationGroup:
            query = self.db.query(
                func.count(Notification.id).label('total'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.SENT.value, 1),
                        else_=0
                    )
                ).label('delivered'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.READ.value, 1),
                        else_=0
                    )
                ).label('read')
            ).filter(
                and_(
                    Notification.institution_id == institution_id,
                    Notification.notification_group == group.value,
                    Notification.created_at >= start_date,
                    Notification.created_at <= end_date
                )
            ).first()
            
            total = query.total or 0
            delivered = query.delivered or 0
            read = query.read or 0
            
            groups[group.value] = {
                "total": total,
                "delivered": delivered,
                "read": read,
                "delivery_rate": round((delivered / total * 100) if total > 0 else 0, 2),
                "read_rate": round((read / delivered * 100) if delivered > 0 else 0, 2)
            }
        
        return groups

    def get_timing_metrics(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get timing metrics (delivery time, read time)"""
        notifications = self.db.query(Notification).filter(
            and_(
                Notification.institution_id == institution_id,
                Notification.created_at >= start_date,
                Notification.created_at <= end_date,
                Notification.sent_at.isnot(None)
            )
        ).all()
        
        delivery_times = []
        read_times = []
        
        for notif in notifications:
            if notif.sent_at:
                delivery_time = (notif.sent_at - notif.created_at).total_seconds()
                delivery_times.append(delivery_time)
            
            if notif.read_at and notif.sent_at:
                read_time = (notif.read_at - notif.sent_at).total_seconds()
                read_times.append(read_time)
        
        avg_delivery_time = sum(delivery_times) / len(delivery_times) if delivery_times else 0
        avg_read_time = sum(read_times) / len(read_times) if read_times else 0
        
        return {
            "avg_delivery_time_seconds": int(avg_delivery_time),
            "avg_read_time_seconds": int(avg_read_time),
            "avg_delivery_time_minutes": round(avg_delivery_time / 60, 2),
            "avg_read_time_minutes": round(avg_read_time / 60, 2),
            "median_delivery_time_seconds": int(sorted(delivery_times)[len(delivery_times) // 2]) if delivery_times else 0,
            "median_read_time_seconds": int(sorted(read_times)[len(read_times) // 2]) if read_times else 0
        }

    def get_timeline_data(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime,
        granularity: str = "day"
    ) -> List[Dict[str, Any]]:
        """Get time-series data for notifications"""
        timeline = []
        
        if granularity == "hour":
            delta = timedelta(hours=1)
            format_str = "%Y-%m-%d %H:00"
        elif granularity == "day":
            delta = timedelta(days=1)
            format_str = "%Y-%m-%d"
        else:
            delta = timedelta(days=1)
            format_str = "%Y-%m-%d"
        
        current = start_date
        while current <= end_date:
            next_period = current + delta
            
            query = self.db.query(
                func.count(Notification.id).label('total'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.SENT.value, 1),
                        else_=0
                    )
                ).label('sent'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.FAILED.value, 1),
                        else_=0
                    )
                ).label('failed'),
                func.sum(
                    func.case(
                        (Notification.status == NotificationStatus.READ.value, 1),
                        else_=0
                    )
                ).label('read')
            ).filter(
                and_(
                    Notification.institution_id == institution_id,
                    Notification.created_at >= current,
                    Notification.created_at < next_period
                )
            ).first()
            
            timeline.append({
                "timestamp": current.strftime(format_str),
                "total": query.total or 0,
                "sent": query.sent or 0,
                "failed": query.failed or 0,
                "read": query.read or 0
            })
            
            current = next_period
        
        return timeline

    def get_top_notification_types(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get most sent notification types"""
        results = self.db.query(
            Notification.notification_type,
            func.count(Notification.id).label('count'),
            func.sum(
                func.case(
                    (Notification.status == NotificationStatus.SENT.value, 1),
                    else_=0
                )
            ).label('sent'),
            func.sum(
                func.case(
                    (Notification.status == NotificationStatus.READ.value, 1),
                    else_=0
                )
            ).label('read')
        ).filter(
            and_(
                Notification.institution_id == institution_id,
                Notification.created_at >= start_date,
                Notification.created_at <= end_date
            )
        ).group_by(
            Notification.notification_type
        ).order_by(
            desc('count')
        ).limit(limit).all()
        
        return [
            {
                "notification_type": r.notification_type,
                "count": r.count,
                "sent": r.sent or 0,
                "read": r.read or 0,
                "read_rate": round((r.read / r.sent * 100) if r.sent > 0 else 0, 2)
            }
            for r in results
        ]

    def get_user_engagement_summary(
        self,
        user_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get engagement summary for a specific user"""
        notifications = self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.created_at >= start_date,
                Notification.created_at <= end_date
            )
        ).all()
        
        total_received = len(notifications)
        total_read = sum(1 for n in notifications if n.read_at is not None)
        
        # Get engagement actions
        engagements = self.db.query(
            NotificationEngagement.action,
            func.count(NotificationEngagement.id).label('count')
        ).filter(
            and_(
                NotificationEngagement.user_id == user_id,
                NotificationEngagement.created_at >= start_date,
                NotificationEngagement.created_at <= end_date
            )
        ).group_by(NotificationEngagement.action).all()
        
        engagement_by_action = {e.action: e.count for e in engagements}
        
        # Calculate read times
        read_times = []
        for n in notifications:
            if n.read_at and n.sent_at:
                read_time = (n.read_at - n.sent_at).total_seconds()
                read_times.append(read_time)
        
        avg_read_time = sum(read_times) / len(read_times) if read_times else 0
        
        return {
            "total_received": total_received,
            "total_read": total_read,
            "read_rate": round((total_read / total_received * 100) if total_received > 0 else 0, 2),
            "engagement_by_action": engagement_by_action,
            "avg_read_time_seconds": int(avg_read_time),
            "avg_read_time_minutes": round(avg_read_time / 60, 2)
        }

    def get_delivery_provider_stats(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """Get statistics per delivery provider/channel"""
        deliveries = self.db.query(
            NotificationDelivery.channel,
            NotificationDelivery.status,
            func.count(NotificationDelivery.id).label('count')
        ).join(
            Notification,
            NotificationDelivery.notification_id == Notification.id
        ).filter(
            and_(
                Notification.institution_id == institution_id,
                NotificationDelivery.created_at >= start_date,
                NotificationDelivery.created_at <= end_date
            )
        ).group_by(
            NotificationDelivery.channel,
            NotificationDelivery.status
        ).all()
        
        stats = {}
        for delivery in deliveries:
            if delivery.channel not in stats:
                stats[delivery.channel] = {
                    "total": 0,
                    "sent": 0,
                    "failed": 0
                }
            
            stats[delivery.channel]["total"] += delivery.count
            if delivery.status == "sent":
                stats[delivery.channel]["sent"] += delivery.count
            elif delivery.status == "failed":
                stats[delivery.channel]["failed"] += delivery.count
        
        # Calculate success rates
        for channel in stats:
            total = stats[channel]["total"]
            sent = stats[channel]["sent"]
            stats[channel]["success_rate"] = round((sent / total * 100) if total > 0 else 0, 2)
        
        return stats
