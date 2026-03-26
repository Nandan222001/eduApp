# Authentication Flow Test Plan

Complete test coverage for authentication flows across all platforms.

## Test Files Created

1. **auth-login.test.ts** - Login flow tests
2. **auth-token-storage.test.ts** - Token storage tests
3. **auth-token-refresh.test.ts** - Token refresh tests
4. **auth-biometric.test.ts** - Biometric authentication tests
5. **auth-session-persistence.test.ts** - Session persistence tests

## Test Coverage

### 1. Login with Demo Credentials ✅

#### Student Login (demo@example.com / Demo@123)
- ✅ Successful login with correct credentials
- ✅ Token storage (SecureStore/AsyncStorage)
- ✅ Redux state updates
- ✅ User data fetching
- ✅ Demo user flag setting
- ✅ Active role assignment

#### Parent Login (parent@demo.com / Demo@123)
- ✅ Successful login with correct credentials
- ✅ Token storage
- ✅ Redux state updates
- ✅ Parent role assignment

#### Login Failures
- ✅ Invalid credentials handling
- ✅ Network error handling
- ✅ API error handling
- ✅ Error message display

### 2. Token Storage ✅

#### Platform-Specific Storage
- ✅ SecureStore on iOS (when available)
- ✅ SecureStore on Android (when available)
- ✅ AsyncStorage on Web
- ✅ Fallback to AsyncStorage on native if SecureStore unavailable

#### Token Operations
- ✅ Store access token
- ✅ Store refresh token
- ✅ Retrieve access token
- ✅ Retrieve refresh token
- ✅ Store both tokens atomically
- ✅ Clear tokens on logout
- ✅ Clear all auth data

#### Additional Data Storage
- ✅ Store user email
- ✅ Store biometric enabled flag
- ✅ Store demo user flag
- ✅ Store/retrieve objects (generic)

### 3. Token Refresh ✅

#### Automatic Refresh
- ✅ Start auto-refresh timer on login
- ✅ Refresh tokens every 14 minutes
- ✅ Stop auto-refresh on logout
- ✅ Restart timer after manual refresh

#### Demo Token Refresh
- ✅ Refresh demo student tokens
- ✅ Refresh demo parent tokens
- ✅ Generate new timestamp-based tokens
- ✅ Maintain refresh token

#### Real API Token Refresh
- ✅ Call refresh API endpoint
- ✅ Update both access and refresh tokens
- ✅ Handle refresh failures
- ✅ Clear session on expired refresh token

#### Token Expiration
- ✅ Detect expiring JWT tokens (< 5 min)
- ✅ Demo tokens never expire
- ✅ Check and refresh if needed
- ✅ Handle malformed tokens

### 4. Logout ✅

#### Complete Logout
- ✅ Call logout API
- ✅ Clear all tokens from storage
- ✅ Clear Redux state
- ✅ Clear biometric settings
- ✅ Clear active role
- ✅ Reset to initial state

#### Logout Edge Cases
- ✅ Logout with API failure
- ✅ Logout when already logged out
- ✅ Force logout on token refresh failure

### 5. Biometric Login ✅

#### Availability
- ✅ Check biometric hardware availability
- ✅ Check enrollment status
- ✅ Detect Face ID on iOS
- ✅ Detect Touch ID on iOS/Android
- ✅ Detect Fingerprint on Android
- ✅ Not available on web

#### Enable Biometric
- ✅ Check availability before enabling
- ✅ Prompt for biometric authentication
- ✅ Save enabled flag to storage
- ✅ Update Redux state
- ✅ Handle user cancellation
- ✅ Handle authentication failure

#### Disable Biometric
- ✅ Clear enabled flag
- ✅ Update Redux state

#### Biometric Login Flow
- ✅ Check biometric enabled
- ✅ Check stored tokens exist
- ✅ Prompt for biometric auth
- ✅ Fetch current user on success
- ✅ Update Redux state
- ✅ Handle no stored credentials
- ✅ Handle biometric failure
- ✅ Handle biometric not available

