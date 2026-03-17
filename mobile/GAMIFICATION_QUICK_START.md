# Gamification & Goals - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
# or
yarn install
```

This will install the new dependency: `react-native-confetti-cannon`

### 2. iOS Setup (if using iOS)

```bash
cd ios
pod install
cd ..
```

## Usage

### Accessing Gamification Features

#### From Dashboard

The student dashboard now includes two new widgets:

1. **Quick Gamification Widget**: Shows points, rank, active goals, and streak
   - Tap anywhere on the widget to go to full Gamification screen

2. **Active Goals Widget**: Shows up to 3 active goals with progress bars
   - Tap "View All" to go to Goals screen
   - Tap individual goals for quick access

#### From Navigation

1. Navigate to Gamification screen via app navigation
2. Navigate to Goals screen via app navigation

### API Integration

#### Required Backend Endpoints

```typescript
// Gamification
GET  /api/v1/gamification
GET  /api/v1/gamification/leaderboard?period={daily|weekly|monthly|all-time}

// Goals
GET    /api/v1/goals
POST   /api/v1/goals
PUT    /api/v1/goals/:id
DELETE /api/v1/goals/:id
PATCH  /api/v1/goals/:id/progress
```

#### Expected Response Formats

**Gamification Details** (`GET /api/v1/gamification`):

```json
{
  "totalPoints": 1250,
  "currentLevel": 5,
  "nextLevelPoints": 2000,
  "pointsToNextLevel": 750,
  "rank": 15,
  "totalStudents": 150,
  "badges": [
    {
      "id": 1,
      "name": "Perfect Attendance",
      "description": "100% attendance for a month",
      "icon": "calendar-check",
      "earnedAt": "2024-01-15T10:00:00Z",
      "rarity": "rare",
      "category": "attendance",
      "unlocked": true
    }
  ],
  "recentAchievements": [
    {
      "id": 1,
      "title": "Quiz Master",
      "description": "Scored 100% on 5 quizzes",
      "pointsEarned": 50,
      "achievedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "streak": {
    "currentStreak": 7,
    "longestStreak": 14,
    "lastActivityDate": "2024-01-20T08:00:00Z",
    "streakType": "daily_login"
  },
  "streakCalendar": [
    {
      "date": "2024-01-20",
      "count": 3,
      "type": "login"
    }
  ],
  "pointsHistory": [
    {
      "date": "2024-01-20",
      "points": 25,
      "reason": "Completed assignment",
      "type": "earned"
    }
  ]
}
```

**Leaderboard** (`GET /api/v1/gamification/leaderboard`):

```json
[
  {
    "rank": 1,
    "studentId": 123,
    "studentName": "John Doe",
    "avatar": "https://...",
    "points": 2500,
    "level": 8,
    "badges": 15,
    "trend": "up",
    "isCurrentUser": false
  }
]
```

**Goals List** (`GET /api/v1/goals`):

```json
[
  {
    "id": 1,
    "title": "Improve Math Grade",
    "description": "Achieve A grade in Math by end of semester",
    "type": "measurable",
    "category": "academic",
    "targetValue": 90,
    "currentValue": 75,
    "unit": "percentage",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-06-30T23:59:59Z",
    "status": "active",
    "milestones": [
      {
        "id": 1,
        "title": "Reach 80%",
        "targetValue": 80,
        "achieved": false
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-20T00:00:00Z",
    "reward": {
      "points": 100,
      "badge": "Math Master"
    }
  }
]
```

### WebSocket Integration (Optional but Recommended)

For real-time updates, implement a WebSocket server:

#### Connection

```
ws://your-api.com/ws?token={jwt_token}
```

#### Events to Emit (Server → Client)

```json
// Gamification update
{
  "type": "gamification_update",
  "payload": {
    "totalPoints": 1300,
    "rank": 14
  }
}

// Badge earned
{
  "type": "badge_earned",
  "payload": {
    "id": 5,
    "name": "Homework Hero",
    "rarity": "epic"
  }
}

// Achievement unlocked
{
  "type": "achievement_unlocked",
  "payload": {
    "id": 10,
    "title": "Study Streak 10",
    "pointsEarned": 50
  }
}

// Leaderboard update
{
  "type": "leaderboard_update",
  "payload": {
    "rank": 13,
    "previousRank": 15
  }
}

// Goal update
{
  "type": "goal_update",
  "payload": {
    "goalId": 1,
    "currentValue": 80,
    "status": "active"
  }
}
```

#### Events to Handle (Client → Server)

```json
// Heartbeat
{
  "type": "ping"
}

// Server responds with
{
  "type": "pong"
}
```

## Features Overview

### 1. Gamification Dashboard

#### Overview Tab

- **View**: Total points, level progress, rank
- **Streak Calendar**: Visual heatmap of activity
- **Recent Activity**: List of recent point changes

#### Badges Tab

- **View**: All badges organized by category
- **Filter**: By rarity (common, rare, epic, legendary)
- **Progress**: See progress toward locked badges

#### Leaderboard Tab

- **Periods**: Daily, Weekly, Monthly, All-Time
- **Updates**: Real-time rank changes
- **Highlight**: Your position in the list

### 2. Goals Management

#### Create Goal

```typescript
// Example goal creation
{
  title: "Master React Native",
  description: "Complete 10 React Native projects",
  type: "measurable",
  category: "personal",
  targetValue: 10,
  unit: "projects",
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}
```

#### Update Progress

- Tap "Update Progress" button
- Progress increments automatically
- Confetti celebration on completion

#### Track Milestones

- Visual timeline shows progress
- Check marks for completed milestones
- Color-coded by category

## Customization

### Colors

Edit `mobile/src/constants/index.ts`:

```typescript
export const COLORS = {
  primary: '#3B82F6', // Main brand color
  secondary: '#10B981', // Success/completion
  accent: '#F59E0B', // Points/rewards
  // ... add your colors
};
```

### Badge Rarities

Edit rarity colors in components:

```typescript
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return '#FFD700'; // Gold
    case 'epic':
      return '#9B59B6'; // Purple
    case 'rare':
      return '#3498DB'; // Blue
    case 'common':
      return '#95A5A6'; // Gray
  }
};
```

### Real-Time Update Intervals

Edit `mobile/src/hooks/useGamificationRealtime.ts`:

```typescript
// Gamification polling
setInterval(() => {
  /* ... */
}, 30000); // 30 seconds

// Leaderboard polling
setInterval(() => {
  /* ... */
}, 15000); // 15 seconds

// Goals polling
setInterval(() => {
  /* ... */
}, 20000); // 20 seconds
```

## Troubleshooting

### WebSocket Not Connecting

1. Check server URL in `websocketService.ts`
2. Verify JWT token is valid
3. Check network connectivity
4. Review server logs for connection errors

### Animations Not Smooth

1. Enable Hermes engine (should be default)
2. Check for heavy re-renders
3. Profile using React DevTools
4. Reduce polling frequency if needed

### Badge Animation Not Showing

1. Verify badge data includes all required fields
2. Check `unlocked` flag is properly set
3. Ensure confetti-cannon is installed
4. Check for animation performance issues on device

### Goals Not Updating

1. Check API endpoint responses
2. Verify mutation success callbacks
3. Check query cache invalidation
4. Review network tab for errors

### Missing Icons

Ensure vector icons are linked:

```bash
npx react-native link react-native-vector-icons
```

## Testing

### Manual Testing Checklist

- [ ] View gamification dashboard
- [ ] Switch between tabs
- [ ] View badge details
- [ ] Check leaderboard updates
- [ ] Create a new goal
- [ ] Update goal progress
- [ ] Complete a goal (triggers confetti)
- [ ] View streak calendar
- [ ] Check real-time updates
- [ ] Test offline behavior

### Test Data

Use the following test accounts to verify leaderboard:

```
Student 1: test+student1@example.com (1000 points)
Student 2: test+student2@example.com (950 points)
Student 3: test+student3@example.com (900 points)
```

## Performance Tips

1. **Lazy Load**: Leaderboard only loads when tab is active
2. **Cache**: React Query caches responses automatically
3. **Debounce**: Goal updates use optimistic updates
4. **Animations**: Use native driver when possible
5. **WebSocket**: Disconnect when app backgrounds

## Support

### Common Questions

**Q: How often does the leaderboard update?**
A: Every 15 seconds via polling, instantly via WebSocket

**Q: Can students see other students' full profiles?**
A: Only name, avatar, and public stats (points, level, badges)

**Q: What happens when a goal deadline passes?**
A: Goal status changes to 'failed' or 'overdue'

**Q: Can teachers create goals for students?**
A: That would require backend support - currently students create their own

**Q: How are points calculated?**
A: Points are awarded by the backend based on configured rules

### Need Help?

- Review the full implementation docs: `GAMIFICATION_IMPLEMENTATION.md`
- Check existing components for examples
- Review the types in `src/types/student.ts`

## Next Steps

1. ✅ Install dependencies
2. ✅ Implement backend endpoints
3. ✅ Test API responses
4. ✅ Configure WebSocket server (optional)
5. ✅ Customize colors and branding
6. ✅ Test on physical devices
7. ✅ Set up push notifications for badges
8. ✅ Deploy to staging
9. ✅ User acceptance testing
10. ✅ Production deployment
