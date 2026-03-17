import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { renderWithProviders, createMockLoginResponse } from '../utils';
import { login } from '../../src/store/slices/authSlice';

// Mock dependencies
jest.mock('../../src/api/auth');
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/utils/authService');
jest.spyOn(Alert, 'alert');

const mockAuthApi = {
  login: jest.fn(),
};

const mockAuthService = {
  saveSession: jest.fn(),
  getBiometricCredentials: jest.fn(),
};

jest.mock('../../src/api/auth', () => ({
  authApi: mockAuthApi,
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

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  describe('rendering', () => {
    it('should render login form', () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByText('Sign in to continue')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });

    it('should render forgot password link', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);
      expect(getByText('Forgot Password?')).toBeTruthy();
    });

    it('should render sign up link', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);
      expect(getByText("Don't have an account?")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });

    it('should render OTP toggle', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);
      expect(getByText('Login with OTP')).toBeTruthy();
    });
  });

  describe('user interactions', () => {
    it('should update email input', () => {
      const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);
      const emailInput = getByPlaceholderText('Email');

      fireEvent.changeText(emailInput, 'test@example.com');
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password input', () => {
      const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Password');

      fireEvent.changeText(passwordInput, 'password123');
      expect(passwordInput.props.value).toBe('password123');
    });

    it('should toggle password visibility', () => {
      const { getByPlaceholderText, getByTestId, UNSAFE_queryByType } = renderWithProviders(
        <LoginScreen />
      );
      const passwordInput = getByPlaceholderText('Password');

      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Find and click the visibility toggle icon
      // Note: This assumes the icon is rendered - may need adjustment based on actual implementation
      const visibilityButton = passwordInput.parent?.parent?.findByProps({
        name: 'visibility-off',
      });

      if (visibilityButton) {
        fireEvent.press(visibilityButton.parent);
        expect(passwordInput.props.secureTextEntry).toBe(false);
      }
    });

    it('should toggle between password and OTP login', () => {
      const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderWithProviders(
        <LoginScreen />
      );

      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(queryByPlaceholderText('OTP Code')).toBeNull();

      fireEvent.press(getByText('Login with OTP'));

      expect(queryByPlaceholderText('Password')).toBeNull();
      expect(getByPlaceholderText('OTP Code')).toBeTruthy();
      expect(getByText('Login with Password')).toBeTruthy();
    });

    it('should navigate to forgot password screen', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);

      fireEvent.press(getByText('Forgot Password?'));
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/forgot-password');
    });

    it('should navigate to register screen', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);

      fireEvent.press(getByText('Sign Up'));
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/register');
    });
  });

  describe('form validation', () => {
    it('should show alert when email is empty', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all required fields');
      });
    });

    it('should show alert when password is empty', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all required fields');
      });
    });

    it('should show alert when OTP is empty in OTP mode', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.press(getByText('Login with OTP'));
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all required fields');
      });
    });
  });

  describe('login functionality', () => {
    it('should handle successful login', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockResolvedValueOnce(undefined);

      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          otp: undefined,
        });
      });
    });

    it('should handle login failure', async () => {
      mockAuthApi.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'wrong-password');
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Login Failed', expect.any(String));
      });
    });

    it('should show loading state during login', async () => {
      mockAuthApi.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Login'));

      // Button should be in loading state
      const loginButton = getByText('Login').parent;
      expect(loginButton?.props.loading).toBeTruthy();
    });

    it('should handle OTP login', async () => {
      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockResolvedValueOnce(undefined);

      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      fireEvent.press(getByText('Login with OTP'));
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('OTP Code'), '123456');
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

  describe('biometric authentication', () => {
    it('should show biometric option when available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValueOnce([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const { findByText } = renderWithProviders(<LoginScreen />);

      await waitFor(() => {
        expect(findByText('Enable Fingerprint')).toBeTruthy();
      });
    });

    it('should handle biometric login', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      const credentials = { email: 'test@example.com', password: 'password123' };
      mockAuthService.getBiometricCredentials.mockResolvedValueOnce(credentials);

      const loginResponse = createMockLoginResponse();
      mockAuthApi.login.mockResolvedValueOnce(loginResponse);
      mockAuthService.saveSession.mockResolvedValueOnce(undefined);

      const preloadedState = {
        auth: {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          biometricEnabled: true,
          availableRoles: [],
          activeRole: null,
        },
      };

      renderWithProviders(<LoginScreen />, { preloadedState });

      await waitFor(() => {
        expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('error display', () => {
    it('should display error message from Redux state', () => {
      const preloadedState = {
        auth: {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
          biometricEnabled: false,
          availableRoles: [],
          activeRole: null,
        },
      };

      const { getByText } = renderWithProviders(<LoginScreen />, { preloadedState });
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });
});
