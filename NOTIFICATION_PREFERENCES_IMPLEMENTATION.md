# Advanced Notification Preferences System - Implementation Guide

## Overview

This document describes the comprehensive notification preferences system with granular controls, channels, quiet hours, digest mode, priority levels, smart grouping, preview testing, and analytics.

## Features Implemented

### 1. Granular Notification Controls

#### Channel Management
- **Email**: Enable/disable email notifications with type-specific controls
- **SMS**: Enable/disable SMS notifications with type-specific controls  
- **Push**: Enable/disable push notifications with type-specific controls
- **In-App**: Enable/disable in-app notifications with type-specific controls

#### Type-Specific Preferences
Each channel can have granular control over notification types:
```json
{
  "email_types": {
    "assignment_due": true,
    "grade_posted": true,
    "announcement": false
  },
  "sms_types": {
    "urgent_only": true
  }
}
```

#### Notification Groups
Organize notifications into logical groups:
- **Academic**: Assignments, grades, exams
- **Administrative**: Fees, attendance, documents
- **Social**: Messages, comments, mentions
- **System**: Account updates, security alerts
- **Announcements**: School-wide announcements
- **Events**: Calendar events, reminders

### 2. Quiet Hours Scheduling

Configure times when notifications should not be sent:
- **Start/End Time**: Define quiet hours window (e.g., 22:00 to 07:00)
- **Day Selection**: Choose specific days for quiet hours (Monday=0, Sunday=6)
- **Channel Specific**: Quiet hours apply to push and SMS only

Example configuration:
```python
{
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "07:00",
  "quiet_hours_days": [0, 1, 2, 3, 4]  # Monday to Friday
}
```

### 3. Digest Mode (Batching)

Batch notifications and send them in digests:
- **Hourly**: Send digest every hour
- **Daily**: Send digest once per day
- **Weekly**: Send digest once per week
- **Custom Time**: Specify delivery time (e.g., "09:00")

Channel Selection:
```python
{
  "digest_mode": "daily",
  "digest_channels": ["email"],
  "digest_delivery_time": "09:00"
}
```

### 4. Priority Level Filtering

Set minimum priority level to receive:
- **Low**: Receive all notifications
- **Medium**: Receive medium, high, and urgent
- **High**: Receive high and urgent only
- **Urgent**: Receive urgent only

### 5. Smart Notification Grouping

Automatically group similar notifications:
- **Grouping Window**: Time window for grouping (default: 60 minutes)
- **Group by Type**: Combine notifications of same type
- **Group by Sender**: Combine notifications from same sender
- **Collapsed Display**: Show count instead of multiple entries

Configuration:
```python
{
  "enable_smart_grouping": true,
  "grouping_window_minutes": 60
}
```

### 6. Do Not Disturb (DND)

Global override to block all notifications:
```python
{
  "dnd_enabled": true
}
```

### 7. Notification Preview Testing

Test how notifications will be delivered with current preferences:

```python
POST /api/v1/notifications/preview
{
  "title": "Test Notification",
  "message": "This is a test",
  "notification_type": "assignment_due",
  "channel": "email",
  "priority": "medium"
}
```

Response:
```json
{
  "rendered_subject": "Test Notification",
  "rendered_body": "This is a test",
  "channel": "email",
  "priority": "medium",
  "estimated_delivery_time": "Immediate",
  "would_be_sent": true,
  "blocked_reason": null
}
```

### 8. Notification Analytics

Comprehensive analytics and metrics:

#### Delivery Metrics
- Total sent
- Total delivered
- Total failed
- Delivery rate
- Failure rate

#### Engagement Metrics
- Total read
- Total clicked
- Read rate
- Click rate
- Unique clickers

#### Breakdown by Dimension
- Channel breakdown
- Priority breakdown
- Group breakdown
- Type breakdown

#### Timing Metrics
- Average delivery time
- Average read time
- Median delivery time
- Median read time

#### Timeline Data
- Hourly or daily time-series
- Sent/delivered/read/failed over time

## API Endpoints

### Notification Preferences

#### Get Preferences
```http
GET /api/v1/notifications/preferences/me
```

#### Update Preferences
```http
PUT /api/v1/notifications/preferences/me
Content-Type: application/json

{
  "email_enabled": true,
  "push_enabled": true,
  "email_types": {...},
  "minimum_priority": "medium",
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "07:00",
  "digest_mode": "daily",
  "enable_smart_grouping": true
}
```

#### Configure Quiet Hours
```http
POST /api/v1/notifications/preferences/quiet-hours
Content-Type: application/json

{
  "enabled": true,
  "start_time": "22:00",
  "end_time": "07:00",
  "days": [0, 1, 2, 3, 4]
}
```

#### Configure Digest Mode
```http
POST /api/v1/notifications/preferences/digest-mode
Content-Type: application/json

{
  "digest_mode": "daily",
  "channels": ["email"],
  "delivery_time": "09:00"
}
```

