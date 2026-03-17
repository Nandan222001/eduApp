import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

interface CrashReportingConfig {
  dsn: string;
  environment: string;
  enableInExpoDevelopment?: boolean;
  debug?: boolean;
}

class CrashReportingService {
  private initialized = false;

  /**
   * Initialize Sentry crash reporting
   */
  init(config: CrashReportingConfig): void {
    const { dsn, environment, enableInExpoDevelopment = false, debug = false } = config;

    // Don't initialize in development unless explicitly enabled
    if (__DEV__ && !enableInExpoDevelopment) {
      console.log('[CrashReporting] Skipping initialization in development mode');
      return;
    }

    if (!dsn) {
      console.warn('[CrashReporting] No DSN provided, skipping initialization');
      return;
    }

    try {
      Sentry.init({
        dsn,
        debug,
        environment,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 10000,
        tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
        attachStacktrace: true,
        enableNative: true,
        enableNativeCrashHandling: true,
        enableNativeNagger: false,
        maxBreadcrumbs: 50,
        beforeSend: event => {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers['X-Auth-Token'];
          }
          return event;
        },
        integrations: [
          new Sentry.ReactNativeTracing({
            tracingOrigins: ['localhost', /^\//],
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          }),
        ],
      });

      this.setDeviceContext();
      this.initialized = true;
      console.log('[CrashReporting] Initialized successfully');
    } catch (error) {
      console.error('[CrashReporting] Initialization failed:', error);
    }
  }

  /**
   * Set device and app context
   */
  private setDeviceContext(): void {
    Sentry.setContext('device', {
      model: Device.modelName,
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platform: Device.platformApiLevel,
    });

    Sentry.setContext('app', {
      version: Application.nativeApplicationVersion || Constants.expoConfig?.version,
      buildNumber: Application.nativeBuildVersion,
      bundleId: Application.applicationId,
      expoVersion: Constants.expoVersion,
    });
  }

  /**
   * Set user context for crash reports
   */
  setUser(user: { id: string; email?: string; username?: string; role?: string }): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>,
    level?: Sentry.SeverityLevel
  ): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: level || 'info',
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Log an error
   */
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      console.error('[CrashReporting] Error (not sent):', error);
      return;
    }

    if (context) {
      Sentry.setContext('error_context', context);
    }

    Sentry.captureException(error);
  }

  /**
   * Log a message
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, any>
  ): void {
    if (!this.initialized) {
      console.log('[CrashReporting] Message (not sent):', message);
      return;
    }

    if (context) {
      Sentry.setContext('message_context', context);
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * Set custom context/tags
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  setContext(name: string, context: Record<string, any>): void {
    if (!this.initialized) return;
    Sentry.setContext(name, context);
  }

  /**
   * Track navigation for breadcrumbs
   */
  setCurrentRoute(routeName: string, params?: Record<string, any>): void {
    if (!this.initialized) return;

    this.addBreadcrumb(`Navigation to ${routeName}`, 'navigation', params);
    Sentry.setTag('current_route', routeName);
  }

  /**
   * Manually flush events (useful before app closes)
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      await Sentry.flush(timeout);
      return true;
    } catch (error) {
      console.error('[CrashReporting] Flush failed:', error);
      return false;
    }
  }

  /**
   * Close SDK (cleanup)
   */
  async close(): Promise<void> {
    if (!this.initialized) return;

    try {
      await Sentry.close();
      this.initialized = false;
    } catch (error) {
      console.error('[CrashReporting] Close failed:', error);
    }
  }
}

export const crashReporting = new CrashReportingService();
export default crashReporting;
