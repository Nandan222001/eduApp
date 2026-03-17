export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export interface SyncStatus {
  lastSyncTimestamp: number | null;
  isPending: boolean;
  queueCount: number;
}

export interface OfflineState {
  queue: QueuedRequest[];
  networkState: NetworkState;
  syncStatus: SyncStatus;
}
