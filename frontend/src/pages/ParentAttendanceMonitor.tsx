import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
  List,
  ListItem,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as LateIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';
import { demoData } from '@/data/dummyData';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export default function ParentAttendanceMonitor() {
  const theme = useTheme();
  const [selectedMonth] = useState('November 2024');
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(undefined);

  const {
    data: children,
    isLoading: isLoadingChildren,
    error: childrenError,
  } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => (isDemoUser() ? demoDataApi.parents.getChildren() : parentsApi.getChildren()),
  });

  const childId = selectedChildId || children?.[0]?.id;

  const rawAttendanceData = isDemoUser()
    ? childId === 1101
      ? demoData.parent.attendanceMonitor.child1
      : demoData.parent.attendanceMonitor.child2
    : null;

  const currentMonthData = rawAttendanceData?.current_month_attendance || [];
  const monthHistory = rawAttendanceData?.attendance_history_by_month || [];
  const latestMonth = monthHistory[monthHistory.length - 1];

  const totalPresent = monthHistory.reduce((sum, m) => sum + m.present, 0);
  const totalAbsent = monthHistory.reduce((sum, m) => sum + m.absent, 0);
  const totalLate = monthHistory.reduce((sum, m) => sum + m.late, 0);
  const totalDays = monthHistory.reduce((sum, m) => sum + m.total, 0);
  const overallPercentage =
    totalDays > 0 ? Math.round((totalPresent / totalDays) * 100 * 10) / 10 : 0;

  const recentRecords = currentMonthData
    .slice(-8)
    .reverse()
    .map((record: { date: string; status: string; remarks?: string }) => ({
      date: record.date,
      status: record.status as 'present' | 'absent' | 'late',
      remarks: record.remarks,
    }));

  const attendanceData = rawAttendanceData
    ? {
        currentMonth: {
          present: latestMonth?.present || 0,
          absent: latestMonth?.absent || 0,
          late: latestMonth?.late || 0,
          total: latestMonth?.total || 0,
          percentage: latestMonth?.percentage || 0,
        },
        overallStats: {
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          total: totalDays,
          percentage: overallPercentage,
        },
        trend:
          latestMonth &&
          monthHistory.length > 1 &&
          latestMonth.percentage < monthHistory[monthHistory.length - 2].percentage
            ? 'down'
            : 'up',
        recentRecords,
      }
    : {
        currentMonth: {
          present: 18,
          absent: 2,
          late: 1,
          total: 21,
          percentage: 85.7,
        },
        overallStats: {
          present: 145,
          absent: 8,
          late: 5,
          total: 158,
          percentage: 91.8,
        },
        trend: 'down' as const,
        recentRecords: [
          { date: '2024-11-15', status: 'present' as const },
          { date: '2024-11-14', status: 'present' as const },
          { date: '2024-11-13', status: 'late' as const, remarks: 'Arrived 10 minutes late' },
          { date: '2024-11-12', status: 'absent' as const, remarks: 'Medical leave' },
          { date: '2024-11-11', status: 'present' as const },
          { date: '2024-11-10', status: 'present' as const },
          { date: '2024-11-09', status: 'absent' as const, remarks: 'Family emergency' },
          { date: '2024-11-08', status: 'present' as const },
        ] as AttendanceRecord[],
      };

  const handleChildChange = (event: SelectChangeEvent<number>) => {
    setSelectedChildId(event.target.value as number);
  };

  if (isLoadingChildren) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (childrenError) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Failed to load children data. Please try again later.</Alert>
        </Box>
      </Container>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'absent':
        return <CancelIcon sx={{ color: theme.palette.error.main }} />;
      case 'late':
        return <LateIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return theme.palette.success.main;
      case 'absent':
        return theme.palette.error.main;
      case 'late':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Attendance Monitor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your child&apos;s attendance and view detailed records
          </Typography>

          {children && children.length > 1 && (
            <Box sx={{ mt: 3, maxWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel id="child-select-label">Select Child</InputLabel>
                <Select
                  labelId="child-select-label"
                  id="child-select"
                  value={childId || children[0].id}
                  label="Select Child"
                  onChange={handleChildChange}
                >
                  {children.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                      {child.grade_name &&
                        child.section_name &&
                        ` - ${child.grade_name} ${child.section_name}`}
                      {child.admission_number && ` (${child.admission_number})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardHeader
                title="Overall Attendance"
                avatar={
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <CalendarIcon sx={{ color: theme.palette.primary.main }} />
                  </Avatar>
                }
              />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" fontWeight={700} color="primary.main" gutterBottom>
                    {attendanceData.overallStats.percentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attendanceData.overallStats.present} of {attendanceData.overallStats.total}{' '}
                    days present
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={attendanceData.overallStats.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor:
                        attendanceData.overallStats.percentage >= 75
                          ? theme.palette.success.main
                          : theme.palette.warning.main,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                  {attendanceData.trend === 'up' ? (
                    <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {attendanceData.trend === 'up' ? 'Improving' : 'Needs attention'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardHeader
                title={`${selectedMonth} Summary`}
                subheader={`${attendanceData.currentMonth.total} school days`}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h5" fontWeight={700}>
                        {attendanceData.currentMonth.present}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Present
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        <CancelIcon sx={{ color: theme.palette.error.main, fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h5" fontWeight={700}>
                        {attendanceData.currentMonth.absent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Absent
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        <LateIcon sx={{ color: theme.palette.warning.main, fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h5" fontWeight={700}>
                        {attendanceData.currentMonth.late}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Late
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            {attendanceData.overallStats.percentage < 75 && (
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.warning.main}`,
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  mb: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" fontWeight={600} color="warning.dark" gutterBottom>
                        Attendance Alert
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Attendance is below 75%. Please ensure regular attendance to maintain
                        academic progress and comply with school policies.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader
                title="Recent Attendance Records"
                subheader="Last 8 days of attendance"
                action={
                  <Tooltip title="View detailed calendar">
                    <IconButton size="small">
                      <CalendarIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <List>
                  {attendanceData.recentRecords.map((record, index) => (
                    <Box key={record.date}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(getStatusColor(record.status), 0.1),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getStatusIcon(record.status)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Typography>
                            {record.remarks && (
                              <Typography variant="caption" color="text.secondary">
                                {record.remarks}
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(record.status), 0.1),
                              color: getStatusColor(record.status),
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </ListItem>
                      {index < attendanceData.recentRecords.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                bgcolor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 24 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="info.dark" gutterBottom>
                      About Attendance Monitoring
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This is a view-only section. You cannot mark or modify attendance records.
                      Attendance is marked by teachers and school administrators. If you notice any
                      discrepancies, please contact your child&apos;s class teacher or the school
                      office.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
