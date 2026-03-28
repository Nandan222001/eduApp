# Live Events Streaming API Documentation

## Overview

The Live Events API provides comprehensive functionality for hosting and managing live streaming events for schools, including sports games, concerts, plays, graduations, assemblies, and parent meetings.

## Features

- **Multiple Event Types**: Support for various event types (sports games, concerts, plays, graduations, assemblies, parent meetings)
- **Stream Platforms**: Integration with YouTube Live and Vimeo Live
- **Access Control**: Public, parents-only, or grade-specific access restrictions
- **Monetization**: Ticketed events with payment processing
- **Real-time Chat**: Live chat with moderation capabilities
- **Analytics**: Comprehensive viewer and engagement analytics
- **Recording**: Automatic recording and archival

## Models

### LiveEvent

Main event model with the following key fields:

- `event_name`: Name of the event
- `event_type`: Type (sports_game, concert, play, graduation, assembly, parent_meeting)
- `scheduled_start_time`: When the event is scheduled to start
- `stream_url`: URL to watch the stream
- `recording_url`: URL of the recorded event (post-event)
- `viewer_count`: Current number of viewers
- `chat_enabled`: Whether chat is enabled
- `restricted_access`: Access level (public, parents_only, specific_grades)
- `monetization_enabled`: Whether tickets are required
- `ticket_price`: Price for ticketed events

### EventViewer

Tracks individual viewer sessions:

- `user_id`: User watching the event
- `joined_at`: When they joined
- `watch_duration`: Total watch time in seconds
- `is_currently_watching`: Whether currently watching
- `messages_sent`: Number of chat messages sent

### EventChatMessage

Chat messages during the event:

- `message`: The message content
- `is_deleted`: Whether deleted by moderator
- `is_flagged`: Whether flagged for review
- `moderated_by`: User who moderated (if applicable)

### EventTicket

For monetized events:

- `ticket_code`: Unique ticket code
- `amount_paid`: Amount paid
- `payment_status`: pending, completed, failed, refunded
- `is_redeemed`: Whether ticket has been used

## API Endpoints

### Event Management

#### Create Live Event
```
POST /api/v1/live-events/
```

Create a new live streaming event.

Request body:
```json
{
  "institution_id": 1,
  "event_name": "Annual Sports Day 2024",
  "event_type": "sports_game",
  "description": "Annual sports competition",
  "scheduled_start_time": "2024-01-15T10:00:00Z",
  "scheduled_end_time": "2024-01-15T15:00:00Z",
  "stream_platform": "youtube",
  "chat_enabled": true,
  "chat_moderated": true,
  "restricted_access": "parents_only",
  "monetization_enabled": false,
  "auto_record": true
}
```

#### List Live Events
```
GET /api/v1/live-events/?event_type=sports_game&status=live
```

#### Get Event Details
```
GET /api/v1/live-events/{event_id}
```

Returns detailed event information including current viewers, total messages, tickets sold, and revenue.

#### Update Event
```
PUT /api/v1/live-events/{event_id}
```

#### Delete Event
```
DELETE /api/v1/live-events/{event_id}
```

### Stream Management

#### Generate Stream Key
```
POST /api/v1/live-events/{event_id}/stream/generate-key
```

Generates stream key and RTMP URL for broadcasting software (OBS, etc.).

Response:
```json
{
  "stream_key": "xxxx-xxxx-xxxx",
  "stream_url": "https://youtube.com/watch?v=xxxxx",
  "rtmp_url": "rtmp://a.rtmp.youtube.com/live2/xxxxx",
  "instructions": "Use OBS or similar software..."
}
```

#### Start Stream
```
POST /api/v1/live-events/{event_id}/stream/start
```

Begins the live stream.

#### End Stream
```
POST /api/v1/live-events/{event_id}/stream/end
```

Ends the stream and triggers recording processing.

### Access Control

#### Check Access Permissions
```
GET /api/v1/live-events/{event_id}/access-check
```

Checks if current user has permission to view the event.

Response:
```json
{
  "has_access": true,
  "requires_ticket": false,
  "reason": null,
  "ticket_price": null
}
```

### Viewer Management

#### Join Event
```
POST /api/v1/live-events/{event_id}/viewers
```

Registers user as a viewer and starts tracking watch duration.

#### Update Viewer Session
```
PUT /api/v1/live-events/{event_id}/viewers/{viewer_id}
```

Update watch duration or leave event.

#### List Viewers
```
GET /api/v1/live-events/{event_id}/viewers?currently_watching=true
```

### Chat Management

#### Send Chat Message
```
POST /api/v1/live-events/{event_id}/chat
```

Request:
```json
{
  "live_event_id": 1,
  "message": "Great performance!",
  "message_type": "text"
}
```

Messages are automatically moderated based on configured rules.

#### Get Chat Messages
```
GET /api/v1/live-events/{event_id}/chat?limit=50
```

#### Moderate Message
```
PUT /api/v1/live-events/chat/{message_id}/moderate
```

Delete or flag a message.

### Moderation Rules

#### Create Moderation Rule
```
POST /api/v1/live-events/moderation-rules
```

Request:
```json
{
  "institution_id": 1,
  "rule_type": "banned_word",
  "rule_value": "badword1,badword2,badword3",
  "action": "delete",
  "severity": "high"
}
```

Rule types:
- `banned_word`: Comma-separated list of banned words
- `regex_pattern`: Regular expression pattern
- `spam_detection`: Automatic spam detection
- `profanity`: Profanity filter
- `url_filter`: Block URLs
- `caps_lock`: Excessive capital letters

Actions:
- `flag`: Flag for moderator review
- `delete`: Automatically delete message
- `block_user`: Block user from chat

