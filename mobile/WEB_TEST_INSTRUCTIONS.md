# Expo Router Web Testing Instructions

This document provides step-by-step instructions for testing the Expo Router on the web platform.

## Prerequisites

- Node.js and npm installed
- All dependencies installed (`npm install` in the mobile directory)
- Browser with DevTools (Chrome, Firefox, Edge, etc.)

## Test Procedure

### Step 1: Start the Development Server

```bash
cd mobile
npx expo start --clear --web
```

**Expected Results:**
- Metro bundler starts without errors
- Web server starts on port 8081
- No compilation errors in the terminal
- Console shows "Web Webpack compiled successfully"

### Step 2: Verify App Loads

1. Open your browser to `http://localhost:8081`
2. Wait for the app to load

**Expected Results:**
- ✅ No 500 Internal Server Error
- ✅ No blank white screen
- ✅ App renders (should show login screen or redirect to it)
- ✅ No console errors related to module resolution
- ✅ No MIME type errors in browser console

**Common Issues to Check:**
- If you see a 500 error, check the Metro bundler console for compilation errors
- If you see MIME type errors, verify the metro.config.js middleware is configured correctly
- If modules are not found, check babel.config.js path aliases

### Step 3: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page (Ctrl+R or Cmd+R)
4. Filter by JS files

**Expected Results:**
- ✅ All `.js` files have `Content-Type: application/javascript; charset=utf-8`
- ✅ All `.bundle` files have `Content-Type: application/javascript; charset=utf-8`
- ✅ All `.json` files have `Content-Type: application/json; charset=utf-8`
- ✅ No files served with incorrect MIME types (like `text/plain`)
- ✅ All files return HTTP 200 status

**How to Check:**
1. Click on a `.js` or `.bundle` file in the Network tab
2. Look at the "Headers" section
3. Find "Response Headers"
4. Verify "Content-Type" is correct

### Step 4: Navigate to Login Route

1. In the browser URL bar, navigate to: `http://localhost:8081/(auth)/login`
2. Or click on any navigation that leads to login

**Expected Results:**
- ✅ URL changes to `http://localhost:8081/(auth)/login`
- ✅ Login form renders correctly
- ✅ Form shows:
  - Email input field
  - Password input field
  - Institution ID input field (optional)
  - "Sign In" button
  - "Sign in with OTP instead" link
  - "Forgot Password?" link
- ✅ No console errors
- ✅ No MIME type errors

**Test Form Elements:**
- Type in the email field - should accept input
- Type in the password field - should show dots/asterisks
- Click the eye icon (if visible) - should toggle password visibility
- All touch/click interactions should work

### Step 5: Check Browser Console

1. Open DevTools Console tab (F12 → Console)
2. Look for any errors or warnings

**Expected Results:**
- ✅ No red error messages
- ✅ No MIME type warnings
- ✅ No module resolution errors
- ✅ Debug logs show proper initialization (e.g., "LAYOUT_LOADED_DEBUG")
- ℹ️ Some warnings about web platform limitations are acceptable (e.g., biometric auth not available)

**Acceptable Console Messages:**
- `[iOS Web] Skipping iOS-specific initialization on web platform`
- `[Android Web] Skipping Android-specific initialization on web platform`
- `[Web] Initializing web offline support...`
- `Biometric authentication not fully supported on web`

**Unacceptable Console Errors:**
- `Uncaught SyntaxError` - indicates MIME type or parsing issue
- `Module not found` - indicates path alias or import issue
- `Unexpected token` - indicates MIME type issue
- `Failed to fetch` with MIME type error

### Step 6: Test Path Aliases

The app uses path aliases like `@components`, `@utils`, `@store`, etc. These should all resolve correctly.

**How to Verify:**
- No "Module not found" errors in console
- No "Cannot find module" errors in console
- App renders without import errors

### Step 7: Test Navigation

1. From the login page, try navigating to other routes:
   - `http://localhost:8081/(auth)/otp-login`
   - `http://localhost:8081/(auth)/forgot-password`

**Expected Results:**
- ✅ Routes change correctly
- ✅ Corresponding screens render
- ✅ No 404 errors
- ✅ No console errors

