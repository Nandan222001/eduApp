# Live Event Streaming Implementation

This document provides an overview of the live event streaming feature implementation for the school management system.

## Overview

The live event streaming system enables schools to broadcast events in real-time to parents, students, and staff. It includes features for viewing live streams, purchasing tickets for fundraising events, managing recordings, and setting event reminders.

## Key Features

### 1. Live Event Viewer (`LiveEventViewer.tsx`)

- **HLS Video Streaming**: Supports HLS (HTTP Live Streaming) for adaptive bitrate streaming
- **Multi-Camera Angles**: Switch between different camera perspectives (main stage, audience, close-up)
- **Quality Selection**: Choose from Auto, 1080p, 720p, 480p quality settings
- **Live Chat**: Real-time chat with emoji reactions and message filtering
- **Viewer Count**: Display current number of live viewers
- **Event Information Panel**: Shows event title, description, schedule, and related documents
- **Full-Screen Mode**: Watch events in full-screen
- **Share Event**: Share event links via social media, WhatsApp, or email

### 2. School Events Calendar (`SchoolEventsCalendar.tsx`)

- **Live Events Tab**: Browse currently live events
- **Upcoming Events Tab**: View scheduled events with countdown timers
- **Past Events Library**: Access recordings of past events
- **Set Reminders**: Configure event reminders with customizable timing
- **Ticket Purchase**: Buy tickets for fundraising events

### 3. Event Broadcaster Interface (`EventBroadcaster.tsx`)

For AV team and administrators:

- **Stream Health Monitoring**: Real-time metrics (bitrate, FPS, dropped frames, latency)
- **Viewer Analytics**: Track total viewers, peak viewers, average watch time, engagement rate
- **Device Breakdown**: View distribution of viewers by device type
- **Chat Moderation**: Review and delete inappropriate messages
- **Recording Management**: Start/stop recording of live streams
- **Live Stats**: Current viewer count and message activity

### 4. Parent Notification Preferences

- **Reminder Methods**: Email, SMS, and push notifications
- **Timing Options**: 1 week, 24 hours, 1 hour, or 15 minutes before events
- **Live Start Notifications**: Get notified when streams begin
- **Recording Availability**: Notification when recordings are ready
- **Event Updates**: Alerts for changes or cancellations

### 5. Ticketed Events

- **Payment Gateway Integration**: Secure ticket purchase flow
- **Multi-Step Purchase Process**: Event details → Payment info → Confirmation
- **Ticket Management**: View purchased tickets and transaction history
- **Access Control**: Only ticket holders can view paid events

## Components

### Core Components

#### `LiveEventViewer`

Main component for viewing live or recorded events.

**Props:**

- None (uses route params)

**Features:**

- Video player with HLS support
- Live chat sidebar
- Camera angle selector
- Quality selector
- Event information tabs

#### `SchoolEventsCalendar`

Display and manage event listings.

**Features:**

- Tab navigation for live/upcoming/past events
- Event cards with countdown timers
- Reminder setting dialog
- Search and filter capabilities

#### `EventBroadcaster`

Control panel for managing live broadcasts.

**Features:**

- Stream health dashboard
- Analytics charts and metrics
- Chat moderation tools
- Recording controls

### Supporting Components

#### `HLSVideoPlayer`

Custom video player with HLS support.

**Props:**

```typescript
interface HLSVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  quality?: string;
}
```

#### `LiveEventChat`

Real-time chat interface with emoji support.

**Props:**

```typescript
interface LiveEventChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId?: number;
  height?: string | number;
}
```

#### `EventCountdown`

Countdown timer for upcoming events.

**Props:**

```typescript
interface EventCountdownProps {
  targetDate: string;
  onComplete?: () => void;
  compact?: boolean;
}
```

#### `LiveViewerCounter`

Displays current viewer count with animation.

#### `StreamQualitySelector`

Quality selection dropdown with preset options.

#### `CameraAngleSelector`

Switch between multiple camera feeds.

#### `StreamHealthIndicator`

Shows stream health status and metrics.

#### `TicketPurchaseDialog`

Multi-step ticket purchase flow.

#### `ParentNotificationPreferences`

Manage event notification settings.

## Hooks

### `useLiveEvent`

Main hook for live event functionality.

```typescript
const {
  event,
  isLoading,
  chatMessages,
  streamHealth,
  sendMessage,
  shareEvent,
  setReminder,
  isFullscreen,
} = useLiveEvent(eventId);
```

### `useEventReminders`

Manage event reminders.

```typescript
const { reminders, setReminder, deleteReminder, hasReminder, getRemindersByEvent } =
  useEventReminders();
```

## API Integration

### Events API (`eventsApi`)

#### Live Event Endpoints

