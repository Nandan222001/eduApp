import { Modal, ModalProps, Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReactNode, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface AccessibleModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const AccessibleModal = ({
  open,
  title,
  children,
  onClose,
  maxWidth = 'md',
  showCloseButton = true,
  ...props
}: AccessibleModalProps) => {
  const focusTrapRef = useFocusTrap(open);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && modalRef.current) {
      const firstButton = modalRef.current.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [open]);

  const maxWidthMap = {
    xs: 400,
    sm: 600,
    md: 800,
    lg: 1000,
    xl: 1200,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-content"
      aria-modal="true"
      {...props}
    >
      <Box
        ref={(node: HTMLDivElement | null) => {
          if (node) {
            if (modalRef.current !== node) {
              (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
            if (focusTrapRef.current !== (node as HTMLElement)) {
              (focusTrapRef as React.MutableRefObject<HTMLElement | null>).current =
                node as HTMLElement;
            }
          }
        }}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: maxWidthMap[maxWidth],
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          overflowY: 'auto',
          '&:focus': {
            outline: 'none',
          },
        }}
        role="dialog"
        tabIndex={-1}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2">
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              aria-label="Close dialog"
              sx={{
                ml: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Box id="modal-content">{children}</Box>
      </Box>
    </Modal>
  );
};

export default AccessibleModal;
