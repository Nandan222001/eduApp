# Offline Functionality Documentation

## Overview

The EduTrack mobile app implements comprehensive offline functionality to ensure students and parents can access educational data and perform actions even without an internet connection. All data is persisted locally and synchronized automatically when the network is restored.

## Architecture

### Components

1. **Redux Persist** - Persists Redux state to AsyncStorage
2. **Offline Queue Manager** - Manages failed API requests for later retry
3. **Background Sync Service** - Processes queued requests in the background
4. **Network Status Manager** - Monitors network connectivity
5. **Offline Init** - Initializes all offline features on app launch

### Data Flow

```
Network Status Change
    ↓
NetInfo Listener
    ↓
Redux State Update (setOnlineStatus)
    ↓
Trigger Queue Processing (if online)
    ↓
Background Sync
    ↓
Update Last Sync Timestamp
```

## Features

### 1. Redux State Persistence

All critical app state is automatically persisted to AsyncStorage:

- **Auth State** - User authentication and session data
- **Student Data** - Profile, dashboard, assignments, grades, attendance
- **Offline State** - Queue operations, network status, sync metadata

**Configuration:**
```typescript
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'studentData', 'offline'],
  blacklist: ['user', 'notification'],
};
```

### 2. Offline Queue Management

Failed API requests are queued and retried automatically when network is restored.

**Supported Request Types:**
- `ASSIGNMENT_SUBMISSION` - Student assignment submissions
- `DOUBT_POST` - Questions posted to discussion forums
- `DOUBT_ANSWER` - Answers to discussion questions
- `ATTENDANCE_MARKING` - Attendance records
- `PROFILE_UPDATE` - User profile changes
- `SETTINGS_UPDATE` - App settings changes

**Usage:**
```typescript
import { offlineQueueManager } from '@utils/offlineQueue';

// Queue a request
const requestId = await offlineQueueManager.addRequest(
  QueuedRequestType.ASSIGNMENT_SUBMISSION,
  '/api/assignments/123/submit',
  'POST',
  { content: 'My submission' },
  { 'Authorization': 'Bearer token' },
  { studentId: 456 }
);

// Check queue state
const state = offlineQueueManager.getQueueState();
console.log(`Pending: ${state.pendingCount}, Failed: ${state.failedCount}`);
```

### 3. Background Sync

Utilizes `expo-background-fetch` to process queued requests even when app is in background.

**Configuration:**
- **Minimum Interval:** 15 minutes
- **Stop on Terminate:** false (continues after app close)
- **Start on Boot:** true (starts on device restart)

**Manual Sync:**
```typescript
import { backgroundSyncService } from '@utils/backgroundSync';

// Trigger manual sync
await backgroundSyncService.triggerManualSync();

// Check last sync time
const lastSync = await backgroundSyncService.getLastSyncTimestamp();
```

### 4. Network Status Monitoring

Real-time network status updates using `@react-native-community/netinfo`.

**Usage with Hook:**
```typescript
import { useOffline } from '@hooks';

const MyComponent = () => {
  const { isOnline, queuedOperations, triggerSync } = useOffline();

  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      <Text>Queued: {queuedOperations.length}</Text>
      {!isOnline && <Button onPress={triggerSync} title="Sync Now" />}
    </View>
  );
};
```

### 5. Offline Initialization

Automatic initialization on app launch:

```typescript
import { initializeOfflineSupport } from '@utils/offlineInit';

// In app initialization
await initializeOfflineSupport();
```

**Initialization Steps:**
1. Fetch current network status
2. Set initial Redux state
3. Load persisted queue from AsyncStorage
4. Subscribe to queue changes
5. Register NetInfo listener
6. Register background sync task
7. Process queue if online

## Usage Examples

### Queueing Requests When Offline

```typescript
import { useOffline } from '@hooks';
import { QueuedRequestType } from '@utils/offlineQueue';

const SubmitAssignment = () => {
  const { isOnline, queueRequest } = useOffline();

  const handleSubmit = async (assignmentId: number, content: string) => {
    if (!isOnline) {
      // Queue for later
      await queueRequest(
        QueuedRequestType.ASSIGNMENT_SUBMISSION,
        `/api/assignments/${assignmentId}/submit`,
        'POST',
        { content }
      );
      Alert.alert('Queued', 'Will sync when online');
    } else {
      // Submit directly
      await submitAssignment(assignmentId, content);
    }
  };

  return <SubmitButton onPress={() => handleSubmit(123, 'My work')} />;
};
```

### Displaying Offline Status

```typescript
import { OfflineIndicator } from '@components';

const App = () => (
  <SafeAreaProvider>
    <OfflineIndicator />
    <AppContent />
  </SafeAreaProvider>
);
```

### Accessing Cached Data

```typescript
import { useAppSelector } from '@store/hooks';

const Dashboard = () => {
  const { dashboard, dashboardLastSync } = useAppSelector(
    state => state.studentData
  );
  const { isOnline } = useAppSelector(state => state.offline);

  const isCached = !isOnline || 
    (dashboardLastSync && Date.now() - dashboardLastSync > 5 * 60 * 1000);

  return (
    <View>
      {isCached && <CachedDataBanner lastSync={dashboardLastSync} />}
      <DashboardContent data={dashboard} />
    </View>
  );
};
```

