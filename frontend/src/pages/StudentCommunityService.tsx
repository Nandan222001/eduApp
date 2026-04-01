import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  LinearProgress,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Groups as GroupsIcon,
  CalendarMonth as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Email as EmailIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import communityServiceApi from '@/api/communityService';
import {
  ServiceLog,
  ServicePortfolio,
  ServiceCategory,
  VerificationStatus,
  OrganizationContact,
} from '@/types/communityService';
import ServiceLogFormDialog from '@/components/communityService/ServiceLogFormDialog';
import OrganizationManagerDialog from '@/components/communityService/OrganizationManagerDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export default function StudentCommunityService() {
  const [activeTab, setActiveTab] = useState(0);
  const [portfolio, setPortfolio] = useState<ServicePortfolio | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ServiceLog | null>(null);
  const [viewLogOpen, setViewLogOpen] = useState(false);
  const [orgManagerOpen, setOrgManagerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfolioData, logsData, orgsData] = await Promise.all([
        communityServiceApi.getMyPortfolio(),
        communityServiceApi.getMyServiceLogs(),
        communityServiceApi.getMyOrganizations(),
      ]);
      setPortfolio(portfolioData);
      setServiceLogs(logsData);
      setOrganizations(orgsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load community service data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = () => {
    setSelectedLog(null);
    setLogFormOpen(true);
  };

  const handleEditLog = (log: ServiceLog) => {
    setSelectedLog(log);
    setLogFormOpen(true);
  };

  const handleDeleteLog = async (logId: number) => {
    if (window.confirm('Are you sure you want to delete this service log?')) {
      try {
        await communityServiceApi.deleteServiceLog(logId);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete log:', err);
        alert('Failed to delete service log');
      }
    }
  };

  const handleViewLog = (log: ServiceLog) => {
    setSelectedLog(log);
    setViewLogOpen(true);
  };

  const handleResendVerification = async (logId: number) => {
    try {
      await communityServiceApi.resendVerificationEmail(logId);
      alert('Verification email sent successfully');
    } catch (err) {
      console.error('Failed to resend verification:', err);
      alert('Failed to send verification email');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const blob = await communityServiceApi.downloadCertificate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'service-hours-certificate.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('Failed to download certificate');
    }
  };

  const getVerificationStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return 'success';
      case VerificationStatus.VERIFIED:
        return 'success';
      case VerificationStatus.PENDING:
        return 'warning';
      case VerificationStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getVerificationStatusIcon = (status: VerificationStatus): React.ReactElement | null => {
    switch (status) {
      case VerificationStatus.APPROVED:
      case VerificationStatus.VERIFIED:
        return <CheckCircleIcon />;
      case VerificationStatus.PENDING:
        return <PendingIcon />;
      case VerificationStatus.REJECTED:
        return <CancelIcon />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: ServiceCategory) => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Community Service Tracker
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<GroupsIcon />}
            onClick={() => setOrgManagerOpen(true)}
          >
            Organizations
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCertificate}
          >
            Download Certificate
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddLog}>
            Log Activity
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Hours
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {portfolio?.total_hours || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                  <CalendarIcon color="primary" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Approved Hours
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {portfolio?.approved_hours || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                  <CheckCircleIcon color="success" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Beneficiaries Served
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {portfolio?.impact_summary.total_beneficiaries || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                  <GroupsIcon color="info" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Activities Completed
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {portfolio?.impact_summary.activities_completed || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1) }}>
                  <TrophyIcon color="warning" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Toward Requirement */}
      {portfolio?.progress_toward_requirement && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Graduation Requirement Progress"
            subheader={`${portfolio.progress_toward_requirement.required_hours} hours required`}
          />
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {portfolio.progress_toward_requirement.completed_hours} /{' '}
                  {portfolio.progress_toward_requirement.required_hours} hours (
                  {portfolio.progress_toward_requirement.percentage.toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(portfolio.progress_toward_requirement.percentage, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                }}
              />
            </Box>
            {portfolio.progress_toward_requirement.is_completed && (
              <Alert severity="success" icon={<TrophyIcon />}>
                Congratulations! You&apos;ve completed your community service requirement!
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Service Portfolio" />
          <Tab label="Activity Log" />
          <Tab label="Verification Status" />
          <Tab label="Impact Summary" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Hours by Category */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Hours by Category" />
                <CardContent>
                  <List>
                    {portfolio?.hours_by_category.map((cat) => (
                      <ListItem key={cat.category} sx={{ px: 0 }}>
                        <ListItemText
                          primary={getCategoryLabel(cat.category)}
                          secondary={`${cat.hours} hours (${cat.percentage.toFixed(1)}%)`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={cat.percentage}
                          sx={{ width: 100, ml: 2 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Skills Gained */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Skills Gained" />
                <CardContent>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {portfolio?.impact_summary.skills_gained.map((skill, index) => (
                      <Chip key={index} label={skill} color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Timeline */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Service Timeline" />
                <CardContent>
                  <List>
                    {portfolio?.timeline.slice(0, 10).map((log) => (
                      <ListItem
                        key={log.id}
                        sx={{ px: 0 }}
                        secondaryAction={
                          <Chip
                            size="small"
                            label={log.hours + ' hrs'}
                            color="primary"
                            variant="outlined"
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar>{getVerificationStatusIcon(log.verification_status)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={log.activity_name}
                          secondary={`${log.organization_name} • ${format(
                            parseISO(log.start_date),
                            'MMM d, yyyy'
                          )}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Activity</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.activity_name}</TableCell>
                    <TableCell>{log.organization_name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={getCategoryLabel(log.category)} />
                    </TableCell>
                    <TableCell>{format(parseISO(log.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell align="right">{log.hours}</TableCell>
                    <TableCell>
                      {(() => {
                        const icon = getVerificationStatusIcon(log.verification_status);
                        return (
                          <Chip
                            size="small"
                            label={log.verification_status}
                            color={getVerificationStatusColor(log.verification_status)}
                            {...(icon && { icon })}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewLog(log)}>
                        <ViewIcon />
                      </IconButton>
                      {log.verification_status === VerificationStatus.PENDING && (
                        <>
                          <IconButton size="small" onClick={() => handleEditLog(log)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteLog(log.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    {portfolio?.verification_stats.pending || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Verification
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {portfolio?.verification_stats.approved || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="error.main">
                    {portfolio?.verification_stats.rejected || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Pending Verifications" />
            <CardContent>
              <List>
                {serviceLogs
                  .filter((log) => log.verification_status === VerificationStatus.PENDING)
                  .map((log) => (
                    <ListItem
                      key={log.id}
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<EmailIcon />}
                          onClick={() => handleResendVerification(log.id)}
                        >
                          Resend Email
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={log.activity_name}
                        secondary={`${log.organization_name} • ${log.organization_contact_email || 'No email'}`}
                      />
                    </ListItem>
                  ))}
              </List>
              {serviceLogs.filter((log) => log.verification_status === VerificationStatus.PENDING)
                .length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No pending verifications
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Impact Summary" />
                <CardContent>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Total Beneficiaries Served"
                        secondary={portfolio?.impact_summary.total_beneficiaries}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Organizations Served"
                        secondary={portfolio?.impact_summary.organizations_served}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Activities Completed"
                        secondary={portfolio?.impact_summary.activities_completed}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Organizations" />
                <CardContent>
                  <List>
                    {organizations.slice(0, 5).map((org) => (
                      <ListItem key={org.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar>{org.organization_name.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={org.organization_name}
                          secondary={`${org.total_hours} hours • ${org.activities_count} activities`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <ServiceLogFormDialog
        open={logFormOpen}
        onClose={() => {
          setLogFormOpen(false);
          setSelectedLog(null);
        }}
        onSuccess={fetchData}
        log={selectedLog}
        organizations={organizations}
      />

      <Dialog
        open={viewLogOpen}
        onClose={() => {
          setViewLogOpen(false);
          setSelectedLog(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedLog && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedLog.activity_name}
                <IconButton onClick={() => setViewLogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Organization
                  </Typography>
                  <Typography variant="body1">{selectedLog.organization_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip label={getCategoryLabel(selectedLog.category)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hours
                  </Typography>
                  <Typography variant="body1">{selectedLog.hours}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {format(parseISO(selectedLog.start_date), 'MMM d, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {format(parseISO(selectedLog.end_date), 'MMM d, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{selectedLog.description}</Typography>
                </Grid>
                {selectedLog.reflection_essay && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reflection Essay
                    </Typography>
                    <Typography variant="body1">{selectedLog.reflection_essay}</Typography>
                  </Grid>
                )}
                {selectedLog.beneficiaries_served && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Beneficiaries Served
                    </Typography>
                    <Typography variant="body1">{selectedLog.beneficiaries_served}</Typography>
                  </Grid>
                )}
                {selectedLog.skills_developed.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Skills Developed
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {selectedLog.skills_developed.map((skill, index) => (
                        <Chip key={index} label={skill} size="small" />
                      ))}
                    </Stack>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Verification Status
                  </Typography>
                  {(() => {
                    const icon = getVerificationStatusIcon(selectedLog.verification_status);
                    return (
                      <Chip
                        label={selectedLog.verification_status}
                        color={getVerificationStatusColor(selectedLog.verification_status)}
                        {...(icon && { icon })}
                      />
                    );
                  })()}
                </Grid>
                {selectedLog.verified_by && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Verified By
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.verified_by} on{' '}
                      {selectedLog.verified_at &&
                        format(parseISO(selectedLog.verified_at), 'MMM d, yyyy')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      <OrganizationManagerDialog
        open={orgManagerOpen}
        onClose={() => setOrgManagerOpen(false)}
        onSuccess={fetchData}
        organizations={organizations}
      />
    </Container>
  );
}
