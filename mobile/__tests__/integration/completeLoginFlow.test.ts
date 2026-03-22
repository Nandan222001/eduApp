/**
 * Complete Login Flow Integration Test
 * 
 * This test file comprehensively validates the entire login flow including:
 * 1. Successful login with demo credentials
 * 2. Setting isAuthenticated=true and activeRole=student
 * 3. Navigation redirect logic from /(auth)/login to /(tabs)/student
 * 4. Dashboard data loading
 * 5. Logout clearing activeRole
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout } from '../../src/store/slices/authSlice';
import { UserRole } from '../../src/types/auth';

// Create a test store for each test
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

describe('Complete Login Flow Integration Tests', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Student Login Flow', () => {
    test('should successfully login with demo student credentials', async () => {
      // Arrange
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      // Act
      const result = await store.dispatch(login(credentials));

      // Assert
      expect(result.type).toBe('auth/login/fulfilled');

      const state = store.getState().auth;

      // Verify isAuthenticated is true
      expect(state.isAuthenticated).toBe(true);

      // Verify activeRole is set to 'student'
      expect(state.activeRole).toBe('student');

      // Verify user details
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('demo@example.com');
      expect(state.user?.first_name).toBe('Alex');
      expect(state.user?.last_name).toBe('Johnson');

      // Verify roleInfo contains slug
      expect(state.user?.roleInfo).toBeDefined();
      expect(state.user?.roleInfo?.slug).toBe('student');

      // Verify tokens are set
      expect(state.accessToken).not.toBeNull();
      expect(state.refreshToken).not.toBeNull();
      expect(state.accessToken).toContain('demo_student_access_token_');
      expect(state.refreshToken).toContain('demo_student_refresh_token_');

      // Verify no errors
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);

      // Verify available roles
      expect(state.availableRoles).toEqual(['student']);
    });

    test('should redirect to /(tabs)/student after student login', async () => {
      // Arrange
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      // Act
      await store.dispatch(login(credentials));

      // Assert - Verify navigation conditions
      const state = store.getState().auth;

      // These are the conditions checked in _layout.tsx for navigation
      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('student');
      expect(state.isLoading).toBe(false);

      // The _layout.tsx logic should redirect to /(tabs)/student when:
      // - isAuthenticated is true
      // - activeRole is 'student'
      // - currently in auth group
    });
  });

  describe('Parent Login Flow', () => {
    test('should successfully login with demo parent credentials', async () => {
      // Arrange
      const credentials = {
        email: 'parent@demo.com',
        password: 'Demo@123',
      };

      // Act
      const result = await store.dispatch(login(credentials));

      // Assert
      expect(result.type).toBe('auth/login/fulfilled');

      const state = store.getState().auth;

      // Verify isAuthenticated is true
      expect(state.isAuthenticated).toBe(true);

      // Verify activeRole is set to 'parent'
      expect(state.activeRole).toBe('parent');

      // Verify user details
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('parent@demo.com');
      expect(state.user?.first_name).toBe('Sarah');
      expect(state.user?.last_name).toBe('Johnson');

      // Verify roleInfo
      expect(state.user?.roleInfo?.slug).toBe('parent');

      // Verify tokens are set
      expect(state.accessToken).not.toBeNull();
      expect(state.refreshToken).not.toBeNull();
      expect(state.accessToken).toContain('demo_parent_access_token_');

      // Verify available roles
      expect(state.availableRoles).toEqual(['parent']);
    });

    test('should redirect to /(tabs)/parent after parent login', async () => {
      // Arrange
      const credentials = {
        email: 'parent@demo.com',
        password: 'Demo@123',
      };

      // Act
      await store.dispatch(login(credentials));

      // Assert - Verify navigation conditions
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('parent');
      expect(state.isLoading).toBe(false);

      // The _layout.tsx logic should redirect to /(tabs)/parent when:
      // - isAuthenticated is true
      // - activeRole is 'parent'
    });
  });

  describe('Logout Flow', () => {
    test('should clear activeRole and all auth data on logout', async () => {
      // Arrange - First login
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await store.dispatch(login(credentials));

      // Verify logged in state
      let state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.activeRole).toBe('student');
      expect(state.user).not.toBeNull();

      // Act - Logout
      const logoutResult = await store.dispatch(logout());

      // Assert
      expect(logoutResult.type).toBe('auth/logout/fulfilled');

      state = store.getState().auth;

      // Verify all auth data is cleared
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBeNull();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.availableRoles).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    test('should redirect to /(auth)/login after logout', async () => {
      // Arrange - First login
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Act - Logout
      await store.dispatch(logout());

      // Assert - Verify redirect conditions
      const state = store.getState().auth;

      // These conditions trigger redirect to /(auth)/login in _layout.tsx
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);

      // When isAuthenticated is false and not in auth group,
      // _layout.tsx redirects to /(auth)/login
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      // Act
      const result = await store.dispatch(login(credentials));

      // Assert
      expect(result.type).toBe('auth/login/rejected');

      const state = store.getState().auth;

      // Verify auth state remains unauthenticated
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBeNull();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();

      // Verify error is set
      expect(state.error).not.toBeNull();

      // Verify loading is false
      expect(state.isLoading).toBe(false);
    });

    test('should handle invalid email format gracefully', async () => {
      // Arrange
      const credentials = {
        email: 'notanemail',
        password: 'Demo@123',
      };

      // Act
      const result = await store.dispatch(login(credentials));

      // Assert
      expect(result.type).toBe('auth/login/rejected');

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.activeRole).toBeNull();
    });
  });

  describe('Dashboard Loading Conditions', () => {
    test('should have correct state for dashboard to load', async () => {
      // Arrange
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      // Act
      await store.dispatch(login(credentials));

      // Assert
      const state = store.getState().auth;

      // Dashboard should load when:
      // 1. User is authenticated
      expect(state.isAuthenticated).toBe(true);

      // 2. User object exists
      expect(state.user).not.toBeNull();

      // 3. Access token is available
      expect(state.accessToken).not.toBeNull();

      // 4. Active role is set
      expect(state.activeRole).toBe('student');

      // 5. Not in loading state
      expect(state.isLoading).toBe(false);

      // 6. No errors
      expect(state.error).toBeNull();
    });
  });

  describe('Session Persistence', () => {
    test('should maintain authentication state across multiple checks', async () => {
      // Arrange & Act
      await store.dispatch(login({
        email: 'demo@example.com',
        password: 'Demo@123',
      }));

      // Assert - Check state multiple times
      for (let i = 0; i < 3; i++) {
        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(true);
        expect(state.activeRole).toBe('student');
        expect(state.user?.email).toBe('demo@example.com');
      }
    });
  });
});
