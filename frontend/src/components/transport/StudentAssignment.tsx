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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../api/transport';
import {
  StudentTransport,
  StudentTransportWithDetails,
  TransportRoute,
} from '../../types/transport';

const StudentAssignment: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StudentTransportWithDetails | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<number | undefined>();
  const queryClient = useQueryClient();

  const { data: assignmentsData } = useQuery({
    queryKey: ['studentTransport', searchQuery, routeFilter],
    queryFn: () =>
      transportApi.listStudentTransport({ search: searchQuery, route_id: routeFilter }),
  });

  const { data: routesData } = useQuery({
    queryKey: ['transportRoutes'],
    queryFn: () => transportApi.listRoutes(),
  });

  const createMutation = useMutation({
    mutationFn: transportApi.assignStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTransport'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentTransport> }) =>
      transportApi.updateStudentTransport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTransport'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transportApi.deleteStudentTransport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentTransport'] });
    },
  });

  const handleOpen = (assignment?: StudentTransportWithDetails) => {
    setEditingAssignment(assignment || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAssignment(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      institution_id: 1,
      student_id: parseInt(formData.get('student_id') as string),
      route_id: parseInt(formData.get('route_id') as string),
      stop_id: formData.get('stop_id') ? parseInt(formData.get('stop_id') as string) : null,
      pickup_location: formData.get('pickup_location'),
      drop_location: formData.get('drop_location'),
      monthly_fee: formData.get('monthly_fee')
        ? parseFloat(formData.get('monthly_fee') as string)
        : null,
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      emergency_contact_name: formData.get('emergency_contact_name'),
      emergency_contact_phone: formData.get('emergency_contact_phone'),
      remarks: formData.get('remarks'),
      is_active: true,
    };

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to remove this student from transport?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          <TextField
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <TextField
            select
            label="Filter by Route"
            value={routeFilter || ''}
            onChange={(e) => setRouteFilter(e.target.value ? parseInt(e.target.value) : undefined)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Routes</MenuItem>
            {routesData?.items?.map((route: TransportRoute) => (
              <MenuItem key={route.id} value={route.id}>
                {route.route_number} - {route.route_name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Assign Student
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Stop</TableCell>
              <TableCell>Pickup Location</TableCell>
              <TableCell>Drop Location</TableCell>
              <TableCell>Monthly Fee</TableCell>
              <TableCell>Emergency Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignmentsData?.items?.map((assignment: StudentTransportWithDetails) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {assignment.student_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {assignment.student_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {assignment.route_number} - {assignment.route_name}
                  </Typography>
                </TableCell>
                <TableCell>{assignment.stop_name || 'N/A'}</TableCell>
                <TableCell>{assignment.pickup_location || 'N/A'}</TableCell>
                <TableCell>{assignment.drop_location || 'N/A'}</TableCell>
                <TableCell>₹{assignment.monthly_fee || 0}</TableCell>
                <TableCell>
                  {assignment.emergency_contact_name && (
                    <>
                      <Typography variant="body2">{assignment.emergency_contact_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.emergency_contact_phone}
                      </Typography>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={assignment.is_active ? 'Active' : 'Inactive'}
                    color={assignment.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(assignment)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(assignment.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingAssignment ? 'Edit Student Assignment' : 'Assign Student to Transport'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student ID"
                  name="student_id"
                  type="number"
                  defaultValue={editingAssignment?.student_id}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Route"
                  name="route_id"
                  defaultValue={editingAssignment?.route_id}
                  required
                >
                  {routesData?.items?.map((route: TransportRoute) => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.route_number} - {route.route_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stop ID (Optional)"
                  name="stop_id"
                  type="number"
                  defaultValue={editingAssignment?.stop_id}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Fee"
                  name="monthly_fee"
                  type="number"
                  defaultValue={editingAssignment?.monthly_fee}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pickup Location"
                  name="pickup_location"
                  defaultValue={editingAssignment?.pickup_location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Drop Location"
                  name="drop_location"
                  defaultValue={editingAssignment?.drop_location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  defaultValue={
                    editingAssignment?.start_date || new Date().toISOString().split('T')[0]
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date (Optional)"
                  name="end_date"
                  type="date"
                  defaultValue={editingAssignment?.end_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  defaultValue={editingAssignment?.emergency_contact_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  defaultValue={editingAssignment?.emergency_contact_phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  multiline
                  rows={2}
                  defaultValue={editingAssignment?.remarks}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingAssignment ? 'Update' : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StudentAssignment;
