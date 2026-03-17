import { create } from 'zustand';
import { User } from '@types';
import { storage } from '@utils/storage';
import { STORAGE_KEYS } from '@constants';
import { authApi, LoginRequest } from '@api/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(credentials);
      const { user, access_token } = response.data;

      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
      await storage.setObject(STORAGE_KEYS.USER_DATA, user);

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const user = await storage.getObject<User>(STORAGE_KEYS.USER_DATA);

      if (token && user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },

  setUser: (user: User | null) => set({ user }),

  setToken: (token: string | null) => set({ token }),

  clearError: () => set({ error: null }),
}));
