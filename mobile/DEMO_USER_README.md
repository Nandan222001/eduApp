# Demo User Functionality

This document explains the demo user functionality implemented in the mobile application, allowing users to explore the app's features without requiring a backend connection or real account.

## Overview

The demo user feature provides:
- **Offline-first experience**: Works without any network connection
- **Complete feature showcase**: All screens and features accessible with realistic data
- **Two user types**: Student and Parent demo accounts
- **Zero backend dependency**: No API calls made for demo users
- **Seamless switching**: Can easily switch between demo and real accounts

## Demo User Credentials

### Student Demo Account
```
Email: demo@example.com
Password: Demo@123
```

**Profile:**
- Name: Alex Johnson
- Grade: 10th Grade
- Section: 10-A
- Roll Number: SA-2024-1001

**Available Data:**
- 8 subjects
- 6 assignments (2 pending, 3 graded, 1 overdue)
- 80% attendance (128/160 classes)
- 3 exam results
- 2 upcoming exams
- AI predictions and weak areas
- 2450 gamification points (Level 5, Rank #8)
- 6 badges (4 earned, 2 in progress)
- 3 active goals

### Parent Demo Account
```
Email: parent@demo.com
Password: Demo@123
```

**Profile:**
- Name: Sarah Johnson
- Children: 2 (Alex Johnson, Emma Johnson)

**Available Data (per child):**
- Alex Johnson (10th Grade):
  - 80% attendance
  - Rank: 8
  - 84.3% average score
  - 3 exam results
  - 2 pending assignments
  - Fee status: ₹6,000 pending
  
- Emma Johnson (7th Grade):
  - 92% attendance
  - Rank: 3
  - 91.5% average score
  - 2 exam results
  - 1 submitted assignment
  - Fee status: ₹4,500 pending

**Shared Data:**
- 4 teacher messages (2 unread)
- 4 school announcements

## Implementation Details

### Architecture

The demo user system is implemented through several key components:

1. **Authentication Layer** (`mobile/src/api/authApi.ts`)
   - Intercepts login for demo credentials
   - Returns demo tokens without API calls
   - Handles token refresh for demo users

2. **Demo Data Provider** (`mobile/src/api/demoDataApi.ts`)
   - Centralized source of all demo data
   - Structured to match real API responses
   - Comprehensive data covering all features

3. **API Routing** (`mobile/src/api/student.ts`, `mobile/src/api/parent.ts`)
   - Checks if user is demo user
   - Routes to demo data instead of API calls
   - Maintains same interface as real API

4. **Secure Storage** (`mobile/src/utils/secureStorage.ts`)
   - Stores demo user flag
   - Persists demo tokens
   - Enables session restoration

### Token Format

Demo tokens follow a specific format for identification:

**Student Demo Tokens:**
```
Access Token: demo_student_access_token_<timestamp>
Refresh Token: demo_student_refresh_token_<timestamp>
```

**Parent Demo Tokens:**
```
Access Token: demo_parent_access_token_<timestamp>
Refresh Token: demo_parent_refresh_token_<timestamp>
```

This format allows the system to:
- Identify demo users instantly
- Skip network calls
- Handle token refresh without backend
- Maintain session across app restarts

### Data Structure

Demo data is organized in `mobile/src/data/dummyData.ts`:

```typescript
{
  students: {
    demo: {
      user: { ... },
      profile: { ... },
      stats: { ... },
      assignments: [ ... ],
      subjects: [ ... ],
      attendance: {
        summary: { ... },
        history: [ ... ]
      },
      exams: {
        results: [ ... ],
        upcoming: [ ... ]
      },
      ai: {
        predictions: [ ... ],
        weakAreas: [ ... ],
        focusAreas: { ... },
        topicProbabilities: { ... }
      },
      gamification: {
        points: { ... },
        badges: [ ... ],
        leaderboard: { ... },
        streaks: [ ... ],
        achievements: [ ... ],
        stats: { ... }
      },
      goals: [ ... ]
    }
  },
  parents: {
    demo: {
      user: { ... },
      children: [ ... ],
      childrenStats: { ... },
      todayAttendance: { ... },
      grades: { ... },
      assignments: { ... },
      feePayments: { ... },
      messages: [ ... ],
      announcements: [ ... ],
      attendanceCalendar: { ... },
      subjectAttendance: { ... },
      examResults: { ... },
      subjectPerformance: { ... }
    }
  }
}
```

### Network Call Prevention

Demo users never make network API calls:

1. **Login**: Returns demo tokens immediately
2. **Token Refresh**: Generates new demo tokens locally
3. **Logout**: Clears local storage without API call
4. **Data Fetching**: All data served from `demoDataApi`
5. **Write Operations**: Simulated locally (e.g., marking tasks complete)

### Screen Coverage

All screens support demo mode:

**Student Screens:**
- ✅ Dashboard
- ✅ Assignments (list and detail)
- ✅ Grades
- ✅ AI Predictions
- ✅ Gamification (overview, badges, leaderboard)
- ✅ Goals
- ✅ Profile
- ✅ Attendance (summary and history)
- ✅ Exams (results and upcoming)

**Parent Screens:**
- ✅ Dashboard
- ✅ Child Selector
- ✅ Attendance (overview and calendar)
- ✅ Grades (list and details)
- ✅ Fees (payment status and history)
- ✅ Messages (inbox and detail)
- ✅ Announcements
- ✅ Profile

## Usage Guide

### For Users

#### Trying the App
1. Download and install the mobile app
2. On the login screen, use demo credentials:
   - Student: `demo@example.com` / `Demo@123`
   - Parent: `parent@demo.com` / `Demo@123`
3. Explore all features without registration
4. Works completely offline

#### Switching to Real Account
1. Logout from demo account
2. Login with your real credentials
3. App will connect to backend and fetch real data

### For Developers

#### Adding New Demo Data

1. **Update `dummyData.ts`**:
```typescript
export const newDemoData = [
  {
    id: 1,
    field: 'value',
    // ... more fields
  }
];
```

2. **Add to Data Structure**:
```typescript
export const dummyData = {
  students: {
    demo: {
      // ... existing data
      newFeature: newDemoData
    }
  }
};
```

3. **Update `demoDataApi.ts`**:
```typescript
getNewFeature: async () => {
  return Promise.resolve(studentDemoData.newFeature);
}
```

4. **Update API Files**:
```typescript
export const studentApi = {
  getNewFeature: async () => {
    if (await isDemoUser()) {
      const data = await demoDataApi.student.getNewFeature();
      return { data };
    }
    return apiClient.get('/api/v1/new-feature');
  }
};
```

#### Testing Demo Mode

1. **Enable Network Monitoring**:
```typescript
// Check that no network calls are made
// All data should come from demoDataApi
```

2. **Test Offline**:
```bash
# Enable airplane mode
# Login with demo credentials
# Verify all screens work
```

3. **Verify Token Format**:
```typescript
const token = await secureStorage.getAccessToken();
console.log(token.startsWith('demo_')); // Should be true
```

## Benefits

### For Users
- 🚀 **Instant Access**: Try the app immediately without registration
- 📴 **Offline**: Works without internet connection
- 🎯 **Full Features**: Explore all functionality
- 🔒 **Private**: No data sent to servers

### For Business
- 📈 **Higher Conversion**: Users can try before signup
- 🎨 **Showcase**: Demonstrate features with realistic data
- 📱 **App Store**: Better app store demos
- 🧪 **Testing**: QA can test without backend

### For Developers
- ⚡ **Fast Development**: Work offline with consistent data
- 🧪 **Testing**: Automated tests with known data
- 🐛 **Debugging**: Consistent state for reproducing issues
- 📚 **Documentation**: Living examples of data structures

## Limitations

Demo mode has some intentional limitations:

1. **No Persistence**: Changes reset on logout
2. **Static Data**: Data doesn't update in real-time
3. **Limited Interactions**: Write operations are simulated
4. **No File Upload**: Can't upload real files
5. **No Notifications**: Push notifications disabled

## Security Considerations

1. **Token Prefixes**: Demo tokens clearly identifiable
2. **No Backend Access**: Demo users can't access backend
3. **Isolated Storage**: Demo data separate from real data
4. **Clear Indicators**: UI shows when in demo mode (optional)
5. **Easy Logout**: Simple transition to real account

## Future Enhancements

Potential improvements:

1. **Demo Indicator**: Badge showing "Demo Mode"
2. **Guided Tour**: Interactive tutorial using demo data
3. **Data Randomization**: Slightly different data on each session
4. **Local Persistence**: Save demo changes in local storage
5. **More Scenarios**: Additional demo users for different use cases
6. **Interactive Demo**: Guided walkthrough of features
7. **Demo Reset**: Button to reset demo data to initial state

## Troubleshooting

### Demo Login Not Working
- Verify credentials are exactly: `demo@example.com` / `Demo@123`
- Check that `demoDataApi.ts` is properly imported
- Ensure `authApi.ts` checks for demo credentials

### Data Not Loading
- Check that `isDemoUser()` returns true
- Verify API files route to `demoDataApi`
- Confirm demo data exists in `dummyData.ts`

### Network Calls Being Made
- Check token format (should start with `demo_`)
- Verify API routing logic
- Ensure `isDemoUser` flag is set correctly

### Session Not Persisting
- Check secure storage implementation
- Verify demo flag is saved on login
- Confirm `loadStoredAuth` handles demo users

## Related Files

- `/mobile/src/api/authApi.ts` - Authentication with demo support
- `/mobile/src/api/demoDataApi.ts` - Demo data provider
- `/mobile/src/api/student.ts` - Student API with demo routing
- `/mobile/src/api/parent.ts` - Parent API with demo routing
- `/mobile/src/api/client.ts` - HTTP client
- `/mobile/src/data/dummyData.ts` - All demo data
- `/mobile/src/utils/secureStorage.ts` - Token and flag storage
- `/mobile/src/store/slices/authSlice.ts` - Auth state management
- `/mobile/DEMO_USER_TEST_PLAN.md` - Comprehensive test plan

## Support

For issues or questions about demo mode:
1. Check this documentation
2. Review test plan (`DEMO_USER_TEST_PLAN.md`)
3. Examine demo data structure (`dummyData.ts`)
4. Test with provided credentials
5. Verify network calls are not being made

---

**Note**: Demo mode is designed for evaluation and testing purposes. For production use, users should create real accounts.
