# Push Notifications Implementation Guide

This guide explains how the push notifications system is integrated using Expo Notifications.

## Overview

The notification system includes:

- **Expo Notifications** for push notification delivery
- **Expo Device** for device information
- Notification service for handling permissions, registration, and subscriptions
- Notification preferences screen for user customization
- Deep linking for notification taps
- Topic-based subscriptions (assignments, grades, attendance, announcements)
- Backend integration with Expo Push Notification service

## Architecture

### Mobile Components

#### 1. Notification Service (`src/services/notificationService.ts`)

Core service handling all notification operations:

- Permission requests
- Device registration with Expo Push Token
- Topic subscription management
- Notification preferences (local + backend sync)
- Badge count management
- Notification handlers

#### 2. Notification Hook (`src/hooks/useNotifications.ts`)

React hook for notification handling:

- Listens for foreground notifications
- Handles notification taps with deep linking
- Automatic device registration on user login
- Badge count updates

#### 3. Notification Preferences Screen (`src/screens/student/NotificationPreferencesScreen.tsx`)

UI for managing notification settings:

- Channel toggles (Push, Email, SMS, In-App)
- Topic subscriptions (Assignments, Grades, Attendance, Announcements)
- Quiet hours configuration
- Preferences sync with backend

#### 4. Notification Handler Component (`src/components/NotificationHandler.tsx`)

App-level component for notification lifecycle management.

### Backend Components

#### 1. Push Device Models (`src/models/push_device.py`)

- `PushDevice`: Stores device tokens and metadata
- `PushDeviceTopic`: Manages topic subscriptions per device

#### 2. Expo Push Service (`src/services/expo_push_service.py`)

Service for sending notifications via Expo:

- Single and bulk notification sending
- Token validation
- Deep linking support
- Error handling and token cleanup

#### 3. Notification Service Integration (`src/services/notification_service.py`)

Enhanced notification service with:

- Expo push notification support
- Topic-based notification sending
- Automatic device token cleanup for invalid tokens
- Channel mapping for Android notification channels

#### 4. API Endpoints (`src/api/v1/notifications.py`)

New endpoints:

- `POST /api/v1/notifications/register-device` - Register device for push
- `DELETE /api/v1/notifications/register-device/{token}` - Unregister device
- `POST /api/v1/notifications/subscribe` - Subscribe to topic
- `POST /api/v1/notifications/unsubscribe` - Unsubscribe from topic
- `GET /api/v1/notifications/devices` - Get user's registered devices

## Setup Instructions

### 1. Install Dependencies

#### Mobile

```bash
cd mobile
npm install
```

The following packages are included:

- `expo-notifications@~0.27.6`
- `expo-device@~5.9.3`
- `@react-native-community/datetimepicker@^7.6.2`

#### Backend

```bash
poetry add exponent-server-sdk
poetry install
```

### 2. Run Database Migration

```bash
alembic upgrade head
```

This creates the `push_devices` and `push_device_topics` tables.

### 3. Configure app.json

The `app.json` is already configured with notification settings:

- Android notification channels
- iOS notification display in foreground
- Notification icon and color

### 4. Add to Your App

Add the `NotificationHandler` to your root component:

```typescript
// App.tsx or _layout.tsx
import { NotificationHandler } from './src/components/NotificationHandler';

export default function RootLayout() {
  return (
    <>
      <NotificationHandler />
      {/* Your other components */}
    </>
  );
}
```

## Usage Examples

### Requesting Permissions and Registering Device

```typescript
import { registerDevice, requestNotificationPermissions } from '@/services/notificationService';

// Request permissions
const hasPermission = await requestNotificationPermissions();

// Register device (call after user login)
const success = await registerDevice(userId);
```

### Managing Topic Subscriptions

```typescript
import { subscribeToTopic, unsubscribeFromTopic } from '@/services/notificationService';

// Subscribe to assignments notifications
await subscribeToTopic('assignments');

// Unsubscribe from grades notifications
await unsubscribeFromTopic('grades');
```

### Handling Notification Taps

