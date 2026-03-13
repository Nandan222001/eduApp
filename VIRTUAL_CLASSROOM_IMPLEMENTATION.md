# Virtual Classroom Implementation Guide

## Overview

This document provides a comprehensive guide to the real-time virtual classroom infrastructure implemented using Agora SDK for WebRTC-based video/audio streaming.

## Features Implemented

### 1. **Video Conferencing Integration**
- WebRTC-based video/audio streaming using Agora SDK
- Multi-party video calls with support for up to 1000 participants
- Dynamic token generation for secure channel access
- Real-time video/audio quality adaptation

### 2. **Screen Sharing**
- Host and participant screen sharing capabilities
- Real-time screen share state management
- WebSocket notifications for screen share events

### 3. **Whiteboard Collaboration**
- Real-time collaborative whiteboard
- Session data persistence
- Snapshot URL support for saved states
- WebSocket-based real-time updates

### 4. **Real-time Attendance Tracking**
- Automatic attendance calculation based on session duration
- Presence detection (≥50% duration = present)
- Join/leave time tracking
- Attendance percentage calculation
- Student-specific attendance records

### 5. **Breakout Room Functionality**
- Create multiple breakout rooms for group discussions
- Configurable participant assignments
- Automatic room expiration based on duration
- Separate Agora channels for each breakout room
- Real-time participant management

### 6. **Recording and Playback**
- Cloud recording using Agora Cloud Recording API
- Automatic S3 upload integration
- Recording status tracking (idle, recording, processing, completed, failed)
- Recording metadata and error handling
- Playback progress tracking for students
- Watch duration analytics

### 7. **Live Quiz/Poll Features**
- Real-time polls with multiple choice support
- Anonymous polling option
- Live quiz functionality with scoring
- Instant result aggregation
- Time-limited quiz sessions
- Passing score configuration

### 8. **Real-time Communication**
- WebSocket-based real-time messaging
- Chat history persistence in Redis
- Video/audio toggle notifications
- Hand raise/lower functionality
- Event broadcasting to all participants

## Architecture

### Database Models

1. **VirtualClassroom** - Main classroom entity
2. **ClassroomParticipant** - User participation tracking
3. **ClassroomRecording** - Recording metadata and status
4. **RecordingView** - Playback analytics
5. **BreakoutRoom** - Group discussion rooms
6. **BreakoutRoomParticipant** - Breakout room participants
7. **ClassroomAttendance** - Attendance records
8. **ClassroomPoll** - Live polling
9. **PollResponse** - Poll submissions
10. **ClassroomQuiz** - Live quizzes
11. **QuizSubmission** - Quiz answers and scores
12. **WhiteboardSession** - Whiteboard state

### Services

1. **AgoraService** (`src/services/agora_service.py`)
   - RTC token generation
   - Cloud recording management (acquire, start, stop, query)
   - Channel user management
   - User ban functionality

2. **VirtualClassroomService** (`src/services/virtual_classroom_service.py`)
   - Classroom lifecycle management (create, start, end)
   - Participant management (join, leave, status updates)
   - Recording operations
   - Breakout room management
   - Attendance calculation
   - Poll and quiz operations
   - Analytics generation

3. **ClassroomWebSocketManager** (`src/services/classroom_websocket_service.py`)
   - Real-time WebSocket connections
   - Message broadcasting
   - Event handling
   - Chat message persistence

### API Endpoints

#### Classroom Management
- `POST /virtual-classrooms` - Create classroom
- `GET /virtual-classrooms/{id}` - Get classroom details
- `GET /virtual-classrooms` - List classrooms with filters
- `PUT /virtual-classrooms/{id}` - Update classroom
- `POST /virtual-classrooms/{id}/start` - Start session
- `POST /virtual-classrooms/{id}/end` - End session
- `POST /virtual-classrooms/{id}/join` - Join classroom
- `POST /virtual-classrooms/{id}/leave` - Leave classroom
- `GET /virtual-classrooms/{id}/participants` - Get participants
- `GET /virtual-classrooms/{id}/analytics` - Get analytics

#### Recording
- `POST /virtual-classrooms/{id}/recordings/start` - Start recording
- `POST /recordings/{id}/stop` - Stop recording
- `GET /virtual-classrooms/{id}/recordings` - List recordings

