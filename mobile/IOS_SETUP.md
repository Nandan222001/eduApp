# iOS Setup and Testing Guide

## Prerequisites

1. **macOS** - Required for iOS development
2. **Xcode** - Latest version from Mac App Store
3. **Node.js** - Version 18 or higher
4. **Expo CLI** - Installed globally or via npx

## Initial Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Install CocoaPods (iOS dependencies)

If running on a Mac for the first time:

```bash
# Install CocoaPods if not already installed
sudo gem install cocoapods

# Navigate to iOS directory and install pods
cd ios
pod install
cd ..
```

## Running on iOS

### Option 1: iOS Simulator (Recommended for Testing)

```bash
# Start the development server with iOS
npx expo start --ios
```

This will:
- Launch the Metro bundler
- Open iOS Simulator automatically
- Install and run the app

### Option 2: Physical iOS Device

```bash
# Start Expo with tunnel connection
npx expo start --tunnel
```

Then:
1. Install **Expo Go** app from the App Store on your iOS device
2. Scan the QR code shown in the terminal
3. The app will load on your device

### Option 3: Expo Development Build (Production-like)

For testing features that require native code (biometrics, secure storage):

```bash
# Build development client for iOS
eas build --profile development --platform ios

# Or build locally (requires Xcode)
npx expo run:ios
```

## Testing Checklist

### 1. App Launch
- [ ] App launches without crashes
- [ ] Splash screen displays correctly
- [ ] Initial loading completes successfully

### 2. Navigation Flow
- [ ] Login screen displays correctly
- [ ] Can navigate to registration
- [ ] Can navigate to forgot password
- [ ] Can navigate to OTP login

### 3. Authentication
- [ ] Login with credentials works
- [ ] Token storage in SecureStore succeeds
- [ ] Session persists after app restart
- [ ] Logout clears stored tokens

### 4. Biometric Authentication
- [ ] Face ID prompt appears (on Face ID devices)
- [ ] Touch ID prompt appears (on Touch ID devices)
- [ ] Biometric authentication succeeds
- [ ] Fallback to passcode works
- [ ] Cancel button works correctly
- [ ] Error handling displays properly

### 5. Student Dashboard
- [ ] Dashboard loads after login
- [ ] All widgets display correctly
- [ ] Profile data loads
- [ ] Attendance card shows data
- [ ] Assignments list populates
- [ ] Grades display correctly
- [ ] Gamification widgets render

### 6. Path Aliases
- [ ] @store imports work
- [ ] @components imports work
- [ ] @utils imports work
- [ ] @config imports work
- [ ] @api imports work
- [ ] @hooks imports work

### 7. Secure Storage (expo-secure-store)
- [ ] Tokens are stored securely
- [ ] Tokens persist after app restart
- [ ] Tokens can be retrieved
- [ ] Tokens can be deleted
- [ ] Biometric preferences stored
- [ ] User email stored

### 8. Offline Mode
- [ ] App works without network
- [ ] Cached data displays
- [ ] Offline indicator shows
- [ ] Queue syncs when online

### 9. Permissions
- [ ] Camera permission prompt (for homework scanner)
- [ ] Photo library permission prompt
- [ ] Face ID permission prompt
- [ ] Notification permission prompt

## Common iOS Issues and Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear caches
npx expo start --clear

# Or reset everything
rm -rf node_modules
npm install
npx expo start --clear
```

### Issue: Path aliases not resolving

**Solution:**
- Check `babel.config.js` has `babel-plugin-module-resolver`
- Check `metro.config.js` has `extraNodeModules`
- Check `tsconfig.json` has correct paths
- Restart Metro bundler

### Issue: Biometric authentication not working

**Solution:**
- Check device has biometric hardware enrolled
- Check Info.plist has `NSFaceIDUsageDescription`
- Test on physical device (simulators have limited biometric support)
- Check expo-local-authentication is installed

### Issue: Secure storage errors

**Solution:**
- expo-secure-store requires native build
- Use Expo Go for development
- Or create development build with `eas build`
- Check iOS version is 13.4 or higher

### Issue: App crashes on launch

**Solution:**
```bash
# Check logs
npx expo start --ios

# View detailed logs
npx react-native log-ios
```

## iOS-Specific Features

### 1. Face ID / Touch ID
- Implemented in `src/utils/biometric.ts`
- Configuration in `src/config/ios.ts`
- Permission in `app.json` → `ios.infoPlist.NSFaceIDUsageDescription`

### 2. Keychain Storage
- Implemented via expo-secure-store
- Automatic encryption via iOS Keychain
- Survives app uninstall (if configured)
- Accessible only when device unlocked

### 3. Background Fetch
- Configured in `app.json` → `ios.infoPlist.UIBackgroundModes`
- Implemented in `src/utils/backgroundSync.ts`
- Syncs data in background

### 4. Push Notifications
- Permission prompt automatic on first use
- Configured via expo-notifications
- Handles foreground and background notifications

### 5. Deep Linking
- Configured in `app.json` → `ios.associatedDomains`
- Handles `edutrack://` scheme
- Supports universal links

## Performance Optimization

### 1. Enable Hermes (JavaScript Engine)
Already enabled via Expo 50 default

### 2. Optimize Images
- Use WebP format when possible
- Lazy load images
- Use FastImage component

### 3. Reduce Bundle Size
```bash
# Analyze bundle
npx expo export --platform ios
```

### 4. Enable Production Mode
```bash
# Production build
eas build --profile production --platform ios
```

## Debugging Tools

### 1. React Native Debugger
```bash
# Install
brew install --cask react-native-debugger

# Connect
# Press Cmd+D in simulator → "Debug"
```

### 2. Reactotron
```bash
# Install
npm install --dev reactotron-react-native

# Configure in app
```

### 3. Xcode Instruments
- Profile performance
- Monitor memory usage
- Track network requests

## Build for TestFlight

### 1. Setup EAS Build

```bash
# Configure EAS
eas build:configure
```

### 2. Build for TestFlight

```bash
# Production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

### 3. Internal Testing

```bash
# Development build for testing
eas build --profile preview --platform ios
```

## Environment Variables

Create `.env` file in mobile directory:

```env
API_BASE_URL=https://api.edutrack.app
API_VERSION=v1
ENABLE_BIOMETRIC=true
ENABLE_OFFLINE_MODE=true
```

## Troubleshooting Command Reference

```bash
# Clean everything
rm -rf node_modules ios android .expo
npm install
npx pod-install

# Reset Metro cache
npx expo start --clear

# Rebuild iOS folder
npx expo prebuild --platform ios --clean

# View logs
npx react-native log-ios

# Run with specific simulator
npx expo start --ios --simulator="iPhone 15 Pro"
```

## Additional Resources

- [Expo iOS Documentation](https://docs.expo.dev/workflow/ios-simulator/)
- [React Native iOS Guide](https://reactnative.dev/docs/running-on-device)
- [expo-secure-store Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [expo-local-authentication Docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo Router Documentation](https://expo.github.io/router/docs/)

## Support

For issues specific to this app:
1. Check the main README.md
2. Review TROUBLESHOOTING.md
3. Check GitHub issues
4. Contact the development team
