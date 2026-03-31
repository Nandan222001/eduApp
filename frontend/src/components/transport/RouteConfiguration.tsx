import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  DirectionsBus as BusIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../api/transport';
import { TransportRoute, RouteStop } from '../../types/transport';

const RouteConfiguration: React.FC = () => {
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: routesData } = useQuery({
    queryKey: ['transportRoutes'],
    queryFn: () => transportApi.listRoutes(),
  });

  const { data: stopsData } = useQuery({
    queryKey: ['routeStops', selectedRouteId],
    queryFn: () =>
      selectedRouteId ? transportApi.getRouteStops(selectedRouteId) : Promise.resolve([]),
    enabled: !!selectedRouteId,
  });

  const createRouteMutation = useMutation({
    mutationFn: transportApi.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      setRouteDialogOpen(false);
      setEditingRoute(null);
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransportRoute> }) =>
      transportApi.updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      setRouteDialogOpen(false);
      setEditingRoute(null);
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: transportApi.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
    },
  });

  const createStopMutation = useMutation({
    mutationFn: ({ routeId, data }: { routeId: number; data: Partial<RouteStop> }) =>
      transportApi.createStop(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routeStops'] });
      setStopDialogOpen(false);
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: ({ routeId, stopId }: { routeId: number; stopId: number }) =>
      transportApi.deleteStop(routeId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routeStops'] });
    },
  });

  const handleRouteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const totalDistanceKmValue = formData.get('total_distance_km');
    const estimatedDurationMinutesValue = formData.get('estimated_duration_minutes');
    const vehicleCapacityValue = formData.get('vehicle_capacity');
    const monthlyFeeValue = formData.get('monthly_fee');
    const descriptionValue = formData.get('description');
    const pickupTimeValue = formData.get('pickup_time');
    const dropTimeValue = formData.get('drop_time');
    const vehicleTypeValue = formData.get('vehicle_type');
    const vehicleNumberValue = formData.get('vehicle_number');
    const driverNameValue = formData.get('driver_name');
    const driverPhoneValue = formData.get('driver_phone');
    const driverLicenseNumberValue = formData.get('driver_license_number');
    const conductorNameValue = formData.get('conductor_name');
    const conductorPhoneValue = formData.get('conductor_phone');

    const data = {
      institution_id: 1,
      route_number: formData.get('route_number') as string,
      route_name: formData.get('route_name') as string,
      description:
        descriptionValue && descriptionValue !== '' ? (descriptionValue as string) : undefined,
      start_location: formData.get('start_location') as string,
      end_location: formData.get('end_location') as string,
      total_distance_km:
        totalDistanceKmValue && totalDistanceKmValue !== ''
          ? parseFloat(totalDistanceKmValue as string)
          : undefined,
      estimated_duration_minutes:
        estimatedDurationMinutesValue && estimatedDurationMinutesValue !== ''
          ? parseInt(estimatedDurationMinutesValue as string, 10)
          : undefined,
      pickup_time:
        pickupTimeValue && pickupTimeValue !== '' ? (pickupTimeValue as string) : undefined,
      drop_time: dropTimeValue && dropTimeValue !== '' ? (dropTimeValue as string) : undefined,
      vehicle_type:
        vehicleTypeValue && vehicleTypeValue !== '' ? (vehicleTypeValue as string) : undefined,
      vehicle_number:
        vehicleNumberValue && vehicleNumberValue !== ''
          ? (vehicleNumberValue as string)
          : undefined,
      vehicle_capacity:
        vehicleCapacityValue && vehicleCapacityValue !== ''
          ? parseInt(vehicleCapacityValue as string, 10)
          : undefined,
      driver_name:
        driverNameValue && driverNameValue !== '' ? (driverNameValue as string) : undefined,
      driver_phone:
        driverPhoneValue && driverPhoneValue !== '' ? (driverPhoneValue as string) : undefined,
      driver_license_number:
        driverLicenseNumberValue && driverLicenseNumberValue !== ''
          ? (driverLicenseNumberValue as string)
          : undefined,
      conductor_name:
        conductorNameValue && conductorNameValue !== ''
          ? (conductorNameValue as string)
          : undefined,
      conductor_phone:
        conductorPhoneValue && conductorPhoneValue !== ''
          ? (conductorPhoneValue as string)
          : undefined,
      monthly_fee:
        monthlyFeeValue && monthlyFeeValue !== ''
          ? parseFloat(monthlyFeeValue as string)
          : undefined,
      status: (formData.get('status') as string) || 'active',
      is_active: true,
    };

    if (editingRoute) {
      updateRouteMutation.mutate({ id: editingRoute.id, data });
    } else {
      createRouteMutation.mutate(data);
    }
  };

  const handleStopSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const latitudeValue = formData.get('latitude');
    const longitudeValue = formData.get('longitude');
    const stopAddressValue = formData.get('stop_address');
    const pickupTimeValue = formData.get('pickup_time');
    const dropTimeValue = formData.get('drop_time');

    const data = {
      stop_name: formData.get('stop_name') as string,
      stop_address:
        stopAddressValue && stopAddressValue !== '' ? (stopAddressValue as string) : undefined,
      latitude:
        latitudeValue && latitudeValue !== '' ? parseFloat(latitudeValue as string) : undefined,
      longitude:
        longitudeValue && longitudeValue !== '' ? parseFloat(longitudeValue as string) : undefined,
      stop_order: parseInt(formData.get('stop_order') as string, 10),
      pickup_time:
        pickupTimeValue && pickupTimeValue !== '' ? (pickupTimeValue as string) : undefined,
      drop_time: dropTimeValue && dropTimeValue !== '' ? (dropTimeValue as string) : undefined,
      is_active: true,
    };

    if (selectedRouteId) {
      createStopMutation.mutate({ routeId: selectedRouteId, data });
    }
  };

  const handleDeleteRoute = (id: number) => {
    if (confirm('Are you sure you want to delete this route?')) {
      deleteRouteMutation.mutate(id);
    }
  };

  const handleDeleteStop = (routeId: number, stopId: number) => {
    if (confirm('Are you sure you want to delete this stop?')) {
      deleteStopMutation.mutate({ routeId, stopId });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingRoute(null);
            setRouteDialogOpen(true);
          }}
        >
          Add Route
        </Button>
      </Box>

      {routesData?.items?.map((route: TransportRoute) => (
        <Accordion key={route.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <BusIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {route.route_number} - {route.route_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {route.start_location} → {route.end_location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={route.vehicle_number || 'No Vehicle'} size="small" />
                <Chip
                  label={route.status}
                  size="small"
                  color={route.status === 'active' ? 'success' : 'default'}
                />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRoute(route);
                    setRouteDialogOpen(true);
                  }}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoute(route.id);
                  }}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Driver
                </Typography>
                <Typography>{route.driver_name || 'Not assigned'}</Typography>
                {route.driver_phone && (
                  <Typography variant="body2">{route.driver_phone}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Conductor
                </Typography>
                <Typography>{route.conductor_name || 'Not assigned'}</Typography>
                {route.conductor_phone && (
                  <Typography variant="body2">{route.conductor_phone}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Distance
                </Typography>
                <Typography>{route.total_distance_km} km</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography>{route.estimated_duration_minutes} mins</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Capacity
                </Typography>
                <Typography>{route.vehicle_capacity} students</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Monthly Fee
                </Typography>
                <Typography>₹{route.monthly_fee}</Typography>
              </Grid>
            </Grid>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Stops</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedRouteId(route.id);
                  setStopDialogOpen(true);
                }}
              >
                Add Stop
              </Button>
            </Box>

            <List>
              {stopsData?.items?.map((stop: RouteStop) => (
                <ListItem key={stop.id} divider>
                  <ListItemText
                    primary={`${stop.stop_order}. ${stop.stop_name}`}
                    secondary={
                      <>
                        {stop.stop_address}
                        <br />
                        Pickup: {stop.pickup_time || 'N/A'} | Drop: {stop.drop_time || 'N/A'}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteStop(route.id, stop.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog
        open={routeDialogOpen}
        onClose={() => setRouteDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleRouteSubmit}>
          <DialogTitle>{editingRoute ? 'Edit Route' : 'Add Route'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Route Number"
                  name="route_number"
                  defaultValue={editingRoute?.route_number}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Route Name"
                  name="route_name"
                  defaultValue={editingRoute?.route_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Location"
                  name="start_location"
                  defaultValue={editingRoute?.start_location}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Location"
                  name="end_location"
                  defaultValue={editingRoute?.end_location}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Type"
                  name="vehicle_type"
                  defaultValue={editingRoute?.vehicle_type}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  name="vehicle_number"
                  defaultValue={editingRoute?.vehicle_number}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Capacity"
                  name="vehicle_capacity"
                  type="number"
                  defaultValue={editingRoute?.vehicle_capacity}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Fee"
                  name="monthly_fee"
                  type="number"
                  defaultValue={editingRoute?.monthly_fee}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Driver Name"
                  name="driver_name"
                  defaultValue={editingRoute?.driver_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Driver Phone"
                  name="driver_phone"
                  defaultValue={editingRoute?.driver_phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={2}
                  defaultValue={editingRoute?.description}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRouteDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingRoute ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={stopDialogOpen}
        onClose={() => setStopDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleStopSubmit}>
          <DialogTitle>Add Stop</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Stop Name" name="stop_name" required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Stop Address" name="stop_address" multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Stop Order"
                  name="stop_order"
                  type="number"
                  defaultValue={1}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Pickup Time"
                  name="pickup_time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Drop Time"
                  name="drop_time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStopDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Add Stop
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RouteConfiguration;
