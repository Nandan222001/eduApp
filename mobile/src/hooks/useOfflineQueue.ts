import { useEffect, useState } from 'react';
import { offlineQueueManager, QueuedOperation } from '@utils/offlineQueue';
import { useAppDispatch } from '@store/hooks';
import { setQueuedOperations } from '@store/slices/offlineSlice';

export const useOfflineQueue = () => {
  const dispatch = useAppDispatch();
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const updateQueue = (operations: QueuedOperation[]) => {
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