### 6. Session Persistence ✅

#### App Restart
- ✅ Load stored tokens on startup
- ✅ Fetch fresh user data from API
- ✅ Restore Redux state
- ✅ Restore biometric settings
- ✅ Restore active role
- ✅ Handle missing tokens
- ✅ Handle invalid tokens

#### Redux Persist
- ✅ REHYDRATE action handling
- ✅ Restore user data
- ✅ Restore tokens
- ✅ Force isAuthenticated to true if tokens exist
- ✅ Set active role from user data
- ✅ Handle missing data gracefully

#### Cross-Restart Scenarios
- ✅ Login → Close App → Open App → Still logged in
- ✅ Login → Logout → Close App → Open App → Not logged in
- ✅ Enable Biometric → Close App → Open App → Still enabled
- ✅ Demo user flag persists across restarts

## Platform-Specific Tests

### iOS
- ✅ SecureStore integration
- ✅ Face ID authentication
- ✅ Touch ID authentication
- ✅ Keychain access

### Android
- ✅ SecureStore integration
- ✅ Fingerprint authentication
- ✅ Face recognition (supported devices)
- ✅ Keystore access

### Web
- ✅ AsyncStorage fallback
- ✅ Biometric not available
- ✅ LocalStorage persistence
- ✅ Session storage

## Manual Test Scenarios

### Demo Student Login Flow
```bash
1. Open app
2. Enter: demo@example.com / Demo@123
3. Click "Sign In"
4. ✅ Should navigate to student dashboard
5. ✅ Should display "Alex Johnson" profile
6. ✅ Should show student-specific features
```

### Demo Parent Login Flow
```bash
1. Open app
2. Enter: parent@demo.com / Demo@123
3. Click "Sign In"
4. ✅ Should navigate to parent dashboard
5. ✅ Should display "Sarah Johnson" profile
6. ✅ Should show children list
```

### Session Persistence Flow
```bash
1. Login with demo credentials
2. Close app completely
3. Reopen app
4. ✅ Should still be logged in
5. ✅ Should show same user data
6. ✅ Should not show login screen
```

### Token Refresh Flow
```bash
1. Login with demo credentials
2. Wait 14+ minutes (or fast-forward in tests)
3. ✅ Tokens should auto-refresh
4. ✅ User should remain logged in
5. ✅ No interruption to user experience
```

### Biometric Enable Flow (iOS)
```bash
1. Login with demo credentials
2. Go to Settings/Profile
3. Enable "Face ID Login"
4. ✅ Should prompt for Face ID
5. ✅ Authenticate with Face ID
6. ✅ Setting should be saved
7. Logout
8. On login screen, tap "Face ID" button
9. ✅ Should authenticate with Face ID
10. ✅ Should login successfully
```

### Biometric Enable Flow (Android)
```bash
1. Login with demo credentials
2. Go to Settings/Profile
3. Enable "Fingerprint Login"
4. ✅ Should prompt for fingerprint
5. ✅ Authenticate with fingerprint
6. ✅ Setting should be saved
7. Logout
8. On login screen, tap "Fingerprint" button
9. ✅ Should authenticate with fingerprint
10. ✅ Should login successfully
```

### Logout Flow
```bash
1. Login with demo credentials
2. Navigate to Profile/Settings
3. Click "Logout"
4. ✅ Should show confirmation dialog
5. Confirm logout
6. ✅ Should clear all data
7. ✅ Should return to login screen
8. Close and reopen app
9. ✅ Should show login screen (not logged in)
```

## Running Tests

### Run All Auth Tests
```bash
npm test -- auth
```

### Run Specific Test File
```bash
npm test -- auth-login.test.ts
npm test -- auth-token-storage.test.ts
npm test -- auth-token-refresh.test.ts
npm test -- auth-biometric.test.ts
npm test -- auth-session-persistence.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage auth
```

