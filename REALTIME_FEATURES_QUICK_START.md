# Real-time Features Quick Start Guide

## 🚀 Getting Started

### Backend Setup

1. **Install dependencies:**
```bash
poetry install
```

2. **Start the server:**
```bash
uvicorn src.main:app --reload
```

The WebSocket endpoint will be available at: `ws://localhost:8000/api/v1/ws`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

## 📡 Core Features Implemented

### ✅ 1. WebSocket Client with Authentication

**File**: `frontend/src/lib/websocket.ts`

Automatic connection with token-based authentication, reconnection logic, and message handling.

### ✅ 2. Notification Delivery with Toast Display

**Hook**: `useRealtimeNotifications()`

Automatically displays toast notifications for:
- New messages
- Announcements
- System notifications

**Usage:**
```tsx
import { useRealtimeNotifications } from '@/hooks';

function MyComponent() {
  useRealtimeNotifications(); // That's it!
}
```

### ✅ 3. Live Chat Message Sync

**Component**: `RealtimeChatInterface`

Real-time chat with message syncing across all connected users.

**Usage:**
```tsx
import { RealtimeChatInterface } from '@/components/communications';

<RealtimeChatInterface
  room="study-group-123"
  title="My Study Group"
  onSendMessage={async (msg) => await sendMessage(msg)}
  participants={participants}
/>
```

### ✅ 4. Real-time Attendance Updates for Parents

**Component**: `RealtimeAttendanceWidget`

Parents receive instant notifications when their child's attendance is marked.

**Usage:**
```tsx
import { RealtimeAttendanceWidget } from '@/components/parent';

<RealtimeAttendanceWidget studentIds={[studentId]} />
```

### ✅ 5. Live Leaderboard Updates During Quizzes

**Component**: `LiveLeaderboard`

Real-time leaderboard updates as students complete quizzes.

**Usage:**
```tsx
import { LiveLeaderboard } from '@/components/quizzes';

<LiveLeaderboard quizId={quizId} currentUserId={userId} />
```

### ✅ 6. Online Presence Indicators

**Component**: `OnlinePresenceIndicator`

Shows online/offline/away/busy status for users.

**Usage:**
```tsx
import { OnlinePresenceIndicator } from '@/components/common';

<OnlinePresenceIndicator userId={userId} size="medium" />
```

### ✅ 7. Typing Indicators

**Component**: `TypingIndicator`

Animated typing indicator showing who is typing.

**Usage:**
```tsx
import { TypingIndicator } from '@/components/common';

<TypingIndicator userNames={['John', 'Jane']} />
```

## 🎯 Quick Implementation Examples

### Example 1: Add Real-time Notifications to Any Page

```tsx
import { useRealtimeNotifications } from '@/hooks';

export default function MyPage() {
  // Add this one line to enable real-time notifications
  useRealtimeNotifications();
  
  return <div>My Page Content</div>;
}
```

### Example 2: Create a Chat Page

```tsx
import { RealtimeChatInterface } from '@/components/communications';
import { studyGroupApi } from '@/api/studyGroups';

export default function ChatPage({ groupId }) {
  const handleSendMessage = async (message: string) => {
    await studyGroupApi.sendMessage(groupId, message);
  };

  return (
    <Container>
      <RealtimeChatInterface
        room={`group-${groupId}`}
        title="Group Chat"
        onSendMessage={handleSendMessage}
        participants={[]}
      />
    </Container>
  );
}
```

### Example 3: Show Online Users

```tsx
import { useOnlinePresence } from '@/hooks';
import { OnlinePresenceIndicator } from '@/components/common';

export default function UserList({ users }) {
  const { isUserOnline } = useOnlinePresence(users.map(u => u.id));
  
  return (
    <List>
      {users.map(user => (
        <ListItem key={user.id}>
          <OnlinePresenceIndicator userId={user.id} />
          <ListItemText 
            primary={user.name}
            secondary={isUserOnline(user.id) ? 'Online' : 'Offline'}
          />
        </ListItem>
      ))}
    </List>
  );
}
```

### Example 4: Add Typing Indicator to Chat

```tsx
import { useRealtimeChat } from '@/hooks';
import { TypingIndicator } from '@/components/common';

export default function ChatInput({ room }) {
  const { typingUsers, sendTyping, stopTyping } = useRealtimeChat(room);
  const [message, setMessage] = useState('');
  
  const handleChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value) {
      sendTyping(); // Auto-stops after 2 seconds
    }
  };
  
  return (
    <Box>
      <TypingIndicator userNames={typingUsers.map(id => getUserName(id))} />
      <TextField 
        value={message} 
        onChange={handleChange}
        onBlur={stopTyping}
      />
    </Box>
  );
}
```

### Example 5: Quiz with Live Leaderboard

