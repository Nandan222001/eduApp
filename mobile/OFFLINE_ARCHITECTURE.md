# Offline-First Architecture Documentation

## Overview

This mobile app implements a comprehensive offline-first architecture using Redux Persist and background sync. The system ensures that users can continue using the app even when offline, with automatic synchronization when connectivity is restored.

## Key Features

### 1. Redux Persist Configuration
- **Cached Data**: Authentication state, student profile, dashboard data, assignments, grades, and attendance
- **Storage**: AsyncStorage for persistent data
- **Selective Persistence**: Only critical data is persisted to optimize performance

### 2. Offline Queue Manager
- **Location**: `src/utils/offlineQueue.ts`
- **Purpose**: Stores failed API requests when device is offline
- **Supported Operations**:
  - Assignment submissions
  - Attendance check-ins
  - Profile updates
- **Features**:
  - Automatic retry mechanism (default: 3 retries)
  - Queue persistence across app restarts
  - Real-time queue updates via subscription model
  - Manual sync trigger

### 3. Network Detection
- **Package**: `@react-native-community/netinfo`
- **Hook**: `useNetworkStatus()`
- **Capabilities**:
  - Real-time connectivity monitoring
  - Internet reachability detection
  - Connection type identification
  - Redux state integration

### 4. Background Sync Service
- **Package**: `expo-background-fetch` and `expo-task-manager`
- **Location**: `src/utils/backgroundSync.ts`
- **Features**:
  - Automatic sync every 15 minutes (when online)
  - Persists across app termination
  - Starts on device boot
  - Manual sync trigger support

### 5. Optimistic UI Updates
- **Location**: `src/utils/optimisticUpdates.ts`
- **Hook**: `useOptimisticUpdate()`
- **Benefits**:
  - Immediate UI feedback
  - Rollback on failure
  - Better perceived performance
  - Seamless offline experience

## Architecture Components

### Redux Slices

#### Student Data Slice (`studentDataSlice.ts`)
```typescript
interface StudentDataState {
  profile: Profile | null;
  profileLastSync: number | null;
  dashboard: DashboardData | null;
  dashboardLastSync: number | null;
  assignments: Assignment[];
  assignmentsLastSync: number | null;
  grades: Grade[];
  gradesLastSync: number | null;
  attendance: AttendanceSummary | null;
  attendanceLastSync: number | null;
}
```

#### Offline Slice (`offlineSlice.ts`)
```typescript
interface OfflineState {
  isOnline: boolean;
  queuedOperations: QueuedOperation[];
  lastSyncTime: number | null;
  syncInProgress: boolean;
  autoSyncEnabled: boolean;
}
```

### UI Components

1. **OfflineIndicator**: Displays offline status and pending operations count
2. **CachedDataBadge**: Shows timestamp of last data sync
3. **SyncButton**: Manual sync trigger
4. **OfflineQueueStatus**: Detailed view of queued operations
5. **OfflineDataRefresher**: Auto-refresh wrapper component

### Hooks

1. **useNetworkStatus()**: Monitor network connectivity
2. **useOfflineQueue()**: Access offline queue state
3. **useOptimisticUpdate()**: Perform optimistic updates

## Usage Examples

### Initialize Offline Support

```typescript
import { initializeOfflineSupport } from '@utils/offlineInit';

// In App.tsx or main entry point
useEffect(() => {
  initializeOfflineSupport();
}, []);
```

### Use Offline Indicator

```typescript
import { OfflineIndicator } from '@components';

<OfflineIndicator onSyncPress={() => console.log('Sync pressed')} />
```

### Submit Assignment with Optimistic Update

```typescript
import { useOptimisticUpdate } from '@hooks';

const MyComponent = () => {
  const { submitAssignment, isOnline } = useOptimisticUpdate();

  const handleSubmit = async () => {
    try {
      await submitAssignment(assignmentId, submissionData);
      // UI already updated optimistically
    } catch (error) {
      // Error handling - UI rolled back automatically if online
      // Queued for retry if offline
    }
  };
};
```

### Display Cached Data Age

```typescript
import { CachedDataBadge } from '@components';
import { useAppSelector } from '@store/hooks';

const MyScreen = () => {
  const { dashboardLastSync } = useAppSelector(state => state.studentData);
  const isOnline = useAppSelector(state => state.offline.isOnline);

  return (
    <View>
      <CachedDataBadge lastSyncTime={dashboardLastSync} isOnline={isOnline} />
    </View>
  );
};
```

