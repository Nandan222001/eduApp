import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Notifications,
  LocationOn,
  Warning,
  PlayArrow,
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { RideConfirmation } from '@/types/carpool';

const mockUpcomingRides: RideConfirmation[] = [
  {
    id: 1,
    carpool_group_id: 1,
    date: addDays(new Date(), 1).toISOString().split('T')[0],
    ride_type: 'morning',
    driver_id: 1,
    driver_name: 'Sarah Johnson',
    status: 'confirmed',
    passengers: [
      {
        member_id: 2,
        child_id: 203,
        child_name: 'Sophie Chen',
        pickup_point_id: 1,
        pickup_time: '07:30 AM',
        check_in_status: 'pending',
        parent_notified: true,
      },
      {
        member_id: 3,
        child_id: 204,
        child_name: 'Alex Martinez',
        pickup_point_id: 2,
        pickup_time: '07:40 AM',
        check_in_status: 'pending',
        parent_notified: true,
      },
    ],
    scheduled_time: '07:30 AM',
    notifications_sent: true,
  },
  {
    id: 2,
    carpool_group_id: 1,
    date: new Date().toISOString().split('T')[0],
    ride_type: 'afternoon',
    driver_id: 2,
    driver_name: 'Michael Chen',
    status: 'in_progress',
    passengers: [
      {
        member_id: 1,
        child_id: 201,
        child_name: 'Emma Johnson',
        pickup_point_id: 3,
        pickup_time: '03:30 PM',
        check_in_status: 'picked_up',
        check_in_time: '03:32 PM',
        parent_notified: true,
      },
      {
        member_id: 3,
        child_id: 204,
        child_name: 'Alex Martinez',
        pickup_point_id: 3,
        pickup_time: '03:30 PM',
        check_in_status: 'picked_up',
        check_in_time: '03:32 PM',
        parent_notified: true,
      },
    ],
    scheduled_time: '03:30 PM',
    actual_start_time: '03:32 PM',
    notifications_sent: true,
  },
];

const RideConfirmationSystem: React.FC = () => {
  const [rides, setRides] = useState<RideConfirmation[]>(mockUpcomingRides);
  const [lateDialogOpen, setLateDialogOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState('');
  const [lateReason, setLateReason] = useState('');

  const currentUserId = 1;

  const handleCheckIn = (
    rideId: number,
    passengerId: number,
    type: 'picked_up' | 'dropped_off'
  ) => {
    setRides(
      rides.map((ride) => {
        if (ride.id === rideId) {
          return {
            ...ride,
            passengers: ride.passengers.map((p) =>
              p.member_id === passengerId
                ? {
                    ...p,
                    check_in_status: type,
                    check_in_time: format(new Date(), 'hh:mm a'),
                    parent_notified: true,
                  }
                : p
            ),
          };
        }
        return ride;
      })
    );
  };

  const handleStartRide = (rideId: number) => {
    setRides(
      rides.map((ride) =>
        ride.id === rideId
          ? {
              ...ride,
              status: 'in_progress',
              actual_start_time: format(new Date(), 'hh:mm a'),
            }
          : ride
      )
    );
  };

  const handleReportLate = () => {
    setLateDialogOpen(true);
  };

  const handleReportAbsence = () => {
    setAbsenceDialogOpen(true);
  };

  const submitLateNotification = () => {
    setLateDialogOpen(false);
    setDelayMinutes('');
    setLateReason('');
  };

  const submitAbsenceNotification = () => {
    setAbsenceDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getCheckInIcon = (status: string) => {
    switch (status) {
      case 'picked_up':
      case 'dropped_off':
        return <CheckCircle color="success" />;
      case 'absent':
        return <Cancel color="error" />;
      default:
        return <Schedule color="action" />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ride Confirmations
      </Typography>

      <Alert severity="info" icon={<Notifications />} sx={{ mb: 3 }}>
        Drivers receive automatic notifications 24 hours before their scheduled ride
      </Alert>

      <Grid container spacing={3}>
        {rides.map((ride) => {
          const isDriver = ride.driver_id === currentUserId;
          const rideDate = new Date(ride.date);

          return (
            <Grid item xs={12} key={ride.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {ride.ride_type === 'morning' ? 'Morning' : 'Afternoon'} Ride
                        </Typography>
                        <Chip
                          label={ride.status}
                          color={
                            getStatusColor(ride.status) as
                              | 'success'
                              | 'info'
                              | 'error'
                              | 'warning'
                              | 'default'
                          }
                          size="small"
                        />
                        {isDriver && <Chip label="You're Driving" color="primary" size="small" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {format(rideDate, 'EEEE, MMMM dd, yyyy')} • {ride.scheduled_time}
                      </Typography>
                    </Box>

                    <Avatar sx={{ width: 48, height: 48 }}>{ride.driver_name.charAt(0)}</Avatar>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Driver: {ride.driver_name}
                    </Typography>
                    {ride.actual_start_time && (
                      <Typography variant="body2" color="text.secondary">
                        Started: {ride.actual_start_time}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Passengers ({ride.passengers.length})
                  </Typography>

                  <List dense>
                    {ride.passengers.map((passenger) => (
                      <ListItem
                        key={passenger.member_id}
                        secondaryAction={
                          isDriver &&
                          ride.status === 'in_progress' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {passenger.check_in_status === 'pending' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      handleCheckIn(
                                        ride.id,
                                        passenger.member_id,
                                        ride.ride_type === 'morning' ? 'picked_up' : 'dropped_off'
                                      )
                                    }
                                  >
                                    {ride.ride_type === 'morning' ? 'Pick Up' : 'Drop Off'}
                                  </Button>
                                  <Button
                                    size="small"
                                    color="warning"
                                    onClick={() => handleReportAbsence()}
                                  >
                                    Absent
                                  </Button>
                                </>
                              )}
                            </Box>
                          )
                        }
                      >
                        <ListItemAvatar>{getCheckInIcon(passenger.check_in_status)}</ListItemAvatar>
                        <ListItemText
                          primary={passenger.child_name}
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn fontSize="small" sx={{ fontSize: 14 }} />
                                <Typography variant="caption">
                                  Pickup Point {passenger.pickup_point_id} • {passenger.pickup_time}
                                </Typography>
                              </Box>
                              {passenger.check_in_time && (
                                <Typography variant="caption" color="success.main">
                                  {passenger.check_in_status === 'picked_up'
                                    ? 'Picked up'
                                    : 'Dropped off'}{' '}
                                  at {passenger.check_in_time}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  {isDriver && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {ride.status === 'confirmed' && (
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartRide(ride.id)}
                        >
                          Start Ride
                        </Button>
                      )}
                      {ride.status === 'in_progress' && (
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<Warning />}
                          onClick={() => handleReportLate()}
                        >
                          Report Delay
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={lateDialogOpen}
        onClose={() => setLateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Delay</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Notify all parents about the delay. They will receive an automatic notification.
          </Typography>

          <TextField
            fullWidth
            label="Estimated Delay (minutes)"
            type="number"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={3}
            value={lateReason}
            onChange={(e) => setLateReason(e.target.value)}
            placeholder="e.g., Heavy traffic on Main Street"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLateDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitLateNotification} variant="contained" color="warning">
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={absenceDialogOpen}
        onClose={() => setAbsenceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Absence</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Mark a child as absent for this ride. The parent will be notified automatically.
          </Typography>

          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={3}
            placeholder="e.g., Child was not at pickup point"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbsenceDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitAbsenceNotification} variant="contained" color="warning">
            Confirm Absence
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RideConfirmationSystem;
