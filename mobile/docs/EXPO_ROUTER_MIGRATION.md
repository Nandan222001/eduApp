# Expo Router Migration Guide

This document explains the migration from React Navigation to Expo Router, including architectural changes, removed files, and new patterns introduced.

## Table of Contents

- [Overview](#overview)
- [Removed Files](#removed-files)
- [Secure Storage Changes](#secure-storage-changes)
- [File-Based Routing](#file-based-routing)
- [Deep Linking Configuration](#deep-linking-configuration)
- [Platform-Specific Considerations](#platform-specific-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

The migration to Expo Router introduces file-based routing, similar to Next.js, replacing the imperative navigation approach of React Navigation. This change provides:

- **Type-safe routing** with automatic TypeScript types
- **Simplified deep linking** with automatic configuration
- **Better code organization** with file-system-based structure
- **Improved developer experience** with less boilerplate

## Removed Files

The following files were removed as part of the migration:

### `App.tsx`

**Purpose:** Previously served as the root component for React Navigation setup.

**Replaced by:** `app/_layout.tsx`

The root layout now uses Expo Router's `Slot` component instead of React Navigation's `NavigationContainer`. All provider setup (Redux, Theme, Query Client) remains in the layout file but navigation is handled by Expo Router.

### `RootNavigator.tsx` / `src/navigation/RootNavigator.tsx`

**Purpose:** Previously managed navigation stack and screen definitions.

**Replaced by:** File-based routing in the `app/` directory

Screen definitions are no longer needed. The file structure in `app/` automatically generates the navigation structure:

```
app/
├── (auth)/           → Auth screens group (hidden from URL)
├── (tabs)/          → Tab navigation group (hidden from URL)
├── assignments/     → Assignments stack screens
└── _layout.tsx      → Root layout and navigation logic
```

### Other Navigation Files

- **Navigation type definitions** - Replaced by Expo Router's auto-generated typed routes
- **Navigation helpers** - Replaced by `useRouter()`, `useSegments()`, and `router.replace()`
- **Stack/Tab navigators** - Replaced by layout files (`_layout.tsx`) in each directory

## Secure Storage Changes

### Web Compatibility Issue

**Problem:** `expo-secure-store` does not support web platforms, causing runtime errors when running the app in a browser.

**Solution:** Implemented a platform-aware storage abstraction layer.

### Implementation (`src/utils/secureStorage.ts`)

```typescript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy load SecureStore only on native platforms
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// Storage abstraction layer
const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
```

### Security Considerations

- **Native platforms (iOS/Android):** Uses `expo-secure-store` which provides hardware-backed encryption
- **Web platform:** Uses `AsyncStorage` which stores data in localStorage (less secure)
- **Production recommendation:** For sensitive production data on web, consider additional encryption or use cookies with httpOnly flag

### Migration Impact

No changes needed to existing code using `secureStorage` API. The abstraction layer handles platform detection automatically:

```typescript
// Works on all platforms
await secureStorage.setAccessToken(token);
const token = await secureStorage.getAccessToken();
```

## File-Based Routing

### Directory Structure

Expo Router uses the file system to generate routes automatically:

```
app/
├── _layout.tsx              → Root layout (wraps all routes)
├── index.tsx                → Entry point (/)
├── +not-found.tsx           → 404 page
├── +html.tsx                → HTML wrapper for web
│
├── (auth)/                  → Group (not in URL path)
│   ├── _layout.tsx          → Auth layout
│   ├── login.tsx            → /login
│   ├── register.tsx         → /register
│   ├── forgot-password.tsx  → /forgot-password
│   ├── otp-login.tsx        → /otp-login
│   ├── otp-verify.tsx       → /otp-verify
│   └── reset-password.tsx   → /reset-password
│
├── (tabs)/                  → Tab navigation group
│   ├── _layout.tsx          → Tabs layout & config
│   ├── student/             → Student role tabs
│   │   ├── _layout.tsx      → Student tab layout
│   │   ├── index.tsx        → /student (Dashboard)
│   │   ├── assignments.tsx  → /student/assignments
│   │   ├── grades.tsx       → /student/grades
│   │   ├── schedule.tsx     → /student/schedule
│   │   └── profile.tsx      → /student/profile
│   └── parent/              → Parent role tabs
│       └── _layout.tsx
│
├── assignments/             → Assignment detail stack
│   ├── [id].tsx            → /assignments/:id
│   └── [id]/
│       └── submit.tsx      → /assignments/:id/submit
│
├── courses/
│   └── [id].tsx            → /courses/:id
│
├── messages/
│   ├── index.tsx           → /messages
│   └── [id].tsx            → /messages/:id
│
├── children/
│   └── [id]/
│       └── [tab].tsx       → /children/:id/:tab
│
├── settings.tsx            → /settings
├── profile.tsx             → /profile
└── notifications.tsx       → /notifications
```

### File Naming Conventions

| Pattern | Purpose | Example |
|---------|---------|---------|
| `_layout.tsx` | Layout component (wraps child routes) | `app/_layout.tsx` |
| `index.tsx` | Default route for a directory | `app/index.tsx` → `/` |
| `[param].tsx` | Dynamic route parameter | `[id].tsx` → `/assignments/:id` |
| `(group)/` | Route group (hidden from URL) | `(auth)/login.tsx` → `/login` |
| `+not-found.tsx` | 404 page | `app/+not-found.tsx` |
| `filename.tsx` | Regular route | `settings.tsx` → `/settings` |

### Navigation Patterns

#### 1. Programmatic Navigation

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  // Navigate to a route
  router.push('/assignments/123');
  
  // Replace current route
  router.replace('/(auth)/login');
  
  // Go back
  router.back();
  
  // Navigate with params
  router.push({
    pathname: '/assignments/[id]',
    params: { id: '123' }
  });
}
```

#### 2. Link Component

```typescript
import { Link } from 'expo-router';

<Link href="/assignments/123">View Assignment</Link>

// With params
<Link 
  href={{
    pathname: '/assignments/[id]',
    params: { id: assignment.id }
  }}
>
  View Assignment
</Link>
```

#### 3. Accessing Route Parameters

```typescript
import { useLocalSearchParams } from 'expo-router';

function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Use id...
}
```

#### 4. Protected Routes

Implemented in `app/_layout.tsx` using `useSegments()` and `useRouter()`:

```typescript
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/student');
    }
  }, [isAuthenticated, segments, isLoading]);
}
```

## Deep Linking Configuration

### URL Scheme Configuration

Configured in `app.json`:

```json
{
  "expo": {
    "scheme": "edutrack",
    "ios": {
      "associatedDomains": ["applinks:edutrack.app"]
    },
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
}
```

### Supported URL Formats

Expo Router automatically supports multiple URL formats:

#### Custom Scheme
```
edutrack://assignments/123
edutrack://login
edutrack://student/grades
```

#### Universal Links (iOS)
```
https://edutrack.app/assignments/123
https://edutrack.app/login
https://edutrack.app/student/grades
```

#### App Links (Android)
```
https://edutrack.app/assignments/123
https://edutrack.app/login
https://edutrack.app/student/grades
```

### Testing Deep Links

#### iOS Simulator
```bash
xcrun simctl openurl booted edutrack://assignments/123
xcrun simctl openurl booted https://edutrack.app/assignments/123
```

#### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123"
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123"
```

#### Web Browser
```
http://localhost:8081/assignments/123
http://localhost:8081/login
```

### Dynamic Route Deep Linking

Dynamic routes automatically work with deep links:

```
edutrack://assignments/123      → app/assignments/[id].tsx (id = "123")
edutrack://courses/math101       → app/courses/[id].tsx (id = "math101")
edutrack://children/child1/grades → app/children/[id]/[tab].tsx (id = "child1", tab = "grades")
```

## Platform-Specific Considerations

### iOS

#### Associated Domains

1. Add `applinks:edutrack.app` to the app's associated domains in `app.json`
2. Configure Apple App Site Association (AASA) file on your server at:
   ```
   https://edutrack.app/.well-known/apple-app-site-association
   ```

Example AASA file:
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

#### Info.plist Considerations

Expo automatically configures URL schemes. For custom configurations, use `expo-build-properties`:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": {
          "infoPlist": {
            "CFBundleURLTypes": [
              {
                "CFBundleURLSchemes": ["edutrack"]
              }
            ]
          }
        }
      }
    ]
  ]
}
```

### Android

#### Intent Filters

Configured in `app.json` under `android.intentFilters`. The configuration enables:

- Custom scheme (`edutrack://`)
- HTTPS universal links with auto-verification
- Proper category flags for browser integration

