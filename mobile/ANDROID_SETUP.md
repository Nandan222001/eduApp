# Android Platform Setup Guide

This guide provides comprehensive instructions for setting up and testing the EduTrack mobile application on Android.

## Prerequisites

- Node.js 18+ and npm
- Android Studio with Android SDK
- Android device or emulator (API level 21+)
- Expo CLI (`npm install -g expo-cli`)

## Quick Start

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start the Android app
npx expo start --android
```

## Android-Specific Features

### 1. Biometric Authentication

The app supports fingerprint and face unlock on compatible Android devices:

- **Minimum API Level**: 23 (Android 6.0)
- **Implementation**: Uses `expo-local-authentication`
- **Configuration**: Configured in `src/utils/biometric.ts`
- **Permissions**: Automatically handled by Expo

**Testing Biometric Auth:**
```bash
# On emulator, set up fingerprint in Settings > Security
# Then use the emulator controls to simulate fingerprint
```

### 2. Secure Storage

Uses Android's EncryptedSharedPreferences for secure data storage:

- **Implementation**: `src/utils/secureStorage.ts`
- **Storage Location**: `/data/data/com.edutrack.app/shared_prefs/`
- **Encryption**: AES256-GCM for values, SHA256 for keys

**Key Features:**
- Automatic encryption/decryption
- Secure token storage
- Biometric credentials storage

### 3. Redux Persist with AsyncStorage

State persistence using `@react-native-async-storage/async-storage`:

- **Configuration**: `src/store/index.ts`
- **Persisted Data**: Auth state, user data, offline queue
- **Whitelist**: Configured in store setup

**Storage Keys:**
```typescript
{
  auth: 'Authentication state',
  studentData: 'Student profile, assignments, grades',
  offline: 'Offline queue and sync state'
}
```

### 4. Network Connectivity Detection

Real-time network monitoring with `@react-native-community/netinfo`:

- **Implementation**: `src/utils/offlineInit.ts`
- **Features**:
  - Online/offline status detection
  - Connection type detection (WiFi, Cellular, etc.)
  - Internet reachability check
  - Automatic queue processing on reconnect

**Example Usage:**
```typescript
import NetInfo from '@react-native-community/netinfo';

// Subscribe to network state
const unsubscribe = NetInfo.addEventListener(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);
  console.log('Is internet reachable?', state.isInternetReachable);
});
```

### 5. Offline Queue Functionality

Automatic request queuing when offline:

- **Implementation**: `src/utils/offlineQueue.ts`
- **Storage**: AsyncStorage
- **Features**:
  - Automatic queuing of failed requests
  - Retry mechanism with exponential backoff
  - Auto-processing on reconnect
  - Manual queue management

**Queue Operations:**
```typescript
// Add to queue
await offlineQueueManager.addToQueue({
  url: '/api/assignments',
  method: 'POST',
  data: assignmentData
});

// Process queue
await offlineQueueManager.processQueue();

