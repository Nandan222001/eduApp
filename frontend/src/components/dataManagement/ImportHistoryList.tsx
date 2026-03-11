import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import {
  Undo as RollbackIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { ImportHistory } from '@/types/dataManagement';
import { format } from 'date-fns';

interface ImportHistoryListProps {
  history: ImportHistory[];
  onRollback: (importId: string) => void;
  onDownloadErrors: (importId: string) => void;
}

export default function ImportHistoryList({
  history,
  onRollback,
  onDownloadErrors,
}: ImportHistoryListProps) {
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null);

  const handleRollbackClick = (importItem: ImportHistory) => {
    setSelectedImport(importItem);
    setRollbackDialogOpen(true);
  };

  const handleConfirmRollback = () => {
    if (selectedImport) {
      onRollback(selectedImport.id);
      setRollbackDialogOpen(false);
      setSelectedImport(null);
    }
  };

  const getStatusColor = (status: ImportHistory['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'rolled_back':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ImportHistory['status']) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'rolled_back':
        return <CancelIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Imported By</TableCell>
              <TableCell align="right">Total Rows</TableCell>
              <TableCell align="right">Success</TableCell>
              <TableCell align="right">Failed</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" py={4}>
                    No import history found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{format(new Date(item.importedAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Chip label={item.entity} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{item.filename}</TableCell>
                  <TableCell>{item.importedBy}</TableCell>
                  <TableCell align="right">{item.totalRows}</TableCell>
                  <TableCell align="right">
                    <Typography color="success.main" fontWeight={500}>
                      {item.successfulRows}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color="error.main" fontWeight={500}>
                      {item.failedRows}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(item.status)}
                      label={item.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(item.status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {item.canRollback && item.status === 'completed' && (
                        <Tooltip title="Rollback Import">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleRollbackClick(item)}
                          >
                            <RollbackIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {item.failedRows > 0 && (
                        <Tooltip title="Download Error Report">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onDownloadErrors(item.id)}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={rollbackDialogOpen} onClose={() => setRollbackDialogOpen(false)}>
        <DialogTitle>Confirm Rollback</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to rollback this import? This will remove all{' '}
            {selectedImport?.successfulRows} rows that were imported.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              <strong>Warning:</strong> This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRollback} color="warning" variant="contained">
            Rollback
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
