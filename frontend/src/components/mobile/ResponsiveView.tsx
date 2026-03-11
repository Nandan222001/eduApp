import { useMediaQuery, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface ResponsiveViewProps {
  mobile?: ReactNode;
  desktop: ReactNode;
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function ResponsiveView({
  mobile,
  desktop,
  breakpoint = 'md',
}: ResponsiveViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));

  if (isMobile && mobile) {
    return <>{mobile}</>;
  }

  return <>{desktop}</>;
}
