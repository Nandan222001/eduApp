# Communication Center Implementation

## Overview

The Communication Center is a comprehensive communication platform that enables announcements, messaging, and notification management within the educational institution. It provides role-based communication tools for teachers, students, parents, and administrators.

## Features Implemented

### 1. Announcement Composer
**Location:** `frontend/src/components/communications/AnnouncementComposer.tsx`

**Features:**
- Rich text editor for composing announcements
- Audience selector with options:
  - All users
  - Specific grades
  - Specific sections/classes
  - Specific roles
  - Individual users
- Priority levels (Low, Medium, High, Urgent)
- Multi-channel delivery (In-App, Email, SMS, Push)
- Draft and publish functionality
- Attachment support (structure ready)

**Usage:**
```tsx
import { AnnouncementComposer } from '@/components/communications';

<AnnouncementComposer
  open={open}
  onClose={handleClose}
  grades={grades}
  sections={sections}
/>
```

### 2. Announcement List
**Location:** `frontend/src/components/communications/AnnouncementList.tsx`

**Features:**
- View published announcements and drafts
- Tab-based filtering (Published, Drafts, All)
- Read/unread status indication
- Priority badges
- Audience and channel information
- Actions: Publish, Edit, Delete (for drafts)
- Relative timestamps

**Usage:**
```tsx
import { AnnouncementList } from '@/components/communications';

<AnnouncementList onCompose={() => setShowComposer(true)} />
```

### 3. Messaging Interface
**Location:** `frontend/src/components/communications/MessagingInterface.tsx`

**Features:**
- Conversation list with search
- Unread message badges
- Real-time message view
- Message bubbles (sent/received)
- In-line message composer
- Message threads support
- Attachment support (structure ready)

**Usage:**
```tsx
import { MessagingInterface } from '@/components/communications';

<MessagingInterface currentUserId={currentUser.id} />
```

### 4. Message Composer
**Location:** `frontend/src/components/communications/MessageComposer.tsx`

**Features:**
- Standalone message composer dialog
- Recipient autocomplete
- Subject and content fields
- Reply functionality
- Attachment support (structure ready)

**Usage:**
```tsx
import { MessageComposer } from '@/components/communications';

<MessageComposer
  open={open}
  onClose={handleClose}
  recipientId={recipientId}
  recipients={availableRecipients}
/>
```

### 5. Notification Center
**Location:** `frontend/src/components/communications/NotificationCenter.tsx`

**Features:**
- Grouped notifications by type:
  - Assignments
  - Attendance
  - Messages
  - Announcements
  - Exams
  - Grades
  - System
- Tab-based filtering
- Unread badge counts
- Priority indicators
- Mark as read (individual and bulk)
- Settings integration

**Usage:**
```tsx
import { NotificationCenter } from '@/components/communications';

<NotificationCenter onOpenPreferences={handleOpenPreferences} />
```

### 6. Notification Dropdown
**Location:** `frontend/src/components/communications/NotificationDropdown.tsx`

**Features:**
- Compact notification dropdown for header
- Recent notifications (limit 10)
- Quick actions (mark all read, settings)
- Navigation to full notification center
- Auto-refresh every 30 seconds
- Type-specific icons and colors

**Usage:**
```tsx
import { NotificationDropdown } from '@/components/communications';

// In your Header component
<NotificationDropdown onOpenPreferences={handleOpenPreferences} />
```

### 7. Notification Preferences
**Location:** `frontend/src/components/communications/NotificationPreferences.tsx`

**Features:**
- Channel preferences:
  - In-App notifications toggle
  - Email notifications toggle
  - SMS notifications toggle
  - Push notifications toggle
- Notification type preferences for each category
- Quiet hours configuration
- Detailed descriptions for each notification type

**Usage:**
```tsx
import { NotificationPreferences } from '@/components/communications';

<NotificationPreferences
  open={open}
  onClose={handleClose}
/>
```

### 8. Parent Communication View
**Location:** `frontend/src/components/communications/ParentCommunicationView.tsx`

**Features:**
- View teacher messages
- Reply to teacher messages
- View school announcements
- Teacher contact directory
- Quick message composition
- Student-specific filtering (structure ready)

**Usage:**
```tsx
import { ParentCommunicationView } from '@/components/communications';

<ParentCommunicationView
  studentId={studentId}
  teachers={studentTeachers}
/>
```

