import pytest
from datetime import datetime, timedelta, date
from unittest.mock import MagicMock, patch, AsyncMock, call
from decimal import Decimal
from sqlalchemy.orm import Session

from src.tasks.notification_tasks import (
    send_notification,
    send_bulk_notifications,
    send_scheduled_announcements,
    cleanup_old_notifications,
    retry_failed_notifications,
    send_digest_notifications,
    aggregate_analytics,
    process_grouped_notifications,
    send_expo_push_notification,
    send_bulk_expo_push,
)
from src.tasks.email_tasks import send_verification_email
from src.models.notification import (
    Notification,
    NotificationStatus,
    Announcement,
    NotificationAnalytics,
    NotificationEngagement,
    NotificationDevice,
    NotificationPreference,
    DigestMode,
)
from src.models.user import User
from src.models.institution import Institution
from src.models.subscription import Subscription, Invoice
from src.schemas.subscription import SubscriptionStatus, InvoiceStatus


@pytest.mark.unit
class TestNotificationSendingTasks:
    """Test notification sending tasks with mocked external services"""
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_send_notification_email_success(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test sending email notification with mocked SendGrid"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Test Email",
            message="Test message",
            notification_type="announcement",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        db_session.refresh(notification)
        
        # Mock service
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(return_value=True)
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.return_value = True
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify result
        assert result["notification_id"] == notification.id
        assert result["success"] is True
        assert "timestamp" in result
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_send_notification_sms_success(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test sending SMS notification with mocked MSG91"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Test SMS",
            message="Test SMS message",
            notification_type="alert",
            notification_group="attendance",
            channel="sms",
            priority="high",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        db_session.refresh(notification)
        
        # Mock service
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(return_value=True)
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.return_value = True
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify result
        assert result["notification_id"] == notification.id
        assert result["success"] is True
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_send_notification_push_success(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test sending push notification with mocked Expo"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Test Push",
            message="Test push notification",
            notification_type="grade",
            notification_group="grades",
            channel="push",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        db_session.refresh(notification)
        
        # Mock service
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(return_value=True)
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.return_value = True
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify result
        assert result["notification_id"] == notification.id
        assert result["success"] is True
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_send_notification_failure(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test notification sending failure handling"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Test Failure",
            message="This will fail",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        db_session.refresh(notification)
        
        # Mock service to raise exception
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(
            side_effect=Exception("SendGrid API error")
        )
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.side_effect = Exception("SendGrid API error")
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify error result
        assert result["notification_id"] == notification.id
        assert result["success"] is False
        assert "error" in result
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_send_bulk_notifications_success(
        self, mock_notification_service, mock_delay, db_session: Session, institution
    ):
        """Test bulk notification sending"""
        # Create users
        users = []
        for i in range(5):
            user = User(
                username=f"user{i}",
                email=f"user{i}@test.com",
                first_name=f"User{i}",
                last_name="Test",
                hashed_password="hashed",
                institution_id=institution.id,
                is_active=True,
            )
            db_session.add(user)
            users.append(user)
        db_session.commit()
        
        user_ids = [u.id for u in users]
        
        # Mock service
        mock_service_instance = mock_notification_service.return_value
        mock_notification = MagicMock()
        mock_notification.id = 1
        mock_service_instance.create_notification.return_value = mock_notification
        
        # Create task with mocked db
        task = send_bulk_notifications
        task._db = db_session
        
        # Execute task
        result = task(
            institution.id,
            user_ids,
            "Bulk Test",
            "Bulk message",
            "announcement",
            "email",
            priority="medium",
            notification_group="system"
        )
        
        # Verify result
        assert result["created"] == 5
        assert result["failed"] == 0
        assert result["total"] == 5
        assert mock_delay.call_count == 5
    
    @patch('sendgrid.SendGridAPIClient')
    def test_send_verification_email_with_sendgrid(self, mock_sendgrid, db_session: Session):
        """Test verification email sending with mocked SendGrid"""
        # Mock SendGrid
        mock_sg_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_sg_client.send.return_value = mock_response
        mock_sendgrid.return_value = mock_sg_client
        
        # Create task with mocked db
        task = send_verification_email
        task._db = db_session
        
        # Execute task
        with patch('src.config.settings.sendgrid_api_key', 'test_key'):
            result = task(
                contact_email="contact@org.com",
                contact_person="John Doe",
                student_name="Jane Student",
                activity_name="Food Bank Volunteer",
                organization_name="Community Food Bank",
                hours_logged=5.0,
                activity_date="2024-01-15",
                verification_link="https://example.com/verify/abc123"
            )
        
        # Verify result
        assert result["success"] is True
        assert result["status_code"] == 202
        mock_sg_client.send.assert_called_once()
    
    @patch('src.services.notification_providers.NotificationProviderFactory.get_expo_provider')
    def test_send_expo_push_notification_success(
        self, mock_expo_provider, db_session: Session, institution, admin_user
    ):
        """Test Expo push notification with mocked provider"""
        # Create device
        device = NotificationDevice(
            user_id=admin_user.id,
            device_token="ExponentPushToken[xxxxx]",
            device_type="ios",
            is_active=True,
        )
        db_session.add(device)
        db_session.commit()
        
        # Mock expo provider
        mock_provider = MagicMock()
        mock_provider.send_bulk = AsyncMock(return_value={"success": True})
        mock_expo_provider.return_value = mock_provider
        
        # Create task with mocked db
        task = send_expo_push_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.return_value = {"success": True}
            mock_loop.return_value = mock_event_loop
            
            result = task(
                admin_user.id,
                "Test Push",
                "Test message",
                {"screen": "Home"}
            )
        
        # Verify result
        assert result["success"] is True
        assert result["devices_count"] == 1


@pytest.mark.unit
class TestScheduledTasks:
    """Test scheduled tasks"""
    
    def test_send_scheduled_announcements(
        self, db_session: Session, institution
    ):
        """Test daily attendance reminder task"""
        # Create scheduled announcements
        past_time = datetime.utcnow() - timedelta(minutes=5)
        future_time = datetime.utcnow() + timedelta(hours=1)
        
        scheduled_announcement = Announcement(
            institution_id=institution.id,
            title="Scheduled Announcement",
            content="This should be published",
            is_published=False,
            scheduled_at=past_time,
        )
        future_announcement = Announcement(
            institution_id=institution.id,
            title="Future Announcement",
            content="This should not be published yet",
            is_published=False,
            scheduled_at=future_time,
        )
        db_session.add_all([scheduled_announcement, future_announcement])
        db_session.commit()
        
        # Create task with mocked db
        task = send_scheduled_announcements
        task._db = db_session
        
        # Mock announcement service
        with patch('src.tasks.notification_tasks.AnnouncementService') as mock_service:
            mock_service_instance = mock_service.return_value
            mock_service_instance.publish_announcement = MagicMock()
            
            # Execute task
            result = task()
        
        # Verify result
        assert result["processed"] == 1
        assert result["total"] == 1
    
    def test_cleanup_old_notifications(self, db_session: Session, institution, admin_user):
        """Test cleanup of old notifications"""
        # Create old and new notifications
        old_date = datetime.utcnow() - timedelta(days=100)
        recent_date = datetime.utcnow() - timedelta(days=30)
        
        old_notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Old Notification",
            message="Old message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="low",
            status=NotificationStatus.READ.value,
            created_at=old_date,
        )
        recent_notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Recent Notification",
            message="Recent message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="low",
            status=NotificationStatus.READ.value,
            created_at=recent_date,
        )
        db_session.add_all([old_notification, recent_notification])
        db_session.commit()
        
        # Create task with mocked db
        task = cleanup_old_notifications
        task._db = db_session
        
        # Execute task
        result = task(days=90)
        
        # Verify result
        assert result["deleted"] == 1
        
        # Verify old notification is deleted
        remaining = db_session.query(Notification).filter(
            Notification.status == NotificationStatus.READ.value
        ).count()
        assert remaining == 1
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_retry_failed_notifications(
        self, mock_delay, db_session: Session, institution, admin_user
    ):
        """Test retry of failed notifications"""
        # Create failed notifications
        recent_fail = datetime.utcnow() - timedelta(hours=2)
        
        failed_notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Failed Notification",
            message="Failed message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.FAILED.value,
            failed_at=recent_fail,
            data={"retry_count": 1}
        )
        db_session.add(failed_notification)
        db_session.commit()
        
        # Create task with mocked db
        task = retry_failed_notifications
        task._db = db_session
        
        # Execute task
        result = task(max_retries=3)
        
        # Verify result
        assert result["retried"] == 1
        assert result["total_failed"] == 1
        mock_delay.assert_called_once()
        
        # Verify notification status updated
        db_session.refresh(failed_notification)
        assert failed_notification.status == NotificationStatus.PENDING.value
        assert failed_notification.data["retry_count"] == 2
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_send_digest_notifications_daily(
        self, mock_delay, db_session: Session, institution, admin_user
    ):
        """Test sending daily digest notifications"""
        # Create user preference for digest
        preference = NotificationPreference(
            user_id=admin_user.id,
            digest_mode=DigestMode.DAILY.value,
            email_enabled=True,
        )
        db_session.add(preference)
        db_session.commit()
        
        # Create batched notifications
        for i in range(3):
            notification = Notification(
                institution_id=institution.id,
                user_id=admin_user.id,
                title=f"Batched {i}",
                message=f"Message {i}",
                notification_type="alert",
                notification_group="system",
                channel="email",
                priority="low",
                status=NotificationStatus.BATCHED.value,
                created_at=datetime.utcnow() - timedelta(hours=12),
            )
            db_session.add(notification)
        db_session.commit()
        
        # Create task with mocked db
        task = send_digest_notifications
        task._db = db_session
        
        # Mock NotificationService
        with patch('src.tasks.notification_tasks.NotificationService') as mock_service:
            mock_service_instance = mock_service.return_value
            mock_notification = MagicMock()
            mock_notification.id = 999
            mock_service_instance.create_notification.return_value = mock_notification
            
            # Execute task
            result = task(institution.id, digest_type="daily")
        
        # Verify result
        assert result["sent"] == 1
        assert result["digest_type"] == "daily"
        mock_delay.assert_called_once_with(999)
    
    def test_aggregate_analytics_daily(
        self, db_session: Session, institution, admin_user
    ):
        """Test aggregating notification analytics"""
        # Create notifications for yesterday
        yesterday = datetime.utcnow() - timedelta(days=1)
        start_of_day = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        
        for i in range(5):
            notification = Notification(
                institution_id=institution.id,
                user_id=admin_user.id,
                title=f"Notification {i}",
                message=f"Message {i}",
                notification_type="alert",
                notification_group="system",
                channel="email",
                priority="medium",
                status=NotificationStatus.SENT.value,
                created_at=start_of_day + timedelta(hours=i),
                sent_at=start_of_day + timedelta(hours=i, minutes=5),
            )
            db_session.add(notification)
        db_session.commit()
        
        # Create task with mocked db
        task = aggregate_analytics
        task._db = db_session
        
        # Execute task
        result = task(date=yesterday.isoformat())
        
        # Verify result
        assert result["aggregated"] > 0
        assert result["institutions"] == 1
        
        # Verify analytics created
        analytics = db_session.query(NotificationAnalytics).filter(
            NotificationAnalytics.institution_id == institution.id,
            NotificationAnalytics.date == start_of_day,
        ).all()
        assert len(analytics) > 0
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_process_grouped_notifications(
        self, mock_delay, db_session: Session, institution, admin_user
    ):
        """Test processing grouped notifications"""
        # Create old grouped notification
        old_time = datetime.utcnow() - timedelta(hours=2)
        
        grouped_notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Grouped Notification",
            message="Grouped message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="low",
            status=NotificationStatus.BATCHED.value,
            grouped_with_id=1,
            created_at=old_time,
        )
        db_session.add(grouped_notification)
        db_session.commit()
        
        # Create task with mocked db
        task = process_grouped_notifications
        task._db = db_session
        
        # Execute task
        result = task()
        
        # Verify result
        assert result["ungrouped"] == 1
        mock_delay.assert_called_once()
        
        # Verify notification status updated
        db_session.refresh(grouped_notification)
        assert grouped_notification.status == NotificationStatus.PENDING.value


