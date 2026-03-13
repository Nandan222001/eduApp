interface AnalyticsEvent {
  event_name: string;
  event_type: string;
  properties?: Record<string, unknown>;
}

declare global {
  interface Window {
    gtag?: (command: string, targetId: string | Date, config?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

class Analytics {
  private initialized = false;
  private measurementId: string | null = null;

  init(): void {
    this.measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

    if (!this.measurementId || this.measurementId === 'G-XXXXXXXXXX') {
      console.warn('Google Analytics is not configured');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      send_page_view: false,
    });

    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.initialized || !window.gtag) {
      return;
    }

    try {
      window.gtag('event', event.event_name, {
        event_category: event.event_type,
        ...event.properties,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  trackPageView(path: string): void {
    if (!this.initialized || !window.gtag || !this.measurementId) {
      return;
    }

    try {
      window.gtag('config', this.measurementId, {
        page_path: path,
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  trackFeatureUsage(featureName: string, properties?: Record<string, unknown>): void {
    this.trackEvent({
      event_name: 'feature_usage',
      event_type: 'engagement',
      properties: {
        feature_name: featureName,
        ...properties,
      },
    });
  }

  trackConversion(
    conversionType: string,
    value?: number,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent({
      event_name: 'conversion',
      event_type: 'conversion',
      properties: {
        conversion_type: conversionType,
        value,
        ...properties,
      },
    });
  }

  trackClick(elementId: string, properties?: Record<string, unknown>): void {
    this.trackEvent({
      event_name: 'click',
      event_type: 'interaction',
      properties: {
        element_id: elementId,
        ...properties,
      },
    });
  }
}

export const analytics = new Analytics();

export const trackEvent = (event: AnalyticsEvent): void => {
  analytics.trackEvent(event);
};

export const trackPageView = (path: string): void => {
  analytics.trackPageView(path);
};

export const trackFeatureUsage = (
  featureName: string,
  properties?: Record<string, unknown>
): void => {
  analytics.trackFeatureUsage(featureName, properties);
};

export const trackConversion = (
  conversionType: string,
  value?: number,
  properties?: Record<string, unknown>
): void => {
  analytics.trackConversion(conversionType, value, properties);
};

export const trackClick = (elementId: string, properties?: Record<string, unknown>): void => {
  analytics.trackClick(elementId, properties);
};
