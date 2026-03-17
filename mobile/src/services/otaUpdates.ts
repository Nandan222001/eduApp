import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crashReporting from './crashReporting';
import analyticsService from './analytics';

interface UpdateCheckResult {
  isAvailable: boolean;
  manifest?: Updates.Manifest;
}

interface UpdateConfig {
  checkOnLaunch?: boolean;
  checkInterval?: number; // in milliseconds
  fallbackToCacheTimeout?: number;
  showUpdatePrompt?: boolean;
}

const UPDATE_CHECK_KEY = 'last_update_check';
const UPDATE_DISMISSED_KEY = 'update_dismissed_version';

class OTAUpdateService {
  private checkInterval?: NodeJS.Timeout;
  private config: UpdateConfig = {
    checkOnLaunch: true,
    checkInterval: 3600000, // 1 hour
    fallbackToCacheTimeout: 0,
    showUpdatePrompt: true,
  };

  /**
   * Initialize OTA update service
   */
  init(config?: Partial<UpdateConfig>): void {
    if (__DEV__) {
      console.log('[OTA] Skipping initialization in development mode');
      return;
    }

    this.config = { ...this.config, ...config };

    if (this.config.checkOnLaunch) {
      this.checkForUpdates();
    }

    if (this.config.checkInterval) {
      this.startPeriodicChecks(this.config.checkInterval);
    }

    console.log('[OTA] Initialized successfully');
  }

  /**
   * Check if app is running from embedded bundle or OTA update
   */
  isEmbeddedLaunch(): boolean {
    return Updates.isEmbeddedLaunch;
  }

  /**
   * Get current update ID
   */
  getCurrentUpdateId(): string | undefined {
    return Updates.updateId;
  }

  /**
   * Get release channel
   */
  getReleaseChannel(): string {
    return Updates.channel || 'default';
  }

  /**
   * Check for updates
   */
  async checkForUpdates(silent: boolean = false): Promise<UpdateCheckResult> {
    try {
      // Don't check in development
      if (__DEV__) {
        return { isAvailable: false };
      }

      // Don't check if running in Expo Go
      if (!Updates.isEmbeddedLaunch && !Updates.updateId) {
        console.log('[OTA] Running in Expo Go, skipping update check');
        return { isAvailable: false };
      }

      console.log('[OTA] Checking for updates...');
      analyticsService.trackEvent('ota_check_started');

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        console.log('[OTA] Update available:', update.manifest);
        analyticsService.trackEvent('ota_update_available', {
          update_id: update.manifest?.id,
        });

        // Store last check time
        await AsyncStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());

        if (!silent && this.config.showUpdatePrompt) {
          await this.promptForUpdate();
        }

        return { isAvailable: true, manifest: update.manifest };
      } else {
        console.log('[OTA] No updates available');
        await AsyncStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());
        return { isAvailable: false };
      }
    } catch (error) {
      console.error('[OTA] Check for updates failed:', error);
      crashReporting.captureError(error as Error, { context: 'ota_check' });
      analyticsService.trackError(error as Error, { context: 'ota_check' });
      return { isAvailable: false };
    }
  }

  /**
   * Fetch and apply update
   */
  async fetchAndApplyUpdate(reloadImmediately: boolean = false): Promise<boolean> {
    try {
      console.log('[OTA] Fetching update...');
      analyticsService.trackEvent('ota_fetch_started');

      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        console.log('[OTA] Update fetched successfully');
        analyticsService.trackEvent('ota_fetch_success', {
          update_id: result.manifest?.id,
        });

        if (reloadImmediately) {
          await this.reloadApp();
        } else {
          this.scheduleReload();
        }

        return true;
      } else {
        console.log('[OTA] Already on latest version');
        return false;
      }
    } catch (error) {
      console.error('[OTA] Fetch update failed:', error);
      crashReporting.captureError(error as Error, { context: 'ota_fetch' });
      analyticsService.trackError(error as Error, { context: 'ota_fetch' });
      return false;
    }
  }

  /**
   * Reload app to apply update
   */
  async reloadApp(): Promise<void> {
    try {
      console.log('[OTA] Reloading app...');
      analyticsService.trackEvent('ota_reload');
      await analyticsService.flush();
      await crashReporting.flush();
      await Updates.reloadAsync();
    } catch (error) {
      console.error('[OTA] Reload failed:', error);
      crashReporting.captureError(error as Error, { context: 'ota_reload' });
    }
  }

  /**
   * Schedule app reload for later
   */
  private scheduleReload(): void {
    // Could implement background reload logic here
    console.log('[OTA] Update will be applied on next app restart');
  }

  /**
   * Prompt user to update
   */
  private async promptForUpdate(): Promise<void> {
    const dismissedVersion = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
    const currentVersion = Updates.updateId;

    // Don't show prompt if user dismissed this version
    if (dismissedVersion === currentVersion) {
      return;
    }

    return new Promise(resolve => {
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Would you like to update now?',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, currentVersion || '');
              analyticsService.trackEvent('ota_update_dismissed');
              resolve();
            },
          },
          {
            text: 'Update',
            onPress: async () => {
              analyticsService.trackEvent('ota_update_accepted');
              await this.fetchAndApplyUpdate(true);
              resolve();
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Start periodic update checks
   */
  private startPeriodicChecks(interval: number): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkForUpdates(true);
    }, interval);

    console.log(`[OTA] Started periodic checks every ${interval / 1000}s`);
  }

  /**
   * Stop periodic update checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      console.log('[OTA] Stopped periodic checks');
    }
  }

  /**
   * Get last update check time
   */
  async getLastCheckTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
      return timestamp ? new Date(parseInt(timestamp, 10)) : null;
    } catch (error) {
      console.error('[OTA] Get last check time failed:', error);
      return null;
    }
  }

  /**
   * Force check and update
   */
  async forceUpdate(): Promise<void> {
    try {
      const { isAvailable } = await this.checkForUpdates(true);

      if (isAvailable) {
        await this.fetchAndApplyUpdate(true);
      } else {
        Alert.alert('No Updates', 'You are already on the latest version.');
      }
    } catch (error) {
      console.error('[OTA] Force update failed:', error);
      Alert.alert('Update Failed', 'Unable to check for updates. Please try again later.');
    }
  }

  /**
   * Clear update cache
   */
  async clearUpdateCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(UPDATE_CHECK_KEY);
      await AsyncStorage.removeItem(UPDATE_DISMISSED_KEY);
      console.log('[OTA] Cache cleared');
    } catch (error) {
      console.error('[OTA] Clear cache failed:', error);
    }
  }

  /**
   * Get update info
   */
  getUpdateInfo(): {
    isEmbeddedLaunch: boolean;
    updateId?: string;
    channel: string;
    runtimeVersion?: string;
  } {
    return {
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      updateId: Updates.updateId,
      channel: Updates.channel || 'default',
      runtimeVersion: Updates.runtimeVersion,
    };
  }

  /**
   * Cleanup on app close
   */
  cleanup(): void {
    this.stopPeriodicChecks();
  }
}

export const otaUpdateService = new OTAUpdateService();
export default otaUpdateService;
