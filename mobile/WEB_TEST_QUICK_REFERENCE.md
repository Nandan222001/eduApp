# Web Testing Quick Reference

## Start Server
```bash
cd mobile && npx expo start --clear --web
```

## Quick Checklist

### 1. Server Start
- [ ] Metro bundler starts without errors
- [ ] Web server running on http://localhost:8081
- [ ] No compilation errors

### 2. App Load
- [ ] Navigate to http://localhost:8081
- [ ] App loads (no 500 error)
- [ ] No blank white screen
- [ ] No console errors

### 3. Network Tab Check (F12 → Network)
- [ ] All `.js` files: `Content-Type: application/javascript; charset=utf-8`
- [ ] All `.bundle` files: `Content-Type: application/javascript; charset=utf-8`
- [ ] All `.json` files: `Content-Type: application/json; charset=utf-8`
- [ ] All files return HTTP 200

### 4. Login Route
- [ ] Navigate to http://localhost:8081/(auth)/login
- [ ] Login form renders
- [ ] Email field works
- [ ] Password field works
- [ ] No MIME type errors

### 5. Console Check (F12 → Console)
- [ ] No red errors
- [ ] No MIME type warnings
- [ ] No module resolution errors
- [ ] Platform-specific stubs working

## Expected Console Messages (OK)
```
✅ [iOS Web] Skipping iOS-specific initialization on web platform
✅ [Android Web] Skipping Android-specific initialization on web platform
✅ [Web] Initializing web offline support...
✅ [Web] Offline support initialized successfully
✅ Biometric authentication not fully supported on web
```

## Red Flags (NOT OK)
```
❌ Uncaught SyntaxError
❌ Module not found
❌ Unexpected token
❌ Failed to fetch (with MIME type error)
❌ 500 Internal Server Error
```

## Content-Type Headers to Verify

| File Type | Expected Content-Type |
|-----------|----------------------|
| `.js`, `.bundle` | `application/javascript; charset=utf-8` |
| `.json` | `application/json; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.html` | `text/html; charset=utf-8` |
| `.png`, `.jpg` | `image/png`, `image/jpeg` |
| `.svg` | `image/svg+xml; charset=utf-8` |

## Quick Tests

### Test 1: Basic Navigation
```
http://localhost:8081                  → Should redirect to login
http://localhost:8081/(auth)/login     → Should show login form
http://localhost:8081/(auth)/otp-login → Should show OTP login
```

### Test 2: Offline Detection
1. F12 → Network tab
2. Enable "Offline" mode
3. Check console: `[Web] Browser is offline` ✅

### Test 3: Path Aliases
All imports should work:
```typescript
import { Component } from '@components/...'  ✅
import { util } from '@utils/...'            ✅
import { useAppSelector } from '@store/...'  ✅
```

## Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| 500 Error | Check Metro console, run with `--clear` |
| MIME Type Error | Verify metro.config.js middleware |
| Module Not Found | Check babel.config.js, restart with `--clear` |
| Blank Screen | Check browser console, hard refresh (Ctrl+Shift+R) |
| Native Module Error | Verify webpack.config.js aliases to stubs |

## Success = All Green ✅

If you see:
- ✅ Server starts clean
- ✅ App loads without errors
- ✅ Correct Content-Type headers
- ✅ Login route works
- ✅ No MIME errors
- ✅ Console is clean (except acceptable warnings)

**You're good to go! 🎉**
