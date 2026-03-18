import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { renderWithProviders, createMockNavigation, server } from '../utils';
import { rest } from 'msw';

describe('Authentication Flow', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = { key: 'Login', name: 'Login' as const, params: undefined };

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should complete successful login flow', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(emailInput.props.value).toBe('test@example.com');
    });
  });

  it('should handle login failure', async () => {
    server.use(
      rest.post('http://localhost:8000/auth/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
      })
    );

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'wrong@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(emailInput.props.value).toBe('wrong@example.com');
    });
  });

  it('should handle OTP login flow', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const otpToggle = getByText('Login with OTP');
    fireEvent.press(otpToggle);

    await waitFor(() => {
      expect(getByPlaceholderText('OTP Code')).toBeTruthy();
    });

    const emailInput = getByPlaceholderText('Email');
    const otpInput = getByPlaceholderText('OTP Code');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(otpInput, '123456');
    fireEvent.press(loginButton);
  });

  it('should handle biometric login', async () => {
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

    await waitFor(() => {
      const biometricButton = getByText(/Login with/i);
      expect(biometricButton).toBeTruthy();
    });
  });

  it('should navigate through forgot password flow', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const forgotPasswordButton = getByText('Forgot Password?');
    fireEvent.press(forgotPasswordButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should navigate to registration', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });
});
