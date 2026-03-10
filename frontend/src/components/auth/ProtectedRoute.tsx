import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '@/store/useAuthStore';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  redirectTo?: string;
  allowedRoles?: UserRole[];
  requireEmailVerified?: boolean;
}

export default function ProtectedRoute({
  redirectTo = '/login',
  allowedRoles,
  requireEmailVerified = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
  });

  useTokenRefresh();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireEmailVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
