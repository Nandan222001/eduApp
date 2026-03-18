# Push Notification Device Registration Implementation

## Overview
This implementation adds comprehensive backend support for push notification device registration with Expo Push Notifications integration.

## Components Implemented

### 1. Database Model (`src/models/notification.py`)
- **NotificationDevice** model added with fields:
  - `user_id`: Foreign key to users table
  - `role`: User role (from role relationship)
  - `device_token`: Expo Push Token (unique, indexed)
  - `device_type`: Device type (ios/android)
  - `platform`: Platform (ios/android)
  - `device_info`: JSON field for additional device information
  - `app_version`: Application version string
  - `is_active`: Boolean flag for device activation status
  - `last_used_at`: Timestamp for last device usage
  - `created_at`, `updated_at`: Audit timestamps

### 2. Database Migration (`alembic/versions/add_notification_devices_table.py`)
- Migration file created for NotificationDevice table
- Includes all necessary indexes:
  - `idx_notification_device_user` on user_id
  - `idx_notification_device_token` on device_token
  - `idx_notification_device_active` on is_active
  - `idx_notification_device_user_active` composite on (user_id, is_active)

### 3. Pydantic Schemas (`src/schemas/notification.py`)
Added three new schemas:
- **NotificationDeviceRegistrationRequest**
  - device_token (required, max 500 chars)
  - device_type (required, ios/android pattern validation)
  - platform (required, ios/android pattern validation)
  - device_info (optional JSON)
  - app_version (optional, max 50 chars)

- **NotificationDeviceResponse**
  - Complete device information response
  - Includes all model fields

- **NotificationDeviceUpdateRequest**
  - device_info (optional)
  - app_version (optional)
  - is_active (optional)

### 4. Service Layer (`src/services/notification_service.py`)
Added comprehensive device management methods:

- **register_notification_device()**: Register new device or update existing
  - Handles duplicate token detection
  - Automatically activates and updates timestamp

- **get_user_devices()**: List all user devices
  - Optional filtering by active status
  - Ordered by last_used_at

- **get_device_by_id()**: Get specific device by ID
  - User validation included

- **update_device()**: Update device information
  - Supports partial updates

- **revoke_device()**: Deactivate device by ID
  - Soft delete approach

- **revoke_device_by_token()**: Deactivate device by token
  - For remote logout scenarios

- **deactivate_user_devices()**: Deactivate all user devices
  - Useful for logout from all devices

- **get_active_device_tokens()**: Get all active tokens for user
  - For sending notifications to all devices

### 5. API Endpoints (`src/api/v1/notifications.py`)
Added 7 new endpoints:

#### POST `/api/v1/notifications/register-device`
- Register a new device for push notifications
- Accepts: NotificationDeviceRegistrationRequest
- Returns: NotificationDeviceResponse
- Automatically captures user_id and role from JWT

#### GET `/api/v1/notifications/devices`
- List all registered devices for current user
- Query param: active_only (default: true)
- Returns: List[NotificationDeviceResponse]

#### GET `/api/v1/notifications/devices/{device_id}`
- Get specific device details
- Returns: NotificationDeviceResponse

#### PATCH `/api/v1/notifications/devices/{device_id}`
- Update device information
- Accepts: NotificationDeviceUpdateRequest
- Returns: NotificationDeviceResponse

#### DELETE `/api/v1/notifications/devices/{device_id}`
- Revoke (deactivate) a specific device
- Returns: Success message

#### POST `/api/v1/notifications/devices/revoke-by-token`
- Revoke device by token
- Body param: device_token
- Returns: Success message

#### POST `/api/v1/notifications/devices/logout`
- Deactivate all devices (logout from all devices)
- Returns: Success message with count

### 6. Expo Push Notification Support (`src/services/notification_providers.py`)

#### ExpoPushProvider Class
- **send()**: Send single push notification
  - Validates Expo Push Token format
  - Handles Expo API response
  - Returns success/failure status

- **send_bulk()**: Send batch notifications
  - Optimized for multiple devices
  - Returns batch results

#### Provider Factory Update
- Updated to use Expo by default for push channel
- Configurable via `use_expo_push` setting
- Falls back to FCM if configured

### 7. Background Tasks (`src/tasks/notification_tasks.py`)
Added 2 new Celery tasks:

#### send_expo_push_notification(user_id, title, message, data)
- Sends push notification to all active user devices
- Uses Expo bulk send API
- Updates device last_used_at timestamp
- Returns device count and result

#### send_bulk_expo_push(user_ids, title, message, data)
- Sends push notification to multiple users
- Collects all active devices
- Uses Expo bulk API for efficiency
- Returns users count, devices count, and results

### 8. Service Integration
Updated existing notification service:
- **_get_recipient()** method updated to fetch device tokens from NotificationDevice
- Automatically uses first active device for push notifications
- Seamless integration with existing notification workflow

## Usage Examples

### 1. Register a Device
```python
POST /api/v1/notifications/register-device
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "device_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "ios",
  "platform": "ios",
  "device_info": {
    "model": "iPhone 14 Pro",
    "os_version": "17.0",
    "app_build": "1.0.0"
  },
  "app_version": "1.0.0"
}
```

### 2. List User Devices
```python
GET /api/v1/notifications/devices?active_only=true
Authorization: Bearer <jwt_token>
```

### 3. Send Push Notification (via Task)
```python
from src.tasks.notification_tasks import send_expo_push_notification

send_expo_push_notification.delay(
    user_id=123,
    title="New Assignment",
    message="You have a new assignment in Math",
    data={"assignment_id": 456, "type": "assignment"}
)
```

### 4. Logout from All Devices
```python
POST /api/v1/notifications/devices/logout
Authorization: Bearer <jwt_token>
```

## Database Schema

```sql
CREATE TABLE notification_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    device_info JSONB,
    app_version VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_device_user ON notification_devices(user_id);
CREATE INDEX idx_notification_device_token ON notification_devices(device_token);
CREATE INDEX idx_notification_device_active ON notification_devices(is_active);
CREATE INDEX idx_notification_device_user_active ON notification_devices(user_id, is_active);
```

## Migration

To apply the migration:
```bash
alembic upgrade head
```

## Features

### Duplicate Token Handling
- Automatically updates existing device when same token is registered
- Prevents duplicate token entries
- Transfers device to new user if needed

### Device Deactivation on Logout
- `/devices/logout` endpoint deactivates all user devices
- Individual device revocation supported
- Soft delete approach maintains audit trail

### Multi-Device Support
- Users can have multiple active devices
- Notifications sent to all active devices
- Bulk send optimization via Expo API

### Expo Push Token Validation
- Token format validation in schema
- Platform-specific validation (ios/android)
- Device info captured for debugging

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **User Isolation**: Users can only manage their own devices
3. **Token Privacy**: Device tokens never exposed in logs
4. **Soft Delete**: Devices deactivated, not deleted (audit trail)

## Performance Optimizations

1. **Database Indexes**: Optimized queries on user_id, token, and is_active
2. **Bulk Send API**: Uses Expo batch endpoint for multiple devices
3. **Active Filter**: Default filtering on active devices
4. **Timestamp Updates**: Tracks last usage for cleanup

## Testing Recommendations

1. Test device registration with valid Expo token
2. Test duplicate token handling
3. Test device deactivation
4. Test logout from all devices
5. Test push notification delivery
6. Test bulk notifications to multiple users
7. Verify database indexes are used in queries

## Future Enhancements

1. Add device expiration/cleanup task for stale devices
2. Add notification delivery receipts from Expo
3. Add device-specific notification preferences
4. Add push notification analytics per device
5. Add support for notification badges and sounds customization
