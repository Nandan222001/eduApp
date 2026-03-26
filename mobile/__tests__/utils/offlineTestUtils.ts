/**
 * Offline Testing Utilities
 * 
 * Helper functions for testing offline functionality including:
 * - Network state simulation
 * - Queue management testing
 * - Async storage mocking
 * - Redux state setup
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueuedRequest, QueuedRequestType } from '../../src/utils/offlineQueue';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

export const createOnlineNetworkState = (): NetworkState => ({
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
});

export const createOfflineNetworkState = (): NetworkState => ({
  isConnected: false,
  isInternetReachable: false,
  type: 'none',
});

export const createCellularNetworkState = (): NetworkState => ({
  isConnected: true,
  isInternetReachable: true,
  type: 'cellular',
});

export const simulateNetworkChange = (
  mockNetInfo: jest.Mocked<typeof NetInfo>,
  state: NetworkState
) => {
  const listeners: Array<(state: any) => void> = [];
  
  mockNetInfo.addEventListener.mockImplementation((listener: any) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });

  mockNetInfo.fetch.mockResolvedValue(state as any);

  return {
    triggerChange: (newState: NetworkState) => {
      mockNetInfo.fetch.mockResolvedValue(newState as any);
      listeners.forEach(listener => listener(newState));
    },
    getListeners: () => listeners,
  };
};

export const createMockQueuedRequest = (
  overrides?: Partial<QueuedRequest>
): QueuedRequest => ({
  id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: QueuedRequestType.ASSIGNMENT_SUBMISSION,
  url: '/api/test',
  method: 'POST',
  data: { test: 'data' },
  timestamp: Date.now(),
  retryCount: 0,
  maxRetries: 3,
  ...overrides,
});

export const createMockQueue = (count: number): QueuedRequest[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockQueuedRequest({
      id: `req-${i}`,
      url: `/api/test/${i}`,
      data: { index: i },
    })
  );
};

export const setupAsyncStorageMock = (
  mockAsyncStorage: jest.Mocked<typeof AsyncStorage>
) => {
  const storage = new Map<string, string>();

  mockAsyncStorage.getItem.mockImplementation((key: string) => {
    const value = storage.get(key);
    return Promise.resolve(value || null);
  });

  mockAsyncStorage.setItem.mockImplementation((key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  });

  mockAsyncStorage.removeItem.mockImplementation((key: string) => {
    storage.delete(key);
    return Promise.resolve();
  });

  mockAsyncStorage.clear.mockImplementation(() => {
    storage.clear();
    return Promise.resolve();
  });

  return {
    getStorage: () => storage,
    clearStorage: () => storage.clear(),
    setStorageItem: (key: string, value: string) => storage.set(key, value),
    getStorageItem: (key: string) => storage.get(key),
  };
};

export const createPersistedState = (overrides?: any) => ({
  offline: JSON.stringify({
    isOnline: true,
    queuedOperations: [],
    pendingActions: [],
    lastSyncTime: null,
    syncInProgress: false,
    autoSyncEnabled: true,
    ...overrides?.offline,
  }),
  auth: JSON.stringify({
    isAuthenticated: false,
    user: null,
    token: null,
    ...overrides?.auth,
  }),
  ...overrides,
});

export const waitForAsync = (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await waitForAsync(interval);
  }
  
  return false;
};

export const mockNetworkFailure = (
  mockNetInfo: jest.Mocked<typeof NetInfo>
) => {
  mockNetInfo.fetch.mockRejectedValue(new Error('Network request failed'));
  mockNetInfo.addEventListener.mockImplementation(() => {
    throw new Error('Network listener failed');
  });
};

export const mockStorageFailure = (
  mockAsyncStorage: jest.Mocked<typeof AsyncStorage>,
  operation: 'getItem' | 'setItem' | 'removeItem' = 'setItem'
) => {
  if (operation === 'getItem') {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage read failed'));
  } else if (operation === 'setItem') {
    mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage write failed'));
  } else if (operation === 'removeItem') {
    mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage delete failed'));
  }
};

export const verifyQueuePersistence = async (
  mockAsyncStorage: jest.Mocked<typeof AsyncStorage>,
  expectedQueue: QueuedRequest[]
) => {
  const calls = mockAsyncStorage.setItem.mock.calls;
  const queueCall = calls.find(call => call[0] === '@offline_queue');
  
  if (!queueCall) {
    throw new Error('Queue was not saved to AsyncStorage');
  }
  
  const savedQueue = JSON.parse(queueCall[1]);
  
  if (!Array.isArray(savedQueue)) {
    throw new Error('Saved queue is not an array');
  }
  
  if (savedQueue.length !== expectedQueue.length) {
    throw new Error(
      `Expected queue length ${expectedQueue.length}, got ${savedQueue.length}`
    );
  }
  
  return savedQueue;
};

export const simulateAppRestart = async (
  mockAsyncStorage: jest.Mocked<typeof AsyncStorage>
) => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Keep the storage data intact
  const storage = new Map<string, string>();
  const calls = mockAsyncStorage.setItem.mock.calls;
  
  calls.forEach(([key, value]) => {
    storage.set(key, value);
  });
  
  // Setup fresh mocks with persisted data
  mockAsyncStorage.getItem.mockImplementation((key: string) => {
    const value = storage.get(key);
    return Promise.resolve(value || null);
  });
  
  mockAsyncStorage.setItem.mockImplementation((key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  });
  
  return storage;
};

export const createOfflineScenario = () => {
  const requests: QueuedRequest[] = [];
  const timeline: Array<{ time: number; action: string; data?: any }> = [];
  
  return {
    addRequest: (request: Partial<QueuedRequest>) => {
      const fullRequest = createMockQueuedRequest(request);
      requests.push(fullRequest);
      timeline.push({
        time: Date.now(),
        action: 'ADD_REQUEST',
        data: fullRequest,
      });
      return fullRequest;
    },
    
    goOffline: () => {
      timeline.push({
        time: Date.now(),
        action: 'GO_OFFLINE',
      });
    },
    
    goOnline: () => {
      timeline.push({
        time: Date.now(),
        action: 'GO_ONLINE',
      });
    },
    
    syncQueue: () => {
      timeline.push({
        time: Date.now(),
        action: 'SYNC_QUEUE',
        data: { count: requests.length },
      });
    },
    
    getRequests: () => requests,
    getTimeline: () => timeline,
    
    reset: () => {
      requests.length = 0;
      timeline.length = 0;
    },
  };
};

export const assertQueueState = (
  actual: any,
  expected: {
    totalCount?: number;
    pendingCount?: number;
    failedCount?: number;
  }
) => {
  if (expected.totalCount !== undefined) {
    expect(actual.totalCount).toBe(expected.totalCount);
  }
  
  if (expected.pendingCount !== undefined) {
    expect(actual.pendingCount).toBe(expected.pendingCount);
  }
  
  if (expected.failedCount !== undefined) {
    expect(actual.failedCount).toBe(expected.failedCount);
  }
};
