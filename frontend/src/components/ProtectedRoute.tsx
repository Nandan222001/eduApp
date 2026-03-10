import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface ProtectedRouteProps {
  redirectTo?: string;
}

export default function ProtectedRoute({ redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
