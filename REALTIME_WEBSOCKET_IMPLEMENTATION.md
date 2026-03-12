# Real-time WebSocket Implementation Guide

## Overview

This document describes the complete real-time WebSocket implementation for the educational platform, including Socket.IO-style features using native WebSocket connections.

## Backend Implementation

### Dependencies

Added to `pyproject.toml`:
- `python-socketio = "^5.11.0"` (optional for advanced features)
- Native WebSocket support via FastAPI

### Core Services

#### 1. WebSocket Manager (`src/services/websocket_manager.py`)

Manages all WebSocket connections and real-time message broadcasting:

**Features:**
- Connection management with automatic reconnection support
- Room-based subscriptions for targeted messaging
- User presence tracking (online/offline/away/busy)
- Typing indicators with automatic timeout
- Broadcast to institution, room, or individual users

**Key Methods:**
```python
- connect(websocket, user_id) - Accept and track connection
- disconnect(websocket, user_id) - Clean up connection
- send_personal_message(message, user_id) - Send to specific user
- broadcast_to_room(room, message) - Broadcast to room subscribers
- send_typing_indicator(room, user_id, is_typing) - Typing status
- broadcast_presence_update(user_id, status) - Presence changes
```

#### 2. Realtime Service (`src/services/realtime_service.py`)

High-level API for application-specific real-time events:

**Features:**
- Attendance updates to parents
- Message notifications
- Chat message broadcasting
- Quiz leaderboard updates
- General notifications

#### 3. Quiz Realtime Service (`src/services/quiz_realtime_service.py`)

Handles real-time quiz leaderboard updates:

**Features:**
- Automatic leaderboard calculation
- Real-time broadcast to quiz participants
- Rank updates with animation support

### API Endpoints

#### WebSocket Endpoint (`/api/v1/ws`)

Main WebSocket connection endpoint with authentication:

**Connection:**
```
ws://localhost:8000/api/v1/ws?token=<access_token>
```

**Supported Message Types:**

**Client → Server:**
- `ping` - Heartbeat check
- `subscribe` - Subscribe to rooms
- `unsubscribe` - Unsubscribe from rooms
- `typing` - Send typing indicator
- `presence` - Update presence status
- `get_online_users` - Request online user list
- `get_presence` - Request user presence

**Server → Client:**
- `connection` - Connection established
- `notification` - General notification
- `new_message` - New message received
- `chat_message` - Chat message in room
- `new_announcement` - New announcement
- `attendance_update` - Attendance marked/updated
- `leaderboard_update` - Quiz leaderboard changed
- `presence_update` - User presence changed
- `typing_indicator` - Someone is typing
- `pong` - Heartbeat response
- `error` - Error message

#### REST Endpoints

```python
GET /api/v1/presence/{user_id} - Get user presence
POST /api/v1/presence/bulk - Get multiple user presences
```

### Integration with Services

#### Attendance Service

Added real-time notifications when attendance is marked:

```python
def _send_realtime_notification(self, attendance: Attendance):
    # Notify parents immediately when attendance is marked
    asyncio.create_task(
        realtime_service.notify_attendance_update(...)
    )
```

## Frontend Implementation

### Dependencies

No additional dependencies required - uses native WebSocket API.

### Core Components

#### 1. WebSocket Client (`frontend/src/lib/websocket.ts`)

Type-safe WebSocket client with automatic reconnection:

**Features:**
- Automatic reconnection with exponential backoff
- Message type system with TypeScript support
- Event handler registration
- Heartbeat (ping/pong) mechanism
- Connection state management

**Usage:**
```typescript
import { websocketClient } from '@/lib/websocket';

// Listen to messages
const unsubscribe = websocketClient.on('notification', (message) => {
  console.log('Notification:', message);
});

// Send message
websocketClient.send({ type: 'subscribe', rooms: ['chat-1'] });

// Clean up
unsubscribe();
```

#### 2. WebSocket Context (`frontend/src/contexts/WebSocketContext.tsx`)

React context providing WebSocket functionality:

**Features:**
- Global WebSocket connection management
- Automatic toast notifications for events
- Connection status tracking
- Convenience methods for common operations

**Usage:**
```typescript
import { useWebSocket } from '@/contexts/WebSocketContext';

function MyComponent() {
  const { isConnected, subscribe, onMessage } = useWebSocket();
  
  useEffect(() => {
    subscribe(['room-1', 'room-2']);
    
    return onMessage('chat_message', (msg) => {
      console.log('Chat:', msg);
    });
  }, []);
}
```

