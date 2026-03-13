import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { analytics } from './analytics';
import { captureMessage } from './sentry';

type MetricName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';

interface WebVitalsConfig {
  enableAnalytics?: boolean;
  enableSentry?: boolean;
  enableConsoleLog?: boolean;
}

const thresholds: Record<MetricName, { good: number; needsImprovement: number }> = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

const getRating = (name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = thresholds[name];
  if (value <= threshold.good) {
    return 'good';
  }
  if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  }
  return 'poor';
};

const shouldTrack = (): boolean => {
  const environment = import.meta.env.MODE;
  return environment === 'production' || import.meta.env.VITE_ENABLE_WEB_VITALS === 'true';
};

const sendToAnalytics = (metric: Metric, config: WebVitalsConfig): void => {
  const { name, value, id, rating } = metric;

  if (config.enableConsoleLog) {
    console.log(`[Web Vitals] ${name}:`, {
      value: Math.round(value),
      rating,
      id,
    });
  }

  if (config.enableAnalytics && analytics.isInitialized()) {
    try {
      analytics.trackEvent({
        event_name: 'web_vitals',
        event_type: 'performance',
        properties: {
          metric_name: name,
          metric_value: Math.round(value),
          metric_rating: rating,
          metric_id: id,
          metric_delta: Math.round(metric.delta),
        },
      });
    } catch (error) {
      console.error('Error sending web vitals to analytics:', error);
    }
  }

  if (config.enableSentry) {
    try {
      const customRating = getRating(name as MetricName, value);

      if (customRating === 'poor') {
        captureMessage(`Poor Web Vital: ${name}`, 'warning', {
          extra: {
            metric_name: name,
            metric_value: Math.round(value),
            metric_rating: rating,
            metric_id: id,
            metric_delta: Math.round(metric.delta),
            custom_rating: customRating,
          },
          tags: {
            metric_type: name,
            performance_rating: customRating,
          },
        });
      }
    } catch (error) {
      console.error('Error sending web vitals to Sentry:', error);
    }
  }
};

export const initWebVitals = (config: WebVitalsConfig = {}): void => {
  if (!shouldTrack()) {
    return;
  }

  const defaultConfig: WebVitalsConfig = {
    enableAnalytics: true,
    enableSentry: true,
    enableConsoleLog: import.meta.env.MODE === 'development',
    ...config,
  };

  try {
    onCLS((metric) => sendToAnalytics(metric, defaultConfig));
    onFID((metric) => sendToAnalytics(metric, defaultConfig));
    onFCP((metric) => sendToAnalytics(metric, defaultConfig));
    onLCP((metric) => sendToAnalytics(metric, defaultConfig));
    onTTFB((metric) => sendToAnalytics(metric, defaultConfig));
  } catch (error) {
    console.error('Error initializing web vitals:', error);
  }
};
