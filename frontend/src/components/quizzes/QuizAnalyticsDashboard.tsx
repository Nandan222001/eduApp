import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { QuizDetailedAnalytics } from '@/types/quiz';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface QuizAnalyticsDashboardProps {
  analytics: QuizDetailedAnalytics;
}

export const QuizAnalyticsDashboard: React.FC<QuizAnalyticsDashboardProps> = ({ analytics }) => {
  const { quiz_analytics, question_analytics, score_distribution, time_distribution } = analytics;

  const scoreChartData = {
    labels: Object.keys(score_distribution),
    datasets: [
      {
        label: 'Number of Students',
        data: Object.values(score_distribution),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const timeChartData = {
    labels: Object.keys(time_distribution),
    datasets: [
      {
        label: 'Number of Attempts',
        data: Object.values(time_distribution),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
    ],
  };

  const questionDifficultyData = {
    labels: question_analytics.map((_q, i) => `Q${i + 1}`),
    datasets: [
      {
        label: 'Accuracy Rate (%)',
        data: question_analytics.map((q) => q.accuracy_rate),
        backgroundColor: question_analytics.map((q) =>
          q.accuracy_rate >= 70
            ? 'rgba(75, 192, 192, 0.6)'
            : q.accuracy_rate >= 50
              ? 'rgba(255, 206, 86, 0.6)'
              : 'rgba(255, 99, 132, 0.6)'
        ),
        borderColor: question_analytics.map((q) =>
          q.accuracy_rate >= 70
            ? 'rgba(75, 192, 192, 1)'
            : q.accuracy_rate >= 50
              ? 'rgba(255, 206, 86, 1)'
              : 'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Quiz Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Attempts
              </Typography>
              <Typography variant="h4">{quiz_analytics.total_attempts}</Typography>
              <Typography variant="caption" color="text.secondary">
                {quiz_analytics.completed_attempts} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h4">{quiz_analytics.average_score.toFixed(1)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {quiz_analytics.average_percentage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pass Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {quiz_analytics.pass_rate.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={quiz_analytics.pass_rate}
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg. Time
              </Typography>
              <Typography variant="h4">
                {formatTime(quiz_analytics.average_time_seconds)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Score Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={scoreChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={timeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Question Difficulty Analysis
              </Typography>
              <Box sx={{ height: 300, mb: 3 }}>
                <Bar
                  data={questionDifficultyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Accuracy Rate (%)',
                        },
                      },
                    },
                  }}
                />
              </Box>

              <List>
                {question_analytics.map((q, index) => (
                  <ListItem key={q.question_id} divider={index < question_analytics.length - 1}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2">
                            Q{index + 1}: {q.question_text}
                          </Typography>
                          <Chip
                            label={`${q.accuracy_rate.toFixed(1)}%`}
                            size="small"
                            color={
                              q.accuracy_rate >= 70
                                ? 'success'
                                : q.accuracy_rate >= 50
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {q.total_attempts} attempts • {q.correct_attempts} correct •{' '}
                            {q.incorrect_attempts} incorrect • Avg. time:{' '}
                            {formatTime(q.average_time_seconds)}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={q.accuracy_rate}
                            color={
                              q.accuracy_rate >= 70
                                ? 'success'
                                : q.accuracy_rate >= 50
                                  ? 'warning'
                                  : 'error'
                            }
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
