# Offline Functionality Testing Guide

## Overview

This guide covers testing strategies for the offline functionality in the EduTrack mobile app, including Redux Persist, offline queue management, background sync, and network status monitoring.

## Test Structure

```
__tests__/
├── unit/
│   ├── offlineQueue.test.ts       # Queue operations
│   ├── backgroundSync.test.ts     # Background sync
│   ├── offlineInit.test.ts        # Initialization
│   ├── reduxPersist.test.ts       # State persistence
│   └── networkStatus.test.ts      # Network monitoring
├── integration/
│   ├── offlineValidation.test.ts  # Comprehensive validation
│   ├── offlineE2E.test.ts         # End-to-end scenarios
│   └── offlineSync.test.ts        # Sync integration
└── utils/
    └── offlineTestUtils.ts        # Testing utilities
```

## Running Tests

### All Offline Tests
```bash
npm test -- --testPathPattern=offline
```

### Specific Test Suites
```bash
# Unit tests
npm test -- offlineQueue.test.ts
npm test -- backgroundSync.test.ts
npm test -- offlineInit.test.ts
npm test -- reduxPersist.test.ts

# Integration tests
npm test -- offlineValidation.test.ts
npm test -- offlineE2E.test.ts
npm test -- offlineSync.test.ts
```

### Watch Mode
```bash
npm test -- --watch offlineQueue.test.ts
```

### Coverage Report
```bash
npm test -- --coverage --testPathPattern=offline
```

## Test Categories

### 1. Redux Persist Tests

**File:** `unit/reduxPersist.test.ts`

**Coverage:**
- Store configuration
- State persistence to AsyncStorage
- State rehydration after app restart
- Whitelist/blacklist configuration
- Serialization/deserialization
- Migration between versions
- Error handling

**Key Scenarios:**
```typescript
it('should persist offline state to AsyncStorage', async () => {
  // Dispatch state changes
  // Verify AsyncStorage.setItem was called
  // Verify persisted data structure
});

it('should restore state after app restart', async () => {
  // Mock persisted data in AsyncStorage
  // Initialize store
  // Verify state is restored correctly
});
```

### 2. Offline Queue Tests

**File:** `unit/offlineQueue.test.ts`

**Coverage:**
- Adding requests to queue
- Queue storage in AsyncStorage
- Queue loading on initialization
- Request retry logic
- Queue processing when online
- Request filtering by type
- Queue state management
- Error handling

**Key Scenarios:**
```typescript
it('should store failed requests in AsyncStorage', async () => {
  // Add request to queue
  // Verify AsyncStorage.setItem called
  // Verify request structure
});

it('should retry failed requests with backoff', async () => {
  // Queue request
  // Simulate failures
  // Verify retry count increments
  // Verify removed after max retries
});
```

### 3. Background Sync Tests

**File:** `unit/backgroundSync.test.ts`

**Coverage:**
- Background task registration
- expo-background-fetch configuration
- Queue processing in background
- Last sync timestamp tracking
- Manual sync trigger
- Platform-specific behavior
- Error recovery

**Key Scenarios:**
```typescript
it('should process queue in background task', async () => {
  // Register background task
  // Trigger task execution
  // Verify queue is processed
  // Verify timestamp updated
});

it('should respect minimum interval', async () => {
  // Verify 15-minute interval configured
  // Test interval enforcement
});
```

### 4. Offline Initialization Tests

**File:** `unit/offlineInit.test.ts`

**Coverage:**
- App launch initialization
- NetInfo listener setup
- Redux state synchronization
- Queue processing trigger
- Background sync registration
- Error handling

**Key Scenarios:**
```typescript
it('should initialize on app launch', async () => {
  // Call initializeOfflineSupport
  // Verify NetInfo.fetch called
  // Verify listeners registered
  // Verify Redux state updated
});

it('should process queue if online', async () => {
  // Initialize with online state
  // Verify queue processing triggered
});
```

### 5. Network Status Tests

**File:** `unit/networkStatus.test.ts`

**Coverage:**
- NetInfo listener updates
- Redux state updates
- Online/offline transitions
- Network type detection
- Rapid status changes

**Key Scenarios:**
```typescript
it('should update Redux when network changes', async () => {
  // Setup NetInfo listener
  // Trigger network change
  // Verify Redux dispatch called
  // Verify state updated
});

it('should trigger sync on reconnection', async () => {
  // Go offline
  // Queue requests
  // Go online
  // Verify sync triggered
});
```

### 6. Integration Tests

**File:** `integration/offlineValidation.test.ts`

**Coverage:**
- Complete offline workflows
- Network disabled scenarios
- App restart with queued data
- Background sync integration
- Data integrity
- Error recovery

**Key Scenarios:**
```typescript
it('should handle complete offline-to-online flow', async () => {
  // Start offline
  // Queue multiple requests
  // Verify persistence
  // Go online
  // Verify sync
  // Verify queue cleared
});
```

## Testing Utilities

### Network State Simulation

```typescript
import { simulateNetworkChange, createOfflineNetworkState } from '../utils/offlineTestUtils';

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const { triggerChange } = simulateNetworkChange(mockNetInfo, createOnlineNetworkState());

// Later in test
triggerChange(createOfflineNetworkState());
```

### Mock Queue Creation

