import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
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
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Checkbox,
  FormGroup,
  FormLabel,
  Tab,
  Tabs,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  People as PeopleIcon,
  CreditCard as CreditCardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import schoolAdminApi, {
  IDCardTemplate,
  IDCardTemplateCreate,
  IDCardFaceConfig,
} from '../api/schoolAdmin';
import studentsApi, { Student } from '../api/students';
import { academicApi } from '../api/academic';
import type { Grade, Section } from '../types/academic';
import { demoIDCardsApi, isDemoUser } from '../api/demoDataApi';

// ── helpers ─────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY_FRONT: IDCardFaceConfig = {
  background_color: '#ffffff',
  header_color: '#1976d2',
  border_color: '#cccccc',
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
};

const EMPTY_BACK: IDCardFaceConfig = {
  background_color: '#f5f5f5',
  header_color: '#1565c0',
  border_color: '#cccccc',
  show_photo: false,
  show_name: true,
  show_admission_number: false,
  show_class: false,
  show_dob: true,
  show_blood_group: true,
  show_address: true,
  show_phone: true,
  show_parent_phone: true,
  show_emergency_contact: true,
};

const FIELD_OPTIONS = [
  { key: 'show_photo', label: 'Photo' },
  { key: 'show_name', label: 'Name' },
  { key: 'show_admission_number', label: 'Admission Number' },
  { key: 'show_class', label: 'Class / Section' },
  { key: 'show_dob', label: 'Date of Birth' },
  { key: 'show_blood_group', label: 'Blood Group' },
  { key: 'show_address', label: 'Address' },
  { key: 'show_phone', label: 'Phone' },
  { key: 'show_parent_phone', label: 'Parent Phone' },
  { key: 'show_emergency_contact', label: 'Emergency Contact' },
];

// ── ID Card visual preview ───────────────────────────────────────────────────

