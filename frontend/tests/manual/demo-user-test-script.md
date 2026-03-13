# Demo User Manual Test Script

## Overview

This manual test script provides comprehensive step-by-step instructions for human testers to validate the demo user flow in the Student Portal. It covers all critical user journeys, interactive features, and responsive design testing.

## Test Environment Setup

### Prerequisites

- **Browser**: Latest Chrome, Firefox, Safari, or Edge
- **Screen Sizes**: Access to desktop, tablet, and mobile viewports
- **Internet Connection**: Required for initial tests, then test offline mode
- **Developer Tools**: Browser DevTools for responsive testing

### Demo Credentials

```
Email: demo@example.com
Password: Demo@123
User: Alex Johnson (Student Role)
```

---

## Test Suite 1: Login Flow Testing

### Test 1.1: Valid Login Flow

**Objective**: Verify successful login with valid credentials

**Steps**:

1. Navigate to the login page (`/login`)
2. Verify the page title contains "login" (case-insensitive)
3. Locate the email input field
4. Enter: `demo@example.com`
5. Locate the password input field
6. Enter: `Demo@123`
7. Click the "Login" or "Sign In" button
8. Wait for network requests to complete

**Expected Results**:

- [ ] Page redirects to `/student/dashboard`
- [ ] Welcome message displays "Alex Johnson"
- [ ] No error messages appear
- [ ] Dashboard content loads within 10 seconds

---

### Test 1.2: Invalid Credentials - Wrong Password

**Objective**: Verify error handling for incorrect password

**Steps**:

1. Navigate to the login page (`/login`)
2. Enter email: `demo@example.com`
3. Enter password: `WrongPassword123`
4. Click the login button
5. Observe the response

**Expected Results**:

- [ ] Error message appears (e.g., "Invalid credentials" or "Login failed")
- [ ] User remains on login page
- [ ] Form fields are cleared or retain the email
- [ ] Error message is clearly visible and descriptive

---

### Test 1.3: Invalid Credentials - Unregistered Email

**Objective**: Verify error handling for non-existent user

**Steps**:

1. Navigate to the login page (`/login`)
2. Enter email: `nonexistent@example.com`
3. Enter password: `AnyPassword123`
4. Click the login button
5. Observe the response

**Expected Results**:

- [ ] Error message appears indicating user not found or invalid credentials
- [ ] User remains on login page
- [ ] No sensitive information leaked in error message

---

### Test 1.4: Empty Credentials Validation

**Objective**: Verify client-side validation for empty fields

**Steps**:

1. Navigate to the login page (`/login`)
2. Leave both email and password fields empty
3. Click the login button
4. Observe the response

**Expected Results**:

- [ ] Validation errors appear for both fields
- [ ] No API request is made (check Network tab)
- [ ] Error messages clearly indicate required fields

---

### Test 1.5: Invalid Email Format

**Objective**: Verify email format validation

**Steps**:

1. Navigate to the login page (`/login`)
2. Enter email: `invalid-email-format`
3. Enter password: `Demo@123`
4. Click the login button
5. Observe the response

**Expected Results**:

- [ ] Email validation error appears
- [ ] Error message indicates invalid email format
- [ ] No API request is made until valid format entered

---

## Test Suite 2: Student Dashboard Navigation

### Test 2.1: Dashboard Route Access

**Objective**: Verify dashboard loads correctly after login

**Steps**:

1. Complete successful login (Test 1.1)
2. Verify URL is `/student/dashboard`
3. Observe the dashboard content

**Expected Results**:

- [ ] Dashboard title/heading is visible
- [ ] Welcome message shows "Alex Johnson" or similar greeting
- [ ] Page loads within 10 seconds
- [ ] No loading errors or blank sections

---

### Test 2.2: Dashboard Widgets Visibility

**Objective**: Verify all dashboard widgets are present and populated

**Steps**:

1. On the student dashboard (`/student/dashboard`)
2. Scroll through the entire page
3. Identify each widget/section

**Expected Results**:

