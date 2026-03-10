import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser, AuthTokens } from '@/types/auth';
import { tokenManager } from '@/lib/tokenManager';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedInstitution: string | null;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: AuthUser, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setSelectedInstitution: (institutionId: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        selectedInstitution: null,

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
          set({ user: null, isAuthenticated: false, isLoading: false, selectedInstitution: null });
        },

        updateUser: (userData) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          })),

        setSelectedInstitution: (institutionId) => set({ selectedInstitution: institutionId }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          selectedInstitution: state.selectedInstitution,
        }),
      }
    )
  )
);
