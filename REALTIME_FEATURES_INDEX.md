# Real-time WebSocket Features - Complete Index

## 📦 Backend Components

### Services

#### `src/services/websocket_manager.py`
**WebSocket Connection Manager**
- Manages all active WebSocket connections
- Handles room subscriptions
- Tracks user presence
- Manages typing indicators
- Broadcasts messages to users/rooms

**Key Classes:**
- `ConnectionManager` - Main WebSocket manager singleton

**Key Methods:**
- `connect(websocket, user_id)` - Accept new connection
- `disconnect(websocket, user_id)` - Handle disconnection
- `send_personal_message(message, user_id)` - Send to specific user
- `broadcast_to_room(room, message)` - Broadcast to room
- `send_typing_indicator(room, user_id, user_name, is_typing)` - Typing status
- `broadcast_presence_update(user_id, status)` - Presence updates
- `subscribe_to_room(room, user_id)` - Subscribe to room
- `get_online_users(user_ids)` - Get online status
- `is_user_connected(user_id)` - Check if user online

#### `src/services/realtime_service.py`
**High-level Real-time Service**
- Application-specific real-time operations
- Attendance update notifications
- Message notifications
- Chat message broadcasting
- Quiz leaderboard updates

**Key Class:**
- `RealtimeService` - High-level real-time operations

**Key Methods:**
- `notify_attendance_update()` - Send attendance updates to parents
- `notify_new_message()` - Notify about new messages
- `notify_new_announcement()` - Notify about announcements
- `broadcast_chat_message()` - Send chat messages
- `update_quiz_leaderboard()` - Update quiz leaderboards
- `notify_general()` - General notifications

#### `src/services/quiz_realtime_service.py`
**Quiz Real-time Service**
- Quiz leaderboard calculations
- Real-time leaderboard broadcasting
- Rank updates

**Key Class:**
- `QuizRealtimeService` - Quiz-specific real-time features

**Key Methods:**
- `update_and_broadcast_leaderboard()` - Calculate and broadcast leaderboard
- `trigger_leaderboard_update()` - Trigger update after quiz completion

### API Endpoints

#### `src/api/v1/websocket.py`
**WebSocket API Endpoint**

**Endpoints:**
- `GET /api/v1/ws` - WebSocket connection endpoint
- `GET /api/v1/presence/{user_id}` - Get user presence
- `POST /api/v1/presence/bulk` - Get bulk user presence

**Message Types Handled:**
- `ping` - Heartbeat check
- `subscribe` - Subscribe to rooms
- `unsubscribe` - Unsubscribe from rooms
- `typing` - Typing indicator
- `presence` - Update presence status
- `get_online_users` - Request online users
- `get_presence` - Request user presence

## 📦 Frontend Components

### Core Library

#### `frontend/src/lib/websocket.ts`
**WebSocket Client Library**

**Exports:**
- `WebSocketClient` class - Main WebSocket client
- `websocketClient` singleton - Ready-to-use instance
- `WebSocketMessageType` type - All message types
- `WebSocketMessage` interface - Message structure
- `MessageHandler` type - Message handler function

**Key Methods:**
- `connect()` - Establish connection
- `disconnect()` - Close connection
- `send(message)` - Send message
- `on(type, handler)` - Register handler
- `off(type, handler)` - Unregister handler
- `subscribe(rooms)` - Subscribe to rooms
- `unsubscribe(rooms)` - Unsubscribe from rooms
- `sendTyping(room, isTyping)` - Send typing indicator
- `updatePresence(status)` - Update presence
- `getOnlineUsers(userIds)` - Request online users
- `isConnected()` - Check connection status

### Context & Providers

#### `frontend/src/contexts/WebSocketContext.tsx`
**WebSocket React Context**

**Exports:**
- `WebSocketContext` - React context
- `WebSocketProvider` - Context provider component
- `useWebSocket` - Hook to access context

**Context Value:**
- `isConnected: boolean` - Connection status
- `subscribe(rooms)` - Subscribe to rooms
- `unsubscribe(rooms)` - Unsubscribe from rooms
- `sendTyping(room, isTyping)` - Send typing indicator
- `updatePresence(status)` - Update presence
- `getOnlineUsers(userIds)` - Get online users
- `getUserPresence(userId)` - Get user presence
- `onMessage(type, handler)` - Register message handler

### Custom Hooks

#### `frontend/src/hooks/useRealtimeNotifications.ts`
**Real-time Notifications Hook**

**Purpose:** Auto-handle notification and announcement messages

**Returns:** `void`

**Features:**
- Displays toast notifications automatically
- Invalidates query cache on updates
- Handles new messages and announcements

#### `frontend/src/hooks/useRealtimeChat.ts`
**Real-time Chat Hook**

**Purpose:** Complete chat functionality with typing indicators

