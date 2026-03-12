import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReactNode, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnounce } from '../../hooks/useAnnounce';

export interface AccessibleDialogProps extends Omit<DialogProps, 'title'> {
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  showCloseButton?: boolean;
  titleId?: string;
  contentId?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  announceOnOpen?: boolean;
}

export const AccessibleDialog = ({
  open,
  title,
  children,
  onClose,
  actions,
  showCloseButton = true,
  titleId = 'dialog-title',
  contentId = 'dialog-content',
  maxWidth = 'sm',
  announceOnOpen = true,
  ...props
}: AccessibleDialogProps) => {
  const focusTrapRef = useFocusTrap(open);
  const announce = useAnnounce();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      if (announceOnOpen) {
        announce(`Dialog opened: ${title}`, 'polite');
      }
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [open, title, announce, announceOnOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={contentId}
      aria-modal="true"
      onKeyDown={handleKeyDown}
      PaperProps={{
        ref: focusTrapRef as React.Ref<HTMLDivElement>,
        role: 'dialog',
        sx: {
          '&:focus': {
            outline: 'none',
          },
        },
      }}
      {...props}
    >
      <DialogTitle id={titleId}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              aria-label="Close dialog"
              onClick={onClose}
              sx={{
                ml: 2,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <DialogContent id={contentId}>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};

export default AccessibleDialog;
