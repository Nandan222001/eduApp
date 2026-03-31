import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
import schoolAdminApi, { Enquiry, EnquiryCreate } from '../api/schoolAdmin';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

const sourceOptions = ['Walk-in', 'Phone', 'Email', 'Website', 'Referral', 'Social Media', 'Other'];

const statusColors = {
  new: 'info',
  contacted: 'warning',
  visited: 'default',
  follow_up: 'default',
  converted: 'success',
  closed: 'error',
} as const;

export const EnquiryManagement: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<EnquiryCreate & { source?: string }>({
    student_name: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    grade_interested: '',
    notes: '',
  });

  const [stats, setStats] = useState({
    new: 0,
    contacted: 0,
    visited: 0,
    follow_up: 0,
    converted: 0,
    closed: 0,
  });

  useEffect(() => {
    loadEnquiries();
  }, [paginationModel, filterStatus, filterGrade, filterSource, filterDate]);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const api = isDemoUser() ? demoDataApi.enquiries : schoolAdminApi.enquiries;
      const response = await api.list({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        status: filterStatus || undefined,
        grade_interested: filterGrade || undefined,
        from_date: filterDate || undefined,
      });
      setEnquiries(response.items);
      setTotalRows(response.total);

      const statusCounts = response.items.reduce(
        (acc, enq) => {
          acc[enq.status] = (acc[enq.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      setStats({
        new: statusCounts.new || 0,
        contacted: statusCounts.contacted || 0,
        visited: statusCounts.visited || 0,
        follow_up: statusCounts.follow_up || 0,
        converted: statusCounts.converted || 0,
        closed: statusCounts.closed || 0,
      });
    } catch (error) {
      showSnackbar('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingEnquiry(null);
    setFormData({
      student_name: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      grade_interested: '',
      notes: '',
      source: 'Walk-in',
    });
    setDialogOpen(true);
  };

  const handleEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setFormData({
      student_name: enquiry.student_name,
      parent_name: enquiry.parent_name,
      parent_phone: enquiry.parent_phone,
      parent_email: enquiry.parent_email || '',
      grade_interested: enquiry.grade_interested || '',
      notes: enquiry.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const api = isDemoUser() ? demoDataApi.enquiries : schoolAdminApi.enquiries;
      if (editingEnquiry) {
        await api.update(editingEnquiry.id, formData);
        showSnackbar('Enquiry updated successfully', 'success');
      } else {
        await api.create(formData);
        showSnackbar('Enquiry created successfully', 'success');
      }
      setDialogOpen(false);
      loadEnquiries();
    } catch (error) {
      showSnackbar('Failed to save enquiry', 'error');
    }
  };

  const handleStatusChange = async (
    id: number,
    status: 'new' | 'contacted' | 'visited' | 'follow_up' | 'converted' | 'closed'
  ) => {
    try {
      const api = isDemoUser() ? demoDataApi.enquiries : schoolAdminApi.enquiries;
      await api.update(id, { status });
      showSnackbar('Status updated successfully', 'success');
      loadEnquiries();
    } catch (error) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, enquiry: Enquiry) => {
    setAnchorEl(event.currentTarget);
    setSelectedEnquiry(enquiry);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEnquiry(null);
  };

  const handleSendSMS = () => {
    showSnackbar('SMS sent successfully', 'success');
    handleMenuClose();
  };

  const handleScheduleFollowUp = () => {
    showSnackbar('Follow-up scheduled successfully', 'success');
    handleMenuClose();
  };

  const columns: GridColDef[] = [
    { field: 'student_name', headerName: 'Student Name', width: 150 },
    { field: 'parent_name', headerName: 'Parent Name', width: 150 },
    { field: 'parent_phone', headerName: 'Phone', width: 130 },
    { field: 'parent_email', headerName: 'Email', width: 180 },
    { field: 'grade_interested', headerName: 'Grade', width: 100 },
    {
      field: 'enquiry_date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => new Date(params).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          color={statusColors[params.value as keyof typeof statusColors]}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Enquiry Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track and manage admission enquiries from prospects
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    NEW
                  </Typography>
                  <Typography variant="h4">{stats.new}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    CONTACTED
                  </Typography>
                  <Typography variant="h4">{stats.contacted}</Typography>
                </Box>
                <PhoneIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    VISITED
                  </Typography>
                  <Typography variant="h4">{stats.visited}</Typography>
                </Box>
                <VisibilityIcon sx={{ fontSize: 40, color: 'default' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    FOLLOW-UP
                  </Typography>
                  <Typography variant="h4">{stats.follow_up}</Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'default' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    CONVERTED
                  </Typography>
                  <Typography variant="h4">{stats.converted}</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    CLOSED
                  </Typography>
                  <Typography variant="h4">{stats.closed}</Typography>
                </Box>
                <CloseIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="visited">Visited</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Grade</InputLabel>
              <Select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                label="Filter by Grade"
              >
                <MenuItem value="">All</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <MenuItem key={g} value={`Grade ${g}`}>
                    Grade {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Source</InputLabel>
              <Select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                label="Filter by Source"
              >
                <MenuItem value="">All</MenuItem>
                {sourceOptions.map((src) => (
                  <MenuItem key={src} value={src}>
                    {src}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Filter by Date"
              InputLabelProps={{ shrink: true }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2.5}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} fullWidth>
              Add Enquiry
            </Button>
          </Grid>
        </Grid>

        <DataGrid
          rows={enquiries}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalRows}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingEnquiry ? 'Edit Enquiry' : 'Add Enquiry'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student Name"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Name"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={formData.parent_email}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Grade Interested</InputLabel>
                <Select
                  value={formData.grade_interested}
                  label="Grade Interested"
                  onChange={(e) => setFormData({ ...formData, grade_interested: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <MenuItem key={g} value={`Grade ${g}`}>
                      Grade {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={formData.source}
                  label="Source"
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  {sourceOptions.map((src) => (
                    <MenuItem key={src} value={src}>
                      {src}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedEnquiry) handleEdit(selectedEnquiry);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSendSMS}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send SMS</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedEnquiry) {
              handleStatusChange(selectedEnquiry.id, 'contacted');
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleScheduleFollowUp}>
          <ListItemIcon>
            <EventAvailableIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Schedule Follow-up</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EnquiryManagement;