### Watch Mode
```bash
npm test -- --watch auth
```

## Test Data

### Demo Student
- **Email**: demo@example.com
- **Password**: Demo@123
- **Role**: Student
- **Name**: Alex Johnson
- **Grade**: 10th Grade
- **Section**: 10-A

### Demo Parent
- **Email**: parent@demo.com
- **Password**: Demo@123
- **Role**: Parent
- **Name**: Sarah Johnson
- **Children**: Alex Johnson (10th), Emma Johnson (7th)

### Demo Tokens
- **Student Access**: demo_student_access_token_[timestamp]
- **Student Refresh**: demo_student_refresh_token_[timestamp]
- **Parent Access**: demo_parent_access_token_[timestamp]
- **Parent Refresh**: demo_parent_refresh_token_[timestamp]

## Expected Behaviors

### Login
- ✅ Tokens stored in SecureStore (native) or AsyncStorage (web)
- ✅ User data fetched from API
- ✅ Redux state updated
- ✅ Navigation to role-specific dashboard
- ✅ Auto-refresh timer started

### Logout
- ✅ All tokens cleared from storage
- ✅ Redux state reset
- ✅ Auto-refresh timer stopped
- ✅ Navigation to login screen
- ✅ No data persists after logout

### Token Refresh
- ✅ Happens automatically every 14 minutes
- ✅ Updates both access and refresh tokens
- ✅ No user interruption
- ✅ Works for demo and real tokens
- ✅ Restarts timer after refresh

### Session Persistence
- ✅ Survives app restart
- ✅ Tokens loaded from storage
- ✅ Fresh user data fetched
- ✅ Redux state restored
- ✅ User remains logged in

### Biometric
- ✅ Only available on iOS/Android
- ✅ Requires device enrollment
- ✅ Stored credentials required
- ✅ Works with Face ID, Touch ID, Fingerprint
- ✅ Setting persists across restarts

## Edge Cases Covered

- ✅ Network offline during login
- ✅ Network offline during token refresh
- ✅ Expired tokens
- ✅ Invalid tokens
- ✅ Malformed tokens
- ✅ No tokens stored
- ✅ Biometric not enrolled
- ✅ Biometric cancelled by user
- ✅ Biometric locked out
- ✅ API errors
- ✅ Storage errors
- ✅ Concurrent operations

## Known Limitations

### Web Platform
- ❌ No biometric authentication support
- ⚠️ AsyncStorage not as secure as SecureStore
- ⚠️ Tokens visible in browser DevTools

### Demo Mode
- ⚠️ Tokens don't actually expire (timestamp-based)
- ⚠️ No real backend validation
- ✅ Perfect for offline testing and demos

## Success Criteria

✅ All unit tests pass  
✅ All integration tests pass  
✅ Manual test scenarios verified  
✅ Works on iOS simulator/device  
✅ Works on Android emulator/device  
✅ Works on Web browser  
✅ Biometric works on physical devices  
✅ Session persists across app restarts  
✅ Token refresh works automatically  
✅ Logout clears all data  

## Next Steps

After running tests:
1. Verify all tests pass
2. Test manually on each platform
3. Test with real API backend (when available)
4. Test biometric on physical devices
5. Test edge cases manually
6. Monitor for any production issues

## Troubleshooting

### Tests Failing
- Check mock setup
- Verify test data
- Check async/await usage
- Verify jest configuration

### Manual Tests Failing
- Check network connectivity
- Verify demo data is loaded
- Check storage permissions
- Verify biometric enrollment (for biometric tests)

### Token Refresh Not Working
- Check timer implementation
- Verify authService.initializeAuth() is called
- Check token expiration logic
- Verify refresh API is mocked correctly

### Session Not Persisting
- Check redux-persist configuration
- Verify storage is working
- Check REHYDRATE action
- Verify loadStoredAuth() is called on app start
