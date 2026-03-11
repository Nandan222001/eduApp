import { useState } from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errorMessages';

interface AsyncButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  loadingText?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export const AsyncButton = ({
  onClick,
  successMessage,
  errorMessage,
  loadingText,
  showSuccessToast = false,
  showErrorToast = true,
  children,
  disabled,
  ...props
}: AsyncButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
      if (showSuccessToast && successMessage) {
        showSuccess(successMessage);
      }
    } catch (error) {
      if (showErrorToast) {
        const message = errorMessage || getErrorMessage(error);
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export default AsyncButton;
