import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: React.ElementType;
}

export const ScreenReaderOnly = ({ children, as = 'span' }: ScreenReaderOnlyProps) => {
  return (
    <Box
      component={as}
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

export default ScreenReaderOnly;
