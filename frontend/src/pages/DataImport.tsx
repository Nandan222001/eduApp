import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Upload as UploadIcon, History as HistoryIcon } from '@mui/icons-material';
import { TableEntity, ImportConfig, ImportResult, ImportHistory } from '@/types/dataManagement';
import dataManagementApi from '@/api/dataManagement';
import ImportWizard from '@/components/dataManagement/ImportWizard';
import ImportHistoryList from '@/components/dataManagement/ImportHistoryList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DataImport() {
  const [tabValue, setTabValue] = useState(0);
  const [entity, setEntity] = useState<TableEntity>('students');
  const [showWizard, setShowWizard] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      const history = await dataManagementApi.getImportHistory();
      setImportHistory(history);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    }
  };

  const handleStartImport = () => {
    setShowWizard(true);
  };

  const handleImportComplete = async (config: ImportConfig) => {
    setImporting(true);
    try {
      const result = await dataManagementApi.importData(config);
      setImportResult(result);
      setResultDialogOpen(true);
      setShowWizard(false);
      fetchImportHistory();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Import failed',
        severity: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleRollback = async (importId: string) => {
    try {
      await dataManagementApi.rollbackImport(importId);
      setSnackbar({
        open: true,
        message: 'Import rolled back successfully',
        severity: 'success',
      });
      fetchImportHistory();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Rollback failed',
        severity: 'error',
      });
    }
  };

  const handleDownloadErrors = async (importId: string) => {
    try {
      const blob = await dataManagementApi.downloadImportErrors(importId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_errors_${importId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to download errors',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Data Import
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Import data from CSV or Excel files with validation and error handling
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<UploadIcon />} label="Import Data" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="Import History" iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {!showWizard ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Start New Import
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Import data from CSV or Excel files with automatic column mapping and validation
            </Typography>

            <FormControl sx={{ minWidth: 300, mt: 3, mb: 3 }}>
              <InputLabel>Select Entity to Import</InputLabel>
              <Select
                value={entity}
                label="Select Entity to Import"
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

            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<UploadIcon />}
                onClick={handleStartImport}
              >
                Start Import Wizard
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 4, textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Import Process
              </Typography>
              <Typography variant="body2">
                1. Upload your CSV or Excel file
                <br />
                2. Map columns from your file to database fields
                <br />
                3. Review validation results and fix any errors
                <br />
                4. Confirm and complete the import
                <br />
                5. View import history and rollback if needed
              </Typography>
            </Alert>
          </Paper>
        ) : (
          <ImportWizard
            entity={entity}
            onComplete={handleImportComplete}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ImportHistoryList
          history={importHistory}
          onRollback={handleRollback}
          onDownloadErrors={handleDownloadErrors}
        />
      </TabPanel>

      <Dialog open={importing} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Importing Data...</Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we import your data
          </Typography>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{importResult?.success ? 'Import Completed' : 'Import Failed'}</DialogTitle>
        <DialogContent>
          {importResult?.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully imported {importResult.importedRows} rows
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              Import failed with errors
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Total Rows:</strong> {importResult?.importedRows || 0}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Successfully Imported:</strong> {importResult?.importedRows || 0}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Failed:</strong> {importResult?.failedRows || 0}
            </Typography>
            {importResult?.importId && (
              <Typography variant="body2" gutterBottom>
                <strong>Import ID:</strong> {importResult.importId}
              </Typography>
            )}
          </Box>

          {importResult?.errors && importResult.errors.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {importResult.errors.length} errors occurred during import
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
          {importResult?.success && (
            <Button variant="contained" onClick={() => setTabValue(1)}>
              View History
            </Button>
          )}
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
    </Box>
  );
}