### Custom Hooks

#### 1. `useRealtimeNotifications()`

Automatically handles notification and announcement messages with toast display.

#### 2. `useRealtimeChat(room)`

Complete chat functionality with typing indicators:

```typescript
const { messages, typingUsers, sendTyping, stopTyping } = useRealtimeChat('room-1');
```

#### 3. `useOnlinePresence(userIds)`

Track online status of multiple users:

```typescript
const { onlineUsers, isUserOnline, getUserStatus } = useOnlinePresence([1, 2, 3]);

if (isUserOnline(userId)) {
  // User is online
}
```

#### 4. `useRealtimeAttendance(studentIds)`

Receive real-time attendance updates for students:

```typescript
const { recentUpdates } = useRealtimeAttendance([studentId]);
```

#### 5. `useQuizLeaderboard(quizId)`

Live quiz leaderboard updates:

```typescript
const { leaderboard, lastUpdate } = useQuizLeaderboard(quizId);
```

### UI Components

#### 1. `OnlinePresenceIndicator`

Visual indicator of user online status:

```tsx
<OnlinePresenceIndicator userId={123} size="medium" showTooltip />
```

**Features:**
- Color-coded status (green=online, orange=away, red=busy, gray=offline)
- Tooltip with last seen time
- Configurable size

#### 2. `TypingIndicator`

Animated typing indicator:

```tsx
<TypingIndicator userNames={['John', 'Jane']} />
```

**Features:**
- Animated dots
- Shows who is typing
- Configurable display

#### 3. `RealtimeChatInterface`

Complete chat UI with real-time features:

```tsx
<RealtimeChatInterface
  room="chat-1"
  title="Group Chat"
  onSendMessage={handleSend}
  participants={participants}
/>
```

**Features:**
- Real-time message sync
- Typing indicators
- Online presence for participants
- Message history
- Auto-scroll to bottom

#### 4. `LiveLeaderboard`

Real-time quiz leaderboard:

```tsx
<LiveLeaderboard quizId={123} currentUserId={userId} />
```

**Features:**
- Live rank updates
- Highlight recent changes
- Medal icons for top 3
- Current user highlight
- Time and score display

#### 5. `RealtimeAttendanceWidget`

Live attendance updates for parents:

```tsx
<RealtimeAttendanceWidget studentIds={[1, 2]} />
```

**Features:**
- Real-time attendance notifications
- Status icons and colors
- Recent update history

#### 6. `WebSocketConnectionStatus`

Connection status indicator:

```tsx
<WebSocketConnectionStatus />
```

**Features:**
- Shows when disconnected
- Shows when reconnected
- Auto-dismissing snackbars

## Usage Examples

### Example 1: Study Group Chat

```tsx
import { RealtimeChatInterface } from '@/components/communications';

function StudyGroupPage({ groupId }) {
  const handleSendMessage = async (message: string) => {
    await studyGroupApi.sendMessage(groupId, message);
  };

  return (
    <RealtimeChatInterface
      room={`study-group-${groupId}`}
      title="Study Group Chat"
      onSendMessage={handleSendMessage}
      participants={groupMembers}
    />
  );
}
```

### Example 2: Parent Dashboard with Real-time Attendance

```tsx
import { useRealtimeAttendance } from '@/hooks';
import { RealtimeAttendanceWidget } from '@/components/parent';

function ParentDashboard() {
  const { children } = useParent();
  const studentIds = children.map(c => c.id);

  return (
    <Box>
      <RealtimeAttendanceWidget studentIds={studentIds} />
      {/* Other dashboard content */}
    </Box>
  );
}
```

### Example 3: Live Quiz with Leaderboard

```tsx
import { LiveLeaderboard } from '@/components/quizzes';

function QuizPage({ quizId }) {
  const { user } = useAuth();

  return (
    <Box>
      {/* Quiz content */}
      <LiveLeaderboard quizId={quizId} currentUserId={user?.id} />
    </Box>
  );
}
```

### Example 4: Chat with Online Users

```tsx
import { useOnlinePresence } from '@/hooks';
import { OnlinePresenceIndicator } from '@/components/common';

function UserList({ users }) {
  const userIds = users.map(u => u.id);
  const { isUserOnline } = useOnlinePresence(userIds);

  return (
    <List>
      {users.map(user => (
        <ListItem key={user.id}>
          <OnlinePresenceIndicator userId={user.id} />
          <ListItemText primary={user.name} />
        </ListItem>
      ))}
    </List>
  );
}
```

