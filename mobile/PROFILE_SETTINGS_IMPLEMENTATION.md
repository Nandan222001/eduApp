# Profile and Settings Implementation

This document describes the implementation of Student Profile and Settings screens for the EDU Mobile application.

## Overview

The implementation includes:
1. **Student Profile Screen** (`/mobile/src/screens/student/ProfileScreen.tsx`)
2. **Settings Screen** (`/mobile/src/screens/shared/SettingsScreen.tsx`)
3. **Profile API** (`/mobile/src/api/profile.ts`)

## Features

### Student Profile Screen

- **Profile Photo Management**
  - Display current profile photo or placeholder with initials
  - Upload new profile photo via camera or photo library
  - Image cropping with circular overlay (400x400px)
  - Automatic compression (80% quality)

- **Profile Information**
  - View and edit profile fields:
    - First Name
    - Last Name
    - Email
    - Phone
    - Date of Birth
  - Form validation
  - Real-time updates

- **Security**
  - Password change form
  - Current password verification
  - Password strength validation (minimum 8 characters)
  - Confirmation password matching

### Settings Screen

- **Notification Preferences**
  - Toggle switches for:
    - Assignments notifications
    - Grades notifications
    - Attendance notifications
    - Announcements
    - Messages
    - Reminders
  - Preferences saved to backend via `/api/v1/notifications/preferences`

- **Appearance**
  - Theme selector (Light/Dark/Auto)
  - Theme preference saved to local storage

- **Language**
  - Language selector (English/Spanish/French/German)
  - Language preference saved to local storage

- **Privacy & Legal**
  - Privacy Policy link
  - Terms of Service link

- **Help & Support**
  - Help Center link
  - Contact Support (opens email client)

- **About**
  - App version display
  - Build number display
  - Platform information

- **Logout**
  - Secure logout with confirmation dialog

## API Integration

### Profile API (`/mobile/src/api/profile.ts`)

#### Methods

1. **getProfile()**
   - Endpoint: `GET /api/v1/profile`
   - Returns: User profile data

2. **updateProfile(data)**
   - Endpoint: `PUT /api/v1/profile`
   - Body: Profile update data (firstName, lastName, email, phone, dateOfBirth)
   - Returns: Updated profile data

3. **uploadProfilePhoto(photoUri)**
   - Endpoint: `POST /api/v1/profile/photo`
   - Body: FormData with photo file
   - Content-Type: multipart/form-data
   - Returns: { profilePhoto: string }

4. **changePassword(data)**
   - Endpoint: `POST /api/v1/auth/change-password`
   - Body: { current_password, new_password, confirm_password }
   - Returns: Success response

### Notification Preferences API

- **Get Preferences**: `GET /api/v1/notifications/preferences`
- **Update Preferences**: `PUT /api/v1/notifications/preferences`

## Dependencies

### New Packages Installed

```bash
# Image picker with Expo
npx expo install expo-image-picker

# Image cropping
npm install react-native-image-crop-picker --legacy-peer-deps

# Constants (already installed)
npx expo install expo-constants
```

### Configuration

Added to `mobile/app.json`:
```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow EDU Mobile to access your photos to upload profile pictures.",
        "cameraPermission": "Allow EDU Mobile to access your camera to take profile pictures."
      }
    ]
  ]
}
```

## Usage

### Profile Screen

The Profile Screen is part of the Student Tab navigation:
- Accessible from the bottom tab bar
- Shows user profile information
- Allows editing profile fields
- Supports profile photo upload
- Provides password change functionality

### Settings Screen

The Settings Screen is a shared screen:
- Can be accessed by any user role
- Manages app-wide preferences
- Provides logout functionality

## State Management

- Uses React Query for data fetching and caching
- Uses Redux for auth state management (logout)
- Uses AsyncStorage for local preferences (theme, language)

## Error Handling

- Form validation with inline error messages
- API error handling with user-friendly alerts
- Permission handling for camera and photo library
- Graceful fallback for failed operations

## Styling

- Follows existing design system
- Uses constants from `@constants` (COLORS, SPACING, BORDER_RADIUS, FONT_SIZES)
- Consistent with other screens in the app
- Responsive design for different screen sizes

## Security Considerations

- Profile photos uploaded via secure API
- Passwords never stored locally
- Current password verification required for password change
- Secure token-based authentication
- HTTPS communication with backend

## Future Enhancements

- [ ] Two-factor authentication toggle
- [ ] Biometric authentication for profile changes
- [ ] Profile photo gallery/history
- [ ] Advanced notification scheduling
- [ ] Data export functionality
- [ ] Account deletion option
- [ ] Profile completion percentage
- [ ] Social media integrations
