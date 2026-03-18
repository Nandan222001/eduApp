import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  refreshTokens,
  setUser,
  setTokens,
  clearError,
  updateUser,
  setActiveRole,
} from '../../src/store/slices/authSlice';
import { authApi } from '../../src/api/auth';
import { authService } from '../../src/utils/authService';
import { secureStorage } from '../../src/utils/secureStorage';

jest.mock('../../src/api/auth');
jest.mock('../../src/utils/authService');
jest.mock('../../src/utils/secureStorage');

describe('authSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        biometricEnabled: false,
        availableRoles: [],
        activeRole: null,
      });
    });
  });

  describe('reducers', () => {
    it('should handle setUser', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'student' as const,
        roles: ['student' as const],
        avatar: null,
        phone: '1234567890',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      store.dispatch(setUser(user));
      const state = store.getState().auth;

      expect(state.user).toEqual(user);
      expect(state.availableRoles).toEqual(['student']);
      expect(state.activeRole).toBe('student');
    });

    it('should handle setTokens', () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      store.dispatch(setTokens(tokens));
      const state = store.getState().auth;

      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });

    it('should handle clearError', () => {
      store.dispatch(clearError());
      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });

    it('should handle updateUser', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'student' as const,
        roles: ['student' as const],
        avatar: null,
        phone: '1234567890',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      store.dispatch(setUser(user));
      store.dispatch(updateUser({ first_name: 'Updated' }));

      const state = store.getState().auth;
      expect(state.user?.first_name).toBe('Updated');
    });

    it('should handle setActiveRole', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'student' as const,
        roles: ['student' as const, 'parent' as const],
        avatar: null,
        phone: '1234567890',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      store.dispatch(setUser(user));
      store.dispatch(setActiveRole('parent' as const));

      const state = store.getState().auth;
      expect(state.activeRole).toBe('parent');
    });
  });

  describe('async thunks', () => {
    describe('login', () => {
      it('should handle successful login', async () => {
        const mockResponse = {
          data: {
            user: {
              id: 1,
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              role: 'student',
              roles: ['student'],
              avatar: null,
              phone: '1234567890',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        };

        (authApi.login as jest.Mock).mockResolvedValue(mockResponse);
        (authService.saveSession as jest.Mock).mockResolvedValue(undefined);

        await store.dispatch(
          login({ email: 'test@example.com', password: 'password123' })
        );

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockResponse.data.user);
        expect(state.accessToken).toBe('access-token');
        expect(state.isLoading).toBe(false);
      });

      it('should handle login failure', async () => {
        (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

        await store.dispatch(
          login({ email: 'test@example.com', password: 'wrong' })
        );

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toBeTruthy();
        expect(state.isLoading).toBe(false);
      });
    });

    describe('logout', () => {
      it('should handle logout', async () => {
        (authApi.logout as jest.Mock).mockResolvedValue({});
        (authService.clearSession as jest.Mock).mockResolvedValue(undefined);

        await store.dispatch(logout());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.accessToken).toBeNull();
      });
    });

    describe('refreshTokens', () => {
      it('should handle successful token refresh', async () => {
        (secureStorage.getItem as jest.Mock).mockResolvedValue('old-refresh-token');
        (authApi.refreshToken as jest.Mock).mockResolvedValue({
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          },
        });

        await store.dispatch(refreshTokens());

        const state = store.getState().auth;
        expect(state.accessToken).toBe('new-access-token');
        expect(state.refreshToken).toBe('new-refresh-token');
      });

      it('should handle refresh failure', async () => {
        (secureStorage.getItem as jest.Mock).mockResolvedValue(null);

        await store.dispatch(refreshTokens());

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
      });
    });
  });
});
