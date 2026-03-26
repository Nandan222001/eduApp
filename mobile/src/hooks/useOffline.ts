import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { offlineQueueManager, QueuedRequestType } from '@utils/offlineQueue';
import {
  setOnlineStatus,
  addPendingAction,
  syncPendingActions,
} from '@store/slices/offlineSlice';
import NetInfo from '@react-native-community/netinfo';

interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

export const useOffline = () => {
  const dispatch = useAppDispatch();
  const {
    isOnline,
    queuedOperations,
    pendingActions,
    lastSyncTime,
    syncInProgress,
    autoSyncEnabled,
  } = useAppSelector(state => state.offline);

  // Queue an API request for later processing
  const queueRequest = useCallback(
    async (
      type: QueuedRequestType,
      url: string,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      data?: unknown,
      headers?: Record<string, string>,
      metadata?: Record<string, unknown>
    ) => {
      const requestId = await offlineQueueManager.addRequest(
        type,
        url,
        method,
        data,
        headers,
        metadata
      );
      return requestId;
    },
    []
  );

  // Queue a Redux action for later dispatch
  const queueAction = useCallback(
    (actionType: string, payload: unknown) => {
      const action: PendingAction = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: actionType,
        payload,
        timestamp: Date.now(),
      };
      dispatch(addPendingAction(action));
      return action.id;
    },
    [dispatch]
  );

  // Manually trigger sync
  const triggerSync = useCallback(async () => {
    if (isOnline && !syncInProgress) {
      await offlineQueueManager.processQueue();
      await dispatch(syncPendingActions()).unwrap();
    }
  }, [isOnline, syncInProgress, dispatch]);

  // Get queue state
  const getQueueState = useCallback(() => {
    return offlineQueueManager.getQueueState();
  }, []);

  // Check if connected
  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    const connected = state.isConnected === true && state.isInternetReachable === true;
    dispatch(setOnlineStatus(connected));
    return connected;
  }, [dispatch]);

  // Clear all queued operations
  const clearQueue = useCallback(async () => {
    await offlineQueueManager.clearQueue();
  }, []);

  // Get requests by type
  const getRequestsByType = useCallback((type: QueuedRequestType) => {
    return offlineQueueManager.getRequestsByType(type);
  }, []);

  // Remove specific request from queue
  const removeRequest = useCallback(async (requestId: string) => {
    await offlineQueueManager.removeFromQueue(requestId);
  }, []);

  return {
    // State
    isOnline,
    queuedOperations,
    pendingActions,
    lastSyncTime,
    syncInProgress,
    autoSyncEnabled,
    
    // Methods
    queueRequest,
    queueAction,
    triggerSync,
    getQueueState,
    checkConnection,
    clearQueue,
    getRequestsByType,
    removeRequest,
  };
};

export default useOffline;
