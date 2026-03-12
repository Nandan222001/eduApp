import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Warning as WarningIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import type { AccountDeletionRequest } from '@/types/settings';

const deletionReasons = [
  { value: 'no_longer_needed', label: 'No longer need the service' },
  { value: 'found_alternative', label: 'Found an alternative solution' },
  { value: 'privacy_concerns', label: 'Privacy concerns' },
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'other', label: 'Other' },
];

export default function AccountDeletionForm() {
  const { showToast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AccountDeletionRequest>({
    defaultValues: {
      reason: '',
      feedback: '',
      password: '',
    },
  });

  const reason = watch('reason');

  const deleteAccountMutation = useMutation({
    mutationFn: settingsApi.requestAccountDeletion,
    onSuccess: () => {
      showToast(
        'Account deletion request submitted. You will receive a confirmation email.',
        'success'
      );
      setConfirmDialogOpen(false);
      reset();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to request account deletion', 'error');
    },
  });

  const onSubmit = (_data: AccountDeletionRequest) => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmDeletion = (data: AccountDeletionRequest) => {
    deleteAccountMutation.mutate(data);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="error">
        Delete Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Permanently delete your account and all associated data
      </Typography>

      <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Warning: This action cannot be undone
        </Typography>
        <Typography variant="body2">Deleting your account will permanently remove:</Typography>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Your profile and personal information</li>
          <li>All your assignments and submissions</li>
          <li>Your exam results and performance history</li>
          <li>All your achievements and badges</li>
          <li>Your study materials and notes</li>
          <li>Access to all platform features</li>
        </ul>
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 700 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="reason"
            control={control}
            rules={{ required: 'Please select a reason' }}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.reason}>
                <InputLabel>Reason for Deletion</InputLabel>
                <Select {...field} label="Reason for Deletion">
                  {deletionReasons.map((reason) => (
                    <MenuItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.reason && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.reason.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="feedback"
            control={control}
            rules={{
              required: reason === 'other' ? 'Please provide feedback' : false,
              maxLength: {
                value: 1000,
                message: 'Feedback must not exceed 1000 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Additional Feedback (Optional)"
                fullWidth
                multiline
                rows={4}
                margin="normal"
                error={!!errors.feedback}
                helperText={
                  errors.feedback?.message ||
                  `Help us improve by sharing more details. ${field.value?.length || 0}/1000 characters`
                }
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{ required: 'Please enter your password to confirm' }}
            render={({ field }) => (
              <TextField
                {...field}
                type={showPassword ? 'text' : 'password'}
                label="Confirm Your Password"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={deleteAccountMutation.isPending}
            >
              Request Account Deletion
            </Button>
            <Button variant="outlined" onClick={() => reset()}>
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>

      <Alert severity="info" sx={{ mt: 3, maxWidth: 700 }}>
        <Typography variant="subtitle2" gutterBottom>
          Account Deletion Process
        </Typography>
        <Typography variant="body2">After submitting your deletion request:</Typography>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>You&apos;ll receive a confirmation email with a unique link</li>
          <li>Click the link within 7 days to confirm the deletion</li>
          <li>Your account will be scheduled for deletion within 30 days</li>
          <li>During this period, you can cancel the deletion by logging in</li>
          <li>After 30 days, all your data will be permanently deleted</li>
        </ol>
      </Alert>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Are you absolutely sure you want to delete your account? This action cannot be undone.
          </Alert>
          <Typography variant="body2">By confirming, you acknowledge that:</Typography>
          <ul style={{ marginTop: '8px' }}>
            <li>All your data will be permanently deleted</li>
            <li>You will lose access to all platform features</li>
            <li>This action cannot be reversed after 30 days</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const data = watch();
              handleConfirmDeletion(data);
            }}
            color="error"
            variant="contained"
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending ? 'Processing...' : 'Yes, Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
