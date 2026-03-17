import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Stack,
  Paper,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  Assessment as AssessmentIcon,
  GetApp as DownloadIcon,
  EmojiEvents as TrophyIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

interface ROIData {
  totalInvestment: number;
  academicImprovement: number;
  timeSaved: number;
  moneySaved: number;
  totalROI: number;
}

export default function ParentROIDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [roiData] = useState<ROIData>({
    totalInvestment: 2400,
    academicImprovement: 15.5,
    timeSaved: 120,
    moneySaved: 3500,
    totalROI: 145.8,
  });

  const gradeData = {
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    datasets: [
      {
        label: 'Average Grade',
        data: [72, 75, 78, 82, 85, 87],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
      },
      {
        label: 'Class Average',
        data: [70, 71, 72, 73, 74, 75],
        borderColor: theme.palette.grey[400],
        backgroundColor: alpha(theme.palette.grey[400], 0.1),
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  const featureUsageData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'AI Study Buddy',
        data: [3, 5, 4, 6, 5, 2, 1],
        backgroundColor: alpha(theme.palette.primary.main, 0.8),
      },
      {
        label: 'Homework Help',
        data: [2, 3, 4, 3, 5, 1, 0],
        backgroundColor: alpha(theme.palette.success.main, 0.8),
      },
      {
        label: 'Practice Tests',
        data: [1, 1, 2, 2, 3, 2, 1],
        backgroundColor: alpha(theme.palette.info.main, 0.8),
      },
    ],
  };

  const engagementData = {
    labels: [
      'Focus Time',
      'Assignment Completion',
      'Quiz Performance',
      'Study Consistency',
      'Resource Usage',
    ],
    datasets: [
      {
        label: 'Your Child',
        data: [85, 92, 88, 90, 87],
        backgroundColor: alpha(theme.palette.primary.main, 0.3),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
      {
        label: 'School Average',
        data: [70, 75, 72, 68, 70],
        backgroundColor: alpha(theme.palette.grey[400], 0.2),
        borderColor: theme.palette.grey[400],
        borderWidth: 2,
      },
    ],
  };

  const costBreakdown = {
    labels: ['Avoided Tutoring', 'Avoided Extra Classes', 'Test Prep Savings', 'Study Materials'],
    datasets: [
      {
        data: [1800, 1200, 400, 100],
        backgroundColor: [
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
        ],
      },
    ],
  };

  const performanceMetrics = [
    { subject: 'Mathematics', before: 68, after: 85, improvement: 17 },
    { subject: 'Science', before: 72, after: 88, improvement: 16 },
    { subject: 'English', before: 75, after: 90, improvement: 15 },
    { subject: 'History', before: 70, after: 82, improvement: 12 },
  ];

  const handleExportPDF = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Generating ROI report PDF...');
    }, 1500);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Parent ROI Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your investment returns and your child&apos;s academic progress
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          onClick={handleExportPDF}
          disabled={loading}
        >
          Export PDF Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MoneyIcon color="primary" />
                <Typography variant="caption" color="text.secondary">
                  Total Investment
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary">
                ${roiData.totalInvestment}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Annual subscription
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="caption" color="text.secondary">
                  Academic Improvement
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                +{roiData.academicImprovement}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Average grade increase
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimeIcon color="info" />
                <Typography variant="caption" color="text.secondary">
                  Time Saved
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {roiData.timeSaved}h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs traditional tutoring
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrophyIcon sx={{ color: theme.palette.warning.main }} />
                <Typography variant="caption" color="text.secondary">
                  Total ROI
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.warning.main }}>
                {roiData.totalROI}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Return on investment
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Academic Improvement Delta"
              subheader="Grade progression vs class average"
              avatar={<AssessmentIcon />}
            />
            <CardContent>
              <Line
                data={gradeData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      min: 60,
                      max: 100,
                      title: { display: true, text: 'Grade %' },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Money Saved Breakdown" avatar={<MoneyIcon />} />
            <CardContent>
              <Box
                sx={{
                  height: 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Doughnut
                  data={costBreakdown}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Saved:
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    ${roiData.moneySaved}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Compared to traditional tutoring costs
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Features Usage Heatmap" subheader="Weekly engagement patterns" />
            <CardContent>
              <Bar
                data={featureUsageData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                      beginAtZero: true,
                      title: { display: true, text: 'Sessions' },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Engagement Percentile Rank"
              subheader="Your child vs school average"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Radar
                  data={engagementData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                    plugins: {
                      legend: { position: 'top' },
                    },
                  }}
                />
              </Box>
              <Paper sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Ranking
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    Top 12%
                  </Typography>
                  <Chip label="Highly Engaged" color="success" size="small" />
                </Stack>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Subject-wise Performance Improvement"
              subheader="Before vs After platform usage"
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Before (%)</TableCell>
                      <TableCell align="center">After (%)</TableCell>
                      <TableCell align="center">Improvement</TableCell>
                      <TableCell align="center">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceMetrics.map((metric) => (
                      <TableRow key={metric.subject} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BookIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight={600}>
                              {metric.subject}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {metric.before}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {metric.after}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`+${metric.improvement}%`}
                            color="success"
                            size="small"
                            icon={<TrendingUpIcon />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={(metric.improvement / 20) * 100}
                            sx={{ height: 8, borderRadius: 4, width: 100 }}
                            color="success"
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

        <Grid item xs={12}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>
                  Investment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Monthly Cost
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        ${(roiData.totalInvestment / 12).toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Cost per Grade Point
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        ${(roiData.totalInvestment / roiData.academicImprovement).toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Net Savings
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        ${roiData.moneySaved - roiData.totalInvestment}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Value Ratio
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {(roiData.moneySaved / roiData.totalInvestment).toFixed(1)}x
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