#### Breakout Rooms
- `POST /virtual-classrooms/{id}/breakout-rooms` - Create room
- `POST /breakout-rooms/{id}/join` - Join breakout room
- `POST /breakout-rooms/{id}/close` - Close room
- `GET /virtual-classrooms/{id}/breakout-rooms` - List rooms

#### Attendance
- `GET /virtual-classrooms/{id}/attendance` - Get attendance records

#### Polls
- `POST /virtual-classrooms/{id}/polls` - Create poll
- `POST /polls/{id}/start` - Start poll
- `POST /polls/{id}/end` - End poll
- `POST /polls/{id}/respond` - Submit response
- `GET /polls/{id}/results` - Get results
- `GET /virtual-classrooms/{id}/polls` - List polls

#### Quizzes
- `POST /virtual-classrooms/{id}/quizzes` - Create quiz
- `POST /quizzes/{id}/start` - Start quiz
- `POST /quizzes/{id}/end` - End quiz
- `POST /quizzes/{id}/submit` - Submit answers
- `GET /virtual-classrooms/{id}/quizzes` - List quizzes

#### Whiteboard
- `POST /virtual-classrooms/{id}/whiteboard` - Save whiteboard data

#### WebSocket
- `WS /ws/classroom/{id}?user_id={user_id}` - Real-time connection
- `GET /ws/classroom/{id}/chat-history` - Get chat history
- `GET /ws/classroom/{id}/participants-count` - Get live count
- `GET /ws/classrooms/active` - Get active classrooms

## WebSocket Events

### Client → Server Events
```json
{
  "type": "chat_message",
  "message": "Hello everyone"
}

{
  "type": "video_toggle",
  "enabled": true
}

{
  "type": "audio_toggle",
  "enabled": true
}

{
  "type": "screen_share_start"
}

{
  "type": "screen_share_stop"
}

{
  "type": "whiteboard_update",
  "data": {...}
}

{
  "type": "raise_hand"
}

{
  "type": "lower_hand"
}
```

### Server → Client Events
```json
{
  "event": "user_joined",
  "user_id": 123,
  "timestamp": "2024-01-15T10:00:00",
  "participant_count": 25
}

{
  "event": "user_left",
  "user_id": 123,
  "timestamp": "2024-01-15T11:00:00",
  "participant_count": 24
}

{
  "event": "chat_message",
  "user_id": 123,
  "message": "Hello",
  "timestamp": "2024-01-15T10:05:00"
}

{
  "event": "poll_started",
  "poll_id": 456,
  "poll_data": {...}
}

{
  "event": "recording_started",
  "recording_id": 789
}
```

## Configuration

### Environment Variables
```bash
# Agora Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
AGORA_CUSTOMER_ID=your_agora_customer_id
AGORA_CUSTOMER_SECRET=your_agora_customer_secret
AGORA_RECORDING_BUCKET=your_s3_bucket_for_recordings
AGORA_RECORDING_REGION=us-east-1
```

## Celery Tasks

1. **process_classroom_recording** - Process and finalize recordings
2. **check_recording_status** - Monitor recording status
3. **calculate_classroom_attendance** - Calculate attendance metrics
4. **close_expired_breakout_rooms** - Auto-close expired rooms
5. **send_classroom_reminder** - Send pre-class notifications
6. **generate_classroom_report** - Generate session reports

## Usage Examples

### 1. Create a Classroom
```python
POST /api/v1/virtual-classrooms
{
  "title": "Mathematics Class",
  "description": "Algebra session",
  "subject_id": 1,
  "section_id": 2,
  "scheduled_start_time": "2024-01-20T10:00:00",
  "scheduled_end_time": "2024-01-20T11:00:00",
  "max_participants": 50,
  "is_recording_enabled": true,
  "is_whiteboard_enabled": true,
  "is_breakout_rooms_enabled": true,
  "participant_user_ids": [10, 11, 12, 13]
}
```

### 2. Start Classroom Session
```python
POST /api/v1/virtual-classrooms/1/start
```

### 3. Join Classroom
```python
POST /api/v1/virtual-classrooms/1/join
{
  "user_id": 10,
  "role": "participant"
}

Response:
{
  "token": "agora_rtc_token",
  "channel_name": "classroom_abc123",
  "uid": 1010,
  "app_id": "agora_app_id",
  "classroom": {...},
  "participant": {...}
}
```

