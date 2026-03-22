# Android Test Plan

Comprehensive testing guide for the EduTrack Android application.

## Test Environment Setup

### Required Setup
- Android Emulator (API 30+ recommended) OR Android physical device
- Development server running (`npx expo start --android`)
- Network connectivity toggle capability

### Test Account Credentials
- **Student**: `demo@example.com` / `Demo@123`
- **Parent**: `parent@demo.com` / `Demo@123`

---

## 1. App Launch & Initialization Tests

### 1.1 Cold Start
**Steps:**
1. Clear app data: `adb shell pm clear com.edutrack.app`
2. Launch app from device home screen
3. Observe splash screen
4. Wait for app to initialize

**Expected Results:**
- ✅ Splash screen displays correctly
- ✅ App initializes without errors
- ✅ Redirects to login screen (not authenticated)
- ✅ No console errors in Metro bundler

### 1.2 Warm Start
**Steps:**
1. Use app normally
2. Press home button
3. Re-open app from recent apps

**Expected Results:**
- ✅ App resumes instantly
- ✅ State preserved
- ✅ No re-initialization needed

### 1.3 Android Initialization
**Steps:**
1. Check Android-specific initialization in logs
2. Look for "[Android]" prefixed log messages

**Expected Results:**
- ✅ "[Android] Initializing Android-specific features..." appears
- ✅ "[Android] Secure storage initialized successfully"
- ✅ "[Android] Background modes initialized"
- ✅ "[Android] Android platform initialization complete"

---

## 2. Authentication Tests

### 2.1 Login Flow
**Steps:**
1. Launch app
2. Enter credentials: `demo@example.com` / `Demo@123`
3. Tap "Login"

**Expected Results:**
- ✅ Login button shows loading state
- ✅ Successful authentication
- ✅ Redirect to student dashboard
- ✅ Tokens stored in SecureStore
- ✅ Auth state persisted

### 2.2 Session Persistence
**Steps:**
1. Log in successfully
2. Close app completely
3. Reopen app

**Expected Results:**
- ✅ User remains authenticated
- ✅ Redirects to dashboard (not login)
- ✅ User data loaded from storage

### 2.3 Biometric Authentication (if available)
**Steps:**
1. Log in with credentials
2. Enable biometric in settings
3. Log out
4. Attempt login with biometric

**Expected Results:**
- ✅ Biometric prompt appears
- ✅ Successful authentication after biometric verification
- ✅ Redirects to dashboard

---

## 3. Redux Persist Tests

### 3.1 State Persistence
**Steps:**
1. Log in and navigate to dashboard
2. Let dashboard data load
3. Force close app: `adb shell am force-stop com.edutrack.app`
4. Reopen app

**Expected Results:**
- ✅ Auth state restored
- ✅ Dashboard data cached and displayed
- ✅ User profile data available
- ✅ Navigation state preserved

### 3.2 Offline Queue Persistence
**Steps:**
1. Turn off network
2. Perform an action (e.g., submit assignment)
3. Verify item in queue
4. Force close app
5. Reopen app

**Expected Results:**
- ✅ Queue persisted across app restarts
- ✅ Queued items still visible
- ✅ Queue count accurate

---

## 4. Network Connectivity Tests

### 4.1 NetInfo Integration
**Steps:**
1. Start app with network enabled
2. Check offline indicator (should not show)
3. Disable network via airplane mode
4. Observe offline indicator
5. Re-enable network

**Expected Results:**
- ✅ Offline indicator hidden when online
- ✅ Offline indicator appears when network disabled
- ✅ Indicator disappears when network restored
- ✅ Real-time status updates

### 4.2 Connection Type Detection
**Steps:**
1. Connect to WiFi
2. Check logs for connection type
3. Switch to cellular data
4. Check logs again

**Expected Results:**
- ✅ Correctly identifies WiFi connection
- ✅ Correctly identifies cellular connection
- ✅ Detects connection changes in real-time

### 4.3 Internet Reachability
**Steps:**
1. Connect to WiFi with no internet
2. Observe app behavior
3. Restore internet connectivity

**Expected Results:**
- ✅ Detects no internet despite WiFi connection
- ✅ Shows offline indicator
- ✅ Updates when internet restored

---

## 5. Offline Queue Functionality Tests

### 5.1 Queue Request
**Steps:**
1. Turn off network
2. Attempt to submit an assignment
3. Check queue viewer

