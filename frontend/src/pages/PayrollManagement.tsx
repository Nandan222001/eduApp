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
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  CheckCircle as PaidIcon,
  Pending as PendingIcon,
  Description as DescriptionIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import schoolAdminApi, {
  PayrollRecord,
  PayrollRecordCreate,
  PayrollRecordUpdate,
  PayrollSummary,
} from '../api/schoolAdmin';

export const PayrollManagement: React.FC = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<PayrollRecordCreate>({
    staff_id: 0,
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    basic_salary: 0,
    hra: 0,
    da: 0,
    allowances: 0,
    deductions: 0,
  });

  useEffect(() => {
    loadPayrolls();
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, selectedMonth]);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await schoolAdminApi.payroll.list({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        month,
        year: Number(year),
      });
      setPayrolls(response.items);
      setTotalRows(response.total);
    } catch (error) {
      showSnackbar('Failed to load payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const summaryData = await schoolAdminApi.payroll.getSummary(month, Number(year));
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load summary', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEdit = (payroll: PayrollRecord) => {
    setEditingPayroll(payroll);
    setFormData({
      staff_id: payroll.staff_id,
      month: payroll.month,
      year: payroll.year,
      basic_salary: payroll.basic_salary,
      hra: payroll.hra || 0,
      da: payroll.da || 0,
      allowances: payroll.allowances || 0,
      deductions: payroll.deductions || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPayroll) {
        const updateData: PayrollRecordUpdate = {
          basic_salary: formData.basic_salary,
          hra: formData.hra,
          da: formData.da,
          allowances: formData.allowances,
          deductions: formData.deductions,
        };
        await schoolAdminApi.payroll.update(editingPayroll.id, updateData);
        showSnackbar('Payroll updated successfully', 'success');
        setDialogOpen(false);
        loadPayrolls();
        loadSummary();
      }
    } catch (error) {
      showSnackbar('Failed to save payroll', 'error');
    }
  };

  const handleGeneratePayroll = async () => {
    if (!confirm('Generate payroll for all active staff for the selected month?')) return;

    try {
      const [year, month] = selectedMonth.split('-');
      const result = await schoolAdminApi.payroll.generatePayroll({
        month,
        year: Number(year),
      });
      showSnackbar(result.message, 'success');
      loadPayrolls();
      loadSummary();
    } catch (error) {
      showSnackbar('Failed to generate payroll', 'error');
    }
  };

  const handleBulkProcess = async () => {
    if (selectedRows.length === 0) {
      showSnackbar('Please select payroll records to process', 'error');
      return;
    }

    if (!confirm(`Mark ${selectedRows.length} payroll records as paid?`)) return;

    try {
      await schoolAdminApi.payroll.bulkUpdate({
        payroll_ids: selectedRows as number[],
        payment_status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
      });
      showSnackbar('Payroll records marked as paid', 'success');
      setSelectedRows([]);
      loadPayrolls();
      loadSummary();
    } catch (error) {
      showSnackbar('Failed to process payroll', 'error');
    }
  };

  const handleDownloadPayslip = async (id: number, staffName: string) => {
    try {
      const blob = await schoolAdminApi.payroll.generatePayslip(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${staffName.replace(/\s+/g, '_')}_${selectedMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Payslip downloaded', 'success');
    } catch (error) {
      showSnackbar('Failed to download payslip', 'error');
    }
  };

  const handleExportReport = async (format: 'excel' | 'pdf') => {
    try {
      const [year, month] = selectedMonth.split('-');
      const blob = await schoolAdminApi.payroll.exportReport(month, Number(year), format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_report_${selectedMonth}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Report exported successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to export report', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: GridColDef[] = [
    { field: 'employee_id', headerName: 'Employee ID', width: 120 },
    { field: 'staff_name', headerName: 'Staff Name', width: 180 },
    { field: 'department', headerName: 'Department', width: 130 },
    {
      field: 'basic_salary',
      headerName: 'Basic',
      width: 110,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'hra',
      headerName: 'HRA',
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value || 0),
    },
    {
      field: 'da',
      headerName: 'DA',
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value || 0),
    },
    {
      field: 'deductions',
      headerName: 'Deductions',
      width: 110,
      valueFormatter: (params) => formatCurrency(params.value || 0),
    },
    {
      field: 'gross_salary',
      headerName: 'Gross',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'net_salary',
      headerName: 'Net Salary',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'paid' ? <PaidIcon /> : <PendingIcon />}
          label={params.value}
          color={params.value === 'paid' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          key="download"
          icon={<DownloadIcon />}
          label="Download Payslip"
          onClick={() => handleDownloadPayslip(params.row.id, params.row.staff_name)}
        />,
      ],
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Payroll Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate and manage staff payroll, process payments, and export reports
        </Typography>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Staff
                </Typography>
                <Typography variant="h5">{summary.total_staff}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Gross
                </Typography>
                <Typography variant="h5">{formatCurrency(summary.total_gross)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Deductions
                </Typography>
                <Typography variant="h5">{formatCurrency(summary.total_deductions)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Net
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatCurrency(summary.total_net)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {summary.department_breakdown.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Department-wise Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    {summary.department_breakdown.map((dept) => (
                      <Grid item xs={12} sm={6} md={4} key={dept.department}>
                        <Box
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" color="primary">
                            {dept.department}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Staff: {dept.staff_count}
                          </Typography>
                          <Typography variant="body2">
                            Gross: {formatCurrency(dept.total_gross)}
                          </Typography>
                          <Typography variant="body2">
                            Net: {formatCurrency(dept.total_net)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Select Month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleGeneratePayroll}
            startIcon={<AddIcon />}
          >
            Generate Payroll
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleBulkProcess}
            disabled={selectedRows.length === 0}
            startIcon={<PaidIcon />}
          >
            Mark as Paid ({selectedRows.length})
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Export to Excel">
            <IconButton onClick={() => handleExportReport('excel')} color="primary">
              <DescriptionIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to PDF">
            <IconButton onClick={() => handleExportReport('pdf')} color="primary">
              <ExportIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <DataGrid
          rows={payrolls}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalRows}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50, 100]}
          autoHeight
          checkboxSelection
          onRowSelectionModelChange={setSelectedRows}
          rowSelectionModel={selectedRows}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payroll Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Staff ID"
                type="number"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: Number(e.target.value) })}
                disabled={!!editingPayroll}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={!!editingPayroll}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                disabled={!!editingPayroll}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Salary Components
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="HRA"
                type="number"
                value={formData.hra}
                onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DA"
                type="number"
                value={formData.da}
                onChange={(e) => setFormData({ ...formData, da: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Other Allowances"
                type="number"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Gross Salary:</strong>{' '}
                  {formatCurrency(
                    formData.basic_salary +
                      (formData.hra || 0) +
                      (formData.da || 0) +
                      (formData.allowances || 0)
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Net Salary:</strong>{' '}
                  {formatCurrency(
                    formData.basic_salary +
                      (formData.hra || 0) +
                      (formData.da || 0) +
                      (formData.allowances || 0) -
                      (formData.deductions || 0)
                  )}
                </Typography>
              </Alert>
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

export default PayrollManagement;
