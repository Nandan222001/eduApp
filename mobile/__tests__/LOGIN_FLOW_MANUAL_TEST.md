# Manual Login Flow Test Guide

This guide provides step-by-step instructions for manually testing the login flow with demo credentials.

## Prerequisites

- Mobile app is running (use `npm run dev` or `npx expo start`)
- App is on the login screen `/(auth)/login`

## Test Case 1: Student Login Flow

### Steps:

1. **Navigate to Login Screen**
   - App should start at `/(auth)/login` if not authenticated
   - Verify the login screen displays:
     - Email input field
     - Password input field
     - Sign In button

2. **Enter Demo Student Credentials**
   - Email: `demo@example.com`
   - Password: `Demo@123`

3. **Submit Login**
   - Click "Sign In" button
   - Observe loading state (button should show loading indicator)

4. **Verify Authentication State**
   - Check Redux DevTools or state inspector:
     - `isAuthenticated` should be `true`
     - `activeRole` should be `'student'`
     - `user.email` should be `'demo@example.com'`
     - `user.roleInfo.slug` should be `'student'`
     - `accessToken` and `refreshToken` should be set

5. **Verify Navigation**
   - App should automatically redirect to `/(tabs)/student`
   - Student dashboard should be visible

6. **Verify Dashboard Loads**
   - Dashboard should display:
     - Welcome card with student name (Alex Johnson)
     - Attendance status card
     - Streak tracker
     - AI prediction widget
     - Upcoming assignments
     - Recent grades
     - Weak areas panel
     - Gamification widget

### Expected Results:

✅ Login successful  
✅ `isAuthenticated = true`  
✅ `activeRole = 'student'`  
✅ Redirected to `/(tabs)/student`  
✅ Dashboard loads with demo data  

---

## Test Case 2: Parent Login Flow

### Steps:

1. **Logout** (if already logged in)
   - Navigate to profile/settings
   - Click logout
   - Verify redirect to `/(auth)/login`

2. **Enter Demo Parent Credentials**
   - Email: `parent@demo.com`
   - Password: `Demo@123`

3. **Submit Login**
   - Click "Sign In" button

4. **Verify Authentication State**
   - Check state:
     - `isAuthenticated` should be `true`
     - `activeRole` should be `'parent'`
     - `user.email` should be `'parent@demo.com'`
     - `user.roleInfo.slug` should be `'parent'`

5. **Verify Navigation**
   - App should automatically redirect to `/(tabs)/parent`
   - Parent dashboard should be visible

6. **Verify Dashboard Loads**
   - Dashboard should display:
     - Children list (Alex Johnson, Emma Johnson)
     - Today's attendance
     - Quick stats for each child
     - Upcoming assignments
     - Fee payments
     - Messages from teachers

### Expected Results:

✅ Login successful  
✅ `isAuthenticated = true`  
✅ `activeRole = 'parent'`  
✅ Redirected to `/(tabs)/parent`  
✅ Dashboard loads with parent data  

---

## Test Case 3: Logout Flow

### Steps:

1. **Login** (with either demo user)

2. **Navigate to Profile/Settings**
   - Look for logout button/option

3. **Click Logout**

4. **Verify State Clearing**
   - Check state:
     - `isAuthenticated` should be `false`
     - `activeRole` should be `null`
     - `user` should be `null`
     - `accessToken` should be `null`
     - `refreshToken` should be `null`
     - `availableRoles` should be `[]`

5. **Verify Navigation**
   - App should redirect to `/(auth)/login`

### Expected Results:

✅ Logout successful  
✅ `activeRole` cleared (null)  
✅ All auth data cleared  
✅ Redirected to `/(auth)/login`  

---

## Test Case 4: Invalid Credentials

### Steps:

1. **Navigate to Login Screen**

2. **Enter Invalid Credentials**
   - Email: `invalid@example.com`
   - Password: `wrongpassword`

3. **Submit Login**

4. **Verify Error Handling**
   - Error message should be displayed
   - State should show:
     - `isAuthenticated` remains `false`
     - `activeRole` remains `null`
     - `error` is set with error message

5. **Verify No Navigation**
   - Should remain on `/(auth)/login`

### Expected Results:

✅ Login fails gracefully  
✅ Error message displayed  
✅ User remains on login screen  
✅ Auth state unchanged  

---

## Test Case 5: Navigation Guards

### Steps:

1. **Test Protected Routes (Not Logged In)**
   - Try to navigate to `/(tabs)/student` directly
   - Should be redirected to `/(auth)/login`

2. **Test Auth Routes (Logged In)**
   - Login successfully
   - Try to navigate to `/(auth)/login` directly
   - Should be redirected to appropriate dashboard

### Expected Results:

✅ Unauthenticated users cannot access protected routes  
✅ Authenticated users are redirected from auth routes  
✅ Navigation guards work correctly  

---

## Debugging Tips

### Check Redux State:
```javascript
// In browser console or React Native Debugger
store.getState().auth
```

### Check Current Route:
```javascript
// In component
const segments = useSegments();
console.log('Current route:', segments);
```

### Check Navigation Conditions:
```javascript
// In _layout.tsx
console.log({
  isLoading,
  isAuthenticated,
  activeRole,
  inAuthGroup: segments[0] === '(auth)'
});
```

---

## Common Issues

### Issue: Login succeeds but doesn't redirect
**Solution:** Check that `isLoading` is `false` in auth state

### Issue: Dashboard doesn't load
**Solution:** Verify that:
- `isAuthenticated` is `true`
- `activeRole` is set correctly
- Access token is present

### Issue: Logout doesn't clear activeRole
**Solution:** Check that `logout.fulfilled` reducer sets `activeRole` to `null`

### Issue: Wrong dashboard loads for user role
**Solution:** Verify `activeRole` matches the user's `roleInfo.slug`

---

## Success Criteria

All tests pass when:
- ✅ Demo student login works correctly
- ✅ Demo parent login works correctly
- ✅ Logout clears all auth data including `activeRole`
- ✅ Navigation redirects work as expected
- ✅ Dashboard loads with correct data for each role
- ✅ Invalid credentials are handled gracefully
- ✅ Navigation guards prevent unauthorized access