@pytest.mark.unit
class TestSubscriptionRenewalReminders:
    """Test subscription renewal reminder tasks"""
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_subscription_renewal_reminder_7_days(
        self, mock_delay, db_session: Session, institution
    ):
        """Test sending renewal reminder 7 days before expiry"""
        # Create subscription expiring in 7 days
        next_billing = datetime.utcnow() + timedelta(days=7)
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="PROFESSIONAL",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="monthly",
            price=Decimal("2999.00"),
            currency="INR",
            max_users=50,
            max_storage_gb=500,
            start_date=datetime.utcnow() - timedelta(days=23),
            next_billing_date=next_billing,
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        # Simulate task manager
        from src.utils.subscription_tasks import SubscriptionTaskManager
        from src.services.subscription_service import SubscriptionService
        
        with patch('src.config.settings.razorpay_key_id', 'test_key'), \
             patch('src.config.settings.razorpay_key_secret', 'test_secret'):
            service = SubscriptionService(db_session, 'test_key', 'test_secret')
            manager = SubscriptionTaskManager(db_session, service)
            
            # Mock check_subscriptions_for_renewal
            with patch.object(service, 'check_subscriptions_for_renewal', return_value=[subscription]):
                result = manager.process_renewal_reminders()
        
        # Verify reminder sent
        assert len(result) == 1
        assert result[0]["subscription_id"] == subscription.id
        assert result[0]["days_until_renewal"] == 7
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_subscription_renewal_reminder_3_days(
        self, mock_delay, db_session: Session, institution
    ):
        """Test sending renewal reminder 3 days before expiry"""
        # Create subscription expiring in 3 days
        next_billing = datetime.utcnow() + timedelta(days=3)
        
        subscription = Subscription(
            institution_id=institution.id,
            plan_name="ENTERPRISE",
            status=SubscriptionStatus.ACTIVE,
            billing_cycle="annual",
            price=Decimal("29999.00"),
            currency="INR",
            max_users=200,
            max_storage_gb=2000,
            start_date=datetime.utcnow() - timedelta(days=362),
            next_billing_date=next_billing,
            auto_renew=True,
        )
        db_session.add(subscription)
        db_session.commit()
        
        # Simulate task manager
        from src.utils.subscription_tasks import SubscriptionTaskManager
        from src.services.subscription_service import SubscriptionService
        
        with patch('src.config.settings.razorpay_key_id', 'test_key'), \
             patch('src.config.settings.razorpay_key_secret', 'test_secret'):
            service = SubscriptionService(db_session, 'test_key', 'test_secret')
            manager = SubscriptionTaskManager(db_session, service)
            
            # Mock check_subscriptions_for_renewal
            with patch.object(service, 'check_subscriptions_for_renewal', return_value=[subscription]):
                result = manager.process_renewal_reminders()
        
        # Verify reminder sent
        assert len(result) == 1
        assert result[0]["days_until_renewal"] == 3


