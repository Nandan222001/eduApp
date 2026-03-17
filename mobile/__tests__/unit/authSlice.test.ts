import authReducer, {
  login,
  logout,
  refreshTokens,
  loadStoredAuth,
  enableBiometric,
  disableBiometric,
  setUser,
  setTokens,
  clearError,
  updateUser,
  setActiveRole,
} from '../../src/store/slices/authSlice';
import { createMockStore, createMockUser, createInitialAuthState } from '../utils';

// Mock dependencies
jest.mock('../../src/api/auth');
jest.mock('../../src/utils/secureStorage');
jest.mock('../../src/utils/authService');

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

describe('authSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(createInitialAuthState());
    });
  });

  describe('reducers', () => {
    it('should handle setUser', () => {
      const user = createMockUser();
      const state = authReducer(createInitialAuthState(), setUser(user));
      expect(state.user).toEqual(user);
      expect(state.availableRoles).toEqual([user.role]);
      expect(state.activeRole).toEqual(user.role);
    });

    it('should handle setUser with null', () => {
      const initialState = {
        ...createInitialAuthState(),
        user: createMockUser(),
        availableRoles: ['student' as const],
        activeRole: 'student' as const,
      };
      const state = authReducer(initialState, setUser(null));
      expect(state.user).toBeNull();
      expect(state.availableRoles).toEqual([]);
      expect(state.activeRole).toBeNull();
    });

    it('should handle setTokens', () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      const state = authReducer(createInitialAuthState(), setTokens(tokens));
      expect(state.accessToken).toEqual(tokens.accessToken);
      expect(state.refreshToken).toEqual(tokens.refreshToken);
    });

    it('should handle clearError', () => {
      const initialState = {
        ...createInitialAuthState(),
        error: 'Test error',
      };
      const state = authReducer(initialState, clearError());
      expect(state.error).toBeNull();
    });

    it('should handle updateUser', () => {
      const user = createMockUser();
      const initialState = {
        ...createInitialAuthState(),
        user,
      };
      const updates = { first_name: 'Updated' };
      const state = authReducer(initialState, updateUser(updates));
      expect(state.user?.first_name).toEqual('Updated');
      expect(state.user?.last_name).toEqual(user.last_name);
    });

    it('should handle setActiveRole', () => {
      const user = createMockUser({ roles: ['student', 'parent'] });
      const initialState = {
        ...createInitialAuthState(),
        user,
        availableRoles: ['student' as const, 'parent' as const],
        activeRole: 'student' as const,
      };
      const state = authReducer(initialState, setActiveRole('parent' as const));
      expect(state.activeRole).toEqual('parent');
    });
  });

  describe('async thunks', () => {
    describe('login', () => {
      it('should handle successful login', async () => {
        const user = createMockUser();
        const loginResponse = {
          data: {
            user,
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
          },
        };

        mockAuthApi.login.mockResolvedValueOnce(loginResponse);
        mockAuthService.saveSession.mockResolvedValueOnce(undefined);

        const store = createMockStore();
        await store.dispatch(login({ email: 'test@example.com', password: 'password123' }));

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(user);
        expect(state.accessToken).toEqual('test-access-token');
        expect(state.refreshToken).toEqual('test-refresh-token');
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle login failure', async () => {
        mockAuthApi.login.mockRejectedValueOnce(new Error('Invalid credentials'));

        const store = createMockStore();
        await store.dispatch(login({ email: 'test@example.com', password: 'wrong-password' }));

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Invalid credentials');
      });

      it('should set loading state during login', () => {
        const store = createMockStore();
        mockAuthApi.login.mockReturnValueOnce(new Promise(() => {}));

        store.dispatch(login({ email: 'test@example.com', password: 'password123' }));

        const state = store.getState().auth;
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });
    });

    describe('logout', () => {
      it('should handle successful logout', async () => {
        const user = createMockUser();
        const initialState = {
          ...createInitialAuthState(),
          user,
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
          biometricEnabled: true,
        };

        mockAuthApi.logout.mockResolvedValueOnce({});
        mockAuthService.clearSession.mockResolvedValueOnce(undefined);

        const store = createMockStore({ auth: initialState });
        await store.dispatch(logout());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.accessToken).toBeNull();
        expect(state.refreshToken).toBeNull();
        expect(state.biometricEnabled).toBe(false);
        expect(state.availableRoles).toEqual([]);
        expect(state.activeRole).toBeNull();
      });

      it('should clear session even if API call fails', async () => {
        mockAuthApi.logout.mockRejectedValueOnce(new Error('API error'));
        mockAuthService.clearSession.mockResolvedValueOnce(undefined);

        const store = createMockStore();
        await store.dispatch(logout());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(mockAuthService.clearSession).toHaveBeenCalled();
      });
    });

    describe('refreshTokens', () => {
      it('should handle successful token refresh', async () => {
        mockSecureStorage.getItem.mockResolvedValueOnce('old-refresh-token');
        mockAuthApi.refreshToken.mockResolvedValueOnce({
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          },
        });

        const store = createMockStore();
        await store.dispatch(refreshTokens());

        const state = store.getState().auth;
        expect(state.accessToken).toEqual('new-access-token');
        expect(state.refreshToken).toEqual('new-refresh-token');
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
          expect.any(String),
          'new-access-token'
        );
      });

      it('should handle token refresh failure and clear session', async () => {
        mockSecureStorage.getItem.mockResolvedValueOnce('old-refresh-token');
        mockAuthApi.refreshToken.mockRejectedValueOnce(new Error('Token expired'));
        mockAuthService.clearSession.mockResolvedValueOnce(undefined);

        const store = createMockStore();
        await store.dispatch(refreshTokens());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(mockAuthService.clearSession).toHaveBeenCalled();
      });

      it('should reject if no refresh token available', async () => {
        mockSecureStorage.getItem.mockResolvedValueOnce(null);

        const store = createMockStore();
        const result = await store.dispatch(refreshTokens());

        expect(result.type).toContain('rejected');
      });
    });

    describe('loadStoredAuth', () => {
      it('should load stored authentication data', async () => {
        const user = createMockUser();
        mockSecureStorage.getItem.mockImplementation((key: string) => {
          if (key.includes('ACCESS_TOKEN')) return Promise.resolve('stored-access-token');
          if (key.includes('REFRESH_TOKEN')) return Promise.resolve('stored-refresh-token');
          if (key.includes('BIOMETRIC_ENABLED')) return Promise.resolve('true');
          if (key.includes('ACTIVE_ROLE')) return Promise.resolve('student');
          return Promise.resolve(null);
        });
        mockSecureStorage.getObject.mockResolvedValueOnce(user);
        mockAuthService.checkAndRefreshIfNeeded.mockResolvedValueOnce(undefined);

        const store = createMockStore();
        await store.dispatch(loadStoredAuth());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(user);
        expect(state.accessToken).toEqual('stored-access-token');
        expect(state.biometricEnabled).toBe(true);
      });

      it('should return null if no stored data', async () => {
        mockSecureStorage.getItem.mockResolvedValue(null);
        mockSecureStorage.getObject.mockResolvedValue(null);

        const store = createMockStore();
        const result = await store.dispatch(loadStoredAuth());

        expect(result.payload).toBeNull();
        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
      });
    });

    describe('enableBiometric', () => {
      it('should enable biometric authentication', async () => {
        mockSecureStorage.setObject.mockResolvedValueOnce(undefined);
        mockSecureStorage.setItem.mockResolvedValueOnce(undefined);

        const store = createMockStore();
        await store.dispatch(
          enableBiometric({ email: 'test@example.com', password: 'password123' })
        );

        const state = store.getState().auth;
        expect(state.biometricEnabled).toBe(true);
        expect(mockSecureStorage.setObject).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123',
          })
        );
      });
    });

    describe('disableBiometric', () => {
      it('should disable biometric authentication', async () => {
        mockSecureStorage.removeItem.mockResolvedValueOnce(undefined);
        mockSecureStorage.setItem.mockResolvedValueOnce(undefined);

        const store = createMockStore({
          auth: { ...createInitialAuthState(), biometricEnabled: true },
        });
        await store.dispatch(disableBiometric());

        const state = store.getState().auth;
        expect(state.biometricEnabled).toBe(false);
        expect(mockSecureStorage.removeItem).toHaveBeenCalled();
      });
    });
  });
});
