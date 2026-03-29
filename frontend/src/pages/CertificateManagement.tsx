import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Autocomplete,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import schoolAdminApi, {
  CertificateType,
  Certificate,
  IssueCertificateRequest,
  CertificateTemplate,
  CertificateTemplateConfig,
  IDCardTemplate,
  BulkIDCardGenerateRequest,
} from '../api/schoolAdmin';
import studentsApi, { Student } from '../api/students';
import { academicApi } from '../api/academic';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const certificateTypes: CertificateType[] = [
  'TC',
  'LC',
  'Bonafide',
  'Character',
  'Study',
  'Conduct',
  'Migration',
  'Fee',
  'No Dues',
  'Sports',
  'Merit',
  'Participation',
];

export const CertificateManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Certificate Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Issue certificates, manage ID cards, and configure templates
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Issue Certificate" />
          <Tab label="Issued Certificates" />
          <Tab label="ID Card Generation" />
          <Tab label="Certificate Templates" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <IssueCertificateTab showSnackbar={showSnackbar} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <IssuedCertificatesTab showSnackbar={showSnackbar} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <IDCardGenerationTab showSnackbar={showSnackbar} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <CertificateTemplatesTab showSnackbar={showSnackbar} />
        </TabPanel>
      </Paper>

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

interface TabProps {
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info') => void;
}

const IssueCertificateTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [certificateType, setCertificateType] = useState<CertificateType>('Bonafide');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateType]);

  const loadTemplates = async () => {
    try {
      const data = await schoolAdminApi.certificateTemplates.list(certificateType);
      setTemplates(data);
      if (data.length > 0 && data.find((t) => t.is_default)) {
        setSelectedTemplate(data.find((t) => t.is_default)?.id);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const handleStudentSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) return;
    setStudentSearchLoading(true);
    try {
      const response = await studentsApi.listStudents({ search: searchTerm, limit: 20 });
      setStudents(response.items);
    } catch (error) {
      showSnackbar('Failed to search students', 'error');
    } finally {
      setStudentSearchLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedStudent) {
      showSnackbar('Please select a student', 'error');
      return;
    }

    setLoading(true);
    try {
      const data: IssueCertificateRequest = {
        student_id: selectedStudent.id,
        certificate_type: certificateType,
        template_id: selectedTemplate,
        remarks: remarks || undefined,
      };

      const certificate = await schoolAdminApi.certificates.issue(data);
      setIssuedCertificate(certificate);

      const blob = await schoolAdminApi.certificates.download(certificate.id);
      setPreviewBlob(blob);
      setPreviewDialogOpen(true);

      showSnackbar('Certificate issued successfully', 'success');
      setSelectedStudent(null);
      setRemarks('');
    } catch (error) {
      showSnackbar('Failed to issue certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (previewBlob && issuedCertificate) {
      const url = URL.createObjectURL(previewBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificateType}_${issuedCertificate.serial_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={students}
            getOptionLabel={(option) =>
              `${option.first_name} ${option.last_name} - ${option.admission_number || 'N/A'}`
            }
            value={selectedStudent}
            onChange={(_, newValue) => setSelectedStudent(newValue)}
            onInputChange={(_, newInputValue) => handleStudentSearch(newInputValue)}
            loading={studentSearchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Student"
                placeholder="Type student name or admission number"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {studentSearchLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Certificate Type</InputLabel>
            <Select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as CertificateType)}
              label="Certificate Type"
            >
              {certificateTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Template</InputLabel>
            <Select
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(Number(e.target.value))}
              label="Template"
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name} {template.is_default && '(Default)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter any additional remarks or notes"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            onClick={handleIssueCertificate}
            disabled={loading || !selectedStudent}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            Issue Certificate
          </Button>
        </Grid>
      </Grid>

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Certificate Preview</DialogTitle>
        <DialogContent>
          {previewBlob && (
            <Box sx={{ width: '100%', height: '500px' }}>
              <iframe
                src={URL.createObjectURL(previewBlob)}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button startIcon={<DownloadIcon />} onClick={handleDownload} variant="outlined">
            Download
          </Button>
          <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="contained">
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const IssuedCertificatesTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [filterType, setFilterType] = useState<CertificateType | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, filterType, filterDateFrom, filterDateTo]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const response = await schoolAdminApi.certificates.list({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        certificate_type: filterType || undefined,
        from_date: filterDateFrom || undefined,
        to_date: filterDateTo || undefined,
      });
      setCertificates(response.items);
      setTotalRows(response.total);
    } catch (error) {
      showSnackbar('Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, serialNumber: string, type: string) => {
    try {
      const blob = await schoolAdminApi.certificates.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${serialNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Certificate downloaded', 'success');
    } catch (error) {
      showSnackbar('Failed to download certificate', 'error');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;

    const reason = prompt('Please enter the reason for revocation:');
    if (!reason) return;

    try {
      await schoolAdminApi.certificates.revoke(id, { reason });
      showSnackbar('Certificate revoked successfully', 'success');
      loadCertificates();
    } catch (error) {
      showSnackbar('Failed to revoke certificate', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'serial_number', headerName: 'Serial Number', width: 150 },
    { field: 'certificate_type', headerName: 'Type', width: 120 },
    { field: 'student_name', headerName: 'Student', width: 200 },
    { field: 'issue_date', headerName: 'Issue Date', width: 120 },
    { field: 'issued_by_name', headerName: 'Issued By', width: 150 },
    {
      field: 'is_revoked',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Revoked' : 'Active'}
          color={params.value ? 'error' : 'success'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="download"
          icon={<DownloadIcon />}
          label="Download"
          onClick={() =>
            handleDownload(params.row.id, params.row.serial_number, params.row.certificate_type)
          }
        />,
        <GridActionsCellItem
          key="revoke"
          icon={<CancelIcon />}
          label="Revoke"
          onClick={() => handleRevoke(params.row.id)}
          disabled={params.row.is_revoked}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CertificateType | '')}
              label="Filter by Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {certificateTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </Grid>
      </Grid>

      <DataGrid
        rows={certificates}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={totalRows}
        paginationMode="server"
        pageSizeOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
      />
    </Box>
  );
};

const IDCardGenerationTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSection, setSelectedSection] = useState<number | ''>('');
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadGrades();
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedGrade) {
      loadSections(selectedGrade as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade]);

  useEffect(() => {
    if (selectedSection) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

  const loadGrades = async () => {
    try {
      const data = await academicApi.getGrades();
      setGrades(data);
    } catch (error) {
      showSnackbar('Failed to load grades', 'error');
    }
  };

  const loadSections = async (gradeId: number) => {
    try {
      const data = await academicApi.getSections(gradeId);
      setSections(data);
    } catch (error) {
      showSnackbar('Failed to load sections', 'error');
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await schoolAdminApi.idCardTemplates.list();
      setTemplates(data);
      const defaultTemplate = data.find((t) => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const loadStudents = async () => {
    if (!selectedSection) return;
    try {
      const response = await studentsApi.listStudents({
        section_id: selectedSection as number,
        limit: 1000,
      });
      setStudents(response.items);
    } catch (error) {
      showSnackbar('Failed to load students', 'error');
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedGrade && !selectedSection) {
      showSnackbar('Please select a grade or section', 'error');
      return;
    }

    setLoading(true);
    try {
      const data: BulkIDCardGenerateRequest = {
        grade_id: selectedGrade ? (selectedGrade as number) : undefined,
        section_id: selectedSection ? (selectedSection as number) : undefined,
        template_id: selectedTemplate,
      };

      const blob = await schoolAdminApi.idCards.bulkGenerate(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `id_cards_bulk.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSnackbar('ID cards generated successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to generate ID cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleGenerate = async () => {
    if (!selectedStudent) {
      showSnackbar('Please select a student', 'error');
      return;
    }

    setLoading(true);
    try {
      const blob = await schoolAdminApi.idCards.generate(selectedStudent.id, selectedTemplate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `id_card_${selectedStudent.admission_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSnackbar('ID card generated successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to generate ID card', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Bulk Generation
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Grade</InputLabel>
            <Select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as number)}
              label="Grade"
            >
              <MenuItem value="">All Grades</MenuItem>
              {grades.map((grade) => (
                <MenuItem key={grade.id} value={grade.id}>
                  {grade.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as number)}
              label="Section"
              disabled={!selectedGrade}
            >
              <MenuItem value="">All Sections</MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Template</InputLabel>
            <Select
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(Number(e.target.value))}
              label="Template"
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name} {template.is_default && '(Default)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleBulkGenerate}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            Generate ID Cards for Entire Class
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Single Student ID Card
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Autocomplete
            options={students}
            getOptionLabel={(option) =>
              `${option.first_name} ${option.last_name} - ${option.admission_number || 'N/A'}`
            }
            value={selectedStudent}
            onChange={(_, newValue) => setSelectedStudent(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Student" placeholder="Choose a student" />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleSingleGenerate}
            disabled={loading || !selectedStudent}
            sx={{ height: '56px' }}
          >
            Generate Single ID Card
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const CertificateTemplatesTab: React.FC<TabProps> = ({ showSnackbar }) => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    certificate_type: CertificateType;
    template_config: CertificateTemplateConfig;
    is_default: boolean;
  }>({
    name: '',
    certificate_type: 'Bonafide',
    template_config: {
      header: '',
      body_text: '',
      footer_text: '',
      custom_fields: [],
    },
    is_default: false,
  });

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await schoolAdminApi.certificateTemplates.list();
      setTemplates(data);
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      certificate_type: 'Bonafide',
      template_config: {
        header: '',
        body_text: '',
        footer_text: '',
        custom_fields: [],
      },
      is_default: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      certificate_type: template.certificate_type,
      template_config: template.template_config,
      is_default: template.is_default,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await schoolAdminApi.certificateTemplates.update(editingTemplate.id, formData);
        showSnackbar('Template updated successfully', 'success');
      } else {
        await schoolAdminApi.certificateTemplates.create(formData);
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
      await schoolAdminApi.certificateTemplates.delete(id);
      showSnackbar('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Template
        </Button>
      </Box>

      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h6">{template.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {template.certificate_type}
                  </Typography>
                  {template.is_default && (
                    <Chip label="Default" color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                </Box>
                <Box>
                  <IconButton onClick={() => handleEdit(template)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(template.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Preview Configuration:
                </Typography>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(template.template_config, null, 2)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
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
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Certificate Type</InputLabel>
                <Select
                  value={formData.certificate_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificate_type: e.target.value as CertificateType,
                    })
                  }
                  label="Certificate Type"
                >
                  {certificateTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Template Configuration (JSON)"
                value={JSON.stringify(formData.template_config, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setFormData({ ...formData, template_config: config });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                helperText="Enter valid JSON configuration for the template"
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
    </Box>
  );
};

export default CertificateManagement;
