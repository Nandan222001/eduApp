import * as amplitude from '@amplitude/analytics-react-native';
import analytics from '@react-native-firebase/analytics';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

interface AnalyticsConfig {
  amplitudeApiKey?: string;
  enableInDevelopment?: boolean;
  useFirebase?: boolean;
}

interface UserProperties {
  userId?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface EventProperties {
  [key: string]: any;
}

class AnalyticsService {
  private initialized = false;
  private amplitudeEnabled = false;
  private firebaseEnabled = false;

  /**
   * Initialize analytics services
   */
  async init(config: AnalyticsConfig): Promise<void> {
    const { amplitudeApiKey, enableInDevelopment = false, useFirebase = true } = config;

    // Don't initialize in development unless explicitly enabled
    if (__DEV__ && !enableInDevelopment) {
      console.log('[Analytics] Skipping initialization in development mode');
      return;
    }

    try {
      // Initialize Amplitude
      if (amplitudeApiKey) {
        await amplitude.init(amplitudeApiKey, undefined, {
          trackingOptions: {
            ipAddress: false,
            language: true,
            platform: true,
          },
          minIdLength: 1,
        });
        this.amplitudeEnabled = true;
        console.log('[Analytics] Amplitude initialized');
      }

      // Initialize Firebase Analytics
      if (useFirebase) {
        await analytics().setAnalyticsCollectionEnabled(true);
        this.firebaseEnabled = true;
        console.log('[Analytics] Firebase Analytics initialized');
      }

      // Set default properties
      await this.setDefaultProperties();

      this.initialized = true;
      console.log('[Analytics] Initialized successfully');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  /**
   * Set default device and app properties
   */
  private async setDefaultProperties(): Promise<void> {
    const defaultProperties = {
      device_model: Device.modelName,
      device_brand: Device.brand,
      os_name: Device.osName,
      os_version: Device.osVersion,
      app_version: Constants.expoConfig?.version,
      expo_version: Constants.expoVersion,
    };

    if (this.amplitudeEnabled) {
      const identifyEvent = new amplitude.Identify();
      Object.entries(defaultProperties).forEach(([key, value]) => {
        identifyEvent.set(key, value);
      });
      await amplitude.identify(identifyEvent);
    }

    if (this.firebaseEnabled) {
      await Promise.all(
        Object.entries(defaultProperties).map(([key, value]) =>
          analytics().setUserProperty(key, String(value))
        )
      );
    }
  }

  /**
   * Set user ID and properties
   */
  async setUser(userId: string, properties?: UserProperties): Promise<void> {
    if (!this.initialized) return;

    try {
      if (this.amplitudeEnabled) {
        await amplitude.setUserId(userId);

        if (properties) {
          const identifyEvent = new amplitude.Identify();
          Object.entries(properties).forEach(([key, value]) => {
            identifyEvent.set(key, value);
          });
          await amplitude.identify(identifyEvent);
        }
      }

      if (this.firebaseEnabled) {
        await analytics().setUserId(userId);

        if (properties) {
          await Promise.all(
            Object.entries(properties).map(([key, value]) =>
              analytics().setUserProperty(key, String(value))
            )
          );
        }
      }
    } catch (error) {
      console.error('[Analytics] Set user failed:', error);
    }
  }

  /**
   * Clear user data (on logout)
   */
  async clearUser(): Promise<void> {
    if (!this.initialized) return;

    try {
      if (this.amplitudeEnabled) {
        await amplitude.setUserId(undefined);
        await amplitude.reset();
      }

      if (this.firebaseEnabled) {
        await analytics().setUserId(null);
      }
    } catch (error) {
      console.error('[Analytics] Clear user failed:', error);
    }
  }

  /**
   * Track an event
   */
  async trackEvent(eventName: string, properties?: EventProperties): Promise<void> {
    if (!this.initialized) {
      console.log('[Analytics] Event (not tracked):', eventName, properties);
      return;
    }

    try {
      if (this.amplitudeEnabled) {
        await amplitude.track(eventName, properties);
      }

      if (this.firebaseEnabled) {
        await analytics().logEvent(eventName, properties);
      }
    } catch (error) {
      console.error('[Analytics] Track event failed:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!this.initialized) return;

    try {
      await this.trackEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      if (this.firebaseEnabled) {
        await analytics().logScreenView({
          screen_name: screenName,
          screen_class: screenClass || screenName,
        });
      }
    } catch (error) {
      console.error('[Analytics] Track screen view failed:', error);
    }
  }

  /**
   * Track user engagement events
   */
  async trackEngagement(action: string, properties?: EventProperties): Promise<void> {
    await this.trackEvent(`engagement_${action}`, properties);
  }

  /**
   * Track conversion events
   */
  async trackConversion(conversionType: string, value?: number, currency?: string): Promise<void> {
    await this.trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency,
    });
  }

  /**
   * Track errors
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.initialized) return;

    try {
      if (this.amplitudeEnabled) {
        const identifyEvent = new amplitude.Identify();
        Object.entries(properties).forEach(([key, value]) => {
          identifyEvent.set(key, value);
        });
        await amplitude.identify(identifyEvent);
      }

      if (this.firebaseEnabled) {
        await Promise.all(
          Object.entries(properties).map(([key, value]) =>
            analytics().setUserProperty(key, String(value))
          )
        );
      }
    } catch (error) {
      console.error('[Analytics] Set user properties failed:', error);
    }
  }

  /**
   * Increment user property
   */
  async incrementUserProperty(property: string, value: number = 1): Promise<void> {
    if (!this.initialized || !this.amplitudeEnabled) return;

    try {
      const identifyEvent = new amplitude.Identify();
      identifyEvent.add(property, value);
      await amplitude.identify(identifyEvent);
    } catch (error) {
      console.error('[Analytics] Increment user property failed:', error);
    }
  }

  /**
   * Track revenue (for in-app purchases)
   */
  async trackRevenue(amount: number, productId?: string, quantity: number = 1): Promise<void> {
    if (!this.initialized) return;

    try {
      if (this.amplitudeEnabled) {
        const revenue = new amplitude.Revenue();
        revenue.setPrice(amount);
        if (productId) revenue.setProductId(productId);
        revenue.setQuantity(quantity);
        await amplitude.revenue(revenue);
      }

      await this.trackEvent('purchase', {
        value: amount,
        product_id: productId,
        quantity,
      });
    } catch (error) {
      console.error('[Analytics] Track revenue failed:', error);
    }
  }

  /**
   * Flush events (ensure they're sent before app closes)
   */
  async flush(): Promise<void> {
    if (!this.initialized || !this.amplitudeEnabled) return;

    try {
      await amplitude.flush();
    } catch (error) {
      console.error('[Analytics] Flush failed:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

// Convenience functions for common events
export const trackAppOpen = () => analyticsService.trackEvent('app_open');
export const trackAppClose = () => analyticsService.trackEvent('app_close');
export const trackLogin = (method: string) => analyticsService.trackEvent('login', { method });
export const trackLogout = () => analyticsService.trackEvent('logout');
export const trackSignup = (method: string) => analyticsService.trackEvent('signup', { method });
export const trackSearch = (query: string, resultsCount: number) =>
  analyticsService.trackEvent('search', { query, results_count: resultsCount });
export const trackShare = (contentType: string, contentId: string) =>
  analyticsService.trackEvent('share', { content_type: contentType, content_id: contentId });
