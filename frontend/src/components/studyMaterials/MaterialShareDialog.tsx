import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Close, ContentCopy, Check } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import studyMaterialsApi from '../../api/studyMaterials';

interface MaterialShareDialogProps {
  open: boolean;
  onClose: () => void;
  materialId: number;
  materialTitle: string;
}

const MaterialShareDialog: React.FC<MaterialShareDialogProps> = ({
  open,
  onClose,
  materialId,
  materialTitle,
}) => {
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const share = await studyMaterialsApi.shareMaterial({
        material_id: materialId,
        message: message || undefined,
        expires_at: expiresAt?.toISOString(),
      });

      const link = `${window.location.origin}/shared-material/${share.share_token}`;
      setShareLink(link);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setMessage('');
    setExpiresAt(null);
    setShareLink(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Share Material
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          {materialTitle}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!shareLink ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              rows={3}
              placeholder="Add a message to share with the material..."
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Expires At (optional)"
                value={expiresAt}
                onChange={(date) => setExpiresAt(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for no expiration',
                  },
                }}
                minDateTime={new Date()}
              />
            </LocalizationProvider>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Share link created successfully!
            </Alert>

            <TextField
              fullWidth
              value={shareLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyLink} edge="end">
                      {copied ? <Check color="success" /> : <ContentCopy />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              label="Share Link"
              helperText={copied ? 'Copied to clipboard!' : 'Click icon to copy'}
            />

            {expiresAt && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Link expires on: {expiresAt.toLocaleString()}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {!shareLink && (
          <Button onClick={handleShare} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Share Link'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MaterialShareDialog;
