# Deep Linking Configuration Guide

## Overview

EduTrack mobile app supports comprehensive deep linking for both iOS and Android platforms, enabling direct navigation to specific screens within the app from external sources.

## Configuration

### App Scheme
- **Scheme**: `edutrack`
- **Bundle Identifier (iOS)**: `com.edutrack.app`
- **Package Name (Android)**: `com.edutrack.app`

### Supported URL Patterns

#### Custom Scheme URLs
- Format: `edutrack://[path]`
- Example: `edutrack://assignments/123`

#### Universal Links (iOS) / App Links (Android)
- Format: `https://edutrack.app/[path]`
- Format: `https://*.edutrack.app/[path]`
- Example: `https://edutrack.app/assignments/123`

## Supported Routes

### Dynamic Routes

#### Assignments
- **Path**: `/assignments/[id]`
- **Deep Link**: `edutrack://assignments/123`
- **Web Link**: `https://edutrack.app/assignments/123`
- **Description**: Navigate to a specific assignment detail page

#### Courses
- **Path**: `/courses/[id]`
- **Deep Link**: `edutrack://courses/math-101`
- **Web Link**: `https://edutrack.app/courses/math-101`
- **Description**: Navigate to a specific course page

#### Children (Parent View)
- **Path**: `/children/[id]`
- **Deep Link**: `edutrack://children/child-123`
- **Web Link**: `https://edutrack.app/children/child-123`
- **Description**: Navigate to a specific child's profile

#### Messages
- **Path**: `/messages/[id]`
- **Deep Link**: `edutrack://messages/msg-456`
- **Web Link**: `https://edutrack.app/messages/msg-456`
- **Description**: Navigate to a specific message thread

#### Notifications
- **Path**: `/notifications/[id]`
- **Deep Link**: `edutrack://notifications/789`
- **Web Link**: `https://edutrack.app/notifications/789`
- **Description**: Navigate to a specific notification

### Static Routes

#### Profile
- **Path**: `/profile`
- **Deep Link**: `edutrack://profile`
- **Web Link**: `https://edutrack.app/profile`

#### Settings
- **Path**: `/settings`
- **Deep Link**: `edutrack://settings`
- **Web Link**: `https://edutrack.app/settings`

#### Student Home
- **Path**: `/(tabs)/student`
- **Deep Link**: `edutrack://(tabs)/student`

#### Parent Home
- **Path**: `/(tabs)/parent`
- **Deep Link**: `edutrack://(tabs)/parent`

### Authentication Routes

- `/(auth)/login`
- `/(auth)/register`
- `/(auth)/forgot-password`
- `/(auth)/reset-password`
- `/(auth)/otp-verify`
- `/(auth)/otp-login`

## Query Parameters

Deep links support query parameters for additional context:

```
edutrack://assignments/123?tab=details
edutrack://courses/math-101?section=homework
https://edutrack.app/assignments/123?notification=true
```

## Testing Deep Links

### iOS Testing

#### Using Simulator (Command Line)
```bash
# Test assignment deep link
xcrun simctl openurl booted edutrack://assignments/123

# Test web link (Universal Link)
xcrun simctl openurl booted https://edutrack.app/assignments/123
```

#### Using Test Scripts
```bash
# Run all iOS deep link tests
cd mobile
./scripts/test-deep-links-ios.sh

# Or using PowerShell
.\scripts\test-deep-links-ios.ps1
```

### Android Testing

#### Using ADB (Command Line)
```bash
# Test assignment deep link
adb shell am start -a android.intent.action.VIEW \
  -d "edutrack://assignments/123" \
  com.edutrack.app

# Test web link (App Link)
adb shell am start -a android.intent.action.VIEW \
  -d "https://edutrack.app/assignments/123" \
  com.edutrack.app
```

#### Using Test Scripts
```bash
# Run all Android deep link tests
cd mobile
./scripts/test-deep-links-android.sh

# Or using PowerShell
.\scripts\test-deep-links-android.ps1
```

#### Verify Intent Filters
```bash
# Check if intent filters are properly configured
adb shell dumpsys package com.edutrack.app | grep -A 20 "android.intent.action.VIEW"
```

## Implementation Details

### Deep Link Handling Flow

1. **URL Received**: App receives deep link URL from OS
2. **Validation**: URL is validated using `isValidDeepLink()`
3. **Normalization**: URL is normalized to standard format using `normalizeDeepLink()`
4. **Parsing**: URL is parsed to extract path and parameters using `parseDeepLink()`
5. **Authentication Check**: If user is not authenticated and route requires auth, redirect to login with return path
6. **Navigation**: Navigate to the appropriate screen using Expo Router

