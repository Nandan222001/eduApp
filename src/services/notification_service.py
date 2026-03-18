from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import logging
import uuid

from src.models.notification import (
    Notification,
    NotificationPreference,
    NotificationChannel,
    NotificationStatus,
    NotificationTemplate,
    NotificationDelivery,
    NotificationEngagement,
    NotificationAnalytics,
    NotificationPriority,
    DigestMode,
    NotificationGroup,
    PushDevice,
    NotificationDevice
)
from src.models.user import User
from src.schemas.notification import (
    NotificationCreate,
    NotificationPreferenceCreate,
    NotificationPreferenceUpdate,
    NotificationPreviewRequest,
    NotificationPreviewResponse,
    NotificationAnalyticsRequest,
    NotificationAnalyticsResponse,
    NotificationEngagementCreate
)
from src.services.notification_providers import NotificationProviderFactory

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        institution_id: int,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        channel: str,
        priority: str = "medium",
        notification_group: str = "system",
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        notification = Notification(
            institution_id=institution_id,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            notification_group=notification_group,
            channel=channel,
            priority=priority,
            status=NotificationStatus.PENDING.value,
            data=data
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_notifications(
        self,
        user_id: int,
        status: Optional[str] = None,
        channel: Optional[str] = None,
        group: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Notification]:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if status:
            query = query.filter(Notification.status == status)
        if channel:
            query = query.filter(Notification.channel == channel)
        if group:
            query = query.filter(Notification.notification_group == group)
        
        return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def get_notification_by_id(self, notification_id: int, user_id: int) -> Optional[Notification]:
        return self.db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()

    def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        notification = self.get_notification_by_id(notification_id, user_id)
        if notification:
            notification.status = NotificationStatus.READ.value
            notification.read_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        count = self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value
            )
        ).update({
            "status": NotificationStatus.READ.value,
            "read_at": datetime.utcnow()
        })
        self.db.commit()
        return count

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        notification = self.get_notification_by_id(notification_id, user_id)
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False

    def get_notification_stats(self, user_id: int) -> Dict[str, Any]:
        total = self.db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id
        ).scalar()
        
        unread = self.db.query(func.count(Notification.id)).filter(
            and_(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value
            )
        ).scalar()
        
        by_channel = dict(
            self.db.query(Notification.channel, func.count(Notification.id))
            .filter(Notification.user_id == user_id)
            .group_by(Notification.channel)
            .all()
        )
        
        by_priority = dict(
            self.db.query(Notification.priority, func.count(Notification.id))
            .filter(Notification.user_id == user_id)
            .group_by(Notification.priority)
            .all()
        )
        
        by_group = dict(
            self.db.query(Notification.notification_group, func.count(Notification.id))
            .filter(Notification.user_id == user_id)
            .group_by(Notification.notification_group)
            .all()
        )
        
        return {
            "total": total or 0,
            "unread": unread or 0,
            "by_channel": by_channel,
            "by_priority": by_priority,
            "by_group": by_group
        }

    def get_or_create_preferences(self, user_id: int) -> NotificationPreference:
        preference = self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        
        if not preference:
            preference = NotificationPreference(
                user_id=user_id,
                email_enabled=True,
                sms_enabled=False,
                push_enabled=True,
                in_app_enabled=True
            )
            self.db.add(preference)
            self.db.commit()
            self.db.refresh(preference)
        
        return preference

    def update_preferences(
        self,
        user_id: int,
        preference_update: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        preference = self.get_or_create_preferences(user_id)
        
        update_data = preference_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preference, field, value)
        
        self.db.commit()
        self.db.refresh(preference)
        return preference

    def check_quiet_hours(self, user_id: int, current_time: Optional[datetime] = None) -> bool:
        preference = self.get_or_create_preferences(user_id)
        
        if not preference.quiet_hours_enabled:
            return False
        
        if not preference.quiet_hours_start or not preference.quiet_hours_end:
            return False
        
        now = current_time or datetime.utcnow()
        current_time_only = now.time()
        current_day = now.weekday()
        
        # Check if today is in quiet hours days
        if preference.quiet_hours_days:
            if current_day not in preference.quiet_hours_days:
                return False
        
        start = datetime.strptime(preference.quiet_hours_start, "%H:%M").time()
        end = datetime.strptime(preference.quiet_hours_end, "%H:%M").time()
        
        if start <= end:
            return start <= current_time_only <= end
        else:
            return current_time_only >= start or current_time_only <= end

    def check_priority_filter(self, user_id: int, priority: str) -> bool:
        preference = self.get_or_create_preferences(user_id)
        
        priority_levels = {
            "low": 0,
            "medium": 1,
            "high": 2,
            "urgent": 3
        }
        
        min_priority_level = priority_levels.get(preference.minimum_priority, 0)
        notification_priority_level = priority_levels.get(priority, 0)
        
        return notification_priority_level >= min_priority_level

    def should_send_notification(
        self,
        user_id: int,
        channel: str,
        notification_type: str,
        priority: str,
        notification_group: str
    ) -> Tuple[bool, Optional[str]]:
        preference = self.get_or_create_preferences(user_id)
        
        # Check DND mode
        if preference.dnd_enabled:
            return False, "User has Do Not Disturb enabled"
        
        # Check channel enabled
        channel_enabled = {
            "email": preference.email_enabled,
            "sms": preference.sms_enabled,
            "push": preference.push_enabled,
            "in_app": preference.in_app_enabled
        }.get(channel, True)
        
        if not channel_enabled:
            return False, f"Channel {channel} is disabled"
        
        # Check type preferences by channel
        type_preferences = {
            "email": preference.email_types,
            "sms": preference.sms_types,
            "push": preference.push_types,
            "in_app": preference.in_app_types
        }.get(channel)
        
        if type_preferences and isinstance(type_preferences, dict):
            type_enabled = type_preferences.get(notification_type, True)
            if not type_enabled:
                return False, f"Notification type {notification_type} disabled for {channel}"
        
        # Check group preferences
        if preference.group_preferences and isinstance(preference.group_preferences, dict):
            group_enabled = preference.group_preferences.get(notification_group, True)
            if not group_enabled:
                return False, f"Notification group {notification_group} is disabled"
        
        # Check priority filter
        if not self.check_priority_filter(user_id, priority):
            return False, f"Notification priority {priority} is below minimum threshold"
        
        # Check quiet hours for push and SMS
        if channel in ["push", "sms"] and self.check_quiet_hours(user_id):
            return False, "Currently in quiet hours"
        
        return True, None

    def should_batch_notification(self, user_id: int, channel: str) -> bool:
        preference = self.get_or_create_preferences(user_id)
        
        if preference.digest_mode == DigestMode.DISABLED.value:
            return False
        
        if preference.digest_channels:
            return channel in preference.digest_channels
        
        return False

    def find_similar_notifications(
        self,
        user_id: int,
        notification_type: str,
        notification_group: str,
        window_minutes: int
    ) -> Optional[Notification]:
        since = datetime.utcnow() - timedelta(minutes=window_minutes)
        
        return self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.notification_type == notification_type,
                Notification.notification_group == notification_group,
                Notification.created_at >= since,
                Notification.status != NotificationStatus.READ.value
            )
        ).order_by(desc(Notification.created_at)).first()

    def group_notification(
        self,
        user_id: int,
        notification_type: str,
        notification_group: str,
        new_notification: Notification
    ) -> Optional[Notification]:
        preference = self.get_or_create_preferences(user_id)
        
        if not preference.enable_smart_grouping:
            return None
        
        similar = self.find_similar_notifications(
            user_id,
            notification_type,
            notification_group,
            preference.grouping_window_minutes
        )
        
        if similar:
            similar.group_count += 1
            similar.updated_at = datetime.utcnow()
            new_notification.grouped_with_id = similar.id
            new_notification.status = NotificationStatus.BATCHED.value
            self.db.commit()
            return similar
        
        return None

    async def send_notification(self, notification_id: int) -> bool:
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if not notification:
            return False
        
        if notification.status != NotificationStatus.PENDING.value:
            return False
        
        should_send, reason = self.should_send_notification(
            notification.user_id,
            notification.channel,
            notification.notification_type,
            notification.priority,
            notification.notification_group
        )
        
        if not should_send:
            notification.status = NotificationStatus.FAILED.value
            notification.error_message = reason
            self.db.commit()
            self._record_delivery(notification, False, reason)
            return False
        
        # Check if should batch
        if self.should_batch_notification(notification.user_id, notification.channel):
            batch_id = self._get_or_create_batch_id(notification.user_id)
            notification.digest_batch_id = batch_id
            notification.status = NotificationStatus.BATCHED.value
            self.db.commit()
            return True
        
        # Check for grouping
        grouped = self.group_notification(
            notification.user_id,
            notification.notification_type,
            notification.notification_group,
            notification
        )
        
        if grouped:
            return True
        
        user = self.db.query(User).filter(User.id == notification.user_id).first()
        if not user:
            notification.status = NotificationStatus.FAILED.value
            notification.error_message = "User not found"
            self.db.commit()
            self._record_delivery(notification, False, "User not found")
            return False
        
        try:
            provider = NotificationProviderFactory.get_provider(notification.channel)
            
            recipient = self._get_recipient(user, notification.channel)
            if not recipient:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = f"No {notification.channel} contact information"
                self.db.commit()
                self._record_delivery(notification, False, f"No {notification.channel} contact information")
                return False
            
            success = await provider.send(
                recipient=recipient,
                subject=notification.title,
                content=notification.message,
                data=notification.data
            )
            
            if success:
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
                if notification.channel == "in_app":
                    notification.status = NotificationStatus.SENT.value
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.failed_at = datetime.utcnow()
                notification.error_message = "Provider send failed"
            
            self.db.commit()
            self._record_delivery(notification, success)
            return success
            
        except Exception as e:
            logger.error(f"Error sending notification {notification_id}: {str(e)}")
            notification.status = NotificationStatus.FAILED.value
            notification.failed_at = datetime.utcnow()
            notification.error_message = str(e)
            self.db.commit()
            self._record_delivery(notification, False, str(e))
            return False

    def _get_recipient(self, user: User, channel: str) -> Optional[str]:
        if channel == "email":
            return user.email
        elif channel == "sms":
            return user.phone
        elif channel == "push":
            active_devices = self.db.query(NotificationDevice).filter(
                and_(
                    NotificationDevice.user_id == user.id,
                    NotificationDevice.is_active == True
                )
            ).first()
            return active_devices.device_token if active_devices else None
        elif channel == "in_app":
            return str(user.id)
        return None

    def _get_or_create_batch_id(self, user_id: int) -> str:
        preference = self.get_or_create_preferences(user_id)
        now = datetime.utcnow()
        
        if preference.digest_mode == DigestMode.HOURLY.value:
            batch_id = f"{user_id}_{now.strftime('%Y%m%d%H')}"
        elif preference.digest_mode == DigestMode.DAILY.value:
            batch_id = f"{user_id}_{now.strftime('%Y%m%d')}"
        elif preference.digest_mode == DigestMode.WEEKLY.value:
            week = now.isocalendar()[1]
            batch_id = f"{user_id}_{now.year}{week:02d}"
        else:
            batch_id = str(uuid.uuid4())
        
        return batch_id

    def _record_delivery(
        self,
        notification: Notification,
        success: bool,
        error_message: Optional[str] = None
    ) -> None:
        delivery = NotificationDelivery(
            notification_id=notification.id,
            channel=notification.channel,
            status="sent" if success else "failed",
            delivered_at=datetime.utcnow() if success else None,
            failed_at=None if success else datetime.utcnow(),
            error_message=error_message
        )
        self.db.add(delivery)
        self.db.commit()

    def record_engagement(self, engagement: NotificationEngagementCreate, user_id: int) -> NotificationEngagement:
        engagement_record = NotificationEngagement(
            notification_id=engagement.notification_id,
            user_id=user_id,
            action=engagement.action,
            action_data=engagement.action_data
        )
        self.db.add(engagement_record)
        self.db.commit()
        self.db.refresh(engagement_record)
        return engagement_record

    def preview_notification(
        self,
        user_id: int,
        preview_request: NotificationPreviewRequest
    ) -> NotificationPreviewResponse:
        preference = self.get_or_create_preferences(user_id)
        
        rendered_subject = preview_request.title
        rendered_body = preview_request.message
        
        # Check if template should be used
        if preview_request.use_template and preview_request.template_id:
            template = self.db.query(NotificationTemplate).filter(
                NotificationTemplate.id == preview_request.template_id
            ).first()
            
            if template:
                rendered_subject, rendered_body = self.render_template(
                    template,
                    preview_request.template_variables or {}
                )
        
        # Check if would be sent
        should_send, blocked_reason = self.should_send_notification(
            user_id,
            preview_request.channel.value,
            preview_request.notification_type,
            preview_request.priority.value,
            "system"
        )
        
        # Estimate delivery time
        estimated_time = "Immediate"
        if not should_send:
            estimated_time = "Blocked"
        elif self.should_batch_notification(user_id, preview_request.channel.value):
            if preference.digest_delivery_time:
                estimated_time = f"Batched until {preference.digest_delivery_time}"
            else:
                estimated_time = f"Batched ({preference.digest_mode})"
        
        return NotificationPreviewResponse(
            rendered_subject=rendered_subject,
            rendered_body=rendered_body,
            channel=preview_request.channel,
            priority=preview_request.priority,
            estimated_delivery_time=estimated_time,
            would_be_sent=should_send,
            blocked_reason=blocked_reason
        )

    def get_analytics(
        self,
        institution_id: int,
        request: NotificationAnalyticsRequest
    ) -> NotificationAnalyticsResponse:
        query = self.db.query(NotificationAnalytics).filter(
            and_(
                NotificationAnalytics.institution_id == institution_id,
                NotificationAnalytics.date >= request.start_date,
                NotificationAnalytics.date <= request.end_date
            )
        )
        
        if request.notification_type:
            query = query.filter(NotificationAnalytics.notification_type == request.notification_type)
        if request.notification_group:
            query = query.filter(NotificationAnalytics.notification_group == request.notification_group.value)
        if request.channel:
            query = query.filter(NotificationAnalytics.channel == request.channel.value)
        if request.priority:
            query = query.filter(NotificationAnalytics.priority == request.priority.value)
        
        analytics = query.all()
        
        # Aggregate totals
        total_sent = sum(a.total_sent for a in analytics)
        total_delivered = sum(a.total_delivered for a in analytics)
        total_failed = sum(a.total_failed for a in analytics)
        total_read = sum(a.total_read for a in analytics)
        total_clicked = sum(a.total_clicked for a in analytics)
        
        delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
        read_rate = (total_read / total_delivered * 100) if total_delivered > 0 else 0
        click_rate = (total_clicked / total_read * 100) if total_read > 0 else 0
        
        # Group by dimensions
        by_channel = self._group_analytics(analytics, 'channel')
        by_priority = self._group_analytics(analytics, 'priority')
        by_group = self._group_analytics(analytics, 'notification_group')
        by_type = self._group_analytics(analytics, 'notification_type')
        
        # Timeline data
        timeline = []
        for analytic in sorted(analytics, key=lambda x: x.date):
            timeline.append({
                "date": analytic.date.isoformat(),
                "sent": analytic.total_sent,
                "delivered": analytic.total_delivered,
                "read": analytic.total_read,
                "clicked": analytic.total_clicked,
                "failed": analytic.total_failed
            })
        
        avg_read_time = sum(a.avg_read_time_seconds or 0 for a in analytics if a.avg_read_time_seconds) / len([a for a in analytics if a.avg_read_time_seconds]) if any(a.avg_read_time_seconds for a in analytics) else None
        avg_delivery_time = sum(a.avg_delivery_time_seconds or 0 for a in analytics if a.avg_delivery_time_seconds) / len([a for a in analytics if a.avg_delivery_time_seconds]) if any(a.avg_delivery_time_seconds for a in analytics) else None
        
        return NotificationAnalyticsResponse(
            total_sent=total_sent,
            total_delivered=total_delivered,
            total_failed=total_failed,
            total_read=total_read,
            total_clicked=total_clicked,
            delivery_rate=round(delivery_rate, 2),
            read_rate=round(read_rate, 2),
            click_rate=round(click_rate, 2),
            avg_read_time_seconds=int(avg_read_time) if avg_read_time else None,
            avg_delivery_time_seconds=int(avg_delivery_time) if avg_delivery_time else None,
            by_channel=by_channel,
            by_priority=by_priority,
            by_group=by_group,
            by_type=by_type,
            timeline=timeline
        )

    def _group_analytics(self, analytics: List[NotificationAnalytics], field: str) -> Dict[str, Dict[str, Any]]:
        grouped = {}
        for analytic in analytics:
            key = getattr(analytic, field)
            if key not in grouped:
                grouped[key] = {
                    "sent": 0,
                    "delivered": 0,
                    "failed": 0,
                    "read": 0,
                    "clicked": 0
                }
            grouped[key]["sent"] += analytic.total_sent
            grouped[key]["delivered"] += analytic.total_delivered
            grouped[key]["failed"] += analytic.total_failed
            grouped[key]["read"] += analytic.total_read
            grouped[key]["clicked"] += analytic.total_clicked
        
        # Calculate rates
        for key in grouped:
            sent = grouped[key]["sent"]
            delivered = grouped[key]["delivered"]
            read = grouped[key]["read"]
            
            grouped[key]["delivery_rate"] = round((delivered / sent * 100) if sent > 0 else 0, 2)
            grouped[key]["read_rate"] = round((read / delivered * 100) if delivered > 0 else 0, 2)
            grouped[key]["click_rate"] = round((grouped[key]["clicked"] / read * 100) if read > 0 else 0, 2)
        
        return grouped

    def get_template(
        self,
        institution_id: Optional[int],
        notification_type: str,
        channel: str
    ) -> Optional[NotificationTemplate]:
        query = self.db.query(NotificationTemplate).filter(
            and_(
                NotificationTemplate.notification_type == notification_type,
                NotificationTemplate.channel == channel,
                NotificationTemplate.is_active == True
            )
        )
        
        if institution_id:
            template = query.filter(
                NotificationTemplate.institution_id == institution_id
            ).first()
            if template:
                return template
        
        return query.filter(NotificationTemplate.institution_id.is_(None)).first()

    def render_template(
        self,
        template: NotificationTemplate,
        context: Dict[str, Any]
    ) -> tuple[str, str]:
        subject = template.subject_template or ""
        body = template.body_template or ""
        
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
        
        return subject, body

    def get_group_summary(self, user_id: int) -> List[Dict[str, Any]]:
        summaries = []
        
        for group in NotificationGroup:
            count = self.db.query(func.count(Notification.id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.notification_group == group.value
                )
            ).scalar()
            
            unread_count = self.db.query(func.count(Notification.id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.notification_group == group.value,
                    Notification.status != NotificationStatus.READ.value
                )
            ).scalar()
            
            latest = self.db.query(Notification).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.notification_group == group.value
                )
            ).order_by(desc(Notification.created_at)).first()
            
            summaries.append({
                "group": group.value,
                "count": count or 0,
                "unread_count": unread_count or 0,
                "latest_notification": latest
            })
        
        return summaries

    def register_device(
        self,
        user_id: int,
        token: str,
        device_type: str,
        device_id: str,
        topics: Optional[List[str]] = None
    ) -> PushDevice:
        existing_device = self.db.query(PushDevice).filter(
            PushDevice.token == token
        ).first()
        
        if existing_device:
            existing_device.user_id = user_id
            existing_device.device_type = device_type
            existing_device.device_id = device_id
            existing_device.topics = topics or []
            existing_device.is_active = True
            existing_device.last_used_at = datetime.utcnow()
            existing_device.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing_device)
            return existing_device
        
        device = PushDevice(
            user_id=user_id,
            token=token,
            device_type=device_type,
            device_id=device_id,
            topics=topics or [],
            is_active=True,
            last_used_at=datetime.utcnow()
        )
        self.db.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def get_unread_count(self, user_id: int) -> int:
        count = self.db.query(func.count(Notification.id)).filter(
            and_(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value
            )
        ).scalar()
        return count or 0

    def register_notification_device(
        self,
        user_id: int,
        role: str,
        device_token: str,
        device_type: str,
        platform: str,
        device_info: Optional[Dict[str, Any]] = None,
        app_version: Optional[str] = None
    ) -> NotificationDevice:
        existing_device = self.db.query(NotificationDevice).filter(
            NotificationDevice.device_token == device_token
        ).first()
        
        if existing_device:
            existing_device.user_id = user_id
            existing_device.role = role
            existing_device.device_type = device_type
            existing_device.platform = platform
            existing_device.device_info = device_info
            existing_device.app_version = app_version
            existing_device.is_active = True
            existing_device.last_used_at = datetime.utcnow()
            existing_device.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing_device)
            return existing_device
        
        device = NotificationDevice(
            user_id=user_id,
            role=role,
            device_token=device_token,
            device_type=device_type,
            platform=platform,
            device_info=device_info,
            app_version=app_version,
            is_active=True,
            last_used_at=datetime.utcnow()
        )
        self.db.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def get_user_devices(
        self,
        user_id: int,
        active_only: bool = True
    ) -> List[NotificationDevice]:
        query = self.db.query(NotificationDevice).filter(
            NotificationDevice.user_id == user_id
        )
        
        if active_only:
            query = query.filter(NotificationDevice.is_active == True)
        
        return query.order_by(NotificationDevice.last_used_at.desc()).all()

    def get_device_by_id(
        self,
        device_id: int,
        user_id: int
    ) -> Optional[NotificationDevice]:
        return self.db.query(NotificationDevice).filter(
            and_(
                NotificationDevice.id == device_id,
                NotificationDevice.user_id == user_id
            )
        ).first()

    def update_device(
        self,
        device_id: int,
        user_id: int,
        device_info: Optional[Dict[str, Any]] = None,
        app_version: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[NotificationDevice]:
        device = self.get_device_by_id(device_id, user_id)
        
        if not device:
            return None
        
        if device_info is not None:
            device.device_info = device_info
        if app_version is not None:
            device.app_version = app_version
        if is_active is not None:
            device.is_active = is_active
        
        device.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(device)
        return device

    def revoke_device(
        self,
        device_id: int,
        user_id: int
    ) -> bool:
        device = self.get_device_by_id(device_id, user_id)
        
        if not device:
            return False
        
        device.is_active = False
        device.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    def revoke_device_by_token(
        self,
        device_token: str,
        user_id: int
    ) -> bool:
        device = self.db.query(NotificationDevice).filter(
            and_(
                NotificationDevice.device_token == device_token,
                NotificationDevice.user_id == user_id
            )
        ).first()
        
        if not device:
            return False
        
        device.is_active = False
        device.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    def deactivate_user_devices(self, user_id: int) -> int:
        count = self.db.query(NotificationDevice).filter(
            and_(
                NotificationDevice.user_id == user_id,
                NotificationDevice.is_active == True
            )
        ).update({
            "is_active": False,
            "updated_at": datetime.utcnow()
        })
        self.db.commit()
        return count

    def get_active_device_tokens(self, user_id: int) -> List[str]:
        devices = self.db.query(NotificationDevice).filter(
            and_(
                NotificationDevice.user_id == user_id,
                NotificationDevice.is_active == True
            )
        ).all()
        
        return [device.device_token for device in devices]
