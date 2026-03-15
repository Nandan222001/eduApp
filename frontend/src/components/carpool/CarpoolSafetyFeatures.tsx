import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Verified,
  Warning,
  LocationOn,
  Phone,
  Share,
  CheckCircle,
  Cancel,
  UploadFile,
  Security,
  LocalHospital,
} from '@mui/icons-material';
import { DriverVerification, RideTracking } from '@/types/carpool';

const mockVerification: DriverVerification = {
  user_id: 1,
  drivers_license_number: 'DL123456789',
  license_state: 'CA',
  license_expiry: '2026-12-31',
  license_verified: true,
  license_verified_at: '2024-01-15',
  background_check_completed: true,
  background_check_date: '2024-01-10',
  vehicle_insurance_verified: true,
  insurance_expiry: '2025-06-30',
  overall_verification_status: 'verified',
};

const mockRideTracking: RideTracking = {
  ride_id: 1,
  current_location: {
    address: 'Main St & 5th Ave',
    latitude: 40.7128,
    longitude: -74.006,
  },
  driver_id: 1,
  driver_name: 'Sarah Johnson',
  estimated_arrival_times: [
    { pickup_point_id: 1, eta: '5 minutes' },
    { pickup_point_id: 2, eta: '12 minutes' },
    { pickup_point_id: 3, eta: '18 minutes' },
  ],
  route_progress: 35,
  last_updated: new Date().toISOString(),
  sharing_enabled: true,
  shared_with: [2, 3, 4],
};

const CarpoolSafetyFeatures: React.FC = () => {
  const [verification] = useState<DriverVerification>(mockVerification);
  const [rideTracking] = useState<RideTracking>(mockRideTracking);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [emergencyDescription, setEmergencyDescription] = useState('');

  const handleTriggerSOS = () => {
    setSosDialogOpen(false);
    setEmergencyDescription('');
  };

  const verificationItems = [
    {
      label: 'Driver License',
      verified: verification.license_verified,
      expiry: verification.license_expiry,
      details: `${verification.license_state} - ${verification.drivers_license_number}`,
    },
    {
      label: 'Background Check',
      verified: verification.background_check_completed,
      date: verification.background_check_date,
      details: 'Completed and verified',
    },
    {
      label: 'Vehicle Insurance',
      verified: verification.vehicle_insurance_verified,
      expiry: verification.insurance_expiry,
      details: 'Active coverage',
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Safety & Verification
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Driver Verification Status
              </Typography>
              {verification.overall_verification_status === 'verified' ? (
                <Chip icon={<Verified />} label="Verified" color="success" />
              ) : (
                <Chip icon={<Warning />} label="Incomplete" color="warning" />
              )}
            </Box>

            <List>
              {verificationItems.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {item.verified ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {item.details}
                          </Typography>
                          {item.expiry && (
                            <Typography variant="caption" color="text.secondary">
                              Expires: {item.expiry}
                            </Typography>
                          )}
                          {item.date && (
                            <Typography variant="caption" color="text.secondary">
                              Verified: {item.date}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < verificationItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<UploadFile />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Upload/Update Documents
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Emergency SOS
              </Typography>
              <LocalHospital color="error" />
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              Use only in case of real emergency. Authorities and all parents will be notified
              immediately.
            </Alert>

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Phone color="action" />
                </ListItemIcon>
                <ListItemText primary="Emergency Contacts Notified" secondary="All group members" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationOn color="action" />
                </ListItemIcon>
                <ListItemText primary="Location Shared" secondary="Current GPS coordinates sent" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Security color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Authorities Contacted"
                  secondary="Local emergency services alerted"
                />
              </ListItem>
            </List>

            <Button
              fullWidth
              variant="contained"
              color="error"
              size="large"
              onClick={() => setSosDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              TRIGGER EMERGENCY SOS
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Live Ride Tracking
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={trackingEnabled}
                    onChange={(e) => setTrackingEnabled(e.target.checked)}
                  />
                }
                label="Enable Tracking"
              />
            </Box>

            {trackingEnabled ? (
              <Box>
                <Card variant="outlined" sx={{ mb: 2, bgcolor: 'info.50' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar>{rideTracking.driver_name.charAt(0)}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{rideTracking.driver_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Driver tracking enabled
                        </Typography>
                      </Box>
                      <Chip icon={<Share />} label="Shared with 3 parents" size="small" />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Route Progress
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {rideTracking.route_progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={rideTracking.route_progress}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocationOn color="primary" fontSize="small" />
                      <Typography variant="body2">
                        Current Location: {rideTracking.current_location.address}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Estimated Arrival Times
                    </Typography>

                    <Grid container spacing={1}>
                      {rideTracking.estimated_arrival_times.map((eta) => (
                        <Grid item xs={12} sm={4} key={eta.pickup_point_id}>
                          <Card variant="outlined">
                            <CardContent sx={{ py: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Pickup Point {eta.pickup_point_id}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {eta.eta}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                <Alert severity="info" icon={<Share />}>
                  Your location is being shared with all carpool members for safety. You can disable
                  tracking at any time.
                </Alert>
              </Box>
            ) : (
              <Alert severity="warning">
                Ride tracking is disabled. Enable it to share your location with other parents for
                safety.
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Safety Guidelines
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Verify Driver Identity"
                  secondary="Always verify the driver's identity before getting in the vehicle"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Share Ride Details"
                  secondary="Enable live tracking so other parents can monitor the ride"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Emergency Contacts"
                  secondary="Ensure all emergency contacts are up to date"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Vehicle Inspection"
                  secondary="Verify that the vehicle matches the registered information"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={sosDialogOpen} onClose={() => setSosDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Emergency SOS Alert
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            This will immediately notify all carpool members and emergency contacts. Use only for
            real emergencies.
          </Alert>

          <TextField
            fullWidth
            label="Describe the Emergency (optional)"
            multiline
            rows={4}
            value={emergencyDescription}
            onChange={(e) => setEmergencyDescription(e.target.value)}
            placeholder="What is happening? This information will be shared with emergency responders."
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The following will be notified:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• All carpool group members" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Your emergency contacts" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• School administration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Local emergency services" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSosDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTriggerSOS} variant="contained" color="error">
            CONFIRM EMERGENCY
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Verification Documents</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Driver License
            </Typography>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
              Upload Driver License
              <input type="file" hidden accept="image/*,.pdf" />
            </Button>

            <Typography variant="subtitle2" gutterBottom>
              Vehicle Insurance
            </Typography>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
              Upload Insurance Card
              <input type="file" hidden accept="image/*,.pdf" />
            </Button>

            <Alert severity="info">
              Documents will be reviewed by the school administration. Verification typically takes
              1-2 business days.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarpoolSafetyFeatures;
