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
  MenuItem,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as DeactivateIcon,
  Search as SearchIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import schoolAdminApi, { Staff, StaffCreate } from '../api/schoolAdmin';

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<StaffCreate>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joining_date: '',
    salary: 0,
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    pan_number: '',
    address: '',
    emergency_contact: '',
    qualification: '',
    experience_years: 0,
    is_active: true,
  });

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, searchQuery, departmentFilter]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await schoolAdminApi.staff.list({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        search: searchQuery || undefined,
        department: departmentFilter || undefined,
      });
      setStaff(response.items);
      setTotalRows(response.total);

      const uniqueDepts = Array.from(
        new Set(response.items.map((s) => s.department).filter((d): d is string => !!d))
      );
      setDepartments(uniqueDepts);
    } catch (error) {
      showSnackbar('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingStaff(null);
    setViewMode(false);
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      joining_date: '',
      salary: 0,
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      pan_number: '',
      address: '',
      emergency_contact: '',
      qualification: '',
      experience_years: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setViewMode(false);
    setFormData({
      employee_id: staff.employee_id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email || '',
      phone: staff.phone || '',
      department: staff.department || '',
      designation: staff.designation || '',
      joining_date: staff.joining_date || '',
      salary: staff.salary || 0,
      bank_name: staff.bank_name || '',
      account_number: staff.account_number || '',
      ifsc_code: staff.ifsc_code || '',
      pan_number: staff.pan_number || '',
      address: staff.address || '',
      emergency_contact: staff.emergency_contact || '',
      qualification: staff.qualification || '',
      experience_years: staff.experience_years || 0,
      is_active: staff.is_active,
    });
    setDialogOpen(true);
  };

  const handleView = (staff: Staff) => {
    setEditingStaff(staff);
    setViewMode(true);
    setFormData({
      employee_id: staff.employee_id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email || '',
      phone: staff.phone || '',
      department: staff.department || '',
      designation: staff.designation || '',
      joining_date: staff.joining_date || '',
      salary: staff.salary || 0,
      bank_name: staff.bank_name || '',
      account_number: staff.account_number || '',
      ifsc_code: staff.ifsc_code || '',
      pan_number: staff.pan_number || '',
      address: staff.address || '',
      emergency_contact: staff.emergency_contact || '',
      qualification: staff.qualification || '',
      experience_years: staff.experience_years || 0,
      is_active: staff.is_active,
    });
    setDialogOpen(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      await schoolAdminApi.staff.update(id, { is_active: false });
      showSnackbar('Staff deactivated successfully', 'success');
      loadStaff();
    } catch (error) {
      showSnackbar('Failed to deactivate staff', 'error');
    }
  };

  const handleSave = async () => {
    try {
      if (editingStaff) {
        await schoolAdminApi.staff.update(editingStaff.id, formData);
        showSnackbar('Staff updated successfully', 'success');
      } else {
        await schoolAdminApi.staff.create(formData);
        showSnackbar('Staff created successfully', 'success');
      }
      setDialogOpen(false);
      loadStaff();
    } catch (error) {
      showSnackbar('Failed to save staff', 'error');
    }
  };

  const handleBulkImport = async () => {
    if (!selectedFile) {
      showSnackbar('Please select a CSV file', 'error');
      return;
    }

    try {
      const result = await schoolAdminApi.staff.bulkImport(selectedFile);
      showSnackbar(
        `Successfully imported ${result.imported} staff members. Failed: ${result.failed}`,
        result.failed > 0 ? 'info' : 'success'
      );
      setUploadDialogOpen(false);
      setSelectedFile(null);
      loadStaff();
    } catch (error) {
      showSnackbar('Failed to import staff', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await schoolAdminApi.staff.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'staff_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Template downloaded', 'success');
    } catch (error) {
      showSnackbar('Failed to download template', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'employee_id', headerName: 'Employee ID', width: 130 },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      valueGetter: (params: { row: { first_name: string; last_name: string } }) =>
        `${params.row.first_name} ${params.row.last_name}`,
    },
    { field: 'designation', headerName: 'Designation', width: 150 },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <ActiveIcon /> : <InactiveIcon />}
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<ViewIcon />}
          label="View"
          onClick={() => handleView(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          key="deactivate"
          icon={<DeactivateIcon />}
          label="Deactivate"
          onClick={() => handleDeactivate(params.row.id)}
          disabled={!params.row.is_active}
        />,
      ],
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Staff Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage non-teaching staff members, track their information, and process bulk imports
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name, employee ID, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Bulk Import CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Add Staff
          </Button>
        </Box>

        <DataGrid
          rows={staff}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalRows}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50, 100]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewMode ? 'View Staff Details' : editingStaff ? 'Edit Staff' : 'Add Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                disabled={viewMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Employment Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Joining Date"
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Experience (Years)"
                type="number"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData({ ...formData, experience_years: Number(e.target.value) })
                }
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                disabled={viewMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Bank Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                disabled={viewMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                disabled={viewMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
                disabled={viewMode}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{viewMode ? 'Close' : 'Cancel'}</Button>
          {!viewMode && (
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bulk Import Staff from CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Download the template CSV file, fill in the staff details, and upload it here.
            </Alert>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              fullWidth
              sx={{ mb: 2 }}
            >
              Download CSV Template
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outlined" component="span" fullWidth>
                {selectedFile ? selectedFile.name : 'Choose CSV File'}
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkImport} variant="contained" disabled={!selectedFile}>
            Import
          </Button>
        </DialogActions>
      </Dialog>

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

export default StaffManagement;