- [ ] "Today's Attendance" card is visible showing 80% attendance
- [ ] "Upcoming Assignments" section displays assignment list
- [ ] "Recent Grades" section shows grade submissions
- [ ] Points display shows "2450" or "2,450"
- [ ] "Badges" section displays badge icons/images
- [ ] All sections have headers/titles
- [ ] No sections show error states

---

### Test 2.3: Navigate to Analytics

**Objective**: Verify navigation to analytics page

**Steps**:

1. From the dashboard, locate the navigation menu
2. Click on "Analytics" link/menu item
3. Wait for page to load

**Expected Results**:

- [ ] URL changes to `/student/analytics`
- [ ] Page title contains "Performance Analytics" or "Analytics"
- [ ] Analytics dashboard content loads
- [ ] Charts/graphs are visible
- [ ] Performance score displays (86-89%)
- [ ] No navigation errors occur

---

### Test 2.4: Navigate to AI Prediction

**Objective**: Verify navigation to AI prediction dashboard

**Steps**:

1. From any student page, locate navigation menu
2. Click on "AI Prediction" link/menu item
3. Wait for page to load

**Expected Results**:

- [ ] URL changes to `/student/ai-prediction`
- [ ] Page title contains "AI Prediction" or "Board Exam Prediction"
- [ ] Topic probability section is visible
- [ ] Table or list of topics displays
- [ ] Topic names visible (e.g., Quadratic, Trigonometric, Circle, Probability, Calculus)
- [ ] Probability percentages or rankings are shown

---

### Test 2.5: Navigate to Goals

**Objective**: Verify goals management page loads

**Steps**:

1. From navigation menu, click "Goals"
2. Wait for page to load

**Expected Results**:

- [ ] URL changes to `/student/goals`
- [ ] Goals management interface is visible
- [ ] User can view existing goals (if any)
- [ ] Page loads without errors

---

### Test 2.6: Navigate to Gamification

**Objective**: Verify gamification dashboard loads

**Steps**:

1. From navigation menu, click "Gamification"
2. Wait for page to load

**Expected Results**:

- [ ] URL changes to `/student/gamification`
- [ ] Gamification dashboard displays
- [ ] Points, badges, or leaderboard information visible
- [ ] Page loads without errors

---

### Test 2.7: Navigate to Pomodoro Timer

**Objective**: Verify Pomodoro timer page loads

**Steps**:

1. From navigation menu, click "Pomodoro" or "Pomodoro Timer"
2. Wait for page to load

**Expected Results**:

- [ ] URL changes to `/student/pomodoro`
- [ ] Pomodoro timer interface is visible
- [ ] Timer controls are present (start, pause, reset)
- [ ] Page loads without errors

---

### Test 2.8: Navigate to Settings

**Objective**: Verify settings page loads

**Steps**:

1. From navigation menu, click "Settings" or profile icon → Settings
2. Wait for page to load

**Expected Results**:

- [ ] URL changes to `/student/settings`
- [ ] Settings interface is visible
- [ ] User profile information is accessible
- [ ] Settings options are displayed
- [ ] Page loads without errors

---

## Test Suite 3: Data Consistency Verification

### Test 3.1: Attendance Data Consistency

**Objective**: Verify attendance data is consistent across pages

**Steps**:

1. On dashboard, note the attendance percentage (should be 80%)
2. Navigate to analytics page
3. Check if attendance data is displayed
4. Compare values

**Expected Results**:

- [ ] Attendance percentage on dashboard is 80%
- [ ] If shown on analytics, attendance data matches
- [ ] No conflicting data displayed

---

### Test 3.2: Points Data Consistency

**Objective**: Verify gamification points are consistent

**Steps**:

1. On dashboard, note the points value (should be 2450)
2. Navigate to gamification page
3. Compare points values

**Expected Results**:

- [ ] Points on dashboard show 2450 or 2,450
- [ ] Points on gamification page match dashboard
- [ ] No discrepancies in point totals

---

### Test 3.3: Grade Data Consistency

**Objective**: Verify grade information is consistent

**Steps**:

1. On dashboard, review recent grades section
2. Note specific grades shown (A, B, C ratings)
3. Navigate to analytics page
4. Check exam performance/grades section
5. Compare data

