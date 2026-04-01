import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import teachersApi, { BulkImportResult } from '@/api/teachers';

const steps = ['Upload CSV', 'Preview Data', 'Import Results'];

interface PreviewRow {
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  qualification?: string;
  specialization?: string;
  joining_date?: string;
}

export default function TeacherBulkImport() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      parseCSVPreview(file);
    }
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim());
      const rows: PreviewRow[] = [];

      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        if (row.first_name && row.last_name && row.email) {
          rows.push(row as unknown as PreviewRow);
        }
      }

      setPreviewData(rows);
      setActiveStep(1);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const result = await teachersApi.bulkImportTeachers(selectedFile);
      setImportResult(result);
      setActiveStep(2);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to import teachers');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `employee_id,first_name,last_name,email,phone,date_of_birth,gender,address,qualification,specialization,joining_date
EMP001,John,Doe,john.doe@example.com,1234567890,1985-05-15,Male,"123 Main St",Masters in Mathematics,Algebra,2020-08-01
EMP002,Jane,Smith,jane.smith@example.com,0987654321,1990-08-20,Female,"456 Oak Ave",PhD in Physics,Quantum Mechanics,2021-01-15`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setError(null);
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
              Bulk Import Teachers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Import multiple teachers from a CSV file
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

      {activeStep === 0 && (
        <Paper elevation={0} sx={{ p: 4, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Upload CSV File
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a CSV file containing teacher information
            </Typography>
          </Box>

          <Card
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography variant="subtitle2" gutterBottom color="info.main">
              CSV Format Requirements:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Required columns: first_name, last_name, email"
                  secondary="These fields must be present in every row"
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Optional columns: employee_id, phone, date_of_birth (YYYY-MM-DD), gender, address, qualification, specialization, joining_date (YYYY-MM-DD)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="File must be in CSV format with comma-separated values" />
              </ListItem>
            </List>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              size="large"
            >
              Download Template
            </Button>

            <Box
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                p: 4,
                width: '100%',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <input
                accept=".csv"
                type="file"
                id="csv-upload"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {selectedFile ? selectedFile.name : 'Click to upload CSV file'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or drag and drop your file here
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {activeStep === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review the first few rows of your CSV file before importing
            </Typography>
          </Box>

          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Qualification</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.employee_id || '-'}</TableCell>
                    <TableCell>{row.first_name}</TableCell>
                    <TableCell>{row.last_name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phone || '-'}</TableCell>
                    <TableCell>{row.qualification || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mb: 3 }}>
            Showing first {previewData.length} rows. All valid rows will be imported.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleReset}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleImport} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Import Teachers'}
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 2 && importResult && (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Import Complete
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 4, justifyContent: 'center' }}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, minWidth: 150 }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary" fontWeight={700}>
                  {importResult.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Rows
                </Typography>
              </CardContent>
            </Card>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.success.main}`, minWidth: 150 }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {importResult.success}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful
                </Typography>
              </CardContent>
            </Card>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.error.main}`, minWidth: 150 }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight={700}>
                  {importResult.failed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {importResult.errors.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Import Errors
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResult.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.email || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ErrorIcon fontSize="small" color="error" />
                            {error.error}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button variant="outlined" onClick={handleReset}>
              Import More
            </Button>
            <Button variant="contained" onClick={() => navigate('/admin/users/teachers')}>
              View Teachers
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
