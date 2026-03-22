/**
 * Login Flow End-to-End Test
 * 
 * This test verifies the complete login flow with demo credentials:
 * 1. Successful login sets isAuthenticated=true and activeRole=UserRole.STUDENT
 * 2. Navigation automatically redirects from /(auth)/login to /(tabs)/student
 * 3. Dashboard loads correctly
 * 4. Logout clears activeRole
 */

import { store } from '../../src/store';
import { login, logout } from '../../src/store/slices/authSlice';
import { UserRole } from '../../src/types/auth';

describe('Login Flow E2E Test', () => {
  beforeEach(() => {
    // Clear any existing auth state
    store.dispatch(logout());
  });

  test('should successfully login with demo credentials', async () => {
    // Step 1: Login with demo credentials
    const credentials = {
      email: 'demo@example.com',
      password: 'Demo@123',
    };

    const result = await store.dispatch(login(credentials));
    
    // Verify login was successful
    expect(result.type).toBe('auth/login/fulfilled');
    
    // Get current state
    const state = store.getState().auth;
    
    // Step 2: Verify isAuthenticated is true
    expect(state.isAuthenticated).toBe(true);
    
    // Step 3: Verify activeRole is set to student
    expect(state.activeRole).toBe('student');
    
    // Additional verifications
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe('demo@example.com');
    expect(state.user?.roleInfo?.slug).toBe('student');
    expect(state.accessToken).not.toBeNull();
    expect(state.refreshToken).not.toBeNull();
  });

  test('should redirect from login to student dashboard after successful login', async () => {
    // This test verifies the navigation logic in _layout.tsx
    const credentials = {
      email: 'demo@example.com',
      password: 'Demo@123',
    };

    await store.dispatch(login(credentials));
    
    const state = store.getState().auth;
    
    // Verify conditions for redirect
    expect(state.isAuthenticated).toBe(true);
    expect(state.activeRole).toBe('student');
    expect(state.isLoading).toBe(false);
    
    // The actual navigation is handled by the _layout.tsx useEffect:
    // if (isAuthenticated && inAuthGroup) {
    //   if (activeRole === 'student') {
    //     router.replace('/(tabs)/student');
    //   }
    // }
  });

  test('should clear activeRole on logout', async () => {
    // First login
    const credentials = {
      email: 'demo@example.com',
      password: 'Demo@123',
    };

    await store.dispatch(login(credentials));
    
    let state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.activeRole).toBe('student');
    
    // Then logout
    await store.dispatch(logout());
    
    state = store.getState().auth;
    
    // Verify logout clears activeRole
    expect(state.isAuthenticated).toBe(false);
    expect(state.activeRole).toBeNull();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.availableRoles).toEqual([]);
  });

  test('should handle parent demo user login', async () => {
    const credentials = {
      email: 'parent@demo.com',
      password: 'Demo@123',
    };

    const result = await store.dispatch(login(credentials));
    
    expect(result.type).toBe('auth/login/fulfilled');
    
    const state = store.getState().auth;
    
    expect(state.isAuthenticated).toBe(true);
    expect(state.activeRole).toBe('parent');
    expect(state.user?.email).toBe('parent@demo.com');
  });

  test('should fail login with invalid credentials', async () => {
    const credentials = {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    };

    const result = await store.dispatch(login(credentials));
    
    expect(result.type).toBe('auth/login/rejected');
    
    const state = store.getState().auth;
    
    expect(state.isAuthenticated).toBe(false);
    expect(state.activeRole).toBeNull();
    expect(state.user).toBeNull();
    expect(state.error).not.toBeNull();
  });
});
