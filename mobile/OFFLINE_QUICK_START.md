# Offline Functionality - Quick Start Guide

## 🚀 Quick Start

This guide helps you quickly get started with offline functionality validation and testing.

## Prerequisites

Ensure all dependencies are installed:
```bash
cd mobile
npm install
```

## Validation

### 1. Validate Implementation
```bash
npm run validate-offline
```

This checks that all offline features are properly set up.

### 2. Run Tests
```bash
# All offline tests
npm run test-offline

# Unit tests only
npm run test-offline-unit

# Integration tests only
npm run test-offline-integration
```

## Manual Testing

### Quick Test Procedure

1. **Enable Offline Mode:**
   - iOS Simulator: Toggle Airplane Mode in Settings
   - Android Emulator: Settings > Network & Internet > Airplane Mode
   - Physical Device: Enable Airplane Mode

2. **Test Queue Functionality:**
   - Launch the app
   - Navigate to Assignments
   - Try to submit an assignment
   - Verify "Queued for sync" message appears
   
3. **Verify Persistence:**
   - Force quit the app (don't just background)
   - Relaunch the app
   - Check that queued items are still there

4. **Test Sync:**
   - Disable Airplane Mode
   - Wait a few seconds
   - Verify automatic sync occurs
   - Check that queue is cleared

5. **Test State Persistence:**
   - Login and load data
   - Force quit app
   - Enable Airplane Mode
   - Relaunch app
   - Verify all data is still available

## Using the Demo Component

The app includes a comprehensive demo component:

```typescript
import { OfflineDemo } from '@components';

// Add to any screen
<OfflineDemo />
```

Features:
- Network status indicator
- Queue statistics
- Test request button
- Manual sync trigger
- Queue viewer

## Key Hooks

### useOffline

Main hook for offline functionality:

```typescript
import { useOffline } from '@hooks';

const {
  isOnline,              // Network status
  queuedOperations,      // Current queue
  queueRequest,          // Queue a request
  triggerSync,           // Manual sync
} = useOffline();
```

### Quick Example

```typescript
const MyComponent = () => {
  const { isOnline, queueRequest } = useOffline();

  const handleAction = async () => {
    if (!isOnline) {
      await queueRequest(
        QueuedRequestType.ASSIGNMENT_SUBMISSION,
        '/api/assignments/123/submit',
        'POST',
        { content: 'My work' }
      );
      Alert.alert('Queued', 'Will sync when online');
    } else {
      // Direct API call
    }
  };

  return (
    <View>
      <Text>{isOnline ? 'Online' : 'Offline'}</Text>
      <Button onPress={handleAction} title="Submit" />
    </View>
  );
};
```

## Common Scenarios

### 1. Submit Assignment Offline
```typescript
import { QueuedRequestType } from '@utils/offlineQueue';
import { useOffline } from '@hooks';

const { queueRequest } = useOffline();

await queueRequest(
  QueuedRequestType.ASSIGNMENT_SUBMISSION,
  '/api/assignments/123/submit',
  'POST',
  { content: 'My submission' }
);
```

### 2. Check Network Status
```typescript
const { isOnline } = useOffline();

if (isOnline) {
  // Make API call
} else {
  // Queue for later
}
```

### 3. Manual Sync
```typescript
const { triggerSync } = useOffline();

await triggerSync();
Alert.alert('Synced', 'All pending items synced');
```

### 4. View Queue
```typescript
const { queuedOperations, getQueueState } = useOffline();

const state = getQueueState();
console.log(`Queue: ${state.totalCount} items`);
console.log(`Pending: ${state.pendingCount}`);
console.log(`Failed: ${state.failedCount}`);
```

## Debugging

### View Queue in AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const queue = await AsyncStorage.getItem('@offline_queue');
console.log('Queue:', JSON.parse(queue));
```

### View Redux State
```typescript
import { store } from '@store';

console.log('Offline State:', store.getState().offline);
```

### Enable Logging

Add console logs in:
- `src/utils/offlineQueue.ts` - Queue operations
- `src/utils/backgroundSync.ts` - Sync operations
- `src/utils/offlineInit.ts` - Initialization

## Troubleshooting

### Queue Not Processing
**Solution:**
```typescript
const { checkConnection, triggerSync } = useOffline();

// Check connection
const connected = await checkConnection();
console.log('Connected:', connected);

// Manual sync
if (connected) {
  await triggerSync();
}
```

### State Not Persisting
**Check:**
1. PersistGate is wrapping the app
2. AsyncStorage permissions
3. Persist config whitelist

### Background Sync Not Working
**Check:**
1. Background modes enabled in app.json
2. Task is registered
3. Minimum interval (15 minutes)

## Testing Checklist

- [ ] Enable Airplane Mode and queue requests
- [ ] Verify requests stored in AsyncStorage
- [ ] Restart app and verify queue restored
- [ ] Disable Airplane Mode and verify sync
- [ ] Test with multiple request types
- [ ] Test background sync (wait 15+ minutes)
- [ ] Test state persistence across restarts
- [ ] Test network status changes
- [ ] Test manual sync trigger
- [ ] Test error handling

## Next Steps

1. Review [Full Documentation](./docs/OFFLINE_FUNCTIONALITY.md)
2. Review [Testing Guide](./__tests__/OFFLINE_TESTING.md)
3. Review [Implementation Complete](./OFFLINE_IMPLEMENTATION_COMPLETE.md)
4. Run validation: `npm run validate-offline`
5. Run tests: `npm run test-offline`
6. Perform manual testing with Airplane Mode

## Support

For issues or questions:
1. Check the full documentation
2. Review test files for examples
3. Use the OfflineDemo component for reference

## Quick Reference

### Scripts
- `npm run validate-offline` - Validate implementation
- `npm run test-offline` - Run all offline tests
- `npm run test-offline-unit` - Unit tests only
- `npm run test-offline-integration` - Integration tests only

### Files
- `src/utils/offlineQueue.ts` - Queue manager
- `src/utils/backgroundSync.ts` - Background sync
- `src/utils/offlineInit.ts` - Initialization
- `src/store/store.ts` - Redux persist config
- `src/hooks/useOffline.ts` - Main hook
- `src/components/OfflineDemo.tsx` - Demo component

### Key Concepts
- **Queue:** Failed requests stored for retry
- **Persist:** Redux state saved to AsyncStorage
- **Sync:** Processing queued requests
- **NetInfo:** Network status monitoring
- **Background Fetch:** Syncing when app is closed

---

**Status:** ✅ Implementation Complete & Ready for Testing
