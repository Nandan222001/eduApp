import { useEffect, useState } from 'react';
import { offlineQueueManager, QueuedRequest } from '@utils/offlineQueue';
import { useAppDispatch } from '@store/hooks';
import { setQueuedOperations } from '@store/slices/offlineSlice';

export const useOfflineQueue = () => {
  const dispatch = useAppDispatch();
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const updateQueue = (operations: QueuedRequest[]) => {
      setQueue(operations);
      setQueueSize(operations.length);
      dispatch(setQueuedOperations(operations));
    };

    const initialQueue = offlineQueueManager.getQueue();
    updateQueue(initialQueue);

    const unsubscribe = offlineQueueManager.subscribe(updateQueue);

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return {
    queue,
    queueSize,
    isConnected: offlineQueueManager.isConnected(),
  };
};
