import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Paper,
  IconButton,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface ExamSchedule {
  id: number;
  exam_id: number;
  subject_id: number;
  subject_name: string;
  section_id?: number;
  section_name?: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  invigilator_name?: string;
}

export default function ExamScheduleManager() {
  const [schedules] = useState<ExamSchedule[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(0);
  const [formData, setFormData] = useState({
    subject_id: 0,
    section_id: 0,
    exam_date: '',
    start_time: '',
    end_time: '',
    room_number: '',
    invigilator_id: 0,
  });

  const handleOpenDialog = () => {
    setFormData({
      subject_id: 0,
      section_id: 0,
      exam_date: '',
      start_time: '',
      end_time: '',
      room_number: '',
      invigilator_id: 0,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  const groupByDate = () => {
    const grouped: Record<string, ExamSchedule[]> = {};
    schedules.forEach((schedule) => {
      if (!grouped[schedule.exam_date]) {
        grouped[schedule.exam_date] = [];
      }
      grouped[schedule.exam_date].push(schedule);
    });
    return grouped;
  };

  const schedulesByDate = groupByDate();
  const dates = Object.keys(schedulesByDate).sort();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6">Exam Schedule</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage exam schedules with calendar view
          </Typography>
        </Box>
        <Box>
          <TextField
            select
            size="small"
            value={selectedExam}
            onChange={(e) => setSelectedExam(Number(e.target.value))}
            sx={{ minWidth: 200, mr: 2 }}
            label="Select Exam"
            SelectProps={{ native: true }}
          >
            <option value={0}>Select an exam</option>
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={!selectedExam}
          >
            Add Schedule
          </Button>
        </Box>
      </Box>

      {selectedExam ? (
        <Grid container spacing={2}>
          {dates.length > 0 ? (
            dates.map((date) => (
              <Grid item xs={12} md={6} lg={4} key={date}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    {schedulesByDate[date].map((schedule) => (
                      <Paper key={schedule.id} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {schedule.subject_name}
                          </Typography>
                          <Box>
                            <IconButton size="small" sx={{ mr: 0.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {schedule.start_time} - {schedule.end_time}
                          </Typography>
                        </Box>
                        {schedule.section_name && (
                          <Chip label={schedule.section_name} size="small" sx={{ mr: 0.5 }} />
                        )}
                        {schedule.room_number && (
                          <Chip
                            label={`Room ${schedule.room_number}`}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                        )}
                        {schedule.invigilator_name && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Invigilator: {schedule.invigilator_name}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No schedules configured
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click &apos;Add Schedule&apos; to create exam schedules
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select an exam
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose an exam to view and manage its schedule
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Exam Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Subject"
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value={0}>Select a subject</option>
            </TextField>
            <TextField
              fullWidth
              select
              label="Section (Optional)"
              value={formData.section_id}
              onChange={(e) => setFormData({ ...formData, section_id: Number(e.target.value) })}
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value={0}>All sections</option>
            </TextField>
            <TextField
              fullWidth
              label="Exam Date"
              type="date"
              value={formData.exam_date}
              onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Room Number (Optional)"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Invigilator (Optional)"
              value={formData.invigilator_id}
              onChange={(e) => setFormData({ ...formData, invigilator_id: Number(e.target.value) })}
              SelectProps={{ native: true }}
            >
              <option value={0}>Select a teacher</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
