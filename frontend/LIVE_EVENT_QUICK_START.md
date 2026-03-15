# Live Event Streaming - Quick Start Guide

## Overview

Quick guide for implementing and using the live event streaming features.

## Pages

### 1. Live Event Viewer

**Path:** `/events/live/:eventId`
**File:** `frontend/src/pages/LiveEventViewer.tsx`

View live or recorded events with chat, camera angles, and quality selection.

**URL Example:** `/events/live/123`

### 2. School Events Calendar

**Path:** `/events/calendar`
**File:** `frontend/src/pages/SchoolEventsCalendar.tsx`

Browse live events, upcoming events, and past recordings.

### 3. Event Broadcaster

**Path:** `/events/broadcast/:eventId`
**File:** `frontend/src/pages/EventBroadcaster.tsx`

Control panel for AV team to manage streams, monitor health, and moderate chat.

**URL Example:** `/events/broadcast/123`

### 4. Parent Event Settings

**Path:** `/events/settings`
**File:** `frontend/src/pages/ParentEventSettings.tsx`

Manage notification preferences, tickets, and reminders.

## Key Components

### Video Player

```tsx
import { HLSVideoPlayer } from '@/components/events';

<HLSVideoPlayer src="https://example.com/stream.m3u8" poster="/poster.jpg" autoPlay={true} />;
```

### Live Chat

```tsx
import { LiveEventChat } from '@/components/events';

<LiveEventChat
  messages={chatMessages}
  onSendMessage={handleSendMessage}
  currentUserId={user.id}
  height="600px"
/>;
```

### Countdown Timer

```tsx
import { EventCountdown } from '@/components/events';

<EventCountdown
  targetDate="2024-12-25T10:00:00Z"
  onComplete={() => console.log('Event started!')}
/>;
```

### Viewer Counter

```tsx
import { LiveViewerCounter } from '@/components/events';

<LiveViewerCounter count={1234} variant="default" />;
```

### Quality Selector

```tsx
import { StreamQualitySelector } from '@/components/events';

<StreamQualitySelector value={quality} onChange={setQuality} darkMode={true} />;
```

### Camera Selector

```tsx
import { CameraAngleSelector } from '@/components/events';

<CameraAngleSelector
  cameras={event.camera_angles}
  selectedCameraId={selectedCamera}
  onChange={setSelectedCamera}
  compact={true}
/>;
```

### Notification Preferences

```tsx
import { ParentNotificationPreferences } from '@/components/events';

<ParentNotificationPreferences />;
```

### Ticket Purchase

```tsx
import { TicketPurchaseDialog } from '@/components/events';

<TicketPurchaseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} event={liveEvent} />;
```

## Hooks

### useLiveEvent

```tsx
import { useLiveEvent } from '@/hooks';

const { event, chatMessages, streamHealth, sendMessage, shareEvent } = useLiveEvent(eventId);
```

### useEventReminders

```tsx
import { useEventReminders } from '@/hooks';

const { reminders, setReminder, deleteReminder, hasReminder } = useEventReminders();

// Set reminder
await setReminder({
  eventId: 123,
  reminderData: {
    reminder_type: 'all',
    reminder_time: new Date().toISOString(),
  },
});
```

## API Usage

### Get Live Events

```typescript
import { eventsApi } from '@/api/events';

const liveEvents = await eventsApi.getLiveEvents();
const upcomingEvents = await eventsApi.getUpcomingLiveEvents();
const recordings = await eventsApi.getRecordedEvents();
```

### Chat Management

```typescript
// Get messages
const messages = await eventsApi.getChatMessages(eventId);

// Send message
await eventsApi.sendChatMessage(eventId, 'Hello!');

// Moderate (broadcaster only)
await eventsApi.moderateMessage(eventId, messageId, 'delete');
```

### Tickets

```typescript
// Purchase ticket
const ticket = await eventsApi.purchaseTicket(eventId, {
  cardNumber: '1234567890123456',
  // ... payment data
});

// Get my tickets
const myTickets = await eventsApi.getMyTickets();
```

### Reminders

```typescript
// Set reminder
await eventsApi.setReminder(eventId, {
  reminder_type: 'email',
  reminder_time: new Date().toISOString(),
});

// Get all reminders
const reminders = await eventsApi.getReminders();
```

### Analytics (Broadcaster)

