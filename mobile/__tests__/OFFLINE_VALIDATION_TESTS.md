# Offline Functionality Validation Tests

This document describes the comprehensive test suite for validating offline functionality in the EduTrack mobile app.

## Overview

The test suite validates all aspects of offline functionality including:
- Redux Persist state persistence
- Network status detection and handling
- Offline queue management with AsyncStorage
- Background sync with expo-background-fetch
- OfflineInit initialization
- NetInfo listener integration with Redux

## Test Files

### 1. Integration Tests

#### `offlineValidation.test.ts`
**Purpose**: Comprehensive validation of all offline features

**Test Coverage**:
- **Network Disabled Scenarios** (5 tests)
  - Detects when network is disabled
  - Queues requests when network unavailable
  - Does not process queue when offline
  - Handles network reconnection
  
- **Redux Persist - State Persistence** (4 tests)
  - Persists offline state to AsyncStorage
  - Restores state from AsyncStorage on app restart
  - Persists user data across app restarts
  - Handles corrupted persisted state gracefully
  
- **OfflineQueue AsyncStorage Integration** (6 tests)
  - Stores failed API requests in AsyncStorage
  - Loads queued requests from AsyncStorage on initialization
  - Persists multiple failed requests
  - Removes requests from AsyncStorage after successful sync
  - Tracks retry count for failed requests
  
- **Background Sync with expo-background-fetch** (7 tests)
  - Registers background sync task
  - Processes offline queue during background sync
  - Retrieves last sync timestamp
  - Handles background sync failures gracefully
  - Respects minimum sync interval
  - Unregisters background sync task
  - Gets background sync status
  
- **OfflineInit Initialization** (6 tests)
  - Initializes offline support correctly
  - Sets initial online status on initialization
  - Processes queued requests on initialization if online
  - Subscribes to queue changes
  - Handles initialization errors gracefully
  - Registers background sync during initialization
  
- **NetInfo Listener Updates Redux State** (6 tests)
  - Updates Redux state when network status changes
  - Dispatches online/offline status to Redux
  - Triggers queue processing when coming back online
  - Handles rapid network status changes
  - Differentiates between cellular and WiFi connections
  
- **Complete Offline Flow Integration** (3 tests)
  - Handles complete offline-to-online flow
  - Persists state throughout offline-online cycle
  - Maintains queue integrity during app lifecycle
  
- **Error Handling and Edge Cases** (4 tests)
  - Handles AsyncStorage failures
  - Handles NetInfo unavailability
  - Handles queue corruption
  - Limits retry attempts

#### `offlineE2E.test.ts`
**Purpose**: End-to-end integration tests for complete workflows

**Test Coverage**:
- **App Launch Scenario** (3 tests)
  - Initializes all offline features on app launch
  - Restores persisted state on app restart
  - Processes queued requests if online on launch
  
- **Network Disabled Workflow** (2 tests)
  - Handles complete offline workflow
  - Maintains Redux state during offline period
  
- **App Restart with Offline Queue** (3 tests)
  - Persists queue across app restart
  - Restores Redux state after app restart
  - Initializes and processes queue after restart
  
- **Background Sync Integration** (3 tests)
  - Executes background sync
  - Updates last sync timestamp after background sync
  - Processes queue during background sync
  
- **Network Reconnection** (2 tests)
  - Automatically syncs when network is restored
  - Handles network transitions
  
- **Complete User Workflow** (2 tests)
  - Handles student submitting assignment while offline
  - Handles multiple offline operations
  
- **Data Integrity** (2 tests)
  - Maintains data integrity across offline-online cycles
  - Preserves queue order
  
- **Error Recovery** (2 tests)
  - Recovers from storage failures
  - Recovers from network failures
  
- **Performance** (2 tests)
  - Handles large queue efficiently
  - Initializes quickly

### 2. Unit Tests

#### `offlineQueue.test.ts`
**Purpose**: Detailed unit tests for the offlineQueue module

**Test Coverage** (70+ tests):
- Queue Initialization (4 tests)
- Adding Requests to Queue (10 tests)
- Queue State Management (4 tests)
- Removing Requests from Queue (3 tests)
- Clearing Queue (3 tests)
- Queue Filtering (2 tests)
- Queue Subscription (4 tests)
- Network Status Integration (3 tests)
- Queue Processing (3 tests)
- Error Handling (2 tests)
- Cleanup (1 test)

#### `reduxPersist.test.ts`
**Purpose**: Validates Redux persist configuration and state persistence

**Test Coverage** (40+ tests):
- Store Configuration (4 tests)
- Offline State Persistence (6 tests)
- Auth State Persistence (2 tests)
- Dashboard State Persistence (2 tests)
- Assignments State Persistence (2 tests)
- Grades State Persistence (2 tests)
- Profile State Persistence (2 tests)
- Parent State Persistence (2 tests)
- Student Data Persistence (2 tests)
- Rehydration (4 tests)
- Persistence Operations (3 tests)
- Serialization (4 tests)
- State Migration (2 tests)
- Edge Cases (4 tests)
- Performance (3 tests)

#### `backgroundSync.test.ts`
**Purpose**: Tests background sync functionality with expo-background-fetch

