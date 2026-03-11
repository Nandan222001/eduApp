import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { forwardRef, ReactNode } from 'react';

export interface AccessibleButtonProps extends ButtonProps {
  label?: string;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    { label, loading = false, loadingText = 'Loading...', icon, children, disabled, ...props },
    ref
  ) => {
    const buttonLabel = label || (typeof children === 'string' ? children : undefined);
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-label={buttonLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        startIcon={loading ? <CircularProgress size={16} /> : icon}
        {...props}
      >
        {loading ? loadingText : children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
