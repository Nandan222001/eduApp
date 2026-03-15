import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, LocationOn, Schedule, DragIndicator } from '@mui/icons-material';
import { PickupPoint } from '@/types/carpool';

interface PickupPointManagerProps {
  groupId: number;
}

const mockPickupPoints: PickupPoint[] = [
  {
    id: 1,
    carpool_group_id: 1,
    name: 'Oak Street & Main',
    location: {
      address: '123 Oak Street',
      latitude: 40.7128,
      longitude: -74.006,
    },
    pickup_time_morning: '07:30 AM',
    dropoff_time_afternoon: '03:30 PM',
    order_sequence: 1,
    notes: 'Wait near the bus stop',
    assigned_members: [1, 2],
  },
  {
    id: 2,
    carpool_group_id: 1,
    name: 'Maple Avenue Park',
    location: {
      address: '456 Maple Avenue',
      latitude: 40.7138,
      longitude: -74.007,
    },
    pickup_time_morning: '07:40 AM',
    dropoff_time_afternoon: '03:40 PM',
    order_sequence: 2,
    notes: 'Park entrance',
    assigned_members: [3],
  },
  {
    id: 3,
    carpool_group_id: 1,
    name: 'School Main Entrance',
    location: {
      address: 'Oakwood Elementary School',
      latitude: 40.7158,
      longitude: -74.009,
    },
    pickup_time_morning: '07:50 AM',
    order_sequence: 3,
    assigned_members: [1, 2, 3, 4],
  },
];

const PickupPointManager: React.FC<PickupPointManagerProps> = () => {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>(mockPickupPoints);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    morning_time: '',
    afternoon_time: '',
    notes: '',
  });

  const handleAddNew = () => {
    setEditingPoint(null);
    setFormData({
      name: '',
      address: '',
      morning_time: '',
      afternoon_time: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (point: PickupPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      address: point.location.address,
      morning_time: point.pickup_time_morning || '',
      afternoon_time: point.dropoff_time_afternoon || '',
      notes: point.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setPickupPoints(pickupPoints.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Pickup Points</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddNew} size="small">
          Add Point
        </Button>
      </Box>

      <List>
        {pickupPoints.map((point, index) => (
          <Paper key={point.id} sx={{ mb: 1 }}>
            <ListItem>
              <IconButton edge="start" sx={{ mr: 1 }}>
                <DragIndicator />
              </IconButton>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <LocationOn color="action" fontSize="small" />
                  <Typography variant="subtitle2">{point.name}</Typography>
                  <Chip label={`Stop ${index + 1}`} size="small" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {point.location.address}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {point.pickup_time_morning && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Morning
                          </Typography>
                          <Typography variant="body2">{point.pickup_time_morning}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {point.dropoff_time_afternoon && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Afternoon
                          </Typography>
                          <Typography variant="body2">{point.dropoff_time_afternoon}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {point.notes && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Note: {point.notes}
                  </Typography>
                )}

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {point.assigned_members.length} member(s) assigned
                  </Typography>
                </Box>
              </Box>

              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEdit(point)}>
                  <Edit />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDelete(point.id)} color="error">
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </Paper>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPoint ? 'Edit Pickup Point' : 'Add Pickup Point'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Point Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Oak Street & Main"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address (autocomplete enabled)"
                InputProps={{
                  startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Morning Pickup Time"
                type="time"
                value={formData.morning_time}
                onChange={(e) => setFormData({ ...formData, morning_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Afternoon Dropoff Time"
                type="time"
                value={formData.afternoon_time}
                onChange={(e) => setFormData({ ...formData, afternoon_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions for this pickup point"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PickupPointManager;