## Backend API Endpoints

### Announcements
- `POST /api/v1/announcements/` - Create announcement
- `GET /api/v1/announcements/` - List announcements (with filters)
- `GET /api/v1/announcements/my-announcements` - Get user's announcements
- `GET /api/v1/announcements/{id}` - Get specific announcement
- `PUT /api/v1/announcements/{id}` - Update announcement (drafts only)
- `DELETE /api/v1/announcements/{id}` - Delete announcement (drafts only)
- `POST /api/v1/announcements/{id}/publish` - Publish announcement

### Messages
- `POST /api/v1/messages/` - Send message
- `GET /api/v1/messages/inbox` - Get inbox messages
- `GET /api/v1/messages/sent` - Get sent messages
- `GET /api/v1/messages/unread-count` - Get unread count
- `GET /api/v1/messages/conversation/{user_id}` - Get conversation
- `GET /api/v1/messages/{id}` - Get specific message
- `GET /api/v1/messages/{id}/thread` - Get message thread
- `PATCH /api/v1/messages/{id}/read` - Mark message as read
- `POST /api/v1/messages/mark-all-read` - Mark all messages as read
- `DELETE /api/v1/messages/{id}` - Delete message
- `GET /api/v1/messages/search/` - Search messages

### Notifications
- `GET /api/v1/notifications/` - List notifications (with filters)
- `GET /api/v1/notifications/stats` - Get notification statistics
- `GET /api/v1/notifications/{id}` - Get specific notification
- `PATCH /api/v1/notifications/{id}/read` - Mark notification as read
- `POST /api/v1/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/v1/notifications/{id}` - Delete notification
- `GET /api/v1/notifications/preferences/me` - Get preferences
- `PUT /api/v1/notifications/preferences/me` - Update preferences
- `POST /api/v1/notifications/bulk` - Send bulk notifications

## Database Models

### Announcement
- Institution-scoped announcements
- Flexible audience targeting
- Multi-channel delivery
- Draft and publish workflow
- Priority levels
- Expiration support

### Message
- Direct user-to-user messaging
- Thread support (parent_id)
- Read/unread tracking
- Soft delete support
- Attachment support

### Notification
- User-specific notifications
- Type categorization
- Channel-specific delivery
- Priority levels
- Status tracking (pending, sent, failed, read)
- Custom data payload

### NotificationPreference
- Per-user channel preferences
- Per-type notification preferences
- Quiet hours configuration
- Automatic preference creation

## Page Components

### Communication Center
**Location:** `frontend/src/pages/CommunicationCenter.tsx`

Main communication hub with tabs for:
- Announcements
- Messages

### Teacher Communication Dashboard
**Location:** `frontend/src/pages/TeacherCommunicationDashboard.tsx`

Teacher-specific dashboard with:
- Create announcement button
- New message button
- Announcement management
- Message management

### Parent Communication Dashboard
**Location:** `frontend/src/pages/ParentCommunicationDashboard.tsx`

Parent-focused communication view with:
- Teacher messages
- School announcements
- Teacher contacts

## Integration Guide

### 1. Add to Navigation

```tsx
// In your navigation config
{
  path: '/communication-center',
  element: <CommunicationCenter />,
  title: 'Communication Center',
  icon: <MessageIcon />
}
```

### 2. Add Notification Dropdown to Header

```tsx
import { NotificationDropdown } from '@/components/communications';

// In your Header component
<AppBar>
  <Toolbar>
    {/* Other header items */}
    <NotificationDropdown onOpenPreferences={() => setPreferencesOpen(true)} />
  </Toolbar>
</AppBar>
```

### 3. Role-Based Views

```tsx
// For Teachers
<Route path="/communication" element={<TeacherCommunicationDashboard />} />

// For Parents
<Route path="/communication" element={<ParentCommunicationDashboard />} />

// For Admins/General
<Route path="/communication" element={<CommunicationCenter />} />
```

## API Client

**Location:** `frontend/src/api/communications.ts`

All API methods are centralized in the `communicationsApi` object:

```tsx
import { communicationsApi } from '@/api/communications';

// Example: Create announcement
const announcement = await communicationsApi.createAnnouncement(data);

// Example: Send message
const message = await communicationsApi.sendMessage(data);

// Example: Get notifications
const notifications = await communicationsApi.getNotifications();
```

