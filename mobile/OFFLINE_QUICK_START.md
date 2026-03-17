# Offline-First Architecture - Quick Start Guide

## Installation

Run the following command to install required dependencies:

```bash
npm install
```

The required packages are already added to `package.json`:

- `@react-native-community/netinfo`
- `expo-background-fetch`
- `expo-task-manager`
- `redux-persist`

## Initialization

Offline support is automatically initialized in `app/_layout.tsx`. No additional setup required!

## Basic Usage

### 1. Show Offline Indicator

Add to any screen to show connection status and pending operations:

```typescript
import { OfflineIndicator } from '@components';

<OfflineIndicator onSyncPress={() => console.log('Sync requested')} />
```

### 2. Display Cached Data Timestamp

Show users when data was last synced:

```typescript
import { CachedDataBadge } from '@components';
import { useAppSelector } from '@store/hooks';

const { dashboardLastSync } = useAppSelector(state => state.studentData);
const isOnline = useAppSelector(state => state.offline.isOnline);

<CachedDataBadge lastSyncTime={dashboardLastSync} isOnline={isOnline} />
```

### 3. Manual Sync Button

Add a sync button for manual data refresh:

```typescript
import { SyncButton } from '@components';

<SyncButton
  variant="button"
  onSyncComplete={(success) => {
    if (success) {
      console.log('Sync successful!');
    }
  }}
/>
```

### 4. Monitor Network Status

Use the hook to get real-time network information:

```typescript
import { useNetworkStatus } from '@hooks';

const { isConnected, isInternetReachable, type } = useNetworkStatus();

console.log(`Connected: ${isConnected}, Type: ${type}`);
```

### 5. Optimistic Updates

Submit data with immediate UI feedback:

```typescript
import { useOptimisticUpdate } from '@hooks';

const MyComponent = () => {
  const { submitAssignment, isOnline } = useOptimisticUpdate();

  const handleSubmit = async (assignmentId: number, data: any) => {
    try {
      await submitAssignment(assignmentId, data);
      // UI already shows as submitted!
      Alert.alert('Success', isOnline ? 'Submitted!' : 'Queued for sync');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assignment');
    }
  };

  return (
    <Button onPress={() => handleSubmit(1, submissionData)} title="Submit" />
  );
};
```

### 6. Check Queue Status

Display pending operations:

```typescript
import { OfflineQueueStatus } from '@components';

<OfflineQueueStatus showDetails={true} />
```

### 7. Access Cached Data

Retrieve cached data from Redux:

```typescript
import { useAppSelector } from '@store/hooks';

const MyScreen = () => {
  const {
    profile,
    profileLastSync,
    assignments,
    assignmentsLastSync
  } = useAppSelector(state => state.studentData);

  return (
    <View>
      <Text>Profile: {profile?.firstName}</Text>
      <CachedDataBadge lastSyncTime={profileLastSync} />
    </View>
  );
};
```

### 8. Fetch Fresh Data

Update cached data when online:

```typescript
import { useAppDispatch } from '@store/hooks';
import { fetchDashboard, fetchAssignments } from '@store/slices/studentDataSlice';

const MyScreen = () => {
  const dispatch = useAppDispatch();

  const refreshData = async () => {
    await Promise.all([
      dispatch(fetchDashboard()),
      dispatch(fetchAssignments()),
    ]);
  };

  return (
    <Button onPress={refreshData} title="Refresh" />
  );
};
```

## Common Patterns

### Screen with Offline Support

```typescript
import { ScreenLayout, CachedDataBadge } from '@components';
import { useAppSelector } from '@store/hooks';

export const MyScreen = () => {
  const { data, dataLastSync } = useAppSelector(state => state.studentData);
  const isOnline = useAppSelector(state => state.offline.isOnline);

  return (
    <ScreenLayout showOfflineIndicator={true}>
      <View>
        <CachedDataBadge lastSyncTime={dataLastSync} isOnline={isOnline} />
        {/* Your content */}
      </View>
    </ScreenLayout>
  );
};
```

### Form with Offline Queue

```typescript
import { useOptimisticUpdate } from '@hooks';
import { Alert } from 'react-native';

const MyFormScreen = () => {
  const { updateProfile, isOnline } = useOptimisticUpdate();
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    try {
      await updateProfile(formData);
      Alert.alert(
        'Success',
        isOnline ? 'Profile updated!' : 'Saved offline. Will sync when online.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View>
      {/* Form fields */}
      <Button onPress={handleSubmit} title="Save" />
    </View>
  );
};
```

### Auto-Refresh Wrapper

```typescript
import { OfflineDataRefresher } from '@components';

// Wrap your screen or app section
<OfflineDataRefresher autoRefresh={true} refreshIntervalMinutes={15}>
  <YourScreen />
</OfflineDataRefresher>
```

## Testing Offline Functionality

### 1. Simulate Offline Mode

- Turn on Airplane Mode on your device/emulator
- Observe offline indicator appears
- Submit a form - should be queued

### 2. Verify Queue

- Check offline queue status component
- Should show pending operations

### 3. Test Sync

- Turn off Airplane Mode
- Wait for automatic sync (or trigger manual sync)
- Verify operations complete successfully

### 4. Check Cached Data

- Go offline
- Navigate through app
- Verify cached data is displayed with timestamps

## Configuration Options

### Sync Intervals

Edit `mobile/src/utils/backgroundSync.ts`:

```typescript
minimumInterval: 15 * 60, // 15 minutes (in seconds)
```

### Data Refresh Threshold

Edit `mobile/src/utils/optimisticUpdates.ts`:

```typescript
export const shouldRefreshData = (
  lastSyncTime: number | null,
  maxAgeMinutes: number = 15 // Change this value
): boolean => {
  // ...
};
```

### Retry Configuration

Edit `mobile/src/utils/offlineQueue.ts`:

```typescript
const MAX_RETRIES = 3; // Change retry count
```

## Troubleshooting

### Queue Not Syncing

1. Check network connection: `useNetworkStatus()`
2. Verify auto-sync enabled in Redux state
3. Check console for error logs

### Background Sync Not Working

1. Verify permissions in app.json
2. Check background fetch is registered
3. Test on physical device (may not work in simulator)

### Data Not Persisting

1. Clear app data and reinstall
2. Check Redux DevTools for state
3. Verify AsyncStorage permissions

## Best Practices

1. ✅ Always show offline indicator in main screens
2. ✅ Display cached data timestamps
3. ✅ Use optimistic updates for better UX
4. ✅ Provide manual sync option
5. ✅ Handle errors gracefully
6. ✅ Test thoroughly in offline mode
7. ✅ Clear queue on logout for privacy

## Next Steps

- Read full documentation: `OFFLINE_ARCHITECTURE.md`
- Check example screen: `src/screens/OfflineSettingsScreen.tsx`
- Explore all components in `src/components/`
- Review Redux slices in `src/store/slices/`

## Support

For issues or questions:

1. Check `OFFLINE_ARCHITECTURE.md` for detailed docs
2. Review example implementations
3. Check console logs for errors
