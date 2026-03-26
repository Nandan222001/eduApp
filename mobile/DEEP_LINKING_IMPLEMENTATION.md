# Deep Linking Implementation Guide

This document provides a complete overview of the deep linking implementation in the EduTrack mobile app.

## ✅ Configuration Status

### App Configuration (app.json)
- **URL Scheme**: `edutrack` ✅
- **iOS Bundle ID**: `com.edutrack.app` ✅
- **Android Package**: `com.edutrack.app` ✅
- **iOS Associated Domains**: Configured ✅
- **Android Intent Filters**: Configured ✅

## 📁 File Structure

```
mobile/
├── app.json                          # Deep linking configuration
├── app/
│   ├── _layout.tsx                   # Deep link handling logic
│   └── assignments/
│       └── [id].tsx                  # Dynamic route example
├── src/
│   ├── utils/
│   │   ├── deepLinking.ts           # Core deep linking utilities
│   │   └── deepLinkingHelpers.ts    # Helper functions for common tasks
│   └── components/
│       └── DeepLinkingExample.tsx   # Usage example component
├── __tests__/
│   ├── unit/
│   │   └── deepLinking.test.ts      # Unit tests
│   ├── integration/
│   │   └── deepLinking.test.tsx     # Integration tests
│   └── DEEP_LINKING_TEST_GUIDE.md   # Comprehensive testing guide
└── scripts/
    ├── validate-deep-linking.js     # Configuration validator
    ├── test-ios-deep-links.sh       # iOS testing script
    └── test-android-deep-links.sh   # Android testing script
```

## 🔧 Core Components

### 1. Deep Linking Utilities (`src/utils/deepLinking.ts`)

Core functions for handling deep links:

```typescript
// Parse a deep link URL
parseDeepLink(url: string): DeepLinkRoute | null

// Create custom scheme deep link
createDeepLink(path: string, params?: Record<string, string>): string

// Create web link (HTTPS)
createWebLink(path: string, params?: Record<string, string>): string

// Get initial URL on app launch
getInitialURL(): Promise<string | null>

// Listen for deep link events
addDeepLinkListener(callback: (url: string) => void): { remove: () => void }

// Validate deep link
isValidDeepLink(url: string): boolean

// Normalize deep link to custom scheme
normalizeDeepLink(url: string): string
```

### 2. Helper Functions (`src/utils/deepLinkingHelpers.ts`)

High-level utilities for common deep linking tasks:

```typescript
// Share assignment via deep link
shareAssignment(assignmentId: string, assignmentTitle: string): Promise<void>

// Copy link to clipboard
copyAssignmentLink(assignmentId: string): Promise<void>

// Create notification deep link
createNotificationDeepLink(type, id, params): string

// Create email deep link with tracking
createEmailDeepLink(type, id, campaign): string

// Create QR code deep link
createQRCodeDeepLink(type, id, action): string

// Extract tracking parameters
extractDeepLinkTracking(params): TrackingData

// Log navigation for analytics
logDeepLinkNavigation(path, params, userId): void

// Sanitize ID parameter
sanitizeDeepLinkId(id): string | null
```

### 3. Pre-defined Routes (`deepLinkRoutes`)

```typescript
deepLinkRoutes.assignments(id)      // /assignments/[id]
deepLinkRoutes.courses(id)          // /courses/[id]
deepLinkRoutes.children(id)         // /children/[id]
deepLinkRoutes.messages(id)         // /messages/[id]
deepLinkRoutes.notifications(id)    // /notifications/[id]
deepLinkRoutes.profile()            // /profile
deepLinkRoutes.settings()           // /settings
deepLinkRoutes.studentHome()        // /(tabs)/student
deepLinkRoutes.parentHome()         // /(tabs)/parent
deepLinkRoutes.login()              // /(auth)/login
deepLinkRoutes.register()           // /(auth)/register
```

## 🧪 Testing

### Automated Tests

```bash
# Run all deep linking tests
npm test -- deepLinking

# Run unit tests only
npm test -- unit/deepLinking.test.ts

# Run integration tests only
npm test -- integration/deepLinking.test.tsx

# Run with coverage
npm test -- --coverage deepLinking
```

### Manual Testing

#### Validate Configuration
```bash
node scripts/validate-deep-linking.js
```

#### iOS Simulator Testing
```bash
# Run all iOS tests
./scripts/test-ios-deep-links.sh

# Manual test
xcrun simctl openurl booted edutrack://assignments/123
```

