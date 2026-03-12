import React from 'react';
import { Snackbar, Button, Alert } from '@mui/material';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import { usePWA } from '@/hooks/usePWA';

export const UpdatePrompt: React.FC = () => {
  const { isUpdateAvailable, update } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <Snackbar
      open={isUpdateAvailable}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity="info"
        icon={<SystemUpdateIcon />}
        action={
          <Button color="inherit" size="small" onClick={update}>
            Update
          </Button>
        }
      >
        A new version is available. Click Update to refresh.
      </Alert>
    </Snackbar>
  );
};

export default UpdatePrompt;
