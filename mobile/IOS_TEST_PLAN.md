# iOS Platform Test Plan

## Test Overview

This document provides a comprehensive test plan for validating iOS platform functionality in the EduTrack mobile application.

## Prerequisites

- Mac with macOS 10.15 (Catalina) or later
- Xcode 13.0 or later installed
- iOS Simulator or physical iOS device (iOS 13.4+)
- Node.js 16+ and npm installed
- Expo CLI installed globally: `npm install -g expo-cli`

## Environment Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Verify iOS Setup

```bash
npm run validate-ios
```

This command will check:
- All required files exist
- Path aliases are configured correctly
- Dependencies are installed
- iOS-specific configurations are present

## Test Scenarios

### Test 1: Application Launch

**Objective:** Verify the app launches without crashes on iOS

**Steps:**
1. Run `npx expo start --ios`
2. Wait for Metro bundler to start
3. Wait for iOS Simulator to open
4. Observe app launch

**Expected Results:**
- Metro bundler starts successfully
- iOS Simulator opens automatically
- App installs and launches without errors
- Splash screen displays briefly
- App navigates to login screen

**Pass Criteria:** ✓ App launches without crashes

---

### Test 2: Path Alias Resolution

**Objective:** Verify all path aliases (@store, @components, @utils) resolve correctly

**Steps:**
1. Launch the app
2. Monitor Metro bundler console for any module resolution errors
3. Check that login screen renders properly

**Expected Results:**
- No "Unable to resolve module" errors in Metro console
- All imports using @ aliases work correctly
- Components render as expected

**Pass Criteria:** ✓ No path resolution errors

---

### Test 3: expo-secure-store Integration

**Objective:** Verify secure token storage works on iOS

**Steps:**
1. Navigate to login screen
2. Enter credentials:
   - Email: `demo@example.com`
   - Password: `Demo@123`
3. Tap "Sign In"
4. Wait for authentication to complete
5. Close and restart the app

**Expected Results:**
- Login succeeds without errors
- Tokens are stored securely using iOS Keychain
- User remains logged in after app restart
- No console errors related to SecureStore

**Pass Criteria:** ✓ Tokens persist across app restarts

---

### Test 4: Biometric Authentication

**Objective:** Verify Face ID/Touch ID integration works correctly

**Steps:**
1. Ensure biometrics are configured in Simulator/Device:
   - Simulator: Features → Face ID → Enrolled
2. Log in with demo credentials
3. Navigate to Profile/Settings
4. Look for biometric authentication option
5. Enable biometric authentication
6. Log out
7. On login screen, tap "Sign In with Face ID/Touch ID"
8. Authenticate using biometric prompt

**Expected Results:**
- Biometric enrollment prompt appears
- iOS native authentication dialog shows
- Successful authentication logs user in
- Error handling works for failed authentication

**Pass Criteria:** ✓ Biometric authentication works correctly

---

### Test 5: Login Flow Navigation

**Objective:** Verify complete login to dashboard navigation works

**Steps:**
1. Start at login screen
2. Enter student credentials:
   - Email: `demo@example.com`
   - Password: `Demo@123`
3. Tap "Sign In"
4. Observe navigation flow

**Expected Results:**
- Loading indicator appears during login
- Navigation automatically moves to student dashboard
- Dashboard loads without errors
- All dashboard widgets render correctly
- Tab bar appears at bottom

**Pass Criteria:** ✓ Complete navigation flow works

---

### Test 6: Student Dashboard Features

**Objective:** Verify student dashboard displays all features correctly

**Steps:**
1. Log in as student
2. Observe dashboard layout
3. Check for all widgets:
   - Welcome card with student name
   - Attendance status
   - Upcoming assignments
   - Recent grades
   - AI predictions
   - Streak tracker
   - Gamification widgets
4. Pull to refresh dashboard

**Expected Results:**
- All widgets load and display data
- UI renders correctly on iOS
- Pull-to-refresh works smoothly
- No layout issues or overlapping elements
- Images and icons load correctly

**Pass Criteria:** ✓ All dashboard features display correctly

---

### Test 7: Role Switching (Parent/Student)

**Objective:** Verify role switching works correctly

**Steps:**
1. Log in as student
2. Look for role switcher in header
3. Tap role switcher
4. Select "Parent" role
5. Observe navigation change

**Expected Results:**
- Role switcher button visible in header
- Tapping opens role selection modal
- Switching to parent role navigates to parent dashboard
- Data updates for new role
- Tab bar updates for new role

**Pass Criteria:** ✓ Role switching works smoothly

---

### Test 8: Deep Linking

**Objective:** Verify deep links work on iOS

**Steps:**
1. With app running, open Safari (Simulator)
2. Navigate to: `edutrack://assignments/123`
3. Observe app behavior

**Expected Results:**
- App comes to foreground
- Navigates to specified assignment
- Deep link parameters are parsed correctly

**Pass Criteria:** ✓ Deep links open app and navigate correctly

---

### Test 9: Background Refresh

**Objective:** Verify background sync works on iOS

**Steps:**
1. Log in to app
2. Put app in background (Home button)
3. Wait 15+ minutes
4. Bring app to foreground

**Expected Results:**
- Background fetch task executes
- Data syncs in background
- Fresh data appears when app returns to foreground
- No crashes from background tasks