#### Configure Smart Grouping
```http
POST /api/v1/notifications/preferences/smart-grouping
Content-Type: application/json

{
  "enable_smart_grouping": true,
  "grouping_window_minutes": 60
}
```

#### Toggle Do Not Disturb
```http
POST /api/v1/notifications/preferences/dnd
Content-Type: application/json

{
  "enabled": true
}
```

### Notification Management

#### Get Notifications
```http
GET /api/v1/notifications?status=unread&channel=email&group=academic&skip=0&limit=50
```

#### Get Stats
```http
GET /api/v1/notifications/stats
```

#### Get Group Summary
```http
GET /api/v1/notifications/groups/summary
```

#### Mark as Read
```http
PATCH /api/v1/notifications/{notification_id}/read
```

#### Mark All as Read
```http
POST /api/v1/notifications/mark-all-read
```

### Preview and Testing

#### Preview Notification
```http
POST /api/v1/notifications/preview
Content-Type: application/json

{
  "title": "Test",
  "message": "Test message",
  "notification_type": "test",
  "channel": "email",
  "priority": "medium"
}
```

#### Test Quiet Hours
```http
GET /api/v1/notifications/test/quiet-hours
```

### Engagement Tracking

#### Record Engagement
```http
POST /api/v1/notifications/engagement
Content-Type: application/json

{
  "notification_id": 123,
  "action": "clicked",
  "action_data": {
    "link": "/assignments/456"
  }
}
```

### Analytics

#### Get Delivery Metrics
```http
GET /api/v1/notification-analytics/delivery-metrics?start_date=2024-01-01&end_date=2024-01-31&channel=email
```

#### Get Engagement Metrics
```http
GET /api/v1/notification-analytics/engagement-metrics?start_date=2024-01-01&end_date=2024-01-31
```

#### Get Channel Breakdown
```http
GET /api/v1/notification-analytics/channel-breakdown
```

#### Get Priority Breakdown
```http
GET /api/v1/notification-analytics/priority-breakdown
```

#### Get Group Breakdown
```http
GET /api/v1/notification-analytics/group-breakdown
```

#### Get Timing Metrics
```http
GET /api/v1/notification-analytics/timing-metrics
```

#### Get Timeline Data
```http
GET /api/v1/notification-analytics/timeline?granularity=day
```

#### Get Top Notification Types
```http
GET /api/v1/notification-analytics/top-types?limit=10
```

#### Get User Engagement Summary
```http
GET /api/v1/notification-analytics/user-engagement
```

#### Get Provider Stats
```http
GET /api/v1/notification-analytics/provider-stats
```

#### Get Analytics Dashboard
```http
GET /api/v1/notification-analytics/dashboard
```

## Database Schema

### Notifications Table
```sql
- id
- institution_id
- user_id
- title
- message
- notification_type
- notification_group
- priority
- channel
- status
- data (JSON)
- digest_batch_id
- grouped_with_id
- group_count
- read_at
- sent_at
- failed_at
- error_message
- created_at
- updated_at
```

### Notification Preferences Table
```sql
- id
- user_id
- email_enabled
- sms_enabled
- push_enabled
- in_app_enabled
- email_types (JSON)
- sms_types (JSON)
- push_types (JSON)
- in_app_types (JSON)
- group_preferences (JSON)
- minimum_priority
- quiet_hours_enabled
- quiet_hours_start
- quiet_hours_end
- quiet_hours_days (JSON)
- digest_mode
- digest_channels (JSON)
- digest_delivery_time
- enable_smart_grouping
- grouping_window_minutes
- dnd_enabled
- created_at
- updated_at
```

### Notification Deliveries Table
```sql
- id
- notification_id
- channel
- status
- attempt_count
- delivered_at
- failed_at
- error_message
- provider_response (JSON)
- created_at
- updated_at
```

### Notification Engagements Table
```sql
- id
- notification_id
- user_id
- action (opened, clicked, dismissed, acted)
- action_data (JSON)
- created_at
```

### Notification Analytics Table
```sql
- id
- institution_id
- date
- notification_type
- notification_group
- channel
- priority
- total_sent
- total_delivered
- total_failed
- total_read
- total_clicked
- delivery_rate
- read_rate
- click_rate
- avg_read_time_seconds
- avg_delivery_time_seconds
- created_at
- updated_at
```

## Background Tasks

### Scheduled Tasks (Celery Beat)

1. **send_scheduled_announcements**: Every minute
2. **cleanup_old_notifications**: Daily
3. **retry_failed_notifications**: Every hour
4. **aggregate_analytics**: Every hour
5. **process_grouped_notifications**: Every 15 minutes
6. **send_hourly_digest**: Every hour

### Task Functions

#### send_notification
Send individual notification respecting user preferences

#### send_bulk_notifications
Send notifications to multiple users

#### send_digest_notifications
Batch and send digest notifications

#### aggregate_analytics
Calculate and store analytics metrics

#### process_grouped_notifications
Ungroup old grouped notifications

#### cleanup_old_notifications
Remove old read notifications (90 days default)