**Expected Results**:

- [ ] Recent grades on dashboard display letter grades
- [ ] Analytics shows performance score (86-89%)
- [ ] Data appears logically consistent
- [ ] No major discrepancies

---

### Test 3.4: User Profile Consistency

**Objective**: Verify user information is consistent across pages

**Steps**:

1. Check welcome message on dashboard (Alex Johnson)
2. Navigate to settings/profile page
3. Check user name and information
4. Return to dashboard

**Expected Results**:

- [ ] User name "Alex Johnson" appears on dashboard
- [ ] Same name appears in profile/settings
- [ ] Email shows as demo@example.com
- [ ] Role is identified as "Student"

---

## Test Suite 4: Interactive Features Testing

### Test 4.1: Goal Progress Updates

**Objective**: Test goal creation and progress tracking (if feature available)

**Steps**:

1. Navigate to `/student/goals`
2. Look for "Create Goal" or "Add Goal" button
3. If available, click to create a new goal
4. Fill in goal details (name, target, deadline)
5. Save the goal
6. Return to goals list
7. Look for progress indicator or update mechanism

**Expected Results**:

- [ ] Goal creation form is intuitive
- [ ] New goal appears in goals list
- [ ] Progress can be viewed or updated
- [ ] Changes persist after page refresh
- [ ] OR note if feature is read-only/view-only

---

### Test 4.2: Badge Tooltips

**Objective**: Verify badge information displays on hover/click

**Steps**:

1. Navigate to dashboard or gamification page
2. Locate badge icons/images
3. Hover over a badge (desktop) or tap badge (mobile)
4. Observe tooltip or popup

**Expected Results**:

- [ ] Tooltip appears on hover/tap
- [ ] Badge name is displayed
- [ ] Badge description or criteria is shown
- [ ] Tooltip dismisses appropriately
- [ ] Multiple badges can be inspected

---

### Test 4.3: Assignment Filtering/Sorting

**Objective**: Test assignment list interaction features

**Steps**:

1. Navigate to dashboard "Upcoming Assignments" section
2. If assignment filtering/sorting is available, test it
3. Look for filter buttons, dropdowns, or sort options
4. Apply different filters (e.g., by subject, due date, status)
5. Observe list changes

**Expected Results**:

- [ ] Filter options work correctly
- [ ] Assignment list updates immediately
- [ ] Filtered results are accurate
- [ ] Clear/reset filter option works
- [ ] OR note if feature is not available

---

### Test 4.4: Chart Interactions

**Objective**: Test interactive chart features on analytics page

**Steps**:

1. Navigate to `/student/analytics`
2. Locate charts/graphs (canvas or SVG elements)
3. Hover over data points
4. Click on chart elements (if interactive)
5. Look for legends, tooltips, or drill-down features

**Expected Results**:

- [ ] Charts render correctly
- [ ] Tooltips appear on hover showing data values
- [ ] Legend items are clickable (if applicable)
- [ ] Chart data is readable and makes sense
- [ ] No rendering errors or blank charts

---

### Test 4.5: Search Functionality

**Objective**: Test global search if available

**Steps**:

1. From any page, locate search input (typically in header/navbar)
2. Click on search field
3. Enter a search term (e.g., "Mathematics", "Assignment")
4. Submit search or view suggestions
5. Review results

**Expected Results**:

- [ ] Search field is accessible
- [ ] Search suggestions appear (if implemented)
- [ ] Search results page loads
- [ ] Results are relevant to search term
- [ ] Can navigate back from results
- [ ] OR note if search is not implemented

---

### Test 4.6: Pomodoro Timer Controls

**Objective**: Test timer functionality

**Steps**:

1. Navigate to `/student/pomodoro`
2. Click "Start" button
3. Observe timer counting down
4. Click "Pause" button
5. Click "Resume" or "Start" again
6. Click "Reset" button
7. Test different timer settings if available

**Expected Results**:

- [ ] Timer starts counting down from initial value (typically 25:00)
- [ ] Pause stops the timer
- [ ] Resume continues from paused time
- [ ] Reset returns timer to initial state
- [ ] Visual/audio notification at timer completion (if implemented)
- [ ] Timer controls are responsive

---

## Test Suite 5: Responsive Design Testing

### Test 5.1: Desktop Viewport (1920x1080)

**Objective**: Verify desktop layout and functionality

**Steps**:

1. Set browser window to 1920x1080 or maximize window
2. Navigate through all student routes
3. Observe layout, spacing, and element arrangement

**Expected Results**:

- [ ] Navigation menu is fully visible (horizontal or sidebar)
- [ ] Dashboard widgets display in multi-column layout
- [ ] All text is readable without horizontal scrolling
- [ ] Charts and graphs use full available width appropriately
- [ ] No overlapping elements
- [ ] Images and icons are properly sized
- [ ] Footer is visible at bottom

---

### Test 5.2: Laptop Viewport (1366x768)

**Objective**: Verify standard laptop resolution

**Steps**:

1. Resize browser window to 1366x768 or use DevTools
2. Navigate through dashboard, analytics, and other pages
3. Check for layout adjustments

**Expected Results**:

- [ ] Layout adapts appropriately
- [ ] All content is accessible without horizontal scroll
- [ ] Navigation remains functional
- [ ] Widget sizes adjust proportionally
- [ ] Text remains legible
- [ ] No content cutoff

---

### Test 5.3: Tablet Viewport (768x1024, Portrait)

**Objective**: Verify tablet portrait layout

**Steps**:

1. Use DevTools responsive mode: iPad (768x1024)
2. Navigate through all student pages
3. Test touch interactions (if using real tablet)

**Expected Results**:

- [ ] Navigation collapses to hamburger menu or similar
- [ ] Dashboard widgets stack vertically or adjust to fewer columns
- [ ] Touch targets are at least 44x44px (tap test)
- [ ] Charts resize appropriately
- [ ] All features remain accessible
- [ ] No horizontal scrolling required
- [ ] Text is readable without zooming

---

### Test 5.4: Tablet Viewport (1024x768, Landscape)

**Objective**: Verify tablet landscape layout

**Steps**:

1. Use DevTools responsive mode: iPad landscape (1024x768)
2. Navigate through student pages
3. Compare with portrait layout

**Expected Results**:

- [ ] Layout uses available horizontal space
- [ ] Widgets may display in wider arrangement than portrait
- [ ] Navigation remains appropriate for tablet
- [ ] All functionality accessible
- [ ] Charts utilize landscape orientation

---

### Test 5.5: Mobile Viewport (375x667, iPhone SE)

**Objective**: Verify small mobile phone layout

**Steps**:

1. Use DevTools responsive mode: iPhone SE (375x667)
2. Navigate through all student routes
3. Test all interactive elements

**Expected Results**:

- [ ] Navigation is mobile-friendly (hamburger menu)
- [ ] All widgets stack vertically (single column)
- [ ] Touch targets are appropriately sized
- [ ] Text is readable without horizontal scroll
- [ ] Forms and inputs are easy to use on mobile
- [ ] Charts resize to mobile width
- [ ] No content is hidden or inaccessible
- [ ] Font sizes are appropriate for mobile

---

### Test 5.6: Mobile Viewport (414x896, iPhone XR)

**Objective**: Verify larger mobile phone layout

**Steps**:

1. Use DevTools responsive mode: iPhone XR (414x896)
2. Navigate through all student pages
3. Compare with smaller mobile viewport

**Expected Results**:

- [ ] Layout similar to smaller mobile but uses extra width
- [ ] All features from smaller viewport still work
- [ ] Touch targets remain properly sized
- [ ] Better use of available vertical space

---

### Test 5.7: Mobile Viewport (360x640, Android)

**Objective**: Verify common Android phone resolution

**Steps**:

1. Use DevTools responsive mode: Android (360x640)
2. Test all critical user journeys
3. Check for any Android-specific issues

**Expected Results**:

- [ ] Layout works on narrow viewport (360px width)
- [ ] All content accessible
- [ ] No horizontal scrolling
- [ ] Touch interactions work smoothly