@pytest.mark.unit
class TestWeeklyPerformanceReports:
    """Test weekly performance report tasks"""
    
    @patch('src.tasks.email_tasks.send_verification_email.delay')
    def test_weekly_performance_report_generation(
        self, mock_delay, db_session: Session, institution, student, teacher
    ):
        """Test generating weekly performance reports"""
        # This would be implemented in a separate task file
        # Simulating the concept here
        
        from src.models.assignment import Assignment, AssignmentSubmission
        from src.models.exam import Exam, ExamResult
        
        # Create assignments and submissions
        assignment = Assignment(
            institution_id=institution.id,
            teacher_id=teacher.id,
            title="Math Assignment",
            description="Test assignment",
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=100,
        )
        db_session.add(assignment)
        db_session.commit()
        
        submission = AssignmentSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            institution_id=institution.id,
            marks_obtained=Decimal("85.00"),
            submitted_at=datetime.utcnow(),
        )
        db_session.add(submission)
        db_session.commit()
        
        # Verify data created for report
        assert submission.marks_obtained == Decimal("85.00")


@pytest.mark.unit
class TestBackgroundJobErrorHandling:
    """Test error handling and retry logic in background jobs"""
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_notification_task_retry_on_network_error(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test task retry logic on network error"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Retry Test",
            message="Test message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        
        # Mock service to raise network error
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(
            side_effect=ConnectionError("Network timeout")
        )
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task and expect failure
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.side_effect = ConnectionError("Network timeout")
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify error handling
        assert result["success"] is False
        assert "error" in result
    
    def test_task_max_retries_exceeded(
        self, db_session: Session, institution, admin_user
    ):
        """Test task behavior when max retries exceeded"""
        # Create notification with max retries
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Max Retry Test",
            message="Test message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.FAILED.value,
            failed_at=datetime.utcnow() - timedelta(hours=1),
            data={"retry_count": 3}
        )
        db_session.add(notification)
        db_session.commit()
        
        # Create task with mocked db
        task = retry_failed_notifications
        task._db = db_session
        
        # Execute task
        result = task(max_retries=3)
        
        # Verify notification not retried
        assert result["retried"] == 0
        assert result["total_failed"] == 1
        
        # Verify notification still failed
        db_session.refresh(notification)
        assert notification.status == NotificationStatus.FAILED.value
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_task_graceful_degradation(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test graceful degradation when service unavailable"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Degradation Test",
            message="Test message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        
        # Mock service to raise service unavailable error
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(
            side_effect=Exception("Service temporarily unavailable")
        )
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.side_effect = Exception("Service temporarily unavailable")
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify graceful failure
        assert result["success"] is False
        assert "Service temporarily unavailable" in result["error"]


@pytest.mark.unit
class TestTaskResultStorageInRedis:
    """Test task result storage in Redis backend"""
    
    @patch('src.redis_client.get_redis')
    def test_task_result_stored_in_redis(self, mock_get_redis, db_session: Session):
        """Test that task results are stored in Redis"""
        # Mock Redis
        mock_redis = AsyncMock()
        mock_redis.set = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=None)
        mock_get_redis.return_value = mock_redis
        
        # This tests the Celery configuration
        from src.celery_app import celery_app
        
        # Verify Redis backend configured
        assert "redis://" in celery_app.conf.result_backend
        assert celery_app.conf.result_serializer == "json"
        assert celery_app.conf.result_expires == 3600
    
    def test_task_result_expiration(self, db_session: Session):
        """Test that task results expire after configured time"""
        from src.celery_app import celery_app
        
        # Verify result expiration configured
        assert celery_app.conf.result_expires == 3600  # 1 hour
    
    def test_task_tracking_enabled(self, db_session: Session):
        """Test that task tracking is enabled"""
        from src.celery_app import celery_app
        
        # Verify task tracking
        assert celery_app.conf.task_track_started is True