```tsx
import { LiveLeaderboard } from '@/components/quizzes';
import { useAuth } from '@/hooks';

export default function QuizPage({ quizId }) {
  const { user } = useAuth();
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        {/* Quiz questions */}
      </Grid>
      <Grid item xs={12} md={4}>
        <LiveLeaderboard 
          quizId={quizId} 
          currentUserId={user?.id} 
        />
      </Grid>
    </Grid>
  );
}
```

## 🔌 WebSocket Message Types

### Client → Server

```typescript
// Subscribe to rooms
websocketClient.send({ 
  type: 'subscribe', 
  rooms: ['chat-1', 'quiz-123'] 
});

// Send typing indicator
websocketClient.send({ 
  type: 'typing', 
  room: 'chat-1', 
  is_typing: true 
});

// Update presence
websocketClient.send({ 
  type: 'presence', 
  status: 'away' 
});

// Get online users
websocketClient.send({ 
  type: 'get_online_users', 
  user_ids: [1, 2, 3] 
});
```

### Server → Client

```typescript
// Handle different message types
websocketClient.on('notification', (msg) => {
  // Show notification
});

websocketClient.on('chat_message', (msg) => {
  // Add to chat
});

websocketClient.on('attendance_update', (msg) => {
  // Show attendance update
});

websocketClient.on('leaderboard_update', (msg) => {
  // Update leaderboard
});

websocketClient.on('presence_update', (msg) => {
  // Update user status
});

websocketClient.on('typing_indicator', (msg) => {
  // Show typing
});
```

## 🛠️ Available Hooks

### `useRealtimeNotifications()`
Auto-handles notifications and announcements

### `useRealtimeChat(room: string)`
Returns: `{ messages, typingUsers, sendTyping, stopTyping }`

### `useOnlinePresence(userIds: number[])`
Returns: `{ onlineUsers, isUserOnline, getUserStatus, refreshPresence }`

### `useRealtimeAttendance(studentIds?: number[])`
Returns: `{ recentUpdates, clearRecentUpdates }`

### `useQuizLeaderboard(quizId: number)`
Returns: `{ leaderboard, lastUpdate }`

## 🎨 Available Components

### Connection Status
```tsx
<WebSocketConnectionStatus />
```

### Presence Indicator
```tsx
<OnlinePresenceIndicator 
  userId={123} 
  size="small|medium|large" 
  showTooltip={true}
/>
```

### Typing Indicator
```tsx
<TypingIndicator 
  userNames={['John', 'Jane']} 
  showNames={true}
/>
```

### Chat Interface
```tsx
<RealtimeChatInterface
  room="chat-room-id"
  title="Chat Room"
  onSendMessage={handleSend}
  participants={participants}
/>
```

### Live Leaderboard
```tsx
<LiveLeaderboard 
  quizId={123} 
  currentUserId={456}
/>
```

### Attendance Widget
```tsx
<RealtimeAttendanceWidget 
  studentIds={[1, 2, 3]}
  title="Recent Updates"
/>
```

## 🔒 Authentication

WebSocket connection automatically uses the access token from localStorage:

```typescript
// Token is automatically included in WebSocket URL
ws://localhost:8000/api/v1/ws?token=<access_token>
```

## 🐛 Debugging

### Check Connection Status
```typescript
import { useWebSocket } from '@/contexts/WebSocketContext';

const { isConnected } = useWebSocket();
console.log('Connected:', isConnected);
```

### Monitor Messages
```typescript
websocketClient.on('*', (message) => {
  console.log('WebSocket message:', message);
});
```

### Check Browser Console
WebSocket messages are logged with `websocket:` prefix

## 📊 Testing

### Backend
```bash
# Run tests
poetry run pytest tests/test_websocket.py
```

### Frontend
```bash
# Run tests
npm test
```

## 🚨 Troubleshooting

### WebSocket Won't Connect
1. Check backend is running
2. Verify token is valid
3. Check browser console for errors
4. Ensure WebSocket URL is correct

### Messages Not Received
1. Check you're subscribed to the correct room
2. Verify message type handler is registered
3. Check network tab in browser dev tools

### Connection Drops Frequently
1. Check network stability
2. Increase ping interval
3. Monitor server resources

## 📚 Additional Resources

- Full documentation: `REALTIME_WEBSOCKET_IMPLEMENTATION.md`
- Backend service: `src/services/websocket_manager.py`
- Frontend client: `frontend/src/lib/websocket.ts`
- WebSocket context: `frontend/src/contexts/WebSocketContext.tsx`

## 🎉 That's It!

You now have a fully functional real-time communication system with:
- ✅ WebSocket client with authentication
- ✅ Toast notifications
- ✅ Live chat with typing indicators
- ✅ Real-time attendance updates
- ✅ Live quiz leaderboards
- ✅ Online presence indicators
- ✅ Automatic reconnection
- ✅ Connection status monitoring

Start building amazing real-time features! 🚀