**Parameters:**
- `room: string` - Chat room ID

**Returns:**
```typescript
{
  messages: ChatMessage[]      // Chat messages
  typingUsers: number[]        // User IDs typing
  sendTyping: () => void       // Indicate typing
  stopTyping: () => void       // Stop typing
}
```

#### `frontend/src/hooks/useOnlinePresence.ts`
**Online Presence Hook**

**Purpose:** Track online status of multiple users

**Parameters:**
- `userIds: number[]` - User IDs to track

**Returns:**
```typescript
{
  onlineUsers: number[]                    // Online user IDs
  isUserOnline: (userId) => boolean        // Check if online
  getUserStatus: (userId) => UserPresence  // Get user status
  refreshPresence: () => void              // Refresh data
}
```

#### `frontend/src/hooks/useRealtimeAttendance.ts`
**Real-time Attendance Hook**

**Purpose:** Receive real-time attendance updates

**Parameters:**
- `studentIds?: number[]` - Student IDs to monitor

**Returns:**
```typescript
{
  recentUpdates: AttendanceUpdate[]  // Recent updates
  clearRecentUpdates: () => void     // Clear updates
}
```

#### `frontend/src/hooks/useQuizLeaderboard.ts`
**Quiz Leaderboard Hook**

**Purpose:** Live quiz leaderboard updates

**Parameters:**
- `quizId: number` - Quiz ID

**Returns:**
```typescript
{
  leaderboard: LeaderboardEntry[]  // Leaderboard data
  lastUpdate: string | null        // Last update time
}
```

### UI Components

#### `frontend/src/components/common/OnlinePresenceIndicator.tsx`
**Online Presence Indicator Component**

**Purpose:** Visual indicator of user online status

**Props:**
```typescript
{
  userId: number                          // User ID
  size?: 'small' | 'medium' | 'large'    // Indicator size
  showTooltip?: boolean                   // Show tooltip
}
```

**Features:**
- Color-coded status (green/orange/red/gray)
- Tooltip with last seen time
- Responsive sizing

#### `frontend/src/components/common/TypingIndicator.tsx`
**Typing Indicator Component**

**Purpose:** Animated typing indicator

**Props:**
```typescript
{
  userNames?: string[]   // Names of users typing
  showNames?: boolean    // Show user names
}
```

**Features:**
- Animated dots
- Multiple user support
- Customizable display

#### `frontend/src/components/common/WebSocketConnectionStatus.tsx`
**Connection Status Component**

**Purpose:** Connection status notifications

**Props:** None

**Features:**
- Shows disconnection warning
- Shows reconnection success
- Auto-dismissing snackbars

#### `frontend/src/components/communications/RealtimeChatInterface.tsx`
**Real-time Chat Interface Component**

**Purpose:** Complete chat UI with real-time features

**Props:**
```typescript
{
  room: string                                    // Room ID
  title: string                                   // Chat title
  onSendMessage: (message: string) => Promise<void>  // Send handler
  participants?: Array<{id: number, name: string}>   // Participants
}
```

**Features:**
- Real-time message sync
- Typing indicators
- Online presence
- Auto-scroll
- Message history
- User avatars

#### `frontend/src/components/quizzes/LiveLeaderboard.tsx`
**Live Quiz Leaderboard Component**

**Purpose:** Real-time quiz leaderboard

**Props:**
```typescript
{
  quizId: number           // Quiz ID
  currentUserId?: number   // Current user ID
}
```

**Features:**
- Live rank updates
- Medal icons for top 3
- Highlight current user
- Score and time display
- Animated changes
- Attempt count

#### `frontend/src/components/parent/RealtimeAttendanceWidget.tsx`
**Real-time Attendance Widget Component**

**Purpose:** Live attendance updates for parents

**Props:**
```typescript
{
  studentIds: number[]  // Student IDs
  title?: string        // Widget title
}
```

**Features:**
- Real-time notifications
- Status icons and colors
- Recent update history
- Live badge
- Student names

### API Helpers

#### `frontend/src/api/websocket.ts`
**WebSocket API Helper**

**Exports:**
```typescript
websocketApi: {
  getUserPresence(userId: number)      // Get user presence
  getBulkPresence(userIds: number[])   // Get bulk presence
}
```

### Example Pages

#### `frontend/src/pages/RealtimeChatDemo.tsx`
**Real-time Chat Demo Page**

**Purpose:** Demonstration of chat features

**Features:**
- Shows RealtimeChatInterface usage
- Example participant list
- Sample message handling

## 📁 File Structure

