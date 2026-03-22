# Login Flow Implementation

This document describes the complete implementation of the login flow with demo credentials, including authentication state management, navigation, and logout functionality.

## Overview

The login flow has been fully implemented and tested to ensure:
1. ✅ Successful login with demo credentials sets `isAuthenticated=true` and `activeRole='student'`
2. ✅ Automatic navigation from `/(auth)/login` to `/(tabs)/student` after login
3. ✅ Dashboard loads correctly with demo data
4. ✅ Logout clears `activeRole` and all authentication state

## Demo Credentials

### Student Account
- **Email:** `demo@example.com`
- **Password:** `Demo@123`
- **Expected Role:** `student`
- **Redirect:** `/(tabs)/student`

### Parent Account
- **Email:** `parent@demo.com`
- **Password:** `Demo@123`
- **Expected Role:** `parent`
- **Redirect:** `/(tabs)/parent`

## Implementation Details

### 1. Authentication State Management (`authSlice.ts`)

The Redux auth slice manages all authentication state:

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  activeRole: string | null;        // Set based on user.roleInfo.slug
  availableRoles: string[];         // Array of available roles
}
```

**Key Changes:**
- Fixed `activeRole` to be set from `user.roleInfo.slug` instead of `user.role.slug`
- `activeRole` is set in all login actions: `login`, `verifyOTP`, `loginWithBiometric`, and `loadStoredAuth`
- `activeRole` is cleared in `logout` action

### 2. User Data Structure

The `User` interface correctly separates role enum from role info:

```typescript
interface User {
  // ... other fields
  role: UserRole;              // Enum value (e.g., 'student', 'parent')
  roleInfo?: RoleInfo;         // Object with id, name, slug
  // ...
}

interface RoleInfo {
  id: number;
  name: string;
  slug: string;                // Used for activeRole
}
```

### 3. Demo User Data (`dummyData.ts`)

Demo users are configured with proper role information:

```typescript
export const demoStudentUser: DemoUser = {
  email: 'demo@example.com',
  password: 'Demo@123',
  user: {
    // ... other fields
    role: 'student' as any,        // Role enum
    roleInfo: studentRole,         // RoleInfo object with slug
    // ...
  },
};

const studentRole: RoleInfo = {
  id: 3,
  name: 'Student',
  slug: 'student',
};
```

### 4. Navigation Logic (`_layout.tsx`)

The root layout handles automatic navigation based on auth state:

```typescript
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === '(auth)';

  // Redirect to login if not authenticated
  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/login');
  }
  
  // Redirect to appropriate dashboard if authenticated
  else if (isAuthenticated && inAuthGroup) {
    if (activeRole === 'parent') {
      router.replace('/(tabs)/parent');
    } else if (activeRole === 'student') {
      router.replace('/(tabs)/student');
    } else if (activeRole) {
      router.replace('/(tabs)/student');
    }
  }
}, [isAuthenticated, activeRole, segments, isLoading, router]);
```

### 5. Login Screen (`LoginScreen.tsx`)

The login screen dispatches the login action:

```typescript
const handleLogin = async () => {
  const credentials = {
    email: email.trim(),
    password,
    institution_id: institutionId ? parseInt(institutionId) : undefined,
  };

  dispatch(login(credentials));
};
```

### 6. Dashboard (`DashboardScreen.tsx`)

The dashboard loads data based on authentication:

```typescript
const { data: dashboardData } = useQuery({
  queryKey: ['student-dashboard'],
  queryFn: async () => {
    if (await isDemoUser()) {
      return await demoDataApi.student.getDashboard();
    }
    const response = await studentApi.getDashboard();
    return response.data;
  },
});
```

## Test Coverage

### Unit Tests

1. **`loginFlowVerification.test.ts`**
   - Tests all 5 requirements
   - Verifies demo credentials
   - Checks isAuthenticated and activeRole
   - Validates navigation conditions
   - Tests logout functionality

2. **`completeLoginFlow.test.ts`**
   - Comprehensive integration tests
   - Student and parent login flows
   - Logout flow
   - Error handling
   - Session persistence

3. **`loginFlowTest.e2e.ts`**
   - End-to-end scenarios
   - Multiple user roles
   - Edge cases

### Manual Testing

See `LOGIN_FLOW_MANUAL_TEST.md` for step-by-step manual testing instructions.

## Login Flow Sequence

```
1. User enters credentials on LoginScreen
   ↓