#### retry_failed_notifications
Retry failed notifications with exponential backoff

## Usage Examples

### Setting Up User Preferences

```python
from src.services.notification_service import NotificationService

# Get or create preferences
preferences = service.get_or_create_preferences(user_id)

# Configure quiet hours
preferences.quiet_hours_enabled = True
preferences.quiet_hours_start = "22:00"
preferences.quiet_hours_end = "07:00"
preferences.quiet_hours_days = [0, 1, 2, 3, 4]  # Weekdays only

# Configure digest mode
preferences.digest_mode = "daily"
preferences.digest_channels = ["email"]
preferences.digest_delivery_time = "09:00"

# Enable smart grouping
preferences.enable_smart_grouping = True
preferences.grouping_window_minutes = 60

# Set minimum priority
preferences.minimum_priority = "medium"

db.commit()
```

### Sending Notifications

```python
# Create notification
notification = service.create_notification(
    institution_id=1,
    user_id=user.id,
    title="Assignment Due",
    message="Your assignment is due tomorrow",
    notification_type="assignment_due",
    notification_group="academic",
    channel="email",
    priority="high"
)

# Send asynchronously
from src.tasks.notification_tasks import send_notification
send_notification.delay(notification.id)
```

### Checking if Notification Should Be Sent

```python
should_send, reason = service.should_send_notification(
    user_id=user.id,
    channel="email",
    notification_type="assignment_due",
    priority="high",
    notification_group="academic"
)

if not should_send:
    print(f"Notification blocked: {reason}")
```

### Recording Engagement

```python
from src.schemas.notification import NotificationEngagementCreate

engagement = NotificationEngagementCreate(
    notification_id=123,
    action="clicked",
    action_data={"link": "/assignments/456"}
)

service.record_engagement(engagement, user.id)
```

### Getting Analytics

```python
from src.services.notification_analytics_service import NotificationAnalyticsService
from datetime import datetime, timedelta

analytics_service = NotificationAnalyticsService(db)

# Get delivery metrics
delivery_metrics = analytics_service.get_delivery_metrics(
    institution_id=1,
    start_date=datetime.now() - timedelta(days=30),
    end_date=datetime.now()
)

# Get engagement metrics
engagement_metrics = analytics_service.get_engagement_metrics(
    institution_id=1,
    start_date=datetime.now() - timedelta(days=30),
    end_date=datetime.now()
)

# Get timeline
timeline = analytics_service.get_timeline_data(
    institution_id=1,
    start_date=datetime.now() - timedelta(days=7),
    end_date=datetime.now(),
    granularity="day"
)
```

## Testing

### Preview Notification
```python
from src.schemas.notification import NotificationPreviewRequest

preview = NotificationPreviewRequest(
    title="Test Notification",
    message="This is a test",
    notification_type="test",
    channel="email",
    priority="medium"
)

result = service.preview_notification(user.id, preview)
print(f"Would be sent: {result.would_be_sent}")
print(f"Blocked reason: {result.blocked_reason}")
print(f"Delivery time: {result.estimated_delivery_time}")
```

## Best Practices

1. **Always respect user preferences**: Check preferences before sending
2. **Use appropriate priority levels**: Don't overuse "urgent"
3. **Group related notifications**: Reduce notification fatigue
4. **Track engagement**: Use analytics to improve notification strategy
5. **Test before sending**: Use preview endpoint to validate
6. **Handle failures gracefully**: Implement retry logic
7. **Clean up old data**: Regular cleanup prevents database bloat
8. **Monitor analytics**: Track delivery and engagement rates

## Configuration

### Environment Variables

Add to `.env`:
```env
# Email provider (SendGrid)
SENDGRID_API_KEY=your_key
SENDER_EMAIL=noreply@example.com
SENDER_NAME=Your App

# SMS provider (MSG91)
MSG91_AUTH_KEY=your_key
MSG91_SENDER_ID=SENDER

# Push notifications (FCM)
FCM_SERVER_KEY=your_key
```

## Migration

Run the migration to create tables:
```bash
alembic upgrade head
```

## Monitoring

Monitor these metrics:
- Notification delivery rate
- Notification read rate
- Failed notification count
- Average delivery time
- User engagement rate
- Digest delivery success

## Troubleshooting

### Notifications Not Being Sent
1. Check user preferences
2. Verify quiet hours settings
3. Check DND status
4. Verify provider credentials
5. Check Celery worker status

### Low Read Rates
1. Review notification content
2. Check notification timing
3. Analyze by channel
4. Review priority usage
5. Check quiet hours overlap

### High Failure Rates
1. Verify provider credentials
2. Check user contact information
3. Review provider limits
4. Check error messages in deliveries table

## Future Enhancements

Potential improvements:
1. A/B testing for notification content
2. Machine learning for optimal send times
3. User-specific notification scheduling
4. Multi-language support
5. Rich media notifications
6. Interactive notifications
7. Notification templates management UI
8. Real-time analytics dashboard