#### Digital Asset Links

Configure Digital Asset Links file on your server at:
```
https://edutrack.app/.well-known/assetlinks.json
```

Example assetlinks.json:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.edutrack.app",
      "sha256_cert_fingerprints": [
        "XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
      ]
    }
  }
]
```

#### Getting Certificate Fingerprint

```bash
# For release builds
keytool -list -v -keystore release.keystore -alias release

# For debug builds
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Web

#### Routing Configuration

The web bundler is configured in `app.json`:

```json
{
  "web": {
    "bundler": "metro",
    "output": "single"
  }
}
```

#### HTML5 History API

Expo Router automatically uses the HTML5 History API for clean URLs:

```
https://yourdomain.com/assignments/123    (Clean URLs)
vs
https://yourdomain.com/#/assignments/123  (Hash-based - not used)
```

#### Server Configuration

For production deployments, configure your web server to serve `index.html` for all routes:

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

#### localStorage vs SecureStore

On web, secure storage falls back to AsyncStorage (localStorage). Consider:

- Data is not encrypted in localStorage
- Data persists across sessions
- Subject to browser storage limits (usually 5-10MB)
- Can be cleared by users

### Splash Screen Handling

Platform-specific splash screen logic in `app/_layout.tsx`:

```typescript
// Prevent splash screen from auto-hiding (only on native platforms)
if (Platform.OS !== 'web') {
  const SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync();
}

// Later, after initialization:
if (Platform.OS !== 'web') {
  const SplashScreen = require('expo-splash-screen');
  await SplashScreen.hideAsync();
}
```

