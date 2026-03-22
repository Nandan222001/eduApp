# Android Platform Testing Guide

This guide provides instructions for testing the EduTrack mobile app on Android.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Android Studio with Android SDK
- Android device or emulator (API level 21+)
- Expo CLI (`npm install -g expo-cli`)

## Setup

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env.development`
   - Update API endpoints if needed

3. **Start Development Server**
   ```bash
   npm run android
   # or
   npx expo start --android
   ```

## Testing Checklist

### 1. App Launch & Navigation
- [ ] App launches successfully
- [ ] Splash screen displays
- [ ] Login screen appears
- [ ] Navigation between tabs works
- [ ] Back button navigation works
- [ ] Deep links work (if configured)

### 2. AsyncStorage & Redux Persist
- [ ] Login and verify token is persisted
- [ ] Close and reopen app - should remain logged in
- [ ] Logout and verify data is cleared
- [ ] Navigate between screens - state persists
- [ ] Test with airplane mode - cached data loads

### 3. Network Connectivity Detection (NetInfo)
- [ ] Turn on airplane mode - offline indicator appears
- [ ] Turn off airplane mode - online status restored
- [ ] Network status changes are detected in real-time
- [ ] App shows appropriate messages for offline state

### 4. Offline Queue Functionality
- [ ] Submit form while offline
- [ ] Verify item appears in offline queue
- [ ] Turn network back on
- [ ] Verify queued items sync automatically
- [ ] Check queue viewer shows pending operations
- [ ] Test manual sync button

### 5. All Screens Render Without Errors
- [ ] Login screen
- [ ] Student Dashboard
- [ ] Assignments screen
- [ ] Grades screen
- [ ] Schedule screen
- [ ] Profile screen
- [ ] Parent Dashboard (if applicable)
- [ ] Settings screen
- [ ] Notifications screen

### 6. Android-Specific Features
- [ ] Biometric authentication (fingerprint/face)
- [ ] Secure storage for credentials
- [ ] Background sync works
- [ ] Notifications display correctly
- [ ] File picker works
- [ ] Camera/image picker works
- [ ] Deep linking works

### 7. Performance
- [ ] App starts within 3 seconds
- [ ] Screen transitions are smooth
- [ ] No memory leaks during navigation
- [ ] Images load efficiently
- [ ] Large lists scroll smoothly

### 8. Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Form validation works
- [ ] API errors are caught and displayed
- [ ] App doesn't crash on errors
- [ ] Retry mechanisms work

## Common Issues & Solutions

### Issue: App doesn't start
**Solution:** 
- Clear Metro bundler cache: `npx expo start --clear`
- Rebuild: `cd android && ./gradlew clean`

### Issue: Network detection not working
**Solution:**
- Check NetInfo is properly installed
- Verify Android permissions in app.json

### Issue: Redux state not persisting
**Solution:**
- Check AsyncStorage permissions
- Clear app data and reinstall
- Check redux-persist configuration

### Issue: Offline queue not syncing
**Solution:**
- Verify network connectivity
- Check background fetch permissions
- Review queue manager logs

## Debug Tools

### React Native Debugger
```bash
# Install
brew install --cask react-native-debugger
# Use in app
// Shake device or press Cmd+M and select "Debug"
```

### Logging
```bash
# View logs
npx react-native log-android
# or
adb logcat
```

### Network Inspection
- Use React Native Debugger Network tab
- Or Flipper for advanced debugging

## Validation Script

Run the validation script to check setup:
```bash
npm run validate-android
```

This checks:
- All required files exist
- Dependencies are installed
- Path aliases configured
- Android-specific features set up

## Production Build

To create a production build:
```bash
npm run build
# or
eas build --profile production --platform android
```

## Support

If you encounter issues:
1. Check this guide
2. Review validation script output
3. Check console logs
4. Review React Native and Expo documentation
