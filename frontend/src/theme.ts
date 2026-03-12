import { createTheme } from '@mui/material/styles';

type PaletteMode = 'light' | 'dark';

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#0d47a1' : '#90caf9',
        light: mode === 'light' ? '#1976d2' : '#bbdefb',
        dark: mode === 'light' ? '#0a3a82' : '#42a5f5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'light' ? '#6a1b9a' : '#ce93d8',
        light: mode === 'light' ? '#9c27b0' : '#f3e5f5',
        dark: mode === 'light' ? '#4a148c' : '#ab47bc',
        contrastText: '#ffffff',
      },
      error: {
        main: mode === 'light' ? '#d32f2f' : '#f44336',
        light: mode === 'light' ? '#e57373' : '#ef5350',
        dark: mode === 'light' ? '#c62828' : '#e53935',
        contrastText: '#ffffff',
      },
      warning: {
        main: mode === 'light' ? '#ed6c02' : '#ff9800',
        light: mode === 'light' ? '#ff9800' : '#ffb74d',
        dark: mode === 'light' ? '#e65100' : '#f57c00',
        contrastText: mode === 'light' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
      },
      info: {
        main: mode === 'light' ? '#0288d1' : '#29b6f6',
        light: mode === 'light' ? '#03a9f4' : '#4fc3f7',
        dark: mode === 'light' ? '#01579b' : '#0277bd',
        contrastText: '#ffffff',
      },
      success: {
        main: mode === 'light' ? '#2e7d32' : '#66bb6a',
        light: mode === 'light' ? '#4caf50' : '#81c784',
        dark: mode === 'light' ? '#1b5e20' : '#388e3c',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
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
      fontSize: 16,
      h1: {
        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: 'clamp(1.75rem, 4vw, 2rem)',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: 'clamp(1.5rem, 3.5vw, 1.75rem)',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: 'clamp(1rem, 2vw, 1.125rem)',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
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
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            fontSize: '100%',
          },
          body: {
            fontSize: '1rem',
          },
          '*:focus-visible': {
            outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
            outlineOffset: '2px',
          },
          '.sr-only': {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: false,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            borderRadius: 8,
            minHeight: 44,
            padding: '10px 20px',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease-in-out',
            '&:focus-visible': {
              outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
            },
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              opacity: 0.6,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            touchAction: 'manipulation',
            transition: 'all 0.2s ease-in-out',
            '&:focus-visible': {
              outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
            },
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.5)',
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '&:focus-within': {
              outline: `2px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
            },
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
              fontSize: '1rem',
              padding: '12px',
              touchAction: 'manipulation',
            },
            '& .MuiOutlinedInput-root': {
              '&:focus-within': {
                outline: `2px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
                outlineOffset: '2px',
              },
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            minHeight: 48,
            padding: '12px 16px',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease-in-out',
            '&:focus-visible': {
              outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: 'underline',
            '&:focus-visible': {
              outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
              borderRadius: '4px',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 48,
            fontSize: '1rem',
            textTransform: 'none',
            '&:focus-visible': {
              outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            '&:focus-visible': {
              outline: `3px solid ${mode === 'light' ? '#0d47a1' : '#90caf9'}`,
              outlineOffset: '2px',
            },
          },
        },
      },
    },
  });

const theme = getTheme('light');

export default theme;
