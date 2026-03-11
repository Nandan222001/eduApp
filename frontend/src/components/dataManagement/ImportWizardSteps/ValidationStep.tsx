import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { TableEntity, ColumnMapping, ImportValidationResult } from '@/types/dataManagement';
import dataManagementApi from '@/api/dataManagement';

interface ValidationStepProps {
  entity: TableEntity;
  file: File;
  columnMappings: ColumnMapping[];
  skipFirstRow: boolean;
  onValidated: (result: ImportValidationResult) => void;
}

export default function ValidationStep({
  entity,
  file,
  columnMappings,
  skipFirstRow,
  onValidated,
}: ValidationStepProps) {
  const [loading, setLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    validateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateData = async () => {
    try {
      setLoading(true);
      const result = await dataManagementApi.validateImport({
        entity,
        file,
        columnMappings,
        skipFirstRow,
        validateOnly: true,
      });
      setValidationResult(result);
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validationResult) {
      onValidated(validationResult);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Validating data...</Typography>
      </Box>
    );
  }

  if (!validationResult) {
    return <Alert severity="error">Failed to validate data. Please try again.</Alert>;
  }

  const { errors, warnings, validRows, totalRows } = validationResult;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Validation Results
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Rows
          </Typography>
          <Typography variant="h4">{totalRows}</Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Valid Rows
          </Typography>
          <Typography variant="h4" color="success.main">
            {validRows}
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Errors
          </Typography>
          <Typography variant="h4" color="error.main">
            {errors.length}
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Warnings
          </Typography>
          <Typography variant="h4" color="warning.main">
            {warnings.length}
          </Typography>
        </Paper>
      </Box>

      {!hasErrors && !hasWarnings && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
          All data validated successfully! Ready to import {validRows} rows.
        </Alert>
      )}

      {hasErrors && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Found {errors.length} error(s). Please fix the errors before importing.
        </Alert>
      )}

      {(hasErrors || hasWarnings) && (
        <>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
            {hasErrors && <Tab label={`Errors (${errors.length})`} />}
            {hasWarnings && <Tab label={`Warnings (${warnings.length})`} />}
            <Tab label={`Preview (${validationResult.preview.length})`} />
          </Tabs>

          {tabValue === 0 && hasErrors && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Column</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>{error.column}</TableCell>
                      <TableCell>
                        <code>{error.value}</code>
                      </TableCell>
                      <TableCell>
                        <Chip icon={<ErrorIcon />} label={error.error} color="error" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {((tabValue === 1 && hasWarnings && hasErrors) ||
            (tabValue === 0 && hasWarnings && !hasErrors)) && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Column</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Warning</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warnings.map((warning, index) => (
                    <TableRow key={index}>
                      <TableCell>{warning.row}</TableCell>
                      <TableCell>{warning.column}</TableCell>
                      <TableCell>
                        <code>{warning.value}</code>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<WarningIcon />}
                          label={warning.error}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {((hasErrors && hasWarnings && tabValue === 2) ||
            (hasErrors && !hasWarnings && tabValue === 1) ||
            (!hasErrors && hasWarnings && tabValue === 1) ||
            (!hasErrors && !hasWarnings && tabValue === 0)) && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {validationResult.preview.length > 0 &&
                      Object.keys(validationResult.preview[0]).map((key) => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationResult.preview.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={validateData} sx={{ mr: 2 }}>
          Re-validate
        </Button>
        <Button variant="contained" onClick={handleNext} disabled={hasErrors}>
          Next: Confirm Import
        </Button>
      </Box>
    </Box>
  );
}
