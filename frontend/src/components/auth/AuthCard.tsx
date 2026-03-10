import { Paper, PaperProps } from '@mui/material';
import { useResponsive } from '@/hooks/useResponsive';

interface AuthCardProps extends PaperProps {
  children: React.ReactNode;
}

export default function AuthCard({ children, ...props }: AuthCardProps) {
  const { isMobile } = useResponsive();

  return (
    <Paper
      elevation={isMobile ? 0 : 3}
      sx={{
        width: '100%',
        p: { xs: 3, sm: 4 },
        borderRadius: { xs: 0, sm: 2 },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}
