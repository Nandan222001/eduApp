# Mobile App Quick Start Guide

## Installation

```bash
cd mobile
npm install
```

## Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure Quick Reference

```
src/
├── navigation/     - All navigation configuration
├── screens/        - All screen components
│   ├── auth/      - Login, Register, etc.
│   ├── student/   - Student-specific screens
│   ├── parent/    - Parent-specific screens
│   └── common/    - Shared screens
├── store/         - Redux store and slices
├── types/         - TypeScript type definitions
├── config/        - App configuration (theme, React Query)
├── api/           - API integration
├── components/    - Reusable components
└── utils/         - Utility functions
```

## Key Files

- `App.tsx` - App entry point with providers
- `src/navigation/RootNavigator.tsx` - Main navigation
- `src/store/store.ts` - Redux store configuration
- `src/types/navigation.ts` - Navigation types
- `app.json` - Deep linking configuration

## Navigation Flow

```
App Launch
    ↓
Check Auth State (from AsyncStorage via Redux Persist)
    ↓
    ├─ Not Authenticated → Auth Stack (Login/Register)
    │                            ↓
    │                         Login Success
    │                            ↓
    └─ Authenticated ─────────→ Main Stack
                                    ↓
                        Check User Role
                                    ↓
                ├─ Student → Student Tabs (Dashboard, Courses, etc.)
                └─ Parent  → Parent Tabs (Dashboard, Children, etc.)
```

## Common Tasks

### Add a New Screen

1. Create screen file in appropriate directory:

```typescript
// src/screens/student/NewScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { StudentTabScreenProps } from '@types/navigation';

type Props = StudentTabScreenProps<'NewScreen'>;

export const NewScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text h3>New Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

2. Add route to navigation types:

```typescript
// src/types/navigation.ts
export type StudentTabParamList = {
  // ... existing routes
  NewScreen: { someParam?: string };
};
```

3. Add screen to navigator:

```typescript
// src/navigation/StudentTabNavigator.tsx
<Tab.Screen name="NewScreen" component={NewScreen} />
```

4. Export from index:

```typescript
// src/screens/index.ts
export * from './student/NewScreen';
```

### Navigate Between Screens

```typescript
// Navigate to a screen
navigation.navigate('Courses');

// Navigate with params
navigation.navigate('CourseDetail', { courseId: '123' });

// Go back
navigation.goBack();

// Navigate to nested screen
navigation.navigate('Main', {
  screen: 'StudentTabs',
  params: {
    screen: 'Dashboard',
  },
});
```

### Use Redux

```typescript
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login } from '@store/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const handleLogin = async () => {
    await dispatch(login({ email, password }));
  };

  return (/* ... */);
}
```

### Use React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@api/courses';

function CoursesScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getCourses(),
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (/* render courses */);
}
```

### Handle Deep Links

Deep links are automatically handled by the navigation system. To test:

```bash
# iOS Simulator
xcrun simctl openurl booted "edumobile://notifications/123"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "edumobile://notifications/123"
```

## Path Aliases

Use these aliases for cleaner imports:

```typescript
import { Button } from '@components';
import { useAuthStore } from '@store';
import { User, UserRole } from '@types';
import { formatDate } from '@utils';
import { API_URL } from '@constants';
import { theme } from '@config';
import { LoginScreen } from '@screens';
import { authApi } from '@api';
```

## Debugging

### Enable Redux DevTools

Redux DevTools are not configured by default. To enable:

1. Install Flipper and redux-flipper plugin
2. Or use Reactotron for React Native

### Navigation Debugging

```typescript
// Add this to RootNavigator to log navigation state
<NavigationContainer
  linking={linking}
  onStateChange={(state) => console.log('Navigation state:', state)}
>
```

### Network Debugging

React Query DevTools are available for web. For mobile, inspect network requests in:

- Flipper (Network plugin)
- React Native Debugger
- Browser DevTools (when using Expo web)

## Troubleshooting

### Build Errors

```bash
# Clear cache
npm start -- --clear

# Reinstall dependencies
rm -rf node_modules
npm install

# Reset Metro bundler
npx react-native start --reset-cache
```

### Navigation Issues

- Ensure all screen components are properly imported
- Check that route names match exactly (case-sensitive)
- Verify navigation types are up to date

### State Persistence Issues

```bash
# Clear AsyncStorage in development
# Add this to a debug screen:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

## Testing Deep Links

Test different routes:

```bash
# Auth routes
edumobile://login
edumobile://register
edumobile://reset-password/token123

# Student routes
edumobile://dashboard
edumobile://courses/456
edumobile://assignments/789

# Parent routes
edumobile://parent/children/123
edumobile://parent/messages/456

# Common routes
edumobile://notifications/789
edumobile://profile
```

## Resources

- [React Navigation Docs](https://reactnavigation.org/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React Query Docs](https://tanstack.com/query/latest)
- [React Native Elements Docs](https://reactnativeelements.com/)
- [Expo Docs](https://docs.expo.dev/)

## Support

For implementation details, see:

- `NAVIGATION_IMPLEMENTATION.md` - Complete navigation guide
- `IMPLEMENTATION_SUMMARY.md` - What was implemented
- `INSTALL.md` - Installation instructions