```typescript
// Get live event details
getLiveEvent(id: number): Promise<LiveEvent>

// Get all currently live events
getLiveEvents(): Promise<LiveEvent[]>

// Get upcoming live events
getUpcomingLiveEvents(): Promise<LiveEvent[]>

// Get recorded events
getRecordedEvents(): Promise<LiveEvent[]>
```

#### Chat Endpoints

```typescript
// Get chat messages
getChatMessages(eventId: number, limit?: number): Promise<ChatMessage[]>

// Send chat message
sendChatMessage(eventId: number, message: string): Promise<ChatMessage>

// Moderate message
moderateMessage(eventId: number, messageId: string, action: 'delete' | 'flag')
```

#### Analytics Endpoints

```typescript
// Get stream health
getStreamHealth(eventId: number): Promise<StreamHealth>

// Get viewer analytics
getViewerAnalytics(eventId: number): Promise<ViewerAnalytics>
```

#### Ticketing Endpoints

```typescript
// Purchase ticket
purchaseTicket(eventId: number, paymentData: any): Promise<EventTicket>

// Get my tickets
getMyTickets(): Promise<EventTicket[]>

// Verify ticket
verifyTicket(eventId: number, ticketNumber: string)
```

#### Reminder Endpoints

```typescript
// Set reminder
setReminder(eventId: number, reminderData: Partial<EventReminder>): Promise<EventReminder>

// Get reminders
getReminders(): Promise<EventReminder[]>

// Delete reminder
deleteReminder(eventId: number, reminderId: number)
```

#### Notification Preferences

```typescript
// Get preferences
getNotificationPreferences(): Promise<ParentNotificationPreferences>

// Update preferences
updateNotificationPreferences(preferences: Partial<ParentNotificationPreferences>)
```

#### Recording Management

```typescript
// Start recording
startRecording(eventId: number)

// Stop recording
stopRecording(eventId: number)
```

#### Sharing

```typescript
// Share event
shareEvent(eventId: number, platform: string)
```

## Type Definitions

See `frontend/src/types/event.ts` for complete type definitions:

- `LiveEvent`
- `StreamHealth`
- `CameraAngle`
- `EventDocument`
- `ChatMessage`
- `EventTicket`
- `EventReminder`
- `ParentNotificationPreferences`
- `ViewerAnalytics`

## Usage Examples

### Viewing a Live Event

```typescript
import { LiveEventViewer } from '@/pages/LiveEventViewer';

// Route configuration
<Route path="/events/live/:eventId" element={<LiveEventViewer />} />
```

### Setting Event Reminders

```typescript
import { useEventReminders } from '@/hooks/useEventReminders';

const { setReminder, hasReminder } = useEventReminders();

// Check if reminder exists
const reminderSet = hasReminder(eventId);

// Set a new reminder
await setReminder({
  eventId,
  reminderData: {
    reminder_type: 'all',
    reminder_time: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  },
});
```

### Managing Notifications

```typescript
import { ParentNotificationPreferences } from '@/components/events/ParentNotificationPreferences';

// In a settings page
<ParentNotificationPreferences />
```

## Browser Compatibility

### HLS Support

- **Safari**: Native HLS support
- **Chrome/Firefox/Edge**: Requires HLS.js library
- **Mobile Browsers**: Native support on iOS, HLS.js on Android

### WebRTC Support (for ultra-low latency)

- Chrome 23+
- Firefox 22+
- Safari 11+
- Edge 79+

## Performance Considerations

1. **Adaptive Bitrate**: HLS automatically adjusts quality based on network conditions
2. **Chat Polling**: Messages refresh every 2 seconds to balance real-time updates with server load
3. **Analytics Refresh**: Viewer analytics update every 10 seconds
4. **Stream Health**: Monitors health every 5 seconds for broadcasters

## Security

1. **Ticket Verification**: Access to paid events requires valid ticket purchase
2. **Chat Moderation**: Broadcaster can delete inappropriate messages
3. **Payment Security**: Credit card details are never stored client-side
4. **Stream URLs**: HLS URLs should be time-limited and signed on the backend

## Future Enhancements

1. **WebRTC Integration**: For ultra-low latency streaming
2. **Interactive Polls**: Live polls during events
3. **Q&A Sessions**: Structured question and answer functionality
4. **Breakout Rooms**: Multiple concurrent streams for large events
5. **Closed Captions**: Real-time captioning for accessibility
6. **Screen Sharing**: Allow broadcasters to share presentations
7. **Virtual Backgrounds**: Background replacement for remote speakers
8. **Reaction Animations**: Animated emoji reactions overlay on video

## Testing

Recommended test scenarios:

1. Join live event as viewer
2. Send chat messages and reactions
3. Switch camera angles
4. Change quality settings
5. Purchase event ticket
6. Set and manage reminders
7. Test broadcaster controls
8. Verify chat moderation
9. Check analytics accuracy
10. Test on mobile devices

## Support

For issues or questions about the live event streaming implementation, please refer to:

- Main project documentation
- API documentation
- Component Storybook (if available)
