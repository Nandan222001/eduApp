import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { OnboardingAnalytics as AnalyticsData } from '@/types/onboarding';
import onboardingApi from '@/api/onboarding';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface OnboardingAnalyticsProps {
  flowId: string;
  onClose: () => void;
}

export default function OnboardingAnalytics({ flowId, onClose }: OnboardingAnalyticsProps) {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [flowId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await onboardingApi.getAnalytics(flowId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const chartData = analytics
    ? {
        labels: analytics.timeSeriesData.map((d) => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Started',
            data: analytics.timeSeriesData.map((d) => d.started),
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
          {
            label: 'Completed',
            data: analytics.timeSeriesData.map((d) => d.completed),
            borderColor: theme.palette.success.main,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
          },
          {
            label: 'Dropped',
            data: analytics.timeSeriesData.map((d) => d.dropped),
            borderColor: theme.palette.error.main,
            backgroundColor: alpha(theme.palette.error.main, 0.1),
          },
        ],
      }
    : null;

  return (
    <Dialog open={true} maxWidth="lg" fullWidth onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          Onboarding Analytics
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <LinearProgress />
          </Box>
        ) : analytics ? (
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <PeopleIcon sx={{ color: theme.palette.primary.main }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {analytics.totalUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Users
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                        }}
                      >
                        <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {analytics.completionRate.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                        }}
                      >
                        <TimeIcon sx={{ color: theme.palette.info.main }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {formatTime(analytics.averageTimeToComplete)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg. Time
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                        }}
                      >
                        <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {analytics.completedUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {chartData && (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    User Journey Over Time
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Step-by-Step Analytics
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Step</TableCell>
                        <TableCell align="right">Completion Rate</TableCell>
                        <TableCell align="right">Drop-off Rate</TableCell>
                        <TableCell align="right">Avg. Time</TableCell>
                        <TableCell align="right">Completions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.stepAnalytics.map((step) => (
                        <TableRow key={step.stepId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {step.stepTitle}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${step.completionRate.toFixed(1)}%`}
                              size="small"
                              color={
                                step.completionRate >= 80
                                  ? 'success'
                                  : step.completionRate >= 50
                                    ? 'warning'
                                    : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 1,
                              }}
                            >
                              {step.dropOffRate > 20 ? (
                                <TrendingUpIcon
                                  sx={{ color: theme.palette.error.main, fontSize: 20 }}
                                />
                              ) : (
                                <TrendingDownIcon
                                  sx={{ color: theme.palette.success.main, fontSize: 20 }}
                                />
                              )}
                              <Typography variant="body2">
                                {step.dropOffRate.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatTime(step.averageTimeSpent)}</TableCell>
                          <TableCell align="right">{step.totalCompletions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Typography>No analytics data available</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
