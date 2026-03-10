import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser, AuthTokens } from '@/types/auth';
import { tokenManager } from '@/lib/tokenManager';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: AuthUser, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user) => set({ user }),

        setTokens: (tokens) => {
          tokenManager.setTokens(tokens);
        },

        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        setLoading: (isLoading) => set({ isLoading }),

        login: (user, tokens) => {
          tokenManager.setTokens(tokens);
          set({ user, isAuthenticated: true, isLoading: false });
        },

        logout: () => {
          tokenManager.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        },

        updateUser: (userData) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          })),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