### 4. Start Recording
```python
POST /api/v1/virtual-classrooms/1/recordings/start
```

### 5. Create Breakout Room
```python
POST /api/v1/virtual-classrooms/1/breakout-rooms
{
  "name": "Group A Discussion",
  "max_participants": 5,
  "duration_minutes": 15,
  "participant_user_ids": [10, 11, 12]
}
```

### 6. Create Live Poll
```python
POST /api/v1/virtual-classrooms/1/polls?user_id=1
{
  "question": "Do you understand the concept?",
  "options": [
    {"text": "Yes", "value": "yes"},
    {"text": "No", "value": "no"},
    {"text": "Partially", "value": "partial"}
  ],
  "is_anonymous": false,
  "allow_multiple_choices": false
}
```

### 7. Create Live Quiz
```python
POST /api/v1/virtual-classrooms/1/quizzes?user_id=1
{
  "title": "Quick Math Quiz",
  "questions": [
    {
      "question": "What is 2+2?",
      "type": "multiple_choice",
      "options": ["3", "4", "5"],
      "correct_answer": "4",
      "points": 1
    }
  ],
  "duration_minutes": 5,
  "passing_score": 60
}
```

### 8. WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/classroom/1?user_id=10');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.event);
};

// Send chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  message: 'Hello everyone!'
}));

// Toggle video
ws.send(JSON.stringify({
  type: 'video_toggle',
  enabled: true
}));
```

## Database Migration

Run the migration to create all necessary tables:
```bash
alembic upgrade head
```

## Frontend Integration

### React Example (using Agora React SDK)
```javascript
import AgoraRTC from 'agora-rtc-sdk-ng';

// Initialize Agora client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Join classroom
const response = await fetch('/api/v1/virtual-classrooms/1/join', {
  method: 'POST',
  body: JSON.stringify({ user_id: 10, role: 'participant' })
});

const { token, channel_name, uid, app_id } = await response.json();

// Join channel
await client.join(app_id, channel_name, token, uid);

// Create local audio/video tracks
const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

// Publish tracks
await client.publish([audioTrack, videoTrack]);

// Subscribe to remote users
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    user.videoTrack.play('remote-video-container');
  }
});
```

## Security Considerations

1. **Token Expiration**: RTC tokens expire after 1 hour
2. **Channel Isolation**: Each classroom has a unique channel name
3. **Role-based Access**: Different privileges for hosts, moderators, participants
4. **Recording Encryption**: S3 bucket should have encryption enabled
5. **WebSocket Authentication**: User ID validation required

## Performance Optimization

1. **Redis Caching**: Active participants stored in Redis sets
2. **Connection Pooling**: Database connection pool configured
3. **Message Throttling**: Rate limiting on WebSocket messages
4. **Lazy Loading**: Recordings and chat history paginated
5. **Index Optimization**: Database indexes on frequently queried fields

## Monitoring

1. **Active Classrooms**: Track live sessions via Redis
2. **Participant Count**: Real-time participant tracking
3. **Recording Status**: Monitor recording pipeline
4. **WebSocket Connections**: Track active WS connections
5. **Error Logging**: Comprehensive error tracking with Sentry

## Testing

Test the implementation using:
```bash
# Unit tests
pytest tests/test_virtual_classroom.py

# Integration tests
pytest tests/integration/test_classroom_flow.py

# Load testing
locust -f tests/load/classroom_load_test.py
```

## Troubleshooting

### Common Issues

1. **Token Invalid**: Regenerate token if expired
2. **Recording Failed**: Check Agora credentials and S3 permissions
3. **WebSocket Disconnect**: Implement reconnection logic on client
4. **Attendance Not Calculating**: Ensure classroom session ended properly

## Future Enhancements

1. **AI-powered transcription** for recordings
2. **Automated closed captions** during live sessions
3. **Advanced analytics dashboard** with ML insights
4. **Virtual backgrounds** for video streams
5. **Noise suppression** and audio enhancement
6. **Breakout room presets** with templates
7. **Interactive Q&A sessions** with upvoting
8. **Live translation** for multilingual classrooms

## Support

For issues or questions:
- Check Agora documentation: https://docs.agora.io/
- Review FastAPI WebSocket docs: https://fastapi.tiangolo.com/advanced/websockets/
- Contact development team

## License

Copyright © 2024. All rights reserved.
