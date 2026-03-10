import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import type { LoginCredentials, LoginWithOTPCredentials } from '@/types/auth';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login: storeLogin, logout: storeLogout, user, isAuthenticated } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const response = await authApi.login(credentials);
        storeLogin(response.user, response.tokens);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
        };
      }
    },
    [storeLogin]
  );

  const loginWithOTP = useCallback(
    async (credentials: LoginWithOTPCredentials) => {
      try {
        const response = await authApi.loginWithOTP(credentials);
        storeLogin(response.user, response.tokens);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'OTP login failed',
        };
      }
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storeLogout();
      navigate('/login');
    }
  }, [storeLogout, navigate]);

  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    login,
    loginWithOTP,
    logout,
    hasRole,
  };
};
