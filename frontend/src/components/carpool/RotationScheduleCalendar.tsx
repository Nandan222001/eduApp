import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Edit, CheckCircle } from '@mui/icons-material';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';

interface RotationScheduleCalendarProps {
  groupId: number;
}

interface DaySchedule {
  date: string;
  day: string;
  morningDriver: string;
  afternoonDriver: string;
  status: string;
}

const mockDrivers = [
  { id: 1, name: 'Sarah Johnson' },
  { id: 2, name: 'Michael Chen' },
  { id: 3, name: 'Jessica Martinez' },
  { id: 4, name: 'David Wilson' },
];

const mockSchedule: DaySchedule[] = [
  {
    date: '2024-03-18',
    day: 'Monday',
    morningDriver: 'Sarah Johnson',
    afternoonDriver: 'Michael Chen',
    status: 'confirmed',
  },
  {
    date: '2024-03-19',
    day: 'Tuesday',
    morningDriver: 'Michael Chen',
    afternoonDriver: 'Jessica Martinez',
    status: 'confirmed',
  },
  {
    date: '2024-03-20',
    day: 'Wednesday',
    morningDriver: 'Jessica Martinez',
    afternoonDriver: 'David Wilson',
    status: 'scheduled',
  },
  {
    date: '2024-03-21',
    day: 'Thursday',
    morningDriver: 'David Wilson',
    afternoonDriver: 'Sarah Johnson',
    status: 'scheduled',
  },
  {
    date: '2024-03-22',
    day: 'Friday',
    morningDriver: 'Sarah Johnson',
    afternoonDriver: 'Michael Chen',
    status: 'scheduled',
  },
];

const RotationScheduleCalendar: React.FC<RotationScheduleCalendarProps> = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [morningDriverId, setMorningDriverId] = useState('');
  const [afternoonDriverId, setAfternoonDriverId] = useState('');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleEditDay = (day: DaySchedule) => {
    setSelectedDay(day);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setEditDialogOpen(false);
    setSelectedDay(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePreviousWeek}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6">Week of {format(weekStart, 'MMM dd, yyyy')}</Typography>
          <IconButton onClick={handleNextWeek}>
            <ChevronRight />
          </IconButton>
        </Box>
        <Button variant="outlined" size="small">
          Auto-Assign Drivers
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mockSchedule.map((day, index) => {
          const dayDate = addDays(weekStart, index);
          return (
            <Paper key={day.date} sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {day.day}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(dayDate, 'MMMM dd, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={day.status}
                    color={getStatusColor(day.status) as 'success' | 'info' | 'warning' | 'default'}
                    size="small"
                    icon={day.status === 'confirmed' ? <CheckCircle /> : undefined}
                  />
                  <IconButton size="small" onClick={() => handleEditDay(day)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Morning Driver
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>{day.morningDriver.charAt(0)}</Avatar>
                    <Typography variant="body2">{day.morningDriver}</Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Afternoon Driver
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>{day.afternoonDriver.charAt(0)}</Avatar>
                    <Typography variant="body2">{day.afternoonDriver}</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Alert severity="info" sx={{ mt: 3 }}>
        Notifications are sent automatically to drivers 24 hours before their scheduled ride.
      </Alert>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Driver Assignment</DialogTitle>
        <DialogContent>
          {selectedDay && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {selectedDay.day} - {selectedDay.date}
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Morning Driver</InputLabel>
                <Select
                  value={morningDriverId}
                  onChange={(e) => setMorningDriverId(e.target.value)}
                  label="Morning Driver"
                >
                  {mockDrivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Afternoon Driver</InputLabel>
                <Select
                  value={afternoonDriverId}
                  onChange={(e) => setAfternoonDriverId(e.target.value)}
                  label="Afternoon Driver"
                >
                  {mockDrivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RotationScheduleCalendar;