### Manual Sync

```typescript
import { SyncButton } from '@components';

<SyncButton 
  variant="button" 
  onSyncComplete={(success) => {
    console.log('Sync completed:', success);
  }} 
/>
```

### Auto-Refresh Data

```typescript
import { OfflineDataRefresher } from '@components';

<OfflineDataRefresher autoRefresh={true} refreshIntervalMinutes={15}>
  <YourScreen />
</OfflineDataRefresher>
```

### Check if Data Should Refresh

```typescript
import { shouldRefreshData } from '@utils/optimisticUpdates';
import { useAppSelector } from '@store/hooks';

const { dashboardLastSync } = useAppSelector(state => state.studentData);

if (shouldRefreshData(dashboardLastSync, 15)) {
  // Fetch fresh data
  dispatch(fetchDashboard());
}
```

## Offline Queue Operations

### Add to Queue

```typescript
import { offlineQueueManager, QueuedOperationType } from '@utils/offlineQueue';

await offlineQueueManager.addToQueue(
  QueuedOperationType.ASSIGNMENT_SUBMISSION,
  submissionData
);
```

### Manual Sync

```typescript
const result = await offlineQueueManager.manualSync();
console.log(`Synced: ${result.syncedCount}, Failed: ${result.failedCount}`);
```

### Subscribe to Queue Changes

```typescript
const unsubscribe = offlineQueueManager.subscribe((queue) => {
  console.log('Queue updated:', queue.length);
});

// Cleanup
unsubscribe();
```

## Data Persistence Strategy

### Persisted Data
- Authentication tokens and user data
- Student profile
- Dashboard data
- Assignments list
- Grades history
- Attendance summary
- Offline queue operations
- Last sync timestamps

### Not Persisted
- UI state (notifications)
- Temporary user preferences
- Navigation state

## Background Sync Configuration

### Registration
```typescript
import { BackgroundSyncService } from '@utils/backgroundSync';

await BackgroundSyncService.register();
```

### Manual Trigger
```typescript
await BackgroundSyncService.triggerManualSync();
```

### Check Registration Status
```typescript
const isRegistered = await BackgroundSyncService.isTaskRegistered();
```

## Best Practices

1. **Always use optimistic updates** for better UX
2. **Display cached data age** to inform users
3. **Show offline indicator** when connection is lost
4. **Enable auto-sync** by default
5. **Provide manual sync option** for user control
6. **Handle sync failures gracefully**
7. **Clear sensitive data** on logout
8. **Monitor queue size** to prevent excessive growth

## Performance Considerations

- Redux Persist uses AsyncStorage (async, non-blocking)
- Offline queue is lazily loaded on app start
- Background sync runs at 15-minute intervals minimum
- Data freshness threshold: 15 minutes (configurable)
- Automatic data refresh when app comes to foreground

## Error Handling

### Offline Queue Errors
- Failed operations are retried automatically
- After max retries (3), operations are removed from queue
- Error details are logged for debugging

### Network Errors
- Network status changes trigger automatic sync
- Failed API calls are queued when offline
- Users are notified of sync failures

## Testing Offline Functionality

1. Toggle device airplane mode
2. Use network throttling in development
3. Monitor Redux DevTools for state changes
4. Check AsyncStorage for persisted data
5. Verify background sync registration

## Configuration

### Storage Keys
```typescript
export const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@edu_offline_queue',
  LAST_SYNC_TIME: '@edu_last_sync_time',
  // ... other keys
};
```

### Sync Intervals
- Background sync: 15 minutes
- Auto-refresh: 15 minutes (configurable)
- Retry delay: Exponential backoff

## Dependencies

```json
{
  "@react-native-async-storage/async-storage": "1.21.0",
  "@react-native-community/netinfo": "^11.1.0",
  "expo-background-fetch": "~11.8.0",
  "expo-task-manager": "~11.7.0",
  "redux-persist": "^6.0.0"
}
```

## Installation

```bash
npm install @react-native-community/netinfo expo-background-fetch expo-task-manager
```

## Troubleshooting

### Background Sync Not Working
- Verify background fetch permissions
- Check if task is registered: `BackgroundSyncService.isTaskRegistered()`
- Ensure device allows background app refresh

### Queue Not Syncing
- Check network connectivity
- Verify auto-sync is enabled
- Check for API errors in console

### Data Not Persisting
- Verify Redux Persist configuration
- Check AsyncStorage permissions
- Clear app data and reinstall if corrupted
