/**
 * Session Persistence Tests
 * 
 * Tests session persistence across app restarts:
 * - Redux persist hydration
 * - Token restoration
 * - User data persistence
 * - Session survival after app restart
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loadStoredAuth, login } from '../../src/store/slices/authSlice';
import { secureStorage } from '../../src/utils/secureStorage';
import { authApi } from '../../src/api/authApi';
import { REHYDRATE } from 'redux-persist';

// Mock dependencies
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/api/authApi');

describe('Session Persistence', () => {
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

  describe('Load Stored Auth on App Start', () => {
    it('should restore session from stored tokens', async () => {
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

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await store.dispatch(loadStoredAuth());

      expect(result.type).toBe('auth/loadStoredAuth/fulfilled');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockAccessToken);
      expect(state.refreshToken).toBe(mockRefreshToken);
      expect(state.biometricEnabled).toBe(true);
      expect(state.activeRole).toBe('student');
    });

    it('should not restore session if no tokens found', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(false);

      const result = await store.dispatch(loadStoredAuth());

      expect(result.type).toBe('auth/loadStoredAuth/fulfilled');
      expect(result.payload).toBeNull();

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('should clear tokens if API call fails', async () => {
      const mockAccessToken = 'invalid_token';
      const mockRefreshToken = 'invalid_refresh';

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(false);
      (authApi.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      );
      (secureStorage.clearTokens as jest.Mock).mockResolvedValue(undefined);

      const result = await store.dispatch(loadStoredAuth());

      expect(result.type).toBe('auth/loadStoredAuth/rejected');
      expect(secureStorage.clearTokens).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
    });

    it('should restore demo user session', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(
        'demo_student_access_token_123'
      );
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(
        'demo_student_refresh_token_123'
      );
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

      const result = await store.dispatch(loadStoredAuth());

      expect(result.type).toBe('auth/loadStoredAuth/fulfilled');
      expect(secureStorage.setIsDemoUser).toHaveBeenCalledWith(true);

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Redux Persist REHYDRATE', () => {
    it('should restore auth state on REHYDRATE', () => {
      const rehydratedUser = {
        id: 1001,
        email: 'demo@example.com',
        first_name: 'Alex',
        last_name: 'Johnson',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      const rehydrateAction = {
        type: REHYDRATE,
        payload: {
          auth: {
            user: rehydratedUser,
            accessToken: 'demo_student_access_token_123',
            refreshToken: 'demo_student_refresh_token_123',
            isAuthenticated: true,
            biometricEnabled: true,
            activeRole: 'student',
            availableRoles: ['student'],
          },
        },
      };

      const state = authReducer(undefined, rehydrateAction);

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(rehydratedUser);
      expect(state.accessToken).toBe('demo_student_access_token_123');
      expect(state.refreshToken).toBe('demo_student_refresh_token_123');
      expect(state.biometricEnabled).toBe(true);
      expect(state.activeRole).toBe('student');
      expect(state.availableRoles).toEqual(['student']);
    });

    it('should not restore if required data is missing', () => {
      const rehydrateAction = {
        type: REHYDRATE,
        payload: {
          auth: {
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          },
        },
      };

      const state = authReducer(undefined, rehydrateAction);

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should set isAuthenticated to true even if persisted value was false', () => {
      const rehydratedUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      const rehydrateAction = {
        type: REHYDRATE,
        payload: {
          auth: {
            user: rehydratedUser,
            accessToken: 'demo_student_access_token_123',
            refreshToken: 'demo_student_refresh_token_123',
            isAuthenticated: false, // This should be corrected to true
            activeRole: 'student',
          },
        },
      };

      const state = authReducer(undefined, rehydrateAction);

      // Should force isAuthenticated to true if tokens exist
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(rehydratedUser);
    });
  });

  describe('Session Survival Across App Restart', () => {
    it('should maintain session after app restart with valid tokens', async () => {
      // Simulate app restart by creating new store
      const firstStore = configureStore({
        reducer: { auth: authReducer },
      });

      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      const mockTokenResponse = {
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      };

      // First login
      (authApi.login as jest.Mock).mockResolvedValue(mockTokenResponse);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (secureStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setUserEmail as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

      await firstStore.dispatch(
        login({
          email: 'demo@example.com',
          password: 'Demo@123',
        })
      );

      let state = firstStore.getState().auth;
      expect(state.isAuthenticated).toBe(true);

      // Simulate app restart with new store
      const secondStore = configureStore({
        reducer: { auth: authReducer },
      });

      // Mock storage to return previously saved tokens
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(
        mockTokenResponse.access_token
      );
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(
        mockTokenResponse.refresh_token
      );
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // Load stored auth on app restart
      await secondStore.dispatch(loadStoredAuth());

      state = secondStore.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockTokenResponse.access_token);
      expect(state.refreshToken).toBe(mockTokenResponse.refresh_token);
    });

    it('should not maintain session if tokens are cleared', async () => {
      // Create store and login
      const firstStore = configureStore({
        reducer: { auth: authReducer },
      });

      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      const mockTokenResponse = {
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      };

      (authApi.login as jest.Mock).mockResolvedValue(mockTokenResponse);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (secureStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setUserEmail as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

      await firstStore.dispatch(
        login({
          email: 'demo@example.com',
          password: 'Demo@123',
        })
      );

      // Simulate app restart but tokens are gone
      const secondStore = configureStore({
        reducer: { auth: authReducer },
      });

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(false);

      await secondStore.dispatch(loadStoredAuth());

      const state = secondStore.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('Biometric Setting Persistence', () => {
    it('should persist biometric enabled setting', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('token');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh');
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      await store.dispatch(loadStoredAuth());

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(true);
    });

    it('should not have biometric enabled by default', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('token');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh');
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      await store.dispatch(loadStoredAuth());

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(false);
    });
  });

  describe('User Role Persistence', () => {
    it('should persist and restore active role', async () => {
      const mockUser = {
        id: 2001,
        email: 'parent@demo.com',
        role: 'parent',
        roleInfo: { id: 4, name: 'Parent', slug: 'parent' },
      };

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('token');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh');
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      await store.dispatch(loadStoredAuth());

      const state = store.getState().auth;
      expect(state.activeRole).toBe('parent');
      expect(state.availableRoles).toEqual(['parent']);
    });
  });
});
