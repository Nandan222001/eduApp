# Navigation Testing Guide

## Quick Links

📚 **Choose your guide:**

- **[Quick Start](NAVIGATION_TESTING_QUICKSTART.md)** ← Start here for fast setup
- **[Detailed Testing Guide](docs/TESTING_NAVIGATION.md)** ← Complete testing procedures
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** ← Technical overview

## TL;DR

```bash
# 1. Validate
npm run validate-navigation

# 2. Start
npm run start:web

# 3. Test
# Open http://localhost:8081 in browser
# Open scripts/navigation-test-helper.html for interactive testing
```

## What This Is

Testing infrastructure for Expo Router navigation on web (http://localhost:8081), including:

- ✅ Automated validation scripts
- ✅ Interactive HTML test helper
- ✅ Real-time navigation debugger
- ✅ Comprehensive documentation
- ✅ Troubleshooting guides

## Files Overview

### Scripts
- `scripts/validate-navigation-setup.js` - Comprehensive validation with color output
- `scripts/test-expo-router.js` - Expo Router configuration tests
- `scripts/test-web-navigation.js` - Web-specific tests
- `scripts/navigation-test-helper.html` - Interactive testing interface

### Components
- `src/components/NavigationDebugger.tsx` - Development debugging tool

### Documentation
- `NAVIGATION_TESTING_QUICKSTART.md` - Quick reference
- `docs/TESTING_NAVIGATION.md` - Detailed guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## Getting Started

### 1. Pre-flight Check

```bash
npm run validate-navigation
```

This checks:
- File structure
- Configuration files
- Module resolution
- Component exports
- Circular dependencies

### 2. Start Development Server

```bash
npm run start:web
```

Or with cache clearing:

```bash
npm run start:web:clear
```

### 3. Access in Browser

Open: **http://localhost:8081**

Expected:
- Redirects to login screen
- No console errors
- "LAYOUT_LOADED_DEBUG" in terminal

### 4. Interactive Testing

Open in browser: **scripts/navigation-test-helper.html**

Features:
- Click to test all routes
- Interactive checklist
- Command copy buttons
- Issue troubleshooting

## Key Features

### Navigation Debugger

In development mode, a debugger appears at the bottom of the screen showing:
- Current route and segments
- Authentication status
- User information
- Quick navigation buttons

### Validation Scripts

Three levels of testing:
1. Basic Expo Router setup
2. Web-specific configuration
3. Comprehensive system validation

### Interactive Test Helper

HTML interface providing:
- Visual route testing
- Progress tracking
- Quick commands
- Common solutions

## Common Commands

```bash
# Testing
npm run validate-navigation    # Comprehensive validation
npm run test-navigation         # All navigation tests

# Development
npm start --web                 # Start dev server
npm run start:web:clear         # Start with cleared cache

# Validation
npm run type-check              # TypeScript check
npm run lint                    # Code linting
```

## What Gets Tested

✅ Entry point (index.js)
✅ Root layout (app/_layout.tsx)
✅ Auth layout (app/(auth)/_layout.tsx)
✅ All auth screens (login, register, etc.)
✅ Component exports
✅ Store configuration
✅ Module resolution
✅ Babel/Metro/TypeScript config
✅ No circular dependencies
✅ Web compatibility

## Test Routes

Test these URLs in your browser:

| URL | Expected |
|-----|----------|
| http://localhost:8081/ | → Redirect to login |
| http://localhost:8081/(auth)/login | Login screen |
| http://localhost:8081/(auth)/register | Register screen |
| http://localhost:8081/(auth)/forgot-password | Forgot password |
| http://localhost:8081/profile | → Redirect to login (protected) |

## Troubleshooting

### Module Resolution Error
```bash
npm run start:web:clear
```

### Infinite Loading
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Route 404
1. Check file exists in app/ directory
2. Restart dev server
3. Clear cache

## Success Criteria

Navigation works correctly when:

✅ All routes load without errors
✅ Authentication redirects work
✅ Browser navigation works
✅ No module resolution errors
✅ No circular dependencies
✅ Metro bundler builds successfully
✅ Redux store initializes
✅ Navigation debugger shows correct info

## Need Help?

1. Run `npm run validate-navigation`
2. Check terminal for errors
3. Check browser console
4. Open `scripts/navigation-test-helper.html`
5. Review documentation:
   - Quick: `NAVIGATION_TESTING_QUICKSTART.md`
   - Detailed: `docs/TESTING_NAVIGATION.md`
   - Technical: `IMPLEMENTATION_SUMMARY.md`

## Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

---

**Choose Your Path:**

🚀 **Fast:** Read [NAVIGATION_TESTING_QUICKSTART.md](NAVIGATION_TESTING_QUICKSTART.md)

📖 **Thorough:** Read [docs/TESTING_NAVIGATION.md](docs/TESTING_NAVIGATION.md)

🔧 **Technical:** Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