## Message Flow Examples

### Attendance Update Flow

1. Teacher marks attendance via API
2. `AttendanceService._send_realtime_notification()` called
3. `realtime_service.notify_attendance_update()` broadcasts to parent user IDs
4. WebSocket manager sends to all parent connections
5. Frontend `useRealtimeAttendance` hook receives update
6. `RealtimeAttendanceWidget` displays notification toast
7. Query cache invalidated to refresh attendance data

### Chat Message Flow

1. User types in `RealtimeChatInterface`
2. `sendTyping()` called from `useRealtimeChat`
3. WebSocket sends typing indicator to server
4. Server broadcasts to room (excluding sender)
5. Other users' `useRealtimeChat` receives typing indicator
6. `TypingIndicator` component shows "X is typing"
7. User sends message via API
8. Backend broadcasts chat message to room
9. All users receive message via WebSocket
10. Messages state updated in `useRealtimeChat`

### Quiz Leaderboard Flow

1. Student completes quiz
2. `quiz_realtime_service.trigger_leaderboard_update()` called
3. Service calculates new leaderboard rankings
4. Broadcasts to quiz room subscribers
5. `useQuizLeaderboard` hook receives update
6. `LiveLeaderboard` component updates with animation
7. Recent changes highlighted for 2 seconds

## Best Practices

### Backend

1. **Always handle disconnections gracefully**
   - Clean up subscriptions
   - Update presence status
   - Remove from active connections

2. **Use asyncio.create_task for non-blocking broadcasts**
   - Don't block API responses
   - Handle errors silently

3. **Implement rate limiting**
   - Prevent message flooding
   - Throttle typing indicators

4. **Validate user permissions**
   - Check authorization before broadcasting
   - Filter recipients by institution/role

### Frontend

1. **Always clean up subscriptions**
   - Unsubscribe in useEffect cleanup
   - Remove event listeners

2. **Handle connection loss**
   - Show connection status
   - Queue messages during disconnect
   - Retry failed operations

3. **Optimize re-renders**
   - Use useCallback for handlers
   - Memoize expensive operations
   - Debounce typing indicators

4. **Type safety**
   - Use TypeScript interfaces
   - Validate message structure
   - Handle unknown message types

## Testing

### Backend Testing

```python
# Test WebSocket connection
async def test_websocket_connection():
    async with websockets.connect(
        f"ws://localhost:8000/api/v1/ws?token={token}"
    ) as ws:
        data = await ws.recv()
        assert json.loads(data)["type"] == "connection"
```

### Frontend Testing

```typescript
// Mock WebSocket client
jest.mock('@/lib/websocket', () => ({
  websocketClient: {
    on: jest.fn(),
    send: jest.fn(),
    subscribe: jest.fn(),
  },
}));
```

## Performance Considerations

1. **Connection Limits**: Server can handle ~10,000 concurrent connections
2. **Message Size**: Keep messages under 1KB for optimal performance
3. **Broadcast Optimization**: Use rooms to limit broadcast scope
4. **Memory Usage**: Monitor active connections and clean up stale ones
5. **Latency**: Typical message latency <100ms on local network

## Security

1. **Authentication**: Token-based authentication required
2. **Authorization**: Messages filtered by user permissions
3. **Rate Limiting**: Prevent abuse with rate limits
4. **Message Validation**: Validate all incoming messages
5. **XSS Prevention**: Sanitize all user-generated content

## Troubleshooting

### Connection Issues

**Problem**: WebSocket won't connect
- Check token is valid
- Verify WebSocket URL format
- Check CORS settings

**Problem**: Frequent disconnections
- Check network stability
- Increase ping interval
- Check server resources

### Message Issues

**Problem**: Messages not received
- Verify subscription to correct room
- Check user permissions
- Verify message format

**Problem**: Duplicate messages
- Check for multiple subscriptions
- Verify cleanup in useEffect

## Future Enhancements

1. **Message Persistence**: Store messages in Redis for offline users
2. **Message Reactions**: Add emoji reactions to messages
3. **File Sharing**: Support file attachments in chat
4. **Video/Audio**: WebRTC integration for calls
5. **Message Search**: Full-text search in chat history
6. **Read Receipts**: Track message read status
7. **Push Notifications**: Browser push notifications for offline users
