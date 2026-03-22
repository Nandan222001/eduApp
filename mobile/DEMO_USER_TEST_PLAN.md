# Demo User Test Plan

This document outlines the test plan for demo user functionality in the mobile application.

## Demo User Credentials

### Student Demo User
- **Email**: demo@example.com
- **Password**: Demo@123
- **User**: Alex Johnson
- **Grade**: 10th Grade, Section 10-A

### Parent Demo User
- **Email**: parent@demo.com
- **Password**: Demo@123
- **User**: Sarah Johnson
- **Children**: Alex Johnson (10th Grade), Emma Johnson (7th Grade)

## Test Scenarios

### 1. Student Demo User Login Flow

#### 1.1 Login Test
**Steps:**
1. Open the mobile app
2. Navigate to login screen
3. Enter email: `demo@example.com`
4. Enter password: `Demo@123`
5. Tap "Login" button

**Expected Results:**
- ✅ Login succeeds without making network API call
- ✅ Token is stored with prefix `demo_student_access_token_`
- ✅ User is marked as demo user in secure storage
- ✅ User is redirected to Student Dashboard
- ✅ No network errors occur

#### 1.2 Dashboard Load Test
**Steps:**
1. After successful login, verify dashboard loads

**Expected Results:**
- ✅ Dashboard displays demo data without network calls
- ✅ Shows welcome card with "Alex Johnson"
- ✅ Displays attendance: 80% (128/160 classes)
- ✅ Shows 2 pending assignments
- ✅ Displays recent grades (Math: 88%, Biology: 82%, Chemistry: 85%)
- ✅ Shows AI predictions with 85% predicted score
- ✅ Displays gamification data (2450 points, Level 5, Rank #8)
- ✅ Shows active goals (3 goals)

#### 1.3 Navigate to All Student Screens
**Steps:**
1. Navigate to each screen in student app:
   - Assignments
   - Grades
   - AI Predictions
   - Gamification
   - Goals
   - Profile

**Expected Results:**
- ✅ All screens load demo data successfully
- ✅ No network API calls are made
- ✅ No loading errors or crashes
- ✅ Data is consistent across screens

#### 1.4 Assignments Screen Test
**Steps:**
1. Navigate to Assignments screen
2. View list of assignments

**Expected Results:**
- ✅ Shows 6 assignments total
- ✅ 2 pending assignments (Math, Biology)
- ✅ 3 graded assignments with scores
- ✅ All assignments have proper status and due dates
- ✅ Can filter by status

#### 1.5 Grades Screen Test
**Steps:**
1. Navigate to Grades screen
2. View exam results

**Expected Results:**
- ✅ Shows 3 exam results
- ✅ Mathematics: 88/100 (88%, Rank 5)
- ✅ Biology: 82/100 (82%, Rank 8)
- ✅ Chemistry: 85/100 (85%, Rank 6)
- ✅ Each result shows section breakdown

#### 1.6 AI Predictions Screen Test
**Steps:**
1. Navigate to AI Predictions screen
2. View predictions and study plan

**Expected Results:**
- ✅ Shows predicted score: 85%
- ✅ Displays confidence: 82%
- ✅ Shows trend: improving
- ✅ Lists topic probabilities
- ✅ Shows focus areas with priority levels
- ✅ Displays personalized study plan
- ✅ Today's tasks are visible
- ✅ Can mark tasks as complete (no network call)
- ✅ Can regenerate study plan (no network call)

#### 1.7 Gamification Screen Test
**Steps:**
1. Navigate to Gamification screen
2. View all tabs (Overview, Badges, Leaderboard)

**Expected Results:**
- ✅ Overview shows total points: 2450
- ✅ Current level: 5 (Scholar)
- ✅ Rank: #8 of 150
- ✅ Displays streak data (7 days current)
- ✅ Shows recent activity
- ✅ Badges tab displays 6 badges (4 earned, 2 in progress)
- ✅ Leaderboard tab shows rankings
- ✅ Can switch between daily/weekly/monthly/all-time periods

#### 1.8 Logout Test
**Steps:**
1. Navigate to Profile/Settings
2. Tap "Logout"

**Expected Results:**
- ✅ Logout succeeds without network API call
- ✅ Tokens are cleared from secure storage
- ✅ Demo user flag is cleared
- ✅ User is redirected to login screen
- ✅ No errors occur

### 2. Parent Demo User Login Flow

#### 2.1 Login Test
**Steps:**
1. Open the mobile app
2. Navigate to login screen
3. Enter email: `parent@demo.com`
4. Enter password: `Demo@123`
5. Tap "Login" button

**Expected Results:**
- ✅ Login succeeds without making network API call
- ✅ Token is stored with prefix `demo_parent_access_token_`
- ✅ User is marked as demo user in secure storage
- ✅ User is redirected to Parent Dashboard
- ✅ No network errors occur

#### 2.2 Dashboard Load Test
**Steps:**
1. After successful login, verify dashboard loads

**Expected Results:**
- ✅ Dashboard displays demo data without network calls
- ✅ Shows 2 children (Alex Johnson, Emma Johnson)
- ✅ Displays child selector
- ✅ Shows attendance for selected child
- ✅ Displays recent grades
- ✅ Shows fee payment status
- ✅ Lists pending assignments

#### 2.3 Child Selection Test
**Steps:**
1. Tap on child selector
2. Select Alex Johnson
3. Select Emma Johnson

**Expected Results:**
- ✅ Child selector modal opens
- ✅ Shows both children
- ✅ Can switch between children
- ✅ Data updates for selected child
- ✅ Alex: 80% attendance, Rank 8, 84.3% average
- ✅ Emma: 92% attendance, Rank 3, 91.5% average

#### 2.4 Attendance Data Test
**Steps:**
1. View attendance for both children

**Expected Results:**
- ✅ Alex Johnson: 80% attendance, marked present today
- ✅ Emma Johnson: 92% attendance, marked present today
- ✅ Attendance calendar shows historical data
- ✅ Subject-wise attendance is displayed

#### 2.5 Grades Data Test
**Steps:**
1. View grades for both children

**Expected Results:**
- ✅ Alex: 3 exam results (Math: 88%, Biology: 82%, Chemistry: 85%)
- ✅ Emma: 2 exam results (Math: 95%, Science: 92%)
- ✅ Each grade shows exam name, date, percentage
- ✅ Grade badges show appropriate colors

#### 2.6 Fee Payment Data Test
**Steps:**
1. View fee payment status for both children

**Expected Results:**
- ✅ Alex: Total fees ₹11,500, Paid ₹5,500, Pending ₹6,000
- ✅ Emma: Total fees ₹9,000, Paid ₹4,500, Pending ₹4,500
- ✅ Fee status badges show correct colors
- ✅ Due dates are displayed
- ✅ Payment history is visible

#### 2.7 Messages and Announcements Test
**Steps:**
1. View messages tab
2. View announcements tab

**Expected Results:**
- ✅ Shows 4 teacher messages (2 unread)
- ✅ Messages show sender, subject, priority
- ✅ Can mark messages as read (no network call)
- ✅ Shows 4 school announcements
- ✅ Announcements show category and importance

#### 2.8 Navigate to All Parent Screens
**Steps:**
1. Navigate to each screen in parent app:
   - Attendance
   - Grades
   - Messages
   - Fees

**Expected Results:**
- ✅ All screens load demo data successfully
- ✅ No network API calls are made
- ✅ No loading errors or crashes
- ✅ Data is consistent across screens

#### 2.9 Logout Test
**Steps:**
1. Navigate to Profile/Settings
2. Tap "Logout"

**Expected Results:**
- ✅ Logout succeeds without network API call
- ✅ Tokens are cleared from secure storage
- ✅ Demo user flag is cleared
- ✅ User is redirected to login screen
- ✅ No errors occur

### 3. Real User Login Flow (Verification)

#### 3.1 Real User Login Test
**Steps:**
1. Logout from demo account (if logged in)
2. Enter real user credentials
3. Tap "Login" button

**Expected Results:**
- ✅ Normal API call is made to backend
- ✅ Token does NOT start with `demo_` prefix
- ✅ User is NOT marked as demo user in secure storage
- ✅ All API calls go to backend normally
- ✅ Real data is fetched from backend

#### 3.2 Real User Data Test
**Steps:**
1. Navigate through screens
2. Verify data is fetched from backend

**Expected Results:**
- ✅ All API calls are made to backend
- ✅ Network requests visible in logs
- ✅ Real user data is displayed
- ✅ No demo data is shown

## Offline Functionality

### 4.1 Demo User Works Without Network
**Steps:**
1. Disable network connection (Airplane mode)
2. Login with demo credentials
3. Navigate through all screens

**Expected Results:**
- ✅ Login works without network
- ✅ All screens load successfully
- ✅ No network errors
- ✅ All data is available offline

### 4.2 Real User Requires Network
**Steps:**
1. Disable network connection (Airplane mode)
2. Try to login with real user credentials

**Expected Results:**
- ✅ Login fails with network error
- ✅ Error message is displayed
- ✅ User is informed to check connection

## Token Refresh

### 5.1 Demo User Token Refresh
**Steps:**
1. Login as demo user
2. Wait for token to expire (or simulate)
3. Trigger token refresh

**Expected Results:**
- ✅ Token refresh succeeds without network call
- ✅ New demo token is generated
- ✅ User session continues
- ✅ No errors occur

### 5.2 Real User Token Refresh
**Steps:**
1. Login as real user
2. Wait for token to expire (or simulate)
3. Trigger token refresh

**Expected Results:**
- ✅ Token refresh makes API call to backend
- ✅ New tokens are received from backend
- ✅ User session continues
- ✅ Normal token refresh flow

## Summary

This test plan ensures that:
1. Demo users can login and use the app without any network connection
2. All student screens work with demo data
3. All parent screens work with demo data
4. Real users still make normal API calls to the backend
5. Demo and real user flows don't interfere with each other
6. Logout works correctly for both demo and real users
7. Token management works correctly for both user types

## Test Execution Checklist

- [ ] Student demo login works offline
- [ ] Student dashboard loads demo data
- [ ] All student screens accessible
- [ ] Student assignment data displays correctly
- [ ] Student grades data displays correctly
- [ ] Student AI predictions display correctly
- [ ] Student gamification data displays correctly
- [ ] Student can logout successfully
- [ ] Parent demo login works offline
- [ ] Parent dashboard loads demo data
- [ ] Parent can switch between children
- [ ] Parent attendance data displays correctly
- [ ] Parent grades data displays correctly
- [ ] Parent fee data displays correctly
- [ ] Parent messages display correctly
- [ ] Parent can logout successfully
- [ ] Real user login makes API calls
- [ ] Real user data loads from backend
- [ ] Demo token refresh works offline
- [ ] Real token refresh makes API calls
- [ ] No interference between demo and real users
