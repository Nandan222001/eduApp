import { secureStorage } from '@utils/secureStorage';
import { authApi } from '@api/authApi';
import { STORAGE_KEYS } from '@constants';
import { store } from '@store';
import { logout } from '@store/slices/authSlice';

let refreshTimeout: NodeJS.Timeout | null = null;

// Token refresh interval: 14 minutes (tokens typically expire after 15 minutes)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

/**
 * Authentication Service
 * 
 * Handles automatic token refresh, session management, and token validation.
 * Supports both real API tokens and demo tokens.
 */
export const authService = {
  /**
   * Initialize authentication on app startup
   * Checks for stored tokens and starts auto-refresh if valid session exists
   */
  async initializeAuth() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        const isDemoUser = this.isDemoToken(accessToken);
        
        if (isDemoUser) {
          // For demo users, just start the refresh timer
          console.log('[AuthService] Demo user detected, starting auto-refresh');
          this.startAutoRefresh();
          return true;
        }

        // For real users, check if token needs refresh
        console.log('[AuthService] Real user detected, checking token validity');
        await this.checkAndRefreshIfNeeded();
        this.startAutoRefresh();
        return true;
      }
      
      console.log('[AuthService] No stored tokens found');
      return false;
    } catch (error) {
      console.error('[AuthService] Failed to initialize auth:', error);
      return false;
    }
  },

  /**
   * Check if a token is a demo token
   */
  isDemoToken(token: string): boolean {
    return token.startsWith('demo_student_access_token_') || 
           token.startsWith('demo_parent_access_token_');
  },

  /**
   * Start automatic token refresh
   * Sets up a timer to refresh tokens before they expire
   */
  startAutoRefresh() {
    // Clear any existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    console.log(`[AuthService] Starting auto-refresh timer (${TOKEN_REFRESH_INTERVAL / 1000}s)`);
    
    refreshTimeout = setTimeout(async () => {
      console.log('[AuthService] Auto-refresh timer triggered');
      await this.refreshTokens();
    }, TOKEN_REFRESH_INTERVAL);
  },

  /**
   * Stop automatic token refresh
   */
  stopAutoRefresh() {
    if (refreshTimeout) {
      console.log('[AuthService] Stopping auto-refresh timer');
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  },

  /**
   * Refresh access and refresh tokens
   * Handles both demo tokens and real API tokens
   */
  async refreshTokens(): Promise<boolean> {
    try {
      console.log('[AuthService] Starting token refresh');
      
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Handle demo tokens
      if (accessToken && this.isDemoToken(accessToken)) {
        console.log('[AuthService] Refreshing demo token');
        const isStudent = refreshToken.startsWith('demo_student_refresh_token_');
        const newAccessToken = isStudent 
          ? `demo_student_access_token_${Date.now()}`
          : `demo_parent_access_token_${Date.now()}`;
        
        await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

        console.log('[AuthService] Demo token refreshed successfully');
        this.startAutoRefresh();
        return true;
      }

      // Handle real API tokens
      console.log('[AuthService] Refreshing real API token');
      const response = await authApi.refreshToken({ refresh_token: refreshToken });
      const { access_token, refresh_token } = response;

      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

      console.log('[AuthService] Real API token refreshed successfully');
      this.startAutoRefresh();

      return true;
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      this.stopAutoRefresh();
      await this.clearSession();
      return false;
    }
  },

  /**
   * Clear user session and tokens
   */
  async clearSession() {
    try {
      console.log('[AuthService] Clearing session');
      await secureStorage.clearAll();
      this.stopAutoRefresh();
      store.dispatch(logout());
    } catch (error) {
      console.error('[AuthService] Failed to clear session:', error);
    }
  },

  /**
   * Save authentication session
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveSession(accessToken: string, refreshToken: string, user: any) {
    try {
      console.log('[AuthService] Saving session');
      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await secureStorage.setObject(STORAGE_KEYS.USER_DATA, user);

      this.startAutoRefresh();
    } catch (error) {
      console.error('[AuthService] Failed to save session:', error);
      throw error;
    }
  },

  /**
   * Check if token is expiring soon
   * Only works for JWT tokens, not demo tokens
   */
  isTokenExpiringSoon(token: string): boolean {
    try {
      if (this.isDemoToken(token)) {
        return false;
      }

      // Decode JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Return true if token expires in less than 5 minutes
      return timeUntilExpiration < 5 * 60 * 1000;
    } catch (error) {
      console.error('[AuthService] Failed to check token expiration:', error);
      return true; // Assume expired if we can't decode
    }
  },

  /**
   * Check token and refresh if needed
   */
  async checkAndRefreshIfNeeded() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (accessToken && this.isTokenExpiringSoon(accessToken)) {
        console.log('[AuthService] Token expiring soon, refreshing');
        await this.refreshTokens();
      } else {
        console.log('[AuthService] Token still valid');
      }
    } catch (error) {
      console.error('[AuthService] Failed to check and refresh token:', error);
    }
  },

  /**
   * Get biometric credentials if stored
   */
  async getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      return await secureStorage.getObject<{ email: string; password: string }>(
        STORAGE_KEYS.BIOMETRIC_CREDENTIALS
      );
    } catch (error) {
      console.error('[AuthService] Failed to get biometric credentials:', error);
      return null;
    }
  },

  /**
   * Check if biometric is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('[AuthService] Failed to check biometric enabled:', error);
      return false;
    }
  },

  /**
   * Get current session status
   */
  async getSessionStatus() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const biometricEnabled = await secureStorage.getBiometricEnabled();
      const userEmail = await secureStorage.getUserEmail();
      const isDemoUser = await secureStorage.getIsDemoUser();

      return {
        isLoggedIn: !!(accessToken && refreshToken),
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        biometricEnabled,
        userEmail,
        isDemoUser,
        isDemo: accessToken ? this.isDemoToken(accessToken) : false,
      };
    } catch (error) {
      console.error('[AuthService] Failed to get session status:', error);
      return {
        isLoggedIn: false,
        hasAccessToken: false,
        hasRefreshToken: false,
        biometricEnabled: false,
        userEmail: null,
        isDemoUser: false,
        isDemo: false,
      };
    }
  },
};