**Expected Results:**
- ✅ Request added to queue
- ✅ User notified of offline status
- ✅ Queue count increments
- ✅ Request details visible in queue viewer

### 5.2 Auto-Process on Reconnect
**Steps:**
1. Queue 2-3 requests while offline
2. Turn network back on
3. Observe queue processing

**Expected Results:**
- ✅ Queue automatically processes
- ✅ Requests executed in order
- ✅ Queue count decrements
- ✅ Success notifications shown

### 5.3 Manual Queue Processing
**Steps:**
1. Queue requests while offline
2. Stay offline
3. Tap manual sync button

**Expected Results:**
- ✅ Sync button shows error (no network)
- ✅ Queue remains intact
- ✅ User notified of network requirement

### 5.4 Failed Request Retry
**Steps:**
1. Queue a request that will fail (e.g., invalid data)
2. Turn network on
3. Watch retry mechanism

**Expected Results:**
- ✅ Request retries up to max attempts (3)
- ✅ Exponential backoff between retries
- ✅ Request removed after max retries
- ✅ User notified of failure

### 5.5 Queue Clear
**Steps:**
1. Queue multiple requests
2. Navigate to queue viewer
3. Tap "Clear Queue"

**Expected Results:**
- ✅ Confirmation prompt appears
- ✅ Queue cleared after confirmation
- ✅ Queue count resets to 0
- ✅ UI updates immediately

---

## 6. Navigation Tests

### 6.1 Tab Navigation
**Steps:**
1. Log in as student
2. Tap each tab: Home, Assignments, Schedule, Grades, Profile

**Expected Results:**
- ✅ All tabs accessible
- ✅ Smooth transitions
- ✅ Tab state preserved
- ✅ No navigation errors

### 6.2 Stack Navigation
**Steps:**
1. Navigate to Assignments
2. Tap an assignment to view details
3. Press back button

**Expected Results:**
- ✅ Detail screen loads
- ✅ Back button returns to list
- ✅ List scroll position preserved
- ✅ No navigation stack errors

