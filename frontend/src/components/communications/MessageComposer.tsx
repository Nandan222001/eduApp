import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MessageCreate } from '@/types/communications';
import { communicationsApi } from '@/api/communications';

interface MessageComposerProps {
  open: boolean;
  onClose: () => void;
  recipientId?: number;
  recipients?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
  }>;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  open,
  onClose,
  recipientId,
  recipients = [],
}) => {
  const queryClient = useQueryClient();
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(recipientId || null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sendMutation = useMutation({
    mutationFn: (data: MessageCreate) => communicationsApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedRecipient(recipientId || null);
    setSubject('');
    setContent('');
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedRecipient) newErrors.recipient = 'Please select a recipient';
    if (!content.trim()) newErrors.content = 'Message content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    sendMutation.mutate({
      recipient_id: selectedRecipient!,
      subject: subject.trim() || undefined,
      content: content.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">New Message</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sendMutation.isError && (
            <Alert severity="error">Failed to send message. Please try again.</Alert>
          )}

          {!recipientId && recipients.length > 0 && (
            <Autocomplete
              options={recipients}
              getOptionLabel={(option) =>
                `${option.first_name} ${option.last_name}${option.role ? ` (${option.role})` : ''}`
              }
              value={recipients.find((r) => r.id === selectedRecipient) || null}
              onChange={(_, newValue) => setSelectedRecipient(newValue?.id || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="To"
                  error={!!errors.recipient}
                  helperText={errors.recipient}
                  required
                />
              )}
            />
          )}

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            placeholder="Optional"
          />

          <TextField
            label="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={!!errors.content}
            helperText={errors.content}
            fullWidth
            required
            multiline
            rows={6}
            placeholder="Type your message here..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={sendMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={sendMutation.isPending}
        >
          {sendMutation.isPending ? <CircularProgress size={20} /> : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
