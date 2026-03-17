import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { analytics } from './analytics';
import { captureMessage } from './sentry';
import { env } from '@/config/env';

const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

type VitalName = keyof typeof VITALS_THRESHOLDS;

const getRating = (name: VitalName, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

const sendToAnalytics = (metric: Metric): void => {
  const { name, value, id, navigationType } = metric;
  const rating = getRating(name as VitalName, value);

  analytics.event({
    event_name: 'web_vitals',
    event_type: 'performance',
    properties: {
      metric_name: name,
      metric_value: Math.round(name === 'CLS' ? value * 1000 : value),
      metric_id: id,
      metric_rating: rating,
      navigation_type: navigationType,
    },
  });

  if (rating === 'poor' && env.isProduction) {
    captureMessage(`Poor Web Vital: ${name} = ${value.toFixed(2)}`, 'warning', {
      metric: name,
      value,
      rating,
      id,
    });
  }
};

const sendToServer = (metric: Metric): void => {
  if (!env.isProduction) return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    navigationType: metric.navigationType,
    rating: getRating(metric.name as VitalName, metric.value),
    url: window.location.href,
    timestamp: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/v1/analytics/web-vitals', body);
  } else {
    fetch('/api/v1/analytics/web-vitals', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    }).catch((error) => {
      console.error('Error sending web vitals to server:', error);
    });
  }
};

const handleMetric = (metric: Metric): void => {
  console.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: getRating(metric.name as VitalName, metric.value),
    id: metric.id,
  });

  sendToAnalytics(metric);
  sendToServer(metric);
};

export const initWebVitals = (): void => {
  try {
    onCLS(handleMetric);
    onFID(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);

    console.log('Web Vitals monitoring initialized');
  } catch (error) {
    console.error('Error initializing Web Vitals:', error);
  }
};

export const reportCustomMetric = (name: string, value: number, unit?: string): void => {
  analytics.timing(name, value, 'Custom Metrics', unit);

  console.log(`[Custom Metric] ${name}: ${value}${unit ? ` ${unit}` : ''}`);
};

export const measureAsync = async <T>(name: string, asyncFn: () => Promise<T>): Promise<T> => {
  const startTime = performance.now();

  try {
    const result = await asyncFn();
    const duration = performance.now() - startTime;

    reportCustomMetric(name, duration, 'ms');

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    reportCustomMetric(`${name}_error`, duration, 'ms');
    throw error;
  }
};

export const measureSync = <T>(name: string, syncFn: () => T): T => {
  const startTime = performance.now();

  try {
    const result = syncFn();
    const duration = performance.now() - startTime;

    reportCustomMetric(name, duration, 'ms');

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    reportCustomMetric(`${name}_error`, duration, 'ms');
    throw error;
  }
};

export { onCLS, onFID, onFCP, onLCP, onTTFB, onINP };
