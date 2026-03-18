# Gamification and Goals - Quick Start Guide

## 5-Minute Integration

Follow these steps to quickly integrate the Gamification and Goals screens into your app.

## Step 1: Add Routes to Navigation (2 minutes)

In your main stack navigator (e.g., `MainNavigator.tsx`):

```typescript
import { GamificationScreenWrapper, GoalsScreenWrapper } from '@screens/shared';

// Add inside your Stack.Navigator
<Stack.Screen
  name="Gamification"
  component={GamificationScreenWrapper}
  options={{ 
    title: 'Gamification',
    headerShown: true 
  }}
/>

<Stack.Screen
  name="Goals"
  component={GoalsScreenWrapper}
  options={{ 
    title: 'My Goals',
    headerShown: true 
  }}
/>
```

## Step 2: Add Navigation Links (2 minutes)

### For Student Dashboard

```typescript
import { useNavigation } from '@react-navigation/native';

// In your component
const navigation = useNavigation();

// Add buttons or cards
<TouchableOpacity onPress={() => navigation.navigate('Gamification')}>
  <Text>View Gamification</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('Goals')}>
  <Text>My Goals</Text>
</TouchableOpacity>
```

### For Parent Dashboard

```typescript
// Assuming you have a selected child
<TouchableOpacity 
  onPress={() => navigation.navigate('Gamification', { studentId: child.id })}
>
  <Text>View Child's Achievements</Text>
</TouchableOpacity>

<TouchableOpacity 
  onPress={() => navigation.navigate('Goals', { studentId: child.id })}
>
  <Text>View Child's Goals</Text>
</TouchableOpacity>
```

## Step 3: Initialize Notifications (1 minute)

In your `App.tsx` or main component:

```typescript
import { useGoalNotifications } from '@hooks';

function App() {
  // Initialize goal notifications
  useGoalNotifications();
  
  return (
    // Your app components
  );
}
```

## Done! 🎉

Your app now has:
- ✅ Full gamification features
- ✅ Complete goals management
- ✅ Automatic notifications
- ✅ Parent and student views

## Next Steps

### Optional: Add Dashboard Widgets

Copy widget examples from `GAMIFICATION_GOALS_EXAMPLES.tsx`:

```typescript
import { GamificationWidget, GoalsWidget } from './examples';

// Add to your dashboard
<GamificationWidget />
<GoalsWidget />
```

### Optional: Add to Tab Navigator

```typescript
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

## Testing Your Integration

1. **Test Gamification Screen:**
   - Navigate to Gamification
   - Verify points display
   - Check badge grid
   - Try different leaderboard timeframes

2. **Test Goals Screen:**
   - Create a new goal
   - Add milestones
   - Complete a milestone
   - Share a goal

3. **Test Notifications:**
   - Create a goal with a near deadline
   - Wait for notification (or test with closer date)

## Troubleshooting

**Screen not showing?**
- Check navigation routes are added correctly
- Verify screen names match exactly

**API errors?**
- Ensure backend endpoints are implemented
- Check authentication token

**No notifications?**
- Verify permissions are granted
- Test on physical device

## Need Help?

Refer to detailed documentation:
- `GAMIFICATION_GOALS_INTEGRATION.md` - Complete guide
- `GAMIFICATION_GOALS_EXAMPLES.tsx` - Code examples
- `GAMIFICATION_GOALS_API_CONTRACT.md` - API documentation

## Quick Reference

### Navigate to Gamification
```typescript
navigation.navigate('Gamification');
// or for parent
navigation.navigate('Gamification', { studentId: childId });
```

### Navigate to Goals
```typescript
navigation.navigate('Goals');
// or for parent
navigation.navigate('Goals', { studentId: childId });
```

### Access APIs Directly
```typescript
import { gamificationApi, goalsApi } from '@api';

// Get points
const points = await gamificationApi.getPoints();

// Get goals
const goals = await goalsApi.getGoals('active');
```

That's it! You're all set up. 🚀
