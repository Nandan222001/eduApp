# Expo Router Navigation Flow

## Overview

This document visualizes the navigation flow and routing structure of the EduTrack mobile application.

## Entry Point Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         index.js                             │
│                  (Entry Point)                               │
│                                                              │
│         import 'expo-router/entry'                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    app/_layout.tsx                           │
│                   (Root Layout)                              │
│                                                              │
│  • Redux Provider                                           │
│  • Redux Persist                                            │
│  • React Query                                              │
│  • Theme Provider                                           │
│  • Auth Guards                                              │
│  • Navigation Logic                                         │
│  • Deep Linking                                             │
│  • NavigationDebugger (dev)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Authentication  │
                    │      Check       │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌───────────────┐          ┌───────────────┐
        │ Authenticated │          │      Not      │
        │               │          │ Authenticated │
        └───────────────┘          └───────────────┘
                │                           │
                ▼                           ▼
        ┌───────────────┐          ┌───────────────┐
        │  /(tabs)/...  │          │ /(auth)/login │
        │  (Protected)  │          │               │
        └───────────────┘          └───────────────┘
```

## Route Structure

```
app/
│
├── _layout.tsx                    # Root layout with providers
├── index.tsx                      # Root redirect (→ login or tabs)
│
├── (auth)/                        # Authentication group
│   ├── _layout.tsx               # Auth layout (Stack navigation)
│   ├── login.tsx                 # /(auth)/login
│   ├── register.tsx              # /(auth)/register
│   ├── forgot-password.tsx       # /(auth)/forgot-password
│   ├── reset-password.tsx        # /(auth)/reset-password
│   ├── otp-login.tsx             # /(auth)/otp-login
│   └── otp-verify.tsx            # /(auth)/otp-verify
│
├── (tabs)/                        # Main app tabs (protected)
│   ├── _layout.tsx               # Tabs layout
│   ├── parent/                   # Parent role tabs
│   └── student/                  # Student role tabs
│
├── profile.tsx                    # /profile (protected)
├── settings.tsx                   # /settings (protected)
│
├── +html.tsx                      # Web HTML wrapper
└── +not-found.tsx                # 404 handler
```

## Navigation Decision Tree

```
User visits app
    │
    ▼
app/index.tsx
    │
    ├─ Is authenticated?
    │  │
    │  ├─ YES → Redirect to /(tabs)/{role}
    │  │        (parent or student based on active role)
    │  │
    │  └─ NO → Redirect to /(auth)/login
    │
    ▼
User lands on target screen
```

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    App Initialization                         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              loadStoredAuth() Dispatch                        │
│  • Check AsyncStorage for tokens                            │
│  • If tokens exist, fetch user data from API                │
│  • Update Redux state                                        │
└──────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌───────────────┐          ┌───────────────┐
        │ Has Valid     │          │   No Valid    │
        │    Tokens     │          │    Tokens     │
        └───────────────┘          └───────────────┘
                │                           │
                ▼                           ▼
        isAuthenticated = true    isAuthenticated = false
                │                           │
                ▼                           ▼
        Stay on current route      Redirect to /(auth)/login
         (if protected)
```

## Navigation Guard Logic

```javascript
// In app/_layout.tsx

useEffect(() => {
  if (isLoading) return; // Wait for auth check
  
  const inAuthGroup = segments[0] === '(auth)';
  
  if (!isAuthenticated && !inAuthGroup) {
    // User not authenticated, in protected area
    router.replace('/(auth)/login');
  } 
  else if (isAuthenticated && inAuthGroup) {
    // User authenticated, still in auth area
    if (activeRole === 'parent') {
      router.replace('/(tabs)/parent');
    } else {
      router.replace('/(tabs)/student');
    }
  }
}, [isAuthenticated, segments, isLoading]);
```

## URL to File Mapping

| URL | File Path | Description |
|-----|-----------|-------------|
| `/` | `app/index.tsx` | Root redirect |
| `/(auth)/login` | `app/(auth)/login.tsx` | Login screen |
| `/(auth)/register` | `app/(auth)/register.tsx` | Registration |
| `/(auth)/forgot-password` | `app/(auth)/forgot-password.tsx` | Password recovery |
| `/(auth)/reset-password` | `app/(auth)/reset-password.tsx` | Password reset |
| `/(auth)/otp-login` | `app/(auth)/otp-login.tsx` | OTP login |
| `/(auth)/otp-verify` | `app/(auth)/otp-verify.tsx` | OTP verification |
| `/(tabs)/student` | `app/(tabs)/student/...` | Student dashboard |
| `/(tabs)/parent` | `app/(tabs)/parent/...` | Parent dashboard |
| `/profile` | `app/profile.tsx` | User profile |
| `/settings` | `app/settings.tsx` | App settings |

## Deep Linking Flow

