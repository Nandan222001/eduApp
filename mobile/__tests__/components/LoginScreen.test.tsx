import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { renderWithProviders, createMockNavigation } from '../utils';
import { login } from '../../src/store/slices/authSlice';

jest.mock('../../src/store/slices/authSlice', () => ({
  ...jest.requireActual('../../src/store/slices/authSlice'),
  login: jest.fn(),
}));

describe('LoginScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = { key: 'Login', name: 'Login' as const, params: undefined };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should update password input', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should toggle password visibility', () => {
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const passwordInput = getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should show error when fields are empty', async () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText(/fill in all required fields/i)).toBeTruthy();
    });
  });

  it('should navigate to forgot password screen', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const forgotPasswordButton = getByText('Forgot Password?');
    fireEvent.press(forgotPasswordButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should navigate to register screen', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('should toggle between password and OTP login', () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByPlaceholderText('Password')).toBeTruthy();

    const otpToggle = getByText('Login with OTP');
    fireEvent.press(otpToggle);

    expect(queryByPlaceholderText('Password')).toBeNull();
    expect(getByPlaceholderText('OTP Code')).toBeTruthy();
  });

  it('should display biometric option when available', () => {
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

    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />,
      { preloadedState }
    );

    expect(getByText(/Enable/i)).toBeTruthy();
  });
});
