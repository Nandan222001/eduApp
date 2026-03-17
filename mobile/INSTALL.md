# Mobile App Installation Guide

## Installation Commands

### Core Navigation Dependencies

```bash
# Install Expo navigation dependencies
npx expo install react-native-safe-area-context react-native-screens expo-linking

# Install React Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer
```

### State Management

```bash
# Install Redux Toolkit and Redux Persist
npm install @reduxjs/toolkit react-redux redux-persist @react-native-async-storage/async-storage
```

### Networking

```bash
# Install Axios and React Query
npm install axios @tanstack/react-query
```

### UI Libraries

```bash
# Install React Native Elements and dependencies
npx expo install @rneui/themed @rneui/base react-native-vector-icons react-native-reanimated
```

## Quick Install (All at Once)

```bash
# Navigate to mobile directory
cd mobile

# Install all dependencies at once
npx expo install react-native-safe-area-context react-native-screens expo-linking react-native-reanimated
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer
npm install @reduxjs/toolkit react-redux redux-persist @react-native-async-storage/async-storage
npm install axios @tanstack/react-query
npm install @rneui/themed @rneui/base react-native-vector-icons

# Install all dependencies
npm install
```

## Post Installation

After installation, the following structure has been created:

### Navigation Structure

- `/src/navigation/` - Navigation configuration
  - `RootNavigator.tsx` - Root navigation container with deep linking
  - `AuthNavigator.tsx` - Authentication stack navigator
  - `MainNavigator.tsx` - Main app stack navigator
  - `StudentTabNavigator.tsx` - Student bottom tab navigator
  - `ParentTabNavigator.tsx` - Parent bottom tab navigator
  - `linking.ts` - Deep linking configuration

### State Management

- `/src/store/` - Redux store configuration
  - `store.ts` - Redux store with redux-persist
  - `hooks.ts` - Typed Redux hooks
  - `/slices/` - Redux slices
    - `authSlice.ts` - Authentication state
    - `userSlice.ts` - User profile state
    - `notificationSlice.ts` - Notifications state

### Type Definitions

- `/src/types/navigation.ts` - Navigation type definitions for all routes

### Screens

- `/src/screens/auth/` - Authentication screens
- `/src/screens/student/` - Student role screens
- `/src/screens/parent/` - Parent role screens
- `/src/screens/common/` - Shared screens

### Configuration

- `/src/config/` - App configuration
  - `theme.ts` - React Native Elements theme
  - `reactQuery.ts` - React Query configuration

### Deep Linking

Deep linking is configured in `app.json` with the following URL schemes:

- `edumobile://` - Custom URL scheme
- `https://edu.app` - Universal links (iOS/Android)

Routes are accessible via deep links:

- `edumobile://login`
- `edumobile://notifications/:notificationId`
- And more...

## Development

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```