```
Backend:
├── src/
│   ├── services/
│   │   ├── websocket_manager.py          ✅ Core WebSocket manager
│   │   ├── realtime_service.py           ✅ High-level real-time API
│   │   └── quiz_realtime_service.py      ✅ Quiz real-time features
│   └── api/v1/
│       └── websocket.py                   ✅ WebSocket endpoint

Frontend:
├── src/
│   ├── lib/
│   │   └── websocket.ts                   ✅ WebSocket client
│   ├── contexts/
│   │   └── WebSocketContext.tsx           ✅ React context
│   ├── hooks/
│   │   ├── useRealtimeNotifications.ts    ✅ Notifications hook
│   │   ├── useRealtimeChat.ts            ✅ Chat hook
│   │   ├── useOnlinePresence.ts          ✅ Presence hook
│   │   ├── useRealtimeAttendance.ts      ✅ Attendance hook
│   │   └── useQuizLeaderboard.ts         ✅ Leaderboard hook
│   ├── components/
│   │   ├── common/
│   │   │   ├── OnlinePresenceIndicator.tsx    ✅ Presence indicator
│   │   │   ├── TypingIndicator.tsx           ✅ Typing indicator
│   │   │   └── WebSocketConnectionStatus.tsx  ✅ Connection status
│   │   ├── communications/
│   │   │   └── RealtimeChatInterface.tsx     ✅ Chat interface
│   │   ├── quizzes/
│   │   │   └── LiveLeaderboard.tsx           ✅ Live leaderboard
│   │   └── parent/
│   │       └── RealtimeAttendanceWidget.tsx  ✅ Attendance widget
│   ├── pages/
│   │   └── RealtimeChatDemo.tsx              ✅ Demo page
│   └── api/
│       └── websocket.ts                       ✅ API helper

Documentation:
├── REALTIME_WEBSOCKET_IMPLEMENTATION.md       ✅ Full documentation
├── REALTIME_FEATURES_QUICK_START.md          ✅ Quick start guide
├── REALTIME_FEATURES_CHECKLIST.md            ✅ Implementation checklist
└── REALTIME_FEATURES_INDEX.md                ✅ This file
```

## 🔗 Quick Links

### Backend
- [WebSocket Manager](src/services/websocket_manager.py)
- [Realtime Service](src/services/realtime_service.py)
- [Quiz Realtime Service](src/services/quiz_realtime_service.py)
- [WebSocket Endpoint](src/api/v1/websocket.py)

### Frontend
- [WebSocket Client](frontend/src/lib/websocket.ts)
- [WebSocket Context](frontend/src/contexts/WebSocketContext.tsx)
- [Hooks Directory](frontend/src/hooks/)
- [Components Directory](frontend/src/components/)

### Documentation
- [Full Implementation Guide](REALTIME_WEBSOCKET_IMPLEMENTATION.md)
- [Quick Start Guide](REALTIME_FEATURES_QUICK_START.md)
- [Implementation Checklist](REALTIME_FEATURES_CHECKLIST.md)

## 🎯 Usage Patterns

### Pattern 1: Add Real-time to Existing Page
```tsx
import { useRealtimeNotifications } from '@/hooks';

export default function MyPage() {
  useRealtimeNotifications();
  return <div>Content</div>;
}
```

### Pattern 2: Create Chat Feature
```tsx
import { RealtimeChatInterface } from '@/components/communications';

<RealtimeChatInterface
  room="my-room"
  title="Chat"
  onSendMessage={handleSend}
  participants={users}
/>
```

### Pattern 3: Show Online Status
```tsx
import { OnlinePresenceIndicator } from '@/components/common';

<OnlinePresenceIndicator userId={userId} />
```

### Pattern 4: Track Typing
```tsx
import { useRealtimeChat } from '@/hooks';
import { TypingIndicator } from '@/components/common';

const { typingUsers } = useRealtimeChat(room);
<TypingIndicator userNames={typingUsers} />
```

### Pattern 5: Live Leaderboard
```tsx
import { LiveLeaderboard } from '@/components/quizzes';

<LiveLeaderboard quizId={quizId} currentUserId={userId} />
```

## 🚀 Quick Start Commands

### Backend
```bash
# Install dependencies
poetry install

# Start server
uvicorn src.main:app --reload

# WebSocket available at:
# ws://localhost:8000/api/v1/ws
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Application available at:
# http://localhost:5173
```

## 📊 Component Statistics

**Backend:**
- Services: 3
- API Endpoints: 3
- Message Types: 13+

**Frontend:**
- Hooks: 5
- Components: 6
- Contexts: 1
- API Helpers: 1
- Example Pages: 1

**Documentation:**
- Guides: 4
- Total Lines: ~3000+

## ✨ Features Implemented

1. ✅ WebSocket client with authentication
2. ✅ Notification delivery with toast display
3. ✅ Live chat message sync
4. ✅ Real-time attendance updates for parents
5. ✅ Live leaderboard updates during quizzes
6. ✅ Online presence indicators for chat
7. ✅ Typing indicators

## 🎉 Complete Implementation

All components are fully implemented, documented, and ready to use!
