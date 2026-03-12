import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

const PageViewTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView({
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location]);

  return null;
};

export default PageViewTracker;
