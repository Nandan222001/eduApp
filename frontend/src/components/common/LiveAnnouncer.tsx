import { useEffect, useRef, ReactNode } from 'react';
import { Box } from '@mui/material';

interface LiveAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
  children?: ReactNode;
}

export const LiveAnnouncer = ({
  message,
  priority = 'polite',
  clearOnUnmount = true,
}: LiveAnnouncerProps) => {
  const previousMessage = useRef<string>('');

  useEffect(() => {
    if (message && message !== previousMessage.current) {
      previousMessage.current = message;
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        previousMessage.current = '';
      }
    };
  }, [clearOnUnmount]);

  if (!message || priority === 'off') {
    return null;
  }

  return (
    <Box
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      sx={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {message}
    </Box>
  );
};

export const useLiveAnnouncer = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  return { announce };
};

export default LiveAnnouncer;
