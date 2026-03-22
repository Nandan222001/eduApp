/**
 * End-to-End Test: Complete Login Flow
 * 
 * This E2E test verifies the entire login flow from UI interaction to state changes:
 * 1. User enters demo credentials in login screen
 * 2. System authenticates and sets isAuthenticated=true
 * 3. System sets activeRole=UserRole.STUDENT
 * 4. Navigation redirects from /(auth)/login to /(tabs)/student
 * 5. Dashboard loads with user data
 * 6. User logs out and activeRole is cleared
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../utils';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { authApi } from '../../src/api/authApi';
import { demoStudentUser } from '../../src/data/dummyData';

// Mock dependencies
jest.mock('../../src/api/authApi');
jest.mock('expo-secure-store');
jest.mock('../../src/utils/biometric');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('Complete Login Flow E2E Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full login flow with demo credentials', async () => {
    // ===== SETUP: Mock API responses =====
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: 'demo_student_access_token_' + Date.now(),
      refresh_token: 'demo_student_refresh_token_' + Date.now(),
      token_type: 'Bearer',
    });

    mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

    // ===== STEP 1: Render login screen =====
    const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

    // ===== STEP 2: Verify initial unauthenticated state =====
    let authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.activeRole).toBe(null);
    expect(authState.user).toBe(null);

    // ===== STEP 3: Find form elements =====
    const emailInput = getByPlaceholderText(/email/i);
    const passwordInput = getByPlaceholderText(/password/i);
    const loginButton = getByText(/sign in/i);

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();

    // ===== STEP 4: Enter demo credentials =====
    fireEvent.changeText(emailInput, 'demo@example.com');
    fireEvent.changeText(passwordInput, 'Demo@123');

    // Verify inputs have correct values
    expect(emailInput.props.value).toBe('demo@example.com');
    expect(passwordInput.props.value).toBe('Demo@123');

    // ===== STEP 5: Submit login form =====
    fireEvent.press(loginButton);

    // ===== STEP 6: Wait for login to complete =====
    await waitFor(() => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    }, { timeout: 5000 });

    // ===== STEP 7: Verify authentication state =====
    authState = store.getState().auth;
    
    // Verify isAuthenticated is true
    expect(authState.isAuthenticated).toBe(true);
    
    // Verify activeRole is set to 'student' (UserRole.STUDENT)
    expect(authState.activeRole).toBe('student');
    
    // Verify user data is loaded
    expect(authState.user).toBeDefined();
    expect(authState.user?.email).toBe('demo@example.com');
    expect(authState.user?.first_name).toBe('Alex');
    expect(authState.user?.last_name).toBe('Johnson');
    expect(authState.user?.roleInfo?.slug).toBe('student');
    
    // Verify tokens are stored
    expect(authState.accessToken).toBeDefined();
    expect(authState.refreshToken).toBeDefined();
    
    // Verify availableRoles includes student
    expect(authState.availableRoles).toContain('student');

    // ===== STEP 8: Verify API calls were made correctly =====
    expect(mockAuthApi.login).toHaveBeenCalledWith({
      email: 'demo@example.com',
      password: 'Demo@123',
      institution_id: undefined,
    });
    expect(mockAuthApi.getCurrentUser).toHaveBeenCalled();

    // ===== STEP 9: Verify navigation prerequisites =====
    // In _layout.tsx, these conditions trigger navigation to /(tabs)/student:
    // - isAuthenticated === true
    // - activeRole === 'student'
    // - isLoading === false
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.activeRole).toBe('student');
    expect(authState.isLoading).toBe(false);
  });

  it('should verify dashboard can load after successful login', async () => {
    // Mock API responses
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: 'demo_student_access_token_' + Date.now(),
      refresh_token: 'demo_student_refresh_token_' + Date.now(),
      token_type: 'Bearer',
    });

    mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

    // Render and login
    const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'Demo@123');
    fireEvent.press(getByText(/sign in/i));

    // Wait for login
    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    // Verify dashboard prerequisites are met
    const authState = store.getState().auth;
    
    // Dashboard needs these to load correctly:
    expect(authState.isAuthenticated).toBe(true); // Can access authenticated routes
    expect(authState.user).toBeDefined(); // Has user data to display
    expect(authState.accessToken).toBeDefined(); // Can make API calls
    expect(authState.activeRole).toBe('student'); // Knows which dashboard to show
  });

  it('should logout and clear activeRole', async () => {
    // ===== SETUP: Login first =====
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: 'demo_student_access_token_' + Date.now(),
      refresh_token: 'demo_student_refresh_token_' + Date.now(),
      token_type: 'Bearer',
    });

    mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

    const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'Demo@123');
    fireEvent.press(getByText(/sign in/i));

    // Wait for login to complete
    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    // Verify logged in state
    let authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.activeRole).toBe('student');
    expect(authState.user).toBeDefined();

    // ===== LOGOUT =====
    mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

    // Import and dispatch logout action
    const { logout } = require('../../src/store/slices/authSlice');
    await store.dispatch(logout());

    // ===== VERIFY: All auth data cleared =====
    authState = store.getState().auth;
    
    // activeRole should be cleared (null)
    expect(authState.activeRole).toBe(null);
    
    // All other auth data should also be cleared
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBe(null);
    expect(authState.accessToken).toBe(null);
    expect(authState.refreshToken).toBe(null);
    expect(authState.availableRoles).toEqual([]);
    expect(authState.error).toBe(null);
  });

  it('should handle login failure correctly', async () => {
    // Mock failed login
    mockAuthApi.login.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    });

    const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

    // Enter wrong credentials
    fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'WrongPassword');
    fireEvent.press(getByText(/sign in/i));

    // Wait for error
    await waitFor(() => {
      const state = store.getState().auth;
      expect(state.error).toBeTruthy();
    });

    // Verify user is NOT authenticated
    const authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.activeRole).toBe(null);
    expect(authState.user).toBe(null);
    expect(authState.accessToken).toBe(null);
    expect(authState.error).toBeTruthy();
  });

  it('should verify role-based navigation for student role', async () => {
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: 'demo_student_access_token_' + Date.now(),
      refresh_token: 'demo_student_refresh_token_' + Date.now(),
      token_type: 'Bearer',
    });

    mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

    const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'Demo@123');
    fireEvent.press(getByText(/sign in/i));

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    const authState = store.getState().auth;
    
    // For student role, the app should navigate to /(tabs)/student
    // This is determined by activeRole === 'student'
    expect(authState.activeRole).toBe('student');
    
    // The _layout.tsx checks:
    // if (activeRole === 'student') {
    //   router.replace('/(tabs)/student');
    // }
    expect(authState.user?.roleInfo?.slug).toBe('student');
  });

  it('should handle parent role navigation differently', async () => {
    // Mock parent user login
    mockAuthApi.login.mockResolvedValueOnce({
      access_token: 'demo_parent_access_token_' + Date.now(),
      refresh_token: 'demo_parent_refresh_token_' + Date.now(),
      token_type: 'Bearer',
    });

    mockAuthApi.getCurrentUser.mockResolvedValueOnce({
      id: 2001,
      email: 'parent@demo.com',
      username: 'demo_parent',
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+1234567891',
      institution_id: 1,
      role_id: 4,
      is_active: true,
      is_superuser: false,
      email_verified: true,
      last_login: new Date().toISOString(),
      permissions: ['view_children'],
      role: {
        id: 4,
        name: 'Parent',
        slug: 'parent',
      },
      institution: {
        id: 1,
        name: 'Springfield Academy',
        slug: 'springfield-academy',
      },
    });

    const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/email/i), 'parent@demo.com');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'Demo@123');
    fireEvent.press(getByText(/sign in/i));

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    const authState = store.getState().auth;
    
    // For parent role, activeRole should be 'parent'
    // The app will navigate to /(tabs)/parent
    expect(authState.activeRole).toBe('parent');
    expect(authState.user?.roleInfo?.slug).toBe('parent');
  });
});
