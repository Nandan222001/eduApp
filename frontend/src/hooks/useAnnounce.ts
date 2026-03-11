import { useCallback } from 'react';
import { announceToScreenReader } from '../utils/accessibility';

export const useAnnounce = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  return announce;
};

export default useAnnounce;
