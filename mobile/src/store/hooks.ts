import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import type { RootState, AppDispatch } from './index';
import { offlineQueueManager, QueuedRequest, QueuedRequestType } from '../utils/offlineQueue';
import { networkStatusManager } from '../utils/networkStatus';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    setQueue(offlineQueueManager.getQueue());
    setIsConnected(networkStatusManager.getIsConnected());

    const unsubscribeQueue = offlineQueueManager.subscribe(setQueue);
    const unsubscribeNetwork = networkStatusManager.subscribe(setIsConnected);

    return () => {
      unsubscribeQueue();
      unsubscribeNetwork();
    };
  }, []);

  const addToQueue = async (
    type: QueuedRequestType,
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: any,
    headers?: Record<string, string>
  ) => {
    return await offlineQueueManager.addToQueue({
      type,
      url,
      method,
      data,
      headers,
    });
  };

  const processQueue = async () => {
    return await offlineQueueManager.processQueue();
  };

  const clearQueue = async () => {
    return await offlineQueueManager.clearQueue();
  };

  const removeFromQueue = async (id: string) => {
    return await offlineQueueManager.removeFromQueue(id);
  };

  return {
    queue,
    queueCount: queue.length,
    isConnected,
    addToQueue,
    processQueue,
    clearQueue,
    removeFromQueue,
  };
};
