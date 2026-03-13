# Virtual Classroom - Real-time Video Conferencing System

A comprehensive real-time virtual classroom infrastructure with WebRTC-based video/audio streaming, screen sharing, whiteboard collaboration, attendance tracking, breakout rooms, recording capabilities, and live quiz/poll features.

## 🎯 Key Features

### 🎥 Video Conferencing
- **Multi-party Video Calls**: Support for up to 1000 participants
- **HD Quality**: Adaptive bitrate with 720p/1080p support
- **Low Latency**: WebRTC-based real-time communication
- **Cross-platform**: Works on web, mobile (iOS/Android)

### 📺 Screen Sharing
- Host and participant screen sharing
- Application window sharing
- Real-time screen share control
- Multiple presenters support

### 🎨 Whiteboard Collaboration
- Real-time collaborative drawing
- Multiple tools (pen, shapes, text)
- Session persistence
- Export to image

### 📊 Attendance Tracking
- Automatic join/leave detection
- Duration calculation
- Attendance percentage (≥50% = present)
- Student-wise reports

### 👥 Breakout Rooms
- Create unlimited breakout rooms
- Assign participants dynamically
- Set custom durations (5-120 minutes)
- Auto-close on expiry

### 🎬 Recording & Playback
- Cloud recording via Agora
- Automatic S3 upload
- MP4 format output
- Progress tracking for viewers
- Watch time analytics

### 📝 Live Quiz & Polls
- Real-time polling with instant results
- Timed quizzes with auto-scoring
- Multiple question types
- Anonymous responses option
- Result aggregation

### 💬 Real-time Chat
- Persistent chat history
- Message broadcasting
- Typing indicators
- Read receipts

### 🔔 Interactive Features
- Hand raise/lower
- Emoji reactions
- Participant list
- Activity notifications

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vue)    │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
    ┌────▼────┐   ┌───▼───┐
    │ FastAPI │   │ Agora │
    │   API   │   │  SDK  │
    └────┬────┘   └───────┘
         │
    ┌────▼────┐
    │WebSocket│
    └────┬────┘
         │
    ┌────▼────────┐
    │   Redis     │
    │  (Cache)    │
    └─────────────┘
         │
    ┌────▼────────┐
    │ PostgreSQL  │
    │  (Database) │
    └─────────────┘
         │
    ┌────▼────────┐
    │     S3      │
    │ (Recordings)│
    └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 12+
- Redis 5.0+
- Agora Account
- AWS S3 Bucket

### Installation

1. **Install Dependencies**
```bash
poetry install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your Agora credentials
```

3. **Run Migrations**
```bash
alembic upgrade head
```

4. **Start Services**
```bash
# Terminal 1: API Server
uvicorn src.main:app --reload

# Terminal 2: Celery Worker
celery -A src.celery_app worker --loglevel=info

# Terminal 3: Celery Beat
celery -A src.celery_app beat --loglevel=info
```

### Create Your First Classroom

```python
import requests

# Create classroom
response = requests.post(
    "http://localhost:8000/api/v1/virtual-classrooms",
    params={"institution_id": 1, "teacher_id": 1},
    json={
        "title": "Python Programming 101",
        "scheduled_start_time": "2024-01-25T10:00:00",
        "scheduled_end_time": "2024-01-25T11:00:00",
        "max_participants": 50,
        "is_recording_enabled": True,
        "is_whiteboard_enabled": True,
        "participant_user_ids": [10, 11, 12]
    }
)

classroom = response.json()
classroom_id = classroom["id"]

# Start session
requests.post(f"http://localhost:8000/api/v1/virtual-classrooms/{classroom_id}/start")

# Join as participant
join_response = requests.post(
    f"http://localhost:8000/api/v1/virtual-classrooms/{classroom_id}/join",
    json={"user_id": 10, "role": "participant"}
)

credentials = join_response.json()
print(f"Token: {credentials['token']}")
print(f"Channel: {credentials['channel_name']}")
```

## 📚 API Documentation

### Classroom Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/virtual-classrooms` | Create classroom |
| GET | `/virtual-classrooms/{id}` | Get classroom |
| GET | `/virtual-classrooms` | List classrooms |
| PUT | `/virtual-classrooms/{id}` | Update classroom |
| POST | `/virtual-classrooms/{id}/start` | Start session |
| POST | `/virtual-classrooms/{id}/end` | End session |
| POST | `/virtual-classrooms/{id}/join` | Join classroom |
| POST | `/virtual-classrooms/{id}/leave` | Leave classroom |

### Recording Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/virtual-classrooms/{id}/recordings/start` | Start recording |
| POST | `/recordings/{id}/stop` | Stop recording |
| GET | `/virtual-classrooms/{id}/recordings` | List recordings |

### Breakout Room Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/virtual-classrooms/{id}/breakout-rooms` | Create room |
| POST | `/breakout-rooms/{id}/join` | Join room |
| POST | `/breakout-rooms/{id}/close` | Close room |
| GET | `/virtual-classrooms/{id}/breakout-rooms` | List rooms |

### Poll Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/virtual-classrooms/{id}/polls` | Create poll |
| POST | `/polls/{id}/start` | Start poll |
| POST | `/polls/{id}/end` | End poll |
| POST | `/polls/{id}/respond` | Submit response |
| GET | `/polls/{id}/results` | Get results |

### Quiz Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/virtual-classrooms/{id}/quizzes` | Create quiz |
| POST | `/quizzes/{id}/start` | Start quiz |
| POST | `/quizzes/{id}/end` | End quiz |
| POST | `/quizzes/{id}/submit` | Submit answers |