**Test Coverage** (45+ tests):
- Background Sync Registration (6 tests)
- Background Sync Unregistration (3 tests)
- Background Sync Status (3 tests)
- Last Sync Timestamp (5 tests)
- Manual Sync Trigger (5 tests)
- Background Task Execution (6 tests)
- Queue Processing Integration (4 tests)
- Sync Interval Management (3 tests)
- Platform-Specific Behavior (3 tests)
- Error Recovery (3 tests)
- Performance (2 tests)
- Edge Cases (3 tests)
- Initialization (3 tests)

#### `offlineInit.test.ts`
**Purpose**: Tests offline initialization functionality

**Test Coverage** (35+ tests):
- Initialization (8 tests)
- NetInfo Listener Setup (6 tests)
- Redux State Synchronization (5 tests)
- Queue Processing on Initialization (4 tests)
- Background Sync Registration (2 tests)
- Cleanup (3 tests)
- Error Handling (4 tests)
- Integration (3 tests)
- State Consistency (2 tests)
- Performance (2 tests)

#### `networkStatus.test.ts`
**Purpose**: Tests NetInfo integration and network status detection

**Test Coverage** (40+ tests):
- Network Status Detection (4 tests)
- Connection Types (5 tests)
- Event Listener (5 tests)
- Subscription Management (4 tests)
- State Changes (5 tests)
- Error Handling (3 tests)
- Edge Cases (4 tests)
- Performance (3 tests)
- Initialization (3 tests)

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Integration tests
npm test -- __tests__/integration/offlineValidation.test.ts
npm test -- __tests__/integration/offlineE2E.test.ts

# Unit tests
npm test -- __tests__/unit/offlineQueue.test.ts
npm test -- __tests__/unit/reduxPersist.test.ts
npm test -- __tests__/unit/backgroundSync.test.ts
npm test -- __tests__/unit/offlineInit.test.ts
npm test -- __tests__/unit/networkStatus.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Key Validation Points

### 1. Redux Persist
- ✅ State persists to AsyncStorage
- ✅ State restores after app restart
- ✅ Handles corrupted data gracefully
- ✅ Whitelist includes all necessary reducers
- ✅ Serialization works correctly

### 2. Network Detection
- ✅ Detects online/offline status
- ✅ Differentiates between connected and internet reachable
- ✅ Updates Redux state on network changes
- ✅ Handles rapid state transitions
- ✅ Supports all connection types

### 3. Offline Queue
- ✅ Stores failed requests in AsyncStorage
- ✅ Loads queue on app launch
- ✅ Maintains FIFO order
- ✅ Tracks retry counts
- ✅ Processes queue when online
- ✅ Notifies subscribers of changes

### 4. Background Sync
- ✅ Registers with expo-background-fetch
- ✅ Runs every 15 minutes minimum
- ✅ Processes offline queue
- ✅ Updates last sync timestamp
- ✅ Handles failures gracefully
- ✅ Works on iOS and Android

### 5. OfflineInit
- ✅ Initializes on app launch
- ✅ Sets up NetInfo listener
- ✅ Syncs queue to Redux
- ✅ Registers background sync
- ✅ Processes queue if online
- ✅ Handles errors gracefully

### 6. NetInfo Integration
- ✅ Listener updates Redux offline state
- ✅ Triggers queue processing on reconnection
- ✅ Handles all connection types
- ✅ Manages subscriptions properly
- ✅ Detects state changes accurately

## Test Scenarios

### Scenario 1: App Launch (Offline)
1. App starts with no network
2. NetInfo detects offline status
3. Redux state is set to offline
4. Queued requests are loaded from AsyncStorage
5. No queue processing occurs

### Scenario 2: App Launch (Online)
1. App starts with network available
2. NetInfo detects online status
3. Redux state is set to online
4. Queued requests are loaded
5. Queue processing begins automatically

### Scenario 3: Going Offline
1. User loses network connection
2. NetInfo listener detects change
3. Redux state updates to offline
4. New requests are queued
5. Requests stored in AsyncStorage

### Scenario 4: Coming Back Online
1. Network connection restored
2. NetInfo listener detects change
3. Redux state updates to online
4. Queue processing triggered
5. Requests synced to server
6. Queue cleared on success

### Scenario 5: App Restart with Queue
1. App closes with pending requests
2. Queue persisted in AsyncStorage
3. App reopens
4. Queue restored from AsyncStorage
5. If online, queue processing starts

### Scenario 6: Background Sync
1. Background task scheduled
2. Task runs every 15+ minutes
3. Queue processed if online
4. Last sync timestamp updated
5. Success/failure result returned

## Expected Outcomes

All tests should pass with:
- ✅ 200+ total tests
- ✅ 100% coverage of critical paths
- ✅ All async operations handled properly
- ✅ All error cases covered
- ✅ All edge cases validated
- ✅ Performance requirements met

## Troubleshooting

### Tests Fail Due to AsyncStorage
- Ensure AsyncStorage mock is properly configured in setup.ts
- Check that AsyncStorage methods return proper Promise types

### Tests Fail Due to NetInfo
- Verify NetInfo mock returns proper state structure
- Ensure event listener mock is working correctly

### Tests Fail Due to Background Sync
- Check expo-background-fetch mock configuration
- Verify Platform.OS is set correctly for tests

### Tests Timeout
- Increase test timeout in setup.ts
- Check for unresolved promises
- Verify all async operations complete

## Maintenance

When updating offline functionality:
1. Update corresponding tests
2. Add new tests for new features
3. Ensure all existing tests still pass
4. Update this documentation
5. Run full test suite before committing

## References

- [Redux Persist Documentation](https://github.com/rt2zz/redux-persist)
- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)
