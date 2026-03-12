import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  CircularProgress,
} from '@mui/material';
import { ReactNode, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  maxWidth = 'sm',
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap(open);

  useEffect(() => {
    if (open && dialogRef.current) {
      const titleElement = dialogRef.current.querySelector('[role="dialog"]');
      if (titleElement) {
        (titleElement as HTMLElement).focus();
      }
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth={maxWidth}
      fullWidth
      ref={dialogRef}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      PaperProps={{
        ref: focusTrapRef,
        role: 'dialog',
        'aria-modal': true,
      }}
    >
      <DialogTitle id="dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? (
          <DialogContentText id="dialog-description">{message}</DialogContentText>
        ) : (
          <div id="dialog-description">{message}</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading} aria-label={cancelLabel}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          aria-label={confirmLabel}
          aria-busy={loading}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
