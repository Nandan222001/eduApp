/**
 * Login Flow Tests
 * 
 * Tests the complete login flow including:
 * - Login with demo credentials
 * - Token storage
 * - Redux state updates
 * - Session persistence
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout } from '../../src/store/slices/authSlice';
import { secureStorage } from '../../src/utils/secureStorage';
import { authApi } from '../../src/api/authApi';

// Mock dependencies
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/api/authApi');
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('Login Flow', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Demo User Login', () => {
    it('should login successfully with demo student credentials', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        username: 'demo_student',
        first_name: 'Alex',
        last_name: 'Johnson',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
      };

      const mockTokenResponse = {
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      };

      // Mock API responses
      (authApi.login as jest.Mock).mockResolvedValue(mockTokenResponse);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (secureStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setUserEmail as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

      // Dispatch login action
      const result = await store.dispatch(
        login({
          email: 'demo@example.com',
          password: 'Demo@123',
        })
      );

      // Verify the action was fulfilled
      expect(result.type).toBe('auth/login/fulfilled');
      
      // Verify state was updated correctly
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockTokenResponse.access_token);
      expect(state.refreshToken).toBe(mockTokenResponse.refresh_token);
      expect(state.activeRole).toBe('student');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Verify secure storage was called
      expect(secureStorage.setTokens).toHaveBeenCalledWith(
        mockTokenResponse.access_token,
        mockTokenResponse.refresh_token
      );
      expect(secureStorage.setUserEmail).toHaveBeenCalledWith(mockUser.email);
      expect(secureStorage.setIsDemoUser).toHaveBeenCalledWith(true);
    });

    it('should login successfully with demo parent credentials', async () => {
      const mockUser = {
        id: 2001,
        email: 'parent@demo.com',
        username: 'demo_parent',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'parent',
        roleInfo: { id: 4, name: 'Parent', slug: 'parent' },
      };

      const mockTokenResponse = {
        access_token: 'demo_parent_access_token_456',
        refresh_token: 'demo_parent_refresh_token_456',
        token_type: 'Bearer',
      };

      (authApi.login as jest.Mock).mockResolvedValue(mockTokenResponse);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (secureStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setUserEmail as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

      const result = await store.dispatch(
        login({
          email: 'parent@demo.com',
          password: 'Demo@123',
        })
      );

      expect(result.type).toBe('auth/login/fulfilled');
      
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user.email).toBe('parent@demo.com');
      expect(state.activeRole).toBe('parent');
      expect(secureStorage.setIsDemoUser).toHaveBeenCalledWith(true);
    });

    it('should handle login failure with invalid credentials', async () => {
      const errorMessage = 'Invalid credentials';
      (authApi.login as jest.Mock).mockRejectedValue({
        response: { data: { detail: errorMessage } },
      });

      const result = await store.dispatch(
        login({
          email: 'wrong@example.com',
          password: 'WrongPassword',
        })
      );

      expect(result.type).toBe('auth/login/rejected');
      
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    it('should clear all tokens and Redux state on logout', async () => {
      // First login
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

      await store.dispatch(
        login({
          email: 'demo@example.com',
          password: 'Demo@123',
        })
      );

      // Verify logged in
      let state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);

      // Mock logout API
      (authApi.logout as jest.Mock).mockResolvedValue({ message: 'Logged out successfully' });
      (secureStorage.clearAll as jest.Mock).mockResolvedValue(undefined);

      // Dispatch logout
      const result = await store.dispatch(logout());

      expect(result.type).toBe('auth/logout/fulfilled');

      // Verify state was cleared
      state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.biometricEnabled).toBe(false);
      expect(state.activeRole).toBeNull();
      expect(state.availableRoles).toEqual([]);

      // Verify secure storage was cleared
      expect(secureStorage.clearAll).toHaveBeenCalled();
    });

    it('should clear state even if logout API fails', async () => {
      // Setup logged in state
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

      await store.dispatch(
        login({
          email: 'demo@example.com',
          password: 'Demo@123',
        })
      );

      // Mock logout API failure
      (authApi.logout as jest.Mock).mockRejectedValue(new Error('Network error'));
      (secureStorage.clearAll as jest.Mock).mockResolvedValue(undefined);

      // Dispatch logout
      const result = await store.dispatch(logout());

      // Even on rejection, state should be cleared
      expect(result.type).toBe('auth/logout/rejected');
      
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(secureStorage.clearAll).toHaveBeenCalled();
    });
  });

  describe('Session State', () => {
    it('should set loading state during login', () => {
      const pendingAction = { type: 'auth/login/pending' };
      const state = authReducer(undefined, pendingAction);
      
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should maintain user data after successful login', async () => {
      const mockUser = {
        id: 1001,
        email: 'demo@example.com',
        first_name: 'Alex',
        last_name: 'Johnson',
        phone: '+1234567890',
        role: 'student',
        roleInfo: { id: 3, name: 'Student', slug: 'student' },
        permissions: ['view_profile', 'view_assignments'],
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

      await store.dispatch(
        login({
          email: 'demo@example.com',
          password: 'Demo@123',
        })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.user.first_name).toBe('Alex');
      expect(state.user.last_name).toBe('Johnson');
      expect(state.user.phone).toBe('+1234567890');
      expect(state.user.permissions).toContain('view_profile');
    });
  });
});
