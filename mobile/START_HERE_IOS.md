# 🎯 START HERE - iOS Testing Guide

## Welcome!

This guide will help you test the iOS platform implementation in 5 minutes.

## ⚡ Quick Start (5 Minutes)

### Step 1: Setup (1 minute)
```bash
cd mobile
npm install
```

### Step 2: Validate (1 minute)
```bash
npm run validate-ios
```

Expected output:
```
[✓] All required files present
[✓] Path aliases configured correctly
[✓] expo-secure-store dependency found
[✓] expo-local-authentication dependency found
All validations passed! ✨
```

### Step 3: Launch (1 minute)
```bash
npx expo start --ios
```

Wait for iOS Simulator to open automatically.

### Step 4: Login (1 minute)
```
Email: demo@example.com
Password: Demo@123
```

### Step 5: Verify (1 minute)

Check these work:
- [ ] App opened without crash
- [ ] Login succeeded
- [ ] Dashboard loaded
- [ ] Can navigate between tabs
- [ ] Close and reopen app → still logged in

✅ If all work, iOS platform is fully functional!

## 📋 What's Being Tested

### Core Features
1. **expo-secure-store** - Tokens stored in iOS Keychain
2. **expo-local-authentication** - Face ID/Touch ID ready
3. **Path aliases** - @store, @components, @utils working
4. **Expo Router** - Navigation from login to dashboard
5. **Token persistence** - Session survives app restart

### Full Test (Optional - 10 minutes)

See `QUICK_START_IOS.md` for comprehensive testing.

## 🐛 If Something Goes Wrong

### App won't start?
```bash
npx expo start --clear
```

### Module errors?
```bash
rm -rf node_modules
npm install
npx expo start --ios
```

### TypeScript errors?
```bash
npm run type-check
```

### Still stuck?
Check `IOS_SETUP.md` for detailed troubleshooting.

## 📚 Documentation

| Document | Use When |
|----------|----------|
| `START_HERE_IOS.md` | **Start here!** |
| `QUICK_START_IOS.md` | Quick 5-min testing |
| `IOS_SETUP.md` | Detailed setup & troubleshooting |
| `IOS_FEATURES.md` | Understanding implementation |
| `README_iOS.md` | General iOS overview |

## ✅ Success Indicators

You know it's working when:

1. ✅ `npm run validate-ios` passes all checks
2. ✅ App launches on iOS Simulator
3. ✅ Login with demo@example.com works
4. ✅ Dashboard displays student data
5. ✅ Navigation between tabs works
6. ✅ After app restart, still logged in
7. ✅ No "module not found" errors in console

## 🎯 Quick Commands Reference

```bash
# Validate setup
npm run validate-ios

# Launch iOS
npx expo start --ios

# Clear cache
npx expo start --clear

# Type check
npm run type-check

# Full test
npm run test-ios
```

## 🔑 Demo Credentials

**Student:** `demo@example.com` / `Demo@123`  
**Parent:** `parent@demo.com` / `Demo@123`

## 🎉 That's It!

If your quick test passed, everything is working:
- ✅ Secure storage (Keychain)
- ✅ Biometric auth ready
- ✅ Path aliases resolving
- ✅ Navigation working
- ✅ iOS platform ready

**Need more details?** → See `QUICK_START_IOS.md`  
**Want deep dive?** → See `IOS_FEATURES.md`  
**Having issues?** → See `IOS_SETUP.md`

---

**Ready?** Run: `cd mobile && npm run validate-ios && npx expo start --ios`
