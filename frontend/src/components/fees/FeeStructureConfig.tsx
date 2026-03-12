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
  FormControlLabel,
  Checkbox,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeApi } from '../../api/fees';
import { FeeStructure } from '../../types/fee';

const FEE_CATEGORIES = [
  'tuition',
  'transport',
  'library',
  'laboratory',
  'examination',
  'hostel',
  'sports',
  'other',
];

const FeeStructureConfig: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const queryClient = useQueryClient();

  const { data: structuresData } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: () => feeApi.listStructures(),
  });

  const createMutation = useMutation({
    mutationFn: feeApi.createStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FeeStructure> }) =>
      feeApi.updateStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: feeApi.deleteStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
  });

  const handleOpen = (structure?: FeeStructure) => {
    setEditingStructure(structure || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStructure(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      institution_id: 1,
      academic_year_id: 1,
      grade_id: parseInt(formData.get('grade_id') as string),
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount') as string),
      is_mandatory: formData.get('is_mandatory') === 'on',
      is_recurring: formData.get('is_recurring') === 'on',
      recurrence_period: formData.get('recurrence_period'),
      due_date: formData.get('due_date'),
      late_fee_applicable: formData.get('late_fee_applicable') === 'on',
      late_fee_amount: formData.get('late_fee_amount')
        ? parseFloat(formData.get('late_fee_amount') as string)
        : null,
      late_fee_percentage: formData.get('late_fee_percentage')
        ? parseFloat(formData.get('late_fee_percentage') as string)
        : null,
      is_active: true,
    };

    if (editingStructure) {
      updateMutation.mutate({ id: editingStructure.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Fee Structure
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {structuresData?.items?.map((structure: FeeStructure) => (
              <TableRow key={structure.id}>
                <TableCell>{structure.name}</TableCell>
                <TableCell>
                  <Chip label={structure.category} size="small" />
                </TableCell>
                <TableCell>₹{structure.amount}</TableCell>
                <TableCell>
                  {structure.is_mandatory ? 'Mandatory' : 'Optional'}
                  {structure.is_recurring && ' (Recurring)'}
                </TableCell>
                <TableCell>{structure.due_date || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={structure.is_active ? 'Active' : 'Inactive'}
                    color={structure.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(structure)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(structure.id)} size="small" color="error">
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
          <DialogTitle>{editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  defaultValue={editingStructure?.name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category"
                  defaultValue={editingStructure?.category}
                  required
                >
                  {FEE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  defaultValue={editingStructure?.amount}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grade ID"
                  name="grade_id"
                  type="number"
                  defaultValue={editingStructure?.grade_id}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="due_date"
                  type="date"
                  defaultValue={editingStructure?.due_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={2}
                  defaultValue={editingStructure?.description}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_mandatory"
                      defaultChecked={editingStructure?.is_mandatory ?? true}
                    />
                  }
                  label="Mandatory"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox name="is_recurring" defaultChecked={editingStructure?.is_recurring} />
                  }
                  label="Recurring"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="late_fee_applicable"
                      defaultChecked={editingStructure?.late_fee_applicable}
                    />
                  }
                  label="Late Fee Applicable"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Late Fee Amount"
                  name="late_fee_amount"
                  type="number"
                  defaultValue={editingStructure?.late_fee_amount}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingStructure ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FeeStructureConfig;
