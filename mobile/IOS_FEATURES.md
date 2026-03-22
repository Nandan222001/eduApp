# iOS-Specific Features Implementation Guide

## Overview

This document describes all iOS-specific features implemented in the EduTrack mobile app and how they integrate with the React Native/Expo codebase.

## 1. Secure Storage (Keychain)

### Implementation
- **File**: `src/utils/secureStorage.ts`
- **Package**: `expo-secure-store`
- **iOS Backend**: iOS Keychain Services

### Usage

```typescript
import { secureStorage } from '@utils/secureStorage';

// Store tokens securely
await secureStorage.setAccessToken(token);
await secureStorage.setRefreshToken(refreshToken);

// Retrieve tokens
const accessToken = await secureStorage.getAccessToken();
const refreshToken = await secureStorage.getRefreshToken();

// Clear all secure data
await secureStorage.clearAll();
```

### iOS-Specific Behavior
- Data is encrypted and stored in iOS Keychain
- Survives app uninstall (configurable)
- Only accessible when device is unlocked
- Protected by iOS security model

### Configuration
```json
// app.json
{
  "plugins": ["expo-secure-store"]
}
```

## 2. Biometric Authentication (Face ID / Touch ID)

### Implementation
- **File**: `src/utils/biometric.ts`
- **Config**: `src/config/ios.ts`
- **Package**: `expo-local-authentication`

### Usage

```typescript
import { biometricUtils } from '@utils/biometric';

// Check if biometric auth is available
const isAvailable = await biometricUtils.isAvailable();

// Get biometric type (Face ID, Touch ID, etc.)
const type = await biometricUtils.getBiometricType();

// Authenticate user
const result = await biometricUtils.authenticate({
  promptMessage: 'Authenticate to login',
  cancelLabel: 'Cancel',
});

if (result.success) {
  // Authentication successful
}
```

### iOS-Specific Behavior
- Automatically detects Face ID or Touch ID
- Falls back to device passcode if biometric fails
- Respects iOS system settings
- Shows native iOS authentication UI

### Required Permission
```json
// app.json - ios.infoPlist
{
  "NSFaceIDUsageDescription": "Allow EduTrack to use Face ID for secure authentication"
}
```

### Features
- Login with biometrics
- Enable/disable biometric login in settings
- Secure credential storage
- Fallback authentication methods

## 3. Path Aliases

### Configuration

Path aliases are configured in three places for complete resolution:

