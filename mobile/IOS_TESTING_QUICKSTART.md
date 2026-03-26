# iOS Testing Quickstart Guide

## 🚀 Quick Setup (5 Minutes)

### Prerequisites Check
```bash
# Check if you have the required tools
node --version    # Should be 16+
npm --version     # Should be 8+
npx expo --version # Should be latest
```

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Validate Setup
```bash
npm run validate-ios
```

If validation passes, you're ready to test!

## 🧪 Quick Test Scenarios

### Test 1: Launch App (2 minutes)

```bash
# Start the iOS app
npx expo start --ios
```

**What to Check:**
- ✓ Metro bundler starts without errors
- ✓ iOS Simulator opens
- ✓ App installs and launches
- ✓ Login screen appears

### Test 2: Login Flow (3 minutes)

**On Login Screen:**
1. Enter Email: `demo@example.com`
2. Enter Password: `Demo@123`
3. Tap "Sign In"

**What to Check:**
- ✓ Loading indicator appears
- ✓ Navigation to student dashboard
- ✓ Dashboard loads with data
- ✓ No console errors

### Test 3: Navigation (2 minutes)

**On Dashboard:**
1. Tap "Assignments" tab
2. Tap "Schedule" tab
3. Tap "Grades" tab
4. Tap "Profile" tab
5. Tap "Home" tab

**What to Check:**
- ✓ All tabs navigate smoothly
- ✓ Content loads in each tab
- ✓ No crashes or freezes

### Test 4: Secure Storage (3 minutes)

1. Log in successfully
2. Close the app (Cmd+Shift+H in simulator)
3. Reopen the app from home screen

**What to Check:**
- ✓ User stays logged in
- ✓ No re-login required
- ✓ Dashboard loads automatically

### Test 5: Biometric Authentication (4 minutes)

**Setup:**
1. In Simulator: Features → Face ID → Enrolled
2. Log in with demo account
3. Navigate to Profile/Settings
4. Enable biometric authentication
5. Log out

**Test:**
1. On login screen, tap "Sign In with Face ID"
2. Simulator shows Face ID prompt
3. In Simulator: Features → Face ID → Matching Face

**What to Check:**
- ✓ Face ID prompt appears
- ✓ Authentication succeeds
- ✓ User is logged in
- ✓ Dashboard appears

## 📱 Testing Path Aliases

The app uses path aliases that must work correctly:

```typescript
@store         → src/store
@components    → src/components
@utils         → src/utils
@config        → src/config
@constants     → src/constants
```

**How to Verify:**
- Launch app and check Metro console
- Should see NO "Unable to resolve module" errors
- All screens should render correctly

## 🔍 Debugging Common Issues

### Issue: Metro Bundler Errors

```bash
# Clear cache and restart
npx expo start --ios --clear
```

### Issue: Module Resolution Errors

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Simulator Not Opening

```bash
# List available simulators
xcrun simctl list devices

# Start specific simulator
npx expo start --ios --simulator="iPhone 14 Pro"
```

### Issue: expo-secure-store Not Working

**Check:**
1. Is it installed? `npm list expo-secure-store`
2. Is it in app.json plugins? `grep "expo-secure-store" app.json`
3. Try on device if Simulator has issues

### Issue: Biometric Not Available

**Setup in Simulator:**
1. Features → Face ID → Enrolled
2. Grant permissions when prompted
3. Check NSFaceIDUsageDescription in app.json

## ✅ Quick Validation Checklist

Before starting tests, verify:

- [ ] Node modules installed (`node_modules` exists)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Babel config has path aliases
- [ ] Metro config has path aliases  
- [ ] tsconfig.json has path aliases
- [ ] app.json has iOS configuration
- [ ] expo-secure-store dependency exists
- [ ] expo-local-authentication dependency exists

## 🎯 Critical Test Points

### 1. App Launch
**Command:** `npx expo start --ios`
**Pass:** App launches to login screen

### 2. Path Aliases
**Check:** No "Unable to resolve" errors in Metro
**Pass:** All imports work correctly

### 3. expo-secure-store
**Test:** Login → Close app → Reopen
**Pass:** User stays logged in

### 4. Biometric Auth
**Test:** Enable Face ID → Log out → Login with Face ID
**Pass:** Face ID prompt works and logs in

### 5. Navigation
**Test:** Navigate through all tabs
**Pass:** All screens render correctly

### 6. Student Dashboard
**Test:** View dashboard after login
**Pass:** All widgets display data

## 📊 Quick Test Results Format

```
Test Date: [Today's Date]
iOS Version: [e.g., 15.5]
Simulator: [e.g., iPhone 14 Pro]

✓ App Launch
✓ Path Aliases
✓ Secure Storage
✓ Biometric Auth
✓ Navigation
✓ Dashboard

Total: 6/6 Passed
```

## 🔧 Useful Commands

```bash
# Start with specific iOS version
npx expo start --ios --simulator="iPhone 14 Pro"

# Clear everything and restart
watchman watch-del-all
rm -rf node_modules
npm install
npx expo start --ios --clear

# Run validation script
npm run validate-ios

# Check types
npm run type-check

# Run linter
npm run lint

# View logs
npx expo start --ios --dev-client
```

## 🎓 Testing Best Practices

1. **Always start with `--clear` first time**
   ```bash
   npx expo start --ios --clear
   ```

2. **Check Metro console for errors**
   - Red errors = must fix
   - Yellow warnings = investigate

3. **Test both Simulator and Device**
   - Some features work differently
   - Biometrics more reliable on device

4. **Use demo credentials**
   - Student: `demo@example.com` / `Demo@123`
   - Parent: `parent@demo.com` / `Demo@123`

5. **Test offline mode**
   - Disable network in Simulator
   - App should show offline indicator
   - Data should be cached

## 🆘 Need Help?

### Logs Location
- Metro Bundler: Terminal output
- iOS Console: Xcode → Window → Devices and Simulators → Open Console
- App Logs: Console.app on Mac

### Debug Mode
```bash
# Start with debugging enabled
npx expo start --ios --dev-client
```

### Reset Everything
```bash
cd mobile
rm -rf node_modules ios android .expo
npm install
npx expo prebuild --clean
npx expo start --ios --clear
```

## 📝 Test Report Template

```markdown
# Quick Test Report

**Date:** [Date]
**Device:** [Simulator/Device Name]
**iOS:** [Version]
**Duration:** [Minutes]

## Results
- [ ] App launches successfully
- [ ] Login works with demo account
- [ ] Navigation works between tabs
- [ ] Secure storage persists login
- [ ] Biometric authentication works
- [ ] Path aliases resolve correctly

## Issues
[List any issues found]

## Notes
[Any additional observations]
```

## 🎉 Success Criteria

You're ready for production if:
- ✓ All 6 critical tests pass
- ✓ No console errors during normal use
- ✓ App doesn't crash during testing
- ✓ Performance is smooth (no lag)
- ✓ Biometric authentication works
- ✓ Offline mode works correctly

---

**Estimated Time:** 15-20 minutes for complete quick test
**Difficulty:** Easy
**Prerequisites:** Mac with Xcode and Simulator
