import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import { PasswordStrengthIndicator } from '@/components/auth';
import type { PasswordChangeData } from '@/types/settings';

export default function PasswordChange() {
  const { showToast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordChangeData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const changePasswordMutation = useMutation({
    mutationFn: settingsApi.changePassword,
    onSuccess: () => {
      showToast('Password changed successfully', 'success');
      reset();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || 'Failed to change password', 'error');
    },
  });

  const onSubmit = (data: PasswordChangeData) => {
    changePasswordMutation.mutate(data);
  };

  const getPasswordRequirements = () => {
    const requirements = [
      { label: 'At least 8 characters', met: newPassword.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
      { label: 'Contains number', met: /\d/.test(newPassword) },
      { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ];
    return requirements;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your password regularly to keep your account secure
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ maxWidth: 600 }}>
          <Controller
            name="currentPassword"
            control={control}
            rules={{ required: 'Current password is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                type={showCurrentPassword ? 'text' : 'password'}
                label="Current Password"
                fullWidth
                margin="normal"
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="newPassword"
            control={control}
            rules={{
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              validate: (value) => {
                if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
                if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
                if (!/\d/.test(value)) return 'Password must contain a number';
                if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
                  return 'Password must contain a special character';
                return true;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                type={showNewPassword ? 'text' : 'password'}
                label="New Password"
                fullWidth
                margin="normal"
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {newPassword && <PasswordStrengthIndicator password={newPassword} />}

          {newPassword && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Password Requirements:
              </Typography>
              <List dense>
                {getPasswordRequirements().map((req, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {req.met ? (
                        <CheckIcon fontSize="small" color="success" />
                      ) : (
                        <CancelIcon fontSize="small" color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={req.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: req.met ? 'success.main' : 'text.secondary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: 'Please confirm your new password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm New Password"
                fullWidth
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>

        {changePasswordMutation.isError && (
          <Alert severity="error" sx={{ mt: 2, maxWidth: 600 }}>
            Failed to change password. Please check your current password and try again.
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
          <Button variant="outlined" onClick={() => reset()}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
}
