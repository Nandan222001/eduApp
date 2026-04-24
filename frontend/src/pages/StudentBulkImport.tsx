import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  Grid,
  Stack,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import studentsApi, { BulkImportPreviewResponse, BulkImportResult } from '@/api/students';

const steps = ['Upload CSV', 'Preview & Validate', 'Import'];

export default function StudentBulkImport() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BulkImportPreviewResponse | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const previewData = await studentsApi.previewBulkImport(selectedFile);
      setPreview(previewData);
      setActiveStep(1);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const importResult = await studentsApi.bulkImport(selectedFile);
      setResult(importResult);
      setActiveStep(2);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'admission_number',
      'roll_number',
      'email',
      'phone',
      'date_of_birth',
      'gender',
      'blood_group',
      'address',
      'parent_name',
      'parent_email',
      'parent_phone',
      'admission_date',
      'grade_name',
      'section_name',
      'emergency_contact_name',
      'emergency_contact_phone',
      'emergency_contact_relation',
      'previous_school',
      'medical_conditions',
      'nationality',
      'religion',
      'caste',
      'category',
      'aadhar_number',
    ];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const toggleRowExpansion = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/admin/users/students')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Bulk Import Students
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
          Download Template
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="1. Download the CSV template" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="2. Fill in the student data following the template format" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="3. Upload the completed CSV file" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="4. Review the preview and fix any errors" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="5. Confirm the import" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.default',
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload CSV File
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Choose a CSV file to import students
              </Typography>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="csv-upload">
                <Button variant="contained" component="span">
                  Choose File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handlePreview}
                disabled={!selectedFile || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Preview'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && preview && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Rows
                    </Typography>
                    <Typography variant="h4">{preview.total_rows}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Valid Rows
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {preview.valid_rows}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Invalid Rows
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {preview.invalid_rows}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell>
                    <TableCell>Row</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.preview.map((row) => (
                    <>
                      <TableRow key={row.row_number}>
                        <TableCell>
                          {(row.errors.length > 0 || row.warnings.length > 0) && (
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(row.row_number)}
                            >
                              {expandedRows.has(row.row_number) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>{row.row_number}</TableCell>
                        <TableCell>
                          {row.data.first_name} {row.data.last_name}
                        </TableCell>
                        <TableCell>{row.data.email || '-'}</TableCell>
                        <TableCell>
                          {row.is_valid ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Valid"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip icon={<ErrorIcon />} label="Invalid" color="error" size="small" />
                          )}
                          {row.warnings.length > 0 && (
                            <Chip
                              icon={<WarningIcon />}
                              label={`${row.warnings.length} Warning(s)`}
                              color="warning"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(row.row_number) && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 0 }}>
                            <Collapse in={expandedRows.has(row.row_number)} timeout="auto">
                              <Box sx={{ p: 2 }}>
                                {row.errors.length > 0 && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="error">
                                      Errors:
                                    </Typography>
                                    <List dense>
                                      {row.errors.map((error, idx) => (
                                        <ListItem key={idx}>
                                          <ErrorIcon
                                            fontSize="small"
                                            color="error"
                                            sx={{ mr: 1 }}
                                          />
                                          <ListItemText primary={error} />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                )}
                                {row.warnings.length > 0 && (
                                  <Box>
                                    <Typography variant="subtitle2" color="warning.main">
                                      Warnings:
                                    </Typography>
                                    <List dense>
                                      {row.warnings.map((warning, idx) => (
                                        <ListItem key={idx}>
                                          <WarningIcon
                                            fontSize="small"
                                            color="warning"
                                            sx={{ mr: 1 }}
                                          />
                                          <ListItemText primary={warning} />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={preview.valid_rows === 0 || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Import Students'}
              </Button>
            </Stack>
          </Box>
        )}

        {activeStep === 2 && result && (
          <Box>
            <Alert severity={result.failed > 0 ? 'warning' : 'success'} sx={{ mb: 3 }}>
              {result.failed > 0
                ? `Import completed with ${result.failed} error(s)`
                : 'All students imported successfully!'}
            </Alert>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Processed
                    </Typography>
                    <Typography variant="h4">{result.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Successful
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {result.success}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Failed
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {result.failed}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {result.errors.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Errors
                </Typography>
                <List>
                  {result.errors.map((error, idx) => (
                    <ListItem key={idx}>
                      <ErrorIcon color="error" sx={{ mr: 2 }} />
                      <ListItemText primary={`Row ${error.row}`} secondary={error.error} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => navigate('/admin/users/students')}>
                Go to Students
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