### Offline Support

Offline functionality initialization (native only):

```typescript
if (Platform.OS !== 'web') {
  await initializeOfflineSupport();
}
```

## Troubleshooting

### Common Issues

#### 1. "No route matches URL" Error

**Problem:** Navigating to a route that doesn't exist in the file system.

**Solutions:**
- Check that the file exists in the `app/` directory
- Verify the file is named correctly (e.g., `[id].tsx` for dynamic routes)
- Ensure `_layout.tsx` exists in parent directories
- Clear Metro bundler cache: `npx expo start -c`

**Example:**
```typescript
// ❌ Wrong - file doesn't exist
router.push('/assignments/details');

// ✅ Correct - matches app/assignments/[id].tsx
router.push('/assignments/123');
```

#### 2. Infinite Redirect Loop

**Problem:** Navigation guard causes continuous redirects.

**Cause:** Usually from missing `isLoading` check or incorrect segment detection.

**Solution:**
```typescript
// ✅ Correct - wait for auth to load
useEffect(() => {
  if (isLoading) return; // Important!
  
  const inAuthGroup = segments[0] === '(auth)';
  // ... navigation logic
}, [isAuthenticated, segments, isLoading]);

// ❌ Wrong - doesn't check isLoading
useEffect(() => {
  if (!isAuthenticated) {
    router.replace('/(auth)/login');
  }
}, [isAuthenticated]);
```

#### 3. Deep Links Not Working on iOS

**Checklist:**
- [ ] Verify `associatedDomains` in `app.json`
- [ ] Check AASA file is accessible at `https://yourdomain.com/.well-known/apple-app-site-association`
- [ ] Ensure AASA file has correct Team ID and Bundle ID
- [ ] AASA file must be served with `Content-Type: application/json`
- [ ] AASA file must be accessible via HTTPS (not HTTP)
- [ ] Rebuild the app after AASA changes
- [ ] Test on a real device (not simulator) for universal links

**Debug AASA:**
```bash
# Test AASA file
curl -v https://edutrack.app/.well-known/apple-app-site-association

# View system logs on device
idevicesyslog | grep swcd
```

#### 4. Deep Links Not Working on Android

**Checklist:**
- [ ] Verify `intentFilters` in `app.json`
- [ ] Check Digital Asset Links file at `https://yourdomain.com/.well-known/assetlinks.json`
- [ ] Ensure certificate fingerprint matches your app signing key
- [ ] Set `autoVerify: true` in intent filter
- [ ] Rebuild the app after configuration changes
- [ ] Test on a real device