**Pass Criteria:** ✓ Background sync works correctly

---

### Test 10: Offline Mode

**Objective:** Verify offline functionality works on iOS

**Steps:**
1. Log in with internet connection
2. Navigate to dashboard
3. Turn off WiFi and cellular data in Simulator
4. Navigate through app
5. Observe offline indicators
6. Turn internet back on

**Expected Results:**
- Offline indicator appears when disconnected
- Cached data displays correctly
- Operations queue for later sync
- Online indicator appears when reconnected
- Queued operations sync automatically

**Pass Criteria:** ✓ Offline mode works correctly

---

### Test 11: Memory Management

**Objective:** Verify app doesn't have memory leaks on iOS

**Steps:**
1. Launch app with Xcode Instruments
2. Run Memory Leak detection tool
3. Navigate through multiple screens
4. Log in/out multiple times
5. Switch roles multiple times

**Expected Results:**
- No memory leaks detected
- Memory usage stays reasonable
- App doesn't crash from memory issues

**Pass Criteria:** ✓ No memory leaks detected

---

### Test 12: Performance

**Objective:** Verify app performs well on iOS

**Steps:**
1. Launch app and measure startup time
2. Navigate between screens
3. Scroll through long lists
4. Load images and assets

**Expected Results:**
- App launches in < 3 seconds
- Screen transitions are smooth (60fps)
- Scrolling is smooth without lag
- Images load progressively

**Pass Criteria:** ✓ Performance is acceptable

---

## Test Execution Matrix

| Test # | Test Name | iOS 15 | iOS 16 | iOS 17 | Notes |
|--------|-----------|--------|--------|--------|-------|
| 1 | App Launch | ⬜ | ⬜ | ⬜ | |
| 2 | Path Aliases | ⬜ | ⬜ | ⬜ | |
| 3 | Secure Store | ⬜ | ⬜ | ⬜ | |
| 4 | Biometrics | ⬜ | ⬜ | ⬜ | |
| 5 | Login Flow | ⬜ | ⬜ | ⬜ | |
| 6 | Dashboard | ⬜ | ⬜ | ⬜ | |
| 7 | Role Switch | ⬜ | ⬜ | ⬜ | |
| 8 | Deep Linking | ⬜ | ⬜ | ⬜ | |
| 9 | Background | ⬜ | ⬜ | ⬜ | |
| 10 | Offline | ⬜ | ⬜ | ⬜ | |
| 11 | Memory | ⬜ | ⬜ | ⬜ | |
| 12 | Performance | ⬜ | ⬜ | ⬜ | |

## Known Issues

### Issue 1: Biometric Simulation
**Description:** iOS Simulator may require manual Face ID enrollment
**Workaround:** Features → Face ID → Enrolled in Simulator menu

### Issue 2: Background Fetch Testing
**Description:** Background fetch doesn't trigger reliably in Simulator
**Workaround:** Test on physical device or manually trigger sync

## Test Credentials

### Student Account
- Email: `demo@example.com`
- Password: `Demo@123`

### Parent Account
- Email: `parent@demo.com`
- Password: `Demo@123`

## Common Commands

```bash
# Start iOS development
npx expo start --ios

# Start with specific simulator
npx expo start --ios --simulator="iPhone 14 Pro"

# Clear cache and restart
npx expo start --ios --clear

# Run validation
npm run validate-ios

# Run tests
npm run test-ios

# Type checking
npm run type-check

# Linting
npm run lint
```

## Troubleshooting

### App Won't Launch
1. Clear Metro cache: `npx expo start --clear`
2. Reinstall node_modules: `rm -rf node_modules && npm install`
3. Clean iOS build: `cd ios && xcodebuild clean`

### Path Alias Errors
1. Verify babel.config.js has path aliases
2. Check tsconfig.json has matching paths
3. Check metro.config.js has extraNodeModules
4. Restart Metro bundler

### SecureStore Errors
1. Check expo-secure-store is installed
2. Verify app.json has plugin configured
3. Test on device if Simulator has issues

### Biometric Issues
1. Enroll Face ID in Simulator
2. Grant biometric permissions
3. Check NSFaceIDUsageDescription in app.json

## Success Criteria

All 12 tests must pass on at least iOS 15 and iOS 16 for the platform to be considered production-ready.

## Test Report Template

```markdown
# iOS Test Report

**Date:** [Date]
**Tester:** [Name]
**iOS Version:** [Version]
**Device/Simulator:** [Device]

## Test Results

- Test 1: [✓/✗] [Notes]
- Test 2: [✓/✗] [Notes]
- Test 3: [✓/✗] [Notes]
- Test 4: [✓/✗] [Notes]
- Test 5: [✓/✗] [Notes]
- Test 6: [✓/✗] [Notes]
- Test 7: [✓/✗] [Notes]
- Test 8: [✓/✗] [Notes]
- Test 9: [✓/✗] [Notes]
- Test 10: [✓/✗] [Notes]
- Test 11: [✓/✗] [Notes]
- Test 12: [✓/✗] [Notes]

## Summary
- Total Tests: 12
- Passed: [Count]
- Failed: [Count]
- Blocked: [Count]

## Issues Found
[List any issues discovered]

## Recommendations
[Any recommendations for improvements]
```
