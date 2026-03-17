# Offline-First Architecture Implementation

This document describes the offline-first architecture implemented in the mobile app.

## Overview

The mobile app now supports full offline functionality with automatic synchronization when connectivity is restored. Data is persisted locally and API requests are queued when offline.

## Key Features

### 1. Redux Persist Integration

All critical application state is automatically persisted to AsyncStorage:

- **Auth State**: User authentication tokens and session data
- **Profile State**: User profile information
- **Dashboard State**: Student statistics and attendance data
- **Assignments State**: Assignment list and submission status
- **Grades State**: Grade history and academic performance

**Configuration**: `mobile/src/store/index.ts`

```typescript
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'profile', 'dashboard', 'assignments', 'grades'],
};
```

### 2. Offline Queue Manager

**Location**: `mobile/src/utils/offlineQueue.ts`

Automatically queues failed API requests when the device is offline:

- Stores failed POST, PUT, PATCH, and DELETE requests
- Automatically retries when connection is restored
- Configurable retry limits (default: 3 attempts)
- Persists queue to AsyncStorage for reliability
- Provides subscription API for UI updates

**Usage**:
```typescript
import { offlineQueueManager } from '../utils/offlineQueue';

// Add to queue
await offlineQueueManager.addToQueue({
  url: '/api/v1/student/assignments',
  method: 'POST',
  data: submissionData,
});

// Process queue manually
await offlineQueueManager.processQueue();
```

### 3. Network Status Manager

**Location**: `mobile/src/utils/networkStatus.ts`

Tracks device connectivity status using @react-native-community/netinfo:

- Real-time connection monitoring
- Subscription-based updates
- Automatic queue processing on reconnection

### 4. Background Sync Service

**Location**: `mobile/src/utils/backgroundSync.ts`

Uses expo-background-fetch to sync data in the background:

- Runs every 15 minutes when app is in background
- Processes offline queue automatically
- Tracks last sync timestamp
- Manual sync trigger available

**Registration**: Automatically registered in `App.tsx`

```typescript
useEffect(() => {
  backgroundSyncService.register();
  return () => {
    backgroundSyncService.unregister();
  };
}, []);
```

### 5. UI Components

#### OfflineIndicator
**Location**: `mobile/src/components/OfflineIndicator.tsx`

Shows when device is offline and displays pending request count:
- Red banner at top of screen
- Shows queue count
- Automatically hides when online with no pending requests

#### CachedDataBanner
**Location**: `mobile/src/components/CachedDataBanner.tsx`

Displays cache information and sync controls:
- Shows last updated timestamp
- Manual "Sync Now" button
- Different styling for offline vs online mode
- Accepts `lastUpdated` prop and `onRefresh` callback

#### SyncStatus
**Location**: `mobile/src/components/SyncStatus.tsx`

Comprehensive sync status modal:
- View all queued requests
- Manual sync trigger
- Clear queue option
- Detailed request information (method, URL, retry count)

### 6. Custom Hook

**Location**: `mobile/src/store/hooks.ts`

```typescript
const {
  queue,
  queueCount,
  isConnected,
  addToQueue,
  processQueue,
  clearQueue,
  removeFromQueue,
} = useOfflineQueue();
```

## Screen Integration

### Dashboard Screen
**Location**: `mobile/src/screens/DashboardScreen.tsx`

- Displays cached statistics and attendance
- Shows offline indicator when disconnected
- Manual refresh with cached data banner
- Pull-to-refresh support

### Assignments Screen
**Location**: `mobile/src/screens/AssignmentsScreen.tsx`

- Lists all assignments with status
- Offline submission queuing
- Visual status indicators
- Cached data with timestamp

### Grades Screen
**Location**: `mobile/src/screens/GradesScreen.tsx`

- Displays grade history
- Calculates average from cached data
- Color-coded performance indicators
- Offline-first data access

### Profile Screen
**Location**: `mobile/src/screens/ProfileScreen.tsx`