### 6.3 Deep Linking
**Steps:**
1. Send deep link via ADB:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW \
     -d "edutrack://assignments/123" com.edutrack.app
   ```

**Expected Results:**
- ✅ App opens to specific screen
- ✅ Correct data loaded
- ✅ Navigation stack correct

---

## 7. Background Sync Tests

### 7.1 Background Fetch Registration
**Steps:**
1. Check logs for background fetch registration
2. Look for "[Android] Background modes initialized"

**Expected Results:**
- ✅ Background fetch registered successfully
- ✅ No errors in registration

### 7.2 Background Processing
**Steps:**
1. Queue offline requests
2. Put app in background
3. Wait 15+ minutes (or force background task)
4. Bring app to foreground

**Expected Results:**
- ✅ Queue processed in background
- ✅ Sync timestamp updated
- ✅ Data refreshed

---

## 8. Data Loading & Caching Tests

### 8.1 Dashboard Load
**Steps:**
1. Log in
2. Navigate to dashboard
3. Observe data loading

**Expected Results:**
- ✅ Loading indicator shown
- ✅ Data loads successfully
- ✅ UI updates with data
- ✅ No render errors

### 8.2 Cached Data Display
**Steps:**
1. Load dashboard with network on
2. Turn network off
3. Close and reopen app
4. Navigate to dashboard

**Expected Results:**
- ✅ Cached data displays immediately
- ✅ No loading spinner
- ✅ Cached data indicator shown
- ✅ All UI elements render correctly

### 8.3 Data Refresh
**Steps:**
1. View cached data
2. Turn network on
3. Pull to refresh

**Expected Results:**
- ✅ Refresh indicator shown
- ✅ New data fetched
- ✅ UI updates with fresh data
- ✅ Cached timestamp updated

---

## 9. UI/UX Tests

### 9.1 Screen Rendering
**Steps:**
1. Navigate to each screen in the app
2. Check console for errors

**Expected Results:**
- ✅ All screens render without errors
- ✅ No import errors in Metro logs
- ✅ Components display correctly
- ✅ Proper layout on different screen sizes

### 9.2 Touch Interactions
**Steps:**
1. Test buttons, tabs, and interactive elements
2. Verify touch feedback

**Expected Results:**
- ✅ All buttons respond to touch
- ✅ Visual feedback on press
- ✅ Appropriate touch target sizes
- ✅ No double-tap issues

### 9.3 Offline Indicator UI
**Steps:**
1. Toggle network on/off multiple times
2. Observe indicator behavior

**Expected Results:**
- ✅ Indicator animates smoothly
- ✅ Color/icon changes appropriately
- ✅ Position doesn't obstruct content
- ✅ Message is clear and helpful

---

## 10. Performance Tests

### 10.1 App Launch Time
**Steps:**
1. Clear app and restart
2. Measure time from launch to dashboard

**Expected Results:**
- ✅ Cold start < 3 seconds
- ✅ Warm start < 1 second
- ✅ Smooth splash screen transition

### 10.2 Navigation Performance
**Steps:**
1. Navigate between screens rapidly
2. Monitor frame rate

**Expected Results:**
- ✅ No lag or jank
- ✅ Smooth animations
- ✅ Instant tab switches

### 10.3 List Scrolling
**Steps:**
1. Load long lists (assignments, grades)
2. Scroll rapidly up and down

**Expected Results:**
- ✅ Smooth 60fps scrolling
- ✅ No dropped frames
- ✅ Images load progressively

---

## 11. Security Tests

### 11.1 Secure Storage
**Steps:**
1. Log in
2. Check device file system (if rooted):
   ```bash
   adb shell run-as com.edutrack.app
   cat shared_prefs/[preference_file]
   ```

**Expected Results:**
- ✅ Tokens not stored in plain text
- ✅ Data encrypted at rest
- ✅ No sensitive data in logs

### 11.2 Token Management
**Steps:**
1. Log in and capture token
2. Wait for token expiration
3. Perform API call

**Expected Results:**
- ✅ Token automatically refreshed
- ✅ Request succeeds with new token
- ✅ No authentication errors

---

## 12. Error Handling Tests

### 12.1 Network Error
**Steps:**
1. Turn off network during API call
2. Observe error handling

**Expected Results:**
- ✅ User-friendly error message
- ✅ Request queued for retry
- ✅ No app crash

### 12.2 Invalid Credentials
**Steps:**
1. Attempt login with wrong password
2. Observe error handling

**Expected Results:**
- ✅ Clear error message
- ✅ No crash
- ✅ Can retry login

### 12.3 Server Error
**Steps:**
1. Simulate 500 error from server
2. Observe app behavior

**Expected Results:**
- ✅ Error message shown
- ✅ Retry option available
- ✅ App remains stable

---

## Test Execution Checklist

Use this checklist when performing full test cycle:

### Pre-Test
- [ ] Android device/emulator ready
- [ ] Development server running
- [ ] Test accounts available
- [ ] Network toggle capability confirmed

### Core Functionality
- [ ] App launch tests passed
- [ ] Authentication tests passed
- [ ] Navigation tests passed
- [ ] Data loading tests passed

### Android-Specific Features
- [ ] Redux persist working
- [ ] NetInfo detecting network changes
- [ ] Offline queue functioning
- [ ] Background sync configured
- [ ] Secure storage validated

### Quality Assurance
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Performance acceptable
- [ ] Error handling appropriate
- [ ] Security measures in place

### Post-Test
- [ ] All critical tests passed
- [ ] Issues documented
- [ ] Test results recorded

---

## Test Result Template

```
Test Date: [DATE]
Tester: [NAME]
Device: [DEVICE MODEL]
Android Version: [VERSION]
App Version: [VERSION]

RESULTS:
[ ] PASS / [ ] FAIL - App Launch
[ ] PASS / [ ] FAIL - Authentication
[ ] PASS / [ ] FAIL - Redux Persist
[ ] PASS / [ ] FAIL - Network Detection
[ ] PASS / [ ] FAIL - Offline Queue
[ ] PASS / [ ] FAIL - Navigation
[ ] PASS / [ ] FAIL - Background Sync
[ ] PASS / [ ] FAIL - UI/UX
[ ] PASS / [ ] FAIL - Performance
[ ] PASS / [ ] FAIL - Security

Issues Found:
1. [ISSUE DESCRIPTION]
2. [ISSUE DESCRIPTION]

Notes:
[ADDITIONAL NOTES]
```

---

## Continuous Testing

### Automated Tests
```bash
# Run validation
npm run validate-android

# Type checking
npm run type-check

# Linting
npm run lint

# Full test suite
npm run test-android
```

### Manual Testing Frequency
- **Daily**: Core functionality (auth, navigation)
- **Weekly**: Full test suite
- **Pre-release**: Complete test plan
- **Post-deployment**: Smoke tests

---

**Last Updated**: 2024
