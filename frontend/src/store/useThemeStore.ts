import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PaletteMode = 'light' | 'dark';

interface ThemeState {
  mode: PaletteMode;
  toggleTheme: () => void;
  setTheme: (mode: PaletteMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleTheme: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
