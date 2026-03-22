# Expo Router Migration Guide

This comprehensive guide documents the migration from React Navigation to Expo Router, including architectural changes, removed files, new patterns, platform-specific considerations, and troubleshooting steps.

## Table of Contents

- [Overview](#overview)
- [Removed Files](#removed-files)
- [New File-Based Routing Structure](#new-file-based-routing-structure)
- [Platform-Specific Storage Handling](#platform-specific-storage-handling)
- [Navigation Patterns](#navigation-patterns)
- [Deep Linking Configuration](#deep-linking-configuration)
- [Platform-Specific Considerations](#platform-specific-considerations)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Testing Checklist](#testing-checklist)
- [Developer Setup Instructions](#developer-setup-instructions)

---

## Overview

The migration to Expo Router introduces file-based routing, similar to Next.js, replacing the imperative navigation approach of React Navigation. This change provides:

- **Type-safe routing** with automatic TypeScript types
- **Simplified deep linking** with automatic configuration
- **Better code organization** with file-system-based structure
- **Improved developer experience** with less boilerplate
- **Universal app support** for web, iOS, and Android from a single codebase

### Key Benefits

1. **Automatic route generation**: File structure defines routes automatically
2. **Type safety**: Routes are typed based on file structure
3. **SEO-friendly**: Web URLs match your file structure
4. **Deep linking**: Works out of the box with minimal configuration
5. **Code splitting**: Automatic lazy loading for better performance

---

## Removed Files

The following legacy files were removed as part of the migration:

### 1. `App.tsx` (Root Component)

**Previous Location:** `mobile/App.tsx`

**Purpose:** Served as the root component for React Navigation setup. Managed:
- `NavigationContainer` wrapper
- Redux Provider setup
- Theme Provider configuration
- Authentication state initialization
- Navigation linking configuration

**Replaced By:** `app/_layout.tsx`

**Key Changes:**
- Uses `Slot` component instead of `NavigationContainer`
- All provider setup remains but navigation is handled by Expo Router
- Route protection logic moved to layout effects
- Deep linking handled by Expo Router automatically

**Migration Example:**

```typescript
// ❌ OLD: App.tsx with React Navigation
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}

// ✅ NEW: app/_layout.tsx with Expo Router
import { Slot } from 'expo-router';
import { Provider } from 'react-redux';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Slot />
    </Provider>
  );
}
```

### 2. `RootNavigator.tsx` and Navigation Files

**Previous Locations:**
- `src/navigation/RootNavigator.tsx`
- `src/navigation/MainNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/StudentNavigator.tsx`
- `src/navigation/ParentNavigator.tsx`
- `src/navigation/StudentTabNavigator.tsx`
- `src/navigation/ParentTabNavigator.tsx`

**Purpose:** 
- Defined navigation stacks and screen configurations
- Managed screen transitions and options
- Configured tab navigators
- Handled navigation type definitions

**Replaced By:** File-based routing structure in `app/` directory with `_layout.tsx` files

**What Happened to Each:**

| Old Navigator | New Approach | Location |
|---------------|--------------|----------|
| `RootNavigator` | Root layout with route guards | `app/_layout.tsx` |
| `AuthNavigator` | Auth group layout | `app/(auth)/_layout.tsx` |
| `StudentTabNavigator` | Student tabs layout | `app/(tabs)/student/_layout.tsx` |
| `ParentTabNavigator` | Parent tabs layout | `app/(tabs)/parent/_layout.tsx` |
| `MainNavigator` | Tabs group layout | `app/(tabs)/_layout.tsx` |

### 3. Navigation Type Definitions

**Previous Files:**
- `src/types/navigation.ts`
- Custom route param types
- Screen prop types

**Replaced By:** Expo Router's auto-generated typed routes

**Example:**

```typescript
// ❌ OLD: Manual type definitions
export type RootStackParamList = {
  Login: undefined;
  AssignmentDetail: { id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AssignmentDetail'>;

// ✅ NEW: Auto-generated types (no manual definition needed)
import { useLocalSearchParams } from 'expo-router';

function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
}
```

### 4. Navigation Linking Configuration

**Previous Configuration:** Manual linking config in `App.tsx`

```typescript
// ❌ OLD: Manual linking configuration
const linking = {
  prefixes: ['edutrack://', 'https://edutrack.app'],
  config: {
    screens: {
      Login: 'login',
      AssignmentDetail: 'assignments/:id',
    },
  },
};
```

**Replaced By:** Automatic linking based on file structure with configuration in `app.json`

---

## New File-Based Routing Structure

### Directory Structure Overview

```
app/
├── _layout.tsx              → Root layout (wraps all routes, handles auth)
├── index.tsx                → Entry point (/) - redirects based on auth
├── +not-found.tsx           → 404 page
├── +html.tsx                → HTML wrapper for web platform
│
├── (auth)/                  → Auth group (parentheses hide from URL)
│   ├── _layout.tsx          → Auth stack layout
│   ├── login.tsx            → /login
│   ├── register.tsx         → /register
│   ├── forgot-password.tsx  → /forgot-password
│   ├── otp-login.tsx        → /otp-login
│   ├── otp-verify.tsx       → /otp-verify
│   └── reset-password.tsx   → /reset-password
│
├── (tabs)/                  → Tab navigation group
│   ├── _layout.tsx          → Main tabs layout (role router)
│   ├── student/             → Student role tabs
│   │   ├── _layout.tsx      → Student tab bar configuration
│   │   ├── index.tsx        → /student (Dashboard)
│   │   ├── assignments.tsx  → /student/assignments
│   │   ├── grades.tsx       → /student/grades
│   │   ├── schedule.tsx     → /student/schedule
│   │   ├── profile.tsx      → /student/profile
│   │   ├── ai-predictions.tsx     → /student/ai-predictions (hidden tab)
│   │   ├── homework-scanner.tsx   → /student/homework-scanner (hidden tab)
│   │   └── study-buddy.tsx        → /student/study-buddy (hidden tab)
│   └── parent/              → Parent role tabs
│       ├── _layout.tsx      → Parent tab bar configuration
│       ├── index.tsx        → /parent (Dashboard)
│       ├── children.tsx     → /parent/children
│       ├── communication.tsx → /parent/communication
│       ├── reports.tsx      → /parent/reports
│       └── profile.tsx      → /parent/profile
│
├── assignments/             → Assignment stack screens
│   └── [id].tsx            → /assignments/:id (dynamic route)
│
├── courses/                 → Course stack screens
│   └── [id].tsx            → /courses/:id
│
├── children/                → Children detail screens
│   └── [id].tsx            → /children/:id
│
├── messages/                → Messaging screens
│   ├── index.tsx           → /messages (list)
│   └── [id].tsx            → /messages/:id (conversation)
│
├── notifications/           → Notification screens
│   ├── _layout.tsx         → Notifications stack layout
│   ├── index.tsx           → /notifications (list)
│   └── [id].tsx            → /notifications/:id (detail)
│
├── profile.tsx              → /profile (global profile)
└── settings.tsx             → /settings (global settings)
```

### File Naming Conventions

| Pattern | Purpose | Example | URL |
|---------|---------|---------|-----|
| `_layout.tsx` | Layout component (wraps child routes) | `app/_layout.tsx` | N/A (wrapper only) |
| `index.tsx` | Default route for directory | `app/student/index.tsx` | `/student` |
| `[param].tsx` | Dynamic route parameter | `assignments/[id].tsx` | `/assignments/123` |
| `[...param].tsx` | Catch-all dynamic route | `docs/[...slug].tsx` | `/docs/a/b/c` |
| `(group)/` | Route group (hidden from URL) | `(auth)/login.tsx` | `/login` (not `/auth/login`) |
| `+not-found.tsx` | 404 error page | `app/+not-found.tsx` | Any unmatched route |
| `+html.tsx` | Web-only HTML root | `app/+html.tsx` | N/A (HTML wrapper) |
| `filename.tsx` | Regular route | `settings.tsx` | `/settings` |
| `filename.web.tsx` | Web-specific route | `scanner.web.tsx` | `/scanner` (web only) |
| `filename.native.tsx` | Native-specific route | `camera.native.tsx` | `/camera` (iOS/Android only) |

### Layout Files Explained

Layout files (`_layout.tsx`) wrap child routes and provide shared UI/logic:

**Root Layout** (`app/_layout.tsx`):
- Sets up providers (Redux, Theme, Query Client)
- Implements authentication guards
- Handles deep linking
- Manages app initialization
- Wraps all routes with common functionality

**Group Layouts** (`app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`):
- Configure navigation patterns (Stack, Tabs, etc.)
- Set screen options (headers, styling)
- Provide group-specific context

**Example Tab Layout:**

```typescript
// app/(tabs)/student/_layout.tsx
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" type="material" color={color} size={size} />
          ),
        }}
      />
      {/* Hidden tabs (accessible via navigation but not in tab bar) */}
      <Tabs.Screen
        name="ai-predictions"
        options={{
          title: 'AI Predictions',
          href: null, // Hides from tab bar
        }}
      />
    </Tabs>
  );
}
```

---

## Platform-Specific Storage Handling

### The Problem: SecureStore Web Incompatibility

**Issue:** `expo-secure-store` provides hardware-backed encryption on native platforms but is not available on web, causing runtime errors:

```
Error: expo-secure-store is not available on web
```

### The Solution: Platform-Aware Storage Abstraction

**Implementation:** `src/utils/secureStorage.ts`

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

export const secureStorage = {
  setAccessToken: async (token: string) => {
    await storage.setItem('accessToken', token);
  },
  
  getAccessToken: async () => {
    return await storage.getItem('accessToken');
  },
  
  // ... more methods
};
```

### Platform Storage Comparison

| Aspect | Native (iOS/Android) | Web |
|--------|---------------------|-----|
| **Backend** | expo-secure-store | AsyncStorage (localStorage) |
| **Encryption** | Hardware-backed (Keychain/Keystore) | None (plain text) |
| **Security** | High - OS-level encryption | Low - readable in dev tools |
| **Persistence** | Survives app reinstall (iOS Keychain) | Cleared when cache cleared |
| **Size Limit** | ~2KB per item (iOS), ~1MB (Android) | ~5-10MB total (browser dependent) |
| **Access** | App-only | Browser-accessible |

### Security Considerations

#### For Native Platforms (iOS/Android):

✅ **Secure:**
- Uses hardware-backed encryption (Keychain on iOS, Keystore on Android)
- Data encrypted at rest
- Requires device authentication to access in some cases
- Data survives app reinstalls (iOS)

#### For Web Platform:

⚠️ **Less Secure:**
- Stored in browser's localStorage (plain text)
- Accessible via browser dev tools
- No encryption by default
- Cleared when user clears browser cache

**Production Recommendations for Web:**
1. **Use HTTPOnly Cookies**: For session tokens, prefer server-side cookies
2. **Implement Encryption**: Encrypt sensitive data before storing in localStorage
3. **Short-Lived Tokens**: Use refresh token rotation and short access token expiry
4. **Content Security Policy**: Implement CSP headers to prevent XSS attacks
5. **Secure HTTPS**: Always use HTTPS in production

### Migration Impact

**Good News:** No code changes needed! The abstraction layer handles everything:

```typescript
// Works on all platforms (iOS, Android, Web)
await secureStorage.setAccessToken(token);
const token = await secureStorage.getAccessToken();
await secureStorage.clearTokens();
```

### Platform-Specific Features

#### Native-Only Features

Some features are automatically disabled on web:

```typescript
// In app/_layout.tsx
if (Platform.OS !== 'web') {
  // Native-only: Splash screen
  const SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync();
  
  // Native-only: Offline support
  await initializeOfflineSupport();
  
  // Native-only: Background sync
  await setupBackgroundSync();
}
```

#### Web Stubs for Native Modules

Native-only modules are stubbed for web (see `src/utils/stubs/*.web.ts`):

```typescript
// src/utils/stubs/auth.web.ts
export const hasHardwareAsync = async () => false;
export const authenticateAsync = async () => ({ success: false });
```

**Configured in `webpack.config.js`:**

```javascript
config.resolve.alias = {
  'expo-camera': path.resolve(__dirname, 'src/utils/stubs/camera.web.ts'),
  'expo-local-authentication': path.resolve(__dirname, 'src/utils/stubs/auth.web.ts'),
  'expo-notifications': path.resolve(__dirname, 'src/utils/stubs/notifications.web.ts'),
  // ... more stubs
};
```

---

## Navigation Patterns

### 1. Programmatic Navigation

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  // Push new route (can go back)
  router.push('/assignments/123');
  
  // Replace current route (cannot go back)
  router.replace('/(auth)/login');
  
  // Go back
  router.back();
  
  // Navigate with params
  router.push({
    pathname: '/assignments/[id]',
    params: { id: '123', mode: 'edit' }
  });
  
  // Navigate to external URL
  router.push('https://example.com');
}
```

### 2. Link Component

```typescript
import { Link } from 'expo-router';

// Simple link
<Link href="/assignments/123">View Assignment</Link>

// Link with params
<Link 
  href={{
    pathname: '/assignments/[id]',
    params: { id: assignment.id, mode: 'view' }
  }}
>
  View Assignment
</Link>

// Replace instead of push
<Link href="/login" replace>
  Back to Login
</Link>

// External link
<Link href="https://example.com" target="_blank">
  External Site
</Link>
```

### 3. Accessing Route Parameters

```typescript
import { useLocalSearchParams, useGlobalSearchParams } from 'expo-router';

function AssignmentDetail() {
  // Local params (current route only)
  const local = useLocalSearchParams<{ id: string }>();
  console.log(local.id); // "123"
  
  // Global params (includes parent route params)
  const global = useGlobalSearchParams<{ id: string; childId?: string }>();
  console.log(global.id, global.childId);
}
```

### 4. Getting Current Route

```typescript
import { usePathname, useSegments } from 'expo-router';

function NavigationInfo() {
  const pathname = usePathname(); // "/assignments/123"
  const segments = useSegments(); // ["assignments", "123"]
  
  const isAuthRoute = segments[0] === '(auth)';
  const isTabRoute = segments[0] === '(tabs)';
}
```

### 5. Protected Routes Pattern

Implemented in `app/_layout.tsx`:

```typescript
import { useRouter, useSegments } from 'expo-router';
import { useAppSelector } from '@store/hooks';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, activeRole } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize
    
    const inAuthGroup = segments[0] === '(auth)';
    
    // Redirect to login if not authenticated
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // Redirect to app if authenticated and on auth screen
    else if (isAuthenticated && inAuthGroup) {
      if (activeRole === 'parent') {
        router.replace('/(tabs)/parent');
      } else {
        router.replace('/(tabs)/student');
      }
    }
  }, [isAuthenticated, activeRole, segments, isLoading]);

  return <Slot />;
}
```

### 6. Modal Routes

```typescript
// Defined in layout
<Stack>
  <Stack.Screen name="home" />
  <Stack.Screen 
    name="modal" 
    options={{
      presentation: 'modal',
      animation: 'slide_from_bottom',
    }} 
  />
</Stack>

// Navigate to modal
router.push('/modal');
```

### 7. Nested Navigation

```typescript
// Parent: app/courses/[id].tsx
function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Nested link to lessons
  return (
    <Link href={`/courses/${id}/lessons`}>
      View Lessons
    </Link>
  );
}

// Child: app/courses/[id]/lessons.tsx
function CourseLessons() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Still has access to parent's id param
}
```

---

## Deep Linking Configuration

### URL Scheme Configuration

Configured in `app.json`:

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

### Supported URL Formats

Expo Router automatically supports multiple URL formats:

#### 1. Custom Scheme (All Platforms)
```
edutrack://login
edutrack://assignments/123
edutrack://student/grades
edutrack://courses/math101?tab=materials
```

#### 2. Universal Links (iOS)
```
https://edutrack.app/login
https://edutrack.app/assignments/123
https://edutrack.app/student/grades
```

#### 3. App Links (Android)
```
https://edutrack.app/login
https://edutrack.app/assignments/123
https://edutrack.app/student/grades
```

#### 4. Web URLs (Development/Production)
```
http://localhost:8081/login
https://edutrack.app/assignments/123
```

### Dynamic Route Deep Linking

Dynamic routes automatically work with deep links:

```
URL: edutrack://assignments/123
Maps to: app/assignments/[id].tsx
Params: { id: "123" }

URL: edutrack://courses/math101?tab=materials
Maps to: app/courses/[id].tsx
Params: { id: "math101", tab: "materials" }

URL: edutrack://children/child1/grades
Maps to: app/children/[id]/[tab].tsx
Params: { id: "child1", tab: "grades" }
```

### Testing Deep Links

#### iOS Simulator
```bash
# Custom scheme
xcrun simctl openurl booted edutrack://assignments/123

# Universal link
xcrun simctl openurl booted https://edutrack.app/assignments/123

# With parameters
xcrun simctl openurl booted "edutrack://courses/math101?tab=materials"
```

#### Android Emulator/Device
```bash
# Custom scheme
adb shell am start -W -a android.intent.action.VIEW \
  -d "edutrack://assignments/123" \
  com.edutrack.app

# App link
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://edutrack.app/assignments/123" \
  com.edutrack.app

# With parameters
adb shell am start -W -a android.intent.action.VIEW \
  -d "edutrack://courses/math101?tab=materials" \
  com.edutrack.app
```

#### Web Browser (Development)
```bash
# Start dev server
npm start

# Navigate in browser to:
http://localhost:8081/assignments/123
http://localhost:8081/student/grades
http://localhost:8081/login?returnUrl=/assignments/123
```

#### Real Device Testing

**iOS:**
1. Create a note in Notes app
2. Type the deep link URL (e.g., `edutrack://assignments/123`)
3. Tap the link
4. Choose "Open in EduTrack" when prompted

**Android:**
1. Send yourself an SMS or email with the link
2. Tap the link in the message
3. Choose "EduTrack" from the app picker

---

## Platform-Specific Considerations

### iOS Configuration

#### 1. Associated Domains Setup

**In `app.json`:**
```json
{
  "ios": {
    "associatedDomains": [
      "applinks:edutrack.app",
      "applinks:*.edutrack.app"
    ]
  }
}
```

#### 2. Apple App Site Association (AASA) File

**Server Configuration Required:**

Create file at: `https://edutrack.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.edutrack.app",
        "paths": [
          "/assignments/*",
          "/courses/*",
          "/student/*",
          "/parent/*",
          "/login",
          "/register"
        ]
      }
    ]
  }
}
```

**Requirements:**
- Must be served over HTTPS (not HTTP)
- Must return `Content-Type: application/json`
- Must be accessible without authentication
- Replace `TEAMID` with your Apple Team ID
- No file extension (.json) in the filename

**Verify AASA:**
```bash
curl -v https://edutrack.app/.well-known/apple-app-site-association
```

#### 3. iOS Capabilities

- Enable "Associated Domains" in Xcode (handled by EAS Build)
- Add domains with `applinks:` prefix
- Test on real device (simulator has limitations)

### Android Configuration

#### 1. Intent Filters

Already configured in `app.json` - handles both custom schemes and App Links.

#### 2. Digital Asset Links File

**Server Configuration Required:**

Create file at: `https://edutrack.app/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.edutrack.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

**Get Certificate Fingerprint:**

```bash
# For debug builds
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android | grep SHA256

# For release builds (use your keystore)
keytool -list -v -keystore release.keystore \
  -alias release | grep SHA256
```

**Verify Asset Links:**
```bash
curl https://edutrack.app/.well-known/assetlinks.json
```

#### 3. Testing Intent Filters

```bash
# Verify intent filter is registered
adb shell dumpsys package com.edutrack.app | grep -A 10 "android.intent.action.VIEW"

# Test App Link verification
adb shell pm get-app-links com.edutrack.app
```

### Web Configuration

#### 1. Metro Bundler Setup

**`app.json` web configuration:**
```json
{
  "web": {
    "bundler": "metro",
    "output": "single",
    "favicon": "./assets/favicon.png"
  }
}
```

#### 2. HTML5 History API

Expo Router automatically uses clean URLs (no hash routing):

```
✅ https://edutrack.app/assignments/123
❌ https://edutrack.app/#/assignments/123
```

#### 3. Server Configuration for SPAs

**Required:** Configure server to serve `index.html` for all routes.

**Nginx:**
```nginx
server {
  listen 80;
  server_name edutrack.app;
  root /var/www/edutrack;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Optional: Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

**Apache (`.htaccess`):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Vercel (`vercel.json`):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Netlify (`_redirects` file):**
```
/*    /index.html   200
```

#### 4. MIME Type Configuration

Already configured in `metro.config.js`:

```javascript
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set proper MIME types
      if (req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (req.url.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      // ... more types
      return middleware(req, res, next);
    };
  },
};
```

#### 5. Web Performance Optimizations

**Implemented in `webpack.config.js`:**

```javascript
// Code splitting for better performance
config.optimization = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
      },
    },
  },
};

// Bundle size limits
config.performance = {
  maxAssetSize: 2000000,      // 2MB
  maxEntrypointSize: 2000000, // 2MB
};
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. MIME Type Errors on Web

**Error:**
```
Failed to load module script: Expected a JavaScript module script but the server 
responded with a MIME type of "text/plain"
```

**Causes:**
- Server not configured to serve JavaScript with correct MIME type
- Metro bundler not setting headers correctly

**Solutions:**

✅ **Metro bundler** (already configured):
- Check `metro.config.js` has MIME type middleware
- Restart Metro: `npx expo start -c`

✅ **Production server:**
```nginx
# Nginx
location ~* \.js$ {
  add_header Content-Type application/javascript;
}

# Apache (.htaccess)
AddType application/javascript .js .mjs
AddType application/json .json
```

#### 2. Import Resolution Errors

**Error:**
```
Unable to resolve module @components/Button
```

**Causes:**
- Path aliases not configured correctly
- Cache issues
- TypeScript/Babel config mismatch

**Solutions:**

1. **Verify configurations match:**

   **`tsconfig.json`:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@components/*": ["src/components/*"]
       }
     }
   }
   ```

   **`babel.config.js`:**
   ```javascript
   {
     plugins: [
       ['module-resolver', {
         alias: {
           '@components': './src/components'
         }
       }]
     ]
   }
   ```

   **`metro.config.js`:**
   ```javascript
   {
     resolver: {
       extraNodeModules: {
         '@components': path.resolve(__dirname, 'src/components')
       }
     }
   }
   ```

2. **Clear all caches:**
   ```bash
   npx expo start -c
   rm -rf node_modules/.cache
   rm -rf .expo
   ```

3. **Restart TypeScript server** in your IDE (VS Code: Cmd+Shift+P → "Restart TS Server")

#### 3. SecureStore Web Errors

**Error:**
```
Invariant Violation: "expo-secure-store" is not available on web
```

**Cause:** Attempting to import SecureStore on web platform

**Solution:** Already fixed in `src/utils/secureStorage.ts` with lazy loading:

```typescript
// ✅ Correct - lazy load with platform check
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// ❌ Wrong - imports on all platforms
import * as SecureStore from 'expo-secure-store';
```

**If you see this error:**
1. Check all files that use SecureStore
2. Replace direct imports with platform-checked require()
3. Use the `secureStorage` abstraction layer instead

#### 4. "No Route Matches URL" Error

**Error:**
```
Error: No route matches URL: /assignments/123
```

**Causes:**
- File doesn't exist in `app/` directory
- File named incorrectly
- Missing `_layout.tsx` in parent directory
- Metro cache not updated

**Solutions:**

1. **Check file exists and is named correctly:**
   ```
   app/assignments/[id].tsx  ✅
   app/assignments/id.tsx    ❌ (not dynamic)
   app/assignments/detail.tsx ❌ (doesn't match URL)
   ```

2. **Verify parent layout exists:**
   ```
   app/_layout.tsx           ✅ Required
   app/assignments/[id].tsx  ✅ Will work
   ```

3. **Clear Metro cache:**
   ```bash
   npx expo start -c
   ```

4. **Check route in dev tools:**
   ```typescript
   import { usePathname } from 'expo-router';
   console.log(usePathname()); // Current route
   ```

#### 5. Infinite Redirect Loop

**Symptoms:**
- App continuously redirects between routes
- Console flooded with navigation logs
- App becomes unresponsive

**Cause:** Navigation guard logic without proper checks

**Solution:**

```typescript
// ❌ WRONG - causes infinite loop
useEffect(() => {
  if (!isAuthenticated) {
    router.replace('/(auth)/login');
  }
}, [isAuthenticated]); // Runs every time, including during auth check

// ✅ CORRECT - waits for auth to load
useEffect(() => {
  if (isLoading) return; // Important!
  
  const inAuthGroup = segments[0] === '(auth)';
  
  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/login');
  } else if (isAuthenticated && inAuthGroup) {
    router.replace('/(tabs)/student');
  }
}, [isAuthenticated, segments, isLoading]);
```

**Key Points:**
- Always check `isLoading` before redirecting
- Use `segments` to detect current route group
- Use `router.replace()` instead of `router.push()` for guards
- Add all dependencies to useEffect array

#### 6. Deep Links Not Working (iOS)

**Checklist:**
- [ ] `associatedDomains` configured in `app.json`
- [ ] AASA file accessible at `https://yourdomain.com/.well-known/apple-app-site-association`
- [ ] AASA file has correct Team ID and Bundle ID
- [ ] AASA file served with `Content-Type: application/json`
- [ ] AASA file accessible via HTTPS (not HTTP)
- [ ] App rebuilt after AASA changes
- [ ] Testing on real device (not simulator)

**Debug Steps:**

1. **Verify AASA file:**
   ```bash
   curl -v https://edutrack.app/.well-known/apple-app-site-association
   ```

2. **Check device logs:**
   ```bash
   # Install libimobiledevice
   brew install libimobiledevice

   # View logs
   idevicesyslog | grep swcd
   ```

3. **Reset Associated Domains:**
   - Delete app from device
   - Reinstall app
   - Wait 1 minute for iOS to fetch AASA

4. **Test custom scheme first:**
   ```bash
   # Custom schemes work without AASA
   xcrun simctl openurl booted edutrack://assignments/123
   ```

#### 7. Deep Links Not Working (Android)

**Checklist:**
- [ ] `intentFilters` configured in `app.json`
- [ ] Digital Asset Links file at `https://yourdomain.com/.well-known/assetlinks.json`
- [ ] Certificate fingerprint matches app signing key
- [ ] `autoVerify: true` in intent filter
- [ ] App rebuilt after configuration changes
- [ ] Testing on real device with internet connection

**Debug Steps:**

1. **Verify Asset Links:**
   ```bash
   curl https://edutrack.app/.well-known/assetlinks.json
   ```

2. **Check intent filter registration:**
   ```bash
   adb shell dumpsys package com.edutrack.app | grep -A 10 "android.intent.action.VIEW"
   ```

3. **Check App Link verification status:**
   ```bash
   adb shell pm get-app-links com.edutrack.app
   ```
   Should show: `verified`

4. **Re-verify App Links:**
   ```bash
   adb shell pm verify-app-links --re-verify com.edutrack.app
   ```

5. **Test custom scheme first:**
   ```bash
   # Custom schemes don't need verification
   adb shell am start -W -a android.intent.action.VIEW \
     -d "edutrack://assignments/123" com.edutrack.app
   ```

#### 8. Navigation Props Not Available

**Error:**
```typescript
Property 'navigation' does not exist on type 'Props'
```

**Cause:** Trying to use React Navigation patterns with Expo Router

**Solution:**

```typescript
// ❌ WRONG - React Navigation pattern
function Screen({ navigation, route }) {
  navigation.navigate('Details', { id: route.params.id });
}

// ✅ CORRECT - Expo Router pattern
import { useRouter, useLocalSearchParams } from 'expo-router';

function Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  router.push(`/details/${params.id}`);
}
```

#### 9. Tabs Not Showing

**Symptoms:**
- Tab bar doesn't appear
- Only one screen visible
- Tab navigation not working

**Causes:**
- Missing `_layout.tsx` in tabs directory
- Layout doesn't render `<Tabs>` component
- Incorrect group name

**Solution:**

1. **Verify layout file exists:**
   ```
   app/(tabs)/student/_layout.tsx  ✅
   ```

2. **Check layout renders Tabs:**
   ```typescript
   import { Tabs } from 'expo-router';
   
   export default function Layout() {
     return (
       <Tabs>
         <Tabs.Screen name="index" options={{ title: 'Home' }} />
         <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
       </Tabs>
     );
   }
   ```

3. **Verify navigation route:**
   ```typescript
   // ✅ Correct - matches (tabs) group
   router.push('/(tabs)/student');
   
   // ❌ Wrong - no matching group
   router.push('/student');
   ```

#### 10. TypeScript Errors with Typed Routes

**Error:**
```typescript
Type '"/assignments/123"' is not assignable to type 'Href'
```

**Causes:**
- Typed routes not enabled
- TypeScript server not restarted
- Cache issues

**Solutions:**

1. **Enable typed routes in `app.json`:**
   ```json
   {
     "expo": {
       "experiments": {
         "typedRoutes": true
       }
     }
   }
   ```

2. **Restart TypeScript server:**
   - VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
   - Or restart your IDE

3. **Clear caches:**
   ```bash
   npx expo start -c
   rm -rf .expo
   ```

4. **Use proper typing:**
   ```typescript
   import { Href } from 'expo-router';
   
   const route: Href = '/(tabs)/student';
   router.push(route);
   ```

#### 11. Params Not Available in Nested Routes

**Problem:** Child routes can't access parent route parameters

**Solution:** Use `useGlobalSearchParams()` instead of `useLocalSearchParams()`:

```typescript
// Parent: app/courses/[id]/lessons.tsx
import { useGlobalSearchParams } from 'expo-router';

function LessonsScreen() {
  // Gets params from parent routes too
  const { id, lessonId } = useGlobalSearchParams<{ 
    id: string;
    lessonId?: string;
  }>();
  
  console.log('Course ID:', id);
  console.log('Lesson ID:', lessonId);
}
```

#### 12. Metro Bundler Cache Issues

**Symptoms:**
- Old files still being bundled
- Routes not updating after file changes
- TypeScript errors persisting after fixes
- Component changes not reflecting

**Solution:**

```bash
# Clear all caches
npx expo start -c

# Or manually:
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro
rm -rf dist

# Nuclear option (if above doesn't work):
rm -rf node_modules
npm install
npx expo start -c
```

#### 13. Web Bundle Too Large

**Symptoms:**
- Slow initial load on web
- Bundle size warnings in console
- Performance issues

**Solutions:**

1. **Already implemented:**
   - Code splitting in `webpack.config.js`
   - Tree shaking enabled
   - Native modules stubbed for web

2. **Analyze bundle:**
   ```bash
   npm run analyze-bundle
   ```

3. **Verify web optimizations:**
   ```bash
   npm run verify-web-optimization
   ```

4. **Check what's included:**
   - Review `webpack.config.js` aliases
   - Ensure native-only modules are stubbed
   - Verify lazy loading is working

---

## Testing Checklist

Use this checklist when testing the migration on all platforms:

### Pre-Testing Setup

- [ ] All dependencies installed (`npm install`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)
- [ ] Dev server starts successfully (`npm start`)

### Authentication Flow

**All Platforms (iOS, Android, Web):**

- [ ] Login screen loads correctly
- [ ] Can log in with demo credentials
- [ ] Can log in with OTP
- [ ] Can register new account
- [ ] Forgot password flow works
- [ ] Token refresh works automatically
- [ ] Logout clears all data
- [ ] Biometric auth works (native only)
- [ ] Remember me persists across sessions

### Navigation Testing

**Tab Navigation:**

- [ ] All tabs visible and clickable
- [ ] Tab icons display correctly
- [ ] Tab labels match screen titles
- [ ] Active tab highlighted correctly
- [ ] Hidden tabs not in tab bar but accessible
- [ ] Role switcher works in header

**Stack Navigation:**

- [ ] Can navigate to detail screens
- [ ] Back button works correctly
- [ ] Navigation history maintained
- [ ] Can deep link to nested routes

**Route Guards:**

- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can't access auth screens
- [ ] Role-based routing works (student vs parent)
- [ ] No infinite redirect loops

### Deep Linking

**Custom Scheme (edutrack://):**

- [ ] `edutrack://login` opens login screen
- [ ] `edutrack://assignments/123` opens assignment detail
- [ ] `edutrack://student/grades` opens grades tab
- [ ] Parameters passed correctly
- [ ] Invalid routes show 404 page

**Universal/App Links (https://edutrack.app/):**

**iOS:**
- [ ] Universal links work on real device
- [ ] AASA file accessible
- [ ] Links open in app (not Safari)
- [ ] Fallback to custom scheme if AASA fails

**Android:**
- [ ] App Links work with verification
- [ ] Asset Links file accessible
- [ ] Links open in app (not Chrome)
- [ ] Custom scheme works as fallback

**Web:**
- [ ] Direct URL navigation works
- [ ] Browser back/forward buttons work
- [ ] Refresh doesn't break routing
- [ ] Clean URLs (no hash routing)

### Platform-Specific Features

**iOS:**
- [ ] Splash screen shows/hides correctly
- [ ] Status bar styling correct
- [ ] Safe area insets respected
- [ ] Face ID/Touch ID works
- [ ] Push notifications work
- [ ] Background fetch works

**Android:**
- [ ] Splash screen shows/hides correctly
- [ ] Status bar styling correct
- [ ] System back button works
- [ ] Fingerprint auth works
- [ ] Push notifications work
- [ ] Background sync works

**Web:**
- [ ] Page loads without errors
- [ ] No SecureStore errors in console
- [ ] localStorage used for storage
- [ ] Native-only features gracefully disabled
- [ ] Responsive layout works
- [ ] Browser dev tools show no errors
- [ ] Service worker caching works (if enabled)

### Storage Testing

**All Platforms:**

- [ ] Tokens saved and retrieved correctly
- [ ] User preferences persist
- [ ] Data survives app restart
- [ ] Logout clears all sensitive data

**Native:**
- [ ] SecureStore encrypts data
- [ ] Data survives app reinstall (iOS Keychain)

**Web:**
- [ ] AsyncStorage (localStorage) works
- [ ] Data cleared when cache cleared
- [ ] No encryption warnings (expected)

### Error Handling

- [ ] 404 page shows for invalid routes
- [ ] Network errors handled gracefully
- [ ] Invalid deep links handled
- [ ] Console shows no unexpected errors
- [ ] Error boundaries catch crashes
- [ ] User-friendly error messages

### Performance

**All Platforms:**

- [ ] Initial load time acceptable (<3s)
- [ ] Navigation transitions smooth (60fps)
- [ ] No memory leaks
- [ ] No excessive re-renders

**Web:**
- [ ] Bundle size under limits (<2MB)
- [ ] Code splitting working
- [ ] Lazy loading working
- [ ] No MIME type errors

### Regression Testing

- [ ] Existing features still work
- [ ] API calls successful
- [ ] Redux state management works
- [ ] Offline mode works (native)
- [ ] Push notifications still work
- [ ] Camera/image picker still works
- [ ] File downloads still work

### Cross-Platform Consistency

- [ ] UI looks consistent across platforms
- [ ] Functionality works the same way
- [ ] User experience is similar
- [ ] Feature parity maintained (except platform-specific)

---

## Developer Setup Instructions

### Prerequisites

- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Expo CLI**: Latest version
- **iOS**: Xcode 14+ (Mac only)
- **Android**: Android Studio with SDK 33+
- **Git**: For version control

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy example env file
   cp .env.example .env.development
   
   # Edit with your values
   # API_URL=https://your-api.com
   # ... other env vars
   ```

4. **Verify setup:**
   ```bash
   # Type check
   npm run type-check
   
   # Lint
   npm run lint
   ```

### Running the App

#### Web Development

```bash
# Start Metro bundler for web
npm run web

# Opens browser to http://localhost:8081
```

**Web Development Tips:**
- Use browser dev tools for debugging
- React DevTools extension helpful
- Check console for errors
- Network tab for API calls
- Application tab for localStorage

#### iOS Development

**Prerequisites:**
- macOS required
- Xcode installed
- iOS Simulator or physical device

```bash
# Validate iOS setup
npm run validate-ios

# Start Metro bundler
npm start

# Press 'i' for iOS simulator
# Or scan QR code with Expo Go app on physical device

# Or directly:
npm run ios
```

**iOS Development Tips:**
- Use Safari Web Inspector for debugging
- Cmd+D in simulator for dev menu
- Shake physical device for dev menu
- Check Xcode console for native errors

#### Android Development

**Prerequisites:**
- Android Studio installed
- Android SDK configured
- Android Emulator or physical device

```bash
# Validate Android setup
npm run validate-android

# Start Metro bundler
npm start

# Press 'a' for Android emulator
# Or scan QR code with Expo Go app on physical device

# Or directly:
npm run android
```

**Android Development Tips:**
- Use Chrome DevTools for debugging
- Cmd+M (Mac) / Ctrl+M (Windows) for dev menu in emulator
- Shake physical device for dev menu
- Check Android Studio Logcat for native errors

### Development Workflow

#### 1. File-Based Routing

Create new screens by adding files to `app/` directory:

```bash
# New screen
touch app/my-new-screen.tsx

# New dynamic route
touch app/items/[id].tsx

# New nested layout
mkdir app/my-section
touch app/my-section/_layout.tsx
touch app/my-section/index.tsx
```

#### 2. Hot Reloading

Changes automatically reload:
- **Fast Refresh**: Preserves component state
- **Full Reload**: If Fast Refresh fails

**Trigger manual reload:**
- Press `r` in Metro terminal
- Shake device and tap "Reload"
- Cmd+R in iOS simulator

#### 3. Debugging

**Enable Debug Mode:**
1. Shake device or press Cmd+D (iOS) / Cmd+M (Android)
2. Tap "Debug Remote JS"
3. Opens Chrome DevTools

**React DevTools:**
```bash
# Install standalone
npm install -g react-devtools

# Run
react-devtools
```

**Redux DevTools:**
- Already configured in store
- Use Redux DevTools Extension in browser (web)
- Use Reactotron for native debugging

#### 4. Path Aliases

Use configured aliases for clean imports:

```typescript
// ✅ Use aliases
import { Button } from '@components/shared/Button';
import { useAuth } from '@hooks/useAuth';
import { api } from '@api/client';

// ❌ Avoid relative paths
import { Button } from '../../../src/components/shared/Button';
```

**Configured aliases:**
- `@components` → `src/components`
- `@screens` → `src/screens`
- `@store` → `src/store`
- `@utils` → `src/utils`
- `@config` → `src/config`
- `@types` → `src/types`
- `@api` → `src/api`
- `@hooks` → `src/hooks`
- `@services` → `src/services`
- `@constants` → `src/constants`
- `@theme` → `src/theme`

#### 5. TypeScript

**Type checking:**
```bash
# Check types without building
npm run type-check

# Watch mode
npx tsc --noEmit --watch
```

**Auto-generated route types:**
- Enabled via `experiments.typedRoutes` in `app.json`
- Generated in `.expo/types/router.d.ts`
- Import `Href` type from `expo-router`

#### 6. Linting

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Building for Production

#### Web Build

```bash
# Build for web
npm run build:web

# Output in dist/ directory
# Deploy dist/ to your web server
```

#### iOS Build (EAS Build)

```bash
# Preview build (for testing)
eas build --profile preview --platform ios

# Production build (for App Store)
eas build --profile production --platform ios
```

#### Android Build (EAS Build)

```bash
# Preview build (for testing)
eas build --profile preview --platform android

# Production build (for Play Store)
eas build --profile production --platform android
```

### Common Development Tasks

#### Adding a New Screen

1. **Create file in `app/` directory:**
   ```bash
   touch app/my-screen.tsx
   ```

2. **Implement screen component:**
   ```typescript
   // app/my-screen.tsx
   import React from 'react';
   import { View, Text } from 'react-native';
   
   export default function MyScreen() {
     return (
       <View>
         <Text>My New Screen</Text>
       </View>
     );
   }
   ```

3. **Add navigation link:**
   ```typescript
   import { Link } from 'expo-router';
   
   <Link href="/my-screen">Go to My Screen</Link>
   ```

4. **Test in development:**
   - Navigate to `/my-screen` in browser (web)
   - Or use Link/router.push in app

#### Adding a Dynamic Route

1. **Create dynamic route file:**
   ```bash
   mkdir app/products
   touch app/products/[id].tsx
   ```

2. **Access parameters:**
   ```typescript
   // app/products/[id].tsx
   import { useLocalSearchParams } from 'expo-router';
   
   export default function ProductDetail() {
     const { id } = useLocalSearchParams<{ id: string }>();
     return <Text>Product {id}</Text>;
   }
   ```

3. **Navigate with parameters:**
   ```typescript
   router.push(`/products/${productId}`);
   // or
   <Link href={`/products/${productId}`}>View Product</Link>
   ```

#### Adding a Tab

1. **Add screen file to tabs directory:**
   ```bash
   touch app/(tabs)/student/new-tab.tsx
   ```

2. **Register in layout:**
   ```typescript
   // app/(tabs)/student/_layout.tsx
   <Tabs.Screen
     name="new-tab"
     options={{
       title: 'New Tab',
       tabBarIcon: ({ color, size }) => (
         <Icon name="star" color={color} size={size} />
       ),
     }}
   />
   ```

#### Debugging Deep Links

1. **Test custom scheme:**
   ```bash
   # iOS
   xcrun simctl openurl booted edutrack://my-screen
   
   # Android
   adb shell am start -W -a android.intent.action.VIEW \
     -d "edutrack://my-screen" com.edutrack.app
   ```

2. **Add logging:**
   ```typescript
   // app/_layout.tsx
   useEffect(() => {
     const subscription = addDeepLinkListener((url) => {
       console.log('🔗 Deep link received:', url);
       // ... handle link
     });
     return () => subscription.remove();
   }, []);
   ```

3. **Check route parsing:**
   ```typescript
   import { usePathname, useSegments } from 'expo-router';
   
   const pathname = usePathname();
   const segments = useSegments();
   console.log('Current pathname:', pathname);
   console.log('Route segments:', segments);
   ```

### Troubleshooting Development Issues

#### Metro Won't Start

```bash
# Clear all caches
npx expo start -c

# If that doesn't work:
rm -rf node_modules
npm install
npx expo start -c
```

#### TypeScript Errors in IDE

```bash
# Restart TypeScript server
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or clear and rebuild
rm -rf .expo
npx expo start -c
```

#### Changes Not Reflecting

```bash
# Force full reload
# In Metro terminal, press 'r'

# Or clear cache and restart
npx expo start -c

# Nuclear option
rm -rf node_modules/.cache .expo .metro
npx expo start -c
```

#### iOS/Android Won't Build

```bash
# iOS - clean build
cd ios && pod install && cd ..
npm run ios

# Android - clean build
cd android && ./gradlew clean && cd ..
npm run android

# Validate setup
npm run validate-ios    # or validate-android
```

### Additional Resources

**Official Documentation:**
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Expo Router API Reference](https://docs.expo.dev/router/reference/api/)
- [File-based Routing](https://docs.expo.dev/router/create-pages/)

**Internal Documentation:**
- `mobile/docs/QUICK_REFERENCE.md` - Quick commands reference
- `mobile/docs/API_INTEGRATION.md` - API integration guide
- `mobile/docs/TROUBLESHOOTING.md` - General troubleshooting
- `mobile/docs/DEEP_LINK_INTEGRATION_EXAMPLES.md` - Deep linking examples

**Community:**
- [Expo Discord](https://chat.expo.dev/)
- [Expo GitHub Discussions](https://github.com/expo/expo/discussions)
- [Stack Overflow - expo-router tag](https://stackoverflow.com/questions/tagged/expo-router)

---

## Summary

This migration to Expo Router brings significant improvements:

✅ **Simplified Routing**: File-based routing eliminates boilerplate  
✅ **Type Safety**: Auto-generated types prevent routing errors  
✅ **Universal**: Single codebase for web, iOS, and Android  
✅ **Deep Linking**: Works out of the box with minimal config  
✅ **Better DX**: Hot reloading, better errors, easier debugging  
✅ **Platform-Aware**: Automatic handling of platform differences  

**Key Takeaways:**

1. **File structure is routing**: Your `app/` folder structure defines your routes
2. **Use hooks, not props**: Replace `navigation` and `route` props with `useRouter()` and `useLocalSearchParams()`
3. **Platform-aware storage**: `secureStorage` abstraction handles web vs native automatically
4. **Deep links just work**: Configure once in `app.json`, works everywhere
5. **Type-safe navigation**: TypeScript knows your routes and params

**Migration Complete** ✨

---

**Last Updated:** December 2024  
**Expo Router Version:** 3.4.10  
**Expo SDK Version:** 50.0.0  
**Maintained By:** EduTrack Development Team
