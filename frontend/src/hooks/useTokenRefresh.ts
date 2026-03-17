import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { tokenManager } from '@/lib/tokenManager';

export const useTokenRefresh = () => {
  const { isAuthenticated, logout, setTokens } = useAuthStore();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) return;

    const refreshTokenValue = tokenManager.getRefreshToken();
    if (!refreshTokenValue) {
      logout();
      return;
    }

    try {
      isRefreshingRef.current = true;
      const response = await authApi.refreshToken(refreshTokenValue);
      tokenManager.setAccessToken(response.accessToken);
      tokenManager.setTokenExpiry(response.expiresIn);
      setTokens({
        accessToken: response.accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: response.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout, setTokens]);

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (tokenManager.isTokenExpired()) {
        refreshToken();
      }
    }, 60000);
  }, [refreshToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    if (tokenManager.isTokenExpired()) {
      refreshToken();
    }

    scheduleTokenRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, refreshToken, scheduleTokenRefresh]);

  return { refreshToken };
};