interface PreviewCardProps {
  side: 'front' | 'back';
  config: IDCardFaceConfig;
  orientation: 'portrait' | 'landscape';
  student?: Student | null;
  institutionName?: string;
  logoUrl?: string;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  side,
  config,
  orientation,
  student,
  institutionName = 'Institution Name',
  logoUrl,
}) => {
  const isPortrait = orientation === 'portrait';
  const name = student ? `${student.first_name} ${student.last_name}` : 'Student Full Name';
  const admNo = student?.admission_number ?? 'ADM-XXXXXXX';
  const sec = student?.section as { grade?: { name?: string }; name?: string } | undefined;
  const className = sec
    ? `${sec.grade?.name ?? ''} - ${sec.name ?? ''}`.replace(/^-\s*/, '').trim()
    : 'Grade - Section';
  const dob = student?.date_of_birth ?? 'DD/MM/YYYY';
  const blood = student?.blood_group ?? 'Blood Group';
  const phone = student?.phone ?? 'Phone';
  const parentPhone = student?.parent_phone ?? 'Parent Phone';
  const address = student?.address ?? 'Student Address';
  const emergency = student?.emergency_contact_phone ?? 'Emergency Contact';

  return (
    <Card
      elevation={3}
      sx={{
        height: isPortrait ? 380 : 240,
        width: '100%',
        backgroundColor: config.background_color,
        border: `2px solid ${config.border_color}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: config.header_color,
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 52,
        }}
      >
        {logoUrl && (
          <Box
            component="img"
            src={logoUrl}
            alt="logo"
            sx={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 1 }}
          />
        )}
        <Typography variant="body2" fontWeight="bold" color="white" noWrap>
          {institutionName}
        </Typography>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 1.5, overflow: 'hidden' }}>
        {side === 'front' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            {config.show_photo && (
              <Avatar
                src={student?.photo_url}
                sx={{ width: 60, height: 60, mb: 0.5, border: '2px solid #ddd' }}
              >
                {student ? student.first_name[0] : '?'}
              </Avatar>
            )}
            {config.show_name && (
              <Typography variant="body2" fontWeight="bold" textAlign="center" noWrap>
                {name}
              </Typography>
            )}
            {config.show_admission_number && (
              <Typography variant="caption" textAlign="center" color="text.secondary">
                Adm. No: {admNo}
              </Typography>
            )}
            {config.show_class && (
              <Typography variant="caption" textAlign="center">
                Class: {className}
              </Typography>
            )}
            {config.show_dob && (
              <Typography variant="caption" textAlign="center">
                DOB: {dob}
              </Typography>
            )}
            {config.show_blood_group && (
              <Chip label={blood} size="small" color="error" sx={{ height: 18, fontSize: 10 }} />
            )}
            {config.show_phone && (
              <Typography variant="caption" textAlign="center">
                Ph: {phone}
              </Typography>
            )}
            {config.show_parent_phone && (
              <Typography variant="caption" textAlign="center">
                Parent: {parentPhone}
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {config.show_name && (
              <Typography variant="caption">
                <strong>Name:</strong> {name}
              </Typography>
            )}
            {config.show_address && (
              <Typography variant="caption" noWrap>
                <strong>Address:</strong> {address}
              </Typography>
            )}
            {config.show_dob && (
              <Typography variant="caption">
                <strong>DOB:</strong> {dob}
              </Typography>
            )}
            {config.show_blood_group && (
              <Typography variant="caption">
                <strong>Blood:</strong> {blood}
              </Typography>
            )}
            {config.show_phone && (
              <Typography variant="caption">
                <strong>Phone:</strong> {phone}
              </Typography>
            )}
            {config.show_parent_phone && (
              <Typography variant="caption">
                <strong>Parent:</strong> {parentPhone}
              </Typography>
            )}
            {config.show_emergency_contact && (
              <Typography variant="caption">
                <strong>Emergency:</strong> {emergency}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ── Field toggle group ────────────────────────────────────────────────────────

interface FieldToggleProps {
  title: string;
  config: IDCardFaceConfig;
  onChange: (key: keyof IDCardFaceConfig, val: boolean) => void;
}

const FieldToggle: React.FC<FieldToggleProps> = ({ title, config, onChange }) => (
  <Box>
    <FormLabel sx={{ fontWeight: 600, fontSize: 13 }}>{title}</FormLabel>
    <FormGroup row sx={{ mt: 0.5 }}>
      {FIELD_OPTIONS.map((f) => (
        <FormControlLabel
          key={f.key}
          control={
            <Checkbox
              size="small"
              checked={Boolean(config[f.key as keyof IDCardFaceConfig])}
              onChange={(e) => onChange(f.key as keyof IDCardFaceConfig, e.target.checked)}
            />
          }
          label={<Typography variant="caption">{f.label}</Typography>}
          sx={{ mr: 1 }}
        />
      ))}
    </FormGroup>
  </Box>
);

// ── Main component ────────────────────────────────────────────────────────────

export const IDCardTemplateManager: React.FC = () => {
  const isDemo = isDemoUser();

  // Tab
  const [tab, setTab] = useState(0);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const showSnackbar = (msg: string, severity: 'success' | 'error' | 'info' = 'success') =>
    setSnackbar({ open: true, message: msg, severity });

  // Templates
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IDCardTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Dialog (create / edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<IDCardTemplateCreate>({
    name: '',
    orientation: 'portrait',
    front_config: EMPTY_FRONT,
    back_config: EMPTY_BACK,
    is_default: false,
  });

  // Student selector (preview)
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentOptions, setStudentOptions] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);

  // Generate tab states
  const [genStudent, setGenStudent] = useState<Student | null>(null);
  const [genStudentSearch, setGenStudentSearch] = useState('');
  const [genStudentOptions, setGenStudentOptions] = useState<Student[]>([]);
  const [genStudentLoading, setGenStudentLoading] = useState(false);
  const [genTemplate, setGenTemplate] = useState<number | ''>('');
  const [genValidUntil, setGenValidUntil] = useState('');
  const [generating, setGenerating] = useState(false);

  // Bulk generate
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [bulkGrade, setBulkGrade] = useState<number | ''>('');
  const [bulkSection, setBulkSection] = useState<number | ''>('');
  const [bulkTemplate, setBulkTemplate] = useState<number | ''>('');
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ── load templates ─────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = isDemo
        ? ((await demoIDCardsApi.getIDCardTemplates()) as IDCardTemplate[])
        : await schoolAdminApi.idCardTemplates.list();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) setSelectedTemplate(data[0]);
    } catch {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoadingTemplates(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (tab !== 1) return;
    academicApi
      .getGrades(true)
      .then(setGrades)
      .catch(() => null);
    academicApi
      .getSections()
      .then(setSections)
      .catch(() => null);
  }, [tab]);

  // ── student search (preview) ──────────────────────────────────────────────
  useEffect(() => {
    if (!studentSearch || isDemo) return;
    const t = setTimeout(async () => {
      setStudentLoading(true);
      try {
        const r = await studentsApi.listStudents({ search: studentSearch, limit: 10 });
        setStudentOptions(r.items ?? []);
      } catch {
        setStudentOptions([]);
      } finally {
        setStudentLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch, isDemo]);

  // ── student search (generate tab) ────────────────────────────────────────
  useEffect(() => {
    if (!genStudentSearch || isDemo) return;
    const t = setTimeout(async () => {
      setGenStudentLoading(true);
      try {
        const r = await studentsApi.listStudents({ search: genStudentSearch, limit: 20 });
        setGenStudentOptions(r.items ?? []);
      } catch {
        setGenStudentOptions([]);
      } finally {
        setGenStudentLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [genStudentSearch, isDemo]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setFormData({
      name: '',
      orientation: 'portrait',
      front_config: EMPTY_FRONT,
      back_config: EMPTY_BACK,
      is_default: false,
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (tmpl: IDCardTemplate) => {
    setFormData({
      name: tmpl.name,
      orientation: tmpl.orientation,
      front_config: tmpl.front_config ?? EMPTY_FRONT,
      back_config: tmpl.back_config ?? EMPTY_BACK,
      is_default: tmpl.is_default,
    });
    setSelectedTemplate(tmpl);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showSnackbar('Template name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isDemo) {
        showSnackbar(isEditing ? 'Updated (Demo)' : 'Created (Demo)', 'success');
      } else if (isEditing && selectedTemplate) {
        await schoolAdminApi.idCardTemplates.update(selectedTemplate.id, formData);
        showSnackbar('Template updated', 'success');
      } else {
        await schoolAdminApi.idCardTemplates.create(formData);
        showSnackbar('Template created', 'success');
      }
      setDialogOpen(false);
      loadTemplates();
    } catch {
      showSnackbar('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      if (!isDemo) await schoolAdminApi.idCardTemplates.delete(id);
      showSnackbar('Template deleted', 'success');
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      loadTemplates();
    } catch {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!selectedTemplate || isDemo) return;
    setUploadingLogo(true);
    try {
      await schoolAdminApi.idCardTemplates.uploadLogo(selectedTemplate.id, file);
      showSnackbar('Logo uploaded', 'success');
      loadTemplates();
    } catch {
      showSnackbar('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Generate single ID card ───────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!genStudent) {
      showSnackbar('Please select a student', 'error');
      return;
    }
    setGenerating(true);
    try {
      const blob = await schoolAdminApi.idCards.generate(
        genStudent.id,
        genTemplate || undefined,
        genValidUntil || undefined
      );
      downloadBlob(blob, `id_card_${genStudent.admission_number || genStudent.id}.pdf`);
      showSnackbar('ID card downloaded', 'success');
    } catch {
      showSnackbar('Failed to generate ID card', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ── Bulk generate ─────────────────────────────────────────────────────────

  const handleBulkGenerate = async () => {
    if (!bulkGrade && !bulkSection) {
      showSnackbar('Select a grade or section', 'error');
      return;
    }
    setBulkGenerating(true);
    try {
      const result = await schoolAdminApi.idCards.bulkGenerate({
        grade_id: bulkGrade || undefined,
        section_id: bulkSection || undefined,
        template_id: bulkTemplate || undefined,
      });
      showSnackbar(
        `Bulk generation done: ${(result as { total_cards?: number }).total_cards ?? 0} cards`,
        'success'
      );
    } catch {
      showSnackbar('Failed to bulk generate ID cards', 'error');
    } finally {
      setBulkGenerating(false);
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────

  const updateFront = (key: keyof IDCardFaceConfig, val: boolean | string) =>
    setFormData((p) => ({ ...p, front_config: { ...p.front_config, [key]: val } }));
  const updateBack = (key: keyof IDCardFaceConfig, val: boolean | string) =>
    setFormData((p) => ({ ...p, back_config: { ...p.back_config, [key]: val } }));

  const filteredSections = bulkGrade ? sections.filter((s) => s.grade_id === bulkGrade) : sections;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          ID Card Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Design templates, preview with real students, and download ID cards
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<CreditCardIcon />} label="Templates" iconPosition="start" />
        <Tab icon={<DownloadIcon />} label="Generate & Download" iconPosition="start" />
      </Tabs>

      {/* ── TAB 0: Templates ─────────────────────────────────────────────── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Sidebar — template list */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="h6">Templates</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={openCreate}
                >
                  New
                </Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {loadingTemplates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <List dense disablePadding>
                  {templates.map((tmpl) => (
                    <ListItem
                      key={tmpl.id}
                      button
                      selected={selectedTemplate?.id === tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        border: '1px solid transparent',
                        '&.Mui-selected': {
                          border: '1px solid',
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {tmpl.name}
                            </Typography>
                            {tmpl.is_default && (
                              <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                            )}
                          </Box>
                        }
                        secondary={tmpl.orientation}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(tmpl);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tmpl.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {templates.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      No templates yet
                    </Typography>
                  )}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Main — preview */}
          <Grid item xs={12} md={9}>
            {selectedTemplate ? (
              <Paper sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedTemplate.name}
                      {selectedTemplate.is_default && (
                        <Chip label="Default" size="small" color="warning" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTemplate.orientation === 'portrait' ? 'Portrait' : 'Landscape'}{' '}
                      layout
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={uploadingLogo ? <CircularProgress size={16} /> : <UploadIcon />}
                      component="label"
                      disabled={uploadingLogo}
                    >
                      Upload Logo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                      />
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => openEdit(selectedTemplate)}
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>

                {/* Student selector for real preview */}
                <Autocomplete
                  options={studentOptions}
                  getOptionLabel={(s) =>
                    `${s.first_name} ${s.last_name}${s.admission_number ? ` (${s.admission_number})` : ''}`
                  }
                  loading={studentLoading}
                  value={previewStudent}
                  onChange={(_e, val) => setPreviewStudent(val)}
                  onInputChange={(_e, val) => setStudentSearch(val)}
                  sx={{ mb: 3 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Preview with student (search by name or admission number)"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {studentLoading && <CircularProgress size={16} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Front Side
                    </Typography>
                    <PreviewCard
                      side="front"
                      config={selectedTemplate.front_config ?? EMPTY_FRONT}
                      orientation={selectedTemplate.orientation}
                      student={previewStudent}
                      logoUrl={selectedTemplate.logo_url}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Back Side
                    </Typography>
                    <PreviewCard
                      side="back"
                      config={selectedTemplate.back_config ?? EMPTY_BACK}
                      orientation={selectedTemplate.orientation}
                      student={previewStudent}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ) : (
              <Paper sx={{ p: 5, textAlign: 'center' }}>
                <CreditCardIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No template selected
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                  Create First Template
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* ── TAB 1: Generate & Download ────────────────────────────────────── */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {/* Individual */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CreditCardIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Individual ID Card
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Autocomplete
                options={genStudentOptions}
                getOptionLabel={(s) =>
                  `${s.first_name} ${s.last_name}${s.admission_number ? ` (${s.admission_number})` : ''}`
                }
                loading={genStudentLoading}
                value={genStudent}
                onChange={(_e, val) => setGenStudent(val)}
                onInputChange={(_e, val) => setGenStudentSearch(val)}
                sx={{ mb: 2 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search student *"
                    placeholder="Type name or admission number…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {genStudentLoading && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template (optional)</InputLabel>
                <Select
                  value={genTemplate}
                  onChange={(e) => setGenTemplate(e.target.value as number | '')}
                  label="Template (optional)"
                >
                  <MenuItem value="">Default</MenuItem>
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                      {t.is_default && ' ★'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="Valid Until (optional)"
                value={genValidUntil}
                onChange={(e) => setGenValidUntil(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 3 }}
              />

              {/* Mini preview */}
              {genStudent && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Preview
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <PreviewCard
                        side="front"
                        config={
                          templates.find((t) => t.id === genTemplate)?.front_config ?? EMPTY_FRONT
                        }
                        orientation={
                          templates.find((t) => t.id === genTemplate)?.orientation ?? 'portrait'
                        }
                        student={genStudent}
                        logoUrl={templates.find((t) => t.id === genTemplate)?.logo_url}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <PreviewCard
                        side="back"
                        config={
                          templates.find((t) => t.id === genTemplate)?.back_config ?? EMPTY_BACK
                        }
                        orientation={
                          templates.find((t) => t.id === genTemplate)?.orientation ?? 'portrait'
                        }
                        student={genStudent}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={
                  generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />
                }
                onClick={handleGenerate}
                disabled={!genStudent || generating}
              >
                {generating ? 'Generating…' : 'Download ID Card PDF'}
              </Button>
            </Paper>
          </Grid>

          {/* Bulk */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PeopleIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Bulk Generate
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={bulkGrade}
                  onChange={(e) => {
                    setBulkGrade(e.target.value as number | '');
                    setBulkSection('');
                  }}
                  label="Grade"
                >
                  <MenuItem value="">All Grades</MenuItem>
                  {grades.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={bulkSection}
                  onChange={(e) => setBulkSection(e.target.value as number | '')}
                  label="Section"
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {filteredSections.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Template (optional)</InputLabel>
                <Select
                  value={bulkTemplate}
                  onChange={(e) => setBulkTemplate(e.target.value as number | '')}
                  label="Template (optional)"
                >
                  <MenuItem value="">Default</MenuItem>
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                      {t.is_default && ' ★'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 3 }}>
                Bulk generation will create ID cards for all students in the selected grade/section.
              </Alert>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={
                  bulkGenerating ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />
                }
                onClick={handleBulkGenerate}
                disabled={bulkGenerating}
              >
                {bulkGenerating ? 'Generating…' : 'Generate Bulk ID Cards'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── Create / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? `Edit: ${formData.name}` : 'Create New Template'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Basic */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name *"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={formData.orientation}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      orientation: e.target.value as 'portrait' | 'landscape',
                    }))
                  }
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_default}
                    onChange={(e) => setFormData((p) => ({ ...p, is_default: e.target.checked }))}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarBorderIcon fontSize="small" />
                    <span>Default</span>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Front fields */}
            <Grid item xs={12} md={6}>
              <FieldToggle
                title="Front Side Fields"
                config={formData.front_config}
                onChange={updateFront}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="Background"
                  type="color"
                  value={formData.front_config.background_color ?? '#ffffff'}
                  onChange={(e) => updateFront('background_color', e.target.value)}
                  sx={{ width: 110 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  label="Header color"
                  type="color"
                  value={formData.front_config.header_color ?? '#1976d2'}
                  onChange={(e) => updateFront('header_color', e.target.value)}
                  sx={{ width: 110 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  label="Border color"
                  type="color"
                  value={formData.front_config.border_color ?? '#000000'}
                  onChange={(e) => updateFront('border_color', e.target.value)}
                  sx={{ width: 110 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>

            {/* Back fields */}
            <Grid item xs={12} md={6}>
              <FieldToggle
                title="Back Side Fields"
                config={formData.back_config}
                onChange={updateBack}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="Background"
                  type="color"
                  value={formData.back_config.background_color ?? '#f5f5f5'}
                  onChange={(e) => updateBack('background_color', e.target.value)}
                  sx={{ width: 110 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  label="Header color"
                  type="color"
                  value={formData.back_config.header_color ?? '#1565c0'}
                  onChange={(e) => updateBack('header_color', e.target.value)}
                  sx={{ width: 110 }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  label="Border color"
                  type="color"
                  value={formData.back_config.border_color ?? '#000000'}
                  onChange={(e) => updateBack('border_color', e.target.value)}
                  sx={{ width: 110 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>

            {/* Live preview inside dialog */}
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Front Preview
              </Typography>
              <PreviewCard
                side="front"
                config={formData.front_config}
                orientation={formData.orientation}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Back Preview
              </Typography>
              <PreviewCard
                side="back"
                config={formData.back_config}
                orientation={formData.orientation}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default IDCardTemplateManager;
