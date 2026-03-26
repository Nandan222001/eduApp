# Deep Linking Quick Reference

## 🚀 Quick Start

### Test Deep Links Immediately

```bash
# iOS Simulator
xcrun simctl openurl booted edutrack://assignments/123

# Android Emulator/Device
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app
```

### Run All Tests

```bash
# Validate configuration
node scripts/validate-deep-linking.js

# Run automated tests
npm test -- deepLinking

# Test iOS
./scripts/test-ios-deep-links.sh

# Test Android
./scripts/test-android-deep-links.sh
```

## 📝 Common Use Cases

### 1. Share Content

```typescript
import { shareAssignment, shareCourse } from '@utils';

// Share assignment
await shareAssignment('123', 'Math Homework');

// Share course
await shareCourse('456', 'Algebra 101');
```

### 2. Copy Link to Clipboard

```typescript
import { copyAssignmentLink, copyCourseLink } from '@utils';

await copyAssignmentLink('123');
await copyCourseLink('456');
```

### 3. Create Deep Link

```typescript
import { createDeepLink, deepLinkRoutes } from '@utils';

const link = createDeepLink(deepLinkRoutes.assignments('123'));
// Result: edutrack://assignments/123

const linkWithParams = createDeepLink(
  deepLinkRoutes.assignments('123'),
  { source: 'notification', priority: 'high' }
);
// Result: edutrack://assignments/123?source=notification&priority=high
```

### 4. Create Web Link

```typescript
import { createWebLink, deepLinkRoutes } from '@utils';

const webLink = createWebLink(deepLinkRoutes.assignments('123'));
// Result: https://edutrack.app/assignments/123
```

### 5. Handle Deep Link in Screen

```typescript
import { useLocalSearchParams } from 'expo-router';
import { sanitizeDeepLinkId, extractDeepLinkTracking } from '@utils';

export default function Screen() {
  const params = useLocalSearchParams();
  const id = sanitizeDeepLinkId(params.id);
  const tracking = extractDeepLinkTracking(params);
  
  // Use id and tracking data
}
```

### 6. Create Notification Deep Link

```typescript
import { createNotificationDeepLink } from '@utils';

const link = createNotificationDeepLink('assignment', '123', {
  priority: 'high',
  source: 'notification'
});
```

### 7. Create Email Deep Link

```typescript
import { createEmailDeepLink } from '@utils';

const link = createEmailDeepLink('assignment', '123', 'weekly_reminder');
// Includes UTM tracking parameters
```

## 🔗 Supported Routes

| Type | Function | Example URL |
|------|----------|-------------|
| Assignment | `deepLinkRoutes.assignments('123')` | `edutrack://assignments/123` |
| Course | `deepLinkRoutes.courses('456')` | `edutrack://courses/456` |
| Child | `deepLinkRoutes.children('789')` | `edutrack://children/789` |
| Message | `deepLinkRoutes.messages('101')` | `edutrack://messages/101` |
| Notification | `deepLinkRoutes.notifications('202')` | `edutrack://notifications/202` |
| Profile | `deepLinkRoutes.profile()` | `edutrack://profile` |
| Settings | `deepLinkRoutes.settings()` | `edutrack://settings` |
| Student Home | `deepLinkRoutes.studentHome()` | `edutrack://(tabs)/student` |
| Parent Home | `deepLinkRoutes.parentHome()` | `edutrack://(tabs)/parent` |

## 🧪 Test Commands

### iOS

```bash
# Assignment
xcrun simctl openurl booted edutrack://assignments/123

# Course
xcrun simctl openurl booted edutrack://courses/456

# With parameters
xcrun simctl openurl booted "edutrack://assignments/123?source=test"

# Universal link
xcrun simctl openurl booted https://edutrack.app/assignments/123

# List devices
xcrun simctl list devices | grep Booted
```

### Android

```bash
# Assignment
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" com.edutrack.app

# Course
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://courses/456" com.edutrack.app

# With parameters
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123?source=test" com.edutrack.app

# App link
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app

# Check device
adb devices
```

## 🛠️ Utility Functions

### Validation

```typescript
import { isValidDeepLink, sanitizeDeepLinkId } from '@utils';

// Validate URL
const isValid = isValidDeepLink('edutrack://assignments/123'); // true

// Sanitize ID
const safeId = sanitizeDeepLinkId(params.id); // Removes unsafe characters
```

