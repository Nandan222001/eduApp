import { useState, useEffect, useCallback } from 'react';
import { offlineQueueManager, OfflineQueueState, QueuedRequest, QueuedRequestType } from '@utils/offlineQueue';
import { backgroundSyncService } from '@utils/backgroundSync';

export const useOfflineSync = () => {
  const [queue, setQueue] = useState<QueuedRequest[]>(offlineQueueManager.getQueue());
  const [queueState, setQueueState] = useState<OfflineQueueState>(
    offlineQueueManager.getQueueState()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(offlineQueueManager.isConnected());

  useEffect(() => {
    const unsubscribe = offlineQueueManager.subscribe(newQueue => {
      setQueue(newQueue);
      setQueueState(offlineQueueManager.getQueueState());
      setIsOnline(offlineQueueManager.isConnected());
    });

    backgroundSyncService.getLastSyncTimestamp().then(timestamp => {
      setLastSyncResult(timestamp);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      const result = await backgroundSyncService.triggerManualSync();
      setLastSyncResult(result);
      return result;
    } catch (error) {
      console.error('[useOfflineSync] Manual sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const clearQueue = useCallback(async () => {
    await offlineQueueManager.clearQueue();
  }, []);

  const clearFailedRequests = useCallback(async () => {
    await offlineQueueManager.clearFailedRequests();
  }, []);

  const retryFailedRequests = useCallback(async () => {
    setIsSyncing(true);
    try {
      await offlineQueueManager.retryFailedRequests();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const getRequestsByType = useCallback((type: QueuedRequestType) => {
    return offlineQueueManager.getRequestsByType(type);
  }, []);

  return {
    queue,
    queueState,
    isOnline,
    isSyncing,
    lastSyncResult,
    triggerManualSync,
    clearQueue,
    clearFailedRequests,
    retryFailedRequests,
    getRequestsByType,
  };
};
