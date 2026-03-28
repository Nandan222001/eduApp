# Live Events Quick Start Guide

## Installation

1. **Install dependencies:**
```bash
poetry install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add:
```bash
YOUTUBE_API_KEY=your_youtube_api_key  # Optional
VIMEO_ACCESS_TOKEN=your_vimeo_token   # Optional
```

3. **Run database migrations:**
```bash
alembic upgrade head
```

4. **Start the server:**
```bash
uvicorn src.main:app --reload
```

## Creating Your First Live Event

### Step 1: Create an Event

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "event_name": "School Assembly",
    "event_type": "assembly",
    "description": "Weekly school assembly",
    "scheduled_start_time": "2024-01-20T09:00:00Z",
    "stream_platform": "youtube",
    "chat_enabled": true,
    "restricted_access": "public",
    "monetization_enabled": false,
    "auto_record": true
  }'
```

Response:
```json
{
  "id": 1,
  "event_name": "School Assembly",
  "status": "scheduled",
  "stream_url": null,
  ...
}
```

### Step 2: Generate Stream Key

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/1/stream/generate-key" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "stream_key": "xxxx-xxxx-xxxx-xxxx",
  "stream_url": "https://youtube.com/watch?v=xxxxx",
  "rtmp_url": "rtmp://a.rtmp.youtube.com/live2/xxxxx",
  "instructions": "Use OBS or similar software..."
}
```

### Step 3: Configure OBS

1. Open OBS Studio
2. Go to Settings > Stream
3. Select "Custom..." as Service
4. Enter the RTMP URL from Step 2
5. Enter the Stream Key
6. Click "Apply" and "OK"

### Step 4: Start the Stream

First, start streaming in OBS, then:

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/1/stream/start" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Monitor Your Stream

```bash
curl "http://localhost:8000/api/v1/live-events/1/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 6: End the Stream

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/1/stream/end" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Setting Up Chat Moderation

### Add Banned Words

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/moderation-rules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "rule_type": "banned_word",
    "rule_value": "spam,inappropriate,advertising",
    "action": "delete",
    "severity": "high"
  }'
```

### Block URLs

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/moderation-rules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "rule_type": "url_filter",
    "rule_value": "",
    "action": "flag",
    "severity": "medium"
  }'
```

## Creating a Ticketed Event

### Step 1: Create Event with Monetization

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "event_name": "Annual Concert",
    "event_type": "concert",
    "scheduled_start_time": "2024-02-14T18:00:00Z",
    "stream_platform": "youtube",
    "chat_enabled": true,
    "restricted_access": "public",
    "monetization_enabled": true,
    "ticket_price": 50000,
    "ticket_currency": "INR"
  }'
```

### Step 2: User Purchases Ticket

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/1/tickets" \
  -H "Authorization: Bearer USER_TOKEN"
```

### Step 3: Check Revenue

```bash
curl "http://localhost:8000/api/v1/live-events/1/revenue" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Chat (WebSocket)

### JavaScript Example

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/live-events/ws/1?token=YOUR_TOKEN');

ws.onopen = () => {
  console.log('Connected to chat');
  
  // Send a message
  ws.send(JSON.stringify({
    type: 'chat_message',
    message: 'Hello everyone!'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  if (data.type === 'chat_message') {
    console.log(`${data.user_id}: ${data.message}`);
  }
};

// Keep connection alive
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

### Python Example

```python
import asyncio
import websockets
import json

async def chat_client():
    uri = "ws://localhost:8000/api/v1/live-events/ws/1?token=YOUR_TOKEN"
    
    async with websockets.connect(uri) as websocket:
        # Send a message
        await websocket.send(json.dumps({
            "type": "chat_message",
            "message": "Hello from Python!"
        }))
        
        # Receive messages
        while True:
            response = await websocket.recv()
            data = json.loads(response)
            print(f"Received: {data}")

