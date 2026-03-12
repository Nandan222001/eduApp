import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

const PageViewTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
};

export default PageViewTracker;