## Types

**Location:** `frontend/src/types/communications.ts`

Comprehensive TypeScript types for:
- Announcement
- AnnouncementCreate
- AnnouncementUpdate
- Message
- MessageCreate
- Notification
- NotificationPreference
- NotificationStats
- NotificationGroup

## Services (Backend)

### AnnouncementService
**Location:** `src/services/announcement_service.py`

Features:
- CRUD operations
- Audience filtering and targeting
- Broadcast notifications to target users
- Permission checks

### MessagingService
**Location:** `src/services/messaging_service.py`

Features:
- Send/receive messages
- Conversation management
- Thread support
- Search functionality
- Unread count tracking

### NotificationService
**Location:** `src/services/notification_service.py`

Features:
- Create notifications
- Multi-channel delivery
- Preference checking
- Quiet hours respect
- Template support
- Statistics

## Database Migration

**Location:** `alembic/versions/create_notification_tables.py`

Tables created:
- `notifications`
- `notification_preferences`
- `announcements`
- `messages`
- `notification_templates`

All tables include proper indexes for performance.

## Best Practices

### 1. Always Use React Query

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['messages', 'inbox'],
  queryFn: () => communicationsApi.getInbox(),
});
```

### 2. Invalidate Queries After Mutations

```tsx
const mutation = useMutation({
  mutationFn: communicationsApi.sendMessage,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  },
});
```

### 3. Handle Loading and Error States

```tsx
if (isLoading) return <CircularProgress />;
if (error) return <Alert severity="error">Error loading data</Alert>;
```

### 4. Use Type-Safe Props

```tsx
import type { Announcement } from '@/types/communications';

interface Props {
  announcement: Announcement;
}
```

## Notification Types

The system supports the following notification types:
- `assignment` - Assignment-related notifications
- `attendance` - Attendance updates and alerts
- `message` - Direct message notifications
- `announcement` - Announcement notifications
- `exam` - Exam-related notifications
- `grade` - Grade and result notifications
- `system` - System and administrative notifications

## Channel Support

- `in_app` - In-application notifications (always available)
- `email` - Email notifications (requires user email)
- `sms` - SMS notifications (requires user phone)
- `push` - Push notifications (requires push token)

## Future Enhancements

1. **File Attachments**: Full implementation of file uploads for messages and announcements
2. **Rich Text Editor**: Enhanced WYSIWYG editor with formatting options
3. **Read Receipts**: Track when messages are read
4. **Typing Indicators**: Real-time typing status in conversations
5. **WebSocket Integration**: Real-time message delivery
6. **Emoji Support**: Reactions and emoji in messages
7. **Message Pinning**: Pin important messages
8. **Schedule Announcements**: Advanced scheduling with recurring options
9. **Analytics**: Communication engagement metrics
10. **Templates**: Pre-defined message and announcement templates

## Testing

Ensure to test:
1. Creating and publishing announcements with different audiences
2. Sending messages between users
3. Notification preferences affecting delivery
4. Read/unread status updates
5. Conversation threading
6. Search functionality
7. Filter and sorting
8. Permission boundaries

## Performance Considerations

1. **Pagination**: All lists use pagination (default limit: 50)
2. **Auto-refresh**: Notifications refresh every 30 seconds
3. **Query Caching**: React Query caches responses
4. **Indexes**: Database indexes on frequently queried fields
5. **Lazy Loading**: Components load data only when needed

## Security

1. **Institution Scoping**: All data is scoped to institution
2. **Permission Checks**: Backend validates user permissions
3. **XSS Protection**: Content is sanitized
4. **CSRF Protection**: CSRF tokens on mutations
5. **Rate Limiting**: API endpoints have rate limits (configured in backend)

## Troubleshooting

### Messages not appearing
- Check user is in same institution
- Verify user is active
- Check soft delete flags

### Notifications not delivered
- Check notification preferences
- Verify quiet hours settings
- Check channel availability (email, phone, etc.)
- Review notification service logs

### Announcements not reaching users
- Verify audience filter settings
- Check if announcement is published
- Verify users match audience criteria
- Check expiration date

## Support

For issues or questions:
1. Check the implementation files
2. Review API documentation
3. Examine backend service logic
4. Check database constraints and indexes
