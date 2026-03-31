import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  useTheme,
  alpha,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  LocalAtm as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import superAdminApi, { InstitutionDetails } from '@/api/superAdmin';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';
import UsageMetricsPanel from './UsageMetricsPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function InstitutionDetail() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [institutionData, setInstitutionData] = useState<InstitutionDetails | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInstitutionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInstitutionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use demo data API if user is demo user, otherwise use real API
      const data = isDemoUser()
        ? await demoDataApi.superAdmin.getInstitutionDetails(Number(id))
        : await superAdminApi.getInstitutionDetails(Number(id));

      setInstitutionData(data);
      setEditFormData({
        name: data.institution.name,
        slug: data.institution.slug,
        domain: data.institution.domain,
        description: data.institution.description,
        is_active: data.institution.is_active,
        max_users: data.institution.max_users,
      });
    } catch (err) {
      setError('Failed to load institution details. Please try again.');
      console.error('Error fetching institution details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);

      // Use demo data API if user is demo user, otherwise use real API
      if (isDemoUser()) {
        await demoDataApi.superAdmin.updateInstitution(Number(id), editFormData);
      } else {
        await superAdminApi.updateInstitution(Number(id), editFormData);
      }

      setEditDialogOpen(false);
      fetchInstitutionDetails();
    } catch (err) {
      console.error('Error updating institution:', err);
      alert('Failed to update institution. Please try again.');
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
        <Alert severity="error">{error || 'Institution not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/super-admin/institutions')}
          sx={{ mt: 2 }}
        >
          Back to Institutions
        </Button>
      </Box>
    );
  }

  const { institution, subscription, stats } = institutionData;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/super-admin/institutions')}>
          Back to Institutions
        </Button>
      </Box>

      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {institution.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={institution.slug} size="small" variant="outlined" />
            {institution.is_active ? (
              <Chip label="Active" color="success" size="small" icon={<CheckCircleIcon />} />
            ) : (
              <Chip label="Inactive" color="default" size="small" />
            )}
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setEditDialogOpen(true)}
        >
          Edit Institution
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mr: 2,
                  }}
                >
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.active_users} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    mr: 2,
                  }}
                >
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.student_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.teacher_count} teachers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    mr: 2,
                  }}
                >
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{(stats.total_revenue / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    mr: 2,
                  }}
                >
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {subscription ? subscription.plan_name : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plan
                  </Typography>
                </Box>
              </Box>
              {subscription && (
                <Chip
                  label={subscription.status}
                  size="small"
                  color={subscription.status === 'active' ? 'success' : 'default'}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Profile Information" />
          <Tab label="Subscription" />
          <Tab label="Usage & Analytics" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Institution Name
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {institution.name}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Slug
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {institution.slug}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Domain
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {institution.domain || 'Not set'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Max Users
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {institution.max_users || 'Unlimited'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" gutterBottom>
                {institution.description || 'No description provided'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Created At
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {new Date(institution.created_at).toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {new Date(institution.updated_at).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {subscription ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Plan Name
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {subscription.plan_name}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={subscription.status}
                  color={subscription.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Billing Cycle
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {subscription.billing_cycle}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Price
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  ₹{subscription.price}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {new Date(subscription.start_date).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  End Date
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {subscription.end_date
                    ? new Date(subscription.end_date).toLocaleDateString()
                    : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/super-admin/institutions/${id}/subscription`)}
                >
                  Manage Subscription
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">No active subscription for this institution</Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            <UsageMetricsPanel institutionId={Number(id)} />
            <Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/super-admin/institutions/${id}/analytics`)}
              >
                View Detailed Analytics
              </Button>
            </Box>
          </Stack>
        </TabPanel>
      </Paper>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Institution</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Institution Name"
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Slug"
              value={editFormData.slug || ''}
              onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
              fullWidth
            />
            <TextField
              label="Domain"
              value={editFormData.domain || ''}
              onChange={(e) => setEditFormData({ ...editFormData, domain: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={editFormData.description || ''}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Max Users"
              type="number"
              value={editFormData.max_users || ''}
              onChange={(e) =>
                setEditFormData({ ...editFormData, max_users: parseInt(e.target.value) })
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(editFormData.is_active)}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, is_active: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
