# iOS Platform Test Plan

## Overview

This document provides a comprehensive test plan for verifying all iOS-specific features in the EduTrack mobile application.

## Prerequisites

- macOS with Xcode installed
- iOS Simulator (iOS 13.4+) or physical iOS device
- Node.js 18+
- All dependencies installed (`npm install`)

## Quick Start

```bash
cd mobile
npx expo start --ios
```

## Test Categories

### 1. App Launch & Initialization

#### Test 1.1: Cold Start
**Steps**:
1. Force quit the app completely
2. Launch app from home screen
3. Observe splash screen
4. Wait for login screen

**Expected**:
- ✅ Splash screen displays
- ✅ No crashes during initialization
- ✅ Login screen appears
- ✅ Console shows: "[iOS] iOS platform initialization complete"

**Status**: [ ]

---

#### Test 1.2: iOS Version Check
**Steps**:
1. Launch app
2. Check console output

**Expected**:
- ✅ Console shows: "[iOS] Running on iOS XX"
- ✅ No version compatibility warnings (for iOS 13.4+)

**Status**: [ ]

---

### 2. Secure Storage (Keychain)

#### Test 2.1: Token Storage
**Steps**:
1. Login with credentials (demo@example.com / Demo@123)
2. Wait for dashboard to load
3. Force quit app
4. Reopen app

**Expected**:
- ✅ After reopening, user is still logged in
- ✅ Dashboard loads without requiring login
- ✅ Tokens persisted in Keychain

**Status**: [ ]

---

#### Test 2.2: Token Security
**Steps**:
1. Login successfully
2. Use iOS Settings → Clear app data (or reinstall)
3. Open app again

**Expected**:
- ✅ User is logged out
- ✅ Login screen appears
- ✅ No stored credentials accessible

**Status**: [ ]

---

#### Test 2.3: Secure Storage API
**Steps**:
1. Login successfully
2. Navigate to any screen
3. Check no errors in console about storage

**Expected**:
- ✅ No "SecureStore" errors
- ✅ No Keychain access errors
- ✅ All storage operations succeed

**Status**: [ ]

---

### 3. Biometric Authentication

#### Test 3.1: Biometric Availability (Physical Device)
**Steps**:
1. Login with credentials
2. Go to Profile/Settings
3. Look for "Enable Face ID/Touch ID" option

**Expected**:
- ✅ Option visible on devices with biometric hardware
- ✅ Console shows: "[iOS] Face ID available" or "[iOS] Touch ID available"

**Status**: [ ]

---

#### Test 3.2: Enable Biometric Login (Physical Device)
**Steps**:
1. Login with credentials
2. Enable biometric authentication in settings
3. Confirm with Face ID/Touch ID

**Expected**:
- ✅ Biometric prompt appears
- ✅ Successful authentication message
- ✅ Biometric enabled confirmation

**Status**: [ ]

---

#### Test 3.3: Login with Biometric (Physical Device)
**Steps**:
1. Enable biometric authentication
2. Logout
3. On login screen, tap "Sign In with Face ID/Touch ID"
4. Complete biometric authentication

**Expected**:
- ✅ Biometric prompt appears with custom message
- ✅ Successful authentication
- ✅ Dashboard loads
- ✅ No credential re-entry needed

**Status**: [ ]

---

#### Test 3.4: Biometric Fallback (Physical Device)
**Steps**:
1. Attempt biometric login
2. Cancel biometric prompt
3. Use fallback option

**Expected**:
- ✅ Cancel button works
- ✅ Fallback to passcode option available
- ✅ Can still login with credentials

**Status**: [ ]

---

### 4. Navigation & Path Aliases

#### Test 4.1: Login to Dashboard
**Steps**:
1. Login with credentials
2. Wait for navigation

**Expected**:
- ✅ Smooth transition from login to dashboard
- ✅ No "module not found" errors
- ✅ Dashboard loads completely

**Status**: [ ]

---

#### Test 4.2: Tab Navigation
**Steps**:
1. Login and reach dashboard
2. Tap each tab: Home, Assignments, Schedule, Grades, Profile

**Expected**:
- ✅ All tabs load without errors
- ✅ Tab transitions are smooth
- ✅ No import errors in console

**Status**: [ ]

---

#### Test 4.3: Path Alias Resolution
**Steps**:
1. Launch app
2. Navigate through all screens
3. Monitor console for errors

**Expected**:
- ✅ No "@store" import errors
- ✅ No "@components" import errors
- ✅ No "@utils" import errors
- ✅ All path aliases resolve correctly

**Status**: [ ]

---

#### Test 4.4: Deep Stack Navigation
**Steps**:
1. Navigate: Dashboard → Assignments → Assignment Detail
2. Use back button to return
3. Navigate to another deep screen

**Expected**:
- ✅ Forward navigation works
- ✅ Back button works correctly
- ✅ Navigation state preserved
- ✅ No memory leaks

**Status**: [ ]

---

### 5. Offline Mode

#### Test 5.1: Network Detection
**Steps**:
1. Login and load dashboard
2. Enable airplane mode
3. Observe UI changes

**Expected**:
- ✅ Offline indicator appears
- ✅ Cached data still displays
- ✅ App remains functional

**Status**: [ ]

---

#### Test 5.2: Offline Queue
**Steps**:
1. Go offline
2. Try to perform an action (e.g., submit assignment)
3. Return online
4. Wait for sync

**Expected**:
- ✅ Action queued for sync
- ✅ Queue indicator shows pending items
- ✅ Automatic sync when online
- ✅ Success notification after sync

**Status**: [ ]

---

