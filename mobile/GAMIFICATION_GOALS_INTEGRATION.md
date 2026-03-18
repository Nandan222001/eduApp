# Gamification and Goals Integration Guide

## Overview

This guide explains how to integrate the Gamification and Goals screens into your mobile application.

## Features Implemented

### Gamification Screen (`/mobile/src/screens/shared/GamificationScreen.tsx`)

1. **Points System**
   - Real-time points balance display
   - Level progression with visual progress bars
   - Recent activity feed showing point-earning actions
   - Automatic level-up detection

2. **Badges Grid**
   - Earned and locked badges with unlock animations
   - Badge rarity indicators (common, rare, epic, legendary)
   - Interactive badge detail modals with criteria
   - Progress tracking for locked badges

3. **Leaderboard**
   - Multiple timeframes (daily, weekly, monthly, all-time)
   - User's current rank with highlighted position
   - Top rankers display with medal icons
   - Rank change indicators with trend arrows
   - Smooth animations using React Native Reanimated

4. **Streak Calendar**
   - Daily login streak visualization
   - Heatmap calendar showing activity days
   - Current and longest streak stats
   - Next milestone indicators

5. **Achievement Notifications**
   - Real-time achievement popups
   - Badge unlock animations
   - Point rewards display
   - Auto-dismissible notifications

6. **Rewards System**
   - Points redemption interface
   - Available rewards catalog
   - Claim reward functionality

### Goals Screen (Enhanced for Both Roles)

**Student View** (`/mobile/src/screens/student/GoalsScreen.tsx`):

1. **Goal Creation Form**
   - SMART goals framework integration
   - Category selection (academic, skill, personal, career)
   - Priority levels (high, medium, low)
   - Target date picker
   - Milestone creation

2. **Active Goals Display**
   - Visual progress bars with percentage
   - Category and priority badges
   - Days remaining countdown
   - Milestone completion tracking
   - Goal sharing functionality

3. **Milestone Timeline**
   - Interactive timeline visualization
   - Completion checkpoints
   - Target date tracking
   - Visual completion states

4. **Achievement Celebration**
   - Confetti animation on goal completion
   - Celebration modal with share option
   - Achievement badges

5. **Optimistic UI Updates**
   - Instant progress updates
   - Rollback on API failure
   - Loading states
   - Error handling with user feedback

6. **Goal Sharing**
   - Native share dialog
   - Formatted goal summaries
   - Progress snapshots

**Parent View** (`/mobile/src/screens/parent/GoalsScreen.tsx`):
- View child's goals (read-only)
- Same visualization as student view
- No creation or editing capabilities

### Weekly Goal Digest Notifications

**Service** (`/mobile/src/services/goalNotificationService.ts`):

1. **Weekly Digest**
   - Scheduled every Monday at 9 AM
   - Summary of completed goals
   - Active goals needing attention
   - Progress overview

2. **Goal Reminders**
   - 7 days before deadline
   - 3 days before deadline
   - 1 day before deadline
   - Day of deadline

3. **Achievement Notifications**
   - Milestone completion alerts
   - Goal completion celebrations
   - Progress updates

## API Endpoints Used

### Gamification API (`/api/v1/gamification`)

```typescript
GET /api/v1/gamification/points?studentId={id}
GET /api/v1/gamification/badges?studentId={id}
GET /api/v1/gamification/badges/{badgeId}
GET /api/v1/gamification/leaderboard?timeframe={timeframe}&classId={id}
GET /api/v1/gamification/achievements?studentId={id}
GET /api/v1/gamification/stats?studentId={id}
GET /api/v1/gamification/rewards
GET /api/v1/gamification/streaks?studentId={id}
POST /api/v1/gamification/rewards/{rewardId}/claim
POST /api/v1/gamification/achievements/{achievementId}/viewed
```

### Goals API (`/api/v1/goals`)

```typescript
GET /api/v1/goals?status={status}
GET /api/v1/goals/{goalId}
POST /api/v1/goals
PATCH /api/v1/goals/{goalId}
DELETE /api/v1/goals/{goalId}
POST /api/v1/goals/{goalId}/milestones/{milestoneId}/complete
PATCH /api/v1/goals/{goalId}/milestones/{milestoneId}
GET /api/v1/goals/achievements
POST /api/v1/goals/{goalId}/share
GET /api/v1/goals/shared
GET /api/v1/goals/child/{childId}?status={status}
```

## Integration Steps

### 1. Add to Navigation

```typescript
// In your MainNavigator.tsx or similar
import { GamificationScreenWrapper, GoalsScreenWrapper } from '@screens/shared';

<Stack.Screen
  name="Gamification"
  component={GamificationScreenWrapper}
  options={{ title: 'Gamification' }}
/>

<Stack.Screen
  name="Goals"
  component={GoalsScreenWrapper}
  options={{ title: 'Goals' }}
/>
```

### 2. Add Navigation Links

