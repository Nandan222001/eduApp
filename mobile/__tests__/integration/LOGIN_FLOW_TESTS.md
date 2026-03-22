# Login Flow Integration Tests

This directory contains comprehensive integration tests for the login flow with demo credentials.

## Test Files

### 1. `demoLoginFlow.test.tsx` - Redux State Tests
Tests the authentication state management without UI components.

**What it tests:**
- ✅ Successful login sets `isAuthenticated=true`
- ✅ Successful login sets `activeRole='student'` (UserRole.STUDENT)
- ✅ User data is correctly stored in state
- ✅ Access and refresh tokens are stored
- ✅ Navigation prerequisites are met (isAuthenticated, activeRole, isLoading)
- ✅ Dashboard prerequisites are met (user data, tokens)
- ✅ Logout clears `activeRole`
- ✅ Logout clears all auth data
- ✅ Error handling for failed login
- ✅ Role-based navigation logic

**How to run:**
```bash
npm test demoLoginFlow.test.tsx
```

### 2. `loginFlowE2E.test.tsx` - End-to-End UI Tests
Tests the complete login flow from UI interaction to state changes.

**What it tests:**
- ✅ User can enter demo credentials in login screen
- ✅ Form submission triggers authentication
- ✅ Authentication state updates correctly
- ✅ Navigation conditions are met
- ✅ Dashboard can load with authenticated state
- ✅ Logout functionality works correctly
- ✅ Error handling for invalid credentials
- ✅ Role-based navigation for different user types

**How to run:**
```bash
npm test loginFlowE2E.test.tsx
```

### 3. `loginFlow.test.tsx` - Comprehensive Integration Tests
Original comprehensive tests covering both UI and state.

**How to run:**
```bash
npm test loginFlow.test.tsx
```

## Demo Credentials

The tests use these demo credentials:

- **Student:** demo@example.com / Demo@123
- **Parent:** parent@demo.com / Demo@123

## Test Requirements Coverage

### ✅ Requirement 1: Successful Login Sets isAuthenticated=true
**Tested in:**
- `demoLoginFlow.test.tsx` → "should set isAuthenticated=true when logging in with demo@example.com/Demo@123"
- `loginFlowE2E.test.tsx` → "should complete full login flow with demo credentials"

### ✅ Requirement 2: Successful Login Sets activeRole=UserRole.STUDENT
**Tested in:**
- `demoLoginFlow.test.tsx` → "should set activeRole=UserRole.STUDENT for demo student user"
- `loginFlowE2E.test.tsx` → "should complete full login flow with demo credentials"

### ✅ Requirement 3: Navigation Redirects from /(auth)/login to /(tabs)/student
**Tested in:**
- `demoLoginFlow.test.tsx` → "should have correct state for navigation to /(tabs)/student"
- `loginFlowE2E.test.tsx` → "should verify role-based navigation for student role"

The tests verify that the conditions for navigation are met:
- `isAuthenticated === true`
- `activeRole === 'student'`
- `isLoading === false`

The actual navigation is handled by `RootLayoutNav` in `app/_layout.tsx`:
```typescript
if (isAuthenticated && inAuthGroup) {
  if (activeRole === 'student') {
    router.replace('/(tabs)/student');
  }
}
```

### ✅ Requirement 4: Dashboard Loads Correctly
**Tested in:**
- `demoLoginFlow.test.tsx` → "should have authenticated state ready for dashboard to load"
- `loginFlowE2E.test.tsx` → "should verify dashboard can load after successful login"

The tests verify that dashboard prerequisites are met:
- User data is available
- Access token is available for API calls
- Active role is set correctly

### ✅ Requirement 5: Logout Clears activeRole
**Tested in:**
- `demoLoginFlow.test.tsx` → "should clear activeRole when logging out"
- `loginFlowE2E.test.tsx` → "should logout and clear activeRole"

## Running All Login Flow Tests

Run all login flow tests together:

```bash
npm test -- --testPathPattern="integration/(demoLoginFlow|loginFlowE2E|loginFlow)"
```

Or run all integration tests:

```bash
npm test -- __tests__/integration/
```

## Test Architecture

### Mock Setup
All tests mock the following dependencies:
- `authApi` - Authentication API calls
- `expo-secure-store` - Secure token storage
- `biometric` utilities - Biometric authentication

### Test Data
Tests use demo user data from:
- `mobile/src/data/dummyData.ts` - Contains `demoStudentUser` and `demoParentUser`

### State Management
Tests use the real Redux store setup from:
- `mobile/__tests__/utils/mockStore.tsx` - Creates test store with reducers

## Debugging Tests

If tests fail, check:

1. **Mock Setup:** Ensure all dependencies are properly mocked
2. **API Responses:** Verify mock API returns expected data structure
3. **State Updates:** Check if Redux actions are dispatching correctly
4. **Async Operations:** Use `waitFor` for async state updates
5. **Component Rendering:** Verify components render with correct props

## Common Issues

### Issue: "isAuthenticated is not true"
**Solution:** Ensure mock API resolves with correct token response and user data

### Issue: "activeRole is null"
**Solution:** Check that user data includes `role.slug` field

### Issue: "Component not rendering"
**Solution:** Verify all required providers are in `renderWithProviders`

### Issue: "Test timeout"
**Solution:** Increase timeout in `waitFor` or check for infinite loops

## Code Coverage

These tests contribute to coverage of:
- `src/store/slices/authSlice.ts` - Authentication state management
- `src/screens/auth/LoginScreen.tsx` - Login UI
- `src/api/authApi.ts` - Authentication API
- `app/_layout.tsx` - Navigation logic

## Continuous Integration

Tests run automatically in CI pipeline:
```bash
npm run test:ci
```

## Related Documentation

- [Testing Guide](../__tests__/README.md)
- [Quick Start](../__tests__/QUICK_START_TESTING.md)
- [Demo Users](../../src/data/DEMO_USERS.md)
- [Authentication Flow](../../docs/AUTHENTICATION.md)