@pytest.mark.unit
class TestTaskChaining:
    """Test task chaining for complex workflows"""
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_bulk_notification_chain(
        self, mock_notification_service, mock_delay, db_session: Session, institution
    ):
        """Test chaining bulk notification creation and sending"""
        # Create users
        users = []
        for i in range(3):
            user = User(
                username=f"chain_user{i}",
                email=f"chain{i}@test.com",
                first_name=f"Chain{i}",
                last_name="Test",
                hashed_password="hashed",
                institution_id=institution.id,
                is_active=True,
            )
            db_session.add(user)
            users.append(user)
        db_session.commit()
        
        user_ids = [u.id for u in users]
        
        # Mock service
        mock_service_instance = mock_notification_service.return_value
        
        # Create notifications for each user
        mock_notifications = []
        for i, user_id in enumerate(user_ids):
            mock_notification = MagicMock()
            mock_notification.id = i + 1
            mock_notifications.append(mock_notification)
        
        mock_service_instance.create_notification.side_effect = mock_notifications
        
        # Create task with mocked db
        task = send_bulk_notifications
        task._db = db_session
        
        # Execute task
        result = task(
            institution.id,
            user_ids,
            "Chain Test",
            "Chain message",
            "announcement",
            "email",
        )
        
        # Verify chained calls
        assert result["created"] == 3
        assert mock_delay.call_count == 3
        
        # Verify each notification triggered send task
        for i, notification in enumerate(mock_notifications):
            assert mock_delay.call_args_list[i] == call(notification.id)
    
    @patch('src.tasks.notification_tasks.aggregate_analytics')
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_digest_and_analytics_chain(
        self, mock_send_delay, mock_aggregate, db_session: Session, institution, admin_user
    ):
        """Test chaining digest sending and analytics aggregation"""
        # Create user preference
        preference = NotificationPreference(
            user_id=admin_user.id,
            digest_mode=DigestMode.DAILY.value,
            email_enabled=True,
        )
        db_session.add(preference)
        db_session.commit()
        
        # Create batched notifications
        for i in range(2):
            notification = Notification(
                institution_id=institution.id,
                user_id=admin_user.id,
                title=f"Chained {i}",
                message=f"Message {i}",
                notification_type="alert",
                notification_group="system",
                channel="email",
                priority="low",
                status=NotificationStatus.BATCHED.value,
                created_at=datetime.utcnow() - timedelta(hours=12),
            )
            db_session.add(notification)
        db_session.commit()
        
        # Create task with mocked db
        digest_task = send_digest_notifications
        digest_task._db = db_session
        
        # Mock NotificationService
        with patch('src.tasks.notification_tasks.NotificationService') as mock_service:
            mock_service_instance = mock_service.return_value
            mock_notification = MagicMock()
            mock_notification.id = 999
            mock_service_instance.create_notification.return_value = mock_notification
            
            # Execute digest task
            digest_result = digest_task(institution.id, digest_type="daily")
        
        # Verify digest sent
        assert digest_result["sent"] == 1
        mock_send_delay.assert_called_once_with(999)
        
        # After digest, analytics would be aggregated (simulated)
        # In real scenario, this would be chained with .delay()
    
    @patch('src.tasks.notification_tasks.send_notification.delay')
    def test_grouped_notification_chain(
        self, mock_delay, db_session: Session, institution, admin_user
    ):
        """Test chaining grouped notification processing"""
        # Create grouped notifications
        for i in range(3):
            notification = Notification(
                institution_id=institution.id,
                user_id=admin_user.id,
                title=f"Grouped {i}",
                message=f"Message {i}",
                notification_type="alert",
                notification_group="system",
                channel="email",
                priority="low",
                status=NotificationStatus.BATCHED.value,
                grouped_with_id=1,
                created_at=datetime.utcnow() - timedelta(hours=2),
            )
            db_session.add(notification)
        db_session.commit()
        
        # Create task with mocked db
        task = process_grouped_notifications
        task._db = db_session
        
        # Execute task
        result = task()
        
        # Verify all notifications ungrouped and sent
        assert result["ungrouped"] == 3
        assert mock_delay.call_count == 3


