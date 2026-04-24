import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Checkbox,
  FormGroup,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import schoolAdminApi, {
  IDCardTemplate,
  IDCardTemplateCreate,
  IDCardFaceConfig,
} from '../api/schoolAdmin';
import studentsApi, { Student } from '../api/students';
import { demoIDCardsApi, isDemoUser } from '../api/demoDataApi';

interface FieldPosition {
  field: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const IDCardTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IDCardTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<IDCardTemplateCreate>({
    name: '',
    orientation: 'portrait',
    front_config: {
      background_color: '#ffffff',
      header_color: '#1976d2',
      border_color: '#000000',
      show_photo: true,
      show_name: true,
      show_admission_number: true,
      show_class: true,
      show_dob: false,
      show_blood_group: false,
      show_address: false,
      show_phone: false,
      show_parent_phone: true,
      show_emergency_contact: false,
    },
    back_config: {
      background_color: '#f5f5f5',
      header_color: '#1976d2',
      border_color: '#000000',
      show_photo: false,
      show_name: false,
      show_admission_number: false,
      show_class: false,
      show_dob: true,
      show_blood_group: true,
      show_address: true,
      show_phone: true,
      show_parent_phone: true,
      show_emergency_contact: true,
    },
    is_default: false,
  });

  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [_fieldPositions, setFieldPositions] = useState<{
    front: FieldPosition[];
    back: FieldPosition[];
  }>({
    front: [],
    back: [],
  });

  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentOptions, setStudentOptions] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const isDemo = isDemoUser();

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!studentSearch || isDemo) return;
    const timer = setTimeout(async () => {
      setStudentLoading(true);
      try {
        const res = await studentsApi.listStudents({ search: studentSearch, limit: 10 });
        setStudentOptions(res.items || []);
      } catch {
        setStudentOptions([]);
      } finally {
        setStudentLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, isDemo]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let data: IDCardTemplate[];
      if (isDemo) {
        const demoTemplates = await demoIDCardsApi.getIDCardTemplates();
        data = demoTemplates as IDCardTemplate[];
      } else {
        data = await schoolAdminApi.idCardTemplates.list();
      }
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [isDemo, selectedTemplate]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      orientation: 'portrait',
      front_config: {
        background_color: '#ffffff',
        header_color: '#1976d2',
        border_color: '#000000',
        show_photo: true,
        show_name: true,
        show_admission_number: true,
        show_class: true,
        show_dob: false,
        show_blood_group: false,
        show_address: false,
        show_phone: false,
        show_parent_phone: true,
        show_emergency_contact: false,
      },
      back_config: {
        background_color: '#f5f5f5',
        header_color: '#1976d2',
        border_color: '#000000',
        show_photo: false,
        show_name: false,
        show_admission_number: false,
        show_class: false,
        show_dob: true,
        show_blood_group: true,
        show_address: true,
        show_phone: true,
        show_parent_phone: true,
        show_emergency_contact: true,
      },
      is_default: false,
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (template: IDCardTemplate) => {
    setFormData({
      name: template.name,
      orientation: template.orientation,
      front_config: template.front_config,
      back_config: template.back_config,
      is_default: template.is_default,
    });
    setSelectedTemplate(template);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      showSnackbar('Please enter a template name', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isDemo) {
        showSnackbar(
          isEditing
            ? 'Template updated successfully (Demo)'
            : 'Template created successfully (Demo)',
          'success'
        );
        setDialogOpen(false);
        loadTemplates();
      } else {
        if (isEditing && selectedTemplate) {
          await schoolAdminApi.idCardTemplates.update(selectedTemplate.id, formData);
          showSnackbar('Template updated successfully', 'success');
        } else {
          const newTemplate = await schoolAdminApi.idCardTemplates.create(formData);
          showSnackbar('Template created successfully', 'success');
          setSelectedTemplate(newTemplate);
        }
        setDialogOpen(false);
        loadTemplates();
      }
    } catch (error) {
      showSnackbar('Failed to save template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setLoading(true);
    try {
      if (isDemo) {
        showSnackbar('Template deleted successfully (Demo)', 'success');
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
        loadTemplates();
      } else {
        await schoolAdminApi.idCardTemplates.delete(id);
        showSnackbar('Template deleted successfully', 'success');
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
        loadTemplates();
      }
    } catch (error) {
      showSnackbar('Failed to delete template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      if (isDemo) {
        showSnackbar('Logo uploaded successfully (Demo)', 'success');
        loadTemplates();
      } else {
        await schoolAdminApi.idCardTemplates.uploadLogo(selectedTemplate.id, file);
        showSnackbar('Logo uploaded successfully', 'success');
        loadTemplates();
      }
    } catch (error) {
      showSnackbar('Failed to upload logo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateFrontConfig = (key: keyof IDCardFaceConfig, value: string | boolean | string[]) => {
    setFormData({
      ...formData,
      front_config: {
        ...formData.front_config,
        [key]: value,
      },
    });
  };

  const updateBackConfig = (key: keyof IDCardFaceConfig, value: string | boolean | string[]) => {
    setFormData({
      ...formData,
      back_config: {
        ...formData.back_config,
        [key]: value,
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault();
    if (!draggedField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPosition: FieldPosition = {
      field: draggedField,
      x,
      y,
      width: 100,
      height: 20,
    };

    setFieldPositions((prev) => ({
      ...prev,
      [side]: [...prev[side].filter((p) => p.field !== draggedField), newPosition],
    }));

    setDraggedField(null);
  };

  // Define all available fields with their labels
  const availableFields = [
    { key: 'show_photo', label: 'Photo', frontDefault: true },
    { key: 'show_name', label: 'Name', frontDefault: true },
    { key: 'show_admission_number', label: 'Admission Number', frontDefault: true },
    { key: 'show_class', label: 'Class', frontDefault: true },
    { key: 'show_dob', label: 'Date of Birth', frontDefault: false },
    { key: 'show_blood_group', label: 'Blood Group', frontDefault: false },
    { key: 'show_address', label: 'Address', frontDefault: false },
    { key: 'show_phone', label: 'Phone', frontDefault: false },
    { key: 'show_parent_phone', label: 'Parent Phone', frontDefault: true },
    { key: 'show_emergency_contact', label: 'Emergency Contact', frontDefault: false },
  ];

  const renderPreviewCard = (side: 'front' | 'back') => {
    const config = side === 'front' ? formData.front_config : formData.back_config;
    const isPortrait = formData.orientation === 'portrait';

    const s = previewStudent;
    const displayName = s ? `${s.first_name} ${s.last_name}` : 'Student Name';
    const displayAdmNo = s?.admission_number ?? 'ADM-XXXXXXX';
    const sec = s?.section as { grade_name?: string; name?: string } | undefined;
    const displayClass = sec
      ? `${sec.grade_name || ''} ${sec.name || ''}`.trim()
      : 'Class - Section';
    const displayDob = s?.date_of_birth ?? 'DD/MM/YYYY';
    const displayBlood = s?.blood_group ?? 'Blood Group';
    const displayPhone = s?.phone ?? 'Phone Number';
    const displayParentPhone = s?.parent_phone ?? 'Parent Phone';
    const displayAddress = s?.address ?? 'Student Address';
    const displayEmergency = s
      ? `${s.emergency_contact_phone ?? ''} (${s.emergency_contact_name ?? 'Emergency Contact'})`
      : 'Emergency Contact';

    return (
      <Card
        sx={{
          height: isPortrait ? 400 : 280,
          width: '100%',
          backgroundColor: config.background_color,
          border: `2px solid ${config.border_color}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, side)}
      >
        <Box
          sx={{
            backgroundColor: config.header_color,
            p: 2,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Typography variant="h6">{side === 'front' ? 'School Name' : 'Instructions'}</Typography>
          {side === 'front' && config.logo_url && (
            <img src={config.logo_url} alt="Logo" style={{ maxHeight: '50px', marginTop: '8px' }} />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
          {side === 'front' ? (
            <>
              {config.show_photo && (
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    backgroundColor: '#ddd',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #999',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    PHOTO
                  </Typography>
                </Box>
              )}
              {config.show_name && (
                <Typography variant="body1" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>
                  {displayName}
                </Typography>
              )}
              {config.show_admission_number && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  Adm. No: {displayAdmNo}
                </Typography>
              )}
              {config.show_class && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  Class: {displayClass}
                </Typography>
              )}
              {config.show_dob && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  DOB: {displayDob}
                </Typography>
              )}
              {config.show_blood_group && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  Blood Group: {displayBlood}
                </Typography>
              )}
              {config.show_phone && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  Phone: {displayPhone}
                </Typography>
              )}
              {config.show_parent_phone && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  Parent: {displayParentPhone}
                </Typography>
              )}
              {config.show_emergency_contact && (
                <Typography variant="body2" textAlign="center" sx={{ mb: 0.5 }}>
                  Emergency: {displayEmergency}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                Card holder information and emergency details
              </Typography>
              {config.show_name && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Name:</strong> {displayName}
                </Typography>
              )}
              {config.show_address && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Address:</strong> {displayAddress}
                </Typography>
              )}
              {config.show_phone && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Phone:</strong> {displayPhone}
                </Typography>
              )}
              {config.show_dob && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>DOB:</strong> {displayDob}
                </Typography>
              )}
              {config.show_blood_group && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Blood Group:</strong> {displayBlood}
                </Typography>
              )}
              {config.show_parent_phone && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Parent Contact:</strong> {displayParentPhone}
                </Typography>
              )}
              {config.show_emergency_contact && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Emergency:</strong> {displayEmergency}
                </Typography>
              )}
            </>
          )}

          {/* Drag overlay indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '2px dashed transparent',
              pointerEvents: 'none',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ID Card Template Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Design and configure ID card templates with visual preview and drag-drop field positioning
        </Typography>
        {isDemo && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You are in demo mode. Changes will not be saved permanently.
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Template Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: 80 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Templates</Typography>
              <IconButton onClick={handleCreateNew} color="primary" size="small">
                <AddIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              {templates.map((template) => (
                <ListItem
                  key={template.id}
                  button
                  selected={selectedTemplate?.id === template.id}
                  onClick={() => setSelectedTemplate(template)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" size="small" onClick={() => handleEdit(template)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" size="small" onClick={() => handleDelete(template.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <>
                        {template.is_default && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              bgcolor: 'success.main',
                              color: 'white',
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.5,
                              mr: 1,
                            }}
                          >
                            Default
                          </Typography>
                        )}
                        {template.orientation}
                      </>
                    }
                  />
                </ListItem>
              ))}
              {templates.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  No templates yet
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          {selectedTemplate ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h5">{selectedTemplate.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.orientation} •{' '}
                    {selectedTemplate.is_default ? 'Default Template' : 'Custom Template'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(selectedTemplate)}
                >
                  Edit Template
                </Button>
              </Box>

              <Grid container spacing={3}>
                {/* Student selector for real preview */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={studentOptions}
                    getOptionLabel={(s) =>
                      `${s.first_name} ${s.last_name}${s.admission_number ? ` — ${s.admission_number}` : ''}`
                    }
                    loading={studentLoading}
                    value={previewStudent}
                    onChange={(_e, val) => setPreviewStudent(val)}
                    onInputChange={(_e, val) => setStudentSearch(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Preview with student (optional)"
                        placeholder="Search by name or admission number…"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {studentLoading ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Front Side Preview */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Front Side Preview</Typography>
                  </Box>
                  {renderPreviewCard('front')}
                </Grid>

                {/* Back Side Preview */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Back Side Preview</Typography>
                  </Box>
                  {renderPreviewCard('back')}
                </Grid>

                {/* Configuration Details */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Template Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Orientation
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTemplate.orientation === 'portrait'
                            ? 'Portrait (Vertical)'
                            : 'Landscape (Horizontal)'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Default Template
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTemplate.is_default ? 'Yes' : 'No'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        component="label"
                        fullWidth
                        sx={{ height: '100%' }}
                      >
                        Upload Logo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleLogoUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No template selected
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select a template from the sidebar to view or create a new one
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                size="large"
              >
                Create New Template
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Basic Info */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Student ID Card"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={formData.orientation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orientation: e.target.value as 'portrait' | 'landscape',
                    })
                  }
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                }
                label="Set as Default"
              />
            </Grid>

            {/* Front Side Config */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Front Side Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Background Color"
                value={formData.front_config.background_color}
                onChange={(e) => updateFrontConfig('background_color', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Header Color"
                value={formData.front_config.header_color}
                onChange={(e) => updateFrontConfig('header_color', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Border Color"
                value={formData.front_config.border_color}
                onChange={(e) => updateFrontConfig('border_color', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormLabel component="legend">Fields to Display (Front):</FormLabel>
              <FormGroup row>
                {availableFields.map((field) => (
                  <Grid item xs={6} sm={4} md={3} key={field.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            formData.front_config[field.key as keyof IDCardFaceConfig] as boolean
                          }
                          onChange={(e) =>
                            updateFrontConfig(field.key as keyof IDCardFaceConfig, e.target.checked)
                          }
                        />
                      }
                      label={field.label}
                    />
                  </Grid>
                ))}
              </FormGroup>
            </Grid>

            {/* Back Side Config */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Back Side Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Background Color"
                value={formData.back_config.background_color}
                onChange={(e) => updateBackConfig('background_color', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Header Color"
                value={formData.back_config.header_color}
                onChange={(e) => updateBackConfig('header_color', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Border Color"
                value={formData.back_config.border_color}
                onChange={(e) => updateBackConfig('border_color', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormLabel component="legend">Fields to Display (Back):</FormLabel>
              <FormGroup row>
                {availableFields
                  .filter((f) => !['show_photo'].includes(f.key))
                  .map((field) => (
                    <Grid item xs={6} sm={4} md={3} key={field.key}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              formData.back_config[field.key as keyof IDCardFaceConfig] as boolean
                            }
                            onChange={(e) =>
                              updateBackConfig(
                                field.key as keyof IDCardFaceConfig,
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={field.label}
                      />
                    </Grid>
                  ))}
              </FormGroup>
            </Grid>

            {/* Live Preview */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Live Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Front Side
              </Typography>
              {renderPreviewCard('front')}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Back Side
              </Typography>
              {renderPreviewCard('back')}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default IDCardTemplateManager;