- Shows user profile information
- Cached profile data
- Settings access
- Manual refresh capability

## API Client Integration

**Location**: `mobile/src/api/client.ts`

The API client automatically handles offline scenarios:

1. Intercepts failed requests due to network errors
2. Queues mutation requests (POST, PUT, PATCH, DELETE)
3. Skips queuing for read operations (GET)
4. Maintains token refresh logic
5. Retries with fresh tokens on 401 errors

## Data Flow

### Online Mode
1. User action triggers API call
2. Request sent to server
3. Response received and stored in Redux
4. Redux Persist saves to AsyncStorage
5. UI updates with fresh data

### Offline Mode
1. User action triggers API call
2. Request fails due to no network
3. Mutation requests added to offline queue
4. Queue persisted to AsyncStorage
5. UI shows offline indicator
6. User sees cached data from Redux Persist

### Reconnection
1. Network connection restored
2. Background sync service triggers
3. Offline queue processes automatically
4. Successful requests removed from queue
5. Failed requests retry up to max attempts
6. UI updates with synced data

## Installation

Required dependencies (already added to package.json):

```json
{
  "@react-native-async-storage/async-storage": "^1.21.0",
  "@react-native-community/netinfo": "^11.2.1",
  "expo-background-fetch": "~12.0.1",
  "redux-persist": "^6.0.0"
}
```

Install dependencies:
```bash
npm install
# or
yarn install
```

## Configuration

### Redux Store Setup

The store is configured with Redux Persist in `mobile/src/store/index.ts`:
- Uses AsyncStorage as storage engine
- Whitelists specific reducers for persistence
- Integrates with React Native app via PersistGate

### Background Fetch Configuration

Background sync is configured with:
- **Minimum Interval**: 15 minutes
- **Stop on Terminate**: false (continues after app close)
- **Start on Boot**: true (starts on device restart)

Modify settings in `mobile/src/utils/backgroundSync.ts`:
```typescript
await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
  minimumInterval: 15 * 60, // 15 minutes
  stopOnTerminate: false,
  startOnBoot: true,
});
```

## Testing Offline Functionality

### Manual Testing
1. Enable airplane mode on device/simulator
2. Perform actions (submit assignments, update profile)
3. Observe offline indicator and queue count
4. Disable airplane mode
5. Verify automatic sync occurs
6. Check that UI updates with server response

### Using Dev Tools
1. Use Chrome DevTools Network tab
2. Toggle "Offline" mode
3. Test app behavior
4. Monitor console logs for queue operations

## Best Practices

1. **Always handle loading states**: Show cached data while fetching fresh data
2. **Provide visual feedback**: Use OfflineIndicator and CachedDataBanner
3. **Implement pull-to-refresh**: Allow users to manually trigger sync
4. **Handle conflicts gracefully**: Implement conflict resolution for simultaneous edits
5. **Limit queue size**: Consider implementing max queue size to prevent storage issues
6. **Test edge cases**: Test with intermittent connectivity and slow networks

## Troubleshooting

### Queue Not Processing
- Check network connection
- Verify background fetch is registered
- Check console logs for errors
- Manually trigger sync from SyncStatus modal

### Data Not Persisting
- Verify AsyncStorage permissions
- Check Redux Persist whitelist
- Clear app data and test fresh install
- Check for serialization errors

### Background Sync Not Running
- Verify expo-background-fetch is installed
- Check device background app refresh settings
- Test on physical device (simulators may behave differently)
- Review TaskManager logs

## Future Enhancements

1. **Conflict Resolution**: Implement server-side conflict detection and resolution
2. **Selective Sync**: Allow users to choose what data to sync
3. **Compression**: Compress cached data to reduce storage usage
4. **Delta Sync**: Only sync changed data instead of full datasets
5. **Optimistic Updates**: Show UI updates immediately before server confirmation
6. **Queue Prioritization**: Priority levels for different request types
7. **Bandwidth Detection**: Adjust sync behavior based on connection quality