The `useNotifications` hook automatically handles notification taps and deep linking:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notification, isRegistered } = useNotifications(userId);

  // Notifications are automatically handled with deep linking
  // based on the 'screen' field in notification data
}
```

### Sending Push Notifications from Backend

```python
from src.services.notification_service import NotificationService
from src.database import get_db

db = next(get_db())
service = NotificationService(db)

# Send to specific user
notification = service.create_notification(
    institution_id=1,
    user_id=123,
    title="New Assignment",
    message="Math homework is due tomorrow",
    notification_type="assignment_created",
    channel="push",
    priority="high",
    notification_group="assignments",
    data={
        "screen": "Assignment",
        "id": 456,
    }
)

await service.send_notification(notification.id)

# Send to all users subscribed to a topic
result = service.send_push_notification_to_topic(
    topic="assignments",
    title="Class Cancelled",
    message="Today's math class has been cancelled",
    data={"screen": "Announcements"},
    institution_id=1,
)
```

## Notification Data Structure

Notifications should include data for deep linking:

```json
{
  "screen": "Assignment",
  "id": 123,
  "type": "assignments",
  "params": {
    "highlightSection": "details"
  }
}
```

### Supported Screens

- `Assignment` - Navigates to assignment detail
- `Grade` - Navigates to grade detail
- `Attendance` - Navigates to attendance screen
- `Announcement` - Navigates to announcement detail
- `Message` - Navigates to message thread
- `Event` - Navigates to event detail

## Android Notification Channels

The following channels are configured:

- `default` - Default notifications (MAX importance)
- `assignments` - Assignment notifications (HIGH importance)
- `grades` - Grade notifications (HIGH importance)
- `attendance` - Attendance notifications (DEFAULT importance)
- `announcements` - Announcement notifications (DEFAULT importance)

## Testing

### Test Notifications on Device

1. Use a physical device (push notifications don't work on simulators)
2. Grant notification permissions when prompted
3. Get your Expo Push Token:

```typescript
import { getExpoPushToken } from '@/services/notificationService';
const token = await getExpoPushToken();
console.log('Token:', token);
```

4. Test with Expo Push Notification Tool: https://expo.dev/notifications

### Test Backend Integration

```bash
# In Python shell or test script
from src.services.expo_push_service import ExpoPushService

service = ExpoPushService()
result = service.send_push_notification(
    tokens=["ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"],
    title="Test",
    body="This is a test notification",
    data={"screen": "Home"}
)
print(result)
```

## Notification Preferences

Users can customize:

- **Channels**: Toggle push, email, SMS, in-app notifications
- **Topics**: Subscribe/unsubscribe from specific notification types
- **Quiet Hours**: Set time periods to silence notifications
- **Priority Filter**: Only receive notifications above a certain priority

All preferences are synced with the backend and stored locally for offline access.

## Troubleshooting

### Push Notifications Not Received

1. Check device is registered:

```typescript
import { getExpoPushToken } from '@/services/notificationService';
const token = await getExpoPushToken();
console.log('Token:', token); // Should not be null
```

2. Verify permissions:

```typescript
import * as Notifications from 'expo-notifications';
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);
```

3. Check backend device registration:

```bash
# API call
GET /api/v1/notifications/devices
```

4. Verify notification preferences allow the notification type

### Deep Linking Not Working

1. Ensure notification data includes `screen` field
2. Check navigation structure matches screen names
3. Verify the navigation prop is available

### Badge Count Not Updating

Call `scheduleBadgeUpdate()` after marking notifications as read:

```typescript
import { scheduleBadgeUpdate } from '@/services/notificationService';
await scheduleBadgeUpdate();
```

## Security Considerations

- Tokens are stored securely using AsyncStorage
- Device tokens are validated before registration
- Invalid tokens are automatically cleaned up
- User preferences are validated on backend
- Push notifications respect user privacy settings

## Future Enhancements

Potential improvements:

- Rich notifications with images and actions
- Notification scheduling
- Local notifications for reminders
- Notification analytics and engagement tracking
- Custom notification sounds per topic
- Notification grouping and threading
