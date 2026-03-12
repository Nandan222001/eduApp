# Advanced Notification Preferences - Quick Start Guide

## Overview
Comprehensive notification system with granular controls, scheduling, batching, and analytics.

## Quick Setup

### 1. Run Migration
```bash
alembic upgrade head
```

### 2. Configure Environment Variables
```env
# Email (SendGrid)
SENDGRID_API_KEY=your_key
SENDER_EMAIL=noreply@example.com

# SMS (MSG91)
MSG91_AUTH_KEY=your_key
MSG91_SENDER_ID=SENDER

# Push (FCM)
FCM_SERVER_KEY=your_key
```

### 3. Start Celery Workers
```bash
celery -A src.celery_app worker --loglevel=info
celery -A src.celery_app beat --loglevel=info
```

## Key Features

### Channel Controls
- **Email, SMS, Push, In-App**
- Type-specific preferences per channel
- Notification groups (Academic, Administrative, Social, etc.)

### Quiet Hours
- Set time windows (e.g., 22:00-07:00)
- Choose specific days
- Applies to Push/SMS only

### Digest Mode
- Batch notifications: Hourly, Daily, Weekly
- Custom delivery times
- Channel-specific

### Smart Grouping
- Auto-group similar notifications
- Configurable time window (default: 60 min)
- Reduces notification fatigue

### Priority Filtering
- Set minimum priority level
- Low, Medium, High, Urgent

### Do Not Disturb
- Global notification block
- Quick on/off toggle

## Common API Calls

### Get User Preferences
```bash
curl -X GET http://localhost:8000/api/v1/notifications/preferences/me \
  -H "Authorization: Bearer {token}"
```

### Update Preferences
```bash
curl -X PUT http://localhost:8000/api/v1/notifications/preferences/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "email_enabled": true,
    "push_enabled": true,
    "quiet_hours_enabled": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00",
    "digest_mode": "daily",
    "minimum_priority": "medium"
  }'
```

### Set Quiet Hours
```bash
curl -X POST http://localhost:8000/api/v1/notifications/preferences/quiet-hours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "enabled": true,
    "start_time": "22:00",
    "end_time": "07:00",
    "days": [0, 1, 2, 3, 4]
  }'
```

### Enable Digest Mode
```bash
curl -X POST http://localhost:8000/api/v1/notifications/preferences/digest-mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "digest_mode": "daily",
    "channels": ["email"],
    "delivery_time": "09:00"
  }'
```

### Preview Notification
```bash
curl -X POST http://localhost:8000/api/v1/notifications/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test",
    "notification_type": "test",
    "channel": "email",
    "priority": "medium"
  }'
```

### Get Analytics Dashboard
```bash
curl -X GET "http://localhost:8000/api/v1/notification-analytics/dashboard?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer {token}"
```

## Notification Groups

Available groups:
- `academic` - Assignments, grades, exams
- `administrative` - Fees, attendance
- `social` - Messages, comments
- `system` - Account, security alerts
- `announcements` - School-wide announcements
- `assignments` - Assignment-specific
- `grades` - Grade-related
- `attendance` - Attendance alerts
- `fees` - Fee reminders
- `events` - Calendar events

## Priority Levels

- `low` - Optional information
- `medium` - Standard notifications
- `high` - Important updates
- `urgent` - Critical alerts

## Channels

- `email` - Email notifications
- `sms` - SMS messages
- `push` - Push notifications
- `in_app` - In-app notifications

## Digest Modes

- `disabled` - Send immediately
- `hourly` - Batch per hour
- `daily` - Batch per day
- `weekly` - Batch per week

## Analytics Endpoints

### Delivery Metrics
```bash
GET /api/v1/notification-analytics/delivery-metrics
```

### Engagement Metrics
```bash
GET /api/v1/notification-analytics/engagement-metrics
```

### Channel Breakdown
```bash
GET /api/v1/notification-analytics/channel-breakdown
```

### Timeline Data
```bash
GET /api/v1/notification-analytics/timeline?granularity=day
```

### User Engagement
```bash
GET /api/v1/notification-analytics/user-engagement
```

## Code Examples

### Create Notification
```python
from src.services.notification_service import NotificationService

service = NotificationService(db)
notification = service.create_notification(
    institution_id=1,
    user_id=123,
    title="Assignment Due",
    message="Your assignment is due tomorrow",
    notification_type="assignment_due",
    notification_group="academic",
    channel="email",
    priority="high"
)
```

### Check User Preferences
```python
should_send, reason = service.should_send_notification(
    user_id=123,
    channel="email",
    notification_type="assignment_due",
    priority="high",
    notification_group="academic"
)
```

### Record Engagement
```python
from src.schemas.notification import NotificationEngagementCreate

engagement = NotificationEngagementCreate(
    notification_id=123,
    action="clicked",
    action_data={"link": "/assignments/456"}
)
service.record_engagement(engagement, user_id)
```

### Get Analytics
```python
from src.services.notification_analytics_service import NotificationAnalyticsService

analytics = NotificationAnalyticsService(db)
metrics = analytics.get_delivery_metrics(
    institution_id=1,
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 1, 31)
)
```

## Background Tasks

Celery Beat schedules:
- **send_scheduled_announcements**: Every minute
- **cleanup_old_notifications**: Daily
- **retry_failed_notifications**: Hourly
- **aggregate_analytics**: Hourly
- **process_grouped_notifications**: Every 15 minutes
- **send_hourly_digest**: Hourly

## Database Tables

Core tables:
- `notifications` - Notification records
- `notification_preferences` - User preferences
- `notification_deliveries` - Delivery tracking
- `notification_engagements` - User interactions
- `notification_analytics` - Aggregated metrics

## Troubleshooting

### Notifications Not Sending
1. Check Celery workers: `celery -A src.celery_app inspect active`
2. Verify user preferences
3. Check quiet hours/DND status
4. Verify provider credentials

### Low Delivery Rates
1. Check provider credentials
2. Verify contact information
3. Review error logs in `notification_deliveries`
4. Check rate limits

### Preview Issues
1. Verify user has preferences
2. Check notification type configuration
3. Review channel settings

## Best Practices

1. ✅ **Use appropriate priorities** - Don't overuse "urgent"
2. ✅ **Test with preview** - Always preview before bulk send
3. ✅ **Monitor analytics** - Track delivery and engagement
4. ✅ **Respect user preferences** - Always check before sending
5. ✅ **Use smart grouping** - Reduce notification fatigue
6. ✅ **Clean old data** - Regular cleanup prevents bloat
7. ✅ **Handle failures** - Implement retry logic
8. ✅ **Track engagement** - Use analytics to improve

## Support

For issues or questions:
1. Check logs: `logs/celery.log`, `logs/app.log`
2. Review documentation: `NOTIFICATION_PREFERENCES_IMPLEMENTATION.md`
3. Check database: Query `notification_deliveries` for errors
4. Monitor Celery: Use Flower for task monitoring
