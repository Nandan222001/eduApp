import React, { useState, useEffect } from 'react';
import {
  Box,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import schoolAdminApi, {
  IDCardTemplate,
  IDCardTemplateCreate,
  IDCardFaceConfig,
} from '../api/schoolAdmin';

export const IDCardTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IDCardTemplate | null>(null);
  const [_loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await schoolAdminApi.idCardTemplates.list();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      await schoolAdminApi.idCardTemplates.delete(id);
      showSnackbar('Template deleted successfully', 'success');
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      loadTemplates();
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
      await schoolAdminApi.idCardTemplates.uploadLogo(selectedTemplate.id, file);
      showSnackbar('Logo uploaded successfully', 'success');
      loadTemplates();
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

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ID Card Template Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Design and configure ID card templates with visual preview
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Templates</Typography>
              <IconButton onClick={handleCreateNew} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {templates.map((template) => (
                <ListItem
                  key={template.id}
                  button
                  selected={selectedTemplate?.id === template.id}
                  onClick={() => setSelectedTemplate(template)}
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
                    secondary={template.is_default ? 'Default' : template.orientation}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          {selectedTemplate ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">{selectedTemplate.name}</Typography>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(selectedTemplate)}
                >
                  Edit Template
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Front Side Preview
                  </Typography>
                  <Card
                    sx={{
                      height: selectedTemplate.orientation === 'portrait' ? 400 : 280,
                      backgroundColor: selectedTemplate.front_config.background_color,
                      border: `2px solid ${selectedTemplate.front_config.border_color}`,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: selectedTemplate.front_config.header_color,
                        p: 2,
                        textAlign: 'center',
                        color: 'white',
                      }}
                    >
                      <Typography variant="h6">School Name</Typography>
                      {selectedTemplate.front_config.logo_url && (
                        <img
                          src={selectedTemplate.front_config.logo_url}
                          alt="Logo"
                          style={{ maxHeight: '50px', marginTop: '8px' }}
                        />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {selectedTemplate.front_config.show_photo && (
                        <Box
                          sx={{
                            width: 100,
                            height: 100,
                            backgroundColor: '#ddd',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption">PHOTO</Typography>
                        </Box>
                      )}
                      {selectedTemplate.front_config.show_name && (
                        <Typography variant="body1" fontWeight="bold" textAlign="center">
                          Student Name
                        </Typography>
                      )}
                      {selectedTemplate.front_config.show_admission_number && (
                        <Typography variant="body2" textAlign="center">
                          Adm. No: 12345
                        </Typography>
                      )}
                      {selectedTemplate.front_config.show_class && (
                        <Typography variant="body2" textAlign="center">
                          Class: 10-A
                        </Typography>
                      )}
                      {selectedTemplate.front_config.show_dob && (
                        <Typography variant="body2" textAlign="center">
                          DOB: 01/01/2010
                        </Typography>
                      )}
                      {selectedTemplate.front_config.show_blood_group && (
                        <Typography variant="body2" textAlign="center">
                          Blood Group: O+
                        </Typography>
                      )}
                      {selectedTemplate.front_config.show_parent_phone && (
                        <Typography variant="body2" textAlign="center">
                          Parent: +91-9876543210
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Back Side Preview
                  </Typography>
                  <Card
                    sx={{
                      height: selectedTemplate.orientation === 'portrait' ? 400 : 280,
                      backgroundColor: selectedTemplate.back_config.background_color,
                      border: `2px solid ${selectedTemplate.back_config.border_color}`,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: selectedTemplate.back_config.header_color,
                        p: 2,
                        textAlign: 'center',
                        color: 'white',
                      }}
                    >
                      <Typography variant="h6">Instructions</Typography>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {selectedTemplate.back_config.show_address && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Address:</strong> 123 School Street, City
                        </Typography>
                      )}
                      {selectedTemplate.back_config.show_phone && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Phone:</strong> +91-9876543210
                        </Typography>
                      )}
                      {selectedTemplate.back_config.show_dob && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>DOB:</strong> 01/01/2010
                        </Typography>
                      )}
                      {selectedTemplate.back_config.show_blood_group && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Blood Group:</strong> O+
                        </Typography>
                      )}
                      {selectedTemplate.back_config.show_parent_phone && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Parent Contact:</strong> +91-9876543210
                        </Typography>
                      )}
                      {selectedTemplate.back_config.show_emergency_contact && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Emergency:</strong> +91-9876543210
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Configuration Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Orientation: {selectedTemplate.orientation}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        Default: {selectedTemplate.is_default ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        component="label"
                        fullWidth
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
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Select a template to view or create a new one
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                sx={{ mt: 2 }}
              >
                Create New Template
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
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

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                }
                label="Set as Default Template"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Front Side Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Background Color"
                value={formData.front_config.background_color}
                onChange={(e) => updateFrontConfig('background_color', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Header Color"
                value={formData.front_config.header_color}
                onChange={(e) => updateFrontConfig('header_color', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Border Color"
                value={formData.front_config.border_color}
                onChange={(e) => updateFrontConfig('border_color', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Fields to Show (Front):
              </Typography>
              <Grid container spacing={1}>
                {[
                  { key: 'show_photo', label: 'Photo' },
                  { key: 'show_name', label: 'Name' },
                  { key: 'show_admission_number', label: 'Admission Number' },
                  { key: 'show_class', label: 'Class' },
                  { key: 'show_dob', label: 'Date of Birth' },
                  { key: 'show_blood_group', label: 'Blood Group' },
                  { key: 'show_parent_phone', label: 'Parent Phone' },
                ].map((field) => (
                  <Grid item xs={6} md={4} key={field.key}>
                    <FormControlLabel
                      control={
                        <Switch
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
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Back Side Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Background Color"
                value={formData.back_config.background_color}
                onChange={(e) => updateBackConfig('background_color', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Header Color"
                value={formData.back_config.header_color}
                onChange={(e) => updateBackConfig('header_color', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="color"
                label="Border Color"
                value={formData.back_config.border_color}
                onChange={(e) => updateBackConfig('border_color', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Fields to Show (Back):
              </Typography>
              <Grid container spacing={1}>
                {[
                  { key: 'show_address', label: 'Address' },
                  { key: 'show_phone', label: 'Phone' },
                  { key: 'show_dob', label: 'Date of Birth' },
                  { key: 'show_blood_group', label: 'Blood Group' },
                  { key: 'show_parent_phone', label: 'Parent Phone' },
                  { key: 'show_emergency_contact', label: 'Emergency Contact' },
                ].map((field) => (
                  <Grid item xs={6} md={4} key={field.key}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            formData.back_config[field.key as keyof IDCardFaceConfig] as boolean
                          }
                          onChange={(e) =>
                            updateBackConfig(field.key as keyof IDCardFaceConfig, e.target.checked)
                          }
                        />
                      }
                      label={field.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

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
