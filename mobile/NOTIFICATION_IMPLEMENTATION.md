# Push Notifications Implementation Summary

## Overview
This document outlines the complete implementation of push notifications using Expo in the mobile app, including device registration, notification handling, deep linking, and preferences management.

## Installation

The following Expo packages have been installed:
```bash
npx expo install expo-notifications expo-device expo-constants
```

## Architecture

### Mobile App Components

#### 1. Notification Service (`/mobile/src/services/notificationService.ts`)
Core service handling all notification-related operations:
- **Permission Management**: Request and check notification permissions
- **Device Registration**: Register device with Expo push tokens
- **Topic Subscription**: Subscribe to notification topics (assignments, grades, attendance, announcements)
- **Notification Handlers**: Setup listeners for received and tapped notifications
- **Badge Management**: Update app icon badge count
- **Local Notifications**: Schedule and manage local notifications
- **Android Channels**: Configure notification channels for Android

Key Methods:
- `requestPermissions()`: Request notification permissions from user
- `registerForPushNotifications()`: Get Expo push token and configure channels
- `registerDeviceWithBackend()`: Register device token with backend
- `subscribeToTopics()`: Subscribe to specific notification topics
- `setupNotificationListeners()`: Setup foreground and background notification handlers
- `setBadgeCount()`: Update app icon badge
- `removeNotificationListeners()`: Cleanup listeners

#### 2. Notification Screens

**NotificationPreferencesScreen** (`/mobile/src/screens/shared/NotificationPreferencesScreen.tsx`)
- Toggle notification channels (push, email, SMS)
- Configure notification categories (assignments, grades, attendance, etc.)
- Real-time preference updates with backend sync
- Automatic topic subscription when preferences change

**NotificationHistoryScreen** (`/mobile/src/screens/shared/NotificationHistoryScreen.tsx`)
- Display all user notifications with pagination
- Mark notifications as read
- Delete notifications
- Deep linking to relevant screens when tapped
- Pull-to-refresh functionality
- Priority badges and category icons
- Action buttons for quick interactions

#### 3. UI Components

**NotificationPermissionModal** (`/mobile/src/components/shared/NotificationPermissionModal.tsx`)
- Educational modal explaining notification benefits
- Visual presentation of notification types
- Permission request flow
- Dismissible design

**NotificationBell** (`/mobile/src/components/shared/NotificationBell.tsx`)
- Header component showing notification count
- Red badge for unread notifications
- Navigates to notification history on tap
- Auto-updates when new notifications arrive

#### 4. Custom Hook

**useNotificationBadge** (`/mobile/src/hooks/useNotificationBadge.ts`)
- Manages unread notification count
- Auto-refreshes when app comes to foreground
- Syncs badge count with device
- Provides methods to decrement and reset count

#### 5. Navigation Integration

**RootNavigator Updates** (`/mobile/src/navigation/RootNavigator.tsx`)
- Initializes notifications on authentication
- Handles notification tap events
- Implements deep linking to screens
- Updates badge count on notification receipt
- Cleanup on logout

**Deep Linking Configuration** (`/mobile/src/navigation/linking.ts`)
- Routes for notification screens
- Deep link URL patterns
- Assignment/Grade/Attendance navigation

#### 6. Navigation Routes Added
- `NotificationHistory`: Display all notifications
- `NotificationPreferences`: Manage notification settings

### Backend Components

#### 1. API Endpoints (`/src/api/v1/notifications.py`)

**New Endpoints Added:**
- `POST /api/v1/notifications/register-device`: Register device for push notifications
  - Request: token, deviceType, deviceId, topics
  - Response: Device registration details
  
- `GET /api/v1/notifications/unread-count`: Get unread notification count
  - Response: { unread: number }

**Existing Endpoints:**
- `GET /api/v1/notifications`: Get user notifications with filtering
- `GET /api/v1/notifications/preferences/me`: Get notification preferences
- `PUT /api/v1/notifications/preferences/me`: Update notification preferences
- `PATCH /api/v1/notifications/{id}/read`: Mark notification as read
- `DELETE /api/v1/notifications/{id}`: Delete notification

#### 2. Database Models (`/src/models/notification.py`)

**New Model: PushDevice**
```python
class PushDevice(Base):
    id: int
    user_id: int
    token: str (Expo push token)
    device_type: str (ios/android)
    device_id: str (unique device identifier)
    topics: JSON (subscribed topics list)
    is_active: bool
    last_used_at: datetime
    created_at: datetime
    updated_at: datetime
```

#### 3. Schemas (`/src/schemas/notification.py`)

**New Schemas:**
- `DeviceRegistrationRequest`: Device registration input
- `DeviceRegistrationResponse`: Device registration output

#### 4. Service Methods (`/src/services/notification_service.py`)

**New Methods:**
- `register_device()`: Register or update device for push notifications
- `get_unread_count()`: Get count of unread notifications for user

#### 5. Database Migration (`/alembic/versions/add_push_devices_table.py`)
- Creates `push_devices` table
- Indexes for user_id, token, and is_active
- Foreign key to users table with cascade delete

## Configuration

### App Configuration (`/mobile/app.json`)
Added expo-notifications plugin:
```json
{
  "plugins": [
    ["expo-notifications", {
      "icon": "./assets/notification-icon.png",
      "color": "#2089dc",
      "sounds": [],
      "mode": "production"
    }]
  ]
}
```

