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
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
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

// ── helpers ──────────────────────────────────────────────────────────────────

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
  header_color: '#1565c0',
  border_color: '#1565c0',
  show_photo: true,
  show_name: true,
  show_admission_number: true,
  show_class: true,
  show_dob: false,
  show_blood_group: true,
  show_address: false,
  show_phone: false,
  show_parent_phone: true,
  show_emergency_contact: false,
};

const EMPTY_BACK: IDCardFaceConfig = {
  background_color: '#f8f9fa',
  header_color: '#1565c0',
  border_color: '#1565c0',
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
  { key: 'show_admission_number', label: 'Admission No.' },
  { key: 'show_class', label: 'Class / Section' },
  { key: 'show_dob', label: 'Date of Birth' },
  { key: 'show_blood_group', label: 'Blood Group' },
  { key: 'show_address', label: 'Address' },
  { key: 'show_phone', label: 'Phone' },
  { key: 'show_parent_phone', label: "Parent's Phone" },
  { key: 'show_emergency_contact', label: 'Emergency Contact' },
];

// ── Realistic ID Card Preview ─────────────────────────────────────────────────

interface PreviewCardProps {
  side: 'front' | 'back';
  config: IDCardFaceConfig;
  orientation: 'portrait' | 'landscape';
  student?: Student | null;
  institutionName?: string;
  logoUrl?: string;
  scale?: number;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  side,
  config,
  orientation,
  student,
  institutionName = 'School / Institution Name',
  logoUrl,
  scale = 1,
}) => {
  const isPortrait = orientation === 'portrait';
  const W = (isPortrait ? 240 : 380) * scale;
  const H = (isPortrait ? 380 : 240) * scale;
  const fs = scale; // font scale factor

  const name = student ? `${student.first_name} ${student.last_name}` : 'Student Full Name';
  const admNo = student?.admission_number ?? 'ADM-0000000';
  const sec = student?.section as { grade?: { name?: string }; name?: string } | undefined;
  const className = sec
    ? `${sec.grade?.name ?? ''} ${sec.name ?? ''}`.trim() || 'Grade – Section'
    : 'Grade – Section';
  const dob = student?.date_of_birth ?? 'DD / MM / YYYY';
  const blood = student?.blood_group ?? '—';
  const phone = student?.phone ?? '—';
  const parentPhone = student?.parent_phone ?? '—';
  const address = student?.address ?? '—';
  const emergency = student?.emergency_contact_phone ?? '—';

  const headerBg = config.header_color ?? '#1565c0';
  const cardBg = config.background_color ?? '#ffffff';
  const borderCol = config.border_color ?? '#1565c0';

  // Barcode-style decoration (CSS only, no library)
  const BarcodeDecor = () => (
    <Box
      sx={{
        height: 22 * fs,
        width: '85%',
        mx: 'auto',
        background:
          'repeating-linear-gradient(90deg,#222 0,#222 2px,transparent 2px,transparent 4px,#222 4px,#222 5px,transparent 5px,transparent 8px)',
        borderRadius: 0.5,
        opacity: 0.75,
      }}
    />
  );

  return (
    <Box
      sx={{
        width: W,
        height: H,
        backgroundColor: cardBg,
        border: `2px solid ${borderCol}`,
        borderRadius: 8 * fs,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 ${4 * fs}px ${14 * fs}px rgba(0,0,0,0.22)`,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          backgroundColor: headerBg,
          px: 1.5 * fs,
          py: 0.8 * fs,
          display: 'flex',
          alignItems: 'center',
          gap: 0.8 * fs,
          flexShrink: 0,
          minHeight: 50 * fs,
        }}
      >
        {/* Logo or placeholder circle */}
        {logoUrl ? (
          <Box
            component="img"
            src={logoUrl}
            alt="logo"
            sx={{
              width: 32 * fs,
              height: 32 * fs,
              objectFit: 'contain',
              borderRadius: '50%',
              background: 'white',
              flexShrink: 0,
              p: '2px',
            }}
          />
        ) : (
          <Box
            sx={{
              width: 32 * fs,
              height: 32 * fs,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CreditCardIcon sx={{ fontSize: 18 * fs, color: 'white' }} />
          </Box>
        )}
        <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
          <Typography
            noWrap
            sx={{
              color: '#fff',
              fontWeight: 800,
              fontSize: 10 * fs,
              lineHeight: 1.2,
              letterSpacing: 0.3,
            }}
          >
            {institutionName}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 7.5 * fs,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Student Identity Card
          </Typography>
        </Box>
      </Box>

      {/* ── Body ── */}
      {side === 'front' ? (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: 1.2 * fs,
            pt: 1.2 * fs,
            pb: 0.5 * fs,
            gap: 0.55 * fs,
            overflow: 'hidden',
          }}
        >
          {config.show_photo && (
            <Avatar
              src={student?.photo_url}
              sx={{
                width: 58 * fs,
                height: 58 * fs,
                border: `3px solid ${headerBg}`,
                boxShadow: `0 2px 8px ${headerBg}55`,
                fontSize: 22 * fs,
                flexShrink: 0,
              }}
            >
              {student?.first_name?.[0]?.toUpperCase() ?? '?'}
            </Avatar>
          )}

          {config.show_name && (
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: 11.5 * fs,
                color: '#1a1a1a',
                letterSpacing: 0.2,
                maxWidth: '100%',
              }}
            >
              {name}
            </Typography>
          )}

          {config.show_admission_number && (
            <Box
              sx={{
                bgcolor: `${headerBg}18`,
                border: `1px solid ${headerBg}44`,
                borderRadius: 1 * fs,
                px: 1 * fs,
                py: 0.2 * fs,
              }}
            >
              <Typography
                sx={{ fontSize: 8 * fs, color: headerBg, fontWeight: 700, letterSpacing: 0.5 }}
              >
                {admNo}
              </Typography>
            </Box>
          )}

          {config.show_class && (
            <Typography sx={{ fontSize: 9 * fs, color: '#444', fontWeight: 600 }}>
              {className}
            </Typography>
          )}

          {config.show_dob && (
            <Typography sx={{ fontSize: 8 * fs, color: '#555' }}>DOB: {dob}</Typography>
          )}

          {config.show_blood_group && blood !== '—' && (
            <Box
              sx={{
                bgcolor: '#fff0f0',
                border: '1px solid #ffcccc',
                borderRadius: 0.8 * fs,
                px: 0.9 * fs,
                py: 0.1 * fs,
                display: 'flex',
                alignItems: 'center',
                gap: 0.3 * fs,
              }}
            >
              <Typography sx={{ fontSize: 9 * fs, color: '#c0392b', fontWeight: 700 }}>
                Blood: {blood}
              </Typography>
            </Box>
          )}

          {config.show_phone && (
            <Typography sx={{ fontSize: 8 * fs, color: '#555' }}>Ph: {phone}</Typography>
          )}

          {config.show_parent_phone && (
            <Typography sx={{ fontSize: 8 * fs, color: '#555' }}>Parent: {parentPhone}</Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            px: 1.4 * fs,
            pt: 1 * fs,
            pb: 0.5 * fs,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.55 * fs,
            overflow: 'hidden',
          }}
        >
          {config.show_name && (
            <Typography sx={{ fontSize: 8.5 * fs, color: '#222' }} noWrap>
              <strong>Name:</strong> {name}
            </Typography>
          )}
          {config.show_address && (
            <Typography sx={{ fontSize: 8 * fs, color: '#444' }} noWrap>
              <strong>Address:</strong> {address}
            </Typography>
          )}
          {config.show_dob && (
            <Typography sx={{ fontSize: 8 * fs, color: '#444' }}>
              <strong>DOB:</strong> {dob}
            </Typography>
          )}
          {config.show_blood_group && (
            <Typography sx={{ fontSize: 8 * fs, color: '#c0392b' }}>
              <strong>Blood Group:</strong> {blood}
            </Typography>
          )}
          {config.show_phone && (
            <Typography sx={{ fontSize: 8 * fs, color: '#444' }}>
              <strong>Phone:</strong> {phone}
            </Typography>
          )}
          {config.show_parent_phone && (
            <Typography sx={{ fontSize: 8 * fs, color: '#444' }}>
              <strong>Parent Ph:</strong> {parentPhone}
            </Typography>
          )}
          {config.show_emergency_contact && (
            <Typography sx={{ fontSize: 8 * fs, color: '#c0392b', fontWeight: 600 }}>
              <strong>Emergency:</strong> {emergency}
            </Typography>
          )}

          {/* Barcode at bottom */}
          <Box
            sx={{
              mt: 'auto',
              pb: 0.5 * fs,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.3 * fs,
            }}
          >
            <BarcodeDecor />
            <Typography
              sx={{
                fontSize: 6.5 * fs,
                color: '#999',
                textAlign: 'center',
                letterSpacing: 1.5,
                fontFamily: 'monospace',
              }}
            >
              {student?.admission_number ?? '0000000000'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Footer strip ── */}
      <Box
        sx={{
          backgroundColor: headerBg,
          py: 0.4 * fs,
          px: 1 * fs,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 6.5 * fs,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          {side === 'front'
            ? 'If found, please return to the institution'
            : 'Issued by School Authority — Not Transferable'}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Full Preview Dialog ───────────────────────────────────────────────────────

interface FullPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  template: IDCardTemplate;
  student?: Student | null;
  institutionName?: string;
  onDownload?: () => void;
  downloading?: boolean;
  studentOptions?: Student[];
  studentLoading?: boolean;
  onStudentSearch?: (q: string) => void;
  onStudentChange?: (s: Student | null) => void;
}

const FullPreviewDialog: React.FC<FullPreviewDialogProps> = ({
  open,
  onClose,
  template,
  student,
  institutionName,
  onDownload,
  downloading,
  studentOptions = [],
  studentLoading = false,
  onStudentSearch,
  onStudentChange,
}) => {
  const scale = template.orientation === 'landscape' ? 1.1 : 1.25;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Full Preview — {template.name}
          </Typography>
          <Chip label={template.orientation} size="small" variant="outlined" color="primary" />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Student selector */}
        {onStudentSearch && onStudentChange && (
          <Autocomplete
            options={studentOptions}
            getOptionLabel={(s) =>
              `${s.first_name} ${s.last_name}${s.admission_number ? ` (${s.admission_number})` : ''}`
            }
            loading={studentLoading}
            value={student ?? null}
            onChange={(_e, val) => onStudentChange(val)}
            onInputChange={(_e, val) => onStudentSearch(val)}
            sx={{ mb: 3 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Preview with student (optional)"
                size="small"
                placeholder="Search by name or admission number…"
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
        )}

        {/* Cards side-by-side */}
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            py: 1,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              FRONT SIDE
            </Typography>
            <PreviewCard
              side="front"
              config={template.front_config ?? EMPTY_FRONT}
              orientation={template.orientation}
              student={student}
              institutionName={institutionName}
              logoUrl={template.logo_url}
              scale={scale}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              BACK SIDE
            </Typography>
            <PreviewCard
              side="back"
              config={template.back_config ?? EMPTY_BACK}
              orientation={template.orientation}
              student={student}
              institutionName={institutionName}
              logoUrl={template.logo_url}
              scale={scale}
            />
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          This is a visual preview. The downloaded PDF may differ slightly.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {onDownload && (
          <Button
            variant="contained"
            startIcon={
              downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />
            }
            onClick={onDownload}
            disabled={!student || downloading}
          >
            {downloading ? 'Downloading…' : 'Download PDF'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
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

  const [tab, setTab] = useState(0);

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

  // Full preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewDialogStudent, setPreviewDialogStudent] = useState<Student | null>(null);
  const [previewDialogSearch, setPreviewDialogSearch] = useState('');
  const [previewDialogStudentOptions, setPreviewDialogStudentOptions] = useState<Student[]>([]);
  const [previewDialogStudentLoading, setPreviewDialogStudentLoading] = useState(false);
  const [previewDialogDownloading, setPreviewDialogDownloading] = useState(false);

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

  // Preview student (templates tab)
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentOptions, setStudentOptions] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);

  // Generate tab
  const [genStudent, setGenStudent] = useState<Student | null>(null);
  const [genStudentSearch, setGenStudentSearch] = useState('');
  const [genStudentOptions, setGenStudentOptions] = useState<Student[]>([]);
  const [genStudentLoading, setGenStudentLoading] = useState(false);
  const [genTemplate, setGenTemplate] = useState<number | ''>('');
  const [genValidUntil, setGenValidUntil] = useState('');
  const [generating, setGenerating] = useState(false);

  // Bulk
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [bulkGrade, setBulkGrade] = useState<number | ''>('');
  const [bulkSection, setBulkSection] = useState<number | ''>('');
  const [bulkTemplate, setBulkTemplate] = useState<number | ''>('');
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ── load templates ──────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = isDemo
        ? ((await demoIDCardsApi.getIDCardTemplates()) as IDCardTemplate[])
        : await schoolAdminApi.idCardTemplates.list();
      setTemplates(data);
      setSelectedTemplate((prev) => {
        if (!prev && data.length > 0) return data[0];
        if (prev) return data.find((t) => t.id === prev.id) ?? prev;
        return prev;
      });
    } catch {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoadingTemplates(false);
    }
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

  // student search — templates tab preview
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

  // student search — generate tab
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

  // student search — full preview dialog
  useEffect(() => {
    if (!previewDialogSearch || isDemo) return;
    const t = setTimeout(async () => {
      setPreviewDialogStudentLoading(true);
      try {
        const r = await studentsApi.listStudents({ search: previewDialogSearch, limit: 10 });
        setPreviewDialogStudentOptions(r.items ?? []);
      } catch {
        setPreviewDialogStudentOptions([]);
      } finally {
        setPreviewDialogStudentLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [previewDialogSearch, isDemo]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

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
      front_config: { ...EMPTY_FRONT, ...(tmpl.front_config ?? {}) },
      back_config: { ...EMPTY_BACK, ...(tmpl.back_config ?? {}) },
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
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      showSnackbar('Template deleted', 'success');
      loadTemplates();
    } catch {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  // ── Logo upload — updates state immediately from response ──────────────────
  const handleLogoUpload = async (file: File) => {
    if (!selectedTemplate || isDemo) return;
    setUploadingLogo(true);
    try {
      const result = await schoolAdminApi.idCardTemplates.uploadLogo(selectedTemplate.id, file);
      const newLogo = result.logo_url;
      // Update selectedTemplate immediately — no need to wait for loadTemplates()
      setSelectedTemplate((prev) => (prev ? { ...prev, logo_url: newLogo } : prev));
      setTemplates((prev) =>
        prev.map((t) => (t.id === selectedTemplate.id ? { ...t, logo_url: newLogo } : t))
      );
      showSnackbar('Logo uploaded and applied', 'success');
    } catch {
      showSnackbar('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Generate single ────────────────────────────────────────────────────────
  const handleGenerate = async (studentOverride?: Student | null) => {
    const target = studentOverride ?? genStudent;
    if (!target) {
      showSnackbar('Please select a student', 'error');
      return;
    }
    setGenerating(true);
    setPreviewDialogDownloading(true);
    try {
      const blob = await schoolAdminApi.idCards.generate(
        target.id,
        genTemplate || undefined,
        genValidUntil || undefined
      );
      downloadBlob(blob, `id_card_${target.admission_number || target.id}.pdf`);
      showSnackbar('ID card downloaded', 'success');
    } catch {
      showSnackbar('Failed to generate ID card', 'error');
    } finally {
      setGenerating(false);
      setPreviewDialogDownloading(false);
    }
  };

  // ── Bulk ───────────────────────────────────────────────────────────────────
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
        `Done: ${(result as { total_cards?: number }).total_cards ?? 0} cards generated`,
        'success'
      );
    } catch {
      showSnackbar('Failed to bulk generate', 'error');
    } finally {
      setBulkGenerating(false);
    }
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const updateFront = (key: keyof IDCardFaceConfig, val: boolean | string) =>
    setFormData((p) => ({ ...p, front_config: { ...p.front_config, [key]: val } }));
  const updateBack = (key: keyof IDCardFaceConfig, val: boolean | string) =>
    setFormData((p) => ({ ...p, back_config: { ...p.back_config, [key]: val } }));

  const filteredSections = bulkGrade ? sections.filter((s) => s.grade_id === bulkGrade) : sections;
  const genSelectedTemplate = templates.find((t) => t.id === genTemplate) ?? null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          ID Card Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Design templates, upload logo, preview with real students, and download ID cards as PDF
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<CreditCardIcon />} label="Templates" iconPosition="start" />
        <Tab icon={<DownloadIcon />} label="Generate & Download" iconPosition="start" />
      </Tabs>

      {/* ── TAB 0: Templates ───────────────────────────────────────────────── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Sidebar */}
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
                          bgcolor: 'primary.50',
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

          {/* Main panel */}
          <Grid item xs={12} md={9}>
            {selectedTemplate ? (
              <Paper sx={{ p: 3 }}>
                {/* Top bar */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {selectedTemplate.name}
                      </Typography>
                      {selectedTemplate.is_default && (
                        <Chip label="Default" size="small" color="warning" icon={<StarIcon />} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {selectedTemplate.orientation === 'portrait' ? 'Portrait' : 'Landscape'} •{' '}
                      {selectedTemplate.logo_url ? 'Logo uploaded' : 'No logo yet'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* Logo upload */}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={uploadingLogo ? <CircularProgress size={14} /> : <UploadIcon />}
                      component="label"
                      disabled={uploadingLogo}
                      color={selectedTemplate.logo_url ? 'success' : 'primary'}
                    >
                      {selectedTemplate.logo_url ? 'Replace Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FullscreenIcon />}
                      onClick={() => {
                        setPreviewDialogStudent(previewStudent);
                        setPreviewDialogOpen(true);
                      }}
                    >
                      Full Preview
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => openEdit(selectedTemplate)}
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>

                {/* Logo preview row */}
                {selectedTemplate.logo_url && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'success.50',
                      border: '1px solid',
                      borderColor: 'success.200',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={selectedTemplate.logo_url}
                      alt="Uploaded logo"
                      sx={{
                        height: 48,
                        width: 48,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'success.200',
                        background: 'white',
                        p: '4px',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="success.800">
                        Logo uploaded
                      </Typography>
                      <Typography variant="caption" color="success.700">
                        Showing in ID card header below
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Student selector */}
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
                      label="Preview with real student (search by name or admission number)"
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

                {/* ID card previews */}
                <Grid container spacing={4} justifyContent="center">
                  <Grid item xs={12} sm="auto">
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        letterSpacing={1}
                      >
                        FRONT SIDE
                      </Typography>
                      <PreviewCard
                        side="front"
                        config={selectedTemplate.front_config ?? EMPTY_FRONT}
                        orientation={selectedTemplate.orientation}
                        student={previewStudent}
                        logoUrl={selectedTemplate.logo_url}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm="auto">
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        letterSpacing={1}
                      >
                        BACK SIDE
                      </Typography>
                      <PreviewCard
                        side="back"
                        config={selectedTemplate.back_config ?? EMPTY_BACK}
                        orientation={selectedTemplate.orientation}
                        student={previewStudent}
                        logoUrl={selectedTemplate.logo_url}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FullscreenIcon />}
                    onClick={() => {
                      setPreviewDialogStudent(previewStudent);
                      setPreviewDialogOpen(true);
                    }}
                  >
                    Open Full Preview
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <CreditCardIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a template or create one
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                  Create First Template
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* ── TAB 1: Generate & Download ─────────────────────────────────────── */}
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

              {/* Student search */}
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
                <InputLabel>Template</InputLabel>
                <Select
                  value={genTemplate}
                  onChange={(e) => setGenTemplate(e.target.value as number | '')}
                  label="Template"
                >
                  <MenuItem value="">Default template</MenuItem>
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

              {/* Preview when student selected */}
              {genStudent && (
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      PREVIEW
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<FullscreenIcon />}
                      onClick={() => {
                        setPreviewDialogStudent(genStudent);
                        setPreviewDialogOpen(true);
                      }}
                    >
                      Full Preview
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <PreviewCard
                      side="front"
                      config={genSelectedTemplate?.front_config ?? EMPTY_FRONT}
                      orientation={genSelectedTemplate?.orientation ?? 'portrait'}
                      student={genStudent}
                      logoUrl={genSelectedTemplate?.logo_url}
                      scale={0.85}
                    />
                    <PreviewCard
                      side="back"
                      config={genSelectedTemplate?.back_config ?? EMPTY_BACK}
                      orientation={genSelectedTemplate?.orientation ?? 'portrait'}
                      student={genStudent}
                      logoUrl={genSelectedTemplate?.logo_url}
                      scale={0.85}
                    />
                  </Box>
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={
                  generating ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />
                }
                onClick={() => handleGenerate()}
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
                <InputLabel>Template</InputLabel>
                <Select
                  value={bulkTemplate}
                  onChange={(e) => setBulkTemplate(e.target.value as number | '')}
                  label="Template"
                >
                  <MenuItem value="">Default template</MenuItem>
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                      {t.is_default && ' ★'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 3 }}>
                Generates ID cards for all students in the selected grade / section.
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

      {/* ── Full Preview Dialog ────────────────────────────────────────────── */}
      {selectedTemplate && (
        <FullPreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          template={selectedTemplate}
          student={previewDialogStudent}
          onDownload={() => handleGenerate(previewDialogStudent)}
          downloading={previewDialogDownloading}
          studentOptions={previewDialogStudentOptions}
          studentLoading={previewDialogStudentLoading}
          onStudentSearch={(q) => setPreviewDialogSearch(q)}
          onStudentChange={(s) => setPreviewDialogStudent(s)}
        />
      )}

      {/* ── Create / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="h6">
            {isEditing ? `Edit Template: ${formData.name}` : 'Create New Template'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Basic settings */}
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Template Name *"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
                  <MenuItem value="portrait">Portrait (vertical)</MenuItem>
                  <MenuItem value="landscape">Landscape (horizontal)</MenuItem>
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
                    <span>Set as Default</span>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Fields & Colors — Front */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                  Front Side
                </Typography>
                <FieldToggle
                  title="Fields to show"
                  config={formData.front_config}
                  onChange={updateFront}
                />
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
                    label="Header"
                    type="color"
                    value={formData.front_config.header_color ?? '#1565c0'}
                    onChange={(e) => updateFront('header_color', e.target.value)}
                    sx={{ width: 110 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Border"
                    type="color"
                    value={formData.front_config.border_color ?? '#1565c0'}
                    onChange={(e) => updateFront('border_color', e.target.value)}
                    sx={{ width: 110 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Fields & Colors — Back */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                  Back Side
                </Typography>
                <FieldToggle
                  title="Fields to show"
                  config={formData.back_config}
                  onChange={updateBack}
                />
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    label="Background"
                    type="color"
                    value={formData.back_config.background_color ?? '#f8f9fa'}
                    onChange={(e) => updateBack('background_color', e.target.value)}
                    sx={{ width: 110 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Header"
                    type="color"
                    value={formData.back_config.header_color ?? '#1565c0'}
                    onChange={(e) => updateBack('header_color', e.target.value)}
                    sx={{ width: 110 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small"
                    label="Border"
                    type="color"
                    value={formData.back_config.border_color ?? '#1565c0'}
                    onChange={(e) => updateBack('border_color', e.target.value)}
                    sx={{ width: 110 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Live preview in dialog */}
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Live Preview
              </Typography>
              <Box
                sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', py: 1 }}
              >
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Front
                  </Typography>
                  <PreviewCard
                    side="front"
                    config={formData.front_config}
                    orientation={formData.orientation}
                    scale={0.85}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Back
                  </Typography>
                  <PreviewCard
                    side="back"
                    config={formData.back_config}
                    orientation={formData.orientation}
                    scale={0.85}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
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
