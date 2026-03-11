import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { ScheduledExportConfig, TableEntity, ExportFormat } from '@/types/dataManagement';

interface ScheduledExportDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: Omit<ScheduledExportConfig, 'id'>) => void;
}

export default function ScheduledExportDialog({
  open,
  onClose,
  onSave,
}: ScheduledExportDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    entity: 'students' as TableEntity,
    format: 'csv' as ExportFormat,
    schedule: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    email: '',
  });

  const handleSubmit = () => {
    onSave({
      ...formData,
      columns: [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule Export</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Export Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Entity</InputLabel>
            <Select
              value={formData.entity}
              label="Entity"
              onChange={(e) => setFormData({ ...formData, entity: e.target.value as TableEntity })}
            >
              <MenuItem value="students">Students</MenuItem>
              <MenuItem value="teachers">Teachers</MenuItem>
              <MenuItem value="attendance">Attendance</MenuItem>
              <MenuItem value="examinations">Examinations</MenuItem>
              <MenuItem value="assignments">Assignments</MenuItem>
              <MenuItem value="grades">Grades</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              value={formData.format}
              label="Format"
              onChange={(e) => setFormData({ ...formData, format: e.target.value as ExportFormat })}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Schedule</InputLabel>
            <Select
              value={formData.schedule}
              label="Schedule"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  schedule: e.target.value as 'daily' | 'weekly' | 'monthly',
                })
              }
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Time"
            type="time"
            fullWidth
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
