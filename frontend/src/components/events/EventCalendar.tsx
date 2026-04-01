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
  MenuItem,
  Typography,
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { Event, EventCalendarItem } from '../../types/event';

const EVENT_TYPES = ['academic', 'sports', 'cultural', 'holiday', 'meeting', 'other'];

interface EventCalendarProps {
  onSelectEvent?: (eventId: number) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ onSelectEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const queryClient = useQueryClient();

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: eventsData } = useQuery({
    queryKey: ['eventCalendar', startOfMonth, endOfMonth],
    queryFn: () =>
      eventsApi.getEventCalendar(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      ),
  });

  const createMutation = useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventCalendar'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) =>
      eventsApi.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventCalendar'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: eventsApi.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventCalendar'] });
    },
  });

  const handleOpen = (event?: Event) => {
    setEditingEvent(event || null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const data: Partial<Event> = {
      institution_id: 1,
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString() || undefined,
      event_type: formData.get('event_type')?.toString() || '',
      start_date: formData.get('start_date')?.toString() || '',
      end_date: formData.get('end_date')?.toString() || '',
      location: formData.get('location')?.toString() || undefined,
      venue: formData.get('venue')?.toString() || undefined,
      organizer: formData.get('organizer')?.toString() || undefined,
      contact_person: formData.get('contact_person')?.toString() || undefined,
      contact_email: formData.get('contact_email')?.toString() || undefined,
      contact_phone: formData.get('contact_phone')?.toString() || undefined,
      max_participants: formData.get('max_participants')
        ? parseInt(formData.get('max_participants')?.toString() || '0')
        : undefined,
      registration_required: formData.get('registration_required') === 'on',
      registration_deadline: formData.get('registration_deadline')?.toString() || undefined,
      is_public: formData.get('is_public') === 'on',
      allow_guests: formData.get('allow_guests') === 'on',
      status: formData.get('status')?.toString() || 'scheduled',
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data });
    } else {
      createMutation.mutate(data as Omit<Event, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return (
      eventsData?.filter((event: EventCalendarItem) => {
        const eventStart = new Date(event.start_date).toISOString().split('T')[0];
        const eventEnd = new Date(event.end_date).toISOString().split('T')[0];
        return dateStr >= eventStart && dateStr <= eventEnd;
      }) || []
    );
  };

  const getEventTypeColor = (type: string) => {
    const colors: {
      [key: string]: 'primary' | 'success' | 'secondary' | 'error' | 'info' | 'default';
    } = {
      academic: 'primary',
      sports: 'success',
      cultural: 'secondary',
      holiday: 'error',
      meeting: 'info',
      other: 'default',
    };
    return colors[type] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Event
        </Button>
      </Box>

      <Grid container spacing={1}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid item xs={12 / 7} key={day}>
            <Typography variant="subtitle2" align="center" sx={{ fontWeight: 'bold', py: 1 }}>
              {day}
            </Typography>
          </Grid>
        ))}
        {getDaysInMonth().map((day, index) => (
          <Grid item xs={12 / 7} key={index}>
            <Card
              variant="outlined"
              sx={{
                minHeight: 120,
                bgcolor: day ? 'background.paper' : 'action.disabledBackground',
                cursor: day ? 'pointer' : 'default',
              }}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                {day && (
                  <>
                    <Typography variant="body2" fontWeight="bold">
                      {day}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {getEventsForDay(day).map((event: EventCalendarItem) => (
                        <Chip
                          key={event.id}
                          label={event.title}
                          size="small"
                          color={getEventTypeColor(event.event_type)}
                          onClick={() => {
                            setEditingEvent(event as Event);
                            setDialogOpen(true);
                            if (onSelectEvent) onSelectEvent(event.id);
                          }}
                          sx={{ mb: 0.5, width: '100%' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingEvent ? 'Edit Event' : 'Add Event'}
            {editingEvent && (
              <IconButton
                onClick={() => handleDelete(editingEvent.id)}
                sx={{ position: 'absolute', right: 48, top: 8 }}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title"
                  name="title"
                  defaultValue={editingEvent?.title}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Event Type"
                  name="event_type"
                  defaultValue={editingEvent?.event_type || 'academic'}
                  required
                >
                  {EVENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  defaultValue={editingEvent?.status || 'scheduled'}
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  defaultValue={editingEvent?.start_date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="end_date"
                  type="date"
                  defaultValue={editingEvent?.end_date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  defaultValue={editingEvent?.location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Venue"
                  name="venue"
                  defaultValue={editingEvent?.venue}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  defaultValue={editingEvent?.description}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Organizer"
                  name="organizer"
                  defaultValue={editingEvent?.organizer}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  name="contact_person"
                  defaultValue={editingEvent?.contact_person}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contact_email"
                  type="email"
                  defaultValue={editingEvent?.contact_email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="contact_phone"
                  defaultValue={editingEvent?.contact_phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Participants"
                  name="max_participants"
                  type="number"
                  defaultValue={editingEvent?.max_participants}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Registration Deadline"
                  name="registration_deadline"
                  type="date"
                  defaultValue={editingEvent?.registration_deadline}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="registration_required"
                      defaultChecked={editingEvent?.registration_required}
                    />
                  }
                  label="Registration Required"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox name="is_public" defaultChecked={editingEvent?.is_public ?? true} />
                  }
                  label="Public Event"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox name="allow_guests" defaultChecked={editingEvent?.allow_guests} />
                  }
                  label="Allow Guests"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EventCalendar;
