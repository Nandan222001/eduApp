import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { tokenManager } from '@/lib/tokenManager';
import { Box, CircularProgress } from '@mui/material';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setAuthenticated, setLoading, logout } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      if (!tokenManager.hasValidToken()) {
        logout();
        setIsInitialized(true);
        setLoading(false);
        return;
      }

      try {
        const user = await authApi.getCurrentUser();
        setUser(user);
        setAuthenticated(true);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        logout();
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setUser, setAuthenticated, setLoading, logout]);

  if (!isInitialized) {
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

  return <>{children}</>;
}
