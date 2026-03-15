import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Event as EventIcon,
  LocalActivity as ActivityIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { volunteerApi } from '@/api/volunteer';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AdminVolunteerAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['volunteer-analytics', startDate, endDate],
    queryFn: () => volunteerApi.getAnalytics(startDate, endDate),
  });

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const engagementTrendData = {
    labels:
      analytics?.engagement_trends.map((t) =>
        new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ) || [],
    datasets: [
      {
        label: 'Total Hours',
        data: analytics?.engagement_trends.map((t) => t.total_hours) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Unique Volunteers',
        data: analytics?.engagement_trends.map((t) => t.unique_volunteers) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const popularActivitiesData = {
    labels: analytics?.popular_activities.slice(0, 10).map((a) => a.activity_name) || [],
    datasets: [
      {
        label: 'Total Hours',
        data: analytics?.popular_activities.slice(0, 10).map((a) => a.total_hours) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(255, 99, 255, 0.8)',
          'rgba(99, 255, 132, 0.8)',
        ],
      },
    ],
  };

  const gradeDistributionData = {
    labels: analytics?.demographics.by_grade.map((g) => g.grade_name) || [],
    datasets: [
      {
        label: 'Volunteer Count',
        data: analytics?.demographics.by_grade.map((g) => g.volunteer_count) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
      },
      {
        label: 'Total Hours',
        data: analytics?.demographics.by_grade.map((g) => g.total_hours) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
      },
    ],
  };

  const activityTypeData = {
    labels: analytics?.demographics.by_activity_type.map((a) => a.activity_type) || [],
    datasets: [
      {
        data: analytics?.demographics.by_activity_type.map((a) => a.total_hours) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Volunteer Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into volunteer engagement and impact
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {analytics?.monthly_summary.slice(-4).map((month, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {month.month}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                    {month.total_hours}h
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${month.active_volunteers} active`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`${month.new_volunteers} new`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardHeader title="Volunteer Engagement Trends" subheader="Daily activity tracking" />
              <CardContent>
                <Box sx={{ height: 350 }}>
                  <Line data={engagementTrendData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardHeader title="Activity Type Distribution" subheader="Hours by activity type" />
              <CardContent>
                <Box
                  sx={{
                    height: 350,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {analytics?.demographics.by_activity_type &&
                  analytics.demographics.by_activity_type.length > 0 ? (
                    <Doughnut data={activityTypeData} options={chartOptions} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data available
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Most Popular Activities"
                subheader="Top volunteer activities by participation"
              />
              <CardContent>
                <Box sx={{ height: 350 }}>
                  <Bar data={popularActivitiesData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Volunteer Participation by Grade"
                subheader="Grade-level engagement metrics"
              />
              <CardContent>
                <Box sx={{ height: 350 }}>
                  <Bar data={gradeDistributionData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Popular Activities Details" />
              <CardContent>
                {analytics?.popular_activities && analytics.popular_activities.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Activity Name</TableCell>
                          <TableCell align="right">Total Hours</TableCell>
                          <TableCell align="right">Participants</TableCell>
                          <TableCell align="right">Avg Hours/Activity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.popular_activities.slice(0, 15).map((activity, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <ActivityIcon />
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>
                                  {activity.activity_name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${activity.total_hours}h`}
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{activity.participants_count}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {activity.average_hours_per_activity.toFixed(1)}h
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No activity data available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {analytics?.event_correlations && analytics.event_correlations.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Event Correlation Analysis"
                  subheader="Volunteer activity patterns around school events"
                />
                <CardContent>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Event Name</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Before Event</TableCell>
                          <TableCell align="right">During Event</TableCell>
                          <TableCell align="right">After Event</TableCell>
                          <TableCell align="right">Correlation Score</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.event_correlations.map((correlation, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                  <EventIcon />
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>
                                  {correlation.event_name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {new Date(correlation.event_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {correlation.volunteer_hours_before}h
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="primary">
                                {correlation.volunteer_hours_during}h
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {correlation.volunteer_hours_after}h
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={correlation.correlation_score.toFixed(2)}
                                color={
                                  correlation.correlation_score > 0.7
                                    ? 'success'
                                    : correlation.correlation_score > 0.4
                                      ? 'warning'
                                      : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default AdminVolunteerAnalytics;
