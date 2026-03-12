import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  TextField,
  Avatar,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import type { UserProfileUpdate } from '@/types/settings';
import AvatarEditor from 'react-avatar-editor';

export default function ProfileEditor() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: settingsApi.getProfile,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UserProfileUpdate>({
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
    },
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || '',
          bio: profile.bio || '',
        }
      : undefined,
  });

  const updateProfileMutation = useMutation({
    mutationFn: settingsApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      showToast('Profile updated successfully', 'success');
      reset(data);
    },
    onError: () => {
      showToast('Failed to update profile', 'error');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: settingsApi.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Avatar uploaded successfully', 'success');
      setAvatarDialogOpen(false);
      setSelectedImage(null);
    },
    onError: () => {
      showToast('Failed to upload avatar', 'error');
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: settingsApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Avatar deleted successfully', 'success');
    },
    onError: () => {
      showToast('Failed to delete avatar', 'error');
    },
  });

  const onSubmit = (data: UserProfileUpdate) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should not exceed 5MB', 'error');
        return;
      }
      setSelectedImage(file);
      setAvatarDialogOpen(true);
    }
  };

  const handleAvatarSave = () => {
    if (editorRef.current && selectedImage) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          uploadAvatarMutation.mutate(file);
        }
      }, 'image/jpeg');
    }
  };

  const handleAvatarDelete = () => {
    if (window.confirm('Are you sure you want to delete your avatar?')) {
      deleteAvatarMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your personal information and profile picture
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={profile?.avatar} alt={profile?.fullName} sx={{ width: 120, height: 120 }}>
            {profile?.firstName?.[0]}
            {profile?.lastName?.[0]}
          </Avatar>
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarSelect}
            />
            <Button
              variant="contained"
              startIcon={<PhotoCameraIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 1 }}
            >
              Upload Photo
            </Button>
            {profile?.avatar && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleAvatarDelete}
                disabled={deleteAvatarMutation.isPending}
                sx={{ ml: 1 }}
              >
                Remove
              </Button>
            )}
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              JPG, PNG or GIF. Max size 5MB
            </Typography>
          </Box>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="firstName"
              control={control}
              rules={{ required: 'First name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="lastName"
              control={control}
              rules={{ required: 'Last name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Email"
              value={profile?.email || ''}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="phone"
              control={control}
              rules={{
                pattern: {
                  value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                  message: 'Invalid phone number',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone Number"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="bio"
              control={control}
              rules={{
                maxLength: {
                  value: 500,
                  message: 'Bio must not exceed 500 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Bio"
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.bio}
                  helperText={errors.bio?.message || `${field.value?.length || 0}/500 characters`}
                />
              )}
            />
          </Grid>
        </Grid>

        {updateProfileMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to update profile. Please try again.
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!isDirty || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outlined" onClick={() => reset()} disabled={!isDirty}>
            Cancel
          </Button>
        </Box>
      </form>

      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crop Photo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            {selectedImage && (
              <AvatarEditor
                ref={editorRef}
                image={selectedImage}
                width={250}
                height={250}
                border={50}
                borderRadius={125}
                color={[0, 0, 0, 0.6]}
                scale={scale}
                rotate={rotate}
              />
            )}
            <Box width="100%">
              <Typography gutterBottom>
                <ZoomOutIcon fontSize="small" /> Zoom <ZoomInIcon fontSize="small" />
              </Typography>
              <Slider
                value={scale}
                min={1}
                max={3}
                step={0.1}
                onChange={(_e, value) => setScale(value as number)}
              />
            </Box>
            <Box width="100%">
              <Typography gutterBottom>Rotate</Typography>
              <Slider
                value={rotate}
                min={0}
                max={360}
                step={1}
                onChange={(_e, value) => setRotate(value as number)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAvatarSave}
            disabled={uploadAvatarMutation.isPending}
          >
            {uploadAvatarMutation.isPending ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
