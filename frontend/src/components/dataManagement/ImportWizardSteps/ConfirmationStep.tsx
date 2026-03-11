import { Box, Typography, Alert, Paper, Grid, Button, Divider } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { TableEntity, ImportValidationResult } from '@/types/dataManagement';

interface ConfirmationStepProps {
  entity: TableEntity;
  file: File;
  validationResult: ImportValidationResult;
  onConfirm: () => void;
}

export default function ConfirmationStep({
  entity,
  file,
  validationResult,
  onConfirm,
}: ConfirmationStepProps) {
  const hasWarnings = validationResult.warnings.length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm Import
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Review the import details and confirm to proceed
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Entity
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {entity.charAt(0).toUpperCase() + entity.slice(1)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              File
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {file.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Total Rows
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {validationResult.totalRows}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Valid Rows
            </Typography>
            <Typography variant="body1" fontWeight={500} color="success.main">
              {validationResult.validRows}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {hasWarnings && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight={500} gutterBottom>
            This import has {validationResult.warnings.length} warning(s)
          </Typography>
          <Typography variant="body2">
            The data will be imported, but you should review the warnings to ensure data quality.
          </Typography>
        </Alert>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2" fontWeight={500} gutterBottom>
          Import Process
        </Typography>
        <Typography variant="body2">
          • All valid rows will be imported into the {entity} table
          <br />
          • You can rollback this import within 24 hours if needed
          <br />• An import history record will be created for tracking
        </Typography>
      </Alert>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" size="large" onClick={onConfirm} color="primary">
          Confirm & Import {validationResult.validRows} Rows
        </Button>
      </Box>
    </Box>
  );
}