---

### Test 5.8: Responsive Breakpoint Transitions

**Objective**: Verify smooth transitions between breakpoints

**Steps**:

1. Start with desktop view (1920px)
2. Slowly resize browser window narrower
3. Observe layout changes at each breakpoint
4. Continue to mobile size (320px if supported)

**Expected Results**:

- [ ] Layout transitions are smooth
- [ ] No sudden jumps or broken layouts
- [ ] Content reflows appropriately
- [ ] Navigation changes at appropriate breakpoint
- [ ] No content becomes hidden unintentionally
- [ ] Minimum width handles gracefully (typically 320px)

---

## Test Suite 6: Offline Mode Testing

### Test 6.1: Initial Offline State

**Objective**: Test behavior when loading app while offline

**Steps**:

1. Ensure you are logged in and have visited several pages (to cache data)
2. Open DevTools Network tab
3. Enable "Offline" mode
4. Refresh the page
5. Observe the result

**Expected Results**:

- [ ] Offline indicator appears (if implemented)
- [ ] Cached page content displays (if PWA/service worker enabled)
- [ ] User sees clear message about offline state
- [ ] OR app shows appropriate error message
- [ ] No JavaScript errors in console

---

### Test 6.2: Go Offline While Using App

**Objective**: Test behavior when connection lost during usage

**Steps**:

1. Navigate to dashboard while online
2. Open DevTools Network tab
3. Switch to "Offline" mode
4. Try to navigate to different pages
5. Try to interact with features
6. Observe behavior

**Expected Results**:

- [ ] Offline indicator appears immediately or shortly after
- [ ] Cached pages load if available (PWA)
- [ ] Non-cached pages show offline message
- [ ] Interactive features that require network show appropriate feedback
- [ ] User understands they are offline
- [ ] App doesn't crash or freeze

---

### Test 6.3: Reconnect Online

**Objective**: Test recovery when connection restored

**Steps**:

1. While in offline mode from Test 6.2
2. Disable "Offline" mode in DevTools
3. Observe app behavior
4. Try to navigate or refresh

**Expected Results**:

- [ ] Offline indicator disappears
- [ ] App automatically reloads data (or prompts user)
- [ ] Queued actions execute if implemented
- [ ] User can resume normal usage
- [ ] All features return to working state

---

### Test 6.4: Offline Data Persistence

**Objective**: Verify data persists during offline period

**Steps**:

1. While online, note current points, badges, assignments
2. Go offline (DevTools Offline mode)
3. Navigate through pages
4. Come back online
5. Refresh and verify data

**Expected Results**:

- [ ] Data shown while offline matches last known state
- [ ] After reconnecting, data refreshes to current state
- [ ] No data loss occurred
- [ ] Synchronization happens smoothly

---

### Test 6.5: Offline Form Submission

**Objective**: Test form behavior when offline

**Steps**:

1. Go offline (DevTools Offline mode)
2. Navigate to goals or settings page
3. Try to create a new goal or update settings
4. Submit form
5. Observe result

**Expected Results**:

- [ ] Form submission blocked with clear message
- [ ] OR form queued for submission when online (if implemented)
- [ ] User notified they are offline and action cannot complete
- [ ] No confusing error messages
- [ ] Form data preserved if possible

---

## Test Suite 7: Cross-Browser Testing

### Test 7.1: Chrome/Chromium

**Objective**: Verify functionality in Chrome

**Steps**:

1. Open app in latest Chrome browser
2. Run through Test Suites 1-6 (sampling key tests)
3. Note any Chrome-specific behaviors

**Expected Results**:

- [ ] All features work correctly
- [ ] Layout renders properly
- [ ] No console errors
- [ ] Performance is acceptable

---

### Test 7.2: Firefox

**Objective**: Verify functionality in Firefox

**Steps**:

1. Open app in latest Firefox browser
2. Run through key tests from Suites 1-6
3. Compare with Chrome experience
4. Note any differences

**Expected Results**:

- [ ] All features work correctly
- [ ] Layout consistent with Chrome
- [ ] No Firefox-specific errors
- [ ] Charts and graphics render properly

