import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';

interface Period {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  display_order: number;
  is_break: boolean;
}

interface TimetableEntry {
  id?: number;
  section_id: number;
  period_id: number;
  subject_id: number;
  subject_name?: string;
  teacher_id?: number;
  teacher_name?: string;
  day_of_week: string;
  room_number?: string;
}

interface Conflict {
  type: string;
  message: string;
  period_id?: number;
  teacher_id?: number;
  day_of_week?: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export default function TimetableBuilder() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [conflicts] = useState<Conflict[]>([]);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [draggedPeriod, setDraggedPeriod] = useState<Period | null>(null);
  const [draggedEntry, setDraggedEntry] = useState<{ entry: TimetableEntry; day: string } | null>(
    null
  );

  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    is_break: false,
  });

  const [entryFormData, setEntryFormData] = useState({
    period_id: 0,
    subject_id: 0,
    teacher_id: 0,
    day_of_week: 'monday',
    room_number: '',
  });

  const handlePeriodDragStart = (period: Period) => {
    setDraggedPeriod(period);
  };

  const handlePeriodDragOver = (e: React.DragEvent, targetPeriod: Period) => {
    e.preventDefault();
    if (!draggedPeriod || draggedPeriod.id === targetPeriod.id) return;

    const newPeriods = [...periods];
    const draggedIdx = newPeriods.findIndex((p) => p.id === draggedPeriod.id);
    const targetIdx = newPeriods.findIndex((p) => p.id === targetPeriod.id);

    newPeriods.splice(draggedIdx, 1);
    newPeriods.splice(targetIdx, 0, draggedPeriod);

    newPeriods.forEach((period, index) => {
      period.display_order = index;
    });

    setPeriods(newPeriods);
  };

  const handlePeriodDrop = () => {
    setDraggedPeriod(null);
  };

  const handleEntryDragStart = (entry: TimetableEntry, day: string) => {
    setDraggedEntry({ entry, day });
  };

  const handleEntryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleEntryDrop = (targetPeriodId: number, targetDay: string) => {
    if (!draggedEntry) return;

    const newEntries = entries.map((e) => {
      if (e.id === draggedEntry.entry.id) {
        return {
          ...e,
          period_id: targetPeriodId,
          day_of_week: targetDay,
        };
      }
      return e;
    });

    setEntries(newEntries);
    setDraggedEntry(null);
  };

  const handleOpenPeriodDialog = () => {
    setPeriodFormData({
      name: '',
      start_time: '',
      end_time: '',
      is_break: false,
    });
    setPeriodDialogOpen(true);
  };

  const handleOpenEntryDialog = (periodId: number, day: string) => {
    setEntryFormData({
      period_id: periodId,
      subject_id: 0,
      teacher_id: 0,
      day_of_week: day,
      room_number: '',
    });
    setEntryDialogOpen(true);
  };

  const handleSavePeriod = () => {
    setPeriodDialogOpen(false);
  };

  const handleSaveEntry = () => {
    setEntryDialogOpen(false);
  };

  const getEntry = (periodId: number, day: string) => {
    return entries.find(
      (e) => e.period_id === periodId && e.day_of_week === day && e.section_id === selectedSection
    );
  };

  const hasConflict = (periodId: number, day: string) => {
    return conflicts.some((c) => c.period_id === periodId && c.day_of_week === day);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Periods</Typography>
              <IconButton size="small" onClick={handleOpenPeriodDialog}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Drag to reorder periods
            </Typography>
            <List dense>
              {periods.map((period) => (
                <ListItem
                  key={period.id}
                  draggable
                  onDragStart={() => handlePeriodDragStart(period)}
                  onDragOver={(e) => handlePeriodDragOver(e, period)}
                  onDragEnd={handlePeriodDrop}
                  sx={{
                    cursor: 'move',
                    bgcolor: draggedPeriod?.id === period.id ? 'action.selected' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                    mb: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <DragIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <ListItemText
                    primary={period.name}
                    secondary={`${period.start_time} - ${period.end_time}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  {period.is_break && <Chip label="Break" size="small" sx={{ mr: 1 }} />}
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>

          {conflicts.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
              <Typography variant="caption" fontWeight="bold">
                {conflicts.length} Conflict(s) Detected
              </Typography>
              {conflicts.slice(0, 3).map((c, i) => (
                <Typography key={i} variant="caption" display="block">
                  • {c.message}
                </Typography>
              ))}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Timetable</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(Number(e.target.value))}
                label="Select Section"
              >
                <MenuItem value={0}>Select a section</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {selectedSection ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Period</TableCell>
                    {DAYS.map((day) => (
                      <TableCell key={day} align="center" sx={{ fontWeight: 'bold' }}>
                        {DAY_LABELS[day]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell sx={{ bgcolor: period.is_break ? 'grey.100' : 'inherit' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {period.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {period.start_time} - {period.end_time}
                        </Typography>
                      </TableCell>
                      {DAYS.map((day) => {
                        const entry = getEntry(period.id, day);
                        const conflict = hasConflict(period.id, day);
                        return (
                          <TableCell
                            key={day}
                            align="center"
                            onDragOver={handleEntryDragOver}
                            onDrop={() => handleEntryDrop(period.id, day)}
                            sx={{
                              bgcolor: period.is_break ? 'grey.50' : 'inherit',
                              borderLeft: 1,
                              borderColor: 'divider',
                              cursor: !period.is_break ? 'pointer' : 'default',
                              '&:hover': !period.is_break ? { bgcolor: 'action.hover' } : {},
                            }}
                            onClick={() =>
                              !period.is_break && handleOpenEntryDialog(period.id, day)
                            }
                          >
                            {period.is_break ? (
                              <Chip label="Break" size="small" />
                            ) : entry ? (
                              <Box
                                draggable
                                onDragStart={() => handleEntryDragStart(entry, day)}
                                sx={{
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: conflict ? 'error.light' : 'primary.light',
                                  cursor: 'move',
                                }}
                              >
                                <Typography variant="caption" fontWeight="bold" display="block">
                                  {entry.subject_name}
                                </Typography>
                                {entry.teacher_name && (
                                  <Typography
                                    variant="caption"
                                    display="block"
                                    sx={{ opacity: 0.8 }}
                                  >
                                    {entry.teacher_name}
                                  </Typography>
                                )}
                                {entry.room_number && (
                                  <Typography
                                    variant="caption"
                                    display="block"
                                    sx={{ opacity: 0.8 }}
                                  >
                                    Room {entry.room_number}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <IconButton size="small" sx={{ opacity: 0.3 }}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a section
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a section to build or edit its timetable
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={periodDialogOpen}
        onClose={() => setPeriodDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Period</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Period Name"
              value={periodFormData.name}
              onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
              placeholder="e.g., Period 1, Morning Assembly"
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={periodFormData.start_time}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, start_time: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={periodFormData.end_time}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, end_time: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Period Type</InputLabel>
              <Select
                value={periodFormData.is_break ? 'break' : 'class'}
                onChange={(e) =>
                  setPeriodFormData({ ...periodFormData, is_break: e.target.value === 'break' })
                }
                label="Period Type"
              >
                <MenuItem value="class">Class Period</MenuItem>
                <MenuItem value="break">Break</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePeriod}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={entryDialogOpen}
        onClose={() => setEntryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Subject</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Subject"
              value={entryFormData.subject_id}
              onChange={(e) =>
                setEntryFormData({ ...entryFormData, subject_id: Number(e.target.value) })
              }
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value={0}>Select a subject</option>
            </TextField>
            <TextField
              fullWidth
              select
              label="Teacher (Optional)"
              value={entryFormData.teacher_id}
              onChange={(e) =>
                setEntryFormData({ ...entryFormData, teacher_id: Number(e.target.value) })
              }
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value={0}>Select a teacher</option>
            </TextField>
            <TextField
              fullWidth
              label="Room Number (Optional)"
              value={entryFormData.room_number}
              onChange={(e) => setEntryFormData({ ...entryFormData, room_number: e.target.value })}
              placeholder="e.g., Room 101"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEntry}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
