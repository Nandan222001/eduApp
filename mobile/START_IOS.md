# 🚀 Quick Start - iOS Platform Testing

## One-Command Start

```bash
cd mobile && npx expo start --ios
```

## What This Does

1. ✅ Starts Metro bundler
2. ✅ Launches iOS Simulator
3. ✅ Installs app on simulator
4. ✅ Opens app automatically

## Alternative Start Commands

### Start with Cache Cleared
```bash
npx expo start --ios --clear
```

### Start on Physical Device
```bash
npx expo start --tunnel
```
Then scan QR code with Expo Go app on your iPhone/iPad

### Start Specific Simulator
```bash
npx expo start --ios --simulator="iPhone 15 Pro"
```

## First Time Setup

If this is your first time running:

```bash
# 1. Install dependencies
npm install

# 2. Validate setup
npm run validate-ios

# 3. Run iOS
npx expo start --ios
```

## Test Credentials

Once the app launches, use these credentials:

**Student Demo**:
- Email: `demo@example.com`
- Password: `Demo@123`

**Parent Demo**:
- Email: `parent@demo.com`
- Password: `Demo@123`

## Navigation Flow to Test

1. **Login Screen** → Enter credentials → Tap "Sign In"
2. **Student Dashboard** → Should load with welcome card, attendance, assignments
3. **Tabs** → Test all 5 tabs (Home, Assignments, Schedule, Grades, Profile)
4. **Offline Mode** → Enable airplane mode, verify app still works
5. **Biometric** → Go to Profile → Enable biometric → Logout → Login with Face ID

## Features to Verify

### ✅ Core Features
- [ ] App launches without crash
- [ ] Login with credentials works
- [ ] Navigation from login to dashboard
- [ ] All tabs render correctly
- [ ] No "module not found" errors

### ✅ iOS-Specific Features
- [ ] Tokens stored in Keychain (logout & reopen app = still logged in)
- [ ] Face ID/Touch ID prompt appears (on physical device)
- [ ] Background mode works
- [ ] Deep links work
- [ ] Offline mode works

### ✅ Path Aliases
- [ ] `@store` imports work
- [ ] `@components` imports work
- [ ] `@utils` imports work
- [ ] No import errors in console

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npx expo start --clear
```

### Module Resolution Issues
```bash
# Full reset
rm -rf node_modules
npm install
npx expo start --clear
```

### Simulator Not Opening
```bash
# Check Xcode Command Line Tools
xcode-select --install

# Or specify simulator
npx expo start --ios --simulator="iPhone 15"
```

### Build Errors
```bash
# Prebuild iOS folder
npx expo prebuild --platform ios --clean

# Then run
npx expo run:ios
```

## Expected Console Output

When app starts successfully, you should see:

```
[iOS] Checking iOS compatibility...
[iOS] Running on iOS 17
[iOS] Initializing iOS-specific features...
[iOS] Keychain initialized successfully
[iOS] Face ID available and ready
[iOS] Background modes initialized
[iOS] iOS platform initialization complete
```

## Stop Testing

Press `Ctrl + C` in terminal to stop Metro bundler

## Documentation

- **Full Guide**: See `IOS_PLATFORM_GUIDE.md`
- **Setup Details**: See `IOS_SETUP.md`
- **Checklist**: See `IOS_READY_CHECKLIST.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`

## Status

🟢 **READY FOR TESTING**

All iOS features are implemented and functional. The app is configured to:
- Use expo-secure-store for token storage in iOS Keychain
- Support Face ID and Touch ID authentication
- Resolve all path aliases correctly
- Navigate smoothly from login through dashboard
- Work offline with cached data

---

**Need Help?** Check the detailed documentation files listed above.

**Ready?** Run: `npx expo start --ios`
