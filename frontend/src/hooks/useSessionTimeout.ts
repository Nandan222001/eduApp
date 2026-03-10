import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface UseSessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onWarning,
}: UseSessionTimeoutProps = {}) => {
  const { isAuthenticated, logout } = useAuthStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(() => {
    clearTimers();
    logout();
    if (onTimeout) {
      onTimeout();
    }
  }, [clearTimers, logout, onTimeout]);

  const handleWarning = useCallback(() => {
    if (onWarning) {
      onWarning();
    }
  }, [onWarning]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearTimers();
    lastActivityRef.current = Date.now();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    if (warningMinutes > 0 && warningMinutes < timeoutMinutes) {
      warningRef.current = setTimeout(handleWarning, warningMs);
    }

    timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
  }, [isAuthenticated, timeoutMinutes, warningMinutes, handleTimeout, handleWarning, clearTimers]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    resetTimer();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimers();
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer, clearTimers]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
};
