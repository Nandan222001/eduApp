import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import { Check as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import { TableEntity } from '@/types/dataManagement';
import dataManagementApi from '@/api/dataManagement';

interface ColumnMappingStepProps {
  entity: TableEntity;
  detectedColumns: string[];
  columnMappings: Record<string, string>;
  skipFirstRow: boolean;
  onNext: (mappings: Record<string, string>, skipFirstRow: boolean) => void;
}

export default function ColumnMappingStep({
  entity,
  detectedColumns,
  columnMappings: initialMappings,
  skipFirstRow: initialSkipFirstRow,
  onNext,
}: ColumnMappingStepProps) {
  const [targetColumns, setTargetColumns] = useState<
    Array<{ id: string; label: string; required?: boolean }>
  >([]);
  const [mappings, setMappings] = useState<Record<string, string>>(initialMappings);
  const [skipFirstRow, setSkipFirstRow] = useState(initialSkipFirstRow);

  useEffect(() => {
    fetchEntityMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  useEffect(() => {
    if (
      Object.keys(mappings).length === 0 &&
      detectedColumns.length > 0 &&
      targetColumns.length > 0
    ) {
      autoDetectMappings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedColumns, targetColumns]);

  const fetchEntityMetadata = async () => {
    try {
      const metadata = await dataManagementApi.getEntityMetadata(entity);
      if (metadata.length > 0) {
        setTargetColumns(
          metadata[0].columns.map((col) => ({
            id: col.id,
            label: col.label,
            required: col.required,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch entity metadata:', err);
    }
  };

  const autoDetectMappings = () => {
    const autoMappings: Record<string, string> = {};

    detectedColumns.forEach((sourceCol) => {
      const normalizedSource = sourceCol.toLowerCase().replace(/[_\s]/g, '');
      const match = targetColumns.find(
        (targetCol) =>
          targetCol.id.toLowerCase().replace(/[_\s]/g, '') === normalizedSource ||
          targetCol.label.toLowerCase().replace(/[_\s]/g, '') === normalizedSource
      );
      if (match) {
        autoMappings[sourceCol] = match.id;
      }
    });

    setMappings(autoMappings);
  };

  const handleMappingChange = (sourceColumn: string, targetColumn: string) => {
    setMappings({
      ...mappings,
      [sourceColumn]: targetColumn,
    });
  };

  const handleNext = () => {
    onNext(mappings, skipFirstRow);
  };

  const getMappedSourceColumns = () => Object.values(mappings);

  const getUnmappedRequiredColumns = () => {
    const mappedTargets = Object.values(mappings);
    return targetColumns.filter((col) => col.required && !mappedTargets.includes(col.id));
  };

  const canProceed = getUnmappedRequiredColumns().length === 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Map Columns
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Map columns from your file to the target fields
      </Typography>

      <FormControlLabel
        control={
          <Checkbox checked={skipFirstRow} onChange={(e) => setSkipFirstRow(e.target.checked)} />
        }
        label="First row contains column headers"
        sx={{ mt: 2, mb: 3 }}
      />

      <Grid container spacing={2}>
        {detectedColumns.map((sourceColumn) => {
          const targetColumn = mappings[sourceColumn];
          const targetInfo = targetColumns.find((col) => col.id === targetColumn);
          const isMapped = !!targetColumn;

          return (
            <Grid item xs={12} key={sourceColumn}>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {sourceColumn}
                      </Typography>
                      <Chip label="Source" size="small" color="primary" variant="outlined" />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography align="center" color="text.secondary">
                      →
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Target Field</InputLabel>
                      <Select
                        value={targetColumn || ''}
                        label="Target Field"
                        onChange={(e) => handleMappingChange(sourceColumn, e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Skip this column</em>
                        </MenuItem>
                        {targetColumns.map((col) => (
                          <MenuItem
                            key={col.id}
                            value={col.id}
                            disabled={
                              getMappedSourceColumns().includes(col.id) &&
                              mappings[sourceColumn] !== col.id
                            }
                          >
                            {col.label}
                            {col.required && (
                              <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                {isMapped && targetInfo && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">
                      Mapped to {targetInfo.label}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {!canProceed && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight={500} gutterBottom>
            Missing required fields:
          </Typography>
          {getUnmappedRequiredColumns().map((col) => (
            <Chip
              key={col.id}
              label={col.label}
              size="small"
              color="warning"
              icon={<ErrorIcon />}
              sx={{ mr: 1, mb: 0.5 }}
            />
          ))}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" onClick={handleNext} disabled={!canProceed}>
          Next: Validate Data
        </Button>
      </Box>
    </Box>
  );
}