asyncio.run(chat_client())
```

## Common Use Cases

### 1. Public Sports Game

```python
event_data = {
    "institution_id": 1,
    "event_name": "Basketball Finals",
    "event_type": "sports_game",
    "scheduled_start_time": "2024-01-25T15:00:00Z",
    "stream_platform": "youtube",
    "chat_enabled": True,
    "restricted_access": "public",
    "monetization_enabled": False
}
```

### 2. Parents-Only Parent Meeting

```python
event_data = {
    "institution_id": 1,
    "event_name": "Quarterly Parent Meeting",
    "event_type": "parent_meeting",
    "scheduled_start_time": "2024-01-30T18:00:00Z",
    "stream_platform": "vimeo",
    "chat_enabled": True,
    "chat_moderated": True,
    "restricted_access": "parents_only",
    "monetization_enabled": False
}
```

### 3. Grade-Specific Assembly

```python
event_data = {
    "institution_id": 1,
    "event_name": "Grade 10 Career Guidance",
    "event_type": "assembly",
    "scheduled_start_time": "2024-02-05T10:00:00Z",
    "stream_platform": "youtube",
    "chat_enabled": True,
    "restricted_access": "specific_grades",
    "allowed_grade_ids": [10],
    "monetization_enabled": False
}
```

### 4. Premium Graduation Ceremony

```python
event_data = {
    "institution_id": 1,
    "event_name": "Class of 2024 Graduation",
    "event_type": "graduation",
    "scheduled_start_time": "2024-05-20T09:00:00Z",
    "stream_platform": "youtube",
    "chat_enabled": False,
    "restricted_access": "public",
    "monetization_enabled": True,
    "ticket_price": 100000,  # ₹1000
    "ticket_currency": "INR",
    "auto_record": True
}
```

## Viewer Flow

### 1. Check Access

```bash
curl "http://localhost:8000/api/v1/live-events/1/access-check" \
  -H "Authorization: Bearer USER_TOKEN"
```

### 2. Join Event

```bash
curl -X POST "http://localhost:8000/api/v1/live-events/1/viewers" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "live_event_id": 1,
    "device_type": "desktop",
    "browser": "Chrome"
  }'
```

### 3. Watch and Update Duration

```bash
curl -X PUT "http://localhost:8000/api/v1/live-events/1/viewers/123" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "watch_duration": 600
  }'
```

### 4. Leave Event

```bash
curl -X PUT "http://localhost:8000/api/v1/live-events/1/viewers/123" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_currently_watching": false,
    "left_at": "2024-01-20T10:30:00Z"
  }'
```

## Troubleshooting

### Stream Key Not Working

1. Check if API keys are configured in `.env`
2. Verify YouTube/Vimeo account permissions
3. Check if broadcast was created successfully
4. Try regenerating the stream key

### Chat Messages Not Appearing

1. Verify WebSocket connection is established
2. Check if chat is enabled for the event
3. Review moderation rules
4. Check browser console for errors

### No Recording After Stream

1. Verify `auto_record` was set to `true`
2. Check if stream was properly ended
3. Wait a few minutes for platform processing
4. Check event details for `recording_url`

### Access Denied

1. Verify user authentication token
2. Check access restrictions on the event
3. Confirm ticket purchase (if monetized)
4. Verify grade/section membership

## Next Steps

1. **Explore the API**: Review [LIVE_EVENTS_API.md](./LIVE_EVENTS_API.md)
2. **Read Implementation Details**: Check [LIVE_EVENTS_IMPLEMENTATION.md](./LIVE_EVENTS_IMPLEMENTATION.md)
3. **Set Up Production**: Configure proper API keys and test thoroughly
4. **Add Monitoring**: Set up logging and alerting
5. **Customize Moderation**: Add institution-specific moderation rules

## Support

For issues or questions:
- Check the documentation
- Review error messages in logs
- Test with sample events
- Verify API credentials
