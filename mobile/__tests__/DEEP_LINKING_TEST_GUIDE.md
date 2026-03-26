# Deep Linking Test Guide

This guide provides comprehensive instructions for testing deep linking functionality in the EduTrack mobile app across all platforms.

## Table of Contents
- [Configuration Verification](#configuration-verification)
- [iOS Testing](#ios-testing)
- [Android Testing](#android-testing)
- [Web Testing](#web-testing)
- [Common Test Scenarios](#common-test-scenarios)
- [Troubleshooting](#troubleshooting)

## Configuration Verification

### Verify app.json Configuration

The app.json should have the following deep linking configuration:

```json
{
  "expo": {
    "scheme": "edutrack",
    "ios": {
      "bundleIdentifier": "com.edutrack.app",
      "associatedDomains": [
        "applinks:edutrack.app",
        "applinks:*.edutrack.app"
      ]
    },
    "android": {
      "package": "com.edutrack.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "edutrack.app",
              "pathPrefix": "/"
            },
            {
              "scheme": "https",
              "host": "*.edutrack.app",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        },
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "edutrack"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

✅ **Verified**: The scheme is correctly set to `'edutrack'`

## iOS Testing

### Testing with iOS Simulator

#### 1. Using xcrun simctl openurl

This is the primary method for testing deep links on iOS simulator:

```bash
# Test assignment deep link with ID 123
xcrun simctl openurl booted edutrack://assignments/123

# Test course deep link
xcrun simctl openurl booted edutrack://courses/456

# Test children profile
xcrun simctl openurl booted edutrack://children/789

# Test messages
xcrun simctl openurl booted edutrack://messages/101

# Test notifications
xcrun simctl openurl booted edutrack://notifications/202

# Test with query parameters
xcrun simctl openurl booted "edutrack://assignments/123?source=notification&priority=high"
```

#### 2. Testing Universal Links (HTTPS)

```bash
# Test HTTPS deep link
xcrun simctl openurl booted https://edutrack.app/assignments/123

# Test with subdomain
xcrun simctl openurl booted https://www.edutrack.app/courses/456

# Test with query parameters
xcrun simctl openurl booted "https://edutrack.app/assignments/123?utm_source=email"
```

#### 3. Get Current Device ID

```bash
# List all available simulators
xcrun simctl list devices | grep Booted

# Use specific device if needed
xcrun simctl openurl <DEVICE_ID> edutrack://assignments/123
```

### Testing on Physical iOS Device

#### 1. Using Safari

1. Open Safari on your iOS device
2. Type in the address bar: `edutrack://assignments/123`
3. Tap "Open" when prompted

#### 2. Using Notes App

1. Open Notes app
2. Create a new note
3. Type: `edutrack://assignments/123`
4. Tap the link

#### 3. Using SMS/Messages

1. Send yourself a message with the deep link
2. Tap the link in the message

#### 4. Using ADB (Advanced)

```bash
# Install on device
xcrun devicectl device install app --device <DEVICE_ID> /path/to/app.ipa

# Send deep link
xcrun devicectl device process launch --device <DEVICE_ID> --url edutrack://assignments/123
```

### Verify iOS Associated Domains

Check that the app has proper entitlements:

1. Build the app for iOS
2. Check the entitlements file includes:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:edutrack.app</string>
  <string>applinks:*.edutrack.app</string>
</array>
```

## Android Testing

### Testing with Android Emulator

#### 1. Using ADB (Android Debug Bridge)

```bash
# Test custom scheme deep link
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app

# Test HTTPS deep link
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app

# Test with query parameters
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123?source=notification" com.edutrack.app
```

#### 2. Using Browser in Emulator

1. Open Chrome in the Android emulator
2. Type in the address bar: `edutrack://assignments/123`
3. Tap "Open in app" when prompted

#### 3. Test Intent Filters

```bash
# Verify intent filters are registered
adb shell dumpsys package com.edutrack.app | grep -A 10 "android.intent.action.VIEW"

# Check URL handling
adb shell pm query-activities -a android.intent.action.VIEW -d "edutrack://assignments/123"
```

### Testing on Physical Android Device

#### 1. Using ADB (Device Connected)

```bash
# List connected devices
adb devices

# Send deep link to specific device
adb -s <DEVICE_SERIAL> shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app
```

#### 2. Using Chrome Browser

1. Open Chrome on your Android device
2. Type: `edutrack://assignments/123`
3. Tap "Open in app"

#### 3. Using Gmail/Messages

1. Send yourself an email or message with the deep link
2. Tap the link

### Verify Android Intent Filters

Check AndroidManifest.xml includes:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="edutrack.app" />
  <data android:scheme="https" android:host="*.edutrack.app" />
</intent-filter>

<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="edutrack" />
</intent-filter>
```

## Web Testing

### Testing in Browser

#### 1. Local Development

```bash
# Start the web server
npm run web

# Open browser console and test
window.location.href = 'edutrack://assignments/123'
```

#### 2. Test URL Patterns

```javascript
// Test custom scheme
window.location.href = 'edutrack://assignments/123';

// Test HTTPS
window.location.href = 'https://edutrack.app/assignments/123';

// Test with query params
window.location.href = 'edutrack://assignments/123?source=web';
```

## Common Test Scenarios

### 1. Dynamic Routes with Expo Router

Test all dynamic routes as defined in the app:

```bash
# iOS
xcrun simctl openurl booted edutrack://assignments/123
xcrun simctl openurl booted edutrack://courses/456
xcrun simctl openurl booted edutrack://children/789
xcrun simctl openurl booted edutrack://messages/101
xcrun simctl openurl booted edutrack://notifications/202

# Android
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://courses/456" com.edutrack.app
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://children/789" com.edutrack.app
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://messages/101" com.edutrack.app
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://notifications/202" com.edutrack.app
```

### 2. Test with Query Parameters

```bash
# iOS - Test assignment with source tracking
xcrun simctl openurl booted "edutrack://assignments/123?source=notification&priority=high"

# Android - Test assignment with source tracking
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123?source=notification&priority=high" com.edutrack.app
```

### 3. Test Authentication Flow

```bash
# Test deep link when user is not authenticated
# App should redirect to login with return path

# iOS
xcrun simctl openurl booted "edutrack://assignments/123?returnAfterLogin=true"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123?returnAfterLogin=true" com.edutrack.app
```

### 4. Test from Push Notification

```bash
# Simulate notification tap with deep link payload

# iOS
xcrun simctl openurl booted "edutrack://assignments/new-homework-123?from=notification"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/new-homework-123?from=notification" com.edutrack.app
```

### 5. Test Universal/App Links

```bash
# iOS Universal Links
xcrun simctl openurl booted https://edutrack.app/assignments/123

# Android App Links
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app
```

### 6. Test Subdomain URLs

```bash
# iOS
xcrun simctl openurl booted https://www.edutrack.app/assignments/123
xcrun simctl openurl booted https://mobile.edutrack.app/courses/456

# Android
adb shell am start -W -a android.intent.action.VIEW -d "https://www.edutrack.app/assignments/123" com.edutrack.app
adb shell am start -W -a android.intent.action.VIEW -d "https://mobile.edutrack.app/courses/456" com.edutrack.app
```

## Automated Testing

### Run Unit Tests

```bash
# Run deep linking unit tests
npm test -- deepLinking.test.ts

# Run with coverage
npm test -- --coverage deepLinking.test.ts
```

### Run Integration Tests

```bash
# Run deep linking integration tests
npm test -- integration/deepLinking.test.tsx

# Run all deep linking tests
npm test -- deepLinking
```

## Expected Behavior

### Correct Expo Router Handling

When a deep link is received:

1. **URL Parsing**: The app should parse the URL correctly
2. **Route Matching**: Match the URL to the correct dynamic route (e.g., `/assignments/[id]`)
3. **Parameter Extraction**: Extract route parameters (e.g., `id: "123"`)
4. **Navigation**: Navigate to the correct screen with parameters
5. **Query Params**: Preserve and pass query parameters to the screen
6. **Authentication Check**: Redirect to login if user not authenticated
7. **Return Path**: Save return path for post-login redirect

### Verification Checklist

- [ ] Deep link scheme is set to `'edutrack'` in app.json
- [ ] iOS simulator can open `edutrack://assignments/123`
- [ ] Android emulator can open `edutrack://assignments/123`
- [ ] Universal links work: `https://edutrack.app/assignments/123`
- [ ] Dynamic routes work for all patterns: `/assignments/[id]`, `/courses/[id]`, etc.
- [ ] Query parameters are preserved and accessible
- [ ] Authentication flow redirects properly
- [ ] App handles invalid/malformed URLs gracefully
- [ ] Deep links work from notifications
- [ ] Deep links work from email/SMS
- [ ] Web deep links redirect correctly

## Troubleshooting

### iOS Issues

**Problem**: Deep link doesn't open the app
- Ensure app is installed on simulator
- Verify scheme in app.json matches the URL scheme
- Check that the simulator is booted: `xcrun simctl list devices | grep Booted`
- Try uninstalling and reinstalling the app

**Problem**: Universal links not working
- Verify associated domains in app.json
- Check that you have the `apple-app-site-association` file on the server
- Ensure the bundle identifier matches

### Android Issues

**Problem**: Intent not opening the app
- Verify package name matches in app.json
- Check intent filters are correctly configured
- Use `adb logcat` to see error messages
- Ensure app is installed: `adb shell pm list packages | grep edutrack`

**Problem**: App Links not verified
- Check `autoVerify` is set to true in intent filters
- Verify `assetlinks.json` file on the server
- Check package signing matches

### General Issues

**Problem**: Deep link opens app but doesn't navigate
- Check the Expo Router configuration in `_layout.tsx`
- Verify the route exists in the app structure
- Check authentication logic isn't blocking navigation
- Add console logs to track the navigation flow

**Problem**: Query parameters not working
- Verify URL encoding is correct
- Check parameter parsing in the route handler
- Use quotes around URLs with special characters in terminal

**Problem**: Dynamic routes not matching
- Verify the route structure matches the file structure
- Check that the `[id]` parameter is correctly defined
- Ensure the route path matches exactly (case-sensitive)

## Debug Commands

### iOS Debug

```bash
# View device logs
xcrun simctl spawn booted log stream --predicate 'processImagePath CONTAINS "EduTrack"'

# Check installed apps
xcrun simctl listapps booted

# Reset simulator
xcrun simctl erase booted
```

### Android Debug

```bash
# View logcat filtered for app
adb logcat | grep -i edutrack

# Check app installation
adb shell pm list packages | grep edutrack

# Clear app data
adb shell pm clear com.edutrack.app

# View intent handling
adb logcat -s ActivityManager
```

## Additional Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Expo Router Deep Linking](https://docs.expo.dev/router/reference/linking/)

## Quick Test Script

### iOS Quick Test

```bash
#!/bin/bash
# test-ios-deep-links.sh

echo "Testing iOS Deep Links..."

echo "1. Testing assignment deep link"
xcrun simctl openurl booted edutrack://assignments/123

sleep 2

echo "2. Testing course deep link"
xcrun simctl openurl booted edutrack://courses/456

sleep 2

echo "3. Testing with query params"
xcrun simctl openurl booted "edutrack://assignments/123?source=test"

sleep 2

echo "4. Testing universal link"
xcrun simctl openurl booted https://edutrack.app/assignments/123

echo "✅ iOS deep link tests completed"
```

### Android Quick Test

```bash
#!/bin/bash
# test-android-deep-links.sh

echo "Testing Android Deep Links..."

echo "1. Testing assignment deep link"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app

sleep 2

echo "2. Testing course deep link"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://courses/456" com.edutrack.app

sleep 2

echo "3. Testing with query params"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123?source=test" com.edutrack.app

sleep 2

echo "4. Testing app link"
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app

echo "✅ Android deep link tests completed"
```

Make these scripts executable:
```bash
chmod +x test-ios-deep-links.sh
chmod +x test-android-deep-links.sh
```

## Conclusion

This guide covers all aspects of testing deep linking in the EduTrack mobile app. Follow the platform-specific instructions and use the verification checklist to ensure complete deep linking functionality.
