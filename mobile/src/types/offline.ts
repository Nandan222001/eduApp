export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

export enum QueuedOperationType {
  ASSIGNMENT_SUBMISSION = 'ASSIGNMENT_SUBMISSION',
  ATTENDANCE_CHECK_IN = 'ATTENDANCE_CHECK_IN',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
}

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  queuedOperations: QueuedOperation[];
  lastSyncTime: number | null;
  syncInProgress: boolean;
  autoSyncEnabled: boolean;
}

export interface StudentDataState {
  profile: any | null;
  profileLastSync: number | null;
  dashboard: any | null;
  dashboardLastSync: number | null;
  assignments: any[];
  assignmentsLastSync: number | null;
  grades: any[];
  gradesLastSync: number | null;
  attendance: any | null;
  attendanceLastSync: number | null;
  isLoading: boolean;
  error: string | null;
}
