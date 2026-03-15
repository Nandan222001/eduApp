# Mobile Navigation Implementation

## Overview
This document describes the React Navigation setup with role-based navigation, Redux state management, and deep linking support.

## Dependencies Installed

### Navigation
- ✅ `@react-navigation/native` - Core navigation library
- ✅ `@react-navigation/native-stack` - Native stack navigator
- ✅ `@react-navigation/bottom-tabs` - Bottom tab navigator
- ✅ `@react-navigation/drawer` - Drawer navigator (for future use)
- ✅ `react-native-safe-area-context` - Safe area handling
- ✅ `react-native-screens` - Native screen optimization
- ✅ `expo-linking` - Deep linking support

### State Management
- ✅ `@reduxjs/toolkit` - Redux state management
- ✅ `react-redux` - React bindings for Redux
- ✅ `redux-persist` - State persistence
- ✅ `@react-native-async-storage/async-storage` - AsyncStorage for persistence

### Networking
- ✅ `axios` - HTTP client
- ✅ `@tanstack/react-query` - Data fetching and caching

### UI Libraries
- ✅ `@rneui/themed` - React Native Elements UI library
- ✅ `@rneui/base` - Base components
- ✅ `react-native-vector-icons` - Icon library
- ✅ `react-native-reanimated` - Animation library

## Navigation Structure

### Root Stack Navigator
```
RootNavigator (Stack)
├── Auth (Stack)
│   ├── Login
│   ├── Register
│   ├── ForgotPassword
│   └── ResetPassword
└── Main (Stack)
    ├── StudentTabs (Bottom Tabs)
    │   ├── Dashboard
    │   ├── Courses
    │   ├── Assignments
    │   ├── Grades
    │   └── Schedule
    ├── ParentTabs (Bottom Tabs)
    │   ├── Dashboard
    │   ├── Children
    │   ├── Grades
    │   ├── Attendance
    │   └── Messages
    ├── Profile (Modal)
    ├── Settings (Modal)
    ├── Notifications (Modal)
    ├── NotificationDetail (Modal)
    ├── CourseDetail (Modal)
    ├── AssignmentDetail (Modal)
    ├── ChildDetail (Modal)
    └── MessageDetail (Modal)
```

## Role-Based Navigation

The app uses role-based navigation that shows different tab navigators based on the user's role:

- **Students**: StudentTabNavigator with courses, assignments, grades, and schedule
- **Parents**: ParentTabNavigator with children management, grades, attendance, and messages

The initial route is determined by the user's role in `MainNavigator.tsx`:

```typescript
const getInitialRouteName = () => {
  if (user?.role === UserRole.STUDENT) {
    return 'StudentTabs';
  } else if (user?.role === UserRole.PARENT) {
    return 'ParentTabs';
  }
  return 'StudentTabs';
};
```

## Deep Linking Configuration

### URL Schemes
- Custom scheme: `edumobile://`
- Universal links: `https://edu.app`

### Supported Routes

#### Auth Routes
- `edumobile://login`
- `edumobile://register`
- `edumobile://forgot-password`
- `edumobile://reset-password/:token`

#### Student Routes
- `edumobile://dashboard`
- `edumobile://courses`
- `edumobile://courses/:courseId`
- `edumobile://assignments`
- `edumobile://assignments/:assignmentId`
- `edumobile://grades`
- `edumobile://schedule`

#### Parent Routes
- `edumobile://parent/dashboard`
- `edumobile://parent/children`
- `edumobile://parent/children/:childId`
- `edumobile://parent/grades`
- `edumobile://parent/attendance`
- `edumobile://parent/messages`
- `edumobile://parent/messages/:messageId`

#### Common Routes
- `edumobile://profile`
- `edumobile://settings`
- `edumobile://notifications`
- `edumobile://notifications/:notificationId`

### app.json Configuration

The deep linking configuration is set in `app.json`:

```json
{
  "scheme": "edumobile",
  "ios": {
    "associatedDomains": ["applinks:edu.app"]
  },
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "edu.app",
            "pathPrefix": "/"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

## Redux Store Configuration

### Store Structure
```
store/
├── store.ts           - Store configuration with persistence
├── hooks.ts           - Typed hooks (useAppDispatch, useAppSelector)
├── authStore.ts       - Zustand store (legacy, can be migrated)
└── slices/
    ├── authSlice.ts         - Authentication state
    ├── userSlice.ts         - User profile state
    └── notificationSlice.ts - Notifications state
