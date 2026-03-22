import { backgroundSyncService } from './backgroundSync';
import { offlineQueueManager } from './offlineQueue';
import { fileDownloadManager } from './fileDownloadManager';

export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AppInitializer] Already initialized');
      return;
    }

    try {
      console.log('[AppInitializer] Starting initialization...');

      await this.initializeFileDownloadManager();
      await this.initializeBackgroundSync();
      await this.processOfflineQueue();

      this.isInitialized = true;
      console.log('[AppInitializer] Initialization complete');
    } catch (error) {
      console.error('[AppInitializer] Initialization failed:', error);
      throw error;
    }
  }

  private async initializeFileDownloadManager(): Promise<void> {
    try {
      console.log('[AppInitializer] Initializing file download manager...');
      await fileDownloadManager.initialize();
      console.log('[AppInitializer] File download manager initialized');
    } catch (error) {
      console.error('[AppInitializer] File download manager initialization failed:', error);
    }
  }

  private async initializeBackgroundSync(): Promise<void> {
    try {
      console.log('[AppInitializer] Registering background sync...');
      await backgroundSyncService.register();
      console.log('[AppInitializer] Background sync registered');
    } catch (error) {
      console.error('[AppInitializer] Background sync registration failed:', error);
    }
  }

  private async processOfflineQueue(): Promise<void> {
    try {
      const queueState = offlineQueueManager.getQueueState();
      console.log('[AppInitializer] Queue state:', {
        total: queueState.totalCount,
        pending: queueState.pendingCount,
        failed: queueState.failedCount,
      });

      if (offlineQueueManager.isConnected() && queueState.pendingCount > 0) {
        console.log('[AppInitializer] Processing pending requests...');
        await offlineQueueManager.processQueue();
        console.log('[AppInitializer] Queue processed');
      }
    } catch (error) {
      console.error('[AppInitializer] Queue processing failed:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('[AppInitializer] Cleaning up...');
      offlineQueueManager.dispose();
      this.isInitialized = false;
      console.log('[AppInitializer] Cleanup complete');
    } catch (error) {
      console.error('[AppInitializer] Cleanup failed:', error);
    }
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export const appInitializer = AppInitializer.getInstance();