### Manual Sync Trigger

```typescript
import { ManualSyncButton } from '@components';

const SettingsScreen = () => (
  <View>
    <ManualSyncButton />
  </View>
);
```

## Testing

### Unit Tests

```bash
npm test -- offlineQueue.test.ts
npm test -- backgroundSync.test.ts
npm test -- offlineInit.test.ts
npm test -- reduxPersist.test.ts
```

### Integration Tests

```bash
npm test -- offlineValidation.test.ts
npm test -- offlineE2E.test.ts
npm test -- offlineSync.test.ts
```

### Manual Testing

1. **Network Disabled:**
   - Enable Airplane Mode
   - Perform actions (submit assignment, post question)
   - Verify actions are queued
   - Disable Airplane Mode
   - Verify automatic sync

2. **App Restart:**
   - Queue some requests
   - Force quit app
   - Relaunch app
   - Verify queue is restored

3. **Background Sync:**
   - Queue requests
   - Send app to background
   - Wait 15+ minutes
   - Verify sync occurred in background

## Debugging

### Enable Logging

```typescript
// In offlineQueue.ts
console.log('[OfflineQueue] Queue state:', this.getQueueState());

// In backgroundSync.ts
console.log('[BackgroundSync] Sync started:', Date.now());
```

### Inspect AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// View queue
const queue = await AsyncStorage.getItem('@offline_queue');
console.log(JSON.parse(queue));

// View persisted state
const state = await AsyncStorage.getItem('persist:root');
console.log(JSON.parse(state));
```

### Check Redux State

```typescript
import { store } from '@store';

// Current offline state
console.log(store.getState().offline);

// Subscribe to changes
store.subscribe(() => {
  console.log('Offline state changed:', store.getState().offline);
});
```

## Performance Considerations

### Storage Optimization

- Queue is limited by retry count (max 3 retries)
- Failed requests are removed after max retries
- Large payloads should be compressed before queueing

### Memory Management

- Queue operations return copies, not references
- Listeners are properly cleaned up on unmount
- Background tasks are resource-efficient

### Battery Impact

- Background sync interval: 15 minutes (configurable)
- Sync only occurs when device is awake
- Network requests are batched

## Troubleshooting

### Queue Not Processing

**Problem:** Requests stay in queue even when online

**Solutions:**
1. Check network status: `NetInfo.fetch()`
2. Verify queue isn't empty: `offlineQueueManager.getQueue()`
3. Manually trigger: `backgroundSyncService.triggerManualSync()`
4. Check for errors in console

### State Not Persisting

**Problem:** State resets on app restart

**Solutions:**
1. Verify AsyncStorage permissions
2. Check persist config whitelist
3. Ensure PersistGate wraps app
4. Check for serialization errors

### Background Sync Not Working

**Problem:** Sync doesn't occur in background

**Solutions:**
1. Verify background fetch is enabled in app.json
2. Check platform support (iOS requires background modes)
3. Test with shorter interval during development
4. Verify task is registered: `backgroundSyncService.getStatus()`

## API Reference

### offlineQueueManager

```typescript
interface OfflineQueueManager {
  addRequest(type, url, method, data?, headers?, metadata?): Promise<string>
  getQueue(): QueuedRequest[]
  getQueueCount(): number
  getQueueState(): OfflineQueueState
  processQueue(): Promise<void>
  clearQueue(): Promise<void>
  removeFromQueue(id: string): Promise<void>
  getRequestsByType(type: QueuedRequestType): QueuedRequest[]
  isConnected(): boolean
  subscribe(listener: (queue) => void): () => void
}
```

### backgroundSyncService

```typescript
interface BackgroundSyncService {
  register(): Promise<void>
  unregister(): Promise<void>
  getStatus(): Promise<any>
  getLastSyncTimestamp(): Promise<number | null>
  triggerManualSync(): Promise<void>
}
```

### useOffline Hook

```typescript
interface UseOfflineReturn {
  isOnline: boolean
  queuedOperations: QueuedRequest[]
  pendingActions: PendingAction[]
  lastSyncTime: number | null
  syncInProgress: boolean
  autoSyncEnabled: boolean
  queueRequest: (type, url, method, data?, headers?, metadata?) => Promise<string>
  queueAction: (actionType, payload) => string
  triggerSync: () => Promise<void>
  getQueueState: () => OfflineQueueState
  checkConnection: () => Promise<boolean>
  clearQueue: () => Promise<void>
  getRequestsByType: (type) => QueuedRequest[]
  removeRequest: (id) => Promise<void>
}
```

## Best Practices

1. **Always check online status** before making API calls
2. **Provide user feedback** when actions are queued
3. **Display cached data indicators** to inform users
4. **Handle queue failures gracefully** with retry logic
5. **Test offline scenarios thoroughly** before release
6. **Monitor queue size** to prevent storage overflow
7. **Clear old failed requests** periodically
8. **Log sync operations** for debugging

## Future Enhancements

- [ ] Conflict resolution for concurrent edits
- [ ] Differential sync for large datasets
- [ ] Queue priority levels
- [ ] Bandwidth-aware sync
- [ ] P2P sync for offline collaboration
- [ ] Smart retry with exponential backoff
- [ ] Queue analytics and monitoring
