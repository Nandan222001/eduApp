import Constants from 'expo-constants';
import crashReporting from '../services/crashReporting';
import analyticsService from '../services/analytics';
import otaUpdateService from '../services/otaUpdates';

interface MonitoringConfig {
  sentryDsn?: string;
  sentryEnvironment?: string;
  amplitudeApiKey?: string;
  enableInDevelopment?: boolean;
}

/**
 * Initialize all monitoring services
 */
export async function initializeMonitoring(config?: MonitoringConfig): Promise<void> {
  const appConfig = Constants.expoConfig?.extra || {};
  const isDevelopment = appConfig.appEnv === 'development';

  const finalConfig: MonitoringConfig = {
    sentryDsn: config?.sentryDsn || appConfig.sentryDsn,
    sentryEnvironment: config?.sentryEnvironment || appConfig.appEnv || 'development',
    amplitudeApiKey: config?.amplitudeApiKey || appConfig.amplitudeApiKey,
    enableInDevelopment: config?.enableInDevelopment || false,
  };

  console.log('[Monitoring] Initializing services...', {
    environment: finalConfig.sentryEnvironment,
    isDevelopment,
  });

  try {
    // Initialize crash reporting
    if (finalConfig.sentryDsn && (finalConfig.enableInDevelopment || !isDevelopment)) {
      crashReporting.init({
        dsn: finalConfig.sentryDsn,
        environment: finalConfig.sentryEnvironment || 'development',
        enableInExpoDevelopment: finalConfig.enableInDevelopment,
        debug: isDevelopment,
      });
      console.log('[Monitoring] Crash reporting initialized');
    }

    // Initialize analytics
    if ((appConfig.enableAnalytics || finalConfig.enableInDevelopment) && !isDevelopment) {
      await analyticsService.init({
        amplitudeApiKey: finalConfig.amplitudeApiKey,
        enableInDevelopment: finalConfig.enableInDevelopment,
        useFirebase: true,
      });
      console.log('[Monitoring] Analytics initialized');
    }

    // Initialize OTA updates
    if (!isDevelopment) {
      otaUpdateService.init({
        checkOnLaunch: true,
        checkInterval: 3600000, // 1 hour
        showUpdatePrompt: true,
      });
      console.log('[Monitoring] OTA updates initialized');
    }

    console.log('[Monitoring] All services initialized successfully');
  } catch (error) {
    console.error('[Monitoring] Initialization failed:', error);
    // Don't throw - monitoring failures shouldn't prevent app from working
  }
}

/**
 * Set user context for all monitoring services
 */
export async function setMonitoringUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}): Promise<void> {
  try {
    crashReporting.setUser(user);
    await analyticsService.setUser(user.id, {
      email: user.email,
      username: user.username,
      role: user.role,
    });
    console.log('[Monitoring] User context set:', user.id);
  } catch (error) {
    console.error('[Monitoring] Failed to set user context:', error);
  }
}

/**
 * Clear user context (on logout)
 */
export async function clearMonitoringUser(): Promise<void> {
  try {
    crashReporting.clearUser();
    await analyticsService.clearUser();
    console.log('[Monitoring] User context cleared');
  } catch (error) {
    console.error('[Monitoring] Failed to clear user context:', error);
  }
}

/**
 * Cleanup on app close
 */
export async function cleanupMonitoring(): Promise<void> {
  try {
    await analyticsService.flush();
    await crashReporting.flush();
    otaUpdateService.cleanup();
    console.log('[Monitoring] Cleanup completed');
  } catch (error) {
    console.error('[Monitoring] Cleanup failed:', error);
  }
}

export default {
  initializeMonitoring,
  setMonitoringUser,
  clearMonitoringUser,
  cleanupMonitoring,
};
