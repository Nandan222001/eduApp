import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { forwardRef } from 'react';

interface FocusableIconButtonProps extends IconButtonProps {
  label: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

export const FocusableIconButton = forwardRef<HTMLButtonElement, FocusableIconButtonProps>(
  ({ label, tooltipPlacement = 'top', children, ...props }, ref) => {
    return (
      <Tooltip title={label} placement={tooltipPlacement}>
        <IconButton
          ref={ref}
          aria-label={label}
          {...props}
          sx={{
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
            ...props.sx,
          }}
        >
          {children}
        </IconButton>
      </Tooltip>
    );
  }
);

FocusableIconButton.displayName = 'FocusableIconButton';

export default FocusableIconButton;
