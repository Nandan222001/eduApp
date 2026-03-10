import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraAltIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import teachersApi, { Teacher, TeacherUpdate } from '@/api/teachers';

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<TeacherUpdate>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchTeacher = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await teachersApi.getTeacher(parseInt(id));
      setTeacher(data);
      setFormData({
        employee_id: data.employee_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        address: data.address,
        qualification: data.qualification,
        specialization: data.specialization,
        joining_date: data.joining_date,
        is_active: data.is_active,
      });
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load teacher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!id || !teacher) return;

    try {
      setLoading(true);

      if (photoFile) {
        await teachersApi.uploadPhoto(parseInt(id), photoFile);
      }

      const updatedTeacher = await teachersApi.updateTeacher(parseInt(id), formData);
      setTeacher(updatedTeacher);
      setEditMode(false);
      setSuccess('Teacher profile updated successfully');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (teacher) {
      setFormData({
        employee_id: teacher.employee_id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        date_of_birth: teacher.date_of_birth,
        gender: teacher.gender,
        address: teacher.address,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        joining_date: teacher.joining_date,
        is_active: teacher.is_active,
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading && !teacher) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!teacher) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Teacher not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/users/teachers')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {teacher.first_name} {teacher.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {teacher.employee_id && `Employee ID: ${teacher.employee_id}`}
            </Typography>
          </Box>
        </Box>
        <Box>
          {!editMode ? (
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={photoPreview || teacher.photo_url}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: '2.5rem',
                  }}
                >
                  {getInitials(teacher.first_name, teacher.last_name)}
                </Avatar>
                {editMode && (
                  <>
                    <input
                      accept="image/*"
                      type="file"
                      id="photo-upload"
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                    <label htmlFor="photo-upload">
                      <IconButton
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          '&:hover': { bgcolor: theme.palette.primary.dark },
                        }}
                      >
                        <CameraAltIcon />
                      </IconButton>
                    </label>
                  </>
                )}
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {teacher.first_name} {teacher.last_name}
              </Typography>
              <Chip
                label={teacher.is_active ? 'Active' : 'Inactive'}
                color={teacher.is_active ? 'success' : 'default'}
                size="small"
                sx={{ mb: 2 }}
              />
              <Divider sx={{ width: '100%', my: 2 }} />
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {teacher.email}
                  </Typography>
                </Box>
                {teacher.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {teacher.phone}
                    </Typography>
                  </Box>
                )}
                {teacher.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {teacher.address}
                    </Typography>
                  </Box>
                )}
                {teacher.qualification && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {teacher.qualification}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employee ID"
                  fullWidth
                  value={formData.employee_id || ''}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    label="Gender"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  fullWidth
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Joining Date"
                  fullWidth
                  type="date"
                  value={formData.joining_date || ''}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification"
                  fullWidth
                  value={formData.qualification || ''}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Specialization"
                  fullWidth
                  value={formData.specialization || ''}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              {editMode && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                    }
                    label="Active Status"
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
