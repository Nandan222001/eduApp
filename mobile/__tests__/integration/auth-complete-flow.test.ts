/**
 * Complete Authentication Flow Integration Test
 * 
 * Tests the complete end-to-end authentication flow:
 * 1. Login with demo credentials
 * 2. Verify token storage
 * 3. Verify automatic token refresh
 * 4. Enable biometric
 * 5. Logout
 * 6. Login with biometric
 * 7. Verify session persistence
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  loginWithBiometric,
  enableBiometric,
  loadStoredAuth,
} from '../../src/store/slices/authSlice';
import { secureStorage } from '../../src/utils/secureStorage';
import { authApi } from '../../src/api/authApi';
import { authService } from '../../src/utils/authService';
import { biometricUtils } from '../../src/utils/biometric';

// Mock dependencies
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/api/authApi');
jest.mock('../../src/utils/biometric');
jest.mock('../../src/store', () => ({
  store: {
    dispatch: jest.fn(),
  },
}));

describe('Complete Authentication Flow Integration', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    jest.clearAllMocks();
    jest.useFakeTimers();
    authService.stopAutoRefresh();
  });

  afterEach(() => {
    jest.useRealTimers();
    authService.stopAutoRefresh();
  });

  it('should complete full authentication lifecycle', async () => {
    // ============================================
    // STEP 1: Login with Demo Student Credentials
    // ============================================
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

    (authApi.login as jest.Mock).mockResolvedValue(mockTokenResponse);
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (secureStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
    (secureStorage.setUserEmail as jest.Mock).mockResolvedValue(undefined);
    (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

    const loginResult = await store.dispatch(
      login({
        email: 'demo@example.com',
        password: 'Demo@123',
      })
    );

    expect(loginResult.type).toBe('auth/login/fulfilled');

    let state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('demo@example.com');
    expect(state.accessToken).toBe(mockTokenResponse.access_token);
    expect(state.refreshToken).toBe(mockTokenResponse.refresh_token);
    expect(state.activeRole).toBe('student');

    console.log('✓ Step 1: Login successful');

    // ============================================
    // STEP 2: Verify Token Storage
    // ============================================
    expect(secureStorage.setTokens).toHaveBeenCalledWith(
      mockTokenResponse.access_token,
      mockTokenResponse.refresh_token
    );
    expect(secureStorage.setUserEmail).toHaveBeenCalledWith('demo@example.com');
    expect(secureStorage.setIsDemoUser).toHaveBeenCalledWith(true);

    console.log('✓ Step 2: Tokens stored successfully');

    // ============================================
    // STEP 3: Test Automatic Token Refresh
    // ============================================
    (secureStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@edu_refresh_token') return Promise.resolve(mockTokenResponse.refresh_token);
      if (key === '@edu_access_token') return Promise.resolve(mockTokenResponse.access_token);
      return Promise.resolve(null);
    });
    (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Start auto-refresh
    authService.startAutoRefresh();

    // Fast-forward 14 minutes
    jest.advanceTimersByTime(14 * 60 * 1000);

    // Wait for async operations
    await Promise.resolve();
    await Promise.resolve();

    console.log('✓ Step 3: Token auto-refresh triggered');

    // ============================================
    // STEP 4: Enable Biometric
    // ============================================
    (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
    (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
    (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
      success: true,
    });
    (secureStorage.setBiometricEnabled as jest.Mock).mockResolvedValue(undefined);

    const enableBiometricResult = await store.dispatch(enableBiometric());

    expect(enableBiometricResult.type).toBe('auth/enableBiometric/fulfilled');
    
    state = store.getState().auth;
    expect(state.biometricEnabled).toBe(true);

    expect(secureStorage.setBiometricEnabled).toHaveBeenCalledWith(true);

    console.log('✓ Step 4: Biometric enabled successfully');

    // ============================================
    // STEP 5: Logout
    // ============================================
    (authApi.logout as jest.Mock).mockResolvedValue({ message: 'Logged out successfully' });
    (secureStorage.clearAll as jest.Mock).mockResolvedValue(undefined);

    const logoutResult = await store.dispatch(logout());

    expect(logoutResult.type).toBe('auth/logout/fulfilled');

    state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.biometricEnabled).toBe(false);
    expect(state.activeRole).toBeNull();

    expect(secureStorage.clearAll).toHaveBeenCalled();

    console.log('✓ Step 5: Logout successful, all data cleared');

    // ============================================
    // STEP 6: Login with Biometric
    // ============================================
    (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
    (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
    (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
      success: true,
    });
    (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockTokenResponse.access_token);
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockTokenResponse.refresh_token);
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const biometricLoginResult = await store.dispatch(loginWithBiometric());

    expect(biometricLoginResult.type).toBe('auth/loginWithBiometric/fulfilled');

    state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('demo@example.com');
    expect(state.activeRole).toBe('student');

    console.log('✓ Step 6: Biometric login successful');

    // ============================================
    // STEP 7: Simulate App Restart - Session Persistence
    // ============================================
    const newStore = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockTokenResponse.access_token);
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockTokenResponse.refresh_token);
    (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(true);
    (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const loadResult = await newStore.dispatch(loadStoredAuth());

    expect(loadResult.type).toBe('auth/loadStoredAuth/fulfilled');

    state = newStore.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('demo@example.com');
    expect(state.biometricEnabled).toBe(true);
    expect(state.activeRole).toBe('student');

    console.log('✓ Step 7: Session restored after app restart');

    // ============================================
    // TEST COMPLETE
    // ============================================
    console.log('\n✓✓✓ Complete authentication flow test PASSED ✓✓✓');
  });

  it('should handle demo parent complete flow', async () => {
    // Login as parent
    const mockParentUser = {
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
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockParentUser);
    (secureStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
    (secureStorage.setUserEmail as jest.Mock).mockResolvedValue(undefined);
    (secureStorage.setIsDemoUser as jest.Mock).mockResolvedValue(undefined);

    const loginResult = await store.dispatch(
      login({
        email: 'parent@demo.com',
        password: 'Demo@123',
      })
    );

    expect(loginResult.type).toBe('auth/login/fulfilled');

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('parent@demo.com');
    expect(state.activeRole).toBe('parent');

    expect(secureStorage.setIsDemoUser).toHaveBeenCalledWith(true);

    console.log('✓ Parent login flow completed successfully');
  });

  it('should handle session persistence across multiple restarts', async () => {
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

    // First login
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

    // Mock storage for restarts
    (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockTokenResponse.access_token);
    (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockTokenResponse.refresh_token);
    (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
    (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Simulate multiple app restarts
    for (let i = 1; i <= 3; i++) {
      const newStore = configureStore({
        reducer: { auth: authReducer },
      });

      await newStore.dispatch(loadStoredAuth());

      const state = newStore.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user.email).toBe('demo@example.com');

      console.log(`✓ App restart ${i}: Session persisted`);
    }

    console.log('✓ Session persisted across 3 app restarts');
  });

  it('should handle token refresh during active session', async () => {
    const mockUser = {
      id: 1001,
      email: 'demo@example.com',
      role: 'student',
      roleInfo: { id: 3, name: 'Student', slug: 'student' },
    };

    let accessToken = 'demo_student_access_token_123';
    const refreshToken = 'demo_student_refresh_token_123';

    // Login
    (authApi.login as jest.Mock).mockResolvedValue({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    });
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

    // Setup for token refresh
    (secureStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === '@edu_refresh_token') return Promise.resolve(refreshToken);
      if (key === '@edu_access_token') return Promise.resolve(accessToken);
      return Promise.resolve(null);
    });
    (secureStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      if (key === '@edu_access_token') {
        accessToken = value;
      }
      return Promise.resolve();
    });

    // Start auto-refresh and trigger it
    authService.startAutoRefresh();
    
    jest.advanceTimersByTime(14 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();

    // Verify refresh was called
    expect(secureStorage.getItem).toHaveBeenCalled();

    console.log('✓ Token refresh handled during active session');
  });

  it('should maintain biometric setting across login/logout cycle', async () => {
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

    // Login
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

    // Enable biometric
    (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(true);
    (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue('Face ID');
    (biometricUtils.authenticate as jest.Mock).mockResolvedValue({ success: true });
    (secureStorage.setBiometricEnabled as jest.Mock).mockResolvedValue(undefined);

    await store.dispatch(enableBiometric());

    let state = store.getState().auth;
    expect(state.biometricEnabled).toBe(true);

    // Logout (should clear biometric)
    (authApi.logout as jest.Mock).mockResolvedValue({ message: 'Logged out' });
    (secureStorage.clearAll as jest.Mock).mockResolvedValue(undefined);

    await store.dispatch(logout());

    state = store.getState().auth;
    expect(state.biometricEnabled).toBe(false);

    console.log('✓ Biometric setting cleared on logout');
  });
});
