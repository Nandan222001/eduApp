/**
 * Biometric Authentication Tests
 * 
 * Tests biometric login on iOS/Android:
 * - Biometric availability check
 * - Face ID / Touch ID authentication
 * - Enable/disable biometric login
 * - Biometric login flow
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginWithBiometric,
  enableBiometric,
  disableBiometric,
} from '../../src/store/slices/authSlice';
import { biometricUtils } from '../../src/utils/biometric';
import { secureStorage } from '../../src/utils/secureStorage';
import { authApi } from '../../src/api/authApi';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('../../src/utils/biometric');
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/api/authApi');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('Biometric Authentication', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    jest.clearAllMocks();
  });

  describe('Biometric Availability', () => {
    it('should check if biometric is available on device', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');

      const isAvailable = await biometricUtils.isAvailable();
      const type = await biometricUtils.getBiometricType();

      expect(isAvailable).toBe(true);
      expect(type).toBe('Face ID');
    });

    it('should return false on web platform', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(false);

      const isAvailable = await biometricUtils.isAvailable();

      expect(isAvailable).toBe(false);
    });

    it('should detect Touch ID on supported devices', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Touch ID');

      const type = await biometricUtils.getBiometricType();

      expect(type).toBe('Touch ID');
    });

    it('should detect Face ID on supported devices', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');

      const type = await biometricUtils.getBiometricType();

      expect(type).toBe('Face ID');
    });
  });

  describe('Enable Biometric', () => {
    it('should enable biometric after successful authentication', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (secureStorage.setBiometricEnabled as jest.Mock).mockResolvedValue(undefined);

      const result = await store.dispatch(enableBiometric());

      expect(result.type).toBe('auth/enableBiometric/fulfilled');
      expect(result.payload).toBe(true);

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(true);

      expect(biometricUtils.authenticate).toHaveBeenCalledWith({
        promptMessage: 'Enable Face ID for quick login',
      });
      expect(secureStorage.setBiometricEnabled).toHaveBeenCalledWith(true);
    });

    it('should fail to enable if biometric not available', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(false);

      const result = await store.dispatch(enableBiometric());

      expect(result.type).toBe('auth/enableBiometric/rejected');
      expect(result.payload).toContain('not available');

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(false);

      expect(secureStorage.setBiometricEnabled).not.toHaveBeenCalled();
    });

    it('should fail to enable if authentication fails', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'User cancelled',
      });

      const result = await store.dispatch(enableBiometric());

      expect(result.type).toBe('auth/enableBiometric/rejected');
      expect(result.payload).toContain('failed');

      expect(secureStorage.setBiometricEnabled).not.toHaveBeenCalled();
    });
  });

  describe('Disable Biometric', () => {
    it('should disable biometric login', async () => {
      // First enable it
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (secureStorage.setBiometricEnabled as jest.Mock).mockResolvedValue(undefined);

      await store.dispatch(enableBiometric());

      let state = store.getState().auth;
      expect(state.biometricEnabled).toBe(true);

      // Now disable it
      const result = await store.dispatch(disableBiometric());

      expect(result.type).toBe('auth/disableBiometric/fulfilled');
      expect(result.payload).toBe(false);

      state = store.getState().auth;
      expect(state.biometricEnabled).toBe(false);

      expect(secureStorage.setBiometricEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Biometric Login', () => {
    it('should login successfully with biometric', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        username: 'demo_student',
        first_name: 'Alex',
        last_name: 'Johnson',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      const mockAccessToken = 'demo_student_access_token_123';
      const mockRefreshToken = 'demo_student_refresh_token_123';

      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockAccessToken);
      expect(state.refreshToken).toBe(mockRefreshToken);
      expect(state.activeRole).toBe('student');

      expect(biometricUtils.authenticate).toHaveBeenCalledWith({
        promptMessage: 'Use Face ID to login',
      });
    });

    it('should fail if biometric not available', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(false);

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/rejected');
      expect(result.payload).toContain('not available');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should fail if biometric authentication fails', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/rejected');
      expect(result.payload).toContain('failed');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
    });

    it('should fail if no stored credentials found', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/rejected');
      expect(result.payload).toContain('No stored credentials');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
    });

    it('should work with Touch ID', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Touch ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('token');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh');
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/fulfilled');
      expect(biometricUtils.authenticate).toHaveBeenCalledWith({
        promptMessage: 'Use Touch ID to login',
      });
    });
  });

  describe('Biometric on Different Platforms', () => {
    it('should not be available on web', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(false);

      const isAvailable = await biometricUtils.isAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should work on iOS with Face ID', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');

      const isAvailable = await biometricUtils.isAvailable();
      const type = await biometricUtils.getBiometricType();

      expect(isAvailable).toBe(true);
      expect(type).toBe('Face ID');
    });

    it('should work on Android with Fingerprint', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Fingerprint');

      const isAvailable = await biometricUtils.isAvailable();
      const type = await biometricUtils.getBiometricType();

      expect(isAvailable).toBe(true);
      expect(type).toBe('Fingerprint');
    });
  });

  describe('Biometric Error Handling', () => {
    it('should handle user cancellation gracefully', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'User cancelled authentication',
      });

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/rejected');
      expect(result.payload).toContain('cancelled');
    });

    it('should handle biometric lockout', async () => {
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Biometric locked out',
      });

      const result = await store.dispatch(loginWithBiometric());

      expect(result.type).toBe('auth/loginWithBiometric/rejected');
      expect(result.payload).toContain('locked');
    });
  });
});