### Key Components

#### `src/utils/deepLinking.ts`
Core deep linking utilities:
- `parseDeepLink()`: Parse URL into route and parameters
- `createDeepLink()`: Generate custom scheme deep link
- `createWebLink()`: Generate universal/app link
- `getInitialURL()`: Get the URL that opened the app
- `addDeepLinkListener()`: Listen for incoming deep links
- `isValidDeepLink()`: Validate deep link URL
- `normalizeDeepLink()`: Convert web links to custom scheme

#### `app/_layout.tsx`
Root layout handles deep link events:
- Initial URL handling on app launch
- Real-time deep link event listening
- Authentication flow integration
- Navigation routing

### Configuration Files

#### `app.json`
- iOS associated domains for Universal Links
- Android intent filters for App Links
- Custom scheme configuration

## Web Deep Links (Universal/App Links)

### iOS Universal Links

Requires `apple-app-site-association` file on server:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.edutrack.app",
        "paths": ["*"]
      }
    ]
  }
}
```

Host at: `https://edutrack.app/.well-known/apple-app-site-association`

### Android App Links

Requires `assetlinks.json` file on server:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.edutrack.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

Host at: `https://edutrack.app/.well-known/assetlinks.json`

## Common Issues and Troubleshooting

### iOS

1. **Universal Links not working**
   - Verify associated domains in app.json
   - Check apple-app-site-association file is accessible
   - Ensure file is served with correct content-type: `application/json`
   - Links must be opened from outside the app (Safari, Messages, etc.)

2. **Custom scheme not working**
   - Rebuild the app after scheme changes
   - Verify scheme in app.json matches the one being tested

### Android

1. **App Links not working**
   - Verify intent filters in app.json
   - Check assetlinks.json file is accessible
   - Verify app signing certificate fingerprint
   - Test with: `adb shell am start -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123"`

2. **Custom scheme not working**
   - Clear app data and cache
   - Rebuild the app
   - Check intent filters in AndroidManifest.xml

### General

1. **Deep link not navigating to correct screen**
   - Check route configuration in `src/utils/deepLinking.ts`
   - Verify screen exists in `app/` directory
   - Check console logs for parsing errors

2. **Authentication redirect issues**
   - Verify authentication state in Redux store
   - Check return path parameter is being set correctly
   - Ensure login screen handles return path navigation

## Usage in Code

### Creating Deep Links

```typescript
import { createDeepLink, createWebLink, deepLinkRoutes } from '@utils/deepLinking';

// Create custom scheme link
const assignmentLink = createDeepLink(deepLinkRoutes.assignments('123'));
// Result: "edutrack://assignments/123"

// Create web link
const webLink = createWebLink(deepLinkRoutes.assignments('123'));
// Result: "https://edutrack.app/assignments/123"

// With query parameters
const linkWithParams = createDeepLink(
  deepLinkRoutes.assignments('123'),
  { tab: 'details', notification: 'true' }
);
// Result: "edutrack://assignments/123?tab=details&notification=true"
```

### Sharing Deep Links

```typescript
import { Share } from 'react-native';
import { createWebLink, deepLinkRoutes } from '@utils/deepLinking';

const shareAssignment = async (assignmentId: string) => {
  const link = createWebLink(deepLinkRoutes.assignments(assignmentId));
  
  await Share.share({
    message: `Check out this assignment: ${link}`,
    url: link, // iOS only
  });
};
```

## Best Practices

1. **Always use web links for sharing**: Universal/App Links provide better user experience
2. **Include return paths**: When redirecting to login, preserve the intended destination
3. **Validate parameters**: Check that dynamic route parameters are valid before navigation
4. **Handle errors gracefully**: Show user-friendly messages when deep links fail
5. **Test on both platforms**: Deep linking behavior can differ between iOS and Android
6. **Log deep link events**: Track which deep links are used for analytics

## Analytics Integration

Consider tracking deep link usage:

```typescript
const handleDeepLink = (url: string) => {
  const route = parseDeepLink(url);
  
  // Track deep link event
  analytics.track('deep_link_opened', {
    url,
    path: route?.path,
    params: route?.params,
    source: 'external',
  });
  
  // Navigate to route
  // ...
};
```

## Security Considerations

1. **Validate all parameters**: Never trust user input from deep links
2. **Check authentication**: Protect sensitive routes
3. **Rate limiting**: Consider implementing rate limits for deep link navigation
4. **Sanitize URLs**: Prevent XSS attacks through malicious URLs
5. **HTTPS only**: Always use HTTPS for Universal/App Links

## Additional Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
