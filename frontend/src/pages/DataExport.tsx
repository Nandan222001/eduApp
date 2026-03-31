import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Snackbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  TableEntity,
  ExportFormat,
  ExportConfig,
  ScheduledExportConfig,
  ColumnDefinition,
  ExportPreview,
} from '@/types/dataManagement';
import dataManagementApi from '@/api/dataManagement';
import ColumnSelector from '@/components/dataManagement/ColumnSelector';
import ExportPreviewDialog from '@/components/dataManagement/ExportPreviewDialog';
import ScheduledExportDialog from '@/components/dataManagement/ScheduledExportDialog';
import { isDemoUser } from '@/api/demoDataApi';

export default function DataExport() {
  const [entity, setEntity] = useState<TableEntity>('students');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ExportPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [scheduledExports, setScheduledExports] = useState<ScheduledExportConfig[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchEntityMetadata();
    fetchScheduledExports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  const fetchEntityMetadata = async () => {
    try {
      if (isDemoUser()) {
        // Use demo data for metadata
        const demoMetadata = [
          {
            entity,
            columns: [
              { id: 'id', label: 'ID', type: 'number' as const, required: true },
              { id: 'name', label: 'Name', type: 'string' as const, required: true },
              { id: 'email', label: 'Email', type: 'string' as const, required: true },
              { id: 'phone', label: 'Phone', type: 'string' as const, required: false },
            ],
          },
        ];
        setAvailableColumns(demoMetadata[0].columns);
        setSelectedColumns(
          demoMetadata[0].columns.filter((col) => col.required).map((col) => col.id)
        );
      } else {
        const metadata = await dataManagementApi.getEntityMetadata(entity);
        if (metadata.length > 0) {
          setAvailableColumns(metadata[0].columns);
          setSelectedColumns(
            metadata[0].columns.filter((col) => col.required).map((col) => col.id)
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  const fetchScheduledExports = async () => {
    try {
      if (isDemoUser()) {
        setScheduledExports([]);
      } else {
        const exports = await dataManagementApi.getScheduledExports();
        setScheduledExports(exports);
      }
    } catch (err) {
      console.error('Failed to fetch scheduled exports:', err);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewOpen(true);

    try {
      const config: ExportConfig = {
        entity,
        format,
        columns: selectedColumns,
        dateRange:
          startDate && endDate
            ? {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }
            : undefined,
      };

      if (isDemoUser()) {
        // Provide demo preview data
        const demoRows = [
          { id: 1, name: 'Sample Student 1', email: 'student1@example.com' },
          { id: 2, name: 'Sample Student 2', email: 'student2@example.com' },
        ];
        setPreviewData({
          totalRecords: 25,
          totalCount: 25,
          rows: demoRows,
          sampleData: demoRows,
          columns: selectedColumns,
        });
      } else {
        const preview = await dataManagementApi.getExportPreview(config);
        setPreviewData(preview);
      }
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to generate preview',
        severity: 'error',
      });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const config: ExportConfig = {
        entity,
        format,
        columns: selectedColumns,
        dateRange:
          startDate && endDate
            ? {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }
            : undefined,
      };

      if (isDemoUser()) {
        // Create a demo blob for demo users
        const demoContent = 'Demo export data';
        const blob = new Blob([demoContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = await dataManagementApi.exportData(config);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setPreviewOpen(false);
      setSnackbar({
        open: true,
        message: 'Export completed successfully',
        severity: 'success',
      });
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Export failed',
        severity: 'error',
      });
    }
  };

  const handleScheduleExport = async (config: Omit<ScheduledExportConfig, 'id'>) => {
    try {
      if (isDemoUser()) {
        setSnackbar({
          open: true,
          message: 'Demo mode: Scheduled export created (not persisted)',
          severity: 'success',
        });
      } else {
        await dataManagementApi.createScheduledExport(config);
        setSnackbar({
          open: true,
          message: 'Scheduled export created successfully',
          severity: 'success',
        });
      }
      fetchScheduledExports();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to create scheduled export',
        severity: 'error',
      });
    }
  };

  const handleDeleteScheduledExport = async (id: string) => {
    try {
      if (isDemoUser()) {
        setSnackbar({
          open: true,
          message: 'Demo mode: Scheduled export deleted (not persisted)',
          severity: 'success',
        });
      } else {
        await dataManagementApi.deleteScheduledExport(id);
        setSnackbar({
          open: true,
          message: 'Scheduled export deleted',
          severity: 'success',
        });
      }
      fetchScheduledExports();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to delete scheduled export',
        severity: 'error',
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Data Export
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Export data in various formats with custom column selection and filtering
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Export Configuration
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Entity</InputLabel>
                    <Select
                      value={entity}
                      label="Select Entity"
                      onChange={(e) => setEntity(e.target.value as TableEntity)}
                    >
                      <MenuItem value="students">Students</MenuItem>
                      <MenuItem value="teachers">Teachers</MenuItem>
                      <MenuItem value="attendance">Attendance</MenuItem>
                      <MenuItem value="examinations">Examinations</MenuItem>
                      <MenuItem value="assignments">Assignments</MenuItem>
                      <MenuItem value="grades">Grades</MenuItem>
                      <MenuItem value="subjects">Subjects</MenuItem>
                      <MenuItem value="classes">Classes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Export Format
                  </Typography>
                  <ToggleButtonGroup
                    value={format}
                    exclusive
                    onChange={(_, value) => value && setFormat(value)}
                    fullWidth
                  >
                    <ToggleButton value="csv">CSV</ToggleButton>
                    <ToggleButton value="excel">Excel</ToggleButton>
                    <ToggleButton value="pdf">PDF</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <ColumnSelector
                  availableColumns={availableColumns}
                  selectedColumns={selectedColumns}
                  onChange={setSelectedColumns}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handlePreview}
                  disabled={selectedColumns.length === 0}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handlePreview}
                  disabled={selectedColumns.length === 0}
                >
                  Export Data
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Scheduled Exports</Typography>
                <Button
                  size="small"
                  startIcon={<ScheduleIcon />}
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  Schedule
                </Button>
              </Box>

              {scheduledExports.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No scheduled exports
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Schedule</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduledExports.map((scheduledExport, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">{scheduledExport.name}</Typography>
                            <Chip label={scheduledExport.entity} size="small" sx={{ mt: 0.5 }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">
                              {scheduledExport.schedule}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {scheduledExport.time}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteScheduledExport(String(index))}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Export Tips
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Select only the columns you need for faster exports
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Use date range filters to limit the dataset
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • CSV format is best for large datasets
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Schedule regular exports to receive data via email
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <ExportPreviewDialog
          open={previewOpen}
          preview={previewData}
          loading={previewLoading}
          onClose={() => setPreviewOpen(false)}
          onConfirm={handleExport}
        />

        <ScheduledExportDialog
          open={scheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
          onSave={handleScheduleExport}
        />

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
      </Box>
    </LocalizationProvider>
  );
}
