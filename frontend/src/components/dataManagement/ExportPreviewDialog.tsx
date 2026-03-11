import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { ExportPreview } from '@/types/dataManagement';

interface ExportPreviewDialogProps {
  open: boolean;
  preview: ExportPreview | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ExportPreviewDialog({
  open,
  preview,
  loading,
  onClose,
  onConfirm,
}: ExportPreviewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Export Preview</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : preview ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Showing first {preview.rows.length} of {preview.totalCount} rows
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {preview.columns.map((column) => (
                      <TableCell key={column} sx={{ fontWeight: 600 }}>
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.rows.map((row, index) => (
                    <TableRow key={index} hover>
                      {preview.columns.map((column) => (
                        <TableCell key={column}>{String(row[column] ?? '')}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography>No preview available</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading || !preview}>
          Confirm & Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
