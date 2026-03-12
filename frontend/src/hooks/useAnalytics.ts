import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent, trackFeatureUsage, trackClick } from '@/lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
};

export const useAnalytics = () => {
  return {
    trackEvent,
    trackFeatureUsage,
    trackClick,
    trackPageView,
  };
};

export const useFeatureTracking = (featureName: string) => {
  useEffect(() => {
    trackFeatureUsage(featureName);
  }, [featureName]);
};
