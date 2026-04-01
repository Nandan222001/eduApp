import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import studentsApi, { StudentCreate, StudentUpdate } from '@/api/students';

const steps = [
  'Basic Information',
  'Contact Details',
  'Academic Information',
  'Additional Details',
];

export default function StudentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState<StudentCreate>({
    institution_id: 1,
    first_name: '',
    last_name: '',
    admission_number: '',
    roll_number: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    admission_date: '',
    section_id: undefined,
    photo_url: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    previous_school: '',
    medical_conditions: '',
    nationality: '',
    religion: '',
    caste: '',
    category: '',
    aadhar_number: '',
    status: 'active',
    is_active: true,
    parent_ids: [],
  });

  const fetchStudent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const student = await studentsApi.getStudent(parseInt(id));
      setFormData({
        institution_id: student.institution_id,
        first_name: student.first_name,
        last_name: student.last_name,
        admission_number: student.admission_number || '',
        roll_number: student.roll_number || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        blood_group: student.blood_group || '',
        address: student.address || '',
        parent_name: student.parent_name || '',
        parent_email: student.parent_email || '',
        parent_phone: student.parent_phone || '',
        admission_date: student.admission_date || '',
        section_id: student.section_id,
        photo_url: student.photo_url || '',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_phone: student.emergency_contact_phone || '',
        emergency_contact_relation: student.emergency_contact_relation || '',
        previous_school: student.previous_school || '',
        medical_conditions: student.medical_conditions || '',
        nationality: student.nationality || '',
        religion: student.religion || '',
        caste: student.caste || '',
        category: student.category || '',
        aadhar_number: student.aadhar_number || '',
        status: student.status,
        is_active: student.is_active,
        parent_ids: student.parents_info?.map((p) => p.id) || [],
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      fetchStudent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof StudentCreate) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSelectChange = (field: keyof StudentCreate) => (event: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isEditMode || !id) return;

    try {
      setUploadingPhoto(true);
      const result = await studentsApi.uploadPhoto(parseInt(id), file);
      setFormData((prev) => ({ ...prev, photo_url: result.photo_url }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isEditMode && id) {
        const updateData: StudentUpdate = { ...formData };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (updateData as any).institution_id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (updateData as any).parent_ids;
        await studentsApi.updateStudent(parseInt(id), updateData);
      } else {
        await studentsApi.createStudent(formData);
      }

      navigate('/students');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return Boolean(formData.first_name && formData.last_name);
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar src={formData.photo_url} sx={{ width: 120, height: 120 }}>
            {formData.first_name?.[0]}
          </Avatar>
          {isEditMode && (
            <>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                type="file"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="photo-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                  }}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <CircularProgress size={24} /> : <PhotoCameraIcon />}
                </IconButton>
              </label>
            </>
          )}
        </Box>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="First Name"
          value={formData.first_name}
          onChange={handleChange('first_name')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="Last Name"
          value={formData.last_name}
          onChange={handleChange('last_name')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Admission Number"
          value={formData.admission_number}
          onChange={handleChange('admission_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Roll Number"
          value={formData.roll_number}
          onChange={handleChange('roll_number')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="date"
          label="Date of Birth"
          value={formData.date_of_birth}
          onChange={handleChange('date_of_birth')}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select value={formData.gender} label="Gender" onChange={handleSelectChange('gender')}>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Blood Group"
          value={formData.blood_group}
          onChange={handleChange('blood_group')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="date"
          label="Admission Date"
          value={formData.admission_date}
          onChange={handleChange('admission_date')}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderContactDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Student Contact
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange('email')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone"
          value={formData.phone}
          onChange={handleChange('phone')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Address"
          value={formData.address}
          onChange={handleChange('address')}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Parent/Guardian Contact
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Parent Name"
          value={formData.parent_name}
          onChange={handleChange('parent_name')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="email"
          label="Parent Email"
          value={formData.parent_email}
          onChange={handleChange('parent_email')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Parent Phone"
          value={formData.parent_phone}
          onChange={handleChange('parent_phone')}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Emergency Contact
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Emergency Contact Name"
          value={formData.emergency_contact_name}
          onChange={handleChange('emergency_contact_name')}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Emergency Contact Phone"
          value={formData.emergency_contact_phone}
          onChange={handleChange('emergency_contact_phone')}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Relation"
          value={formData.emergency_contact_relation}
          onChange={handleChange('emergency_contact_relation')}
        />
      </Grid>
    </Grid>
  );

  const renderAcademicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select value={formData.status} label="Status" onChange={handleSelectChange('status')}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="graduated">Graduated</MenuItem>
            <MenuItem value="transferred">Transferred</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Previous School"
          value={formData.previous_school}
          onChange={handleChange('previous_school')}
        />
      </Grid>
    </Grid>
  );

  const renderAdditionalDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Nationality"
          value={formData.nationality}
          onChange={handleChange('nationality')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Religion"
          value={formData.religion}
          onChange={handleChange('religion')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Caste"
          value={formData.caste}
          onChange={handleChange('caste')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Category"
          value={formData.category}
          onChange={handleChange('category')}
          placeholder="e.g., General, OBC, SC, ST"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Aadhar Number"
          value={formData.aadhar_number}
          onChange={handleChange('aadhar_number')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Medical Conditions"
          value={formData.medical_conditions}
          onChange={handleChange('medical_conditions')}
          placeholder="Any medical conditions, allergies, or special requirements"
        />
      </Grid>
    </Grid>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderContactDetails();
      case 2:
        return renderAcademicInformation();
      case 3:
        return renderAdditionalDetails();
      default:
        return null;
    }
  };

  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Student' : 'Add New Student'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBackIcon />}>
            Back
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => navigate('/students')}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
