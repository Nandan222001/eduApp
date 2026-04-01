import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { Person, Delete, Share } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { documentVaultApi } from '@/api/documentVault';
import { RecipientRole } from '@/types/documentVault';
import { format } from 'date-fns';

interface SharingModalProps {
  open: boolean;
  onClose: () => void;
  documentId: number;
  documentTitle: string;
}

const roleLabels: Record<RecipientRole, string> = {
  [RecipientRole.TEACHER]: 'Teacher',
  [RecipientRole.COUNSELOR]: 'Counselor',
  [RecipientRole.NURSE]: 'Nurse',
  [RecipientRole.ADMIN]: 'Admin',
};

export const SharingModal: React.FC<SharingModalProps> = ({
  open,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [filterRole, setFilterRole] = useState<RecipientRole | ''>('');
  const queryClient = useQueryClient();

  const { data: recipients, isLoading: recipientsLoading } = useQuery({
    queryKey: ['share-recipients'],
    queryFn: () => documentVaultApi.getShareRecipients(),
    enabled: open,
  });

  const { data: existingShares, isLoading: sharesLoading } = useQuery({
    queryKey: ['document-shares', documentId],
    queryFn: () => documentVaultApi.getDocumentShares(documentId),
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: () =>
      documentVaultApi.shareDocument(documentId, {
        recipient_ids: selectedRecipients,
        expiry_date: expiryDate?.toISOString(),
        message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-shares', documentId] });
      setSelectedRecipients([]);
      setExpiryDate(null);
      setMessage('');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (shareId: number) => documentVaultApi.revokeShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-shares', documentId] });
    },
  });

  const handleRecipientChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    setSelectedRecipients(typeof value === 'string' ? [] : value);
  };

  const handleShare = async () => {
    if (selectedRecipients.length === 0) return;
    await shareMutation.mutateAsync();
  };

  const handleRevoke = (shareId: number) => {
    if (window.confirm('Are you sure you want to revoke this share?')) {
      revokeMutation.mutate(shareId);
    }
  };

  const filteredRecipients = recipients?.filter((r) => !filterRole || r.role === filterRole);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Share Document: {documentTitle}</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by Role
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as RecipientRole | '')}
              label="Role"
            >
              <MenuItem value="">All Roles</MenuItem>
              {Object.entries(roleLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Recipients</InputLabel>
          <Select
            multiple
            value={selectedRecipients}
            onChange={handleRecipientChange}
            input={<OutlinedInput label="Select Recipients" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const recipient = recipients?.find((r) => r.id === value);
                  return <Chip key={value} label={recipient?.name} size="small" />;
                })}
              </Box>
            )}
          >
            {recipientsLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} />
              </MenuItem>
            ) : (
              filteredRecipients?.map((recipient) => (
                <MenuItem key={recipient.id} value={recipient.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Avatar sx={{ width: 32, height: 32 }}>{recipient.name.charAt(0)}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">{recipient.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {roleLabels[recipient.role as RecipientRole]}
                        {recipient.department && ` • ${recipient.department}`}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Expiry Date (optional)"
            value={expiryDate}
            onChange={(newValue) => setExpiryDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: 'Access will be automatically revoked after this date',
                sx: { mb: 2 },
              },
            }}
          />
        </LocalizationProvider>

        <TextField
          fullWidth
          label="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={3}
          placeholder="Add a message to recipients..."
          sx={{ mb: 3 }}
        />

        {shareMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to share document. Please try again.
          </Alert>
        )}

        {shareMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Document shared successfully!
          </Alert>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Current Shares
        </Typography>

        {sharesLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        ) : existingShares && existingShares.length > 0 ? (
          <List>
            {existingShares.map((share) => (
              <ListItem
                key={share.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleRevoke(share.id)}
                    disabled={revokeMutation.isPending}
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={share.recipient_name}
                  secondary={
                    <>
                      {roleLabels[share.recipient_role as RecipientRole]} • Shared{' '}
                      {format(new Date(share.shared_date), 'PPP')}
                      {share.expiry_date &&
                        ` • Expires ${format(new Date(share.expiry_date), 'PPP')}`}
                      <br />
                      Accessed {share.access_count} times
                      {share.last_accessed &&
                        ` • Last: ${format(new Date(share.last_accessed), 'PPp')}`}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">This document hasn&apos;t been shared yet.</Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          startIcon={shareMutation.isPending ? <CircularProgress size={20} /> : <Share />}
          disabled={selectedRecipients.length === 0 || shareMutation.isPending}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};
