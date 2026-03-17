import { secureStorage } from './secureStorage';
import { authApi } from '@api/auth';
import { STORAGE_KEYS } from '@constants';
import { store } from '@store/store';
import { setTokens, logout } from '@store/slices/authSlice';

let refreshTimeout: NodeJS.Timeout | null = null;

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

export const authService = {
  async initializeAuth() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        await this.checkAndRefreshIfNeeded();
        this.startAutoRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      return false;
    }
  },

  startAutoRefresh() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    refreshTimeout = setTimeout(async () => {
      await this.refreshTokens();
    }, TOKEN_REFRESH_INTERVAL);
  },

  stopAutoRefresh() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  },

  async refreshTokens() {
    try {
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(refreshToken);
      const { access_token, refresh_token } = response.data;

      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

      store.dispatch(
        setTokens({
          accessToken: access_token,
          refreshToken: refresh_token,
        })
      );

      this.startAutoRefresh();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.stopAutoRefresh();
      await this.clearSession();
      return false;
    }
  },

  async clearSession() {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);
      await secureStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);

      this.stopAutoRefresh();

      store.dispatch(logout());
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  async saveSession(accessToken: string, refreshToken: string, user: any) {
    try {
      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await secureStorage.setObject(STORAGE_KEYS.USER_DATA, user);

      this.startAutoRefresh();
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  },

  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      return timeUntilExpiration < 5 * 60 * 1000;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  },

  async checkAndRefreshIfNeeded() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (accessToken && this.isTokenExpiringSoon(accessToken)) {
        await this.refreshTokens();
      }
    } catch (error) {
      console.error('Failed to check and refresh token:', error);
    }
  },

  async getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      return await secureStorage.getObject<{ email: string; password: string }>(
        STORAGE_KEYS.BIOMETRIC_CREDENTIALS
      );
    } catch (error) {
      console.error('Failed to get biometric credentials:', error);
      return null;
    }
  },

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric enabled:', error);
      return false;
    }
  },
};
