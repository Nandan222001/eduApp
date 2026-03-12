import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView({ page_path: location.pathname });
  }, [location]);
};

export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
  };
};

export const useFeatureTracking = (featureName: string) => {
  useEffect(() => {
    analytics.trackFeatureUsage({ feature_name: featureName });
  }, [featureName]);
};