#### Android Emulator/Device Testing
```bash
# Run all Android tests
./scripts/test-android-deep-links.sh

# Manual test
adb shell am start -W -a android.intent.action.VIEW \
  -d "edutrack://assignments/123" com.edutrack.app
```

See `__tests__/DEEP_LINKING_TEST_GUIDE.md` for comprehensive testing instructions.

## 📱 Supported URL Patterns

### Custom Scheme URLs
```
edutrack://assignments/123
edutrack://courses/456
edutrack://children/789
edutrack://messages/101
edutrack://notifications/202
edutrack://profile
edutrack://settings
```

### Universal/App Links (HTTPS)
```
https://edutrack.app/assignments/123
https://www.edutrack.app/courses/456
https://mobile.edutrack.app/profile
```

### With Query Parameters
```
edutrack://assignments/123?source=notification&priority=high
https://edutrack.app/assignments/123?utm_source=email&utm_campaign=reminder
```

## 🚀 Usage Examples

### In a Screen Component

```typescript
import { useLocalSearchParams } from 'expo-router';
import { 
  shareAssignment, 
  sanitizeDeepLinkId, 
  extractDeepLinkTracking 
} from '@utils';

export default function AssignmentDetailScreen() {
  const params = useLocalSearchParams();
  const assignmentId = sanitizeDeepLinkId(params.id);
  const tracking = extractDeepLinkTracking(params);

  const handleShare = async () => {
    await shareAssignment(assignmentId, 'Math Homework');
  };

  return (
    <View>
      <Text>Assignment {assignmentId}</Text>
      <Text>Source: {tracking.source}</Text>
      <Button title="Share" onPress={handleShare} />
    </View>
  );
}
```

### Creating Deep Links

```typescript
import { createDeepLink, deepLinkRoutes } from '@utils';

// Simple deep link
const link = createDeepLink(deepLinkRoutes.assignments('123'));
// Result: edutrack://assignments/123

// With parameters
const linkWithParams = createDeepLink(
  deepLinkRoutes.assignments('123'),
  { source: 'notification', priority: 'high' }
);
// Result: edutrack://assignments/123?source=notification&priority=high
```

### For Push Notifications

```typescript
import { createNotificationDeepLink } from '@utils';

const notificationPayload = {
  title: 'New Assignment',
  body: 'Math homework is due tomorrow',
  data: {
    deepLink: createNotificationDeepLink('assignment', '123', {
      priority: 'high'
    })
  }
};
```

### For Email Links

```typescript
import { createEmailDeepLink } from '@utils';

const emailLink = createEmailDeepLink(
  'assignment',
  '123',
  'weekly_reminder'
);
// Result: https://edutrack.app/assignments/123?utm_source=email&utm_medium=deep_link&utm_campaign=weekly_reminder
```

## 🔐 Security

### Input Sanitization

All ID parameters are sanitized to prevent injection attacks:

```typescript
import { sanitizeDeepLinkId } from '@utils';

// Removes potentially malicious characters
const safeId = sanitizeDeepLinkId(params.id);
// Only allows: a-zA-Z0-9-_
```

### Authentication Checks

Deep links to protected routes require authentication:

```typescript
import { requiresAuthentication } from '@utils';

if (requiresAuthentication(route.path) && !isAuthenticated) {
  // Redirect to login with return path
  router.replace({
    pathname: '/(auth)/login',
    params: { returnPath: route.path }
  });
}
```

## 🎯 Dynamic Routes with Expo Router

The app supports the following dynamic routes:

| Route Pattern | File Location | Example URL |
|--------------|---------------|-------------|
| `/assignments/[id]` | `app/assignments/[id].tsx` | `edutrack://assignments/123` |
| `/courses/[id]` | `app/courses/[id].tsx` | `edutrack://courses/456` |
| `/children/[id]` | `app/children/[id].tsx` | `edutrack://children/789` |
| `/messages/[id]` | `app/messages/[id].tsx` | `edutrack://messages/101` |
| `/notifications/[id]` | `app/notifications/[id].tsx` | `edutrack://notifications/202` |

### Accessing Route Parameters

```typescript
import { useLocalSearchParams } from 'expo-router';

function Screen() {
  const params = useLocalSearchParams();
  const id = params.id; // Route parameter
  const source = params.source; // Query parameter
  
  return <View>...</View>;
}
```

