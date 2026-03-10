import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  toggleTheme: () => void;
  logout: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        theme: 'light',
        setUser: (user) => set({ user }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
        }),
      }
    )
  )
);
