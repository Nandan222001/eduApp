# Gamification UI Components

This document describes the gamification UI components implemented for the educational platform.

## Components Overview

### 1. PointsHistoryPage

**Location:** `src/components/gamification/PointsHistoryPage.tsx`

An activity feed displaying the user's points history with visual indicators for different event types.

**Features:**

- Chronological list of all point-earning activities
- Color-coded event type indicators
- Point amounts with positive/negative indicators
- Timestamp and relative time display
- Activity descriptions with context
- Icon-based event categorization

**Usage:**

```tsx
<PointsHistoryPage userId={userId} institutionId={institutionId} />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID

---

### 2. BadgesShowcase

**Location:** `src/components/gamification/BadgesShowcase.tsx`

A grid display of all badges with unlock animations and rarity indicators.

**Features:**

- Grid layout of all available badges
- Unlock animations for newly earned badges
- Rarity-based color coding (Common, Rare, Epic, Legendary)
- Shimmer effect for unlocked badges
- Lock icon for locked badges
- Badge progress counter
- Tooltips with earn dates
- Hover effects and animations

**Usage:**

```tsx
<BadgesShowcase userId={userId} institutionId={institutionId} />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID

**Rarity Colors:**

- Common: Gray (#9e9e9e)
- Rare: Blue (#2196f3)
- Epic: Purple (#9c27b0)
- Legendary: Gold (#ffd700)

---

### 3. LeaderboardTable

**Location:** `src/components/gamification/LeaderboardTable.tsx`

Interactive leaderboard table with filtering options and rank change indicators.

**Features:**

- Tabbed interface for time periods (All Time, Monthly, Weekly, Daily)
- Filter by leaderboard type (Global, Grade, Section, Subject)
- Rank change indicators (up, down, same)
- Top 3 ranks with special styling (gold, silver, bronze)
- Current user highlighting
- Refresh functionality
- Avatar display for users
- Points display with trophy icon
- Responsive table design

**Usage:**

```tsx
<LeaderboardTable userId={userId} institutionId={institutionId} />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID

---

### 4. AchievementNotificationToast

**Location:** `src/components/gamification/AchievementNotificationToast.tsx`

Animated toast notification for achievements, badges, and level-ups.

**Features:**

- Slide-in animation from top-right
- Auto-dismiss after 5 seconds
- Custom icons based on notification type
- Celebration animation on display
- Pulse animation for icon
- Points earned display
- Color-coded by notification type
- Glassmorphism design effect

**Usage:**

```tsx
<AchievementNotificationToast open={open} notification={notification} onClose={handleClose} />
```

**Props:**

- `open: boolean` - Controls visibility
- `notification: AchievementNotification | null` - Notification data
- `onClose: () => void` - Close handler

**Notification Types:**

- `badge` - Badge earned (warning color)
- `achievement` - Achievement unlocked (success color)
- `level_up` - Level increased (info color)
- `streak` - Streak milestone (error/fire color)

---

### 5. StreakTracker

**Location:** `src/components/gamification/StreakTracker.tsx`

Visual streak tracker with fire emoji, calendar visualization, and progress indicators.

**Features:**

- Current streak display with fire emoji 🔥
- Longest streak record
- Progress to next milestone
- Monthly calendar visualization
- Active days highlighted
- Streak breakdown by type
- Milestone progress bar
- Responsive grid layout
- Interactive day cells with tooltips

**Usage:**

```tsx
<StreakTracker userId={userId} institutionId={institutionId} />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID

**Milestones:**

- 7 days (1 week)
- 14 days (2 weeks)
- 30 days (1 month)
- 60 days (2 months)
- 90 days (3 months)
- 180 days (6 months)
- 365 days (1 year)

---

### 6. RewardsRedemption

**Location:** `src/components/gamification/RewardsRedemption.tsx`

Rewards shop interface for redeeming points.

**Features:**

- Tabbed interface (Available Rewards, My Redemptions)
- Available points display
- Rewards categorized by type
- Visual reward cards with images
- Points cost display
- Stock quantity indicators
- Redemption confirmation dialog
- Redemption history with status tracking
- Status indicators (Pending, Approved, Delivered, Rejected)
- "Not enough points" / "Out of stock" handling

**Usage:**

```tsx
<RewardsRedemption userId={userId} institutionId={institutionId} />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID

**Status Colors:**

- Pending: Warning (orange)
- Approved: Success (green)
- Delivered: Info (blue)
- Rejected: Error (red)

---

### 7. ProgressIndicator

**Location:** `src/components/gamification/ProgressIndicator.tsx`

Progress display showing level, points, and next level requirements.

**Features:**

- Current level display
- Total points counter
- Current streak indicator
- Badges count
- Progress bar to next level
- Level progress percentage
- Global rank display
- Compact and full modes
- Gradient styling
- Quick stats grid
- Achievements count

**Usage:**

```tsx
// Full mode
<ProgressIndicator userId={userId} institutionId={institutionId} />

// Compact mode
<ProgressIndicator userId={userId} institutionId={institutionId} compact />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID
- `compact?: boolean` - Enable compact display mode

---

### 8. GamificationWidget

**Location:** `src/components/gamification/GamificationWidget.tsx`

Compact widget for displaying gamification stats in dashboards.

**Features:**

- Level and points display
- Progress bar to next level
- Streak and badges count
- Recent badges preview
- Rank display
- Quick action buttons
- Link to full gamification dashboard
- Compact card layout

**Usage:**

```tsx
<GamificationWidget userId={userId} institutionId={institutionId} />
```

**Props:**

- `userId: number` - The user's ID
- `institutionId: number` - The institution ID

---

### 9. GamificationDashboard

**Location:** `src/pages/GamificationDashboard.tsx`

Main dashboard page integrating all gamification components.

**Features:**

- Tabbed interface for all sections
- Progress indicator overview
- Quick action sidebar
- Navigation between sections
- Responsive layout
- Global notification handling
- Auto-refresh for new achievements

**Usage:**

```tsx
<Route path="/gamification" element={<GamificationDashboard />} />
```

**Sections:**

1. Points History
2. Badges
3. Leaderboard
4. Streaks
5. Rewards

---

### 10. GamificationNotificationProvider

**Location:** `src/components/gamification/GamificationNotificationProvider.tsx`

Context provider for handling gamification notifications globally.

**Features:**

- Global notification state management
- Notification queue handling
- Auto-dismiss functionality
- Event-based notification triggering

**Usage:**

```tsx
// Wrap your app
<GamificationNotificationProvider>
  <App />
</GamificationNotificationProvider>;

// Trigger notification anywhere
import { triggerGamificationNotification } from '../hooks/useGamificationNotifications';

triggerGamificationNotification({
  id: '1',
  type: 'badge',
  title: 'New Badge Earned!',
  message: 'You earned the "Perfect Attendance" badge',
  icon: 'badge_url',
  points: 100,
  timestamp: new Date(),
});
```

---

## Hooks

### useGamificationNotifications

**Location:** `src/hooks/useGamificationNotifications.ts`

Custom hook for managing gamification notifications.

**Returns:**

- `notification: AchievementNotification | null` - Current notification
- `notificationOpen: boolean` - Notification visibility state
- `showNotification: (notification) => void` - Show notification function
- `hideNotification: () => void` - Hide notification function

**Usage:**

```tsx
const { notification, notificationOpen, showNotification, hideNotification } =
  useGamificationNotifications();
```

---

## API Integration

### gamificationAPI

**Location:** `src/api/gamification.ts`

API service for gamification-related endpoints.

**Methods:**

- `getUserPoints(userId, institutionId)` - Get user points
- `getPointHistory(userId, institutionId, limit)` - Get points history
- `getUserBadges(userId, institutionId)` - Get user badges
- `getBadges(institutionId)` - Get all badges
- `getUserAchievements(userId, institutionId)` - Get user achievements
- `getAchievements(institutionId)` - Get all achievements
- `getLeaderboards(institutionId)` - Get leaderboards
- `getLeaderboardWithEntries(leaderboardId)` - Get leaderboard with entries
- `getDynamicLeaderboard(institutionId, filter, userId, limit)` - Get filtered leaderboard
- `getUserStreaks(userId, institutionId)` - Get user streaks
- `recordDailyLogin(userId, institutionId)` - Record daily login
- `getUserStats(userId, institutionId)` - Get user statistics
- `getUserShowcase(userId, institutionId)` - Get user showcase
- `getRewards(institutionId)` - Get available rewards
- `getUserRedemptions(userId, institutionId)` - Get user redemptions
- `redeemReward(userId, rewardId, institutionId)` - Redeem a reward

---

## Types

### Main Types

**Location:** `src/types/gamification.ts`

**Enums:**

- `BadgeType` - Badge categories
- `BadgeRarity` - Badge rarity levels
- `EventType` - Point earning event types
- `AchievementType` - Achievement categories
- `LeaderboardType` - Leaderboard filtering types
- `LeaderboardPeriod` - Time period filters

**Interfaces:**

- `Badge` - Badge definition
- `UserBadge` - Earned badge
- `UserPoints` - User points data
- `PointHistory` - Points transaction record
- `Achievement` - Achievement definition
- `UserAchievement` - User achievement progress
- `Leaderboard` - Leaderboard configuration
- `LeaderboardEntry` - Leaderboard entry
- `StreakTracker` - Streak tracking data
- `UserGamificationStats` - User statistics
- `Reward` - Reward definition
- `UserRedemption` - Reward redemption record
- `AchievementNotification` - Notification data

---

## Styling & Theming

All components use Material-UI theming and follow the application's design system:

**Color Scheme:**

- Primary: Purple gradient (#667eea to #764ba2)
- Success: Green
- Warning: Orange
- Error: Red
- Info: Blue

**Animations:**

- Unlock animation for badges
- Shimmer effect for unlocked items
- Pulse animation for notifications
- Slide-in transitions
- Hover effects

**Responsive Design:**

- Grid-based layouts
- Breakpoints: xs, sm, md, lg, xl
- Mobile-first approach
- Flexible card layouts

---

## Integration Examples

### In Student Dashboard

```tsx
import { GamificationWidget } from '../components/gamification';

// Inside StudentDashboard component
<Grid item xs={12} md={4}>
  <GamificationWidget userId={userId} institutionId={institutionId} />
</Grid>;
```

### Triggering Notifications After Activity

```tsx
import { triggerGamificationNotification } from '../hooks/useGamificationNotifications';

// After assignment submission
const handleSubmit = async () => {
  // Submit assignment...

  triggerGamificationNotification({
    id: Date.now().toString(),
    type: 'achievement',
    title: 'Assignment Submitted!',
    message: 'You earned 10 points for submitting your assignment',
    points: 10,
    timestamp: new Date(),
  });
};
```

### Using Compact Progress Indicator

```tsx
import { ProgressIndicator } from '../components/gamification';

// In header or sidebar
<ProgressIndicator userId={userId} institutionId={institutionId} compact />;
```

---

## Best Practices

1. **Performance**
   - Use loading states for data fetching
   - Implement error boundaries
   - Lazy load heavy components
   - Cache API responses when appropriate

2. **User Experience**
   - Show loading indicators
   - Handle empty states gracefully
   - Provide meaningful error messages
   - Use animations sparingly
   - Ensure mobile responsiveness

3. **Accessibility**
   - Use semantic HTML
   - Provide alt text for icons
   - Ensure keyboard navigation
   - Use appropriate ARIA labels
   - Maintain color contrast ratios

4. **Code Organization**
   - Keep components focused and small
   - Extract reusable logic to hooks
   - Use TypeScript for type safety
   - Follow naming conventions
   - Document complex logic

---

## Future Enhancements

1. **Social Features**
   - Friend comparison
   - Challenge system
   - Social sharing

2. **Advanced Visualizations**
   - Charts for progress over time
   - Heatmaps for activity
   - Comparison graphs

3. **Customization**
   - Theme customization
   - Avatar customization
   - Profile badges display

4. **Gamification+**
   - Team competitions
   - Seasonal events
   - Limited-time challenges
   - Multipliers and bonuses

---

## Troubleshooting

### Common Issues

**1. Notifications not appearing**

- Ensure `GamificationNotificationProvider` wraps the app
- Check browser console for errors
- Verify notification data structure

**2. Data not loading**

- Check API endpoint configuration
- Verify authentication token
- Check network tab for failed requests

**3. Styling issues**

- Ensure Material-UI theme is properly configured
- Check for CSS conflicts
- Verify viewport settings for responsive design

---

## Support

For issues or questions:

1. Check the implementation documentation
2. Review the API documentation
3. Check console for error messages
4. Refer to Material-UI documentation for component-specific issues
