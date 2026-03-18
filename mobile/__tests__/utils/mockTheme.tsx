import React from 'react';
import { ThemeProvider } from '@rneui/themed';
import { lightColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const mockTheme = {
  lightColors,
  darkColors: lightColors,
  mode: 'light' as const,
};

export const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>;
};

export const mockThemeValue = {
  theme: {
    mode: 'light' as const,
    isDark: false,
    colors: lightColors,
    typography,
    spacing,
    borderRadius,
    shadows: {},
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  themeMode: 'light' as const,
  setThemeMode: jest.fn(),
  toggleTheme: jest.fn(),
};