#### List Moderation Rules
```
GET /api/v1/live-events/moderation-rules
```

### Analytics

#### Get Event Analytics
```
GET /api/v1/live-events/{event_id}/analytics
```

Returns comprehensive analytics:
- Total viewers, current viewers, peak viewers
- Average watch duration
- Chat statistics
- Revenue (if monetized)
- Stream quality metrics

### Ticket Management

#### Purchase Ticket
```
POST /api/v1/live-events/{event_id}/tickets
```

Creates a ticket for a monetized event.

#### Get My Ticket
```
GET /api/v1/live-events/{event_id}/tickets/my-ticket
```

#### List Event Tickets
```
GET /api/v1/live-events/{event_id}/tickets?payment_status=completed
```

#### Redeem Ticket
```
POST /api/v1/live-events/{event_id}/tickets/{ticket_id}/redeem
```

#### Refund Ticket
```
POST /api/v1/live-events/{event_id}/tickets/{ticket_id}/refund
```

#### Get Event Revenue
```
GET /api/v1/live-events/{event_id}/revenue
```

Returns:
```json
{
  "total_revenue": 50000,
  "refunded_amount": 5000,
  "net_revenue": 45000,
  "total_tickets": 100,
  "completed_tickets": 95,
  "refunded_tickets": 5
}
```

### Recording Management

#### Upload Recording
```
POST /api/v1/live-events/{event_id}/recording/upload
```

Link or upload the event recording.

#### Archive Recording
```
POST /api/v1/live-events/{event_id}/recording/archive
```

Archive the recording based on retention policy.

## WebSocket API

### Event Chat WebSocket
```
ws://api/v1/live-events/ws/{event_id}?token=<auth_token>
```

Real-time chat and event updates.

Message types:

**Client to Server:**
```json
{
  "type": "chat_message",
  "message": "Hello everyone!",
  "message_type": "text"
}
```

```json
{
  "type": "viewer_update",
  "watch_duration": 300
}
```

```json
{
  "type": "ping"
}
```

**Server to Client:**
```json
{
  "type": "chat_message",
  "message_id": 123,
  "user_id": 45,
  "message": "Hello everyone!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

```json
{
  "type": "viewer_count_update",
  "viewer_count": 250
}
```

```json
{
  "type": "message_deleted",
  "message_id": 123
}
```

### Moderator WebSocket
```
ws://api/v1/live-events/ws/{event_id}/moderator?token=<auth_token>
```

For moderators to receive alerts and perform moderation actions.

Actions:
```json
{
  "type": "delete_message",
  "message_id": 123,
  "reason": "Inappropriate content"
}
```

```json
{
  "type": "mute_chat"
}
```

```json
{
  "type": "unmute_chat"
}
```

## Integration Guide

### YouTube Live Setup

1. Enable YouTube Data API v3 in Google Cloud Console
2. Create API credentials
3. Set `YOUTUBE_API_KEY` in environment variables
4. Create event with `stream_platform: "youtube"`
5. Generate stream key via API
6. Use RTMP URL and stream key in OBS/broadcasting software

### Vimeo Live Setup

1. Get Vimeo API access token
2. Set `VIMEO_ACCESS_TOKEN` in environment variables
3. Create event with `stream_platform: "vimeo"`
4. Generate stream key via API
5. Use RTMP URL and stream key in OBS/broadcasting software

## Usage Examples

### Creating a Public Sports Game

```python
import requests

response = requests.post(
    "https://api.school.com/api/v1/live-events/",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "institution_id": 1,
        "event_name": "Basketball Championship Finals",
        "event_type": "sports_game",
        "description": "Inter-school basketball finals",
        "scheduled_start_time": "2024-01-20T14:00:00Z",
        "stream_platform": "youtube",
        "chat_enabled": True,
        "restricted_access": "public",
        "monetization_enabled": False,
        "auto_record": True
    }
)

event = response.json()
event_id = event["id"]
```

### Creating a Ticketed Graduation Ceremony

```python
response = requests.post(
    "https://api.school.com/api/v1/live-events/",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "institution_id": 1,
        "event_name": "Class of 2024 Graduation",
        "event_type": "graduation",
        "scheduled_start_time": "2024-05-15T10:00:00Z",
        "stream_platform": "youtube",
        "chat_enabled": True,
        "restricted_access": "parents_only",
        "monetization_enabled": True,
        "ticket_price": 50000,  # ₹500 in paise
        "ticket_currency": "INR"
    }
)
```

### Setting Up Chat Moderation

```python
# Add banned words rule
requests.post(
    "https://api.school.com/api/v1/live-events/moderation-rules",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "institution_id": 1,
        "rule_type": "banned_word",
        "rule_value": "spam,advertisement,inappropriate",
        "action": "delete",
        "severity": "high"
    }
)

# Add URL filter
requests.post(
    "https://api.school.com/api/v1/live-events/moderation-rules",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "institution_id": 1,
        "rule_type": "url_filter",
        "rule_value": "",
        "action": "flag",
        "severity": "medium"
    }
)
```

## Best Practices

1. **Always enable chat moderation** for public events
2. **Test stream setup** before the actual event
3. **Set appropriate access restrictions** based on event type
4. **Enable auto-recording** to preserve content
5. **Monitor viewer analytics** during the event
6. **Have backup moderators** for large events
7. **Archive recordings** according to retention policy
8. **Test payment flow** before ticketed events

## Error Handling

Common error responses:

- `404 Not Found`: Event doesn't exist
- `403 Forbidden`: User lacks permission
- `400 Bad Request`: Invalid data or action not allowed
- `401 Unauthorized`: Authentication required

Example error response:
```json
{
  "detail": "Chat is disabled for this event"
}
```
