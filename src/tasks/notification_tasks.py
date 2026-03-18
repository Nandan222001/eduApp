from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from celery import Task
from sqlalchemy import and_, func

from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.notification import (
    Notification,
    Announcement,
    NotificationStatus,
    NotificationAnalytics,
    NotificationEngagement,
    NotificationDelivery,
    DigestMode,
    NotificationDevice
)
from src.services.notification_service import NotificationService
from src.services.announcement_service import AnnouncementService

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_notification")
def send_notification(self, notification_id: int) -> Dict[str, Any]:
    try:
        notification_service = NotificationService(self.db)
        
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        success = loop.run_until_complete(
            notification_service.send_notification(notification_id)
        )
        
        return {
            "notification_id": notification_id,
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error sending notification {notification_id}: {str(e)}")
        return {
            "notification_id": notification_id,
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_bulk_notifications")
def send_bulk_notifications(
    self,
    institution_id: int,
    user_ids: List[int],
    title: str,
    message: str,
    notification_type: str,
    channel: str,
    priority: str = "medium",
    notification_group: str = "system",
    data: Dict[str, Any] = None
) -> Dict[str, Any]:
    try:
        notification_service = NotificationService(self.db)
        created = 0
        failed = 0
        
        for user_id in user_ids:
            try:
                notification = notification_service.create_notification(
                    institution_id=institution_id,
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    notification_group=notification_group,
                    channel=channel,
                    priority=priority,
                    data=data
                )
                
                send_notification.delay(notification.id)
                created += 1
                
            except Exception as e:
                logger.error(f"Error creating notification for user {user_id}: {str(e)}")
                failed += 1
        
        return {
            "created": created,
            "failed": failed,
            "total": len(user_ids),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in bulk notification: {str(e)}")
        return {
            "created": 0,
            "failed": len(user_ids),
            "total": len(user_ids),
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_scheduled_announcements")
def send_scheduled_announcements(self) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        
        scheduled_announcements = self.db.query(Announcement).filter(
            Announcement.is_published == False,
            Announcement.scheduled_at <= now,
            Announcement.scheduled_at.isnot(None)
        ).all()
        
        processed = 0
        for announcement in scheduled_announcements:
            try:
                announcement_service = AnnouncementService(self.db)
                announcement_service.publish_announcement(
                    announcement.id,
                    announcement.institution_id
                )
                processed += 1
            except Exception as e:
                logger.error(f"Error publishing scheduled announcement {announcement.id}: {str(e)}")
        
        return {
            "processed": processed,
            "total": len(scheduled_announcements),
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing scheduled announcements: {str(e)}")
        return {
            "processed": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.cleanup_old_notifications")
def cleanup_old_notifications(self, days: int = 90) -> Dict[str, Any]:
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted = self.db.query(Notification).filter(
            Notification.created_at < cutoff_date,
            Notification.status == NotificationStatus.READ.value
        ).delete()
        
        self.db.commit()
        
        return {
            "deleted": deleted,
            "cutoff_date": cutoff_date.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")
        self.db.rollback()
        return {
            "deleted": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.retry_failed_notifications")
def retry_failed_notifications(self, max_retries: int = 3) -> Dict[str, Any]:
    try:
        failed_notifications = self.db.query(Notification).filter(
            Notification.status == NotificationStatus.FAILED.value,
            Notification.failed_at >= datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        retried = 0
        for notification in failed_notifications:
            retry_count = notification.data.get("retry_count", 0) if notification.data else 0
            
            if retry_count < max_retries:
                notification.status = NotificationStatus.PENDING.value
                notification.failed_at = None
                notification.error_message = None
                
                if notification.data:
                    notification.data["retry_count"] = retry_count + 1
                else:
                    notification.data = {"retry_count": retry_count + 1}
                
                self.db.commit()
                send_notification.delay(notification.id)
                retried += 1
        
        return {
            "retried": retried,
            "total_failed": len(failed_notifications),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrying failed notifications: {str(e)}")
        self.db.rollback()
        return {
            "retried": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_digest_notifications")
def send_digest_notifications(
    self,
    institution_id: int,
    digest_type: str = "daily",
    force_send: bool = False
) -> Dict[str, Any]:
    try:
        from src.models.user import User
        from src.models.notification import NotificationPreference
        
        if digest_type == "hourly":
            since = datetime.utcnow() - timedelta(hours=1)
        elif digest_type == "daily":
            since = datetime.utcnow() - timedelta(days=1)
        elif digest_type == "weekly":
            since = datetime.utcnow() - timedelta(weeks=1)
        else:
            since = datetime.utcnow() - timedelta(days=1)
        
        # Get users with digest mode enabled
        users_with_digest = self.db.query(User).join(
            NotificationPreference,
            User.id == NotificationPreference.user_id
        ).filter(
            User.institution_id == institution_id,
            User.is_active == True,
            NotificationPreference.digest_mode == digest_type
        ).all()
        
        sent = 0
        for user in users_with_digest:
            # Get batched notifications
            batched_notifications = self.db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.status == NotificationStatus.BATCHED.value,
                Notification.created_at >= since
            ).all()
            
            if batched_notifications:
                notification_service = NotificationService(self.db)
                
                # Group by notification group
                groups = {}
                for notif in batched_notifications:
                    group = notif.notification_group
                    if group not in groups:
                        groups[group] = []
                    groups[group].append(notif)
                
                # Create digest message
                digest_parts = []
                for group, notifications in groups.items():
                    count = len(notifications)
                    digest_parts.append(f"- {count} {group} notification(s)")
                
                digest_message = "Notification Digest:\n\n" + "\n".join(digest_parts)
                digest_message += f"\n\nTotal: {len(batched_notifications)} notifications"
                
                # Send digest notification
                digest_notification = notification_service.create_notification(
                    institution_id=institution_id,
                    user_id=user.id,
                    title=f"Your {digest_type.capitalize()} Notification Digest",
                    message=digest_message,
                    notification_type="digest",
                    notification_group="system",
                    channel="email",
                    priority="low",
                    data={
                        "digest_type": digest_type,
                        "notification_count": len(batched_notifications),
                        "groups": {group: len(notifs) for group, notifs in groups.items()}
                    }
                )
                
                # Mark batched notifications as sent
                for notif in batched_notifications:
                    notif.status = NotificationStatus.SENT.value
                    notif.sent_at = datetime.utcnow()
                
                self.db.commit()
                send_notification.delay(digest_notification.id)
                sent += 1
        
        return {
            "sent": sent,
            "digest_type": digest_type,
            "users_checked": len(users_with_digest),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending digest notifications: {str(e)}")
        return {
            "sent": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.aggregate_analytics")
def aggregate_analytics(self, date: str = None) -> Dict[str, Any]:
    try:
        target_date = datetime.fromisoformat(date) if date else datetime.utcnow() - timedelta(days=1)
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Get all institutions
        from src.models.institution import Institution
        institutions = self.db.query(Institution).all()
        
        aggregated = 0
        for institution in institutions:
            # Get notifications for the day
            notifications = self.db.query(Notification).filter(
                and_(
                    Notification.institution_id == institution.id,
                    Notification.created_at >= start_of_day,
                    Notification.created_at < end_of_day
                )
            ).all()
            
            # Group by type, group, channel, priority
            analytics_groups = {}
            for notif in notifications:
                key = (
                    notif.notification_type,
                    notif.notification_group,
                    notif.channel,
                    notif.priority
                )
                
                if key not in analytics_groups:
                    analytics_groups[key] = {
                        "sent": 0,
                        "delivered": 0,
                        "failed": 0,
                        "read": 0,
                        "clicked": 0,
                        "read_times": [],
                        "delivery_times": []
                    }
                
                analytics_groups[key]["sent"] += 1
                
                if notif.status == NotificationStatus.SENT.value:
                    analytics_groups[key]["delivered"] += 1
                    
                    if notif.sent_at:
                        delivery_time = (notif.sent_at - notif.created_at).total_seconds()
                        analytics_groups[key]["delivery_times"].append(delivery_time)
                
                if notif.status == NotificationStatus.FAILED.value:
                    analytics_groups[key]["failed"] += 1
                
                if notif.status == NotificationStatus.READ.value:
                    analytics_groups[key]["read"] += 1
                    
                    if notif.read_at and notif.sent_at:
                        read_time = (notif.read_at - notif.sent_at).total_seconds()
                        analytics_groups[key]["read_times"].append(read_time)
                
                # Check for clicks
                clicks = self.db.query(NotificationEngagement).filter(
                    NotificationEngagement.notification_id == notif.id,
                    NotificationEngagement.action == "clicked"
                ).count()
                analytics_groups[key]["clicked"] += clicks
            
            # Create analytics records
            for key, metrics in analytics_groups.items():
                notification_type, notification_group, channel, priority = key
                
                sent = metrics["sent"]
                delivered = metrics["delivered"]
                failed = metrics["failed"]
                read = metrics["read"]
                clicked = metrics["clicked"]
                
                delivery_rate = (delivered / sent * 100) if sent > 0 else 0
                read_rate = (read / delivered * 100) if delivered > 0 else 0
                click_rate = (clicked / read * 100) if read > 0 else 0
                
                avg_read_time = int(sum(metrics["read_times"]) / len(metrics["read_times"])) if metrics["read_times"] else None
                avg_delivery_time = int(sum(metrics["delivery_times"]) / len(metrics["delivery_times"])) if metrics["delivery_times"] else None
                
                # Check if record exists
                existing = self.db.query(NotificationAnalytics).filter(
                    and_(
                        NotificationAnalytics.institution_id == institution.id,
                        NotificationAnalytics.date == start_of_day,
                        NotificationAnalytics.notification_type == notification_type,
                        NotificationAnalytics.notification_group == notification_group,
                        NotificationAnalytics.channel == channel,
                        NotificationAnalytics.priority == priority
                    )
                ).first()
                
                if existing:
                    existing.total_sent = sent
                    existing.total_delivered = delivered
                    existing.total_failed = failed
                    existing.total_read = read
                    existing.total_clicked = clicked
                    existing.delivery_rate = delivery_rate
                    existing.read_rate = read_rate
                    existing.click_rate = click_rate
                    existing.avg_read_time_seconds = avg_read_time
                    existing.avg_delivery_time_seconds = avg_delivery_time
                else:
                    analytic = NotificationAnalytics(
                        institution_id=institution.id,
                        date=start_of_day,
                        notification_type=notification_type,
                        notification_group=notification_group,
                        channel=channel,
                        priority=priority,
                        total_sent=sent,
                        total_delivered=delivered,
                        total_failed=failed,
                        total_read=read,
                        total_clicked=clicked,
                        delivery_rate=delivery_rate,
                        read_rate=read_rate,
                        click_rate=click_rate,
                        avg_read_time_seconds=avg_read_time,
                        avg_delivery_time_seconds=avg_delivery_time
                    )
                    self.db.add(analytic)
                
                aggregated += 1
        
        self.db.commit()
        
        return {
            "aggregated": aggregated,
            "date": start_of_day.isoformat(),
            "institutions": len(institutions),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error aggregating analytics: {str(e)}")
        self.db.rollback()
        return {
            "aggregated": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.process_grouped_notifications")
def process_grouped_notifications(self) -> Dict[str, Any]:
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        grouped_notifications = self.db.query(Notification).filter(
            and_(
                Notification.status == NotificationStatus.BATCHED.value,
                Notification.grouped_with_id.isnot(None),
                Notification.created_at < cutoff_time
            )
        ).all()
        
        ungrouped = 0
        for notif in grouped_notifications:
            notif.status = NotificationStatus.PENDING.value
            send_notification.delay(notif.id)
            ungrouped += 1
        
        self.db.commit()
        
        return {
            "ungrouped": ungrouped,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing grouped notifications: {str(e)}")
        self.db.rollback()
        return {
            "ungrouped": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_expo_push_notification")
def send_expo_push_notification(
    self,
    user_id: int,
    title: str,
    message: str,
    data: Dict[str, Any] = None
) -> Dict[str, Any]:
    try:
        from src.services.notification_providers import NotificationProviderFactory
        
        devices = self.db.query(NotificationDevice).filter(
            and_(
                NotificationDevice.user_id == user_id,
                NotificationDevice.is_active == True
            )
        ).all()
        
        if not devices:
            return {
                "success": False,
                "error": "No active devices found for user",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        expo_provider = NotificationProviderFactory.get_expo_provider()
        
        messages = []
        for device in devices:
            messages.append({
                "to": device.device_token,
                "title": title,
                "body": message,
                "sound": "default",
                "priority": "high",
                "data": data or {}
            })
        
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(expo_provider.send_bulk(messages))
        
        for device in devices:
            device.last_used_at = datetime.utcnow()
        self.db.commit()
        
        return {
            "success": result.get("success", False),
            "devices_count": len(devices),
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending Expo push notification to user {user_id}: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_bulk_expo_push")
def send_bulk_expo_push(
    self,
    user_ids: List[int],
    title: str,
    message: str,
    data: Dict[str, Any] = None
) -> Dict[str, Any]:
    try:
        from src.services.notification_providers import NotificationProviderFactory
        
        devices = self.db.query(NotificationDevice).filter(
            and_(
                NotificationDevice.user_id.in_(user_ids),
                NotificationDevice.is_active == True
            )
        ).all()
        
        if not devices:
            return {
                "success": False,
                "error": "No active devices found for specified users",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        expo_provider = NotificationProviderFactory.get_expo_provider()
        
        messages = []
        for device in devices:
            messages.append({
                "to": device.device_token,
                "title": title,
                "body": message,
                "sound": "default",
                "priority": "high",
                "data": data or {}
            })
        
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(expo_provider.send_bulk(messages))
        
        for device in devices:
            device.last_used_at = datetime.utcnow()
        self.db.commit()
        
        return {
            "success": result.get("success", False),
            "users_count": len(user_ids),
            "devices_count": len(devices),
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending bulk Expo push notifications: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