## 🌐 Platform-Specific Configuration

### iOS (app.json)

```json
{
  "ios": {
    "bundleIdentifier": "com.edutrack.app",
    "associatedDomains": [
      "applinks:edutrack.app",
      "applinks:*.edutrack.app"
    ]
  }
}
```

**Required Files:**
- `.well-known/apple-app-site-association` on server

### Android (app.json)

```json
{
  "android": {
    "package": "com.edutrack.app",
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          { "scheme": "https", "host": "edutrack.app" }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      },
      {
        "action": "VIEW",
        "data": [{ "scheme": "edutrack" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

**Required Files:**
- `.well-known/assetlinks.json` on server

## 📊 Analytics & Tracking

Deep link navigation is automatically tracked:

```typescript
// Automatic tracking on navigation
logDeepLinkNavigation(
  '/assignments/123',
  { source: 'notification', priority: 'high' },
  userId
);

// Logged data includes:
// - path: Route path
// - source: Traffic source (notification, email, qr_code, etc.)
// - utm_source, utm_medium, utm_campaign: Marketing parameters
// - userId: Current user ID
// - timestamp: Navigation time
```

## 🔄 Navigation Flow

1. **App receives deep link**
   - From notification tap
   - From email click
   - From xcrun simctl (iOS)
   - From adb intent (Android)

2. **URL is validated**
   - `isValidDeepLink()` checks format
   - `normalizeDeepLink()` converts to standard format

3. **Route is parsed**
   - `parseDeepLink()` extracts path and parameters
   - `sanitizeDeepLinkId()` validates route parameters

4. **Authentication check**
   - If route requires auth and user not logged in
   - Redirect to login with return path

5. **Navigation**
   - Expo Router navigates to the screen
   - Parameters passed to screen component

6. **Tracking**
   - Navigation logged for analytics
   - Tracking parameters extracted

## 🐛 Troubleshooting

### iOS Issues

**Deep link doesn't open app:**
```bash
# Check if app is installed
xcrun simctl listapps booted | grep -i edutrack

# Verify scheme in app.json
node scripts/validate-deep-linking.js

# Try reinstalling
# In Xcode: Product > Clean Build Folder
# Then rebuild and install
```

**Universal links not working:**
- Verify `apple-app-site-association` file on server
- Check associated domains in entitlements
- Ensure bundle identifier matches

### Android Issues

**Intent not opening app:**
```bash
# Check if app is installed
adb shell pm list packages | grep edutrack

# Verify intent filters
adb shell dumpsys package com.edutrack.app | grep -A 10 "android.intent.action.VIEW"

# Check logs
adb logcat | grep -i edutrack
```

**App Links not verified:**
- Check `assetlinks.json` file on server
- Verify `autoVerify="true"` in intent filters
- Ensure package signing matches

### Common Issues

**Query parameters not working:**
- Use quotes around URLs in terminal: `"edutrack://assignments/123?source=test"`
- Check URL encoding for special characters

**Dynamic routes not matching:**
- Verify file structure matches route pattern
- Check case sensitivity in route paths
- Ensure `[id]` parameter is correctly defined

## 📚 Additional Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Expo Router Deep Linking](https://docs.expo.dev/router/reference/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)

## ✅ Verification Checklist

Before deploying:

- [ ] Run `node scripts/validate-deep-linking.js`
- [ ] Run automated tests: `npm test -- deepLinking`
- [ ] Test on iOS simulator: `./scripts/test-ios-deep-links.sh`
- [ ] Test on Android emulator: `./scripts/test-android-deep-links.sh`
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test from push notifications
- [ ] Test from email links
- [ ] Test authentication flow with deep links
- [ ] Verify analytics tracking
- [ ] Check `apple-app-site-association` file on server
- [ ] Check `assetlinks.json` file on server

## 🎉 Summary

The EduTrack app has comprehensive deep linking support with:

✅ Custom scheme (`edutrack://`) configured
✅ Universal/App Links (HTTPS) configured
✅ Dynamic routes for all major screens
✅ Utility functions for common tasks
✅ Comprehensive test coverage
✅ Platform-specific testing scripts
✅ Example components and documentation
✅ Security measures (input sanitization)
✅ Analytics tracking
✅ Authentication flow integration

All configuration, tests, helpers, and documentation are complete and ready to use!