```typescript
import { createMockQueue, createMockQueuedRequest } from '../utils/offlineTestUtils';

// Create 10 mock requests
const queue = createMockQueue(10);

// Create single request with overrides
const request = createMockQueuedRequest({
  type: QueuedRequestType.ASSIGNMENT_SUBMISSION,
  url: '/api/custom',
});
```

### AsyncStorage Mocking

```typescript
import { setupAsyncStorageMock } from '../utils/offlineTestUtils';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const { getStorage, setStorageItem } = setupAsyncStorageMock(mockAsyncStorage);

// Access underlying storage
const storage = getStorage();
console.log(storage.get('@offline_queue'));
```

### App Restart Simulation

```typescript
import { simulateAppRestart } from '../utils/offlineTestUtils';

// Queue some requests
await offlineQueueManager.addRequest(...);

// Simulate app restart
const storage = await simulateAppRestart(mockAsyncStorage);

// Verify queue persisted
const queue = storage.get('@offline_queue');
```

## Manual Testing Procedures

### Test 1: Network Disabled

**Steps:**
1. Launch app in online state
2. Navigate to assignment submission
3. Enable Airplane Mode
4. Submit assignment
5. Verify "Queued" message shown
6. Check AsyncStorage for queued request
7. Disable Airplane Mode
8. Verify automatic sync occurs
9. Verify assignment marked as submitted

**Expected:**
- Request queued when offline
- Persisted to AsyncStorage
- Synced automatically when online
- User notified of sync completion

### Test 2: App Restart with Queued Data

**Steps:**
1. Enable Airplane Mode
2. Perform multiple actions (submit assignment, post question, update profile)
3. Verify all actions queued
4. Force quit app
5. Relaunch app
6. Verify queued items shown in UI
7. Disable Airplane Mode
8. Verify all items sync

**Expected:**
- Queue persists across restart
- All queued items visible
- Automatic sync on reconnection
- No data loss

### Test 3: Background Sync

**Steps:**
1. Queue some requests
2. Send app to background
3. Wait 15+ minutes
4. Return to app
5. Check last sync timestamp
6. Verify queue processed

**Expected:**
- Background sync occurs
- Last sync timestamp updated
- Queue processed even in background

### Test 4: Redux Persist

**Steps:**
1. Login and load data
2. Go offline
3. Browse app (view grades, assignments, etc.)
4. Force quit app
5. Relaunch app offline
6. Verify all data still visible

**Expected:**
- All Redux state persisted
- Data available offline
- No loading spinners
- Cached data indicators shown

### Test 5: Retry Logic

**Steps:**
1. Mock API to return 500 error
2. Queue a request
3. Trigger sync
4. Verify retry count increments
5. Trigger sync again
6. Verify retry count increments
7. Trigger sync 3rd time
8. Verify request removed after max retries

**Expected:**
- Retry count increments on failure
- Request removed after 3 retries
- User notified of failures

## Debugging Tests

### Enable Verbose Logging

```typescript
// In test file
beforeEach(() => {
  jest.spyOn(console, 'log');
  jest.spyOn(console, 'error');
});

afterEach(() => {
  console.log.mockRestore?.();
  console.error.mockRestore?.();
});
```

### Inspect Mock Calls

```typescript
// View all AsyncStorage.setItem calls
console.log('AsyncStorage setItem calls:', mockAsyncStorage.setItem.mock.calls);

// View specific call arguments
const queueCall = mockAsyncStorage.setItem.mock.calls.find(
  call => call[0] === '@offline_queue'
);
console.log('Queue data:', JSON.parse(queueCall[1]));
```

### Test Isolation

```typescript
beforeEach(async () => {
  jest.clearAllMocks();
  await offlineQueueManager.clearQueue();
  // Reset any global state
});
```

## Common Issues

### Issue: Tests Timing Out

**Cause:** Async operations not completing
**Solution:** 
- Increase timeout: `jest.setTimeout(10000)`
- Ensure all promises are awaited
- Check for infinite loops in listeners

### Issue: State Not Persisting

**Cause:** Mock not configured correctly
**Solution:**
- Verify `mockAsyncStorage.setItem` is called
- Check persist config whitelist
- Ensure PersistGate in test setup

### Issue: Network Listener Not Firing

**Cause:** addEventListener mock not set up
**Solution:**
```typescript
let listener: any;
mockNetInfo.addEventListener.mockImplementation((cb) => {
  listener = cb;
  return () => {};
});
// Later trigger: listener({ isConnected: false });
```

### Issue: Queue Not Processing

**Cause:** isConnected check failing
**Solution:**
- Mock NetInfo.fetch to return online state
- Ensure offlineQueueManager.isConnected() returns true
- Check queue is not empty

## Best Practices

1. **Isolate Tests:** Each test should be independent
2. **Mock External Dependencies:** NetInfo, AsyncStorage, API calls
3. **Test Edge Cases:** Empty queue, corrupted data, rapid changes
4. **Verify Side Effects:** AsyncStorage calls, Redux dispatches, listeners
5. **Use Test Utilities:** Reuse helper functions for consistency
6. **Document Scenarios:** Clear test descriptions
7. **Test Error Paths:** Not just happy paths
8. **Performance Test:** Ensure tests run quickly

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Offline Tests
  run: |
    npm test -- --testPathPattern=offline --coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: offline
```

### Coverage Requirements

- Overall coverage: >80%
- Critical paths: >90%
- Error handling: >75%

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Redux Testing Guide](https://redux.js.org/usage/writing-tests)
- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)
