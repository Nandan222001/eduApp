# Expo Router Navigation Testing - Quick Start Guide

## Overview

This guide provides a quick start for testing the Expo Router navigation setup for the EduTrack mobile application, with specific focus on web deployment.

## Quick Start

### 1. Validate Setup

Run the validation script to ensure everything is configured correctly:

```bash
cd mobile
npm run validate-navigation
```

This will check:
- ✅ File structure
- ✅ Configuration files
- ✅ Module resolution
- ✅ Component exports
- ✅ Route definitions
- ✅ No circular dependencies

### 2. Start Development Server

```bash
npm run start:web
```

Or if you encounter caching issues:

```bash
npm run start:web:clear
```

### 3. Open Browser

Navigate to: **http://localhost:8081**

Expected behavior:
- App loads without errors
- Redirects to login screen at `/(auth)/login`
- No console errors in browser DevTools
- "LAYOUT_LOADED_DEBUG" appears in terminal

### 4. Use Test Helper

Open the interactive test helper in your browser:

```bash
# On Windows
start scripts/navigation-test-helper.html

# On macOS
open scripts/navigation-test-helper.html

# On Linux
xdg-open scripts/navigation-test-helper.html
```

The test helper provides:
- 🔗 Quick links to test all routes
- ✅ Interactive testing checklist
- 📋 Copy-paste commands
- 🐛 Common issues and solutions

## What to Check

### Terminal Output

Look for these indicators in the Metro bundler terminal:

✅ **Good Signs:**
```
LAYOUT_LOADED_DEBUG
[App Init] Dispatching loadStoredAuth
[Navigation] useEffect triggered
Bundle built successfully
```

❌ **Bad Signs:**
```
Error: Unable to resolve module @components/...
Error: Circular dependency detected
Error: Cannot find module
```

### Browser Console

Open DevTools (F12) and check for:

✅ **Good:**
- No red error messages
- Redux DevTools connects (if extension installed)
- Navigation logs appear
- Components render correctly

❌ **Bad:**
- Module resolution errors
- Uncaught exceptions
- Redux serialization warnings

### Navigation Debugger

In development mode, a navigation debugger appears at the bottom of the screen:

- Shows current route and segments
- Displays authentication state
- Provides quick navigation actions
- Helps diagnose navigation issues

Click the header to expand/collapse.

## Test Routes

| Route | URL | Expected |
|-------|-----|----------|
| Root | http://localhost:8081/ | Redirects to login |
| Login | http://localhost:8081/(auth)/login | Login form |
| Register | http://localhost:8081/(auth)/register | Registration form |
| Forgot Password | http://localhost:8081/(auth)/forgot-password | Password recovery |
| OTP Login | http://localhost:8081/(auth)/otp-login | OTP form |

## Common Commands

```bash
# Start development server
npm run start:web

# Start with cleared cache
npm run start:web:clear

# Validate navigation setup
npm run validate-navigation

# Run all navigation tests
npm run test-navigation

# Type check
npm run type-check

# Lint code
npm run lint
```

## Troubleshooting

### Module Resolution Errors

```bash
# Clear metro cache
npx expo start --clear

# Or
npm run start:web:clear
```

### Persistent Loading Screen

```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then reload page
```

### 404 on Route

1. Verify file exists in `app/` directory
2. Check file naming (lowercase, dashes)
3. Restart dev server
4. Clear cache and restart

### Circular Dependencies

Run the validation script to detect circular dependencies:

```bash
npm run validate-navigation
```

## File Structure

```
mobile/
├── app/
│   ├── _layout.tsx           # Root layout (main navigation logic)
│   ├── index.tsx             # Root redirect
│   ├── +html.tsx             # Web HTML wrapper
│   ├── +not-found.tsx        # 404 handler
│   └── (auth)/
│       ├── _layout.tsx       # Auth group layout
│       ├── login.tsx         # Login route
│       ├── register.tsx      # Register route
│       └── ...
├── src/
│   ├── components/
│   │   ├── NavigationDebugger.tsx  # Debug helper
│   │   ├── Loading.tsx
│   │   └── ...
│   ├── store/
│   │   └── index.ts          # Redux store
│   └── ...
├── scripts/
│   ├── validate-navigation-setup.js    # Comprehensive validation
│   ├── test-expo-router.js            # Expo Router tests
│   ├── test-web-navigation.js         # Web-specific tests
│   └── navigation-test-helper.html    # Interactive test helper
└── docs/
    └── TESTING_NAVIGATION.md          # Detailed testing guide
```

## Key Features

### Root Layout (`app/_layout.tsx`)

- ✅ Redux Provider setup
- ✅ Redux Persist integration
- ✅ Authentication guards
- ✅ Platform-specific initialization
- ✅ Deep linking support
- ✅ Navigation debugger (dev mode)

### Navigation Debugger

Shows real-time information:
- Current pathname and segments
- Authentication status
- Active user role
- Quick navigation actions

Enable/disable with `enabled` prop (default: `__DEV__`)

## Documentation

For detailed testing procedures, see:
- [Full Testing Guide](docs/TESTING_NAVIGATION.md)
- [Test Scripts](scripts/)

## Success Criteria

Navigation is working correctly when:

✅ All routes load without errors  
✅ Authentication redirects work  
✅ Browser back/forward buttons work  
✅ Direct URL access works  
✅ No circular dependencies  
✅ No module resolution errors  
✅ Metro bundler builds successfully  
✅ Redux store initializes properly  
✅ Navigation debugger shows correct info  
✅ Protected routes redirect to login  

## Next Steps

After validation passes:

1. Test all routes manually
2. Test authentication flow
3. Test protected routes
4. Test browser navigation
5. Test on different browsers
6. Test production build

## Getting Help

If you encounter issues:

1. Run `npm run validate-navigation`
2. Check terminal output
3. Check browser console
4. Open `scripts/navigation-test-helper.html`
5. Review `docs/TESTING_NAVIGATION.md`
6. Clear all caches and restart

## Additional Resources

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
