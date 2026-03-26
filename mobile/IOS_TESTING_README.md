# iOS Testing Documentation

## 📚 Complete Testing Guide

Welcome to the iOS testing documentation for EduTrack Mobile. This directory contains all resources needed to test the iOS platform implementation.

---

## 🎯 Quick Links

### For Quick Testing (5 minutes)
👉 **[iOS Quick Test Card](IOS_QUICK_TEST_CARD.md)**
- 6 critical tests in 5-7 minutes
- Pass/fail criteria
- Quick fixes for common issues

### For First-Time Setup (15 minutes)
👉 **[iOS Testing Quickstart](IOS_TESTING_QUICKSTART.md)**
- Step-by-step setup guide
- Common troubleshooting
- Useful commands and tips

### For Comprehensive Testing (1-2 hours)
👉 **[iOS Test Plan](IOS_TEST_PLAN.md)**
- 12 detailed test scenarios
- Test execution matrix
- Issue tracking template
- Test report template

### For Implementation Verification
👉 **[iOS Feature Checklist](IOS_FEATURE_CHECKLIST.md)**
- 150+ features verified
- Implementation status
- Component inventory
- Configuration verification

---

## 🚀 Getting Started

### 1. Prerequisites

**Required:**
- Mac with macOS 10.15 (Catalina) or later
- Xcode 13.0 or later
- Node.js 16+
- iOS Simulator or physical device (iOS 13.4+)

**Optional:**
- Expo Go app for physical device testing
- iOS Developer account for TestFlight

### 2. Installation

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Validate iOS setup
npm run validate-ios
```

### 3. Run Tests

```bash
# Start iOS Simulator
npx expo start --ios

# Or use validation scripts
./test-ios-platform.sh      # macOS/Linux
.\test-ios-platform.ps1     # Windows
```

---

## 📖 Documentation Structure

### Testing Documentation
```
mobile/
├── IOS_QUICK_TEST_CARD.md        # 5-minute smoke test
├── IOS_TESTING_QUICKSTART.md     # Setup & quick testing
├── IOS_TEST_PLAN.md              # Comprehensive test plan
├── IOS_FEATURE_CHECKLIST.md      # Implementation verification
└── IOS_TESTING_README.md         # This file
```

### Setup Documentation
```
mobile/
├── IOS_SETUP.md                  # Initial setup guide
├── IOS_FEATURES.md               # Feature documentation
├── QUICK_START_IOS.md            # Quick start guide
└── validate-ios-setup.js         # Automated validation
```

### Test Scripts
```
mobile/
├── test-ios-platform.sh          # Bash validation script
└── test-ios-platform.ps1         # PowerShell validation script
```

---

## 🧪 Test Coverage

### Critical Features
- ✅ App Launch
- ✅ expo-secure-store (Token Storage)
- ✅ expo-local-authentication (Biometrics)
- ✅ Path Aliases (@store, @components, @utils)
- ✅ Login Flow
- ✅ Navigation

### Platform Features
- ✅ iOS Keychain Integration
- ✅ Face ID / Touch ID
- ✅ Background Fetch
- ✅ Deep Linking
- ✅ Offline Mode
- ✅ Push Notifications (ready)

### Application Features
- ✅ Student Dashboard
- ✅ Parent Dashboard
- ✅ Role Switching
- ✅ Assignments
- ✅ Grades
- ✅ Schedule
- ✅ Profile Management

---

## 🎭 Test Types

### 1. Smoke Tests (5 minutes)
**File:** [IOS_QUICK_TEST_CARD.md](IOS_QUICK_TEST_CARD.md)

Quick validation that critical functionality works:
- App launches
- Login works
- Navigation works
- Persistence works

### 2. Functional Tests (30 minutes)
**File:** [IOS_TESTING_QUICKSTART.md](IOS_TESTING_QUICKSTART.md)

Basic feature testing:
- Authentication flow
- Data display
- User interactions
- Error handling

### 3. Comprehensive Tests (1-2 hours)
**File:** [IOS_TEST_PLAN.md](IOS_TEST_PLAN.md)

Complete platform validation:
- All 12 test scenarios
- Multiple iOS versions
- Edge cases
- Performance testing

### 4. Implementation Verification
**File:** [IOS_FEATURE_CHECKLIST.md](IOS_FEATURE_CHECKLIST.md)

Technical verification:
- All dependencies installed
- Configuration correct
- Code structure verified
- Integration complete

---

## 📱 Testing Environments

### iOS Simulator (Recommended for Development)
```bash
npx expo start --ios

# Specific simulator
npx expo start --ios --simulator="iPhone 14 Pro"
```

**Pros:**
- Fast iteration
- Easy debugging
- No device needed

**Cons:**
- Face ID simulation limited
- Performance not real-device
- Some APIs unavailable

### Physical Device (Recommended for Final Testing)
```bash
npx expo start

# Scan QR code with Expo Go app
```

**Pros:**
- Real Face ID/Touch ID
- True performance
- All APIs available

**Cons:**
- Requires device
- Slower deployment
- More setup needed

---

## 🔍 What Gets Tested

### Configuration Layer
- ✅ Path aliases in babel.config.js
- ✅ Path mappings in tsconfig.json
- ✅ Metro bundler configuration
- ✅ iOS settings in app.json
- ✅ Dependencies in package.json

### Code Layer
- ✅ Store configuration and slices
- ✅ API client setup
- ✅ Component exports
- ✅ Utility functions
- ✅ Platform initialization

### Integration Layer
- ✅ expo-secure-store integration
- ✅ expo-local-authentication integration
- ✅ Redux store persistence
- ✅ Navigation flows
- ✅ Offline queue

### User Experience Layer
- ✅ Login flow
- ✅ Dashboard loading
- ✅ Tab navigation
- ✅ Data display
- ✅ Error messages

---

## 🛠️ Testing Tools

### Automated Validation
```bash
# Node.js validation script
npm run validate-ios

