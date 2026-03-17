import { env } from '@/config/env';

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, unknown> | string
    ) => void;
    dataLayer?: unknown[];
  }
}

interface AnalyticsEvent {
  event_name: string;
  event_type: string;
  properties?: Record<string, unknown>;
}

class Analytics {
  private isInitialized = false;

  init(): void {
    if (!GA4_MEASUREMENT_ID || env.isDevelopment) {
      console.log('Google Analytics is disabled in development mode');
      return;
    }

    if (this.isInitialized) {
      console.warn('Google Analytics is already initialized');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: false,
      app_name: env.appName,
      app_version: env.appVersion,
    });

    this.isInitialized = true;
    console.log('Google Analytics initialized');
  }

  pageView(path: string, title?: string): void {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }

  event(event: AnalyticsEvent): void {
    if (!this.isInitialized || !window.gtag) return;

    const { event_name, event_type, properties = {} } = event;

    window.gtag('event', event_name, {
      event_category: event_type,
      ...properties,
    });
  }

  setUserId(userId: string): void {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('config', GA4_MEASUREMENT_ID, {
      user_id: userId,
    });
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('set', 'user_properties', properties);
  }

  clearUser(): void {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('config', GA4_MEASUREMENT_ID, {
      user_id: undefined,
    });
  }

  timing(name: string, value: number, category?: string, label?: string): void {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'timing_complete', {
      name,
      value,
      event_category: category || 'Performance',
      event_label: label,
    });
  }

  exception(description: string, fatal = false): void {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'exception', {
      description,
      fatal,
    });
  }
}

export const analytics = new Analytics();

export const trackEvent = (event: AnalyticsEvent): void => {
  analytics.event(event);
};

export const trackPageView = (path: string, title?: string): void => {
  analytics.pageView(path, title);
};

export const trackFeatureUsage = (
  featureName: string,
  properties?: Record<string, unknown>
): void => {
  analytics.event({
    event_name: 'feature_usage',
    event_type: 'engagement',
    properties: {
      feature_name: featureName,
      ...properties,
    },
  });
};

export const trackConversion = (
  conversionType: string,
  value?: number,
  properties?: Record<string, unknown>
): void => {
  analytics.event({
    event_name: 'conversion',
    event_type: 'conversion',
    properties: {
      conversion_type: conversionType,
      value,
      currency: 'USD',
      ...properties,
    },
  });
};

export const trackClick = (elementId: string, properties?: Record<string, unknown>): void => {
  analytics.event({
    event_name: 'click',
    event_type: 'interaction',
    properties: {
      element_id: elementId,
      ...properties,
    },
  });
};

export const trackTiming = (
  name: string,
  value: number,
  category?: string,
  label?: string
): void => {
  analytics.timing(name, value, category, label);
};

export const trackException = (description: string, fatal = false): void => {
  analytics.exception(description, fatal);
};

export const setAnalyticsUserId = (userId: string): void => {
  analytics.setUserId(userId);
};

export const setAnalyticsUserProperties = (properties: Record<string, unknown>): void => {
  analytics.setUserProperties(properties);
};

export const clearAnalyticsUser = (): void => {
  analytics.clearUser();
};
