# EduTrack Mobile - iOS Platform

This is the iOS-ready implementation of the EduTrack mobile application built with React Native, Expo, and Expo Router.

## 🎯 iOS-Specific Features

### ✅ Implemented Features

1. **Secure Token Storage** - Using expo-secure-store (iOS Keychain)
2. **Biometric Authentication** - Face ID / Touch ID support
3. **Path Aliases** - Clean imports across the codebase
4. **Expo Router** - File-based navigation
5. **Offline Support** - Data caching and sync
6. **Background Sync** - Automatic data updates
7. **Push Notifications** - Local and remote notifications
8. **Deep Linking** - Universal links and app schemes

## 🚀 Quick Start

### For Testing on iOS

```bash
# 1. Install dependencies
npm install

# 2. Validate iOS setup
npm run validate-ios

# 3. Start the app
npx expo start --ios
```

The iOS Simulator will launch automatically with the app.

### Demo Credentials

**Student Account:**
- Email: `demo@example.com`
- Password: `Demo@123`

**Parent Account:**
- Email: `parent@demo.com`
- Password: `Demo@123`

## 📋 Pre-flight Checklist

Run the validation script to check your setup:

```bash
npm run validate-ios
```

This will verify:
- ✅ All required files exist
- ✅ Path aliases configured correctly
- ✅ expo-secure-store installed
- ✅ expo-local-authentication installed
- ✅ iOS permissions configured
- ✅ TypeScript configuration valid

## 📱 Testing on Physical Device

### Option 1: Expo Go (Quick Testing)

1. Install "Expo Go" from the App Store
2. Run: `npx expo start --tunnel`
3. Scan the QR code with your camera
4. App loads in Expo Go

### Option 2: Development Build (Full Features)

```bash
# Build and install development client
npx expo run:ios
```

This is required for testing:
- Face ID / Touch ID authentication
- Secure storage in Keychain
- Native iOS features

## 🧪 Test Scenarios

### 1. Basic Launch & Navigation
```
✓ App launches without crashes
✓ Splash screen displays
✓ Login screen appears
✓ Can navigate to dashboard
✓ All tabs work
```

### 2. Token Storage (SecureStore/Keychain)
```
✓ Login with demo credentials
✓ Tokens stored in Keychain
✓ Kill and restart app
✓ Still logged in (tokens persisted)
```

### 3. Biometric Authentication
```
✓ Enable in Profile > Settings
✓ Logout
✓ See biometric login option
✓ Face ID/Touch ID prompt appears
✓ Authenticate successfully
```

### 4. Path Aliases
```
✓ App loads (validates all imports work)
✓ No "module not found" errors
✓ All screens render correctly
```

## 🛠️ Troubleshooting

### Common Issues

**Issue:** Module not found errors with path aliases

```bash
# Fix: Clear Metro cache
npx expo start --clear
```

**Issue:** App crashes on launch

```bash
# Fix: Clean install
rm -rf node_modules
npm install
npx expo start --ios --clear
```

**Issue:** Biometric not working

- Test on physical device (simulator has limitations)
- Check Face ID/Touch ID is enrolled on device
- Verify Info.plist permission in app.json

**Issue:** TypeScript errors

```bash
# Fix: Run type checker
npm run type-check
```

## 📁 Project Structure

```
mobile/
├── app/                        # Expo Router app directory
│   ├── _layout.tsx            # Root layout
│   ├── index.tsx              # Entry point
│   ├── (auth)/                # Auth screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── ...
│   └── (tabs)/                # Tab navigation
│       ├── student/           # Student screens
│       └── parent/            # Parent screens
│
├── src/
│   ├── api/                   # API clients
│   ├── components/            # Reusable components
│   ├── config/                # App configuration
│   │   └── ios.ts            # iOS-specific config
│   ├── constants/             # App constants
│   ├── hooks/                 # Custom hooks
│   ├── screens/               # Screen components
│   ├── services/              # Services
│   ├── store/                 # Redux store
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utilities
│       ├── secureStorage.ts  # Keychain wrapper
│       ├── biometric.ts      # Biometric auth
│       └── ...
│
├── __tests__/                 # Test files
├── scripts/                   # Build/test scripts
│
├── app.json                   # Expo configuration
├── babel.config.js            # Babel config (path aliases)
├── metro.config.js            # Metro config (path aliases)
├── tsconfig.json              # TypeScript config (path aliases)
├── package.json               # Dependencies
│
└── Documentation/
    ├── IOS_SETUP.md          # Detailed iOS setup
    ├── IOS_FEATURES.md       # Feature documentation
    └── QUICK_START_IOS.md    # Quick start guide
```

