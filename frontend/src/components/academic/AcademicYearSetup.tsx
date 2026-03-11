import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current: boolean;
  description?: string;
}

interface Term {
  id: number;
  name: string;
  term_type: 'semester' | 'trimester' | 'quarter' | 'custom';
  start_date: string;
  end_date: string;
  display_order: number;
  is_active: boolean;
}

export default function AcademicYearSetup() {
  const [academicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [terms] = useState<Term[]>([]);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_active: true,
    is_current: false,
  });
  const [termFormData, setTermFormData] = useState<{
    name: string;
    term_type: 'semester' | 'trimester' | 'quarter' | 'custom';
    start_date: string;
    end_date: string;
    display_order: number;
  }>({
    name: '',
    term_type: 'semester',
    start_date: '',
    end_date: '',
    display_order: 0,
  });

  const handleOpenYearDialog = (year?: AcademicYear) => {
    if (year) {
      setFormData({
        name: year.name,
        start_date: year.start_date,
        end_date: year.end_date,
        description: year.description || '',
        is_active: year.is_active,
        is_current: year.is_current,
      });
      setSelectedYear(year);
    } else {
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        description: '',
        is_active: true,
        is_current: false,
      });
      setSelectedYear(null);
    }
    setYearDialogOpen(true);
  };

  const handleOpenTermDialog = () => {
    setTermFormData({
      name: '',
      term_type: 'semester',
      start_date: '',
      end_date: '',
      display_order: terms.length,
    });
    setTermDialogOpen(true);
  };

  const handleSaveYear = () => {
    setYearDialogOpen(false);
  };

  const handleSaveTerm = () => {
    setTermDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Academic Years</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenYearDialog()}>
          Add Academic Year
        </Button>
      </Box>

      <Grid container spacing={3}>
        {academicYears.map((year) => (
          <Grid item xs={12} md={6} key={year.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">{year.name}</Typography>
                  <Box>
                    {year.is_current && (
                      <Chip label="Current" color="primary" size="small" sx={{ mr: 1 }} />
                    )}
                    {year.is_active && <Chip label="Active" color="success" size="small" />}
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <CalendarIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  {year.start_date} to {year.end_date}
                </Typography>
                {year.description && (
                  <Typography variant="body2" color="text.secondary">
                    {year.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenYearDialog(year)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedYear(year);
                  }}
                >
                  Manage Terms
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedYear && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Terms for {selectedYear.name}</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenTermDialog}>
              Add Term
            </Button>
          </Box>
          <Card>
            <List>
              {terms.map((term, index) => (
                <ListItem key={term.id} divider={index < terms.length - 1}>
                  <ListItemText
                    primary={term.name}
                    secondary={`${term.term_type} • ${term.start_date} to ${term.end_date}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {terms.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No terms configured"
                    secondary="Click 'Add Term' to create terms for this academic year"
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Box>
      )}

      <Dialog
        open={yearDialogOpen}
        onClose={() => setYearDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedYear ? 'Edit Academic Year' : 'Add Academic Year'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Academic Year Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 2024-2025"
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveYear}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={termDialogOpen}
        onClose={() => setTermDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Term</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Term Name"
              value={termFormData.name}
              onChange={(e) => setTermFormData({ ...termFormData, name: e.target.value })}
              placeholder="e.g., First Semester"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Term Type</InputLabel>
              <Select
                value={termFormData.term_type}
                onChange={(e) =>
                  setTermFormData({
                    ...termFormData,
                    term_type: e.target.value as 'semester' | 'trimester' | 'quarter' | 'custom',
                  })
                }
                label="Term Type"
              >
                <MenuItem value="semester">Semester</MenuItem>
                <MenuItem value="trimester">Trimester</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={termFormData.start_date}
                  onChange={(e) => setTermFormData({ ...termFormData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={termFormData.end_date}
                  onChange={(e) => setTermFormData({ ...termFormData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTerm}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
