import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Collapse,
  Divider,
  Grid,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { volunteerApi } from '@/api/volunteer';
import type { VerificationRequest } from '@/types/volunteer';

export const TeacherVolunteerVerification: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data: pendingActivities, isLoading } = useQuery({
    queryKey: ['pending-volunteer-verifications'],
    queryFn: volunteerApi.getPendingVerifications,
  });

  const verifyMutation = useMutation({
    mutationFn: volunteerApi.verifyActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-volunteer-verifications'] });
      setVerificationDialog(false);
      setSelectedActivity(null);
      setNotes('');
      setRejectionReason('');
    },
  });

  const handleOpenVerification = (activityId: number, status: 'approved' | 'rejected') => {
    setSelectedActivity(activityId);
    setVerificationStatus(status);
    setVerificationDialog(true);
  };

  const handleCloseVerification = () => {
    setVerificationDialog(false);
    setSelectedActivity(null);
    setNotes('');
    setRejectionReason('');
  };

  const handleSubmitVerification = () => {
    if (!selectedActivity) return;

    const request: VerificationRequest = {
      activity_id: selectedActivity,
      status: verificationStatus,
      notes: notes || undefined,
      rejection_reason: verificationStatus === 'rejected' ? rejectionReason : undefined,
    };

    verifyMutation.mutate(request);
  };

  const toggleRowExpansion = (activityId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const selectedActivityData = pendingActivities?.find((a) => a.id === selectedActivity);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Volunteer Hour Verification
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and verify parent volunteer hour submissions
          </Typography>
        </Box>

        <Card>
          <CardHeader
            title={`Pending Verifications (${pendingActivities?.length || 0})`}
            subheader="Review volunteer activities awaiting approval"
          />
          <CardContent>
            {pendingActivities && pendingActivities.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}></TableCell>
                      <TableCell>Parent</TableCell>
                      <TableCell>Activity</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Hours</TableCell>
                      <TableCell>Supervisor</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingActivities.map((activity) => (
                      <React.Fragment key={activity.id}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(activity.id)}
                            >
                              {expandedRows.has(activity.id) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {activity.parent_name}
                            </Typography>
                            {activity.student_name && (
                              <Typography variant="caption" color="text.secondary">
                                Student: {activity.student_name}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {activity.activity_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${activity.hours}h`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
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
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleOpenVerification(activity.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => handleOpenVerification(activity.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                            <Collapse
                              in={expandedRows.has(activity.id)}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ py: 2, px: 3, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                  Activity Details
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                  {activity.description && (
                                    <Grid item xs={12}>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <DescriptionIcon
                                          fontSize="small"
                                          color="action"
                                          sx={{ mt: 0.5 }}
                                        />
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            Description
                                          </Typography>
                                          <Typography variant="body2">
                                            {activity.description}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>
                                  )}
                                  {activity.location && (
                                    <Grid item xs={12} sm={6}>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <LocationIcon fontSize="small" color="action" />
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            Location
                                          </Typography>
                                          <Typography variant="body2">
                                            {activity.location}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>
                                  )}
                                  {activity.supervisor_phone && (
                                    <Grid item xs={12} sm={6}>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <PersonIcon fontSize="small" color="action" />
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            Supervisor Contact
                                          </Typography>
                                          <Typography variant="body2">
                                            {activity.supervisor_phone}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No pending volunteer hour verifications at this time.</Alert>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={verificationDialog} onClose={handleCloseVerification} maxWidth="sm" fullWidth>
        <DialogTitle>
          {verificationStatus === 'approved' ? 'Approve' : 'Reject'} Volunteer Hours
        </DialogTitle>
        <DialogContent>
          {selectedActivityData && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Parent
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedActivityData.parent_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" color="text.secondary">
                      Activity
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedActivityData.activity_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Hours
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedActivityData.hours}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedActivityData.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Supervisor
                    </Typography>
                    <Typography variant="body1">{selectedActivityData.supervisor_name}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {verificationStatus === 'rejected' && (
            <TextField
              fullWidth
              label="Rejection Reason"
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              sx={{ mb: 2 }}
              helperText="Please provide a reason for rejection"
            />
          )}

          <TextField
            fullWidth
            label="Additional Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional comments or feedback..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerification}>Cancel</Button>
          <Button
            onClick={handleSubmitVerification}
            variant="contained"
            color={verificationStatus === 'approved' ? 'success' : 'error'}
            disabled={
              verifyMutation.isPending ||
              (verificationStatus === 'rejected' && !rejectionReason.trim())
            }
          >
            {verificationStatus === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherVolunteerVerification;
