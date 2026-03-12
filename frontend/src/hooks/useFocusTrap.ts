import { useEffect, useRef } from 'react';
import { trapFocus } from '../utils/accessibility';

export const useFocusTrap = (isActive: boolean = true) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const cleanup = trapFocus(elementRef.current);

    return cleanup;
  }, [isActive]);

  return elementRef;
};

export default useFocusTrap;
