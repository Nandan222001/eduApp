import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  EmojiEvents,
  LocalFireDepartment,
  TimerOutlined,
  Star,
} from '@mui/icons-material';
import { WeeklyReview as WeeklyReviewType, PerformanceMetric } from '@/types/studyBuddy';
import { format } from 'date-fns';
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
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeeklyReviewProps {
  review: WeeklyReviewType;
}

export default function WeeklyReview({ review }: WeeklyReviewProps) {
  const theme = useTheme();

  const chartData = {
    labels: review.dailySessions.map((session) => format(new Date(session.date), 'EEE')),
    datasets: [
      {
        label: 'Study Hours',
        data: review.dailySessions.map((session) => session.hours),
        fill: true,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context: { parsed: { y: number } }) {
            return `${context.parsed.y} hours`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.divider, 0.5),
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
    },
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp fontSize="small" color="success" />;
      case 'down':
        return <TrendingDown fontSize="small" color="error" />;
      default:
        return <Remove fontSize="small" color="disabled" />;
    }
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return theme.palette.success.main;
    if (delta < 0) return theme.palette.error.main;
    return theme.palette.grey[500];
  };

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Weekly Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(review.weekStart, 'MMM d')} - {format(review.weekEnd, 'MMM d, yyyy')}
            </Typography>
          </Box>
          <Chip
            label={`${review.totalStudyHours.toFixed(1)}h total`}
            color="primary"
            icon={<TimerOutlined />}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                textAlign: 'center',
              }}
            >
              <LocalFireDepartment sx={{ fontSize: 32, color: theme.palette.error.main, mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {review.streakDays}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Day Streak
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                textAlign: 'center',
              }}
            >
              <EmojiEvents sx={{ fontSize: 32, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {review.achievementsEarned}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Achievements
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                textAlign: 'center',
              }}
            >
              <Star sx={{ fontSize: 32, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {review.topSubjects.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top Subjects
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                textAlign: 'center',
              }}
            >
              <TimerOutlined sx={{ fontSize: 32, color: theme.palette.secondary.main, mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {(review.totalStudyHours / 7).toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Hours/Day
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Study Hours Trend
          </Typography>
          <Box sx={{ height: 200 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Performance Delta
          </Typography>
          <Grid container spacing={2}>
            {review.performance.map((metric: PerformanceMetric) => (
              <Grid item xs={12} sm={6} key={metric.subject}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {metric.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metric.previousScore}% → {metric.currentScore}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: getDeltaColor(metric.delta) }}
                    >
                      {metric.delta > 0 ? '+' : ''}
                      {metric.delta}%
                    </Typography>
                    {getTrendIcon(metric.trend)}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Top Performing Subjects
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {review.topSubjects.map((subject, index) => (
              <Chip
                key={subject}
                label={subject}
                color="success"
                variant="outlined"
                size="small"
                icon={index === 0 ? <Star /> : undefined}
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Areas to Improve
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {review.areasToImprove.map((area) => (
              <Chip key={area} label={area} color="warning" variant="outlined" size="small" />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
