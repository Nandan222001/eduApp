# Testing Expo Router Navigation

This guide will help you test the Expo Router navigation setup, specifically for web deployment.

## Prerequisites

1. Ensure all dependencies are installed:
   ```bash
   cd mobile
   npm install
   ```

2. Verify configuration:
   ```bash
   node scripts/test-expo-router.js
   ```

## Starting the Development Server

### Option 1: Web Only
```bash
npm run start:web
# or
npx expo start --web
```

### Option 2: All Platforms
```bash
npm start
# or
npx expo start
```

Then press `w` to open web browser.

### Option 3: Clear Cache and Start
```bash
npm run start:web:clear
# or
npx expo start --web --clear
```

## Testing Checklist

### 1. Initial Load Test

**URL:** http://localhost:8081

**Expected Behavior:**
- App should load without errors
- Should automatically redirect to `/(auth)/login` (unauthenticated users)
- Login screen should appear
- No console errors in browser DevTools
- Metro bundler should show "LAYOUT_LOADED_DEBUG" in terminal

**What to Check:**
- [ ] Browser console is clear of errors
- [ ] Network tab shows successful bundle loading
- [ ] URL updates to show the login route
- [ ] Redux DevTools shows initialized state (if extension installed)

### 2. Login Route Test

**URL:** http://localhost:8081/(auth)/login

**Expected Behavior:**
- Login screen loads directly
- Form inputs are visible and functional
- Navigation buttons are present

**What to Check:**
- [ ] Email input field works
- [ ] Password input field works
- [ ] "Sign In" button is visible
- [ ] "Sign in with OTP instead" link is visible
- [ ] "Forgot Password?" link is visible

### 3. Metro Bundler Terminal Output

**Check for:**
- [x] "LAYOUT_LOADED_DEBUG" message appears
- [x] No module resolution errors
- [x] No circular dependency warnings
- [x] No warnings about missing peer dependencies
- [x] Bundle builds successfully

**Example of Good Output:**
```
LAYOUT_LOADED_DEBUG
[App Init] Dispatching loadStoredAuth
[Navigation] useEffect triggered: {...}
```

**Example of Bad Output (Errors to Watch For):**
```
Error: Unable to resolve module @components/...
Error: Unable to resolve module @store/...
Circular dependency detected: ...
```

### 4. Navigation Debugger

If running in development mode (`__DEV__ = true`), a navigation debugger will appear at the bottom of the screen.

**How to Use:**
1. Tap/click the header to expand
2. View current route information
3. Check authentication state
4. Use quick navigation buttons
5. Monitor console logs

**Information Displayed:**
- Current pathname
- Route segments
- Whether in auth group
- Authentication status
- Loading state
- Active user role
- Quick navigation actions

### 5. Route Navigation Tests

Test each of these routes by entering them directly in the browser:

| URL | Expected Result |
|-----|----------------|
| `http://localhost:8081/` | Redirects to login (if not authenticated) |
| `http://localhost:8081/(auth)/login` | Shows login screen |
| `http://localhost:8081/(auth)/register` | Shows registration screen |
| `http://localhost:8081/(auth)/forgot-password` | Shows forgot password screen |
| `http://localhost:8081/(auth)/otp-login` | Shows OTP login screen |
| `http://localhost:8081/profile` | Redirects to login (protected route) |
| `http://localhost:8081/settings` | Redirects to login (protected route) |

### 6. Browser Navigation Tests

**Test Back/Forward:**
1. Navigate from login → OTP login → forgot password
2. Use browser back button
3. Use browser forward button
4. Verify URL updates correctly
5. Verify correct screen displays

**Expected:**
- [ ] Back button works correctly
- [ ] Forward button works correctly
- [ ] URL stays in sync with displayed screen
- [ ] No navigation loops

### 7. Deep Link Tests

Test deep linking by accessing these URLs:

```
http://localhost:8081/(auth)/reset-password?token=test123
http://localhost:8081/(auth)/otp-verify?phone=1234567890
```

**Expected:**
- Route parameters are preserved
- Correct screen loads with parameters
- No errors in console

### 8. Module Resolution Tests

**Check Terminal for:**
- No "Unable to resolve module" errors
- No "Cannot find module" errors
- All `@` alias imports resolve correctly
- All relative imports resolve correctly

