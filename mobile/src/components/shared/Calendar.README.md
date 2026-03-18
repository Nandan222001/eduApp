# Calendar and Events Integration

## Overview

This module provides a comprehensive calendar and events integration for the mobile app, featuring event management, calendar sync, reminders, and RSVP functionality.

## Components

### Calendar
Main calendar component with marked dates for events.

**Props:**
- `events: Event[]` - Array of events to display
- `onDayPress?: (date: string) => void` - Callback when a day is pressed
- `selectedDate?: string` - Currently selected date
- `showMultiDot?: boolean` - Show multiple dots for events on same day

**Usage:**
```tsx
<Calendar
  events={events}
  onDayPress={handleDayPress}
  selectedDate={selectedDate}
/>
```

### CalendarLegend
Displays color-coded legend for event types.

**Usage:**
```tsx
<CalendarLegend />
```

### EventCard
Card component displaying event details.

**Props:**
- `event: Event` - Event data
- `onPress?: () => void` - Callback when card is pressed
- `showCountdown?: boolean` - Show countdown timer for upcoming events

**Usage:**
```tsx
<EventCard
  event={event}
  onPress={() => handleEventPress(event)}
  showCountdown
/>
```

### CountdownTimer
Displays countdown to event start time.

**Props:**
- `event: Event` - Event data
- `compact?: boolean` - Use compact display mode

**Usage:**
```tsx
<CountdownTimer event={event} compact />
```

### ExamCountdownWidget
Widget showing upcoming exam with countdown.

**Props:**
- `onPress?: () => void` - Callback when widget is pressed

**Usage:**
```tsx
<ExamCountdownWidget onPress={() => navigate('Events')} />
```

## Screens

### EventsScreen
Main events and calendar screen with multiple view modes.

**Features:**
- Calendar view with marked dates
- Agenda/list view
- Event filtering by type
- Event detail modal with RSVP
- Calendar sync
- Reminder setting
- Month navigation

### AcademicYearScreen
Displays academic year overview with terms and holidays.

**Features:**
- Academic year overview
- Term details with expandable cards
- Holiday list
- Duration calculations

## Services

### CalendarService
Handles device calendar synchronization.

**Methods:**
- `requestPermissions()` - Request calendar permissions
- `syncEventToDeviceCalendar(event)` - Sync single event
- `syncMultipleEvents(events)` - Sync multiple events
- `removeEventFromDeviceCalendar(deviceEventId)` - Remove synced event
- `updateDeviceCalendarEvent(deviceEventId, event)` - Update synced event

### EventReminderService
Manages event reminders using notifications.

**Methods:**
- `scheduleEventReminder(event, minutesBefore)` - Schedule single reminder
- `scheduleMultipleReminders(event, minutesArray)` - Schedule multiple reminders
- `cancelEventReminder(notificationId)` - Cancel specific reminder
- `cancelAllEventReminders(eventId)` - Cancel all reminders for event
- `getEventReminders(eventId)` - Get all reminders for event
- `cleanupExpiredReminders()` - Remove expired reminders

## API Integration

### Events API (`/api/v1/events`)

**Endpoints:**
- `GET /api/v1/events` - Get events with optional filters
- `GET /api/v1/events/:id` - Get event by ID
- `GET /api/v1/events/upcoming` - Get upcoming events
- `POST /api/v1/events/:id/rsvp` - RSVP to event
- `PUT /api/v1/events/:id/rsvp` - Update RSVP
- `GET /api/v1/events/:id/rsvp` - Get RSVP status
- `GET /api/v1/events/academic-year/current` - Get current academic year

## Hooks

### useEvents(filters?)
Fetch events with optional filters.

### useEvent(eventId)
Fetch single event by ID.

### useUpcomingEvents(limit?)
Fetch upcoming events with optional limit.

### useEventsByDateRange(startDate, endDate)
Fetch events within date range.

### useEventRSVP(eventId)
Manage event RSVP with submit and update mutations.

### useAcademicYear(yearId?)
Fetch academic year data.

### useSyncEventToCalendar()
Mutation for syncing event to device calendar.

### useScheduleEventReminder()
Mutation for scheduling event reminders.

## Types

### Event
```typescript
interface Event {
  id: number;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isAllDay: boolean;
  requiresRSVP: boolean;
  rsvpDeadline?: string;
  maxAttendees?: number;
  currentAttendees?: number;
  metadata?: {
    subjectId?: number;
    subjectName?: string;
    classId?: number;
    className?: string;
    examId?: number;
    assignmentId?: number;
  };
}
```

### EventType
```typescript
enum EventType {
  EXAM = 'exam',
  ASSIGNMENT = 'assignment',
  PARENT_TEACHER_MEETING = 'parent_teacher_meeting',
  SCHOOL_EVENT = 'school_event',
  HOLIDAY = 'holiday',
  SPORTS_DAY = 'sports_day',
  CULTURAL_EVENT = 'cultural_event',
  WORKSHOP = 'workshop',
  OTHER = 'other',
}
```

### EventStatus
```typescript
enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

### RSVPStatus
```typescript
enum RSVPStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe',
}
```

## Utilities

### Event Helpers (`utils/eventHelpers.ts`)

- `getEventStatusText(event)` - Get human-readable status
- `formatEventDateRange(startDate, endDate)` - Format date range
- `getEventTypeLabel(type)` - Get type label
- `groupEventsByDate(events)` - Group events by date
- `sortEventsByDate(events, ascending)` - Sort events
- `filterEventsByType(events, types)` - Filter by type
- `filterEventsByStatus(events, statuses)` - Filter by status
- `getUpcomingEvents(events, limit)` - Get upcoming events
- `isEventUpcoming(event)` - Check if upcoming
- `isEventToday(event)` - Check if today
- `getEventDuration(event)` - Calculate duration
- `canRSVP(event)` - Check if can RSVP
- `isEventFull(event)` - Check if full

## Installation

This feature requires the following packages (already included in package.json):
- `react-native-calendars` - Calendar component
- `expo-calendar` - Device calendar integration
- `expo-notifications` - Event reminders
- `date-fns` - Date utilities

## Usage Example

```tsx
import { EventsScreen, ExamCountdownWidget } from '@/screens/shared';
import { useEvents, useEventRSVP } from '@/hooks';

// In your home screen
<ExamCountdownWidget onPress={() => navigate('Events')} />

// Using hooks
const { data: events, isLoading } = useEvents({
  types: [EventType.EXAM, EventType.ASSIGNMENT],
  status: [EventStatus.UPCOMING],
});

const { rsvp, submitRSVP } = useEventRSVP(eventId);

// RSVP to event
submitRSVP.mutate({ 
  status: RSVPStatus.ACCEPTED,
  note: 'Looking forward to it!'
});
```

## Features Checklist

- ✅ Calendar component with marked dates
- ✅ Event filtering by type
- ✅ Month/Week/Day view toggles (Month and Agenda implemented)
- ✅ Event detail modal
- ✅ RSVP functionality
- ✅ Device calendar sync
- ✅ Event reminders
- ✅ Countdown timers
- ✅ Academic year view
- ✅ Terms and holidays display
- ✅ Upcoming events timeline
- ✅ Event type color coding
- ✅ Multi-dot markers for multiple events