## 🔧 Development Commands

```bash
# Start development server
npm start

# Start with iOS
npm run ios

# Type checking
npm run type-check

# Linting
npm run lint

# Validate iOS setup
npm run validate-ios

# Full iOS test suite
npm run test-ios
```

## 📦 iOS-Specific Dependencies

```json
{
  "expo-secure-store": "~12.8.1",        // Keychain storage
  "expo-local-authentication": "~13.8.0", // Face ID/Touch ID
  "expo-router": "~3.4.10",              // Navigation
  "expo-splash-screen": "~0.26.4",       // Splash screen
  "expo-notifications": "~0.27.6",       // Notifications
  "expo-background-fetch": "~12.0.1",    // Background sync
  "@reduxjs/toolkit": "^2.0.1",          // State management
  "react-redux": "^9.0.4"                // Redux bindings
}
```

## 🔐 iOS Permissions

Configured in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "Authenticate to access EduTrack",
      "NSCameraUsageDescription": "Scan homework and QR codes",
      "NSPhotoLibraryUsageDescription": "Upload assignment photos",
      "NSMicrophoneUsageDescription": "Voice features",
      "UIBackgroundModes": ["fetch", "remote-notification"]
    }
  }
}
```

## 🎨 Path Alias Reference

Use these clean imports throughout the codebase:

```typescript
import { store } from '@store';
import { Button } from '@components/Button';
import { secureStorage } from '@utils/secureStorage';
import { iosConfig } from '@config/ios';
import { COLORS } from '@constants';
import { authApi } from '@api/authApi';
import { useAuth } from '@hooks/useAuth';
```

## 📊 Performance

Expected performance on iOS:
- **App Launch:** < 3 seconds
- **Login:** < 2 seconds
- **Screen Transition:** < 500ms
- **Biometric Auth:** < 1 second

## 🔍 Validation

The iOS setup is complete when:

1. ✅ `npm run validate-ios` passes all checks
2. ✅ `npm run type-check` has no errors
3. ✅ App launches on iOS Simulator
4. ✅ Login/logout works correctly
5. ✅ Tokens persist after app restart
6. ✅ All screens are accessible
7. ✅ No import errors in console

## 📚 Documentation

- **[IOS_SETUP.md](./IOS_SETUP.md)** - Complete iOS setup guide
- **[IOS_FEATURES.md](./IOS_FEATURES.md)** - Feature implementation details
- **[QUICK_START_IOS.md](./QUICK_START_IOS.md)** - 5-minute quick start
- **[Main README](../README.md)** - Project overview

## 🆘 Support

### Debug Commands

```bash
# View iOS logs
npx react-native log-ios

# Clear all caches
npx expo start --clear

# Reset project
rm -rf node_modules ios .expo
npm install
```

### Getting Help

1. Check documentation files listed above
2. Run `npm run validate-ios` for diagnostics
3. Review error logs in Metro bundler
4. Check iOS Simulator console

## ✨ What's Working

All core iOS features are implemented and tested:

- ✅ **Secure Storage** - Tokens in iOS Keychain via expo-secure-store
- ✅ **Biometric Auth** - Face ID/Touch ID via expo-local-authentication
- ✅ **Path Aliases** - @store, @components, @utils, etc.
- ✅ **Expo Router** - File-based navigation with typed routes
- ✅ **Redux Store** - Centralized state management
- ✅ **Offline Mode** - Data caching and sync
- ✅ **Background Sync** - Automatic updates
- ✅ **Push Notifications** - Local and remote
- ✅ **Deep Linking** - Universal links support

## 🎯 Next Steps

After validating iOS setup:

1. Test on iOS Simulator
2. Test on physical device
3. Verify all screens work
4. Test offline mode
5. Test biometric authentication
6. Review all features work as expected

---

**Ready to start?** Run `npm run ios` to launch the app!

For detailed testing procedures, see [QUICK_START_IOS.md](./QUICK_START_IOS.md)
