# Settings and Profile Management Implementation

## Overview
Comprehensive settings and profile management system with user customization, privacy controls, and account management features.

## Features Implemented

### 1. Profile Editor
- **Photo Upload and Crop**
  - Avatar upload with image validation (max 5MB)
  - Real-time photo cropping with zoom and rotation
  - Drag to reposition within circular crop area
  - Avatar deletion option
  
- **Personal Information Form**
  - First name and last name (required)
  - Email address (read-only)
  - Phone number with validation
  - Bio/description field (max 500 characters)
  - Character counter for bio field

### 2. Password Change
- **Security Features**
  - Current password verification
  - Password strength indicator (weak/medium/strong/very strong)
  - Real-time password requirements validation
  - Show/hide password toggles
  - Confirmation password matching
  
- **Password Requirements**
  - Minimum 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character

### 3. Notification Preferences Matrix
- **Notification Types**
  - Assignment created/graded
  - Exam scheduled/results published
  - Announcements posted
  - Messages received
  - Goals achieved
  - Badges earned
  - Attendance marked
  - Fee due reminders
  - Study materials shared
  - Doubts answered

- **Notification Channels**
  - Email notifications
  - Push notifications
  - SMS notifications
  - In-app notifications
  
- **Bulk Actions**
  - Enable/disable all notifications per channel
  - Individual notification type control

### 4. Theme Customization
- **Theme Modes**
  - Light mode
  - Dark mode
  - Auto (follows system preferences)
  
- **Display Options**
  - Font size (small/medium/large)
  - Compact mode toggle
  - Live preview of theme settings

### 5. Language Selector
- **Supported Languages**
  - English, Hindi, Spanish, French, German
  - Chinese, Japanese, Arabic, Portuguese, Russian
  - Display in native language names
  - Language code support for i18n

### 6. Timezone Configuration
- **Features**
  - Autocomplete timezone selector
  - Timezone offset display
  - Current time preview in selected timezone
  - Major timezone presets

### 7. Privacy Settings
- **Profile Visibility**
  - Public/private profile toggle
  - Leaderboard visibility control
  
- **Contact Information**
  - Show/hide email address
  - Show/hide phone number
  
- **Communication**
  - Allow/block direct messages
  - Show/hide online status

### 8. Connected Devices List
- **Device Management**
  - List all logged-in devices
  - Device type icons (laptop/mobile/tablet)
  - Browser and OS information
  - IP address and location
  - Last active timestamp
  - Current device indicator
  
- **Security Actions**
  - Logout individual devices
  - Logout all other devices
  - Confirmation dialogs for security

### 9. Account Deletion Request
- **Deletion Process**
  - Reason selection (required)
  - Additional feedback (optional)
  - Password confirmation
  - Double confirmation dialog
  
- **Deletion Timeline**
  - 7-day email confirmation period
  - 30-day grace period before permanent deletion
  - Cancellation option during grace period
  
- **Data Impact**
  - Clear warning about data loss
  - List of all data to be deleted
  - Process explanation

## Technical Implementation

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (MUI)
- **Form Management**: React Hook Form
- **State Management**: TanStack Query
- **Image Cropping**: react-avatar-editor
- **Routing**: React Router

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy 2.0
- **Authentication**: JWT with passlib
- **Validation**: Pydantic schemas

### Database Models
1. **UserSettings**
   - Theme preferences (mode, color, font size)
   - Localization (language, timezone)
   - Privacy settings
   - Notification preferences (JSON)

2. **UserDevice**
   - Device information tracking
   - Session management
   - Security monitoring

3. **AccountDeletionRequest**
   - Deletion workflow tracking
   - Confirmation tokens
   - Status management

## API Endpoints

### Settings
- `GET /api/settings` - Get all user settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/notifications` - Get notification preferences
- `PUT /api/settings/notifications` - Update notification preferences
- `GET /api/settings/theme` - Get theme settings
- `PUT /api/settings/theme` - Update theme settings
- `GET /api/settings/privacy` - Get privacy settings
- `PUT /api/settings/privacy` - Update privacy settings

### Profile
- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile/me` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `DELETE /api/profile/avatar` - Delete avatar
- `POST /api/profile/change-password` - Change password

### Devices
- `GET /api/settings/devices` - Get connected devices
- `POST /api/settings/devices/{device_id}/logout` - Logout device
- `POST /api/settings/devices/logout-all` - Logout all devices

### Account
- `POST /api/settings/delete-account` - Request account deletion
- `POST /api/settings/cancel-deletion` - Cancel deletion request

## File Structure

```
frontend/src/
├── components/settings/
│   ├── ProfileEditor.tsx
│   ├── PasswordChange.tsx
│   ├── NotificationPreferencesManager.tsx
│   ├── ThemeCustomization.tsx
│   ├── LanguageSelector.tsx
│   ├── TimezoneConfiguration.tsx
│   ├── PrivacySettings.tsx
│   ├── ConnectedDevicesList.tsx
│   ├── AccountDeletionForm.tsx
│   └── index.ts
├── pages/
│   └── SettingsPage.tsx
├── api/
│   └── settings.ts
└── types/
    └── settings.ts

src/
├── api/v1/
│   └── settings.py
├── models/
│   └── user_settings.py
├── schemas/
│   └── settings.py
└── alembic/versions/
    └── add_user_settings_tables.py
```

## Usage

### Accessing Settings
Users can access settings through:
- Main navigation menu → Settings
- User profile dropdown → Settings
- Direct URL: `/admin/settings`, `/teacher/settings`, `/student/settings`

### Navigation
Settings page uses tabbed interface:
1. Profile - Edit personal information
2. Password - Change password
3. Notifications - Configure notification preferences
4. Theme - Customize appearance
5. Language - Select interface language
6. Timezone - Set timezone
7. Privacy - Control visibility
8. Devices - Manage logged-in devices
9. Account - Request account deletion

## Security Features
- Password verification for sensitive operations
- Confirmation dialogs for destructive actions
- Session token validation for device management
- Secure password hashing with bcrypt
- CSRF protection via JWT
- XSS prevention through React's built-in escaping

## Validation
- Client-side validation with React Hook Form
- Server-side validation with Pydantic
- Phone number format validation
- Email format validation
- Password strength requirements
- File size and type validation for avatars

## Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management
- Semantic HTML structure

## Future Enhancements
1. Two-factor authentication settings
2. Export user data option
3. Activity log viewer
4. API key management
5. Third-party app connections
6. Custom notification sounds
7. Advanced privacy controls
8. Data retention policies
