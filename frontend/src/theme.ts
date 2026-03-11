import { createTheme } from '@mui/material/styles';

type PaletteMode = 'light' | 'dark';

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9',
        light: mode === 'light' ? '#42a5f5' : '#bbdefb',
        dark: mode === 'light' ? '#1565c0' : '#42a5f5',
      },
      secondary: {
        main: mode === 'light' ? '#9c27b0' : '#ce93d8',
        light: mode === 'light' ? '#ba68c8' : '#f3e5f5',
        dark: mode === 'light' ? '#7b1fa2' : '#ab47bc',
      },
      error: {
        main: mode === 'light' ? '#d32f2f' : '#f44336',
      },
      warning: {
        main: mode === 'light' ? '#ed6c02' : '#ffa726',
      },
      info: {
        main: mode === 'light' ? '#0288d1' : '#29b6f6',
      },
      success: {
        main: mode === 'light' ? '#2e7d32' : '#66bb6a',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      mode === 'light' ? '0px 2px 4px rgba(0,0,0,0.05)' : '0px 2px 4px rgba(0,0,0,0.3)',
      mode === 'light' ? '0px 4px 8px rgba(0,0,0,0.08)' : '0px 4px 8px rgba(0,0,0,0.4)',
      mode === 'light' ? '0px 8px 16px rgba(0,0,0,0.1)' : '0px 8px 16px rgba(0,0,0,0.5)',
      mode === 'light' ? '0px 12px 24px rgba(0,0,0,0.12)' : '0px 12px 24px rgba(0,0,0,0.6)',
      mode === 'light' ? '0px 16px 32px rgba(0,0,0,0.14)' : '0px 16px 32px rgba(0,0,0,0.7)',
      mode === 'light' ? '0px 20px 40px rgba(0,0,0,0.16)' : '0px 20px 40px rgba(0,0,0,0.8)',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
      'none',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            minHeight: 44,
            touchAction: 'manipulation',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            touchAction: 'manipulation',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.5)',
            borderRadius: 12,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === 'light' ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.7)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              fontSize: 16,
              touchAction: 'manipulation',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            minHeight: 48,
            touchAction: 'manipulation',
          },
        },
      },
    },
  });

const theme = getTheme('light');

export default theme;
