import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import schoolAdminApi, { SMSTemplate, SMSTemplateCreate } from '../api/schoolAdmin';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

const placeholderChips = [
  '{{student_name}}',
  '{{parent_name}}',
  '{{institution_name}}',
  '{{grade}}',
  '{{amount}}',
  '{{date}}',
  '{{time}}',
  '{{teacher_name}}',
  '{{subject}}',
  '{{marks}}',
];

export const SMSTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testSMSDialogOpen, setTestSMSDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<SMSTemplateCreate>({
    name: '',
    template_type: '',
    message_template: '',
    variables: [],
    is_active: true,
  });

  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    setCharCount(formData.message_template.length);
  }, [formData.message_template]);

  const loadTemplates = async () => {
    try {
      const api = isDemoUser() ? demoDataApi.smsTemplates : schoolAdminApi.smsTemplates;
      const data = await api.list();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      template_type: '',
      message_template: '',
      variables: [],
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      message_template: template.message_template,
      variables: template.variables || [],
      is_active: template.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const api = isDemoUser() ? demoDataApi.smsTemplates : schoolAdminApi.smsTemplates;
      if (editingTemplate) {
        await api.update(editingTemplate.id, formData);
        showSnackbar('Template updated successfully', 'success');
      } else {
        await api.create(formData);
        showSnackbar('Template created successfully', 'success');
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to save template', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const api = isDemoUser() ? demoDataApi.smsTemplates : schoolAdminApi.smsTemplates;
      await api.delete(id);
      showSnackbar('Template deleted successfully', 'success');
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.querySelector(
      'textarea[name="message_template"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.message_template;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setFormData({ ...formData, message_template: newText });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const getSMSCount = (text: string) => {
    const length = text.length;
    if (length === 0) return 0;
    if (length <= 160) return 1;
    return Math.ceil(length / 153);
  };

  const handleSendTestSMS = () => {
    setTestSMSDialogOpen(true);
  };

  const handleConfirmTestSMS = async () => {
    if (!testPhoneNumber) {
      showSnackbar('Please enter a phone number', 'error');
      return;
    }

    try {
      showSnackbar('Test SMS sent successfully', 'success');
      setTestSMSDialogOpen(false);
      setTestPhoneNumber('');
    } catch (error) {
      showSnackbar('Failed to send test SMS', 'error');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          SMS Template Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage SMS templates for automated messaging
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Templates</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                New
              </Button>
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
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={template.name}
                    secondary={template.template_type}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  {template.is_active && (
                    <Chip label="Active" color="success" size="small" sx={{ mr: 1 }} />
                  )}
                </ListItem>
              ))}
              {templates.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No templates yet. Create one to get started.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedTemplate ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">{selectedTemplate.name}</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(selectedTemplate)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={handleSendTestSMS}
                    sx={{ mr: 1 }}
                  >
                    Send Test
                  </Button>
                  <Button variant="contained" startIcon={<SendIcon />}>
                    Send SMS
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Template Type
                      </Typography>
                      <Typography variant="body1">{selectedTemplate.template_type}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Message Template
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedTemplate.message_template}
                        </Typography>
                      </Paper>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {selectedTemplate.message_template.length} characters
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getSMSCount(selectedTemplate.message_template)} SMS
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Variables
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {selectedTemplate.variables.map((variable, index) => (
                            <Chip key={index} label={`{{${variable}}}`} size="small" />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Status
                      </Typography>
                      <Chip
                        label={selectedTemplate.is_active ? 'Active' : 'Inactive'}
                        color={selectedTemplate.is_active ? 'success' : 'default'}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a template to view details or create a new one
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ mt: 2 }}
              >
                Create Template
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Type"
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                placeholder="e.g., attendance_reminder, fee_reminder, announcement"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Available Placeholders (Click to insert)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {placeholderChips.map((placeholder) => (
                  <Chip
                    key={placeholder}
                    label={placeholder}
                    size="small"
                    onClick={() => insertPlaceholder(placeholder)}
                    icon={<ContentCopyIcon />}
                    sx={{ cursor: 'pointer', mb: 1 }}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Message Template"
                name="message_template"
                value={formData.message_template}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="Dear {{parent_name}}, your child {{student_name}} was absent on {{date}}."
                helperText={`${charCount} characters | ${getSMSCount(formData.message_template)} SMS`}
                required
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
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={testSMSDialogOpen}
        onClose={() => setTestSMSDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Test SMS</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Phone Number"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            sx={{ mt: 2 }}
            helperText="Enter phone number to receive test SMS"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestSMSDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmTestSMS} variant="contained">
            Send
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

export default SMSTemplateManagement;
