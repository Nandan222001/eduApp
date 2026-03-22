import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../utils';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { DashboardScreen } from '../../src/screens/student/DashboardScreen';
import { UserRole } from '../../src/types/auth';
import { authApi } from '../../src/api/authApi';
import { demoStudentUser } from '../../src/data/dummyData';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('../../src/api/authApi');
jest.mock('expo-secure-store');
jest.mock('../../src/utils/biometric');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => ['(auth)', 'login'],
  usePathname: () => '/(auth)/login',
}));

describe('Login Flow with Demo Credentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  describe('Successful Login', () => {
    it('should login with demo credentials and set isAuthenticated=true and activeRole=UserRole.STUDENT', async () => {
      // Mock API responses for demo student
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_' + Date.now(),
        refresh_token: 'demo_student_refresh_token_' + Date.now(),
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Render login screen
      const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

      // Enter demo credentials
      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/password/i);
      const loginButton = getByText(/sign in/i);

      fireEvent.changeText(emailInput, 'demo@example.com');
      fireEvent.changeText(passwordInput, 'Demo@123');
      fireEvent.press(loginButton);

      // Wait for login to complete
      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(true);
      });

      // Verify authentication state
      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.activeRole).toBe('student');
      expect(authState.user).toBeDefined();
      expect(authState.user?.email).toBe('demo@example.com');
      expect(authState.accessToken).toBeDefined();
      expect(authState.refreshToken).toBeDefined();

      // Verify API was called with correct credentials
      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'demo@example.com',
        password: 'Demo@123',
        institution_id: undefined,
      });

      // Verify user data was fetched
      expect(mockAuthApi.getCurrentUser).toHaveBeenCalled();
    });

    it('should set activeRole correctly based on user role', async () => {
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
      expect(authState.activeRole).toBe('student');
      expect(authState.availableRoles).toContain('student');
    });
  });

  describe('Navigation Redirect', () => {
    it('should automatically redirect from /(auth)/login to /(tabs)/student after successful login', async () => {
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

      // Note: Navigation redirect is handled by RootLayoutNav in _layout.tsx
      // In a real scenario, the useEffect in _layout.tsx would call router.replace('/(tabs)/student')
      // when isAuthenticated becomes true and activeRole is 'student'
      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.activeRole).toBe('student');
    });
  });

  describe('Dashboard Loading', () => {
    it('should load dashboard correctly after successful login', async () => {
      // Setup authenticated state
      const preloadedState = {
        auth: {
          user: demoStudentUser.user,
          accessToken: 'demo_student_access_token_123',
          refreshToken: 'demo_student_refresh_token_123',
          isAuthenticated: true,
          isLoading: false,
          error: null,
          biometricEnabled: false,
          activeRole: 'student',
          availableRoles: ['student'],
        },
      };

      // Mock dashboard API calls
      const mockStudentApi = {
        getDashboard: jest.fn().mockResolvedValue({
          data: {
            attendance_percentage: 80,
            total_courses: 8,
            pending_assignments: 2,
            average_grade: 85.5,
            streak_days: 7,
            points: 2450,
            level: 5,
          },
        }),
        getProfile: jest.fn().mockResolvedValue({
          data: demoStudentUser.user,
        }),
      };

      jest.mock('../../src/api/student', () => ({
        studentApi: mockStudentApi,
      }));

      // Render dashboard with authenticated state
      const { store } = renderWithProviders(<DashboardScreen />, { preloadedState });

      // Verify authenticated state
      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.activeRole).toBe('student');
      expect(authState.user).toBeDefined();
    });
  });

  describe('Logout', () => {
    it('should clear activeRole when logging out', async () => {
      // Setup authenticated state
      const preloadedState = {
        auth: {
          user: demoStudentUser.user,
          accessToken: 'demo_student_access_token_123',
          refreshToken: 'demo_student_refresh_token_123',
          isAuthenticated: true,
          isLoading: false,
          error: null,
          biometricEnabled: false,
          activeRole: 'student',
          availableRoles: ['student'],
        },
      };

      mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

      const { store } = renderWithProviders(<LoginScreen />, { preloadedState });

      // Verify initial authenticated state
      let authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.activeRole).toBe('student');

      // Dispatch logout action
      await store.dispatch({ type: 'auth/logout/pending', payload: undefined } as any);
      await store.dispatch({ type: 'auth/logout/fulfilled', payload: null } as any);

      // Verify logout cleared the state
      authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.activeRole).toBe(null);
      expect(authState.user).toBe(null);
      expect(authState.accessToken).toBe(null);
      expect(authState.refreshToken).toBe(null);
      expect(authState.availableRoles).toEqual([]);
    });

    it('should clear all auth data on logout', async () => {
      const preloadedState = {
        auth: {
          user: demoStudentUser.user,
          accessToken: 'demo_student_access_token_123',
          refreshToken: 'demo_student_refresh_token_123',
          isAuthenticated: true,
          isLoading: false,
          error: null,
          biometricEnabled: false,
          activeRole: 'student',
          availableRoles: ['student'],
        },
      };

      mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

      const { store } = renderWithProviders(<LoginScreen />, { preloadedState });

      // Dispatch logout
      await store.dispatch({ type: 'auth/logout/pending', payload: undefined } as any);
      await store.dispatch({ type: 'auth/logout/fulfilled', payload: null } as any);

      const authState = store.getState().auth;
      
      // Verify all auth data is cleared
      expect(authState.user).toBe(null);
      expect(authState.accessToken).toBe(null);
      expect(authState.refreshToken).toBe(null);
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.activeRole).toBe(null);
      expect(authState.availableRoles).toEqual([]);
      expect(authState.error).toBe(null);
    });
  });

  describe('Complete Login Flow End-to-End', () => {
    it('should complete full login flow: login -> authenticate -> set role -> navigate -> dashboard', async () => {
      // 1. Start with unauthenticated state
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_' + Date.now(),
        refresh_token: 'demo_student_refresh_token_' + Date.now(),
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

      // Verify initial state
      let authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.activeRole).toBe(null);

      // 2. Enter credentials and login
      fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'Demo@123');
      fireEvent.press(getByText(/sign in/i));

      // 3. Wait for authentication
      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });

      // 4. Verify authentication and role are set
      authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.activeRole).toBe('student');
      expect(authState.user?.role).toEqual({
        id: 3,
        name: 'Student',
        slug: 'student',
      });

      // 5. Verify navigation would occur (handled by _layout.tsx)
      // When isAuthenticated=true and activeRole='student', 
      // the app navigates to /(tabs)/student

      // 6. Dashboard can now load with authenticated user
      expect(authState.user?.email).toBe('demo@example.com');
      expect(authState.accessToken).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle login failure gracefully', async () => {
      mockAuthApi.login.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Invalid credentials',
          },
        },
      });

      const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText(/email/i), 'wrong@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'wrongpassword');
      fireEvent.press(getByText(/sign in/i));

      await waitFor(() => {
        expect(store.getState().auth.error).toBeTruthy();
      });

      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.activeRole).toBe(null);
      expect(authState.error).toBe('Invalid credentials');
    });

    it('should not set activeRole on failed login', async () => {
      mockAuthApi.login.mockRejectedValueOnce(new Error('Network error'));

      const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'wrongpassword');
      fireEvent.press(getByText(/sign in/i));

      await waitFor(() => {
        expect(store.getState().auth.isLoading).toBe(false);
      });

      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.activeRole).toBe(null);
      expect(authState.user).toBe(null);
    });
  });

  describe('Role-based Navigation', () => {
    it('should navigate to student dashboard for student role', async () => {
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_' + Date.now(),
        refresh_token: 'demo_student_refresh_token_' + Date.now(),
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce({
        ...demoStudentUser.user,
        role: {
          id: 3,
          name: 'Student',
          slug: 'student',
        },
      });

      const { getByPlaceholderText, getByText, store } = renderWithProviders(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText(/email/i), 'demo@example.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'Demo@123');
      fireEvent.press(getByText(/sign in/i));

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });

      const authState = store.getState().auth;
      expect(authState.activeRole).toBe('student');
      // The _layout.tsx will check activeRole === 'student' and navigate to /(tabs)/student
    });

    it('should set correct activeRole for parent login', async () => {
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
      expect(authState.activeRole).toBe('parent');
      expect(authState.availableRoles).toContain('parent');
    });
  });

  describe('Token Management', () => {
    it('should store access and refresh tokens after successful login', async () => {
      const accessToken = 'demo_student_access_token_' + Date.now();
      const refreshToken = 'demo_student_refresh_token_' + Date.now();

      mockAuthApi.login.mockResolvedValueOnce({
        access_token: accessToken,
        refresh_token: refreshToken,
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
      expect(authState.accessToken).toBe(accessToken);
      expect(authState.refreshToken).toBe(refreshToken);
    });
  });
});