---

### Test 7.3: Safari

**Objective**: Verify functionality in Safari (macOS/iOS)

**Steps**:

1. Open app in Safari (latest version)
2. Run through key tests from Suites 1-6
3. Test on both macOS and iOS if possible
4. Note any Safari-specific issues

**Expected Results**:

- [ ] All features work correctly
- [ ] Layout renders properly
- [ ] No Safari-specific errors
- [ ] Touch interactions work on iOS Safari
- [ ] PWA features work if implemented

---

### Test 7.4: Edge

**Objective**: Verify functionality in Microsoft Edge

**Steps**:

1. Open app in latest Edge browser
2. Run through key tests from Suites 1-6
3. Compare with Chrome (both use Chromium)
4. Note any differences

**Expected Results**:

- [ ] All features work correctly
- [ ] Behavior similar to Chrome
- [ ] No Edge-specific issues
- [ ] Performance is acceptable

---

## Test Suite 8: Accessibility Testing

### Test 8.1: Keyboard Navigation

**Objective**: Verify keyboard-only navigation works

**Steps**:

1. Navigate to login page
2. Use only keyboard (Tab, Shift+Tab, Enter, Escape, Arrow keys)
3. Complete login process
4. Navigate through dashboard and other pages
5. Test form inputs, buttons, and interactive elements

**Expected Results**:

- [ ] All interactive elements can be reached with Tab
- [ ] Focus indicator is clearly visible
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Enter key activates buttons
- [ ] Escape key closes dialogs/modals
- [ ] Arrow keys work for menus/lists
- [ ] No keyboard traps

---

### Test 8.2: Screen Reader Compatibility

**Objective**: Test with screen reader (NVDA, VoiceOver, JAWS)

**Steps**:

1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate through login and dashboard
3. Listen to announcements for all elements
4. Verify meaningful labels on buttons and inputs

**Expected Results**:

- [ ] All text is read aloud correctly
- [ ] Buttons have descriptive labels
- [ ] Form inputs have associated labels
- [ ] Images have alt text (decorative images ignored)
- [ ] Headings are properly announced
- [ ] Dynamic content changes are announced
- [ ] Navigation landmarks are identified

---

### Test 8.3: Color Contrast

**Objective**: Verify sufficient color contrast

**Steps**:

1. Use browser DevTools or contrast checker tool
2. Check contrast ratios for text and interactive elements
3. Test in both light and dark modes (if available)

**Expected Results**:

- [ ] Body text has at least 4.5:1 contrast ratio
- [ ] Large text (18pt+) has at least 3:1 contrast ratio
- [ ] Interactive elements have 3:1 contrast ratio
- [ ] Focus indicators are clearly visible
- [ ] No critical information conveyed by color alone

---

## Test Suite 9: Performance Testing

### Test 9.1: Initial Page Load Time

**Objective**: Measure time to interactive on first load

**Steps**:

1. Clear browser cache and local storage
2. Open DevTools Network tab
3. Navigate to login page
4. Record time to page interactive
5. Login and measure dashboard load time

**Expected Results**:

- [ ] Login page loads in under 3 seconds
- [ ] Dashboard loads in under 5 seconds (after login)
- [ ] Time to Interactive (TTI) is acceptable
- [ ] No unnecessary network requests

---

### Test 9.2: Navigation Speed

**Objective**: Measure page transition speed

**Steps**:

1. While logged in and warm cache
2. Navigate between pages (dashboard → analytics → AI prediction)
3. Measure perceived speed
4. Check Network tab for request count

**Expected Results**:

- [ ] Page transitions feel instant or under 1 second
- [ ] Minimal network requests for cached pages
- [ ] Smooth transitions without flash of unstyled content
- [ ] Loading states appear if data fetching takes > 500ms

---

## Test Suite 10: Session and Security Testing

### Test 10.1: Session Persistence

**Objective**: Verify session persists after page refresh

**Steps**:

1. Login successfully
2. Navigate to dashboard
3. Refresh the page (F5 or Ctrl/Cmd+R)
4. Observe result

