/**
 * Integration Test: Demo User Login Flow
 * 
 * This test verifies the complete login flow with demo credentials:
 * - Login with demo@example.com/Demo@123
 * - Verify isAuthenticated=true and activeRole=UserRole.STUDENT
 * - Verify automatic navigation from /(auth)/login to /(tabs)/student
 * - Verify dashboard loads correctly
 * - Verify logout clears activeRole
 */

import { login, logout } from '../../src/store/slices/authSlice';
import { createMockStore } from '../utils/mockStore';
import { demoStudentUser } from '../../src/data/dummyData';
import { authApi } from '../../src/api/authApi';
import { UserRole } from '../../src/types/auth';

// Mock the authApi
jest.mock('../../src/api/authApi');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('Demo User Login Flow Integration Test', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    // Create a fresh store for each test
    store = createMockStore();
    jest.clearAllMocks();
  });

  describe('1. Successful Login with Demo Credentials', () => {
    it('should set isAuthenticated=true when logging in with demo@example.com/Demo@123', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify isAuthenticated is true
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set activeRole=UserRole.STUDENT for demo student user', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify activeRole is set to 'student'
      const state = store.getState().auth;
      expect(state.activeRole).toBe('student');
      expect(state.user?.roleInfo?.slug).toBe('student');
    });

    it('should store user data correctly after login', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify user data
      const state = store.getState().auth;
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('demo@example.com');
      expect(state.user?.first_name).toBe('Alex');
      expect(state.user?.last_name).toBe('Johnson');
    });

    it('should store access and refresh tokens', async () => {
      // Mock API responses
      const accessToken = 'demo_student_access_token_123';
      const refreshToken = 'demo_student_refresh_token_123';

      mockAuthApi.login.mockResolvedValueOnce({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify tokens are stored
      const state = store.getState().auth;
      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
    });
  });

  describe('2. Navigation Redirect', () => {
    it('should have correct state for navigation to /(tabs)/student', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify state that triggers navigation
      // In _layout.tsx, when isAuthenticated=true and activeRole='student', 
      // it calls router.replace('/(tabs)/student')
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('student');
      expect(state.isLoading).toBe(false);
    });

    it('should set availableRoles for role-based navigation', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify availableRoles includes student
      const state = store.getState().auth;
      expect(state.availableRoles).toContain('student');
    });
  });

  describe('3. Dashboard Loading', () => {
    it('should have authenticated state ready for dashboard to load', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify dashboard prerequisites
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.accessToken).toBeDefined();
      expect(state.activeRole).toBe('student');
      
      // Dashboard can now make API calls with the access token
      expect(state.accessToken).toBeTruthy();
    });

    it('should provide user data for dashboard display', async () => {
      // Mock API responses
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      // Dispatch login action
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify user data available for dashboard
      const state = store.getState().auth;
      expect(state.user?.first_name).toBe('Alex');
      expect(state.user?.last_name).toBe('Johnson');
      expect(state.user?.email).toBe('demo@example.com');
    });
  });

  describe('4. Logout Clears activeRole', () => {
    it('should clear activeRole when logging out', async () => {
      // First, setup logged in state
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify logged in
      let state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('student');

      // Mock logout
      mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

      // Dispatch logout action
      await store.dispatch(logout());

      // Verify activeRole is cleared
      state = store.getState().auth;
      expect(state.activeRole).toBe(null);
    });

    it('should clear all auth data on logout', async () => {
      // First, setup logged in state
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Mock logout
      mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

      // Dispatch logout action
      await store.dispatch(logout());

      // Verify all auth data is cleared
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBe(null);
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.availableRoles).toEqual([]);
    });

    it('should set isAuthenticated to false after logout', async () => {
      // First, setup logged in state
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Mock logout
      mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });

      // Dispatch logout action
      await store.dispatch(logout());

      // Verify isAuthenticated is false
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('5. Complete End-to-End Flow', () => {
    it('should complete full cycle: login -> authenticate -> navigate -> logout', async () => {
      // ===== STEP 1: Initial State =====
      let state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBe(null);

      // ===== STEP 2: Login =====
      mockAuthApi.login.mockResolvedValueOnce({
        access_token: 'demo_student_access_token_123',
        refresh_token: 'demo_student_refresh_token_123',
        token_type: 'Bearer',
      });

      mockAuthApi.getCurrentUser.mockResolvedValueOnce(demoStudentUser.user);

      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // ===== STEP 3: Verify Authentication =====
      state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('student');
      expect(state.user?.email).toBe('demo@example.com');

      // ===== STEP 4: Verify Navigation Prerequisites =====
      // Navigation to /(tabs)/student would happen based on these conditions
      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('student');
      expect(state.isLoading).toBe(false);

      // ===== STEP 5: Verify Dashboard Prerequisites =====
      // Dashboard can load with this state
      expect(state.user).toBeDefined();
      expect(state.accessToken).toBeTruthy();

      // ===== STEP 6: Logout =====
      mockAuthApi.logout.mockResolvedValueOnce({ message: 'Logged out successfully' });
      await store.dispatch(logout());

      // ===== STEP 7: Verify Logout =====
      state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBe(null);
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
    });
  });

  describe('6. Error Handling', () => {
    it('should not set activeRole on failed login', async () => {
      // Mock failed login
      mockAuthApi.login.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Invalid credentials',
          },
        },
      });

      // Attempt login with wrong credentials
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'WrongPassword',
      }));

      // Verify activeRole is not set
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBe(null);
      expect(state.user).toBe(null);
      expect(state.error).toBeTruthy();
    });

    it('should maintain unauthenticated state on login error', async () => {
      // Mock network error
      mockAuthApi.login.mockRejectedValueOnce(new Error('Network error'));

      // Attempt login
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Verify state remains unauthenticated
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBe(null);
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
    });
  });
});
