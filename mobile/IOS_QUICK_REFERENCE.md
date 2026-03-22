# 📱 iOS Quick Reference Card

## ⚡ Quick Commands

```bash
# Navigate to mobile directory
cd mobile

# Validate iOS setup
npm run validate-ios

# Start iOS app
npx expo start --ios

# Clear cache and start
npx expo start --ios --clear

# Full test suite
npm run test-ios

# Type checking only
npm run type-check
```

## 🔑 Demo Credentials

**Student:** `demo@example.com` / `Demo@123`  
**Parent:** `parent@demo.com` / `Demo@123`

## 📂 Key Files

| Feature | File Location |
|---------|---------------|
| Secure Storage | `src/utils/secureStorage.ts` |
| Biometric Auth | `src/utils/biometric.ts` |
| iOS Config | `src/config/ios.ts` |
| Auth Slice | `src/store/slices/authSlice.ts` |
| Root Layout | `app/_layout.tsx` |
| Login Screen | `app/(auth)/login.tsx` |
| Student Dashboard | `app/(tabs)/student/index.tsx` |

## 🎯 Path Aliases

```typescript
@store       → src/store
@components  → src/components
@utils       → src/utils
@config      → src/config
@api         → src/api
@hooks       → src/hooks
@constants   → src/constants
```

## 🔐 iOS Features

| Feature | Package | Status |
|---------|---------|--------|
| Keychain Storage | expo-secure-store | ✅ |
| Biometric Auth | expo-local-authentication | ✅ |
| Navigation | expo-router | ✅ |
| State Management | @reduxjs/toolkit | ✅ |

## 🧪 Quick Test

```bash
# 1. Validate
npm run validate-ios

# 2. Launch
npx expo start --ios

# 3. Login
# Use: demo@example.com / Demo@123

# 4. Verify
# - App doesn't crash
# - Can navigate tabs
# - Restart app → still logged in
```

## 📋 Testing Checklist

- [ ] App launches
- [ ] Login works  
- [ ] Navigate between screens
- [ ] Tokens persist after restart
- [ ] Biometric prompt works
- [ ] All imports resolve

## 🐛 Quick Fixes

**Module not found:**
```bash
npx expo start --clear
```

**App crashes:**
```bash
rm -rf node_modules
npm install
npx expo start --ios
```

**TypeScript errors:**
```bash
npm run type-check
```

## 📚 Documentation

- `QUICK_START_IOS.md` - 5-min guide
- `IOS_SETUP.md` - Full setup
- `IOS_FEATURES.md` - Feature docs
- `README_iOS.md` - Overview
- `IOS_READY_CHECKLIST.md` - Checklist

## ✅ Success Criteria

Implementation is working if:

1. ✅ `npm run validate-ios` passes
2. ✅ App launches on iOS
3. ✅ Login succeeds
4. ✅ Navigation works
5. ✅ No import errors

## 🚀 Ready?

```bash
cd mobile && npx expo start --ios
```

That's it! 🎉
