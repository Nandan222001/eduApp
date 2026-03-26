# iOS Quick Test Card

**5-Minute Smoke Test for iOS Platform**

---

## ⚡ Quick Setup

```bash
cd mobile
npm install
npm run validate-ios
npx expo start --ios
```

---

## 🎯 Critical Tests (Must Pass)

### ✓ Test 1: Launch (30 sec)
**Command:** `npx expo start --ios`  
**Pass:** App opens to login screen

### ✓ Test 2: Login (45 sec)
**Login:** `demo@example.com` / `Demo@123`  
**Pass:** Navigates to student dashboard

### ✓ Test 3: Navigation (30 sec)
**Action:** Tap all 5 tabs (Home, Assignments, Schedule, Grades, Profile)  
**Pass:** All screens load without crashes

### ✓ Test 4: Persistence (60 sec)
**Action:** Log in → Close app → Reopen  
**Pass:** User stays logged in

### ✓ Test 5: Path Aliases (passive)
**Check:** Metro console during launch  
**Pass:** No "Unable to resolve module" errors

### ✓ Test 6: Biometrics (90 sec)
**Setup:** Features → Face ID → Enrolled  
**Action:** Enable biometrics → Logout → Login with Face ID  
**Pass:** Face ID prompt works

---

## 🔍 What to Check

| Feature | Location | Expected Behavior |
|---------|----------|-------------------|
| **expo-secure-store** | Login → Close → Open | Tokens persist |
| **Path aliases** | Metro console | No resolution errors |
| **Navigation** | Tab bar | All tabs work |
| **Dashboard** | Student home | All widgets load |
| **Biometrics** | Settings/Profile | Face ID option appears |
| **Offline** | Disable network | Offline indicator shows |

---

## 📋 Quick Checklist

- [ ] App launches on iOS Simulator
- [ ] Login with demo@example.com works
- [ ] Dashboard displays all widgets
- [ ] Tab navigation works smoothly
- [ ] User stays logged in after restart
- [ ] No console errors during use
- [ ] Face ID enrollment option appears
- [ ] Path aliases resolve correctly

---

## 🚨 Red Flags (Fail Indicators)

- ❌ "Unable to resolve module @store" errors
- ❌ App crashes on launch
- ❌ Login succeeds but doesn't navigate
- ❌ User logged out after app restart
- ❌ Tabs don't switch screens
- ❌ Dashboard shows blank screen
- ❌ Metro bundler won't start
- ❌ Face ID option never appears

---

## 🎓 Test Credentials

**Student:** `demo@example.com` / `Demo@123`  
**Parent:** `parent@demo.com` / `Demo@123`

---

## 🔧 Quick Fixes

**Metro won't start:**
```bash
npx expo start --ios --clear
```

**Module errors:**
```bash
rm -rf node_modules && npm install
```

**Simulator won't open:**
```bash
npx expo start --ios --simulator="iPhone 14 Pro"
```

---

## ✅ Pass Criteria

**All 6 critical tests must pass for iOS platform to be considered functional.**

Pass: ✓✓✓✓✓✓ (6/6) → **Ready for production**  
Partial: ✓✓✓✓✗✗ (4/6) → **Needs fixes**  
Fail: ✗✗✗ (< 4/6) → **Not ready**

---

## 📞 Need Help?

- Full test plan: `IOS_TEST_PLAN.md`
- Quickstart guide: `IOS_TESTING_QUICKSTART.md`
- Feature list: `IOS_FEATURE_CHECKLIST.md`
- Setup guide: `IOS_SETUP.md`

---

**Total Time:** 5-7 minutes  
**Difficulty:** Easy  
**Prerequisites:** Mac with Xcode, iOS Simulator
