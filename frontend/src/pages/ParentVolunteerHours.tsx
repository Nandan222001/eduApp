import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { volunteerApi } from '@/api/volunteer';
import type { VolunteerActivityForm } from '@/types/volunteer';

export const ParentVolunteerHours: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [formData, setFormData] = useState<VolunteerActivityForm>({
    activity_name: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    supervisor_name: '',
    supervisor_email: '',
    supervisor_phone: '',
    description: '',
    location: '',
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['volunteer-activities'],
    queryFn: volunteerApi.getMyActivities,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['volunteer-summary'],
    queryFn: volunteerApi.getMySummary,
  });

  const logMutation = useMutation({
    mutationFn: volunteerApi.logActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-summary'] });
      setOpenDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VolunteerActivityForm> }) =>
      volunteerApi.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-summary'] });
      setOpenDialog(false);
      resetForm();
      setSelectedActivity(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: volunteerApi.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-summary'] });
    },
  });

  const downloadCertificate = async () => {
    const blob = await volunteerApi.downloadCertificate();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteer-certificate-${new Date().getFullYear()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetForm = () => {
    setFormData({
      activity_name: '',
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      supervisor_name: '',
      supervisor_email: '',
      supervisor_phone: '',
      description: '',
      location: '',
    });
  };

  const handleOpenDialog = (activityId?: number) => {
    if (activityId && activities) {
      const activity = activities.find((a) => a.id === activityId);
      if (activity) {
        setFormData({
          activity_name: activity.activity_name,
          date: activity.date,
          hours: activity.hours,
          supervisor_name: activity.supervisor_name,
          supervisor_email: activity.supervisor_email || '',
          supervisor_phone: activity.supervisor_phone || '',
          description: activity.description || '',
          location: activity.location || '',
        });
        setSelectedActivity(activityId);
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
    setSelectedActivity(null);
  };

  const handleSubmit = () => {
    if (selectedActivity) {
      updateMutation.mutate({ id: selectedActivity, data: formData });
    } else {
      logMutation.mutate(formData);
    }
  };

  const handleDelete = (activityId: number) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteMutation.mutate(activityId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (activitiesLoading || summaryLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const progressPercentage = summary?.next_milestone
    ? (summary.approved_hours / summary.next_milestone.target_hours) * 100
    : 100;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Volunteer Hours Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Log and track your volunteer contributions to the school community
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadCertificate}
              disabled={!summary || summary.approved_hours === 0}
            >
              Download Certificate
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Log Hours
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title="Hours Dashboard"
                subheader="Track your progress toward volunteer milestones"
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight={700} color="primary">
                        {summary?.total_hours || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Hours
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight={700} color="success.main">
                        {summary?.approved_hours || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight={700} color="warning.main">
                        {summary?.pending_hours || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight={700} color="error.main">
                        {summary?.rejected_hours || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rejected
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {summary?.next_milestone && (
                  <Box sx={{ mt: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        Next Milestone: {summary.next_milestone.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {summary.approved_hours} / {summary.next_milestone.target_hours} hours
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(progressPercentage, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {summary.next_milestone.hours_needed} hours remaining
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    Milestones Achieved
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {summary?.milestones
                      .filter((m) => m.achieved)
                      .map((milestone, index) => (
                        <Chip
                          key={index}
                          icon={<TrophyIcon />}
                          label={`${milestone.milestone} (${milestone.target_hours}h)`}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Hours by Activity Type" />
              <CardContent>
                {summary?.activities_by_type && summary.activities_by_type.length > 0 ? (
                  <Stack spacing={2}>
                    {summary.activities_by_type.map((activity, index) => (
                      <Box key={index}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2">{activity.activity_type}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {activity.hours}h
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(activity.hours / (summary.total_hours || 1)) * 100}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {activity.count} {activity.count === 1 ? 'activity' : 'activities'}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No activities logged yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardHeader
            title="My Volunteer Activities"
            subheader="View all your logged volunteer hours"
          />
          <CardContent>
            {activities && activities.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Activity</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Hours</TableCell>
                      <TableCell>Supervisor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Verified By</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {activity.activity_name}
                          </Typography>
                          {activity.description && (
                            <Typography variant="caption" color="text.secondary">
                              {activity.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {activity.hours}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{activity.supervisor_name}</Typography>
                          {activity.supervisor_email && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {activity.supervisor_email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(activity.status)}
                            label={activity.status}
                            color={
                              getStatusColor(activity.status) as
                                | 'success'
                                | 'warning'
                                | 'error'
                                | 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {activity.verified_by ? (
                            <>
                              <Typography variant="body2">{activity.verified_by}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.verified_at!).toLocaleDateString()}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {activity.status === 'pending' && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(activity.id)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(activity.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {activity.rejection_reason && (
                              <Tooltip title={`Reason: ${activity.rejection_reason}`}>
                                <IconButton size="small" color="info">
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No volunteer activities logged yet. Click &quot;Log Hours&quot; to get started!
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedActivity ? 'Edit Activity' : 'Log Volunteer Hours'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Activity Name"
                value={formData.activity_name}
                onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Hours"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                inputProps={{ min: 0, step: 0.5 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Supervisor Name"
                value={formData.supervisor_name}
                onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="email"
                label="Supervisor Email"
                value={formData.supervisor_email}
                onChange={(e) => setFormData({ ...formData, supervisor_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Supervisor Phone"
                value={formData.supervisor_phone}
                onChange={(e) => setFormData({ ...formData, supervisor_phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.activity_name ||
              !formData.date ||
              !formData.hours ||
              !formData.supervisor_name ||
              logMutation.isPending ||
              updateMutation.isPending
            }
          >
            {selectedActivity ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ParentVolunteerHours;