#### Test 5.3: Background Sync (iOS 13+)
**Steps**:
1. Queue some actions while offline
2. Put app in background
3. Wait 15+ minutes
4. Return to app

**Expected**:
- ✅ Background fetch triggered
- ✅ Queue processed in background
- ✅ Sync status updated

**Status**: [ ]

---

### 6. State Management

#### Test 6.1: Redux Persistence
**Steps**:
1. Login and navigate to various screens
2. Change some app state (e.g., switch roles if applicable)
3. Force quit app
4. Reopen app

**Expected**:
- ✅ App state restored
- ✅ User preferences preserved
- ✅ Last screen state remembered

**Status**: [ ]

---

#### Test 6.2: Auth State
**Steps**:
1. Login
2. Navigate around
3. Check auth state consistency

**Expected**:
- ✅ isAuthenticated stays true
- ✅ User data accessible
- ✅ Tokens available for API calls

**Status**: [ ]

---

### 7. iOS UI/UX

#### Test 7.1: iOS Design Guidelines
**Steps**:
1. Navigate through all screens
2. Observe UI elements

**Expected**:
- ✅ iOS-style navigation
- ✅ Native look and feel
- ✅ Proper use of safe areas
- ✅ Appropriate fonts and spacing

**Status**: [ ]

---

#### Test 7.2: Gesture Support
**Steps**:
1. Try swipe-back gesture
2. Try pull-to-refresh
3. Try long press on items

**Expected**:
- ✅ Swipe back works
- ✅ Pull to refresh works
- ✅ Gestures feel native

**Status**: [ ]

---

#### Test 7.3: Keyboard Behavior
**Steps**:
1. Go to login screen
2. Tap email input
3. Type and observe

**Expected**:
- ✅ Keyboard appears smoothly
- ✅ View adjusts to keyboard
- ✅ "Done" button works
- ✅ Keyboard dismisses properly

**Status**: [ ]

---

### 8. Permissions

#### Test 8.1: Camera Permission
**Steps**:
1. Navigate to homework scanner or QR scanner
2. Attempt to use camera

**Expected**:
- ✅ Permission prompt appears
- ✅ Prompt text matches Info.plist
- ✅ Camera works after granting

**Status**: [ ]

---

#### Test 8.2: Photo Library Permission
**Steps**:
1. Try to upload profile photo or document
2. Observe permission prompt

**Expected**:
- ✅ Permission prompt appears
- ✅ Prompt text appropriate
- ✅ Photo picker works after granting

**Status**: [ ]

---

#### Test 8.3: Face ID Permission
**Steps**:
1. Enable biometric authentication
2. First time should prompt for Face ID permission

**Expected**:
- ✅ Permission prompt with custom message
- ✅ Message from Info.plist displays
- ✅ Face ID works after granting

**Status**: [ ]

---

### 9. Performance

#### Test 9.1: App Launch Time
**Steps**:
1. Force quit app
2. Launch app
3. Time until login screen appears

**Expected**:
- ✅ Launch time < 3 seconds
- ✅ Smooth loading transition
- ✅ No UI freezes

**Status**: [ ]

---

#### Test 9.2: Navigation Performance
**Steps**:
1. Navigate between screens rapidly
2. Observe transitions

**Expected**:
- ✅ Smooth 60fps transitions
- ✅ No lag or stuttering
- ✅ Quick response to taps

**Status**: [ ]

---

#### Test 9.3: Memory Usage
**Steps**:
1. Use app for extended period
2. Navigate through many screens
3. Monitor memory via Xcode

**Expected**:
- ✅ No memory leaks
- ✅ Memory usage reasonable
- ✅ No crashes from memory pressure

**Status**: [ ]

---

### 10. Error Handling

#### Test 10.1: Network Errors
**Steps**:
1. Go offline mid-operation
2. Observe error handling

**Expected**:
- ✅ Graceful error messages
- ✅ Option to retry
- ✅ App doesn't crash

**Status**: [ ]

---

#### Test 10.2: Invalid Credentials
**Steps**:
1. Try to login with wrong credentials

**Expected**:
- ✅ Clear error message
- ✅ UI remains functional
- ✅ Can retry login

**Status**: [ ]

---

#### Test 10.3: Token Expiration
**Steps**:
1. Login and wait for token to expire (or manually expire)
2. Try to make API call

**Expected**:
- ✅ Automatic token refresh
- ✅ Or graceful logout
- ✅ User notified if needed

**Status**: [ ]

---

## Test Summary

### Critical Tests
- [ ] App launches successfully
- [ ] Login flow works end-to-end
- [ ] Tokens stored in Keychain
- [ ] Navigation works without errors
- [ ] Path aliases resolve correctly
- [ ] Biometric authentication works (physical device)

### iOS-Specific Tests
- [ ] Keychain storage persists
- [ ] Face ID/Touch ID prompts appear
- [ ] Background modes work
- [ ] Permissions properly requested
- [ ] iOS UI guidelines followed

### Overall Pass Criteria
- All critical tests pass: **Required**
- iOS-specific tests pass: **Required**
- No crashes during testing: **Required**
- Performance acceptable: **Required**

## Sign-Off

**Tester Name**: _________________

**Date**: _________________

**iOS Version**: _________________

**Device/Simulator**: _________________

**Overall Result**: [ ] PASS  [ ] FAIL

**Notes**:
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## Quick Reference Commands

```bash
# Start testing
npx expo start --ios

# Clear cache if needed
npx expo start --ios --clear

# View logs
npx react-native log-ios

# Validate setup
npm run validate-ios
```

## Demo Credentials

**Student**: demo@example.com / Demo@123
**Parent**: parent@demo.com / Demo@123