**For Student Dashboard:**
```typescript
navigation.navigate('Gamification');
navigation.navigate('Goals');
```

**For Parent Dashboard (viewing child's data):**
```typescript
navigation.navigate('Gamification', { studentId: childId });
navigation.navigate('Goals', { studentId: childId });
```

### 3. Initialize Notifications

```typescript
// In your App.tsx or main component
import { useGoalNotifications } from '@hooks';

function App() {
  useGoalNotifications(); // Initializes weekly digest and reminders
  
  // ... rest of your app
}
```

### 4. Add to Tab Navigator (Optional)

```typescript
// In StudentTabNavigator.tsx
<Tab.Screen
  name="Goals"
  component={GoalsScreen}
  options={{
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="target" size={24} color={color} />
    ),
  }}
/>
```

## Usage Examples

### Navigating to Gamification Screen

```typescript
// From student view
navigation.navigate('Gamification');

// From parent view (for specific child)
navigation.navigate('Gamification', { studentId: selectedChild.id });
```

### Navigating to Goals Screen

```typescript
// From student view
navigation.navigate('Goals');

// From parent view (for specific child)
navigation.navigate('Goals', { studentId: selectedChild.id });
```

### Using Goal Notifications Hook

```typescript
import { useGoalNotifications } from '@hooks';

function MyComponent() {
  useGoalNotifications();
  
  return (
    // Your component JSX
  );
}
```

### Manual Goal Sharing

```typescript
import { Share } from 'react-native';
import { goalsApi } from '@api/goals';

const shareGoal = async (goal: Goal) => {
  const message = `🎯 My Goal: ${goal.title}\n\n${goal.description}\n\nProgress: ${goal.progress}%`;
  
  await Share.share({
    message,
    title: 'Share Goal',
  });
};
```

## Customization

### Theming

All screens use the app's global theme constants from `@constants`:
- `COLORS` - Color palette
- `SPACING` - Spacing values
- `FONT_SIZES` - Typography sizes
- `BORDER_RADIUS` - Border radius values

To customize, update these constants in `/mobile/src/constants/index.ts`.

### Animations

The Gamification screen uses React Native Reanimated for smooth animations:
- Badge unlock animations
- Leaderboard row animations
- Progress bar transitions
- Achievement popups

Adjust animation parameters in the component for different effects.

### Notifications

Customize notification schedules in `/mobile/src/services/goalNotificationService.ts`:

```typescript
// Change weekly digest time
trigger: {
  weekday: 2, // Monday
  hour: 9,    // 9 AM
  minute: 0,
  repeats: true,
}

// Adjust reminder days
if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
  // Schedule reminder
}
```

## Dependencies

All required dependencies are already included in the project:
- `react-native-reanimated` - Animations
- `react-native-confetti-cannon` - Celebration effects
- `react-native-vector-icons` - Icons
- `date-fns` - Date manipulation
- `expo-notifications` - Push notifications

## Testing

### Test Gamification Features

1. Navigate to Gamification screen
2. Verify points display and level progression
3. Test badge grid with locked/unlocked states
4. Switch leaderboard timeframes
5. Check streak calendar for current month
6. Test badge detail modal

### Test Goals Features

1. Create a new goal with SMART framework
2. Add milestones to the goal
3. Update goal progress (test optimistic UI)
4. Complete a milestone
5. Share a goal using native share
6. Complete a goal (verify confetti animation)
7. Test parent view (read-only access)

### Test Notifications

1. Schedule weekly digest
2. Create goals with upcoming deadlines
3. Verify reminder notifications
4. Complete a goal/milestone (check instant notification)

## Troubleshooting

### Animations Not Working
- Ensure `react-native-reanimated` is properly configured in `babel.config.js`
- Add: `plugins: ['react-native-reanimated/plugin']`

### Notifications Not Showing
- Check permissions are granted
- Verify device is not in Do Not Disturb mode
- Test on physical device (notifications don't work on simulator)

### API Errors
- Verify backend endpoints are implemented
- Check authentication token is valid
- Review API response formats match TypeScript interfaces

### Parent View Not Loading
- Ensure `studentId` is passed correctly
- Verify parent has permission to view child's data
- Check API endpoints support the `studentId` parameter

## Performance Considerations

1. **Lazy Loading**: Large badge grids use windowing for better performance
2. **Memoization**: Heavy computations are memoized
3. **Optimistic Updates**: UI updates instantly while API calls happen in background
4. **Image Caching**: Badge icons are cached automatically
5. **Debouncing**: Progress updates are debounced to prevent excessive API calls

## Security

- All API calls require authentication
- Parent access is restricted to their children only
- Goal sharing uses native share (no data exposure)
- Sensitive data is not logged in production

## Future Enhancements

Potential additions to consider:
- Badge collection showcase
- Goal templates library
- Team goals and collaboration
- Goal categories with custom icons
- Advanced analytics and insights
- Gamification leaderboard filters (by class, grade)
- Custom reward types
- Goal import/export functionality