2. LoginScreen dispatches login() action
   ↓
3. authSlice calls authApi.login()
   ↓
4. authApi returns demo user data with tokens
   ↓
5. authSlice.login.fulfilled sets:
   - isAuthenticated = true
   - activeRole = 'student'
   - user data
   - tokens
   ↓
6. _layout.tsx detects state change
   ↓
7. Navigation logic checks:
   - isAuthenticated = true
   - inAuthGroup = true (on login page)
   - activeRole = 'student'
   ↓
8. Router redirects to /(tabs)/student
   ↓
9. DashboardScreen loads
   ↓
10. Dashboard queries demo data
```

## Logout Flow Sequence

```
1. User clicks logout button
   ↓
2. Component dispatches logout() action
   ↓
3. authSlice calls authApi.logout()
   ↓
4. authSlice.logout.fulfilled clears:
   - isAuthenticated = false
   - activeRole = null
   - user = null
   - tokens = null
   - availableRoles = []
   ↓
5. _layout.tsx detects state change
   ↓
6. Navigation logic checks:
   - isAuthenticated = false
   - not in auth group
   ↓
7. Router redirects to /(auth)/login
```

## Files Modified

1. **`mobile/src/store/slices/authSlice.ts`**
   - Fixed activeRole to use `user.roleInfo.slug` instead of `user.role.slug`
   - Applied fix to all login actions

2. **`mobile/src/data/dummyData.ts`**
   - Fixed demo user data structure
   - Set `role` as string enum value
   - Set `roleInfo` as RoleInfo object with slug

3. **Test Files Created:**
   - `mobile/__tests__/integration/loginFlowVerification.test.ts`
   - `mobile/__tests__/integration/completeLoginFlow.test.ts`
   - `mobile/__tests__/integration/loginFlowTest.e2e.ts`
   - `mobile/__tests__/LOGIN_FLOW_MANUAL_TEST.md`
   - `mobile/__tests__/LOGIN_FLOW_IMPLEMENTATION.md`

## Verification Checklist

- [x] Login with `demo@example.com` / `Demo@123` works
- [x] `isAuthenticated` is set to `true` after login
- [x] `activeRole` is set to `'student'` for student user
- [x] `activeRole` is set to `'parent'` for parent user
- [x] Navigation redirects from `/(auth)/login` to `/(tabs)/student`
- [x] Dashboard loads with demo data
- [x] Logout clears `activeRole` to `null`
- [x] Logout clears all authentication state
- [x] Navigation redirects from dashboard to `/(auth)/login` after logout
- [x] Invalid credentials are handled properly
- [x] Error states work correctly

## Running Tests

```bash
# Run all login flow tests
npm test -- loginFlow

# Run specific test file
npm test -- loginFlowVerification.test.ts

# Run with coverage
npm test -- --coverage loginFlow
```

## Debugging

To debug the login flow:

1. **Check Redux State:**
   ```javascript
   console.log(store.getState().auth);
   ```

2. **Check Navigation:**
   ```javascript
   const segments = useSegments();
   console.log('Current route:', segments);
   ```

3. **Check activeRole:**
   ```javascript
   const { activeRole, isAuthenticated } = useAppSelector(state => state.auth);
   console.log({ activeRole, isAuthenticated });
   ```

## Common Issues & Solutions

### Issue: activeRole not set after login
**Solution:** Ensure user object has `roleInfo` property with `slug` field

### Issue: Navigation not working
**Solution:** Check that `isLoading` is false and `activeRole` is set

### Issue: Dashboard not loading
**Solution:** Verify `accessToken` exists and `isAuthenticated` is true

### Issue: Logout not clearing activeRole
**Solution:** Check that `logout.fulfilled` reducer sets `activeRole` to `null`

## Next Steps

1. Implement profile screen with logout button
2. Add loading states during navigation
3. Add error boundaries for authentication errors
4. Implement token refresh logic
5. Add biometric authentication tests
6. Add OTP login flow tests

## Related Documentation

- User Types: `mobile/src/types/auth.ts`
- Auth API: `mobile/src/api/authApi.ts`
- Demo Data: `mobile/src/data/dummyData.ts`
- Navigation: `mobile/app/_layout.tsx`
- Login Screen: `mobile/src/screens/auth/LoginScreen.tsx`
- Dashboard: `mobile/src/screens/student/DashboardScreen.tsx`
