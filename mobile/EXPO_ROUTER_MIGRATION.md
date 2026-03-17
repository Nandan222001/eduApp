# Expo Router Migration Guide

## Overview

This document details the migration from React Navigation to Expo Router file-based routing in the EDU Mobile application. The migration was completed to leverage Expo Router's type-safe routing, improved deep linking, and file-based convention.

## Table of Contents

1. [Migration Summary](#migration-summary)
2. [Directory Structure](#directory-structure)
3. [Key Changes](#key-changes)
4. [Navigation Patterns](#navigation-patterns)
5. [Deep Linking](#deep-linking)
6. [Breaking Changes](#breaking-changes)
7. [Migration Steps](#migration-steps)
8. [Troubleshooting](#troubleshooting)

## Migration Summary

### What Changed

- **Removed**: React Navigation navigators (`RootNavigator`, `MainNavigator`, `StudentTabNavigator`, `ParentTabNavigator`, `AuthNavigator`)
- **Added**: Expo Router file-based routing with `app` directory
- **Updated**: All screen components to use Expo Router hooks instead of React Navigation
- **Modified**: Entry point changed from `App.tsx` to `app/_layout.tsx`
- **Enhanced**: Deep linking configuration in `app.json`

### Benefits

- ✅ Type-safe routing with automatic TypeScript generation
- ✅ Simplified deep linking configuration
- ✅ File-based routing convention (similar to Next.js)
- ✅ Better code organization with route groups
- ✅ Automatic route manifest generation
- ✅ Improved developer experience with typed routes

## Directory Structure

### New `app` Directory Structure

```
mobile/
├── app/
│   ├── _layout.tsx                    # Root layout with providers
│   ├── index.tsx                      # Root redirect
│   │
│   ├── (auth)/                        # Auth group (not shown in URL)
│   │   ├── _layout.tsx               # Auth layout
│   │   ├── login.tsx                 # /login
│   │   ├── register.tsx              # /register
│   │   ├── forgot-password.tsx       # /forgot-password
│   │   └── reset-password.tsx        # /reset-password
│   │
│   ├── (tabs)/                        # Tabs group
│   │   ├── _layout.tsx               # Tabs redirect layout
│   │   │
│   │   ├── student/                   # Student tab group
│   │   │   ├── _layout.tsx           # Student tabs layout
│   │   │   ├── index.tsx             # /student (Home/Dashboard)
│   │   │   ├── assignments.tsx       # /student/assignments
│   │   │   ├── schedule.tsx          # /student/schedule
│   │   │   ├── grades.tsx            # /student/grades
│   │   │   └── profile.tsx           # /student/profile
│   │   │
│   │   └── parent/                    # Parent tab group
│   │       ├── _layout.tsx           # Parent tabs layout
│   │       ├── index.tsx             # /parent (Dashboard)
│   │       ├── children.tsx          # /parent/children
│   │       ├── communication.tsx     # /parent/communication
│   │       ├── reports.tsx           # /parent/reports
│   │       └── profile.tsx           # /parent/profile
│   │
│   ├── courses/
│   │   ├── index.tsx                 # /courses
│   │   └── [id].tsx                  # /courses/:id
│   │
│   ├── assignments/
│   │   └── [id].tsx                  # /assignments/:id
│   │
│   ├── children/
│   │   └── [id].tsx                  # /children/:id
│   │
│   ├── messages/
│   │   └── [id].tsx                  # /messages/:id
│   │
│   ├── notifications/
│   │   └── [id].tsx                  # /notifications/:id
│   │
│   ├── notifications.tsx             # /notifications
│   ├── profile.tsx                   # /profile
│   └── settings.tsx                  # /settings
│
├── src/                              # Existing source files (mostly unchanged)
│   ├── screens/                      # Screen components (updated)
│   ├── components/
│   ├── store/
│   ├── api/
│   └── types/
│       ├── navigation.ts             # Old navigation types (deprecated)
│       └── routes.ts                 # New Expo Router types
```

### Route Groups Explained

- **(auth)**: Groups authentication-related screens. Parentheses prevent the group name from appearing in URLs
- **(tabs)**: Groups tab navigator screens with role-based separation
- **student/**: Student-specific tab screens
- **parent/**: Parent-specific tab screens

## Key Changes

### 1. Entry Point Migration

**Before (React Navigation):**

```typescript
// App.tsx
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <SafeAreaProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </SafeAreaProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
```

**After (Expo Router):**

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <SafeAreaProvider>
              <RootLayoutNav />
              <StatusBar style="auto" />
            </SafeAreaProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
```

### 2. Authentication Flow

**Before:**

```typescript
// RootNavigator.tsx
<Stack.Navigator>
  {isAuthenticated ? (
    <Stack.Screen name="Main" component={MainNavigator} />
  ) : (
    <Stack.Screen name="Auth" component={AuthNavigator} />
  )}
</Stack.Navigator>
```

**After:**

```typescript
// app/_layout.tsx - RootLayoutNav
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/login');
  } else if (isAuthenticated && inAuthGroup) {
    router.replace('/(tabs)/student');
  }
}, [isAuthenticated, segments, isLoading]);
```

### 3. Screen Component Updates

**Before:**

```typescript
import { AuthStackScreenProps } from '@types';

type Props = AuthStackScreenProps<'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const handleRegister = () => {
    navigation.navigate('Register');
  };
  // ...
};
```

**After:**

```typescript
import { useRouter } from 'expo-router';

export const LoginScreen: React.FC = () => {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/(auth)/register');
  };
  // ...
};
```

### 4. Dynamic Routes

**Before:**

```typescript
// navigation/MainNavigator.tsx
<Stack.Screen
  name="CourseDetail"
  component={CourseDetailScreen}
  options={{ headerShown: true, title: 'Course Details' }}
/>

// CourseDetailScreen.tsx
const { courseId } = route.params;
```

**After:**

```typescript
// app/courses/[id].tsx
import { CourseDetailScreen } from '@screens/student/CourseDetailScreen';
export default CourseDetailScreen;

// CourseDetailScreen.tsx
import { useLocalSearchParams } from 'expo-router';

const { id: courseId } = useLocalSearchParams();
```

## Navigation Patterns

### Navigation Between Screens

**Navigate to a screen:**

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Push a new screen
router.push('/courses/123');
router.push('/(auth)/login');

// Replace current screen
router.replace('/(tabs)/student');

// Go back
router.back();
```

**Navigate with parameters:**

```typescript
// Using template strings
router.push(`/courses/${courseId}`);
router.push(`/assignments/${assignmentId}`);

// Using search params for complex data
router.push({
  pathname: '/reset-password',
  params: { token: 'abc123' },
});
```

**Access route parameters:**

```typescript
import { useLocalSearchParams } from 'expo-router';

const { id, name } = useLocalSearchParams();
```

**Access route segments:**

```typescript
import { useSegments } from 'expo-router';

const segments = useSegments();
// segments = ['(tabs)', 'student', 'assignments']
```

### Tab Navigation

Tab navigation is handled automatically by the `Tabs` component in layout files:

```typescript
// app/(tabs)/student/_layout.tsx
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
  {/* More tabs... */}
</Tabs>
```

### Role-Based Navigation

The app automatically redirects users based on their active role:

```typescript
// app/(tabs)/_layout.tsx
useEffect(() => {
  if (activeRole === UserRole.STUDENT) {
    router.replace('/(tabs)/student');
  } else if (activeRole === UserRole.PARENT) {
    router.replace('/(tabs)/parent');
  }
}, [activeRole]);
```

## Deep Linking

### Configuration

Deep linking is automatically configured in `app.json`:

```json
{
  "expo": {
    "scheme": "edumobile",
    "experiments": {
      "typedRoutes": true
    },
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
          ]
        }
      ]
    }
  }
}
```

### URL Schemes

The following URL schemes are supported:

| URL                                   | Screen              |
| ------------------------------------- | ------------------- |
| `edumobile://login`                   | Login screen        |
| `edumobile://student`                 | Student home        |
| `edumobile://parent`                  | Parent dashboard    |
| `edumobile://courses/123`             | Course detail       |
| `edumobile://assignments/456`         | Assignment detail   |
| `edumobile://notifications`           | Notifications list  |
| `edumobile://profile`                 | Profile screen      |
| `https://edu.app/login`               | Login screen        |
| `https://edu.app/student/assignments` | Student assignments |

### Testing Deep Links

**iOS Simulator:**

```bash
xcrun simctl openurl booted edumobile://courses/123
```

**Android Emulator:**

```bash
adb shell am start -W -a android.intent.action.VIEW -d "edumobile://courses/123" com.edu.mobile
```

**Physical Devices:**

- Use a QR code generator with the deep link
- Send via email/SMS and tap the link

## Breaking Changes

### 1. Navigation Props Removed

All screen components no longer receive `navigation` and `route` props. Use hooks instead:

```typescript
// ❌ Old way
export const MyScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  navigation.navigate('Details', { id: 123 });
};

// ✅ New way
export const MyScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  router.push('/details/123');
};
```

### 2. Navigation Types Changed

```typescript
// ❌ Old types (deprecated)
import { AuthStackScreenProps, MainStackScreenProps } from '@types';

// ✅ New types (Expo Router generates these automatically)
// Import from expo-router or use the custom types in src/types/routes.ts
```

### 3. File-Based Routing Only

You cannot programmatically define routes. All routes must be file-based:

```typescript
// ❌ Not possible
const routes = [{ path: '/home', component: HomeScreen }];

// ✅ Must use files
// app/home.tsx
```

### 4. Layout Components Required

Each group/folder needs a `_layout.tsx` file to define how children are rendered.

## Migration Steps

If you need to add new screens or modify routing:

### Adding a New Screen

1. **Create the screen file:**

   ```bash
   # For a simple route
   touch app/new-screen.tsx

   # For a dynamic route
   touch app/items/[id].tsx
   ```

2. **Export the screen component:**

   ```typescript
   // app/new-screen.tsx
   import { MyNewScreen } from '@screens/MyNewScreen';
   export default MyNewScreen;
   ```

3. **Update the screen component:**

   ```typescript
   // src/screens/MyNewScreen.tsx
   import { useRouter, useLocalSearchParams } from 'expo-router';

   export const MyNewScreen: React.FC = () => {
     const router = useRouter();
     // Use router hooks instead of props
   };
   ```

### Adding a New Tab

1. **Create the tab file in the appropriate group:**

   ```bash
   touch app/(tabs)/student/new-tab.tsx
   ```

2. **Update the layout file:**
   ```typescript
   // app/(tabs)/student/_layout.tsx
   <Tabs.Screen
     name="new-tab"
     options={{
       title: 'New Tab',
       tabBarIcon: ({ color, size }) => (
         <Icon name="new-icon" type="material" color={color} size={size} />
       ),
     }}
   />
   ```

### Converting an Old Screen

1. **Identify navigation usage:**
   - `navigation.navigate()` → `router.push()`
   - `navigation.goBack()` → `router.back()`
   - `route.params` → `useLocalSearchParams()`

2. **Update imports:**

   ```typescript
   // Remove
   import { XXXStackScreenProps } from '@types';

   // Add
   import { useRouter, useLocalSearchParams } from 'expo-router';
   ```

3. **Update component signature:**

   ```typescript
   // Before
   export const MyScreen: React.FC<Props> = ({ navigation, route }) => {

   // After
   export const MyScreen: React.FC = () => {
     const router = useRouter();
     const params = useLocalSearchParams();
   ```

## Troubleshooting

### Common Issues

#### 1. "No routes matched" Error

**Problem:** Navigating to a route that doesn't exist.

**Solution:**

- Check the file exists in the `app` directory
- Verify the route path matches the file structure
- Ensure the file exports a default component

#### 2. Typed Routes Not Working

**Problem:** TypeScript doesn't recognize route types.

**Solution:**

```bash
# Clear cache and regenerate
npx expo start -c
```

#### 3. Deep Links Not Working

**Problem:** Deep links don't open the app.

**Solution:**

- Rebuild the app after changing `app.json`
- Verify URL schemes are correctly configured
- Check iOS Associated Domains or Android Intent Filters

#### 4. Navigation State Lost

**Problem:** Navigation state resets unexpectedly.

**Solution:**

- Use `router.replace()` instead of `router.push()` for authentication flows
- Check `_layout.tsx` files for conflicting navigation logic

#### 5. Tab Navigation Not Showing

**Problem:** Tabs don't appear.

**Solution:**

- Ensure `_layout.tsx` in the tabs folder uses `<Tabs>` component
- Verify all tab screens are registered in the layout
- Check `tabBarIcon` is properly defined

### Debug Mode

Enable Expo Router debug mode:

```typescript
// app/_layout.tsx
import { Slot, useRouter, useSegments } from 'expo-router';

if (__DEV__) {
  console.log('Current segments:', segments);
  console.log('Router state:', router);
}
```

### Migration Checklist

- [ ] Install `expo-router` dependency
- [ ] Update `package.json` main entry to `expo-router/entry`
- [ ] Create `app` directory structure
- [ ] Move screens to appropriate route files
- [ ] Update all screen components to use Expo Router hooks
- [ ] Remove old navigator files
- [ ] Update `app.json` with deep linking config
- [ ] Test all navigation flows
- [ ] Test deep linking
- [ ] Update documentation

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Expo Router API Reference](https://docs.expo.dev/router/reference/api/)
- [File-based routing guide](https://docs.expo.dev/router/advanced/routing/)
- [TypeScript with Expo Router](https://docs.expo.dev/router/reference/typed-routes/)

## Support

For issues or questions about the migration:

1. Check this guide's troubleshooting section
2. Review Expo Router documentation
3. Check the project's GitHub issues
4. Contact the development team

---

Last Updated: [Current Date]
Migration Completed By: Development Team
