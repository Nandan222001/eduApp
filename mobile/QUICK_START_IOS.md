# Quick Start Guide - iOS Testing

## 🚀 5-Minute iOS Setup

### Prerequisites Check
✅ macOS computer  
✅ Xcode installed (from Mac App Store)  
✅ Node.js 18+ installed  

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Start the App
```bash
npx expo start --ios
```

That's it! The iOS Simulator will launch automatically with the app.

---

## 📋 Quick Testing Checklist

### ✅ App Launch Test (1 minute)
1. App opens without crash
2. Splash screen appears
3. Login screen displays

### ✅ Navigation Test (2 minutes)
1. Login with: `demo@example.com` / `Demo@123`
2. Student dashboard appears
3. Navigate between tabs (Home, Assignments, Schedule, Grades, Profile)
4. All screens load correctly

### ✅ Secure Storage Test (1 minute)
1. After login, close the app completely
2. Reopen the app
3. ✓ Should remain logged in (token stored in Keychain)

### ✅ Biometric Auth Test (1 minute - if available)
1. Go to Profile → Settings
2. Enable "Biometric Login"
3. Face ID/Touch ID prompt appears
4. Authenticate successfully
5. Logout
6. Login screen shows biometric option
7. Tap biometric login
8. ✓ Authenticates and logs in

### ✅ Path Alias Test (automatic)
If the app loads, path aliases are working! ✓
- `@store` → `src/store`
- `@components` → `src/components`
- `@utils` → `src/utils`

---

## 🎯 Test Scenarios

### Scenario 1: First Time User
```
1. Start app
2. See login screen
3. Enter: demo@example.com / Demo@123
4. Navigate to dashboard
5. See student data
✓ Pass if all data loads
```

### Scenario 2: Returning User
```
1. Login once
2. Kill app (swipe up in app switcher)
3. Reopen app
✓ Pass if automatically logged in
```

### Scenario 3: Biometric Login
```
1. Enable biometric in settings
2. Logout
3. Use biometric to login
✓ Pass if Face ID/Touch ID works
```

### Scenario 4: Offline Mode
```
1. Enable Airplane Mode
2. Open app
3. Navigate around
✓ Pass if cached data displays
```

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Unable to resolve module @store/..."
**Fix:**
```bash
npx expo start --clear
```

### Issue: App crashes on launch
**Fix:**
```bash
rm -rf node_modules
npm install
npx expo start --ios --clear
```

### Issue: Biometric not working
**Reason:** Simulator has limited biometric support  
**Fix:** Test on physical device or use Expo Go

### Issue: TypeScript errors
**Fix:**
```bash
npm run type-check
```

---

## 📱 Testing on Physical Device

### Option 1: Expo Go (Easiest)
1. Install "Expo Go" from App Store
2. Run: `npx expo start --tunnel`
3. Scan QR code with camera
4. App loads in Expo Go

### Option 2: Development Build (Full Features)
```bash
npx expo run:ios
```

---

## 🔍 What to Verify

### Core Functionality
- [x] App launches on iOS
- [x] Login works
- [x] Tokens stored in Keychain (expo-secure-store)
- [x] Navigation between screens
- [x] Data loads correctly

### iOS-Specific Features
- [x] Face ID / Touch ID authentication
- [x] Keychain storage (survives app restart)
- [x] Native iOS transitions
- [x] Tab bar with iOS styling
- [x] Swipe gestures work

### Path Aliases (Auto-validated if app loads)
- [x] @store resolves correctly
- [x] @components resolves correctly
- [x] @utils resolves correctly
- [x] @config resolves correctly
- [x] @api resolves correctly

---

## 🎓 Demo Users

### Student Account
```
Email: demo@example.com
Password: Demo@123
```

### Parent Account
```
Email: parent@demo.com
Password: Demo@123
```

---

## 📊 Expected Results

### Login Flow
```
Login Screen
    ↓
Enter credentials
    ↓
Authenticate
    ↓
Store tokens (SecureStore/Keychain)
    ↓
Navigate to Dashboard
    ↓
Load student data
```

### Biometric Flow
```
Enable in Settings
    ↓
Logout
    ↓
Login Screen (shows biometric button)
    ↓
Tap biometric button
    ↓
Face ID/Touch ID prompt
    ↓
Authenticate
    ↓
Retrieve tokens from Keychain
    ↓
Auto-login to Dashboard
```

---

## ⚡ Performance Expectations

- **App Launch:** < 3 seconds
- **Login:** < 2 seconds
- **Screen Transition:** < 500ms
- **Biometric Auth:** < 1 second
- **Data Load:** < 2 seconds (with network)

---

## 📞 Need Help?

### Quick Diagnostics
```bash
# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Clear all caches
npx expo start --clear

# Reset project
rm -rf node_modules ios .expo
npm install
npx expo start --ios
```

### Log Files
```bash
# View iOS logs
npx react-native log-ios

# View Metro bundler logs
npx expo start --ios
```

### Documentation
- Full setup: `IOS_SETUP.md`
- Feature guide: `IOS_FEATURES.md`
- Main README: `README.md`

---

## ✨ Success Criteria

Your iOS implementation is working if:

1. ✅ App launches without errors
2. ✅ Can login with demo credentials
3. ✅ Navigation works smoothly
4. ✅ Tokens persist after app restart
5. ✅ Biometric auth prompts correctly
6. ✅ All path aliases resolve
7. ✅ Student dashboard loads data
8. ✅ No console errors related to imports

---

## 🎉 You're Done!

If all quick tests pass, your iOS platform is fully functional with:
- ✅ expo-secure-store (Keychain) working
- ✅ expo-local-authentication (Face ID/Touch ID) working
- ✅ Path aliases resolving correctly
- ✅ Expo Router navigation working
- ✅ All core features operational

**Next Steps:**
- Test all screens thoroughly
- Try offline mode
- Test on physical device
- Explore advanced features

**For detailed testing:** See `IOS_SETUP.md`
