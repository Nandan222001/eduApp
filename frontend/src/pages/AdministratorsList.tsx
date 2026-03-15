import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import administratorsApi, { Administrator, AdministratorCreate } from '@/api/administrators';
import { isDemoUser } from '@/api/demoDataApi';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdministratorsList() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<'admin' | 'institution_admin' | undefined>(
    undefined
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AdministratorCreate>({
    institution_id: user?.institution_id || 1,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'admin',
    department: '',
    designation: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAdministrators = async () => {
    try {
      setLoading(true);
      if (isDemoUser()) {
        const demoAdmins: Administrator[] = [
          {
            id: 1,
            institution_id: 1,
            user_id: 101,
            first_name: 'John',
            last_name: 'Anderson',
            email: 'john.anderson@school.edu',
            phone: '+1-555-0101',
            role: 'institution_admin',
            department: 'Administration',
            designation: 'Principal',
            is_active: true,
            photo_url: undefined,
            created_at: '2023-01-15T10:00:00Z',
            updated_at: '2024-03-15T10:00:00Z',
          },
          {
            id: 2,
            institution_id: 1,
            user_id: 102,
            first_name: 'Sarah',
            last_name: 'Mitchell',
            email: 'sarah.mitchell@school.edu',
            phone: '+1-555-0102',
            role: 'admin',
            department: 'Academic Affairs',
            designation: 'Vice Principal',
            is_active: true,
            photo_url: undefined,
            created_at: '2023-02-20T10:00:00Z',
            updated_at: '2024-03-15T10:00:00Z',
          },
          {
            id: 3,
            institution_id: 1,
            user_id: 103,
            first_name: 'Michael',
            last_name: 'Davis',
            email: 'michael.davis@school.edu',
            phone: '+1-555-0103',
            role: 'admin',
            department: 'Student Affairs',
            designation: 'Dean of Students',
            is_active: true,
            photo_url: undefined,
            created_at: '2023-03-10T10:00:00Z',
            updated_at: '2024-03-15T10:00:00Z',
          },
          {
            id: 4,
            institution_id: 1,
            user_id: 104,
            first_name: 'Emily',
            last_name: 'Brown',
            email: 'emily.brown@school.edu',
            phone: '+1-555-0104',
            role: 'admin',
            department: 'Admissions',
            designation: 'Admissions Director',
            is_active: true,
            photo_url: undefined,
            created_at: '2023-04-05T10:00:00Z',
            updated_at: '2024-03-15T10:00:00Z',
          },
          {
            id: 5,
            institution_id: 1,
            user_id: 105,
            first_name: 'Robert',
            last_name: 'Wilson',
            email: 'robert.wilson@school.edu',
            phone: '+1-555-0105',
            role: 'admin',
            department: 'Finance',
            designation: 'Finance Manager',
            is_active: false,
            photo_url: undefined,
            created_at: '2023-05-12T10:00:00Z',
            updated_at: '2024-03-15T10:00:00Z',
          },
        ];

        let filtered = demoAdmins;
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (admin) =>
              admin.first_name.toLowerCase().includes(searchLower) ||
              admin.last_name.toLowerCase().includes(searchLower) ||
              admin.email.toLowerCase().includes(searchLower) ||
              admin.department?.toLowerCase().includes(searchLower) ||
              admin.designation?.toLowerCase().includes(searchLower)
          );
        }
        if (activeFilter !== undefined) {
          filtered = filtered.filter((admin) => admin.is_active === activeFilter);
        }
        if (roleFilter) {
          filtered = filtered.filter((admin) => admin.role === roleFilter);
        }

        const start = page * rowsPerPage;
        const paginatedAdmins = filtered.slice(start, start + rowsPerPage);

        setAdministrators(paginatedAdmins);
        setTotal(filtered.length);
      } else {
        const response = await administratorsApi.listAdministrators({
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: search || undefined,
          is_active: activeFilter,
          role: roleFilter,
        });
        setAdministrators(response.items);
        setTotal(response.total);
      }
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load administrators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdministrators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, activeFilter, roleFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, admin: Administrator) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmin(admin);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    if (selectedAdmin) {
      setFormData({
        institution_id: selectedAdmin.institution_id,
        first_name: selectedAdmin.first_name,
        last_name: selectedAdmin.last_name,
        email: selectedAdmin.email,
        phone: selectedAdmin.phone || '',
        role: selectedAdmin.role,
        department: selectedAdmin.department || '',
        designation: selectedAdmin.designation || '',
        is_active: selectedAdmin.is_active,
      });
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAdmin) return;

    try {
      if (!isDemoUser()) {
        await administratorsApi.deleteAdministrator(selectedAdmin.id);
      }
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdministrators();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete administrator');
    }
  };

  const handleCreateDialogOpen = () => {
    setFormData({
      institution_id: user?.institution_id || 1,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'admin',
      department: '',
      designation: '',
      is_active: true,
    });
    setFormErrors({});
    setCreateDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (!isDemoUser()) {
        await administratorsApi.createAdministrator(formData);
      }
      setCreateDialogOpen(false);
      fetchAdministrators();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create administrator');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAdmin || !validateForm()) return;

    try {
      if (!isDemoUser()) {
        await administratorsApi.updateAdministrator(selectedAdmin.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          department: formData.department || undefined,
          designation: formData.designation || undefined,
          is_active: formData.is_active,
        });
      }
      setEditDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdministrators();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to update administrator');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getRoleLabel = (role: string) => {
    return role === 'institution_admin' ? 'Institution Admin' : 'Admin';
  };

  const getRoleColor = (role: string) => {
    return role === 'institution_admin' ? 'primary' : 'secondary';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderFormDialog = (isEdit: boolean) => (
    <Dialog
      open={isEdit ? editDialogOpen : createDialogOpen}
      onClose={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{isEdit ? 'Edit' : 'Add'} Administrator</Typography>
          <IconButton
            onClick={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              error={!!formErrors.first_name}
              helperText={formErrors.first_name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              error={!!formErrors.last_name}
              helperText={formErrors.last_name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as 'admin' | 'institution_admin',
                  })
                }
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="institution_admin">Institution Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                label="Status"
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value === 'active' })
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}>
          Cancel
        </Button>
        <Button variant="contained" onClick={isEdit ? handleEditSubmit : handleCreateSubmit}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Administrators
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage administrative staff and their roles
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateDialogOpen}>
          Add Administrator
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search administrators..."
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter || ''}
              label="Role"
              onChange={(e) => {
                setRoleFilter(
                  e.target.value ? (e.target.value as 'admin' | 'institution_admin') : undefined
                );
                setPage(0);
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="institution_admin">Institution Admin</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => {
              setActiveFilter(activeFilter === true ? undefined : true);
              setPage(0);
            }}
          >
            {activeFilter === true ? 'Active Only' : 'All'}
          </Button>
          <IconButton onClick={fetchAdministrators}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Administrator</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {administrators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No administrators found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    administrators.map((admin) => (
                      <TableRow key={admin.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={admin.photo_url}
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            >
                              {getInitials(admin.first_name, admin.last_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {admin.first_name} {admin.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {admin.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleLabel(admin.role)}
                            color={getRoleColor(admin.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{admin.department || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{admin.designation || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{admin.phone || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={admin.is_active ? 'Active' : 'Inactive'}
                            color={getStatusColor(admin.is_active)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => handleMenuOpen(e, admin)}>
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Administrator
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to delete {selectedAdmin?.first_name} {selectedAdmin?.last_name}?
            This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      {renderFormDialog(false)}
      {renderFormDialog(true)}
    </Box>
  );
}
