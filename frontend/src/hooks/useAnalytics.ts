import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  analytics,
  trackEvent,
  trackFeatureUsage,
  trackClick,
  trackPageView,
} from '@/lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location]);
};

export interface Analytics {
  trackPageView: (path: string, title?: string) => void;
  trackEvent: (event: {
    event_name: string;
    event_type: string;
    properties?: Record<string, unknown>;
  }) => void;
  trackFeatureUsage: (featureName: string, properties?: Record<string, unknown>) => void;
  trackClick: (elementId: string, properties?: Record<string, unknown>) => void;
}

export const useAnalytics = (): Analytics => {
  return {
    trackPageView: (path: string, title?: string) => trackPageView(path, title),
    trackEvent: (event: {
      event_name: string;
      event_type: string;
      properties?: Record<string, unknown>;
    }) => trackEvent(event),
    trackFeatureUsage: (featureName: string, properties?: Record<string, unknown>) =>
      trackFeatureUsage(featureName, properties),
    trackClick: (elementId: string, properties?: Record<string, unknown>) =>
      trackClick(elementId, properties),
  };
};

export const useFeatureTracking = (featureName: string) => {
  useEffect(() => {
    trackFeatureUsage(featureName);
  }, [featureName]);
};
