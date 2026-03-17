import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { offlineQueueManager } from './offlineQueue';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Background sync task started');
    
    if (offlineQueueManager.isConnected()) {
      await offlineQueueManager.syncQueue();
      console.log('Background sync completed successfully');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    
    console.log('Device offline, skipping sync');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundSyncService {
  private static isRegistered: boolean = false;

  static async register(): Promise<void> {
    if (this.isRegistered) {
      console.log('Background sync already registered');
      return;
    }

    try {
      const status = await BackgroundFetch.getStatusAsync();
      
      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
        
        this.isRegistered = true;
        console.log('Background sync registered successfully');
      } else {
        console.warn('Background fetch not available:', status);
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  static async unregister(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
      console.log('Background sync unregistered');
    } catch (error) {
      console.error('Failed to unregister background sync:', error);
    }
  }

  static async isTaskRegistered(): Promise<boolean> {
    try {
      const tasks = await TaskManager.getRegisteredTasksAsync();
      return tasks.some(task => task.taskName === BACKGROUND_SYNC_TASK);
    } catch (error) {
      console.error('Failed to check task registration:', error);
      return false;
    }
  }

  static async triggerManualSync(): Promise<void> {
    try {
      await offlineQueueManager.syncQueue();
      console.log('Manual sync completed');
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }
}
