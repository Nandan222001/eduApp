import { useState, useEffect } from 'react';
import { offlineQueue, QueuedRequestWithId } from '@/utils/offlineQueue';

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedRequestWithId[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadQueue = async () => {
      const currentQueue = await offlineQueue.getQueue();
      setQueue(currentQueue);
    };

    loadQueue();

    const unsubscribe = offlineQueue.subscribe((updatedQueue) => {
      setQueue(updatedQueue);
    });

    return unsubscribe;
  }, []);

  const processQueue = async () => {
    setIsProcessing(true);
    try {
      await offlineQueue.processQueue();
    } finally {
      setIsProcessing(false);
    }
  };

  const clearQueue = async () => {
    await offlineQueue.clearQueue();
  };

  const getQueueByType = async (type: 'attendance' | 'assignment' | 'other') => {
    return await offlineQueue.getQueueByType(type);
  };

  return {
    queue,
    queueCount: queue.length,
    isProcessing,
    processQueue,
    clearQueue,
    getQueueByType,
  };
};

export default useOfflineQueue;