### Notification Channels (Android)
- **Default**: Max importance, general notifications
- **Assignments**: High importance, blue color
- **Grades**: High importance, green color
- **Attendance**: Default importance, orange color
- **Announcements**: High importance, blue color

### Storage Keys (`/mobile/src/constants/index.ts`)
- `NOTIFICATION_PERMISSION_REQUESTED`: Track if permission was requested
- `PUSH_TOKEN`: Store device push token

## Features

### 1. Permission Management
- Graceful permission request flow
- Educational modal before requesting
- Fallback for permission denied
- Check permissions on app launch

### 2. Device Registration
- Automatic registration on login
- Token refresh handling
- Multiple device support per user
- Deactivation on logout

### 3. Topic Subscription
- Assignments notifications
- Grades notifications
- Attendance notifications
- Announcements notifications
- Granular control per category

### 4. Notification Handling

**Foreground Notifications:**
- Display alert banner
- Play sound
- Update badge count

**Background/Quit Notifications:**
- Deep link to relevant screen
- Update badge count
- Mark as read on tap

### 5. Deep Linking
Notification taps navigate to:
- Assignment details (for assignment notifications)
- Grades screen (for grade notifications)
- Attendance screen (for attendance notifications)
- Notification history (for general notifications)

### 6. Badge Management
- Real-time badge count updates
- Sync with backend on app open
- Decrement on notification read
- Clear all on mark all as read

### 7. Notification Preferences
- Toggle push notifications on/off
- Enable/disable email notifications
- Enable/disable SMS notifications
- Configure per-category preferences
- Auto-save with backend sync
- Topic subscription updates

### 8. Notification History
- Paginated list of all notifications
- Filter by read/unread status
- Priority indicators
- Category icons
- Timestamp display
- Swipe to delete
- Mark as read on tap
- Pull to refresh

## Integration Flow

1. **User Login**
   - RootNavigator calls `initializeNotifications()`
   - Service requests permissions
   - Gets Expo push token
   - Registers device with backend
   - Sets up notification listeners
   - Fetches and updates badge count

2. **Notification Received (Foreground)**
   - Listener captures notification
   - Updates badge count via API
   - Shows in-app alert

3. **Notification Received (Background)**
   - System shows notification
   - Badge count updated when app opens

4. **Notification Tapped**
   - Response listener captures tap
   - Extracts metadata (assignmentId, etc.)
   - Navigates to relevant screen
   - Marks notification as read

5. **Preference Update**
   - User toggles preference
   - Saves to backend
   - Updates topic subscriptions
   - Re-registers device with new topics

## Testing

### Test Scenarios
1. **Permission Flow**
   - First time user sees modal
   - Accept/Deny permissions
   - Settings redirect if denied

2. **Device Registration**
   - Register on login
   - Update on topic change
   - Multiple devices per user

3. **Notification Receipt**
   - Foreground notification display
   - Background notification handling
   - Badge count updates

4. **Deep Linking**
   - Tap assignment notification → AssignmentDetail
   - Tap grade notification → Grades
   - Tap attendance notification → Attendance

5. **Preferences**
   - Toggle channels
   - Toggle categories
   - Verify backend sync
   - Verify topic updates

6. **Badge Count**
   - Updates on new notification
   - Decrements on read
   - Syncs on app open
   - Clears on mark all read

## Security Considerations

1. **Token Storage**: Expo push tokens stored securely
2. **User Authorization**: All endpoints require authentication
3. **Device Validation**: Device ownership verified via user_id
4. **Topic Authorization**: Users can only subscribe to allowed topics
5. **Data Privacy**: Notification data encrypted in transit

## Performance Optimizations

1. **Batch Updates**: Badge count cached locally
2. **Efficient Queries**: Indexed database queries
3. **Pagination**: Notification history loaded in chunks
4. **Background Sync**: Minimal network calls
5. **Token Reuse**: Existing devices updated instead of creating duplicates

## Future Enhancements

1. **Rich Notifications**: Images, actions, custom layouts
2. **Notification Grouping**: Group related notifications
3. **Scheduled Notifications**: Local scheduling for reminders
4. **Custom Sounds**: Per-category notification sounds
5. **Quiet Hours**: Respect user quiet hours settings
6. **Analytics**: Track notification engagement metrics
7. **A/B Testing**: Test different notification strategies
8. **Multi-language**: Localized notification content

## Troubleshooting

### Common Issues

**Notifications not received:**
- Check device permissions
- Verify Expo push token is valid
- Ensure device is registered in backend
- Check network connectivity

**Badge count not updating:**
- Verify API endpoint is accessible
- Check notification listener is active
- Ensure app has notification permissions

**Deep linking not working:**
- Verify linking configuration
- Check navigation routes exist
- Ensure metadata is passed correctly

**Permission denied:**
- Guide user to Settings app
- Explain benefits of notifications
- Provide alternative notification methods

## Dependencies

### Mobile
- `expo-notifications`: ^0.27.0
- `expo-device`: ^6.0.0
- `expo-constants`: ^15.4.6

### Backend
- FastAPI notification service
- PostgreSQL for data storage
- Expo Push Notification service

## Documentation References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
