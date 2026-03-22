# Deep Link Test Commands Reference

Quick reference for testing deep links on iOS and Android.

## Prerequisites

### iOS
- iOS Simulator running with app installed
- Run: `npm run ios` first

### Android
- Android Emulator or device connected
- ADB installed and configured
- Run: `npm run android` first

---

## Automated Test Scripts

### iOS
```bash
# Bash
./scripts/test-deep-links-ios.sh

# PowerShell
.\scripts\test-deep-links-ios.ps1
```

### Android
```bash
# Bash
./scripts/test-deep-links-android.sh

# PowerShell
.\scripts\test-deep-links-android.ps1
```

---

## Manual Test Commands

### iOS Simulator

#### Assignment Deep Link
```bash
xcrun simctl openurl booted edutrack://assignments/123
```

#### Course Deep Link
```bash
xcrun simctl openurl booted edutrack://courses/math-101
```

#### Notification Deep Link
```bash
xcrun simctl openurl booted edutrack://notifications/789
```

#### Message Deep Link
```bash
xcrun simctl openurl booted edutrack://messages/abc123
```

#### Profile Deep Link
```bash
xcrun simctl openurl booted edutrack://profile
```

#### Settings Deep Link
```bash
xcrun simctl openurl booted edutrack://settings
```

#### Universal Link (Web Link)
```bash
xcrun simctl openurl booted https://edutrack.app/assignments/123
```

#### Deep Link with Query Parameters
```bash
xcrun simctl openurl booted "edutrack://assignments/123?tab=details"
```

---

### Android Emulator/Device

#### Assignment Deep Link
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app
```

#### Course Deep Link
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://courses/math-101" com.edutrack.app
```

#### Notification Deep Link
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://notifications/789" com.edutrack.app
```

#### Message Deep Link
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://messages/abc123" com.edutrack.app
```

#### Profile Deep Link
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://profile" com.edutrack.app
```

#### Settings Deep Link
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://settings" com.edutrack.app
```

#### App Link (Web Link)
```bash
adb shell am start -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app
```

#### Deep Link with Query Parameters
```bash
adb shell am start -a android.intent.action.VIEW -d "edutrack://assignments/123?tab=details" com.edutrack.app
```

---

## Debugging Commands

### iOS

#### Check if Simulator is Running
```bash
xcrun simctl list devices | grep Booted
```

#### View Console Logs
```bash
# In Xcode: Window > Devices and Simulators > View Device Logs
# Or use Console.app and filter for "edutrack"
```

### Android

#### Check Connected Devices
```bash
adb devices
```

#### View Logcat for Deep Links
```bash
adb logcat | grep -i edutrack
```

#### Check Intent Filters
```bash
adb shell dumpsys package com.edutrack.app | grep -A 20 "android.intent.action.VIEW"
```

#### Clear App Data (if needed)
```bash
adb shell pm clear com.edutrack.app
```

---

## Testing Checklist

### Basic Navigation
- [ ] App opens to correct screen from deep link
- [ ] Dynamic parameters (e.g., assignment ID) are correctly passed
- [ ] Query parameters are correctly parsed
- [ ] Navigation stack is correct (can go back)

### Authentication
- [ ] Unauthenticated users redirect to login
- [ ] Return path is preserved after login
- [ ] Authenticated users navigate directly to target

### Edge Cases
- [ ] Invalid deep link URLs are handled gracefully
- [ ] Malformed parameters don't crash the app
- [ ] Deep links work when app is closed
- [ ] Deep links work when app is backgrounded
- [ ] Deep links work when app is in foreground

### Platform-Specific
#### iOS
- [ ] Custom scheme (edutrack://) works
- [ ] Universal Links (https://edutrack.app) work
- [ ] Links open app instead of browser
- [ ] Associated domains configured correctly

#### Android
- [ ] Custom scheme (edutrack://) works
- [ ] App Links (https://edutrack.app) work
- [ ] Intent filters configured correctly
- [ ] App link verification passes

---

## Common Issues

### iOS
**Universal Links open Safari instead of app**
- Links must be clicked from outside the app
- Check associated domains configuration
- Verify apple-app-site-association file is accessible

**Deep links not working**
- Rebuild app after changing scheme
- Check URL scheme in app.json

### Android
**App Links not verified**
- Check assetlinks.json is accessible
- Verify SHA256 fingerprint is correct
- Run: `adb shell pm get-app-links com.edutrack.app`

**Deep links not working**
- Clear app data: `adb shell pm clear com.edutrack.app`
- Rebuild app
- Check intent filters in manifest

---

## Additional Resources

- [Full Deep Linking Guide](./DEEP_LINKING_GUIDE.md)
- [Well-Known Files Configuration](./docs/WELL_KNOWN_FILES.md)
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