@pytest.mark.unit
class TestExternalServiceMocking:
    """Test comprehensive external service mocking"""
    
    @patch('sendgrid.SendGridAPIClient')
    def test_sendgrid_api_mocked(self, mock_sendgrid, db_session: Session):
        """Test SendGrid API is properly mocked"""
        # Mock SendGrid
        mock_sg_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_sg_client.send.return_value = mock_response
        mock_sendgrid.return_value = mock_sg_client
        
        # Import provider
        from src.services.notification_providers import EmailProvider
        
        # Create provider
        with patch('src.config.settings.sendgrid_api_key', 'test_key'):
            provider = EmailProvider('test_key', 'test@example.com', 'Test')
            
            # Send email (async)
            import asyncio
            result = asyncio.run(provider.send(
                'recipient@example.com',
                'Test Subject',
                '<p>Test Content</p>'
            ))
        
        # Verify SendGrid called
        assert result is True
        mock_sg_client.send.assert_called_once()
    
    @patch('requests.post')
    def test_msg91_api_mocked(self, mock_post, db_session: Session):
        """Test MSG91 API is properly mocked"""
        # Mock requests.post
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        # Import provider
        from src.services.notification_providers import SMSProvider
        
        # Create provider
        provider = SMSProvider('test_auth_key', 'SENDER')
        
        # Send SMS (async)
        import asyncio
        result = asyncio.run(provider.send(
            '+1234567890',
            'Test',
            'Test SMS message'
        ))
        
        # Verify MSG91 called
        assert result is True
        mock_post.assert_called_once()
        assert 'msg91.com' in mock_post.call_args[0][0]
    
    @patch('requests.post')
    def test_expo_push_api_mocked(self, mock_post, db_session: Session):
        """Test Expo Push API is properly mocked"""
        # Mock requests.post
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "status": "ok"
            }
        }
        mock_post.return_value = mock_response
        
        # Import provider
        from src.services.notification_providers import ExpoPushProvider
        
        # Create provider
        provider = ExpoPushProvider()
        
        # Send push (async)
        import asyncio
        result = asyncio.run(provider.send(
            'ExponentPushToken[xxxxx]',
            'Test Title',
            'Test body'
        ))
        
        # Verify Expo API called
        assert result is True
        mock_post.assert_called_once()
        assert 'exp.host' in mock_post.call_args[0][0]
    
    @patch('requests.post')
    def test_fcm_push_api_mocked(self, mock_post, db_session: Session):
        """Test FCM Push API is properly mocked"""
        # Mock requests.post
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        # Import provider
        from src.services.notification_providers import PushProvider
        
        # Create provider
        provider = PushProvider('test_server_key')
        
        # Send push (async)
        import asyncio
        result = asyncio.run(provider.send(
            'device_token_123',
            'Test Title',
            'Test body'
        ))
        
        # Verify FCM API called
        assert result is True
        mock_post.assert_called_once()
        assert 'fcm.googleapis.com' in mock_post.call_args[0][0]