```typescript
const analytics = await eventsApi.getViewerAnalytics(eventId);
const streamHealth = await eventsApi.getStreamHealth(eventId);
```

## Type Definitions

### LiveEvent

```typescript
interface LiveEvent extends Event {
  is_live: boolean;
  stream_url?: string;
  hls_url?: string;
  viewer_count?: number;
  camera_angles?: CameraAngle[];
  is_ticketed?: boolean;
  ticket_price?: number;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  user_id: number;
  user_name: string;
  message: string;
  message_type: 'text' | 'emoji' | 'system';
  timestamp: string;
}
```

### StreamHealth

```typescript
interface StreamHealth {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  bitrate: number;
  fps: number;
  dropped_frames: number;
  latency: number;
}
```

## Common Patterns

### Setting Up Event Viewer

```tsx
function EventPage() {
  const { eventId } = useParams();
  const { event, chatMessages, sendMessage } = useLiveEvent(Number(eventId));

  return (
    <Grid container spacing={2}>
      <Grid item xs={9}>
        <HLSVideoPlayer src={event?.hls_url} />
      </Grid>
      <Grid item xs={3}>
        <LiveEventChat messages={chatMessages} onSendMessage={sendMessage} />
      </Grid>
    </Grid>
  );
}
```

### Reminder Management

```tsx
function ReminderButton({ eventId }) {
  const { hasReminder, setReminder } = useEventReminders();
  const isSet = hasReminder(eventId);

  const handleSetReminder = async () => {
    await setReminder({
      eventId,
      reminderData: {
        reminder_type: 'all',
        reminder_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  };

  return (
    <Button onClick={handleSetReminder} color={isSet ? 'success' : 'primary'}>
      {isSet ? 'Reminder Set' : 'Set Reminder'}
    </Button>
  );
}
```

### Ticket Purchase Flow

```tsx
function TicketedEventAccess({ event }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (event.requires_purchase && !event.is_ticketed) {
    return (
      <>
        <Alert severity="warning">This event requires a ticket purchase.</Alert>
        <Button onClick={() => setDialogOpen(true)}>Purchase Ticket - ${event.ticket_price}</Button>
        <TicketPurchaseDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          event={event}
        />
      </>
    );
  }

  return <HLSVideoPlayer src={event.hls_url} />;
}
```

## Routes Setup

Add these routes to your router configuration:

```tsx
import {
  LiveEventViewer,
  SchoolEventsCalendar,
  EventBroadcaster,
  ParentEventSettings,
} from '@/pages';

// In your routes
<Route path="/events/calendar" element={<SchoolEventsCalendar />} />
<Route path="/events/live/:eventId" element={<LiveEventViewer />} />
<Route path="/events/broadcast/:eventId" element={<EventBroadcaster />} />
<Route path="/events/settings" element={<ParentEventSettings />} />
```

## Testing Checklist

- [ ] View live event as viewer
- [ ] Send chat messages
- [ ] Send emoji reactions
- [ ] Switch camera angles
- [ ] Change quality settings
- [ ] Enter full-screen mode
- [ ] Share event
- [ ] Set event reminder
- [ ] Purchase event ticket
- [ ] View past recordings
- [ ] Moderate chat (as broadcaster)
- [ ] Monitor stream health
- [ ] Start/stop recording
- [ ] View analytics
- [ ] Update notification preferences

## Performance Tips

1. **Use React Query caching** - Events and chat are cached automatically
2. **Optimize polling intervals** - Chat: 2s, Analytics: 10s, Health: 5s
3. **Lazy load components** - Split routes with React.lazy()
4. **Memoize callbacks** - Use useCallback for event handlers
5. **Virtual scrolling** - For long chat message lists

## Troubleshooting

### Video won't play

- Check HLS URL is valid (.m3u8 file)
- Ensure HLS.js is loaded for non-Safari browsers
- Verify CORS headers on streaming server

### Chat not updating

- Check WebSocket/polling connection
- Verify API endpoints are accessible
- Check React Query devtools for failed requests

### Countdown not accurate

- Ensure server time is synchronized
- Check timezone handling in date calculations

## Next Steps

1. Configure streaming server (OBS, Wowza, etc.)
2. Set up HLS endpoints on backend
3. Implement payment gateway integration
4. Configure notification service (email/SMS)
5. Add CDN for video delivery
6. Set up analytics tracking
7. Implement access controls
8. Add moderation tools
