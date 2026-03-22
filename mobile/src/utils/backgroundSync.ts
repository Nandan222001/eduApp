import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineQueueManager } from './offlineQueue';

// Lazy load expo modules only on native platforms
let BackgroundFetch: any = null;
let TaskManager: any = null;

if (Platform.OS !== 'web') {
  BackgroundFetch = require('expo-background-fetch');
  TaskManager = require('expo-task-manager');
}

const BACKGROUND_SYNC_TASK = 'background-sync-task';
const LAST_SYNC_KEY = '@last_sync_timestamp';

if (Platform.OS !== 'web' && TaskManager) {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      console.log('Background sync task running...');
      
      await offlineQueueManager.processQueue();
      
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background sync failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export const backgroundSyncService = {
  async register(): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Background sync not available on web');
      return;
    }
    
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background sync registered successfully');
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  },

  async unregister(): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Background sync not available on web');
      return;
    }
    
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('Background sync unregistered successfully');
    } catch (error) {
      console.error('Failed to unregister background sync:', error);
    }
  },

  async getStatus(): Promise<any | null> {
    if (Platform.OS === 'web') {
      return null;
    }
    
    try {
      return await BackgroundFetch.getStatusAsync();
    } catch (error) {
      console.error('Failed to get background sync status:', error);
      return null;
    }
  },

  async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  },

  async triggerManualSync(): Promise<void> {
    try {
      await offlineQueueManager.processQueue();
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  },
};

// Export with capital letter for backwards compatibility
export const BackgroundSyncService = backgroundSyncService;