# Shell script (macOS/Linux)
./test-ios-platform.sh

# PowerShell script (Windows)
.\test-ios-platform.ps1
```

### Manual Testing
```bash
# Start app
npx expo start --ios

# With cache cleared
npx expo start --ios --clear

# With specific simulator
npx expo start --ios --simulator="iPhone 14 Pro"
```

### Debugging
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# View logs
npx expo start --ios
# Then: press 'j' to open debugger
```

---

## 📊 Test Reports

### Quick Test Report (5 min)
```markdown
✓ Launch: Pass
✓ Login: Pass
✓ Navigation: Pass
✓ Persistence: Pass
✓ Path Aliases: Pass
✓ Biometrics: Pass

Result: 6/6 PASSED ✅
```

### Comprehensive Test Report (1-2 hours)
See template in [IOS_TEST_PLAN.md](IOS_TEST_PLAN.md#test-report-template)

---

## 🎯 Success Criteria

### Minimum (Must Pass)
- ✅ All 6 smoke tests pass
- ✅ No console errors during normal use
- ✅ App doesn't crash
- ✅ expo-secure-store works
- ✅ Path aliases resolve

### Recommended (Should Pass)
- ✅ All 12 comprehensive tests pass
- ✅ Performance is acceptable
- ✅ Biometric authentication works
- ✅ Offline mode functions
- ✅ Deep linking works

### Optional (Nice to Have)
- ✅ Tested on multiple iOS versions
- ✅ Tested on physical device
- ✅ Memory profiling done
- ✅ Network conditions tested

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to resolve module @store"
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --ios --clear
```

### Issue: Simulator won't open
**Solution:**
```bash
# List available simulators
xcrun simctl list devices

# Open specific simulator
npx expo start --ios --simulator="iPhone 14 Pro"
```

### Issue: expo-secure-store errors
**Solution:**
1. Verify installation: `npm list expo-secure-store`
2. Check app.json has plugin configured
3. Try on physical device if Simulator issues persist

### Issue: Face ID not working
**Solution:**
1. Enroll Face ID in Simulator: Features → Face ID → Enrolled
2. Grant permissions when prompted
3. Check NSFaceIDUsageDescription in app.json

### More Solutions
See troubleshooting sections in:
- [IOS_TESTING_QUICKSTART.md](IOS_TESTING_QUICKSTART.md#debugging-common-issues)
- [IOS_TEST_PLAN.md](IOS_TEST_PLAN.md#troubleshooting)

---

## 📞 Support Resources

### Documentation
- Setup: `IOS_SETUP.md`
- Features: `IOS_FEATURES.md`
- Quick Start: `QUICK_START_IOS.md`

### Testing Guides
- Quick Test: `IOS_QUICK_TEST_CARD.md`
- Quickstart: `IOS_TESTING_QUICKSTART.md`
- Full Plan: `IOS_TEST_PLAN.md`
- Checklist: `IOS_FEATURE_CHECKLIST.md`

### Scripts
- Validation: `validate-ios-setup.js`
- Shell Test: `test-ios-platform.sh`
- PowerShell Test: `test-ios-platform.ps1`

---

## 🚦 Testing Workflow

### First Time Testing
1. Read [IOS_TESTING_QUICKSTART.md](IOS_TESTING_QUICKSTART.md)
2. Run validation: `npm run validate-ios`
3. Start app: `npx expo start --ios`
4. Follow [IOS_QUICK_TEST_CARD.md](IOS_QUICK_TEST_CARD.md)

### Regular Testing
1. Start app: `npx expo start --ios`
2. Run smoke tests (5 min)
3. Document any issues
4. Report results

### Pre-Release Testing
1. Run [IOS_TEST_PLAN.md](IOS_TEST_PLAN.md) tests
2. Test on multiple iOS versions
3. Test on physical device
4. Performance profiling
5. Submit complete report

---

## 📈 Testing Progress

Track your testing progress:

```markdown
Phase 1: Setup ✅
- [x] Dependencies installed
- [x] Validation passed
- [x] App launches

Phase 2: Smoke Tests ✅
- [x] Quick test card completed
- [x] All 6 tests passed

Phase 3: Functional Tests 🔄
- [ ] Comprehensive test plan
- [ ] Multiple iOS versions
- [ ] Physical device testing

Phase 4: Production Ready 🎯
- [ ] All tests passed
- [ ] Performance acceptable
- [ ] Documentation complete
```

---

## 🎉 You're Ready!

All iOS testing documentation is now available. Choose your testing approach:

- **5 minutes:** [Quick Test Card](IOS_QUICK_TEST_CARD.md)
- **15 minutes:** [Testing Quickstart](IOS_TESTING_QUICKSTART.md)
- **1-2 hours:** [Complete Test Plan](IOS_TEST_PLAN.md)
- **Technical review:** [Feature Checklist](IOS_FEATURE_CHECKLIST.md)

Happy Testing! 🚀📱

---

**Last Updated:** [Current Date]  
**Platform:** iOS 13.4+  
**Status:** ✅ All features implemented and ready for testing
