import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuthStore } from '@/store/useAuthStore';
import SessionTimeoutDialog from '@/components/auth/SessionTimeoutDialog';

interface SessionTimeoutWrapperProps {
  children: React.ReactNode;
}

export default function SessionTimeoutWrapper({ children }: SessionTimeoutWrapperProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300);

  const handleTimeout = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate('/login', { state: { message: 'Your session has expired' } });
  }, [logout, navigate]);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
    setCountdown(300);
  }, []);

  const { resetTimer } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onTimeout: handleTimeout,
    onWarning: handleWarning,
  });

  const handleExtendSession = () => {
    setShowWarning(false);
    resetTimer();
  };

  return (
    <>
      {children}
      <SessionTimeoutDialog
        open={showWarning}
        countdown={countdown}
        onExtend={handleExtendSession}
        onLogout={handleTimeout}
      />
    </>
  );
}