// Clear queue
await offlineQueueManager.clearQueue();
```

### 6. Background Sync

Background data synchronization using `expo-background-fetch`:

- **Interval**: 15 minutes (minimum)
- **Implementation**: `src/utils/backgroundSync.ts`
- **Features**:
  - Automatic queue processing
  - Data refresh when app is backgrounded
  - Battery-efficient scheduling

## Android Configuration

### app.json Configuration

```json
{
  "expo": {
    "android": {
      "package": "com.edutrack.app",
      "permissions": [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### Deep Linking

Configured for universal links and app links:

```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "edutrack.app",
            "pathPrefix": "/"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

## Testing on Android

### Using Android Emulator

1. **Start Android Studio**
2. **Open AVD Manager** (Tools > AVD Manager)
3. **Create/Start an Emulator** (Recommended: Pixel 5, API 30+)
4. **Run the app**:
   ```bash
   cd mobile
   npx expo start --android
   ```

### Using Physical Device

1. **Enable Developer Options** on your Android device:
   - Go to Settings > About phone
   - Tap "Build number" 7 times
   
2. **Enable USB Debugging**:
   - Go to Settings > Developer options
   - Enable "USB debugging"

3. **Connect device via USB**

4. **Run the app**:
   ```bash
   cd mobile
   npx expo start --android
   ```

### Testing Checklist

Run through this checklist to verify all features:

#### ✅ App Launch
- [ ] App launches without errors
- [ ] Splash screen displays correctly
- [ ] Navigation initializes properly

#### ✅ Authentication
- [ ] Login screen loads
- [ ] Can log in with credentials
- [ ] Biometric prompt appears (if enabled)
- [ ] Tokens stored in SecureStore
- [ ] Session persists after app restart

#### ✅ Redux Persist
- [ ] State persists across app restarts
- [ ] Auth state restored correctly
- [ ] User data cached properly
- [ ] Offline queue persisted

#### ✅ Network Connectivity
- [ ] Online status detected correctly
- [ ] Offline indicator shows when disconnected
- [ ] Auto-reconnect works
- [ ] Queue processes on reconnect

#### ✅ Offline Queue
- [ ] Requests queued when offline
- [ ] Queue visible in UI
- [ ] Manual retry works
- [ ] Auto-retry on reconnect
- [ ] Failed requests removed after max retries

#### ✅ Navigation
- [ ] All screens accessible
- [ ] Tab navigation works
- [ ] Stack navigation works
- [ ] Deep links work
- [ ] Back button behavior correct

#### ✅ Data Sync
- [ ] Dashboard data loads
- [ ] Assignments list displays
- [ ] Grades page loads
- [ ] Profile data shows
- [ ] Background sync runs

#### ✅ UI/UX
- [ ] All screens render correctly
- [ ] No import errors in logs
- [ ] Fonts load properly
- [ ] Icons display correctly
- [ ] Touch targets appropriate size

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start -c

# Clear all caches
npx expo start --clear
```

### Build Errors

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
npx expo run:android
```

### Network Issues

```bash
# Check NetInfo status
adb shell dumpsys connectivity

# Test network on device
adb shell ping google.com
```

### Storage Issues

```bash
# Clear app data on device
adb shell pm clear com.edutrack.app

# Or from Settings > Apps > EduTrack > Clear Data
```

### Debug Logs

```bash
# View Android logs
adb logcat

# Filter for React Native logs
adb logcat | grep ReactNativeJS

# View app-specific logs
adb logcat | grep com.edutrack.app
```

## Development Workflow

### 1. Start Development Server

```bash
cd mobile
npx expo start
```

### 2. Run Validation

```bash
npm run validate-android
```

### 3. Type Check

```bash
npm run type-check
```

### 4. Lint

```bash
npm run lint
```

### 5. Full Test Suite

```bash
npm run test-android
```

## Performance Optimization

### Android-Specific Optimizations

1. **ProGuard**: Enabled in production builds
2. **Hermes**: JavaScript engine for better performance
3. **Image Optimization**: WebP format for smaller sizes
4. **Bundle Splitting**: Code splitting for faster loads

### Network Optimization

1. **Request Caching**: Implemented via React Query
2. **Debouncing**: Search and input debouncing
3. **Pagination**: Lazy loading for lists
4. **Image Lazy Loading**: On-demand image loading

## Security Best Practices

### Implemented Security Features

1. ✅ **Secure Storage**: EncryptedSharedPreferences
2. ✅ **Biometric Auth**: Face/Fingerprint unlock
3. ✅ **Certificate Pinning**: SSL pinning in production
4. ✅ **Token Refresh**: Automatic token rotation
5. ✅ **Input Validation**: Server and client-side validation
6. ✅ **Deep Link Validation**: URL validation and sanitization

### Data Protection

- Sensitive data encrypted at rest
- Tokens stored in SecureStore
- No sensitive data in AsyncStorage
- Automatic token expiration
- Secure network communication (HTTPS only)

## Building for Production

### Development Build

```bash
eas build --profile development --platform android
```

### Preview Build

```bash
eas build --profile preview --platform android
```

### Production Build

```bash
eas build --profile production --platform android
```

## Additional Resources

- [Expo Android Documentation](https://docs.expo.dev/workflow/android-studio-emulator/)
- [React Native Android Documentation](https://reactnative.dev/docs/running-on-device)
- [Android Developer Guide](https://developer.android.com/studio/run/emulator)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Android-specific logs
- Consult the main README.md
- Check expo-doctor output: `npx expo-doctor`

---

**Last Updated**: 2024
**Version**: 1.0.0
