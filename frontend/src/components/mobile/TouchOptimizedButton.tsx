import { Button, ButtonProps, useTheme } from '@mui/material';

interface TouchOptimizedButtonProps extends ButtonProps {
  touchSize?: number;
}

export default function TouchOptimizedButton({
  touchSize = 44,
  children,
  sx = {},
  ...props
}: TouchOptimizedButtonProps) {
  const theme = useTheme();

  return (
    <Button
      {...props}
      sx={{
        minHeight: touchSize,
        minWidth: touchSize,
        padding: '8px 16px',
        fontSize: '1rem',
        fontWeight: 600,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          minWidth: touchSize,
          minHeight: touchSize,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        },
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s ease',
        },
        '&.MuiButton-contained': {
          boxShadow: theme.shadows[2],
          '&:active': {
            boxShadow: theme.shadows[1],
          },
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}