#### TypeScript (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@store": ["src/store"],
      "@store/*": ["src/store/*"],
      "@components": ["src/components"],
      "@components/*": ["src/components/*"],
      "@utils": ["src/utils"],
      "@utils/*": ["src/utils/*"],
      "@config": ["src/config"],
      "@config/*": ["src/config/*"],
      // ... more aliases
    }
  }
}
```

#### Babel (`babel.config.js`)
```javascript
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@store': './src/store',
          '@components': './src/components',
          '@utils': './src/utils',
          '@config': './src/config',
          // ... more aliases
        },
      },
    ],
  ],
};
```

#### Metro Bundler (`metro.config.js`)
```javascript
config.resolver = {
  extraNodeModules: {
    '@store': path.resolve(__dirname, 'src/store'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@config': path.resolve(__dirname, 'src/config'),
    // ... more aliases
  },
};
```

### Usage

```typescript
// Instead of relative imports
import { store } from '../../../store';
import { Button } from '../../components/Button';

// Use path aliases
import { store } from '@store';
import { Button } from '@components/Button';
```

## 4. Navigation with Expo Router

### Implementation
- **Directory**: `app/`
- **Package**: `expo-router`
- **Type**: File-based routing

### Structure

```
app/
├── _layout.tsx              # Root layout
├── index.tsx                # Entry point
├── (auth)/                  # Auth stack
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── ...
└── (tabs)/                  # Tab navigation
    ├── _layout.tsx
    ├── student/             # Student tabs
    │   ├── _layout.tsx
    │   ├── index.tsx        # Dashboard
    │   ├── assignments.tsx
    │   └── ...
    └── parent/              # Parent tabs
        └── ...
```

### Navigation

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to route
router.push('/(auth)/login');
router.replace('/(tabs)/student');
router.back();

// Deep linking
router.push('/assignments/123');
```

### iOS-Specific Features
- Native iOS transitions
- Swipe-back gesture support
- Tab bar with iOS styling
- Modal presentations
- Deep linking support

## 5. Background Sync

### Implementation
- **File**: `src/utils/backgroundSync.ts`
- **Package**: `expo-background-fetch`, `expo-task-manager`

### iOS Configuration
```json
// app.json - ios.infoPlist
{
  "UIBackgroundModes": ["fetch", "remote-notification"]
}
```

### Features
- Sync data in background
- Fetch interval: 15 minutes minimum (iOS limitation)
- Automatically handles app lifecycle
- Respects iOS background restrictions

## 6. Push Notifications

### Implementation
- **File**: `src/utils/notificationService.ts`
- **Package**: `expo-notifications`

### iOS-Specific Setup
```typescript
import { notificationService } from '@utils/notificationService';

// Request permission
const granted = await notificationService.requestPermission();

// Schedule local notification
await notificationService.scheduleNotification({
  title: 'Assignment Due',
  body: 'Math homework due in 1 hour',
  data: { assignmentId: 123 },
});
```

### Features
- Local notifications
- Push notifications (requires APNs setup)
- Badge count management
- Sound and vibration
- Notification categories

## 7. Deep Linking

### Configuration
```json
// app.json
{
  "ios": {
    "associatedDomains": ["applinks:edutrack.app"],
    "bundleIdentifier": "com.edutrack.app"
  },
  "scheme": "edutrack"
}
```

### Supported Links
- `edutrack://` - App scheme
- `https://edutrack.app/*` - Universal links

### Usage
```typescript
import * as Linking from 'expo-linking';

// Get initial URL
const url = await Linking.getInitialURL();

// Listen for incoming links
Linking.addEventListener('url', (event) => {
  const { url } = event;
  // Handle URL
});
```

## 8. Camera & Photo Library

### Permissions
```json
// app.json - ios.infoPlist
{
  "NSCameraUsageDescription": "Allow EduTrack to use your camera to scan homework and QR codes",
  "NSPhotoLibraryUsageDescription": "Allow EduTrack to access your photo library to upload assignments"
}
```

### Usage
```typescript
import { cameraUtils } from '@utils/camera';

// Take photo
const photo = await cameraUtils.takePicture();

// Pick from library
const image = await cameraUtils.pickImage();
```

## 9. Offline Support

### Implementation
- **File**: `src/utils/offlineQueue.ts`
- **Storage**: AsyncStorage + SecureStore

### Features
- Queue failed requests
- Auto-retry when online
- Cached data display
- Optimistic updates

### iOS-Specific
- Uses iOS-optimized storage
- Respects storage quotas
- Handles app backgrounding

## 10. Performance Optimizations

### Hermes JavaScript Engine
- Enabled by default in Expo 50
- Faster startup time
- Lower memory usage
- Better performance on iOS

### Fast Refresh
- Hot reloading for development
- Preserves component state
- Instant feedback

### Native Modules
All Expo modules use native iOS code for best performance:
- SecureStore → Keychain
- LocalAuthentication → LocalAuthentication framework
- Notifications → UNUserNotificationCenter
- BackgroundFetch → BGTaskScheduler

## Testing on iOS

### Simulator
```bash
npx expo start --ios
```

### Physical Device
```bash
npx expo start --tunnel
# Scan QR code with Expo Go app
```

### Production Build
```bash
eas build --profile production --platform ios
```

## Troubleshooting

### Common Issues

1. **Path aliases not working**
   - Clear Metro cache: `npx expo start --clear`
   - Restart TypeScript server in VS Code

2. **Biometric auth not working**
   - Check device has biometric enrolled
   - Test on physical device (simulator limited)
   - Verify Info.plist permission

3. **Secure storage errors**
   - Requires native build or Expo Go
   - Check iOS version ≥ 13.4

4. **Navigation issues**
   - Check file-based routing structure
   - Verify _layout.tsx files exist
   - Clear Expo router cache

## Best Practices

1. **Always use path aliases** for cleaner imports
2. **Test biometric on physical devices** for accurate results
3. **Handle permission denials** gracefully
4. **Use TypeScript** for better type safety
5. **Follow iOS Human Interface Guidelines** for UI/UX
6. **Test on multiple iOS versions** if possible
7. **Use development builds** for testing native features

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native iOS Guide](https://reactnative.dev/docs/running-on-device)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [expo-secure-store API](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [expo-local-authentication API](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