```
Deep Link Received
    │
    ▼
normalizeDeepLink()
    │
    ▼
isValidDeepLink()
    │
    ├─ Valid?
    │  │
    │  ├─ YES → parseDeepLink()
    │  │        │
    │  │        ▼
    │  │    Extract route & params
    │  │        │
    │  │        ▼
    │  │    Is authenticated?
    │  │        │
    │  │        ├─ YES → Navigate to route
    │  │        │
    │  │        └─ NO → Save returnPath
    │  │                Navigate to login
    │  │
    │  └─ NO → Log warning, ignore
    │
    ▼
User lands on target or login
```

## Component Hierarchy

```
RootLayout
    │
    ├─ Provider (Redux)
    │   │
    │   └─ PersistGate (Redux Persist)
    │       │
    │       └─ QueryClientProvider (React Query)
    │           │
    │           └─ ThemeProvider
    │               │
    │               └─ SafeAreaProvider
    │                   │
    │                   └─ RootLayoutNav
    │                       │
    │                       ├─ Auth Guards
    │                       ├─ Deep Linking
    │                       ├─ Platform Init
    │                       │
    │                       └─ OfflineDataRefresher
    │                           │
    │                           ├─ Slot (renders current route)
    │                           │
    │                           └─ NavigationDebugger (dev only)
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                       Redux Store                             │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  authSlice  │  │ profileSlice│  │ offlineSlice│        │
│  │             │  │             │  │             │        │
│  │ • user      │  │ • profile   │  │ • isOnline  │        │
│  │ • tokens    │  │ • settings  │  │ • queue     │        │
│  │ • role      │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    Redux Persist                              │
│              (Saves to AsyncStorage)                          │
└──────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│                    Components                                 │
│         (Access via useAppSelector/useAppDispatch)           │
└──────────────────────────────────────────────────────────────┘
```

## Testing Flow

```
1. Validation Phase
   │
   ├─ npm run validate-navigation
   │  │
   │  ├─ Check file structure
   │  ├─ Validate configs
   │  ├─ Check imports
   │  └─ Detect circular deps
   │
   ▼
2. Development Phase
   │
   ├─ npm run start:web
   │  │
   │  ├─ Metro bundler starts
   │  ├─ Builds JavaScript bundle
   │  └─ Serves on :8081
   │
   ▼
3. Testing Phase
   │
   ├─ Open http://localhost:8081
   │  │
   │  ├─ App loads
   │  ├─ Redux initializes
   │  ├─ Auth check runs
   │  └─ Navigation occurs
   │
   ├─ Open navigation-test-helper.html
   │  │
   │  ├─ Test all routes
   │  ├─ Check checklist
   │  └─ Monitor progress
   │
   └─ Use NavigationDebugger
      │
      ├─ View route info
      ├─ Check auth state
      └─ Quick navigation
```

## Platform-Specific Handling

```
Platform.OS Check
    │
    ├─ 'web'
    │  │
    │  ├─ Skip expo-splash-screen
    │  ├─ Skip native platform init
    │  ├─ Use localStorage for storage
    │  └─ Skip biometric features
    │
    ├─ 'ios'
    │  │
    │  ├─ Initialize iOS platform
    │  ├─ Check iOS compatibility
    │  ├─ Setup Face ID / Touch ID
    │  └─ Configure push notifications
    │
    └─ 'android'
       │
       ├─ Initialize Android platform
       ├─ Check Android compatibility
       ├─ Setup biometric auth
       └─ Configure notifications
```

## Error Handling Flow

```
Error Occurs
    │
    ├─ Module Resolution Error
    │  │
    │  └─ Check metro cache
    │     Clear cache
    │     Restart server
    │
    ├─ Navigation Error
    │  │
    │  └─ Check route exists
    │     Verify file naming
    │     Check _layout config
    │
    ├─ Authentication Error
    │  │
    │  └─ Clear AsyncStorage
    │     Clear Redux persist
    │     Restart app
    │
    └─ Component Error
       │
       └─ Check imports
          Verify exports
          Check circular deps
```

## Key Takeaways

1. **Entry Point**: `index.js` → imports expo-router/entry
2. **Root Layout**: `app/_layout.tsx` → wraps entire app
3. **Auth Guards**: Check authentication in root layout
4. **Route Groups**: `(auth)` for public, `(tabs)` for protected
5. **Redirects**: `app/index.tsx` handles initial routing
6. **Deep Links**: Handled in root layout with custom logic
7. **State**: Redux + Redux Persist for state management
8. **Platform**: Platform-specific code paths for native features
9. **Testing**: Multiple validation scripts + interactive helper
10. **Debugging**: NavigationDebugger component in dev mode

## Visual Legend

```
┌─────────┐
│  Box    │  = Component/File/Module
└─────────┘

    │
    ▼        = Flow direction

    ├─       = Branch/Decision

    ┌─┐
    │ │      = Process/Action
    └─┘
```
