# Authentication Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js 16+ 
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Environment Setup

1. **Copy environment file**
   ```bash
   cd mobile
   cp .env.example .env
   ```

2. **Update `.env` with your backend URL**
   ```env
   API_URL=http://localhost:8000/api/v1
   WS_URL=ws://localhost:8000/ws
   APP_ENV=development
   ```

3. **Install dependencies** (already done if you have node_modules)
   ```bash
   npm install
   # or
   yarn install
   ```

### Start the App

```bash
# Start Expo dev server
npm start
# or
expo start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 🔐 Using Authentication in Your Components

### 1. Login Component

```typescript
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login } from '@store/slices/authSlice';

function MyLoginComponent() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await dispatch(login({ email, password })).unwrap();
      // Login successful - navigation handled automatically
    } catch (err) {
      // Handle error - already in state
      console.error(err);
    }
  };

  return (
    // Your JSX here
  );
}
```

### 2. Protected Component

```typescript
import { useAppSelector } from '@store/hooks';

function ProtectedComponent() {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  if (!isAuthenticated) {
    return null; // Or redirect - RootNavigator handles this
  }

  return (
    <View>
      <Text>Welcome, {user?.firstName}!</Text>
    </View>
  );
}
```

### 3. Logout

```typescript
import { useAppDispatch } from '@store/hooks';
import { logout } from '@store/slices/authSlice';

function LogoutButton() {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    // User automatically redirected to login
  };

  return (
    <Button title="Logout" onPress={handleLogout} />
  );
}
```

### 4. Making Authenticated API Calls

```typescript
import { apiClient } from '@api/client';

// The client automatically includes the access token
async function getUserProfile() {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}

// POST request
async function updateProfile(data) {
  const response = await apiClient.put('/users/me', data);
  return response.data;
}
```

### 5. Access Current User

```typescript
import { useAppSelector } from '@store/hooks';

function ProfileScreen() {
  const { user } = useAppSelector(state => state.auth);

  return (
    <View>
      <Text>Name: {user?.firstName} {user?.lastName}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Role: {user?.role}</Text>
    </View>
  );
}
```

## 🔑 Testing Authentication

### Test Login Flow

1. Start the app
2. You should see the Login screen
3. Enter test credentials from your backend
4. Click "Login"
5. On success, you'll be navigated to the main app

### Test Biometric Login

1. Login successfully with credentials
2. Check "Enable Face ID/Fingerprint"
3. Logout
4. Biometric prompt should appear automatically
5. Authenticate with biometrics
6. You should be logged in automatically

### Test Password Reset

1. On login screen, click "Forgot Password?"
2. Enter your email
3. Click "Send Reset Link"
4. Check your email for reset link
5. Use the token to reset password

### Test Session Persistence

1. Login to the app
2. Close the app completely
3. Reopen the app
4. You should be automatically logged in

### Test Token Refresh

1. Login to the app
2. Wait 14-15 minutes (or modify the interval to test sooner)
3. Make an API request
4. Token should refresh automatically in the background

## 🐛 Common Issues & Solutions

### Issue: "Network Error"
**Solution:** Check that your backend is running and the `API_URL` in `.env` is correct

### Issue: "Cannot read property of undefined"
**Solution:** Make sure Redux store is properly initialized in App.tsx

### Issue: Biometric not available
**Solution:** 
- Ensure device has biometric hardware
- Enroll biometric in device settings
- Check permissions in app.json

### Issue: Tokens not persisting
**Solution:** 
- Check expo-secure-store is installed
- Verify storage permissions
- Check console for storage errors

### Issue: Auto-refresh not working
**Solution:**
- Check authService is initialized in RootNavigator
- Verify token format matches backend
- Check token expiration time in JWT

## 📱 Testing on Different Platforms

### iOS
```bash
npm run ios
# or
expo start --ios
```

Requirements:
- macOS
- Xcode installed
- iOS Simulator

### Android
```bash
npm run android
# or
expo start --android
```

Requirements:
- Android Studio installed
- Android Emulator or physical device

### Web (Limited biometric support)
```bash
npm run web
# or
expo start --web
```

Note: Biometric authentication uses AsyncStorage fallback on web

## 🔧 Customization

### Change API Base URL

Edit `.env`:
```env
API_URL=https://your-api.com/api/v1
```

### Adjust Token Refresh Timing

Edit `/mobile/src/utils/authService.ts`:
```typescript
// Refresh every 14 minutes
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

// Refresh when < 5 minutes remaining
return timeUntilExpiration < 5 * 60 * 1000;
```

### Customize Login Screen

Edit `/mobile/src/screens/auth/LoginScreen.tsx` to:
- Change colors/styling
- Add/remove fields
- Modify validation
- Add social login buttons

### Add Custom Error Messages

Edit `/mobile/src/api/client.ts` in the `handleError` method:
```typescript
private handleError(error: any): ApiError {
  if (error.response?.status === 401) {
    return { message: 'Your custom message' };
  }
  // ... other cases
}
```

## 📊 Auth State Structure

```typescript
{
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: 'student' | 'teacher' | 'parent' | 'admin'
  } | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
  biometricEnabled: boolean
}
```

## 🎯 Best Practices

1. **Always use `unwrap()`** when dispatching async thunks to catch errors
   ```typescript
   await dispatch(login(credentials)).unwrap();
   ```

2. **Check authentication status** before accessing protected data
   ```typescript
   const { isAuthenticated } = useAppSelector(state => state.auth);
   if (!isAuthenticated) return null;
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     await dispatch(login(credentials)).unwrap();
   } catch (error) {
     Alert.alert('Error', error.toString());
   }
   ```

4. **Clear errors when unmounting**
   ```typescript
   useEffect(() => {
     return () => {
       dispatch(clearError());
     };
   }, []);
   ```

5. **Use TypeScript types** for type safety
   ```typescript
   import { User } from '@types';
   const user: User | null = useAppSelector(state => state.auth.user);
   ```

## 📚 Additional Resources

- **Full Documentation**: See `AUTH_MODULE_DOCUMENTATION.md`
- **Implementation Summary**: See `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`
- **Backend API**: Ensure your backend implements required endpoints

## 🆘 Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify backend is running and accessible
3. Check environment variables are correct
4. Review the full documentation
5. Check Redux DevTools (if configured)

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Backend API is accessible
- [ ] Environment variables are set correctly
- [ ] Login works with test credentials
- [ ] Token refresh works (wait 15 minutes or test manually)
- [ ] Session persists across app restarts
- [ ] Logout clears all data
- [ ] Error messages are user-friendly
- [ ] Biometric works on supported devices
- [ ] Password reset flow works
- [ ] All navigation flows work correctly

## 🎉 You're Ready!

The authentication module is fully implemented and ready to use. Start testing with your backend and customize as needed for your specific requirements.

For detailed technical documentation, see `AUTH_MODULE_DOCUMENTATION.md`.
