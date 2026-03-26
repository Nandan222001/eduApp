/**
 * Token Refresh Tests
 * 
 * Tests automatic token refresh in authService.ts:
 * - Automatic refresh timer
 * - Manual token refresh
 * - Token expiration checking
 * - Demo token refresh
 * - Real API token refresh
 */

import { authService } from '../../src/utils/authService';
import { secureStorage } from '../../src/utils/secureStorage';
import { authApi } from '../../src/api/authApi';
import { STORAGE_KEYS } from '../../src/constants';

// Mock dependencies
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/api/authApi');
jest.mock('../../src/store', () => ({
  store: {
    dispatch: jest.fn(),
  },
}));

describe('Token Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    authService.stopAutoRefresh();
  });

  afterEach(() => {
    jest.useRealTimers();
    authService.stopAutoRefresh();
  });

  describe('Automatic Token Refresh', () => {
    it('should start auto-refresh timer on initialization', async () => {
      const mockAccessToken = 'demo_student_access_token_123';
      const mockRefreshToken = 'demo_student_refresh_token_123';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken) // ACCESS_TOKEN
        .mockResolvedValueOnce(mockRefreshToken); // REFRESH_TOKEN

      await authService.initializeAuth();

      // Timer should be set
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('should refresh tokens after 14 minutes', async () => {
      const mockAccessToken = 'demo_student_access_token_123';
      const mockRefreshToken = 'demo_student_refresh_token_123';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValue(mockRefreshToken)
        .mockResolvedValueOnce(mockAccessToken);
      (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // Start auto-refresh
      authService.startAutoRefresh();

      // Fast-forward 14 minutes
      jest.advanceTimersByTime(14 * 60 * 1000);

      // Wait for async operations
      await Promise.resolve();

      // Verify tokens were refreshed
      expect(secureStorage.getItem).toHaveBeenCalled();
    });

    it('should stop auto-refresh on logout', () => {
      authService.startAutoRefresh();
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      authService.stopAutoRefresh();
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Demo Token Refresh', () => {
    it('should refresh demo student token', async () => {
      const oldAccessToken = 'demo_student_access_token_123';
      const refreshToken = 'demo_student_refresh_token_456';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(refreshToken) // REFRESH_TOKEN
        .mockResolvedValueOnce(oldAccessToken); // ACCESS_TOKEN
      (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshTokens();

      expect(result).toBe(true);
      expect(secureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        expect.stringContaining('demo_student_access_token_')
      );
      expect(secureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        refreshToken
      );
    });

    it('should refresh demo parent token', async () => {
      const oldAccessToken = 'demo_parent_access_token_123';
      const refreshToken = 'demo_parent_refresh_token_456';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(oldAccessToken);
      (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshTokens();

      expect(result).toBe(true);
      expect(secureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        expect.stringContaining('demo_parent_access_token_')
      );
    });

    it('should restart auto-refresh after successful refresh', async () => {
      const oldAccessToken = 'demo_student_access_token_123';
      const refreshToken = 'demo_student_refresh_token_456';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(oldAccessToken);
      (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await authService.refreshTokens();

      // Timer should be restarted
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });
  });

  describe('Real API Token Refresh', () => {
    it('should refresh real API token', async () => {
      const oldAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const refreshToken = 'real_refresh_token_456';
      const newAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNjE2MjM5MDIyfQ.Ee0FLh0hFHYN6yRZ_8lMqJE18JFP_RoRGPqWI5cIyIM';
      const newRefreshToken = 'real_refresh_token_789';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(refreshToken) // REFRESH_TOKEN
        .mockResolvedValueOnce(oldAccessToken); // ACCESS_TOKEN
      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
      });
      (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshTokens();

      expect(result).toBe(true);
      expect(authApi.refreshToken).toHaveBeenCalledWith({
        refresh_token: refreshToken,
      });
      expect(secureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        newAccessToken
      );
      expect(secureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        newRefreshToken
      );
    });

    it('should handle refresh failure and clear session', async () => {
      const refreshToken = 'expired_refresh_token';

      (secureStorage.getItem as jest.Mock).mockResolvedValue(refreshToken);
      (authApi.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Token expired')
      );
      (secureStorage.clearAll as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshTokens();

      expect(result).toBe(false);
      expect(secureStorage.clearAll).toHaveBeenCalled();
    });

    it('should not refresh if no refresh token exists', async () => {
      (secureStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.refreshTokens();

      expect(result).toBe(false);
      expect(authApi.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Token Expiration Checking', () => {
    it('should detect demo tokens never expire', () => {
      const demoToken = 'demo_student_access_token_123';
      const isExpiring = authService.isTokenExpiringSoon(demoToken);

      expect(isExpiring).toBe(false);
    });

    it('should detect expiring JWT token', () => {
      // Create a JWT token expiring in 4 minutes
      const expirationTime = Math.floor(Date.now() / 1000) + (4 * 60);
      const payload = JSON.stringify({ exp: expirationTime });
      const encodedPayload = Buffer.from(payload).toString('base64');
      const token = `header.${encodedPayload}.signature`;

      const isExpiring = authService.isTokenExpiringSoon(token);

      expect(isExpiring).toBe(true);
    });

    it('should detect valid JWT token not expiring soon', () => {
      // Create a JWT token expiring in 10 minutes
      const expirationTime = Math.floor(Date.now() / 1000) + (10 * 60);
      const payload = JSON.stringify({ exp: expirationTime });
      const encodedPayload = Buffer.from(payload).toString('base64');
      const token = `header.${encodedPayload}.signature`;

      const isExpiring = authService.isTokenExpiringSoon(token);

      expect(isExpiring).toBe(false);
    });

    it('should handle malformed token gracefully', () => {
      const malformedToken = 'not-a-valid-token';
      const isExpiring = authService.isTokenExpiringSoon(malformedToken);

      // Should return true to trigger refresh
      expect(isExpiring).toBe(true);
    });
  });

  describe('Check and Refresh If Needed', () => {
    it('should refresh if token is expiring soon', async () => {
      // Create expiring token
      const expirationTime = Math.floor(Date.now() / 1000) + (4 * 60);
      const payload = JSON.stringify({ exp: expirationTime });
      const encodedPayload = Buffer.from(payload).toString('base64');
      const expiringToken = `header.${encodedPayload}.signature`;
      const refreshToken = 'refresh_token';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(expiringToken) // ACCESS_TOKEN
        .mockResolvedValueOnce(refreshToken) // REFRESH_TOKEN for refresh
        .mockResolvedValueOnce(expiringToken); // ACCESS_TOKEN for isDemoToken check
      (authApi.refreshToken as jest.Mock).mockResolvedValue({
        access_token: 'new_token',
        refresh_token: 'new_refresh',
        token_type: 'Bearer',
      });
      (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await authService.checkAndRefreshIfNeeded();

      expect(authApi.refreshToken).toHaveBeenCalled();
    });

    it('should not refresh if token is still valid', async () => {
      // Create valid token (10 minutes)
      const expirationTime = Math.floor(Date.now() / 1000) + (10 * 60);
      const payload = JSON.stringify({ exp: expirationTime });
      const encodedPayload = Buffer.from(payload).toString('base64');
      const validToken = `header.${encodedPayload}.signature`;

      (secureStorage.getItem as jest.Mock).mockResolvedValue(validToken);

      await authService.checkAndRefreshIfNeeded();

      expect(authApi.refreshToken).not.toHaveBeenCalled();
    });

    it('should not refresh demo tokens', async () => {
      const demoToken = 'demo_student_access_token_123';

      (secureStorage.getItem as jest.Mock).mockResolvedValue(demoToken);

      await authService.checkAndRefreshIfNeeded();

      expect(authApi.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should get session status when logged in', async () => {
      const accessToken = 'demo_student_access_token_123';
      const refreshToken = 'demo_student_refresh_token_123';
      const email = 'demo@example.com';

      (secureStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(accessToken) // ACCESS_TOKEN
        .mockResolvedValueOnce(refreshToken); // REFRESH_TOKEN
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (secureStorage.getUserEmail as jest.Mock).mockResolvedValue(email);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);

      const status = await authService.getSessionStatus();

      expect(status.isLoggedIn).toBe(true);
      expect(status.hasAccessToken).toBe(true);
      expect(status.hasRefreshToken).toBe(true);
      expect(status.biometricEnabled).toBe(true);
      expect(status.userEmail).toBe(email);
      expect(status.isDemoUser).toBe(true);
      expect(status.isDemo).toBe(true);
    });

    it('should get session status when logged out', async () => {
      (secureStorage.getItem as jest.Mock).mockResolvedValue(null);
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getUserEmail as jest.Mock).mockResolvedValue(null);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(false);

      const status = await authService.getSessionStatus();

      expect(status.isLoggedIn).toBe(false);
      expect(status.hasAccessToken).toBe(false);
      expect(status.hasRefreshToken).toBe(false);
      expect(status.biometricEnabled).toBe(false);
      expect(status.userEmail).toBeNull();
      expect(status.isDemoUser).toBe(false);
      expect(status.isDemo).toBe(false);
    });
  });
});
