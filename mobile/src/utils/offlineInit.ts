import { BackgroundSyncService } from './backgroundSync';
import { offlineQueueManager } from './offlineQueue';
import { store } from '@store/store';
import { setOnlineStatus, setQueuedOperations } from '@store/slices/offlineSlice';
import NetInfo from '@react-native-community/netinfo';

export const initializeOfflineSupport = async (): Promise<void> => {
  try {
    console.log('Initializing offline support...');

    const netInfoState = await NetInfo.fetch();
    const isOnline = netInfoState.isConnected === true && netInfoState.isInternetReachable === true;
    store.dispatch(setOnlineStatus(isOnline));

    const initialQueue = offlineQueueManager.getQueue();
    store.dispatch(setQueuedOperations(initialQueue));

    offlineQueueManager.subscribe(queue => {
      store.dispatch(setQueuedOperations(queue));
    });

    NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      store.dispatch(setOnlineStatus(online));
      
      if (online && offlineQueueManager.getQueueSize() > 0) {
        offlineQueueManager.syncQueue();
      }
    });

    await BackgroundSyncService.register();

    console.log('Offline support initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline support:', error);
  }
};

export const cleanupOfflineSupport = async (): Promise<void> => {
  try {
    await BackgroundSyncService.unregister();
    console.log('Offline support cleaned up');
  } catch (error) {
    console.error('Failed to cleanup offline support:', error);
  }
};