**Test intent filter:**
```bash
# Check if intent filter is registered
adb shell dumpsys package com.edutrack.app | grep -A 10 "android.intent.action.VIEW"

# Test deep link
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app
```

#### 5. Web Build Errors with SecureStore

**Problem:** `expo-secure-store` import errors on web build.

**Cause:** SecureStore is not available on web.

**Solution:** Already fixed in `secureStorage.ts` with lazy loading:
```typescript
// ✅ Correct - lazy load
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// ❌ Wrong - loads on all platforms
import * as SecureStore from 'expo-secure-store';
```

#### 6. Navigation Props Not Available

**Problem:** Screen components don't receive `navigation` and `route` props.

**Cause:** Expo Router doesn't use these props.

**Solution:** Use Expo Router hooks instead:
```typescript
// ❌ React Navigation pattern (old)
function Screen({ navigation, route }) {
  navigation.navigate('Details', { id: route.params.id });
}

// ✅ Expo Router pattern (new)
import { useRouter, useLocalSearchParams } from 'expo-router';

function Screen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  router.push(`/details/${params.id}`);
}
```

#### 7. Tab Navigator Not Showing

**Problem:** Tabs don't appear after migration.

**Causes:**
- Missing `_layout.tsx` in `(tabs)` directory
- Layout doesn't render `<Tabs>` component
- Incorrect group name in route

**Solution:** Check `app/(tabs)/student/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router';

export default function StudentLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="assignments" options={{ title: 'Assignments' }} />
      {/* More tabs... */}
    </Tabs>
  );
}
```

#### 8. Type Errors with Typed Routes

**Problem:** TypeScript errors when navigating to routes.

**Solution:** 
1. Ensure `experiments.typedRoutes` is enabled in `app.json`
2. Restart TypeScript server in your IDE
3. Delete `.expo` directory and restart Metro
4. Use proper type imports:

```typescript
import { Href } from 'expo-router';

const route: Href = '/(tabs)/student';
router.push(route);
```

#### 9. Params Not Available in Nested Routes

**Problem:** Parent route params not accessible in child routes.

**Solution:** Use `useGlobalSearchParams()` instead of `useLocalSearchParams()`:

```typescript
import { useGlobalSearchParams } from 'expo-router';

function ChildScreen() {
  // Gets all params from parent routes too
  const params = useGlobalSearchParams();
}
```

#### 10. Metro Bundler Cache Issues

**Symptoms:**
- Old files still being referenced
- Routes not updating after file changes
- TypeScript errors persisting after fixes

**Solution:**
```bash
# Clear all caches
npx expo start -c

# Or manually delete cache directories
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro
```

### Debug Tools

#### Enable Expo Router Debug Logging

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { useNavigationContainerRef } from 'expo-router';

export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef) {
      const state = navigationRef.getRootState();
      console.log('Navigation state:', JSON.stringify(state, null, 2));
    }
  }, [navigationRef]);

  // ... rest of layout
}
```

#### View Current Route

```typescript
import { useSegments, usePathname } from 'expo-router';

function DebugComponent() {
  const segments = useSegments();
  const pathname = usePathname();
  
  console.log('Current segments:', segments);
  console.log('Current pathname:', pathname);
}
```

### Getting Help

If you encounter issues not covered here:

1. Check [Expo Router documentation](https://docs.expo.dev/router/introduction/)
2. Search [Expo Router GitHub issues](https://github.com/expo/expo/labels/Router)
3. Review migration checklist in this document
4. Check Metro bundler logs for detailed error messages
5. Test in development mode with `npx expo start` for better error messages

### Migration Checklist

When migrating a screen from React Navigation to Expo Router:

- [ ] Move screen file to appropriate location in `app/` directory
- [ ] Replace `navigation` prop with `useRouter()` hook
- [ ] Replace `route.params` with `useLocalSearchParams()` or `useGlobalSearchParams()`
- [ ] Update all navigation calls to use new router methods
- [ ] Replace `<Link>` component imports from `@react-navigation/native` to `expo-router`
- [ ] Update navigation type definitions to use Expo Router types
- [ ] Remove screen from old navigator configuration
- [ ] Test all navigation flows
- [ ] Test deep linking
- [ ] Update related tests

---

**Last Updated:** December 2024  
**Expo Router Version:** Latest (with typed routes support)  
**Expo SDK Version:** 50+
