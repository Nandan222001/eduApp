import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Button,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi } from '../../api/timetable';
import { TimetableEntry, TimetableEntryWithDetails } from '../../types/timetable';

interface TimetableGridProps {
  timetableId: number | null;
  gradeId: number | null;
  sectionId: number | null;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const TimetableGrid: React.FC<TimetableGridProps> = ({ timetableId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntryWithDetails | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; period: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: entriesData } = useQuery({
    queryKey: ['timetableEntries', timetableId],
    queryFn: () =>
      timetableId ? timetableApi.getTimetableEntries(timetableId) : Promise.resolve([]),
    enabled: !!timetableId,
  });

  const createMutation = useMutation({
    mutationFn: ({ timetableId, data }: { timetableId: number; data: Partial<TimetableEntry> }) =>
      timetableApi.createEntry(timetableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      timetableId,
      entryId,
      data,
    }: {
      timetableId: number;
      entryId: number;
      data: Partial<TimetableEntry>;
    }) => timetableApi.updateEntry(timetableId, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ timetableId, entryId }: { timetableId: number; entryId: number }) =>
      timetableApi.deleteEntry(timetableId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableEntries'] });
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
    },
  });

  const handleOpen = (day: string, period: number, entry?: TimetableEntryWithDetails) => {
    setSelectedSlot({ day, period });
    setEditingEntry(entry || null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    setSelectedSlot(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!timetableId || !selectedSlot) return;

    const formData = new FormData(event.currentTarget);
    const teacherIdValue = formData.get('teacher_id');
    const roomNumberValue = formData.get('room_number');
    const remarksValue = formData.get('remarks');

    const data = {
      subject_id: parseInt(formData.get('subject_id') as string),
      teacher_id:
        teacherIdValue && teacherIdValue !== '' ? parseInt(teacherIdValue as string) : undefined,
      day_of_week: selectedSlot.day,
      period_number: selectedSlot.period,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      period_type: (formData.get('period_type') as string) || 'lecture',
      room_number:
        roomNumberValue && roomNumberValue !== '' ? (roomNumberValue as string) : undefined,
      remarks: remarksValue && remarksValue !== '' ? (remarksValue as string) : undefined,
      is_active: true,
    };

    if (editingEntry) {
      updateMutation.mutate({ timetableId, entryId: editingEntry.id, data });
    } else {
      createMutation.mutate({ timetableId, data });
    }
  };

  const handleDelete = (entryId: number) => {
    if (!timetableId) return;
    if (confirm('Are you sure you want to delete this timetable entry?')) {
      deleteMutation.mutate({ timetableId, entryId });
    }
  };

  const getEntryForSlot = (day: string, period: number) => {
    return entriesData?.find(
      (entry: TimetableEntryWithDetails) =>
        entry.day_of_week === day && entry.period_number === period
    );
  };

  const getPeriodTypeColor = (type: string) => {
    const colors: { [key: string]: 'primary' | 'success' | 'default' | 'warning' | 'secondary' } = {
      lecture: 'primary',
      practical: 'success',
      break: 'default',
      lunch: 'warning',
      activity: 'secondary',
    };
    return colors[type] || 'default';
  };

  if (!timetableId) {
    return (
      <Alert severity="info">
        Please select a grade, section, and timetable to view the schedule
      </Alert>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                Day / Period
              </TableCell>
              {PERIODS.map((period) => (
                <TableCell
                  key={period}
                  align="center"
                  sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}
                >
                  Period {period}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {DAYS_OF_WEEK.map((day) => (
              <TableRow key={day}>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>{day}</TableCell>
                {PERIODS.map((period) => {
                  const entry = getEntryForSlot(day, period);
                  return (
                    <TableCell
                      key={`${day}-${period}`}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        bgcolor: entry ? 'background.paper' : 'grey.50',
                        '&:hover': {
                          bgcolor: entry ? 'action.hover' : 'grey.100',
                        },
                        position: 'relative',
                        minHeight: 80,
                      }}
                      onClick={() => !entry && handleOpen(day, period)}
                    >
                      {entry ? (
                        <Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <DragIcon
                              sx={{ fontSize: 16, color: 'text.disabled', cursor: 'move' }}
                            />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpen(day, period, entry);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(entry.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {entry.subject_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {entry.teacher_name || 'No teacher'}
                          </Typography>
                          {entry.room_number && (
                            <Typography variant="caption" display="block" noWrap>
                              Room: {entry.room_number}
                            </Typography>
                          )}
                          <Chip
                            label={entry.period_type}
                            size="small"
                            color={getPeriodTypeColor(entry.period_type)}
                            sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                          />
                          {entry.is_substitution && (
                            <Chip
                              label="Substitution"
                              size="small"
                              color="warning"
                              sx={{ mt: 0.5, ml: 0.5, height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: 60,
                          }}
                        >
                          <IconButton size="small">
                            <AddIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingEntry ? 'Edit' : 'Add'} Timetable Entry
            {selectedSlot && (
              <Typography variant="body2" color="text.secondary">
                {selectedSlot.day} - Period {selectedSlot.period}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject ID"
                  name="subject_id"
                  type="number"
                  defaultValue={editingEntry?.subject_id}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teacher ID"
                  name="teacher_id"
                  type="number"
                  defaultValue={editingEntry?.teacher_id}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  name="start_time"
                  type="time"
                  defaultValue={editingEntry?.start_time}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  name="end_time"
                  type="time"
                  defaultValue={editingEntry?.end_time}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Period Type"
                  name="period_type"
                  defaultValue={editingEntry?.period_type || 'lecture'}
                >
                  <MenuItem value="lecture">Lecture</MenuItem>
                  <MenuItem value="practical">Practical</MenuItem>
                  <MenuItem value="break">Break</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room Number"
                  name="room_number"
                  defaultValue={editingEntry?.room_number}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  multiline
                  rows={2}
                  defaultValue={editingEntry?.remarks}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingEntry ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TimetableGrid;
