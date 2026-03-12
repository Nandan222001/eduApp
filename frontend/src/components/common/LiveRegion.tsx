import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
}

export const LiveRegion = ({ children, priority = 'polite', atomic = true }: LiveRegionProps) => {
  return (
    <Box
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Box>
  );
};

export default LiveRegion;
