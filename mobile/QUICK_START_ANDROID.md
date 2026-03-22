# Quick Start Guide - Android

Get the EduTrack mobile app running on Android in minutes.

## Prerequisites Check

✅ Node.js 18+ installed  
✅ Android Studio with SDK installed  
✅ Android device or emulator ready  

## 3-Step Setup

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Validate Setup

```bash
npm run validate-android
```

This checks:
- All required files exist
- Dependencies are installed
- Configuration is correct
- Android-specific features are ready

### Step 3: Run the App

**On Android Emulator:**
```bash
npx expo start --android
```

**On Physical Device:**
1. Enable USB debugging on device
2. Connect via USB
3. Run: `npx expo start --android`

## Testing Network Features

### Toggle Network Connection

**On Emulator:**
- Use Android Studio's Extended Controls (three dots)
- Go to Settings > Cellular > Signal strength
- Toggle between "None" and "Moderate"

**On Physical Device:**
- Enable/disable Airplane mode
- Toggle WiFi on/off

### Verify Offline Queue

1. Turn off network
2. Try to submit an assignment or perform an action
3. Check the offline queue indicator
4. Turn network back on
5. Watch queue process automatically

## Common Commands

```bash
# Start development server
npx expo start

# Start with Android
npx expo start --android

# Clear cache and start
npx expo start -c

# Run validation
npm run validate-android

# Type check
npm run type-check

# Lint code
npm run lint

# Full test
npm run test-android
```

## Testing Checklist

Quick verification checklist:

- [ ] App launches without crashes
- [ ] Login screen displays
- [ ] Can authenticate successfully
- [ ] Navigation between tabs works
- [ ] Offline indicator shows when network is off
- [ ] Data persists after app restart
- [ ] No import errors in console

## Troubleshooting

**App won't start?**
```bash
npx expo start -c
```

**Metro bundler error?**
```bash
npx expo start --clear
```

**Can't find device?**
```bash
adb devices
# Then restart expo
```

**Build errors?**
```bash
rm -rf node_modules
npm install
npx expo start -c
```

## Next Steps

Once the app is running:

1. ✅ Test login with demo credentials
2. ✅ Navigate through all screens
3. ✅ Test offline functionality
4. ✅ Verify data persistence
5. ✅ Check network detection

## Demo Credentials

**Student Account:**
- Email: `demo@example.com`
- Password: `Demo@123`

**Parent Account:**
- Email: `parent@demo.com`
- Password: `Demo@123`

## Resources

- Full Setup Guide: `ANDROID_SETUP.md`
- Feature Documentation: `README.md`
- Troubleshooting: `ANDROID_SETUP.md#troubleshooting`

## Support

Having issues? Check:
1. Run `npm run validate-android` for diagnostics
2. Check logs: `adb logcat | grep ReactNativeJS`
3. Review `ANDROID_SETUP.md` for detailed help

---

**Ready to develop?** Run `npx expo start --android` and start building! 🚀