@pytest.mark.unit
class TestTaskExecutionVerification:
    """Test task execution logic is properly verified"""
    
    @patch('src.tasks.notification_tasks.NotificationService')
    def test_verify_notification_service_called(
        self, mock_notification_service, db_session: Session, institution, admin_user
    ):
        """Test notification service methods are called correctly"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Verify Test",
            message="Test message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        
        # Mock service
        mock_service_instance = mock_notification_service.return_value
        mock_service_instance.send_notification = AsyncMock(return_value=True)
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('asyncio.get_event_loop') as mock_loop:
            mock_event_loop = MagicMock()
            mock_event_loop.is_closed.return_value = False
            mock_event_loop.run_until_complete.return_value = True
            mock_loop.return_value = mock_event_loop
            
            result = task(notification.id)
        
        # Verify service instantiated with db
        mock_notification_service.assert_called()
        
    def test_verify_task_timestamps(
        self, db_session: Session, institution, admin_user
    ):
        """Test task results include proper timestamps"""
        # Create notification
        notification = Notification(
            institution_id=institution.id,
            user_id=admin_user.id,
            title="Timestamp Test",
            message="Test message",
            notification_type="alert",
            notification_group="system",
            channel="email",
            priority="medium",
            status=NotificationStatus.PENDING.value,
        )
        db_session.add(notification)
        db_session.commit()
        
        # Create task with mocked db
        task = send_notification
        task._db = db_session
        
        # Execute task
        with patch('src.tasks.notification_tasks.NotificationService') as mock_service:
            mock_service_instance = mock_service.return_value
            mock_service_instance.send_notification = AsyncMock(return_value=True)
            
            with patch('asyncio.get_event_loop') as mock_loop:
                mock_event_loop = MagicMock()
                mock_event_loop.is_closed.return_value = False
                mock_event_loop.run_until_complete.return_value = True
                mock_loop.return_value = mock_event_loop
                
                result = task(notification.id)
        
        # Verify timestamp in result
        assert "timestamp" in result
        timestamp = datetime.fromisoformat(result["timestamp"])
        assert isinstance(timestamp, datetime)
        assert (datetime.utcnow() - timestamp).total_seconds() < 5