**Expected Results**:

- [ ] User remains logged in after refresh
- [ ] Dashboard reloads correctly
- [ ] No redirect to login page
- [ ] User data persists

---

### Test 10.2: Logout Functionality

**Objective**: Verify logout clears session

**Steps**:

1. While logged in on dashboard
2. Locate logout button (usually in profile menu or navigation)
3. Click logout
4. Observe result
5. Use browser back button
6. Try to navigate to `/student/dashboard` directly

**Expected Results**:

- [ ] User is logged out successfully
- [ ] Redirect to login page or home page
- [ ] Session tokens cleared from localStorage
- [ ] Back button doesn't restore logged-in state
- [ ] Direct navigation to protected routes redirects to login

---

### Test 10.3: Session Timeout

**Objective**: Test automatic session timeout (if implemented)

**Steps**:

1. Login successfully
2. Leave the app idle for configured timeout period (typically 30 minutes)
3. Try to interact with the app
4. Observe result

**Expected Results**:

- [ ] Timeout warning appears before session expires (if implemented)
- [ ] After timeout, user is automatically logged out
- [ ] Redirect to login page
- [ ] Message explains session expired
- [ ] OR note if timeout is not implemented

---

## Bug Reporting Template

When issues are found during testing, use this template:

```markdown
### Bug ID: [Unique ID]

**Title**: [Brief description]

**Severity**: Critical | High | Medium | Low

**Test Suite**: [Suite and test number]

**Steps to Reproduce**:

1.
2.
3.

**Expected Result**:

**Actual Result**:

**Browser/Device**: [e.g., Chrome 120 on Windows 11]

**Viewport**: [e.g., 1920x1080 desktop]

**Screenshot**: [Attach if applicable]

**Console Errors**: [Copy any errors from DevTools console]

**Additional Notes**:
```

---

## Test Completion Checklist

### Test Coverage Summary

- [ ] All login flows tested (valid, invalid, edge cases)
- [ ] All student routes navigated and verified
- [ ] Data consistency verified across pages
- [ ] Interactive features tested
- [ ] Responsive design tested on 3+ viewports
- [ ] Offline mode behavior verified
- [ ] Cross-browser testing completed (minimum 2 browsers)
- [ ] Keyboard navigation tested
- [ ] Performance is acceptable

### Sign-off

**Tester Name**: ****\*\*****\_\_\_\_****\*\*****

**Test Date**: ****\*\*****\_\_\_\_****\*\*****

**Overall Result**: Pass | Fail | Pass with Issues

**Critical Issues Found**: ****\*\*****\_\_\_\_****\*\*****

**Notes**:

---

## Appendix: Quick Reference

### Student Routes

- `/student/dashboard` - Main dashboard
- `/student/analytics` - Performance analytics
- `/student/ai-prediction` - AI prediction dashboard
- `/student/goals` - Goals management
- `/student/gamification` - Gamification dashboard
- `/student/pomodoro` - Pomodoro timer
- `/student/settings` - Settings page

### Expected Data Values (Demo User)

- **User Name**: Alex Johnson
- **Email**: demo@example.com
- **Attendance**: 80%
- **Points**: 2450
- **Performance Score**: 86-89%
- **Role**: Student

### Common DevTools Shortcuts

- **Open DevTools**: F12 or Ctrl/Cmd+Shift+I
- **Responsive Mode**: Ctrl/Cmd+Shift+M
- **Console**: Ctrl/Cmd+Shift+J
- **Network Tab**: Ctrl/Cmd+Shift+E (then click Network)
- **Go Offline**: DevTools → Network → Throttling dropdown → Offline

### Browser Viewport Presets

- **Desktop**: 1920x1080, 1366x768
- **Tablet**: 768x1024 (iPad portrait), 1024x768 (iPad landscape)
- **Mobile**: 375x667 (iPhone SE), 414x896 (iPhone XR), 360x640 (Android)

---

## Revision History

| Version | Date   | Author   | Changes          |
| ------- | ------ | -------- | ---------------- |
| 1.0     | [Date] | [Author] | Initial creation |