### WebSocket Endpoint

```
WS /ws/classroom/{classroom_id}?user_id={user_id}
```

## 🎨 Frontend Integration

### React Example

```jsx
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useEffect, useState } from 'react';

function VirtualClassroom({ classroomId, userId }) {
  const [client] = useState(() => 
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  );

  useEffect(() => {
    async function init() {
      // Get credentials
      const res = await fetch(
        `/api/v1/virtual-classrooms/${classroomId}/join`,
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, role: 'participant' })
        }
      );
      const { token, channel_name, uid, app_id } = await res.json();

      // Join channel
      await client.join(app_id, channel_name, token, uid);

      // Publish local tracks
      const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
      await client.publish([audio, video]);
      video.play('local-video');

      // Subscribe to remote users
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          user.videoTrack.play(`remote-${user.uid}`);
        }
      });
    }

    init();
    return () => client.leave();
  }, []);

  return (
    <div>
      <div id="local-video" />
      <div id="remote-videos" />
    </div>
  );
}
```

### WebSocket Chat

```jsx
function Chat({ classroomId, userId }) {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(
      `ws://localhost:8000/api/v1/ws/classroom/${classroomId}?user_id=${userId}`
    );

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === 'chat_message') {
        setMessages(prev => [...prev, data]);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const send = (message) => {
    ws?.send(JSON.stringify({ type: 'chat_message', message }));
  };

  return (
    <div>
      {messages.map((m, i) => (
        <div key={i}>{m.message}</div>
      ))}
    </div>
  );
}
```

## 🔧 Configuration

### Agora Settings

```python
# .env
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
AGORA_CUSTOMER_ID=customer_id
AGORA_CUSTOMER_SECRET=customer_secret
AGORA_RECORDING_BUCKET=recordings-bucket
AGORA_RECORDING_REGION=us-east-1
```

### Recording Configuration

```python
# Recording settings in classroom creation
{
  "is_recording_enabled": True,
  "settings": {
    "recording": {
      "resolution": "1280x720",
      "fps": 30,
      "bitrate": 2260,
      "layout": "grid"  # or "floating", "custom"
    }
  }
}
```

## 📊 Analytics

### Get Classroom Analytics

```python
response = requests.get(
    f"http://localhost:8000/api/v1/virtual-classrooms/{classroom_id}/analytics"
)

analytics = response.json()
# {
#   "total_participants": 45,
#   "average_duration_minutes": 52.3,
#   "polls_created": 5,
#   "quizzes_created": 2,
#   "recordings_count": 1,
#   "breakout_rooms_created": 3
# }
```

### Get Attendance Report

```python
response = requests.get(
    f"http://localhost:8000/api/v1/virtual-classrooms/{classroom_id}/attendance"
)

attendance = response.json()
# {
#   "items": [
#     {
#       "user_id": 10,
#       "joined_at": "2024-01-25T10:05:00",
#       "left_at": "2024-01-25T10:58:00",
#       "total_duration_seconds": 3180,
#       "attendance_percentage": 88.3,
#       "is_present": True
#     }
#   ]
# }
```

## 🧪 Testing

```bash
# Run all tests
pytest tests/test_virtual_classroom.py

# Test specific functionality
pytest tests/test_virtual_classroom.py::test_create_classroom
pytest tests/test_virtual_classroom.py::test_join_classroom
pytest tests/test_virtual_classroom.py::test_recording

# Run with coverage
pytest --cov=src/services/virtual_classroom_service tests/
```

## 🔒 Security

### Token Management
- RTC tokens expire after 1 hour
- Automatic token refresh on client
- Role-based permissions (host, moderator, participant)

### Channel Security
- Unique channel names per classroom
- Token-based authentication
- User ID verification

### Recording Security
- S3 bucket encryption
- Signed URLs for playback
- Access control via API

## 📈 Performance

### Optimization Tips

1. **Connection Pooling**: Configure database pool size
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40
)
```

2. **Redis Caching**: Cache active participants
```python
await redis.sadd(f"classroom:participants:{id}", user_id)
```

3. **Lazy Loading**: Paginate large result sets
```python
GET /virtual-classrooms?skip=0&limit=50
```

4. **WebSocket Throttling**: Rate limit messages
```python
# Max 10 messages per second per user
```

## 🐛 Troubleshooting

### Common Issues

**Token Expired**
```python
# Rejoin to get fresh token
response = requests.post(f"/virtual-classrooms/{id}/join", ...)
```

**Recording Failed**
```python
# Check Agora credentials
# Verify S3 permissions
# Ensure classroom is live
```

**WebSocket Disconnects**
```javascript
// Implement reconnection
let reconnectAttempts = 0;
socket.onclose = () => {
  if (reconnectAttempts < 5) {
    setTimeout(connect, 1000 * ++reconnectAttempts);
  }
};
```

## 📖 Documentation

- [Implementation Guide](VIRTUAL_CLASSROOM_IMPLEMENTATION.md)
- [Quick Start](VIRTUAL_CLASSROOM_QUICK_START.md)
- [API Reference](http://localhost:8000/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

Copyright © 2024. All rights reserved.

## 🙏 Acknowledgments

- [Agora.io](https://www.agora.io/) - Video SDK
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM
- [Redis](https://redis.io/) - Cache layer

## 📞 Support

For issues or questions:
- Check [Troubleshooting](#-troubleshooting) section
- Review [Documentation](#-documentation)
- Open an issue on GitHub
- Contact development team

---

Built with ❤️ for modern education
