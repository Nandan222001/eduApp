import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { EventRSVP, EventRSVPWithUser } from '../../types/event';

interface RSVPTrackingProps {
  eventId: number | null;
}

const RSVPTracking: React.FC<RSVPTrackingProps> = ({ eventId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rsvpsData } = useQuery({
    queryKey: ['eventRSVPs', eventId],
    queryFn: () => (eventId ? eventsApi.listRSVPs(eventId) : Promise.resolve([])),
    enabled: !!eventId,
  });

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => (eventId ? eventsApi.getEvent(eventId) : Promise.resolve(null)),
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: Partial<EventRSVP> }) =>
      eventsApi.createRSVP(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventRSVPs'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      eventId,
      rsvpId,
      data,
    }: {
      eventId: number;
      rsvpId: number;
      data: Partial<EventRSVP>;
    }) => eventsApi.updateRSVP(eventId, rsvpId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventRSVPs'] });
    },
  });

  const handleSubmit = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventId) return;

    const formData = new FormData(formEvent.currentTarget);
    const data = {
      user_id: parseInt(formData.get('user_id') as string),
      status: formData.get('status'),
      number_of_guests: parseInt(formData.get('number_of_guests') as string) || 0,
      remarks: formData.get('remarks'),
    };

    createMutation.mutate({ eventId, data });
  };

  const handleStatusUpdate = (rsvpId: number, newStatus: string) => {
    if (!eventId) return;
    updateMutation.mutate({
      eventId,
      rsvpId,
      data: { status: newStatus },
    });
  };

  if (!eventId) {
    return (
      <Alert severity="info">
        Please select an event from the calendar to view and manage RSVPs
      </Alert>
    );
  }

  const acceptedCount =
    rsvpsData?.filter((r: EventRSVPWithUser) => r.status === 'accepted').length || 0;
  const declinedCount =
    rsvpsData?.filter((r: EventRSVPWithUser) => r.status === 'declined').length || 0;
  const totalGuests =
    rsvpsData?.reduce(
      (sum: number, r: EventRSVPWithUser) =>
        r.status === 'accepted' ? sum + (r.number_of_guests || 0) : sum,
      0
    ) || 0;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {eventData?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(eventData?.start_date).toLocaleDateString()} -{' '}
          {new Date(eventData?.end_date).toLocaleDateString()}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total RSVPs
              </Typography>
              <Typography variant="h4">{rsvpsData?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Accepted
              </Typography>
              <Typography variant="h4" color="success.main">
                {acceptedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Declined
              </Typography>
              <Typography variant="h4" color="error.main">
                {declinedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Guests
              </Typography>
              <Typography variant="h4">{totalGuests}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {eventData?.max_participants && (
        <Alert
          severity={acceptedCount + totalGuests >= eventData.max_participants ? 'warning' : 'info'}
          sx={{ mb: 3 }}
        >
          {acceptedCount + totalGuests} / {eventData.max_participants} participants (including
          guests)
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add RSVP
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Response Date</TableCell>
              <TableCell>Guests</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rsvpsData?.map((rsvp: EventRSVPWithUser) => (
              <TableRow key={rsvp.id}>
                <TableCell>{rsvp.user_name}</TableCell>
                <TableCell>{rsvp.user_email}</TableCell>
                <TableCell>
                  <Chip
                    label={rsvp.status}
                    color={
                      rsvp.status === 'accepted'
                        ? 'success'
                        : rsvp.status === 'declined'
                          ? 'error'
                          : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {rsvp.response_date ? new Date(rsvp.response_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>{rsvp.number_of_guests || 0}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {rsvp.remarks || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {rsvp.status !== 'accepted' && (
                      <Button
                        size="small"
                        color="success"
                        onClick={() => handleStatusUpdate(rsvp.id, 'accepted')}
                      >
                        Accept
                      </Button>
                    )}
                    {rsvp.status !== 'declined' && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleStatusUpdate(rsvp.id, 'declined')}
                      >
                        Decline
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add RSVP</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="User ID" name="user_id" type="number" required />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  defaultValue="pending"
                  required
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Number of Guests"
                  name="number_of_guests"
                  type="number"
                  defaultValue={0}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Remarks" name="remarks" multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Add RSVP
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RSVPTracking;