### Normalization

```typescript
import { normalizeDeepLink } from '@utils';

// Convert HTTPS to custom scheme
const normalized = normalizeDeepLink('https://edutrack.app/assignments/123');
// Result: edutrack://assignments/123
```

### Tracking

```typescript
import { extractDeepLinkTracking, logDeepLinkNavigation } from '@utils';

// Extract tracking data
const tracking = extractDeepLinkTracking(params);
// Returns: { source, utm_source, utm_medium, utm_campaign, action }

// Log navigation
logDeepLinkNavigation('/assignments/123', params, userId);
```

## 📱 URL Formats

### Custom Scheme
```
edutrack://path/to/screen
edutrack://path/to/screen?param1=value1&param2=value2
```

### Universal/App Links
```
https://edutrack.app/path/to/screen
https://edutrack.app/path/to/screen?param1=value1
https://www.edutrack.app/path/to/screen
https://mobile.edutrack.app/path/to/screen
```

## 🎯 File Locations

| File | Purpose |
|------|---------|
| `src/utils/deepLinking.ts` | Core deep linking utilities |
| `src/utils/deepLinkingHelpers.ts` | Helper functions |
| `app/_layout.tsx` | Deep link handling logic |
| `app/assignments/[id].tsx` | Example dynamic route |
| `__tests__/unit/deepLinking.test.ts` | Unit tests |
| `__tests__/integration/deepLinking.test.tsx` | Integration tests |
| `scripts/validate-deep-linking.js` | Configuration validator |
| `scripts/test-ios-deep-links.sh` | iOS test script |
| `scripts/test-android-deep-links.sh` | Android test script |

## ⚙️ Configuration

### URL Scheme (app.json)
```json
{
  "expo": {
    "scheme": "edutrack"
  }
}
```

### iOS Bundle ID
```json
{
  "ios": {
    "bundleIdentifier": "com.edutrack.app"
  }
}
```

### Android Package
```json
{
  "android": {
    "package": "com.edutrack.app"
  }
}
```

## 🐛 Debug Commands

### iOS Debug
```bash
# View logs
xcrun simctl spawn booted log stream --predicate 'processImagePath CONTAINS "EduTrack"'

# List apps
xcrun simctl listapps booted

# Reset simulator
xcrun simctl erase booted
```

### Android Debug
```bash
# View logs
adb logcat | grep -i edutrack

# Check app
adb shell pm list packages | grep edutrack

# Clear app data
adb shell pm clear com.edutrack.app

# View intents
adb logcat -s ActivityManager
```

## ✅ Quick Checklist

Before testing:
- [ ] App installed on device/simulator
- [ ] Device/simulator is running
- [ ] For iOS: Simulator is booted
- [ ] For Android: Device connected via ADB

For production:
- [ ] Configuration validated
- [ ] All tests passing
- [ ] Tested on physical devices
- [ ] Server files deployed (`apple-app-site-association`, `assetlinks.json`)

## 📚 Documentation

- Full Implementation: `DEEP_LINKING_IMPLEMENTATION.md`
- Test Guide: `__tests__/DEEP_LINKING_TEST_GUIDE.md`
- Example Component: `src/components/DeepLinkingExample.tsx`

## 💡 Pro Tips

1. **Always use quotes** around URLs with query parameters in terminal
2. **Test both schemes**: `edutrack://` and `https://edutrack.app/`
3. **Check logs** for detailed error messages
4. **Use validation script** before manual testing
5. **Sanitize IDs** from route parameters for security
6. **Track deep links** for analytics insights

## 🔐 Security

Always sanitize user input from deep links:

```typescript
import { sanitizeDeepLinkId } from '@utils';

// ❌ Don't use raw params
const id = params.id;

// ✅ Sanitize first
const id = sanitizeDeepLinkId(params.id);
if (!id) {
  // Handle invalid ID
  return;
}
```

## 🎓 Learning Resources

1. Start with: `DEEP_LINKING_IMPLEMENTATION.md`
2. Review example: `src/components/DeepLinkingExample.tsx`
3. Run tests: `npm test -- deepLinking`
4. Try manual testing: `./scripts/test-ios-deep-links.sh`
5. Read full guide: `__tests__/DEEP_LINKING_TEST_GUIDE.md`
