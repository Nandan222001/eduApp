/**
 * Offline-First Architecture - Central Exports
 *
 * This file provides a single import point for all offline-related functionality
 * Usage: import { useOfflineSync, OfflineIndicator, offlineQueueManager } from '@src/offline';
 */

// Utils
export { offlineQueueManager, QueuedRequestType } from './utils/offlineQueue';
export type { QueuedRequest, OfflineQueueState } from './utils/offlineQueue';
export { backgroundSyncService } from './utils/backgroundSync';
export { appInitializer } from './utils/appInitializer';

// API
export { offlineAwareApi } from './api/offlineAwareApi';
export type { OfflineSubmitAssignmentOptions } from './api/offlineAwareApi';

// Hooks
export { useOfflineSync } from './hooks/useOfflineSync';
export { useNetworkStatus } from './hooks/useNetworkStatus';
export type { NetworkStatus } from './hooks/useNetworkStatus';
export { useOfflineInit } from './hooks/useOfflineInit';
export { useDashboardSync } from './hooks/useDashboardSync';
export { useAssignmentsSync } from './hooks/useAssignmentsSync';
export { useGradesSync } from './hooks/useGradesSync';
export { useAttendanceSync } from './hooks/useAttendanceSync';

// Components
export { OfflineIndicator } from './components/OfflineIndicator';
export { SyncStatusBanner } from './components/SyncStatusBanner';
export { CachedDataIndicator } from './components/CachedDataIndicator';
export { ManualSyncButton } from './components/ManualSyncButton';
export { OfflineQueueViewer } from './components/OfflineQueueViewer';

// Screens
export { OfflineSettingsScreen } from './screens/OfflineSettingsScreen';

// Redux Actions (commonly used)
export {
  optimisticUpdateAssignment,
  rollbackAssignment,
  setLastSynced as setAssignmentsLastSynced,
} from './store/slices/assignmentsSlice';

export {
  setLastSynced as setDashboardLastSynced,
  setSyncing as setDashboardSyncing,
} from './store/slices/dashboardSlice';

export {
  setLastSynced as setGradesLastSynced,
  setSyncing as setGradesSyncing,
} from './store/slices/gradesSlice';

export {
  setLastSynced as setAttendanceLastSynced,
  setSyncing as setAttendanceSyncing,
} from './store/slices/attendanceSlice';
