declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

export interface PageViewParams {
  page_title?: string;
  page_location?: string;
  page_path?: string;
}

export interface FeatureUsageParams extends EventParams {
  feature_name: string;
  feature_category?: string;
  feature_value?: string | number;
}

export interface ConversionParams extends EventParams {
  value?: number;
  currency?: string;
  transaction_id?: string;
}

export interface ClickParams extends EventParams {
  element_id?: string;
  element_class?: string;
  element_text?: string;
  link_url?: string;
}

class Analytics {
  private measurementId: string | undefined;
  private isInitialized = false;
  private isEnabled = false;

  init(): void {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    this.isEnabled = import.meta.env.VITE_GA_ENABLED !== 'false' && !import.meta.env.DEV;

    if (!this.isEnabled || !this.measurementId) {
      console.info('Google Analytics is disabled');
      return;
    }

    this.loadGoogleAnalytics();
    this.isInitialized = true;
    console.info('Google Analytics initialized', { measurementId: this.measurementId });
  }

  private loadGoogleAnalytics(): void {
    if (!this.measurementId) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      send_page_view: false,
    });
  }

  trackPageView(params?: PageViewParams): void {
    if (!this.isInitialized || !this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log('Page view (dev):', params);
      }
      return;
    }

    const pageViewParams: PageViewParams = {
      page_title: params?.page_title || document.title,
      page_location: params?.page_location || window.location.href,
      page_path: params?.page_path || window.location.pathname + window.location.search,
    };

    window.gtag('event', 'page_view', pageViewParams);
  }

  trackEvent(eventName: string, params?: EventParams): void {
    if (!this.isInitialized || !this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log('Event (dev):', eventName, params);
      }
      return;
    }

    window.gtag('event', eventName, params);
  }

  trackFeatureUsage(params: FeatureUsageParams): void {
    if (!this.isInitialized || !this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log('Feature usage (dev):', params);
      }
      return;
    }

    window.gtag('event', 'feature_usage', params);
  }

  trackConversion(eventName: string, params?: ConversionParams): void {
    if (!this.isInitialized || !this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log('Conversion (dev):', eventName, params);
      }
      return;
    }

    window.gtag('event', eventName, params);
  }

  trackClick(params: ClickParams): void {
    if (!this.isInitialized || !this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log('Click (dev):', params);
      }
      return;
    }

    window.gtag('event', 'click', params);
  }
}

export const analytics = new Analytics();