```

### Slices

#### authSlice
- State: user, token, isAuthenticated, isLoading, error
- Actions: login, logout, loadStoredAuth, setUser, setToken, clearError

#### userSlice
- State: profile, isLoading, error
- Actions: setProfile, updateProfile, setLoading, setError, clearError

#### notificationSlice
- State: notifications, unreadCount, isLoading
- Actions: setNotifications, addNotification, markAsRead, markAllAsRead, removeNotification

### Persistence
Redux Persist is configured to persist the auth slice to AsyncStorage:

```typescript
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth'],
};
```

## Type Safety

All navigation routes are strongly typed using TypeScript:

```typescript
// Navigate to a course detail
navigation.navigate('CourseDetail', { courseId: '123' });

// Navigate to parent message detail
navigation.navigate('MessageDetail', { messageId: '456' });
```

TypeScript will provide autocomplete and type checking for:
- Route names
- Route parameters
- Navigation props
- Screen props

## Screen Structure

### Auth Screens (`src/screens/auth/`)
- `LoginScreen.tsx`
- `RegisterScreen.tsx`
- `ForgotPasswordScreen.tsx`
- `ResetPasswordScreen.tsx`

### Student Screens (`src/screens/student/`)
- `DashboardScreen.tsx`
- `CoursesScreen.tsx`
- `CourseDetailScreen.tsx`
- `AssignmentsScreen.tsx`
- `AssignmentDetailScreen.tsx`
- `GradesScreen.tsx`
- `ScheduleScreen.tsx`

### Parent Screens (`src/screens/parent/`)
- `DashboardScreen.tsx`
- `ChildrenScreen.tsx`
- `ChildDetailScreen.tsx`
- `GradesScreen.tsx`
- `AttendanceScreen.tsx`
- `MessagesScreen.tsx`
- `MessageDetailScreen.tsx`

### Common Screens (`src/screens/common/`)
- `ProfileScreen.tsx`
- `SettingsScreen.tsx`
- `NotificationsScreen.tsx`
- `NotificationDetailScreen.tsx`

All screens are placeholder implementations that can be filled with actual functionality.

## Theme Configuration

React Native Elements theme is configured in `src/config/theme.ts` with light and dark mode support:

```typescript
import { theme } from '@config/theme';

// Used in App.tsx
<ThemeProvider theme={theme}>
  {/* App content */}
</ThemeProvider>
```

## React Query Configuration

React Query is configured with sensible defaults in `src/config/reactQuery.ts`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Next Steps

1. **Implement Screen Logic**: Fill in the placeholder screens with actual functionality
2. **Add API Integration**: Connect screens to backend APIs using React Query
3. **Enhance Navigation**: Add custom headers, gestures, and transitions
4. **Add Push Notifications**: Integrate with Firebase or OneSignal
5. **Implement Offline Support**: Use Redux Persist and React Query cache
6. **Add Analytics**: Track screen views and user interactions
7. **Testing**: Add navigation and integration tests

## Usage Examples

### Basic Navigation
```typescript
// Navigate to a screen
navigation.navigate('Courses');

// Navigate with parameters
navigation.navigate('CourseDetail', { courseId: '123' });

// Go back
navigation.goBack();

// Navigate and reset stack
navigation.reset({
  index: 0,
  routes: [{ name: 'Dashboard' }],
});
```

### Deep Linking
```typescript
// Open from notification
Linking.openURL('edumobile://notifications/123');

// Open from web
Linking.openURL('https://edu.app/courses/456');
```

### Using Redux
```typescript
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, logout } from '@store/slices/authSlice';

// In component
const dispatch = useAppDispatch();
const { user, isAuthenticated } = useAppSelector((state) => state.auth);

// Login
await dispatch(login({ email, password }));

// Logout
await dispatch(logout());
```

### Using React Query
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['courses'],
  queryFn: () => fetchCourses(),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newCourse) => createCourse(newCourse),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  },
});
```
