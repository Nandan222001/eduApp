# Profile & Settings Screens - Quick Start

## Files Created

```
mobile/
├── src/
│   ├── api/
│   │   └── profile.ts                           # Profile API wrapper
│   ├── screens/
│   │   ├── student/
│   │   │   └── ProfileScreen.tsx               # Student profile screen
│   │   └── shared/
│   │       ├── SettingsScreen.tsx              # Settings screen (shared)
│   │       └── index.ts                        # Shared screens exports
└── PROFILE_SETTINGS_IMPLEMENTATION.md          # Full documentation
```

## Installation

Already completed during implementation:
```bash
npx expo install expo-image-picker
npm install react-native-image-crop-picker --legacy-peer-deps
npx expo install expo-constants
```

## API Endpoints Required

Your backend must implement these endpoints:

### Profile
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update profile
- `POST /api/v1/profile/photo` - Upload profile photo

### Authentication
- `POST /api/v1/auth/change-password` - Change password

### Notifications
- `GET /api/v1/notifications/preferences` - Get notification preferences
- `PUT /api/v1/notifications/preferences` - Update notification preferences

## Usage in Navigation

### Student Profile Screen
```typescript
import { StudentProfileScreen } from '@screens';

// In your navigation stack
<Tab.Screen 
  name="Profile" 
  component={StudentProfileScreen} 
/>
```

### Settings Screen
```typescript
import { SettingsScreen } from '@screens';

// In your navigation stack
<Stack.Screen 
  name="Settings" 
  component={SettingsScreen} 
/>
```

## Key Features

### ProfileScreen
- ✅ View and edit profile information
- ✅ Upload profile photo with cropping
- ✅ Change password
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling

### SettingsScreen
- ✅ Notification preferences (6 types)
- ✅ Theme selection (Light/Dark/Auto)
- ✅ Language selection (4 languages)
- ✅ Privacy policy & terms links
- ✅ Help & support links
- ✅ App version display
- ✅ Logout functionality

## Permissions

The app requires camera and photo library permissions:
- Configured in `app.json` under plugins
- Requested at runtime when user tries to upload photo
- Graceful handling if permissions denied

## State Management

- **React Query** for server state (profile data, preferences)
- **Redux** for auth state (logout)
- **AsyncStorage** for local preferences (theme, language)

## Customization

### Theme Options
Edit in `SettingsScreen.tsx`:
```typescript
const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
];
```

### Language Options
Edit in `SettingsScreen.tsx`:
```typescript
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];
```

### Notification Types
Edit in `SettingsScreen.tsx` to add/remove notification types:
```typescript
interface NotificationPreferences {
  assignments: boolean;
  grades: boolean;
  attendance: boolean;
  announcements: boolean;
  messages: boolean;
  reminders: boolean;
  // Add more types here
}
```

## Testing

### Manual Testing Checklist

Profile Screen:
- [ ] View profile information
- [ ] Edit profile fields
- [ ] Upload profile photo (camera)
- [ ] Upload profile photo (library)
- [ ] Change password with validation
- [ ] Cancel edit operations
- [ ] Test error handling

Settings Screen:
- [ ] Toggle notification preferences
- [ ] Change theme
- [ ] Change language
- [ ] Open privacy policy
- [ ] Open terms of service
- [ ] Open help center
- [ ] Contact support
- [ ] View app version
- [ ] Logout

## Troubleshooting

### Image Picker Not Working
- Ensure permissions are granted
- Check `app.json` has expo-image-picker plugin
- Rebuild the app after adding plugin
- The app has fallback to expo-image-picker if crop picker fails

### API Errors
- Check API_URL in `.env` file
- Verify backend endpoints are implemented
- Check authentication token is valid
- Review network logs

### Settings Not Persisting
- Check AsyncStorage permissions
- Verify storage keys in `constants/index.ts`
- Clear app data and retry

## Next Steps

1. Configure your backend to handle profile photo uploads
2. Implement notification preferences in your backend
3. Test the screens in your app
4. Customize theme and language options as needed
5. Add additional profile fields if required

## Support

For issues or questions:
1. Check the full implementation doc: `PROFILE_SETTINGS_IMPLEMENTATION.md`
2. Review the backend API requirements
3. Check console logs for errors
4. Verify all dependencies are installed
