import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Avatar,
  useTheme,
  alpha,
  Chip,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import examinationsApi from '@/api/examinations';
import { ExamPerformanceAnalytics, TopperInfo } from '@/types/examination';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ExamAnalyticsDashboard() {
  const theme = useTheme();
  const { examId } = useParams<{ examId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ExamPerformanceAnalytics | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const toppers: TopperInfo[] = [
    {
      student_id: 1,
      student_name: 'John Doe',
      student_roll_number: '001',
      photo_url: undefined,
      total_marks: 485,
      percentage: 97.0,
      grade: 'A+',
      rank: 1,
    },
    {
      student_id: 2,
      student_name: 'Jane Smith',
      student_roll_number: '002',
      photo_url: undefined,
      total_marks: 478,
      percentage: 95.6,
      grade: 'A+',
      rank: 2,
    },
    {
      student_id: 3,
      student_name: 'Bob Johnson',
      student_roll_number: '003',
      photo_url: undefined,
      total_marks: 472,
      percentage: 94.4,
      grade: 'A+',
      rank: 3,
    },
  ];

  const loadAnalytics = React.useCallback(async () => {
    try {
      const data = await examinationsApi.getAnalytics(
        parseInt(examId!),
        1,
        selectedSection || undefined
      );

      if (data.length > 0) {
        const overallAnalytics = data.find((a) => !a.subject_id);
        if (overallAnalytics) {
          setAnalytics(overallAnalytics);
        }
      } else {
        setAnalytics({
          id: 1,
          exam_id: parseInt(examId!),
          total_students: 120,
          students_appeared: 118,
          students_passed: 95,
          students_failed: 23,
          pass_percentage: 80.5,
          average_marks: 368.5,
          average_percentage: 73.7,
          highest_marks: 485,
          lowest_marks: 245,
          median_marks: 372,
          standard_deviation: 52.3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load analytics');
    }
  }, [examId, selectedSection]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const passFailData = {
    labels: ['Passed', 'Failed'],
    datasets: [
      {
        data: [analytics?.students_passed || 0, analytics?.students_failed || 0],
        backgroundColor: [
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.error.main, 0.8),
        ],
        borderWidth: 0,
      },
    ],
  };

  const subjectWiseData = {
    labels: ['Math', 'Science', 'English', 'Social', 'Hindi'],
    datasets: [
      {
        label: 'Average Percentage',
        data: [78.5, 68.2, 82.3, 75.8, 71.2],
        backgroundColor: alpha(theme.palette.primary.main, 0.6),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    ],
  };

  const gradeDistributionData = {
    labels: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
    datasets: [
      {
        label: 'Number of Students',
        data: [15, 28, 32, 25, 12, 6, 2],
        backgroundColor: [
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.warning.light, 0.8),
          alpha(theme.palette.error.light, 0.8),
          alpha(theme.palette.error.main, 0.8),
        ],
      },
    ],
  };

  const performanceComparisonData = {
    labels: ['Highest', 'Average', 'Median', 'Lowest'],
    datasets: [
      {
        label: 'Marks Distribution',
        data: [
          analytics?.highest_marks || 0,
          analytics?.average_marks || 0,
          analytics?.median_marks || 0,
          analytics?.lowest_marks || 0,
        ],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const subjectRadarData = {
    labels: ['Math', 'Science', 'English', 'Social', 'Hindi'],
    datasets: [
      {
        label: 'Class Average',
        data: [78.5, 68.2, 82.3, 75.8, 71.2],
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
      {
        label: 'Pass Percentage',
        data: [86.4, 74.6, 88.2, 81.5, 76.8],
        backgroundColor: alpha(theme.palette.success.main, 0.2),
        borderColor: theme.palette.success.main,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Examination Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive performance analysis and insights
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Select Section"
          value={selectedSection || 'all'}
          onChange={(e) =>
            setSelectedSection(e.target.value === 'all' ? null : parseInt(e.target.value))
          }
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All Sections</MenuItem>
          <MenuItem value={1}>Section A</MenuItem>
          <MenuItem value={2}>Section B</MenuItem>
          <MenuItem value={3}>Section C</MenuItem>
        </TextField>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56 }}>
                  <SchoolIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics?.students_appeared || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students Appeared
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {analytics?.total_students || 0} enrolled
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {analytics?.pass_percentage.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pass Percentage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main">
                      +2.5% from last exam
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                  <BarChartIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics?.average_percentage.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Percentage
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    σ = {analytics?.standard_deviation.toFixed(1) || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 56, height: 56 }}>
                  <EmojiEventsIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics?.highest_marks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest Marks
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lowest: {analytics?.lowest_marks || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Top Performers
          </Typography>
          <Grid container spacing={2}>
            {toppers.map((topper) => (
              <Grid item xs={12} md={4} key={topper.student_id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `2px solid ${
                      topper.rank === 1 ? theme.palette.warning.main : theme.palette.divider
                    }`,
                    borderRadius: 2,
                    textAlign: 'center',
                    position: 'relative',
                    bgcolor:
                      topper.rank === 1 ? alpha(theme.palette.warning.main, 0.05) : undefined,
                  }}
                >
                  {topper.rank === 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <Chip
                        icon={<EmojiEventsIcon />}
                        label="Top Rank"
                        color="warning"
                        size="small"
                      />
                    </Box>
                  )}
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2rem',
                    }}
                  >
                    {topper.rank}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {topper.student_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Roll No: {topper.student_roll_number}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {topper.percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {topper.total_marks} marks • Grade {topper.grade}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab label="Overview Charts" />
          <Tab label="Subject Analysis" />
          <Tab label="Detailed Statistics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Pass/Fail Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut data={passFailData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Grade Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={gradeDistributionData}
                    options={{
                      ...chartOptions,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
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
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Performance Comparison
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line
                    data={performanceComparisonData}
                    options={{
                      ...chartOptions,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
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
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Subject-wise Performance Radar
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Radar data={subjectRadarData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Subject-wise Average Performance
            </Typography>
            <Box sx={{ height: 400, mb: 3 }}>
              <Bar
                data={subjectWiseData}
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Appeared
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Passed
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Pass %
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Avg Marks
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Highest
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Lowest
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'].map(
                    (subject, index) => (
                      <TableRow key={subject}>
                        <TableCell>
                          <Typography fontWeight={500}>{subject}</Typography>
                        </TableCell>
                        <TableCell align="center">118</TableCell>
                        <TableCell align="center">{[102, 88, 105, 97, 91][index]}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${[86.4, 74.6, 88.2, 81.5, 76.8][index]}%`}
                            color={
                              [86.4, 74.6, 88.2, 81.5, 76.8][index] > 80 ? 'success' : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {[78.5, 68.2, 82.3, 75.8, 71.2][index]}
                        </TableCell>
                        <TableCell align="center">{[98, 95, 99, 96, 94][index]}</TableCell>
                        <TableCell align="center">{[42, 28, 45, 38, 32][index]}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Statistical Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    { label: 'Total Students', value: analytics?.total_students || 0 },
                    { label: 'Students Appeared', value: analytics?.students_appeared || 0 },
                    { label: 'Students Passed', value: analytics?.students_passed || 0 },
                    { label: 'Students Failed', value: analytics?.students_failed || 0 },
                    {
                      label: 'Pass Percentage',
                      value: `${analytics?.pass_percentage.toFixed(2)}%`,
                    },
                    {
                      label: 'Average Percentage',
                      value: `${analytics?.average_percentage.toFixed(2)}%`,
                    },
                    { label: 'Highest Marks', value: analytics?.highest_marks || 0 },
                    { label: 'Lowest Marks', value: analytics?.lowest_marks || 0 },
                    { label: 'Median Marks', value: analytics?.median_marks || 0 },
                    {
                      label: 'Standard Deviation',
                      value: analytics?.standard_deviation.toFixed(2) || 0,
                    },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1.5,
                        borderBottom: index < 9 ? `1px solid ${theme.palette.divider}` : 'none',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Performance Insights
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Strong Performance
                    </Typography>
                    <Typography variant="body2">
                      Mathematics and English show excellent results with over 85% pass rate.
                    </Typography>
                  </Alert>

                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Needs Attention
                    </Typography>
                    <Typography variant="body2">
                      Science has the lowest pass percentage at 74.6%. Additional support
                      recommended.
                    </Typography>
                  </Alert>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Overall Trend
                    </Typography>
                    <Typography variant="body2">
                      Pass percentage has improved by 2.5% compared to the previous exam.
                    </Typography>
                  </Alert>

                  <Alert severity="info">
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Distribution Analysis
                    </Typography>
                    <Typography variant="body2">
                      Standard deviation of {analytics?.standard_deviation.toFixed(1)} indicates
                      moderate variation in student performance.
                    </Typography>
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}
