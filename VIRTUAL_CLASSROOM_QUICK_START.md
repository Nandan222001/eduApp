# Virtual Classroom Quick Start Guide

## Prerequisites

1. Agora account with App ID and Certificate
2. AWS S3 bucket for recording storage
3. Redis server running
4. PostgreSQL database

## Setup (5 minutes)

### 1. Configure Environment Variables

Add to your `.env` file:
```bash
# Agora Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
AGORA_CUSTOMER_ID=your_agora_customer_id
AGORA_CUSTOMER_SECRET=your_agora_customer_secret
AGORA_RECORDING_BUCKET=your-recordings-bucket
AGORA_RECORDING_REGION=us-east-1
```

### 2. Run Database Migration

```bash
alembic upgrade head
```

### 3. Start Services

```bash
# Start main application
uvicorn src.main:app --reload

# Start Celery worker (in another terminal)
celery -A src.celery_app worker --loglevel=info

# Start Celery beat for scheduled tasks (in another terminal)
celery -A src.celery_app beat --loglevel=info
```

## Basic Usage

### Create Your First Virtual Classroom

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms?institution_id=1&teacher_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Python",
    "description": "First lesson on Python basics",
    "scheduled_start_time": "2024-01-25T10:00:00",
    "scheduled_end_time": "2024-01-25T11:00:00",
    "max_participants": 30,
    "is_recording_enabled": true,
    "is_whiteboard_enabled": true,
    "is_chat_enabled": true,
    "is_breakout_rooms_enabled": true,
    "participant_user_ids": [10, 11, 12]
  }'
```

### Start Classroom Session

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/1/start"
```

### Join Classroom as Participant

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/1/join" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 10,
    "role": "participant"
  }'
```

Response includes:
- `token`: Agora RTC token for authentication
- `channel_name`: Unique channel identifier
- `uid`: User's unique ID in the channel
- `app_id`: Your Agora App ID

### Connect via WebSocket

```javascript
// JavaScript example
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/classroom/1?user_id=10');

ws.onopen = () => {
  console.log('Connected to classroom');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send a chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  message: 'Hello everyone!'
}));
```

### Start Recording

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/1/recordings/start"
```

### Create a Live Poll

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/1/polls?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Do you understand the topic?",
    "options": [
      {"text": "Yes, completely", "value": "yes"},
      {"text": "Need clarification", "value": "partial"},
      {"text": "No", "value": "no"}
    ],
    "is_anonymous": false,
    "allow_multiple_choices": false
  }'
```

### Start the Poll

```bash
curl -X POST "http://localhost:8000/api/v1/polls/1/start"
```

### Create Breakout Rooms

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/1/breakout-rooms" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Group A Discussion",
    "max_participants": 5,
    "duration_minutes": 15,
    "participant_user_ids": [10, 11, 12]
  }'
```

