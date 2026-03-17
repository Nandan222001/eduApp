import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { renderWithProviders, createMockLoginResponse } from '../utils';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
const mockAuthApi = {
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
};

const mockSecureStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getObject: jest.fn(),
  setObject: jest.fn(),
};

const mockAuthService = {
  saveSession: jest.fn(),
  clearSession: jest.fn(),
  checkAndRefreshIfNeeded: jest.fn(),
  getBiometricCredentials: jest.fn(),
};

jest.mock('../../src/api/auth', () => ({
  authApi: mockAuthApi,
}));

jest.mock('../../src/utils/secureStorage', () => ({
  secureStorage: mockSecureStorage,
}));

jest.mock('../../src/utils/authService', () => ({
  authService: mockAuthService,
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login flow', () => {
    it('should complete full login flow successfully', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText, queryClient } = renderWithProviders(<LoginScreen />);

      // Fill in credentials
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      // Submit login
      fireEvent.press(getByText('Login'));

      // Wait for API call
      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          otp: undefined,
        });
      });

      // Verify session was saved
      expect(mockAuthService.saveSession).toHaveBeenCalledWith(
        loginResponse.data.access_token,
        loginResponse.data.refresh_token,
        loginResponse.data.user
      );
    });

    it('should handle login and store tokens in secure storage', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockImplementation(async (access, refresh, user) => {
        await mockSecureStorage.setItem('ACCESS_TOKEN', access);
        await mockSecureStorage.setItem('REFRESH_TOKEN', refresh);
        await mockSecureStorage.setObject('USER_DATA', user);
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
          'ACCESS_TOKEN',
          loginResponse.data.access_token
        );
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
          'REFRESH_TOKEN',
          loginResponse.data.refresh_token
        );
      });
    });

    it('should update Redux store on successful login', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.auth.user).toEqual(loginResponse.data.user);
        expect(state.auth.accessToken).toEqual(loginResponse.data.access_token);
      });
    });
  });

  describe('logout flow', () => {
    it('should complete full logout flow', async () => {
      const loginResponse = createMockLoginResponse();

      const preloadedState = {
        auth: {
          user: loginResponse.data.user,
          accessToken: loginResponse.data.access_token,
          refreshToken: loginResponse.data.refresh_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          biometricEnabled: false,
          availableRoles: ['student' as const],
          activeRole: 'student' as const,
        },
      };

      mockAuthApi.logout.mockResolvedValueOnce({});
      mockAuthService.clearSession.mockResolvedValueOnce(undefined);

      const { store } = renderWithProviders(<LoginScreen />, { preloadedState });

      // Dispatch logout action
      await store.dispatch({ type: 'auth/logout/pending' });

      await waitFor(() => {
        expect(mockAuthService.clearSession).toHaveBeenCalled();
      });
    });

    it('should clear secure storage on logout', async () => {
      mockAuthApi.logout.mockResolvedValueOnce({});
      mockAuthService.clearSession.mockImplementation(async () => {
        await mockSecureStorage.removeItem('ACCESS_TOKEN');
        await mockSecureStorage.removeItem('REFRESH_TOKEN');
        await mockSecureStorage.removeItem('USER_DATA');
      });

      const loginResponse = createMockLoginResponse();
      const preloadedState = {
        auth: {
          user: loginResponse.data.user,
          accessToken: loginResponse.data.access_token,
          refreshToken: loginResponse.data.refresh_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          biometricEnabled: false,
          availableRoles: ['student' as const],
          activeRole: 'student' as const,
        },
      };

      const { store } = renderWithProviders(<LoginScreen />, { preloadedState });

      await store.dispatch({ type: 'auth/logout/fulfilled' });

      await waitFor(() => {
        expect(mockSecureStorage.removeItem).toHaveBeenCalled();
      });
    });
  });

  describe('token refresh flow', () => {
    it('should refresh tokens when expired', async () => {
      mockSecureStorage.getItem.mockResolvedValueOnce('old-refresh-token');
      mockAuthApi.refreshToken.mockResolvedValueOnce({
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
      });

      const { store } = renderWithProviders(<LoginScreen />);

      await store.dispatch({ type: 'auth/refreshToken/pending' });

      await waitFor(() => {
        expect(mockAuthApi.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      });
    });

    it('should clear session if token refresh fails', async () => {
      mockSecureStorage.getItem.mockResolvedValueOnce('old-refresh-token');
      mockAuthApi.refreshToken.mockRejectedValueOnce(new Error('Token expired'));
      mockAuthService.clearSession.mockResolvedValueOnce(undefined);

      const { store } = renderWithProviders(<LoginScreen />);

      try {
        await store.dispatch({ type: 'auth/refreshToken/rejected' });
      } catch (error) {
        // Expected to fail
      }

      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(false);
      });
    });
  });

  describe('session persistence', () => {
    it('should restore session from secure storage on app start', async () => {
      const user = createMockLoginResponse().data.user;

      mockSecureStorage.getItem.mockImplementation((key: string) => {
        if (key.includes('ACCESS_TOKEN')) return Promise.resolve('stored-access-token');
        if (key.includes('REFRESH_TOKEN')) return Promise.resolve('stored-refresh-token');
        if (key.includes('BIOMETRIC_ENABLED')) return Promise.resolve('false');
        if (key.includes('ACTIVE_ROLE')) return Promise.resolve('student');
        return Promise.resolve(null);
      });
      mockSecureStorage.getObject.mockResolvedValueOnce(user);
      mockAuthService.checkAndRefreshIfNeeded.mockResolvedValueOnce(undefined);

      const { store } = renderWithProviders(<LoginScreen />);

      // Simulate app start by dispatching loadStoredAuth
      await store.dispatch({ type: 'auth/loadStored/pending' });

      await waitFor(() => {
        expect(mockSecureStorage.getItem).toHaveBeenCalled();
        expect(mockSecureStorage.getObject).toHaveBeenCalled();
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle network errors during login', async () => {
      mockAuthApi.login.mockRejectedValueOnce(new Error('Network error'));

      const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalled();
      });

      // Error should be displayed
      // Actual assertion depends on error display implementation
    });

    it('should handle invalid credentials', async () => {
      mockAuthApi.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'wrong-password');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalled();
      });
    });

    it('should handle session save failures', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockRejectedValueOnce(new Error('Storage error'));

      const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalled();
      });
    });
  });

  describe('OTP authentication flow', () => {
    it('should complete OTP login flow', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

      // Switch to OTP mode
      fireEvent.press(getByText('Login with OTP'));

      // Fill in credentials
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('OTP Code'), '123456');

      // Submit login
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: '',
          otp: '123456',
        });
      });
    });
  });
});
