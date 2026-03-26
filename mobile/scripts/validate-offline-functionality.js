#!/usr/bin/env node

/**
 * Offline Functionality Validation Script
 * 
 * Validates that all offline features are properly implemented:
 * 1. Redux Persist configuration
 * 2. Offline queue manager
 * 3. Background sync service
 * 4. Network status monitoring
 * 5. Offline initialization
 * 
 * Usage: node scripts/validate-offline-functionality.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Not found in ${filePath}`, 'red');
    return false;
  }
}

function validatePackageJson() {
  log('\n=== Validating package.json Dependencies ===', 'blue');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const required = [
    '@react-native-async-storage/async-storage',
    '@react-native-community/netinfo',
    'redux-persist',
    '@reduxjs/toolkit',
    'expo-background-fetch',
    'expo-task-manager',
  ];
  
  let allPresent = true;
  required.forEach(dep => {
    if (deps[dep]) {
      log(`✓ ${dep} - ${deps[dep]}`, 'green');
    } else {
      log(`✗ ${dep} - Not installed`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
}

function validateStoreConfiguration() {
  log('\n=== Validating Store Configuration ===', 'blue');
  
  const checks = [
    checkFileExists('src/store/store.ts', 'Store configuration file'),
    checkFileContains('src/store/store.ts', 'persistStore', 'Redux Persist store setup'),
    checkFileContains('src/store/store.ts', 'persistReducer', 'Redux Persist reducer setup'),
    checkFileContains('src/store/store.ts', 'AsyncStorage', 'AsyncStorage import'),
    checkFileContains('src/store/store.ts', 'offlineReducer', 'Offline reducer'),
    checkFileContains('src/store/store.ts', "whitelist: ['auth', 'studentData', 'offline']", 'Persist whitelist'),
  ];
  
  return checks.every(Boolean);
}

function validateOfflineSlice() {
  log('\n=== Validating Offline Slice ===', 'blue');
  
  const checks = [
    checkFileExists('src/store/slices/offlineSlice.ts', 'Offline slice file'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'setOnlineStatus', 'setOnlineStatus action'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'setQueuedOperations', 'setQueuedOperations action'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'addPendingAction', 'addPendingAction action'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'removePendingAction', 'removePendingAction action'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'syncPendingActions', 'syncPendingActions thunk'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'setSyncInProgress', 'setSyncInProgress action'),
    checkFileContains('src/store/slices/offlineSlice.ts', 'setLastSyncTime', 'setLastSyncTime action'),
  ];
  
  return checks.every(Boolean);
}

function validateOfflineQueue() {
  log('\n=== Validating Offline Queue ===', 'blue');
  
  const checks = [
    checkFileExists('src/utils/offlineQueue.ts', 'Offline queue manager file'),
    checkFileContains('src/utils/offlineQueue.ts', 'class OfflineQueueManager', 'OfflineQueueManager class'),
    checkFileContains('src/utils/offlineQueue.ts', 'addToQueue', 'addToQueue method'),
    checkFileContains('src/utils/offlineQueue.ts', 'processQueue', 'processQueue method'),
    checkFileContains('src/utils/offlineQueue.ts', 'AsyncStorage', 'AsyncStorage usage'),
    checkFileContains('src/utils/offlineQueue.ts', 'NetInfo', 'NetInfo usage'),
    checkFileContains('src/utils/offlineQueue.ts', '@offline_queue', 'Queue storage key'),
  ];
  
  return checks.every(Boolean);
}

function validateBackgroundSync() {
  log('\n=== Validating Background Sync ===', 'blue');
  
  const checks = [
    checkFileExists('src/utils/backgroundSync.ts', 'Background sync file'),
    checkFileContains('src/utils/backgroundSync.ts', 'BackgroundFetch', 'BackgroundFetch import'),
    checkFileContains('src/utils/backgroundSync.ts', 'TaskManager', 'TaskManager import'),
    checkFileContains('src/utils/backgroundSync.ts', 'registerTaskAsync', 'Task registration'),
    checkFileContains('src/utils/backgroundSync.ts', 'minimumInterval', 'Minimum interval configuration'),
    checkFileContains('src/utils/backgroundSync.ts', 'offlineQueueManager.processQueue', 'Queue processing'),
    checkFileContains('src/utils/backgroundSync.ts', '@last_sync_timestamp', 'Last sync tracking'),
  ];
  
  return checks.every(Boolean);
}

function validateOfflineInit() {
  log('\n=== Validating Offline Initialization ===', 'blue');
  
  const checks = [
    checkFileExists('src/utils/offlineInit.ts', 'Offline init file'),
    checkFileContains('src/utils/offlineInit.ts', 'initializeOfflineSupport', 'Initialize function'),
    checkFileContains('src/utils/offlineInit.ts', 'NetInfo.fetch', 'NetInfo fetch'),
    checkFileContains('src/utils/offlineInit.ts', 'NetInfo.addEventListener', 'NetInfo listener'),
    checkFileContains('src/utils/offlineInit.ts', 'setOnlineStatus', 'Redux dispatch'),
    checkFileContains('src/utils/offlineInit.ts', 'BackgroundSyncService.register', 'Background sync registration'),
  ];
  
  return checks.every(Boolean);
}

function validateAppIntegration() {
  log('\n=== Validating App Integration ===', 'blue');
  
  const checks = [
    checkFileExists('app/_layout.tsx', 'App layout file'),
    checkFileContains('app/_layout.tsx', 'PersistGate', 'PersistGate wrapper'),
    checkFileContains('app/_layout.tsx', 'persistor', 'Persistor prop'),
    checkFileContains('app/_layout.tsx', 'initializeOfflineSupport', 'Offline initialization'),
  ];
  
  return checks.every(Boolean);
}

function validateTests() {
  log('\n=== Validating Tests ===', 'blue');
  
  const checks = [
    checkFileExists('__tests__/unit/offlineQueue.test.ts', 'Offline queue unit tests'),
    checkFileExists('__tests__/unit/backgroundSync.test.ts', 'Background sync unit tests'),
    checkFileExists('__tests__/unit/offlineInit.test.ts', 'Offline init unit tests'),
    checkFileExists('__tests__/unit/reduxPersist.test.ts', 'Redux persist unit tests'),
    checkFileExists('__tests__/integration/offlineValidation.test.ts', 'Offline validation integration tests'),
    checkFileExists('__tests__/integration/offlineE2E.test.ts', 'Offline E2E tests'),
    checkFileExists('__tests__/utils/offlineTestUtils.ts', 'Offline test utilities'),
  ];
  
  return checks.every(Boolean);
}

function validateComponents() {
  log('\n=== Validating Components ===', 'blue');
  
  const checks = [
    checkFileExists('src/components/OfflineIndicator.tsx', 'Offline indicator component'),
    checkFileExists('src/components/OfflineDataRefresher.tsx', 'Offline data refresher component'),
    checkFileExists('src/components/OfflineDemo.tsx', 'Offline demo component'),
    checkFileExists('src/components/SyncStatus.tsx', 'Sync status component'),
  ];
  
  return checks.every(Boolean);
}

function validateHooks() {
  log('\n=== Validating Hooks ===', 'blue');
  
  const checks = [
    checkFileExists('src/hooks/useOffline.ts', 'useOffline hook'),
    checkFileExists('src/hooks/useOfflineSync.ts', 'useOfflineSync hook'),
    checkFileExists('src/hooks/useOfflineQueue.ts', 'useOfflineQueue hook'),
    checkFileExists('src/hooks/useNetworkStatus.ts', 'useNetworkStatus hook'),
  ];
  
  return checks.every(Boolean);
}

function validateDocumentation() {
  log('\n=== Validating Documentation ===', 'blue');
  
  const checks = [
    checkFileExists('docs/OFFLINE_FUNCTIONALITY.md', 'Offline functionality documentation'),
    checkFileExists('__tests__/OFFLINE_TESTING.md', 'Offline testing documentation'),
  ];
  
  return checks.every(Boolean);
}

function main() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Offline Functionality Validation Script  ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  
  const results = {
    'Package Dependencies': validatePackageJson(),
    'Store Configuration': validateStoreConfiguration(),
    'Offline Slice': validateOfflineSlice(),
    'Offline Queue': validateOfflineQueue(),
    'Background Sync': validateBackgroundSync(),
    'Offline Initialization': validateOfflineInit(),
    'App Integration': validateAppIntegration(),
    'Tests': validateTests(),
    'Components': validateComponents(),
    'Hooks': validateHooks(),
    'Documentation': validateDocumentation(),
  };
  
  log('\n=== Validation Summary ===', 'blue');
  let allPassed = true;
  
  Object.entries(results).forEach(([category, passed]) => {
    const status = passed ? '✓ PASSED' : '✗ FAILED';
    const color = passed ? 'green' : 'red';
    log(`${status} - ${category}`, color);
    if (!passed) allPassed = false;
  });
  
  log('\n=== Final Result ===', 'blue');
  if (allPassed) {
    log('✓ All validations passed! Offline functionality is properly implemented.', 'green');
    process.exit(0);
  } else {
    log('✗ Some validations failed. Please review the errors above.', 'red');
    process.exit(1);
  }
}

main();
