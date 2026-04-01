import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Breadcrumbs,
  Link,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as SafeIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import { StudentEmployment, WorkPermit } from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';

interface StudentWorkHourData {
  student_id: number;
  student_name: string;
  current_weekly_hours: number;
  max_allowed_hours: number;
  permit_id?: number;
  employment_count: number;
  is_at_risk: boolean;
  percentage_of_max: number;
}

export default function WorkHourMonitoring() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myHourData, setMyHourData] = useState<StudentWorkHourData | null>(null);
  const [employments, setEmployments] = useState<StudentEmployment[]>([]);
  const [workPermit, setWorkPermit] = useState<WorkPermit | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const studentId = parseInt(user.id);

      const [jobs, permits] = await Promise.all([
        employmentApi.getStudentEmployments(studentId, true),
        employmentApi.getStudentWorkPermits(studentId, true),
      ]);

      setEmployments(jobs);

      if (permits.length > 0) {
        const activePermit =
          permits.find((p) => p.school_authorization_status === 'approved') || permits[0];
        setWorkPermit(activePermit);

        const currentWeeklyHours = jobs.reduce((sum, job) => sum + (job.hours_per_week || 0), 0);
        const maxHours = activePermit.max_hours_per_week || 20;

        const myData: StudentWorkHourData = {
          student_id: studentId,
          student_name: user.email || 'Student',
          current_weekly_hours: currentWeeklyHours,
          max_allowed_hours: maxHours,
          permit_id: activePermit.id,
          employment_count: jobs.length,
          is_at_risk: currentWeeklyHours > maxHours * 0.8,
          percentage_of_max: (currentWeeklyHours / maxHours) * 100,
        };

        setMyHourData(myData);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load work hour data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <ErrorIcon color="error" />;
    if (percentage >= 80) return <WarningIcon color="warning" />;
    return <SafeIcon color="success" />;
  };

  const getStatusColor = (percentage: number): 'error' | 'warning' | 'success' => {
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 100) return 'OVER LIMIT';
    if (percentage >= 80) return 'APPROACHING LIMIT';
    return 'SAFE';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    return 'success';
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
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" underline="hover">
            Home
          </Link>
          <Typography color="text.primary">Work Hour Monitoring</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Work Hour Monitoring
          </Typography>
          {myHourData && (
            <Chip
              icon={getStatusIcon(myHourData.percentage_of_max)}
              label={getStatusLabel(myHourData.percentage_of_max)}
              color={getStatusColor(myHourData.percentage_of_max)}
            />
          )}
        </Box>

        <Typography variant="body1" color="text.secondary">
          Track your weekly work hours to comply with work permit regulations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!workPermit && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You don&apos;t have an active work permit. Apply for a work permit to track your hours.
        </Alert>
      )}

      {myHourData && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Current Weekly Hours
                    </Typography>
                    <ScheduleIcon color="primary" />
                  </Box>
                  <Typography variant="h3" fontWeight={700}>
                    {myHourData.current_weekly_hours}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    hours per week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Maximum Allowed
                    </Typography>
                    <InfoIcon color="action" />
                  </Box>
                  <Typography variant="h3" fontWeight={700}>
                    {myHourData.max_allowed_hours}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    hours per week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Active Jobs
                    </Typography>
                    <NotificationIcon color="secondary" />
                  </Box>
                  <Typography variant="h3" fontWeight={700}>
                    {myHourData.employment_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    current positions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Weekly Hour Limit Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(myHourData.percentage_of_max, 100)}
                    color={getProgressColor(myHourData.percentage_of_max)}
                    sx={{ height: 12, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {myHourData.percentage_of_max.toFixed(0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {myHourData.current_weekly_hours} of {myHourData.max_allowed_hours} hours used
              </Typography>
            </CardContent>
          </Card>

          {myHourData.percentage_of_max >= 80 && myHourData.percentage_of_max < 100 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Approaching Weekly Hour Limit
              </Typography>
              <Typography variant="body2">
                You are approaching the maximum allowed weekly hours ({myHourData.max_allowed_hours}{' '}
                hours). Please ensure you don&apos;t exceed this limit to comply with work permit
                regulations.
              </Typography>
            </Alert>
          )}

          {myHourData.percentage_of_max >= 100 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Weekly Hour Limit Exceeded
              </Typography>
              <Typography variant="body2">
                You have exceeded the maximum allowed weekly hours ({myHourData.max_allowed_hours}{' '}
                hours). Please contact your career counselor and adjust your work schedule
                immediately to comply with regulations.
              </Typography>
            </Alert>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Current Employment Breakdown
              </Typography>

              {employments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No active employment records
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Position</TableCell>
                        <TableCell>Employer</TableCell>
                        <TableCell>Hours/Week</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employments.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {job.job_title}
                            </Typography>
                          </TableCell>
                          <TableCell>{job.employer}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {job.hours_per_week || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(job.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={job.is_current ? 'Active' : 'Inactive'}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight={700}>
                            Total
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {myHourData.current_weekly_hours} hours
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Work Permit Regulations
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Important Reminders
              </Typography>
              <Typography variant="body2" component="div">
                • Maximum hours per week: {myHourData.max_allowed_hours}
                <br />
                • School days: No more than 3-4 hours on school days
                <br />
                • Non-school days: No more than 8 hours on non-school days
                <br />
                • Work times: Generally not before 7 AM or after 7 PM on school days
                <br />• Academic performance must be maintained
              </Typography>
            </Alert>

            {workPermit?.restrictions && (
              <Alert severity="warning">
                <Typography variant="body2" fontWeight={600}>
                  Additional Restrictions
                </Typography>
                <Typography variant="body2">{workPermit.restrictions}</Typography>
              </Alert>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