### Step 8: Verify Web Stubs

Native modules should be properly stubbed for web:

**Expected Behavior:**
- Biometric login button should NOT appear (or be disabled)
- Camera features should be stubbed (no camera access)
- Notifications should be stubbed
- Background sync should be stubbed
- All these should fail gracefully without crashing the app

**How to Verify:**
- Check console for stub warnings (acceptable)
- App should not crash when trying to use native features
- Native-only features should be hidden or disabled on web

### Step 9: Test Offline Detection

1. Open DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode (throttling dropdown)
4. Check if app detects offline status

**Expected Results:**
- ✅ App detects offline status
- ✅ Console shows `[Web] Browser is offline`
- ✅ No crashes or errors

5. Disable "Offline" mode
6. Check if app detects online status

**Expected Results:**
- ✅ App detects online status
- ✅ Console shows `[Web] Browser is online`

### Step 10: Test Responsive Design

1. Open DevTools (F12)
2. Enable Device Toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - Mobile (375x667)
   - Tablet (768x1024)
   - Desktop (1920x1080)

**Expected Results:**
- ✅ Layout adjusts to different screen sizes
- ✅ No horizontal scrolling on mobile
- ✅ Forms are usable on all screen sizes
- ✅ Text is readable on all screen sizes

## Troubleshooting

### Issue: 500 Internal Server Error

**Solution:**
1. Check Metro bundler console for compilation errors
2. Look for syntax errors in the code
3. Check if all dependencies are installed
4. Try clearing cache: `npx expo start --clear --web`

### Issue: MIME Type Errors

**Symptoms:**
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/plain"
```

**Solution:**
1. Verify `metro.config.js` has the `enhanceMiddleware` configuration
2. Check that the middleware is properly setting Content-Type headers
3. Restart the dev server with `--clear` flag

### Issue: Module Not Found Errors

**Symptoms:**
```
Error: Module not found: Error: Can't resolve '@components/...'
```

**Solution:**
1. Verify `babel.config.js` has module-resolver plugin configured
2. Check `tsconfig.json` has path mappings
3. Verify `metro.config.js` has extraNodeModules configured
4. Restart the dev server with `--clear` flag

### Issue: Native Module Errors on Web

**Symptoms:**
```
Error: expo-camera is not available on web
```

**Solution:**
1. Verify `webpack.config.js` has proper aliases to web stubs
2. Check that stub files exist in `src/utils/stubs/`
3. Verify stubs export the same API as native modules
4. Check that code properly checks `Platform.OS !== 'web'` before using native features

### Issue: Blank White Screen

**Solution:**
1. Check browser console for errors
2. Verify app entry point is correct
3. Check that root layout (_layout.tsx) is rendering
4. Look for runtime errors in console
5. Try hard refresh (Ctrl+Shift+R)

## Success Criteria

Your web platform is working correctly if:

- ✅ Server starts without errors
- ✅ App loads at localhost:8081 without 500 errors
- ✅ All .js and .bundle files have correct Content-Type headers
- ✅ /(auth)/login route navigates and renders correctly
- ✅ Login form is visible and interactive
- ✅ No MIME type errors in console
- ✅ No module resolution errors
- ✅ Path aliases resolve correctly
- ✅ Native modules are properly stubbed
- ✅ Offline detection works
- ✅ App is responsive on different screen sizes

## Additional Testing

### Performance Testing

1. Open DevTools → Performance tab
2. Record page load
3. Check for:
   - Time to First Contentful Paint (FCP) < 2s
   - Time to Interactive (TTI) < 5s
   - No long tasks blocking the main thread

### Accessibility Testing

1. Open DevTools → Lighthouse
2. Run accessibility audit
3. Address any critical issues

### Browser Compatibility

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

## Related Documentation

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Metro Configuration](https://docs.expo.dev/guides/customizing-metro/)
- [Web Support](https://docs.expo.dev/workflow/web/)

## Verification Script

You can also run the automated verification script:

```bash
cd mobile
node verify-expo-router-config.js
```

This will check all configuration files and provide a report.