**Common Issues:**
```bash
# If you see module resolution errors:
npm run start:clear

# If babel aliases not working:
rm -rf node_modules/.cache
npm start
```

### 9. Redux Store Tests

**Open Browser DevTools Console and Run:**
```javascript
// Check if store is accessible
window.__REDUX_DEVTOOLS_EXTENSION__

// Check auth state
console.log('Redux store available')
```

**Expected:**
- Redux DevTools extension connects (if installed)
- Store state is visible
- Auth slice is present
- No serialization errors

### 10. Performance Tests

**Check Bundle Size:**
```bash
npm run build:web
npm run analyze-bundle
```

**Monitor Performance:**
1. Open DevTools Performance tab
2. Record page load
3. Check for:
   - [ ] Initial load < 3 seconds
   - [ ] No long tasks
   - [ ] No layout thrashing
   - [ ] Smooth animations

## Common Issues and Solutions

### Issue 1: Module Resolution Errors

**Symptoms:**
```
Error: Unable to resolve module @components/...
```

**Solutions:**
```bash
# Clear metro cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install

# Verify babel.config.js has module-resolver configured
```

### Issue 2: Circular Dependencies

**Symptoms:**
```
Warning: Require cycle: app/_layout.tsx -> ...
```

**Solutions:**
- Check import statements in _layout.tsx
- Avoid importing from barrel files that re-export layout
- Use direct imports instead of index files

### Issue 3: Redux Persist Rehydration

**Symptoms:**
- App shows loading screen indefinitely
- Authentication state not restoring

**Solutions:**
```bash
# Clear AsyncStorage
# In browser console:
localStorage.clear()
sessionStorage.clear()

# Or restart with clear cache
npm run start:web:clear
```

### Issue 4: Web-Specific API Errors

**Symptoms:**
```
Error: expo-secure-store is not available
Error: expo-local-authentication is not available
```

**Solutions:**
- These are expected on web
- Code should have Platform.OS checks
- Web fallback should use localStorage
- Check that secureStorage.web.ts exists

### Issue 5: 404 on Route

**Symptoms:**
- Route shows "This screen doesn't exist"
- URL is correct but screen doesn't load

**Solutions:**
- Verify file exists in app/ directory
- Check file naming (use lowercase, dashes)
- Restart dev server
- Check _layout.tsx declares the route

## Automated Testing

Run the automated test scripts:

```bash
# Test Expo Router configuration
node scripts/test-expo-router.js

# Test web-specific navigation
node scripts/test-web-navigation.js

# Validate deep linking setup
npm run validate-deep-linking
```

## Browser Compatibility Testing

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

**Check:**
- Route navigation works
- Browser history works
- Local storage works
- Redux persist works

## Production Build Testing

Before deploying:

```bash
# Build for web
npm run build:web

# Test the production build locally
npx serve dist

# Check build output
npm run verify-web-optimization
```

## Debugging Tips

### Enable Verbose Logging

Add to app/_layout.tsx:
```typescript
console.log('[Navigation] Current state:', {
  pathname,
  segments,
  isAuthenticated,
  isLoading
});
```

### Use React DevTools

Install React DevTools browser extension:
- Inspect component hierarchy
- Check props and state
- Monitor re-renders

### Use Redux DevTools

Install Redux DevTools browser extension:
- Monitor state changes
- Time travel debugging
- Action history

### Check Network Tab

- Verify bundle loads
- Check for 404s
- Monitor API calls
- Check response times

## Success Criteria

The navigation is working correctly if:

✅ All routes load without errors
✅ Authentication redirects work correctly
✅ Browser back/forward buttons work
✅ Direct URL access works
✅ No circular dependencies
✅ No module resolution errors
✅ Metro bundler builds successfully
✅ Redux store initializes properly
✅ Navigation debugger displays correct information
✅ Protected routes redirect to login

## Getting Help

If you encounter issues:

1. Check the terminal output for errors
2. Check browser console for errors
3. Run the test scripts for diagnostics
4. Clear all caches and restart
5. Verify all files exist in correct locations
6. Check that imports match exported names

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Expo Router API Reference](https://docs.expo.dev/router/reference/api/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
