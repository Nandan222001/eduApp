import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import superAdminApi, { InstitutionDetails, BillingHistoryItem } from '@/api/superAdmin';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

export default function InstitutionSubscription() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [institutionData, setInstitutionData] = useState<InstitutionDetails | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subscriptionFormData, setSubscriptionFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use demo data API if user is demo user, otherwise use real API
      const [details, billing] = isDemoUser()
        ? await Promise.all([
            demoDataApi.superAdmin.getInstitutionDetails(Number(id)),
            demoDataApi.superAdmin.getBillingHistory(Number(id)),
          ])
        : await Promise.all([
            superAdminApi.getInstitutionDetails(Number(id)),
            superAdminApi.getBillingHistory(Number(id)),
          ]);

      setInstitutionData(details);
      setBillingHistory(billing.billing_history);

      if (details.subscription) {
        setSubscriptionFormData({
          plan_name: details.subscription.plan_name,
          billing_cycle: details.subscription.billing_cycle,
          price: details.subscription.price,
          auto_renew: true,
        });
      }
    } catch (err) {
      setError('Failed to load subscription data. Please try again.');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      setSaving(true);

      // Use demo data API if user is demo user, otherwise use real API
      if (isDemoUser()) {
        await demoDataApi.superAdmin.updateSubscription(Number(id), subscriptionFormData);
      } else {
        await superAdminApi.updateSubscription(Number(id), subscriptionFormData);
      }

      setEditDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !institutionData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Data not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/super-admin/institutions/${id}`)}
          sx={{ mt: 2 }}
        >
          Back to Institution
        </Button>
      </Box>
    );
  }

  const { institution, subscription } = institutionData;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/super-admin/institutions/${id}`)}
        >
          Back to Institution
        </Button>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Subscription Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {institution.name}
          </Typography>
        </Box>
        {subscription && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Update Subscription
          </Button>
        )}
      </Box>

      {subscription ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Current Plan
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                    {subscription.plan_name}
                  </Typography>
                  <Chip
                    label={subscription.status}
                    color={subscription.status === 'active' ? 'success' : 'default'}
                    size="small"
                    icon={subscription.status === 'active' ? <CheckCircleIcon /> : <CancelIcon />}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Billing Cycle
                  </Typography>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {subscription.billing_cycle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₹{subscription.price} per{' '}
                    {subscription.billing_cycle === 'monthly'
                      ? 'month'
                      : subscription.billing_cycle === 'yearly'
                        ? 'year'
                        : 'quarter'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Subscription Period
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    Start: {new Date(subscription.start_date).toLocaleDateString()}
                  </Typography>
                  {subscription.end_date && (
                    <Typography variant="body1" fontWeight={600}>
                      End: {new Date(subscription.end_date).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mb: 4, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Subscription Details
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Plan Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {subscription.plan_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={subscription.status}
                  color={subscription.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Billing Cycle
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {subscription.billing_cycle}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Price
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  ₹{subscription.price}
                </Typography>
              </Grid>
              {subscription.trial_end_date && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Trial End Date
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(subscription.trial_end_date).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 4 }}>
          No active subscription for this institution
        </Alert>
      )}

      <Paper sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
              mr: 2,
            }}
          >
            <ReceiptIcon />
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            Billing History
          </Typography>
        </Box>

        {billingHistory.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice/Payment ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Paid At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {item.invoice_number ? (
                        <>
                          <ReceiptIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {item.invoice_number}
                        </>
                      ) : (
                        <>
                          <PaymentIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />#
                          {item.payment_id}
                        </>
                      )}
                    </TableCell>
                    <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={
                          item.status === 'paid'
                            ? 'success'
                            : item.status === 'pending'
                              ? 'warning'
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.payment_method || '-'}</TableCell>
                    <TableCell>
                      {item.paid_at ? new Date(item.paid_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No billing history available
          </Typography>
        )}
      </Paper>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Subscription</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Plan Name</InputLabel>
              <Select
                value={subscriptionFormData.plan_name || ''}
                onChange={(e) =>
                  setSubscriptionFormData({ ...subscriptionFormData, plan_name: e.target.value })
                }
                label="Plan Name"
              >
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Pro">Pro</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Billing Cycle</InputLabel>
              <Select
                value={subscriptionFormData.billing_cycle || ''}
                onChange={(e) =>
                  setSubscriptionFormData({
                    ...subscriptionFormData,
                    billing_cycle: e.target.value,
                  })
                }
                label="Billing Cycle"
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Price (₹)"
              type="number"
              value={subscriptionFormData.price || ''}
              onChange={(e) =>
                setSubscriptionFormData({
                  ...subscriptionFormData,
                  price: parseFloat(e.target.value),
                })
              }
              fullWidth
            />

            <TextField
              label="Max Users"
              type="number"
              value={subscriptionFormData.max_users || ''}
              onChange={(e) =>
                setSubscriptionFormData({
                  ...subscriptionFormData,
                  max_users: parseInt(e.target.value) || undefined,
                })
              }
              fullWidth
            />

            <TextField
              label="Max Storage (GB)"
              type="number"
              value={subscriptionFormData.max_storage_gb || ''}
              onChange={(e) =>
                setSubscriptionFormData({
                  ...subscriptionFormData,
                  max_storage_gb: parseInt(e.target.value) || undefined,
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSubscription} variant="contained" disabled={saving}>
            {saving ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