### End Classroom Session

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/1/end"
```

### Get Attendance Report

```bash
curl "http://localhost:8000/api/v1/virtual-classrooms/1/attendance"
```

### Get Classroom Analytics

```bash
curl "http://localhost:8000/api/v1/virtual-classrooms/1/analytics"
```

## Frontend Integration

### Install Agora SDK

```bash
npm install agora-rtc-sdk-ng
```

### Basic React Component

```jsx
import { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

function VirtualClassroom({ classroomId, userId }) {
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });

  useEffect(() => {
    async function joinClassroom() {
      // Get token from backend
      const response = await fetch(`/api/v1/virtual-classrooms/${classroomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: 'participant' })
      });
      
      const { token, channel_name, uid, app_id } = await response.json();
      
      // Join Agora channel
      await client.join(app_id, channel_name, token, uid);
      
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack });
      
      await client.publish([audioTrack, videoTrack]);
      
      // Play local video
      videoTrack.play('local-video');
      
      // Handle remote users
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          remoteVideoTrack.play(`remote-${user.uid}`);
        }
        
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
        }
      });
    }
    
    joinClassroom();
    
    return () => {
      localTracks.audio?.close();
      localTracks.video?.close();
      client.leave();
    };
  }, [classroomId, userId]);

  const toggleVideo = () => {
    localTracks.video?.setEnabled(!localTracks.video.enabled);
  };

  const toggleAudio = () => {
    localTracks.audio?.setEnabled(!localTracks.audio.enabled);
  };

  return (
    <div>
      <div id="local-video" style={{ width: 320, height: 240 }} />
      <div id="remote-videos" />
      <button onClick={toggleVideo}>Toggle Video</button>
      <button onClick={toggleAudio}>Toggle Audio</button>
    </div>
  );
}

export default VirtualClassroom;
```

## WebSocket Chat Integration

```jsx
import { useEffect, useState } from 'react';

function ClassroomChat({ classroomId, userId }) {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const websocket = new WebSocket(
      `ws://localhost:8000/api/v1/ws/classroom/${classroomId}?user_id=${userId}`
    );

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === 'chat_message') {
        setMessages(prev => [...prev, data]);
      } else if (data.event === 'chat_history') {
        setMessages(data.messages);
      }
    };

    setWs(websocket);

    return () => websocket.close();
  }, [classroomId, userId]);

  const sendMessage = () => {
    if (ws && input.trim()) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        message: input
      }));
      setInput('');
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>User {msg.user_id}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ClassroomChat;
```

## Testing

### Test Classroom Creation

```bash
pytest tests/test_virtual_classroom.py::test_create_classroom -v
```

### Test WebSocket Connection

```bash
pytest tests/test_classroom_websocket.py::test_websocket_connection -v
```

### Test Recording Flow

```bash
pytest tests/test_classroom_recording.py::test_recording_lifecycle -v
```

## Common Operations

### List Active Classrooms

```bash
curl "http://localhost:8000/api/v1/virtual-classrooms?institution_id=1&status=live"
```

### Get Live Participant Count

```bash
curl "http://localhost:8000/api/v1/ws/classroom/1/participants-count"
```

### Stop Recording

```bash
curl -X POST "http://localhost:8000/api/v1/virtual-classrooms/recordings/1/stop"
```

### Close Breakout Room

```bash
curl -X POST "http://localhost:8000/api/v1/breakout-rooms/1/close"
```

### Get Poll Results

```bash
curl "http://localhost:8000/api/v1/polls/1/results"
```

## Monitoring

### Check Active WebSocket Connections

```bash
curl "http://localhost:8000/api/v1/ws/classrooms/active"
```

### Check Recording Status

```bash
curl "http://localhost:8000/api/v1/virtual-classrooms/1/recordings"
```

## Troubleshooting

### Token Expired
If you get "token expired" error, the participant needs to rejoin to get a new token.

### Recording Not Starting
1. Verify Agora credentials in `.env`
2. Check S3 bucket permissions
3. Ensure classroom is in "live" state

### WebSocket Disconnects
Implement reconnection logic on the client side:
```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connectWebSocket() {
  const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/classroom/${classroomId}?user_id=${userId}`);
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 1000 * reconnectAttempts);
    }
  };
  
  ws.onopen = () => {
    reconnectAttempts = 0;
  };
}
```

## Next Steps

1. **Customize UI**: Build your own interface using the provided APIs
2. **Add Features**: Implement whiteboard using libraries like Excalidraw
3. **Analytics**: Create dashboards using the analytics endpoints
4. **Notifications**: Integrate with your notification system
5. **Mobile Support**: Use Agora mobile SDKs for iOS/Android

## Resources

- [Agora Documentation](https://docs.agora.io/)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [Agora React SDK](https://www.npmjs.com/package/agora-rtc-sdk-ng)

## Support

For issues or questions, check the main implementation guide: `VIRTUAL_CLASSROOM_IMPLEMENTATION.md`
