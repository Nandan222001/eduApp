import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm?: () => void | Promise<void>;
}

export const useConfirmDialog = () => {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const openDialog = useCallback(
    (title: string, message: string, onConfirm: () => void | Promise<void>) => {
      setState({
        open: true,
        title,
        message,
        onConfirm,
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state.onConfirm) {
      setLoading(true);
      try {
        await state.onConfirm();
        closeDialog();
      } catch (error) {
        setLoading(false);
        throw error;
      }
    }
  }, [state, closeDialog]);

  return {
    dialogState: state,
    dialogLoading: loading,
    openDialog,
    closeDialog,
    handleConfirm,
  };
};

export default useConfirmDialog;
