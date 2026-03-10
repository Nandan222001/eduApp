import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  useTheme,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import teachersApi, { TeacherCreate } from '@/api/teachers';
import { useAuth } from '@/hooks/useAuth';

const steps = ['Basic Information', 'Contact Details', 'Professional Info'];

export default function TeacherForm() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TeacherCreate>({
    institution_id: user?.institution_id || 0,
    first_name: '',
    last_name: '',
    email: '',
    employee_id: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    qualification: '',
    specialization: '',
    joining_date: '',
    is_active: true,
  });

  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const teacher = await teachersApi.createTeacher(formData);
      navigate(`/admin/users/teachers/${teacher.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/users/teachers')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Add New Teacher
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new teacher profile
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employee ID"
                  fullWidth
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender}
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
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Contact Details
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Professional Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification"
                  fullWidth
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., M.Sc. Mathematics"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Specialization"
                  fullWidth
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Algebra, Calculus"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Joining Date"
                  fullWidth
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active Status"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext} endIcon={<ArrowForwardIcon />}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Create Teacher
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
