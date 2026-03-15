import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  useTheme,
  alpha,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  ThumbUp as LikeIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
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

interface ArticleMetrics {
  id: number;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgReadTime: number;
  category: string;
}

interface ReaderDemographic {
  grade: string;
  percentage: number;
  count: number;
}

const mockTopArticles: ArticleMetrics[] = [
  {
    id: 1,
    title: 'School Wins State Championship',
    views: 2340,
    likes: 456,
    comments: 89,
    shares: 123,
    avgReadTime: 4.5,
    category: 'news',
  },
  {
    id: 2,
    title: 'Basketball Team Advances to Finals',
    views: 1890,
    likes: 342,
    comments: 56,
    shares: 78,
    avgReadTime: 3.8,
    category: 'sports',
  },
  {
    id: 3,
    title: 'Mental Health Awareness Week',
    views: 1650,
    likes: 287,
    comments: 134,
    shares: 98,
    avgReadTime: 5.2,
    category: 'opinion',
  },
  {
    id: 4,
    title: 'Art Exhibition Showcases Talent',
    views: 1420,
    likes: 234,
    comments: 45,
    shares: 67,
    avgReadTime: 4.1,
    category: 'arts',
  },
  {
    id: 5,
    title: 'New Science Lab Opening',
    views: 1280,
    likes: 198,
    comments: 34,
    shares: 45,
    avgReadTime: 3.5,
    category: 'news',
  },
];

const trendingTopics = [
  { topic: 'Sports Championships', mentions: 145, trend: 'up' },
  { topic: 'Mental Health', mentions: 123, trend: 'up' },
  { topic: 'College Applications', mentions: 98, trend: 'stable' },
  { topic: 'School Events', mentions: 87, trend: 'up' },
  { topic: 'Student Council', mentions: 76, trend: 'down' },
  { topic: 'Technology', mentions: 65, trend: 'up' },
];

const readerDemographics: ReaderDemographic[] = [
  { grade: '12th Grade', percentage: 28, count: 560 },
  { grade: '11th Grade', percentage: 25, count: 500 },
  { grade: '10th Grade', percentage: 22, count: 440 },
  { grade: '9th Grade', percentage: 20, count: 400 },
  { grade: 'Other', percentage: 5, count: 100 },
];

export default function NewspaperAnalytics() {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('30days');

  const viewsOverTimeData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Total Views',
        data: [1200, 1900, 2300, 2800],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Unique Readers',
        data: [800, 1300, 1600, 1900],
        borderColor: theme.palette.secondary.main,
        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const categoryDistributionData = {
    labels: ['News', 'Sports', 'Opinion', 'Arts'],
    datasets: [
      {
        data: [35, 30, 20, 15],
        backgroundColor: [
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.secondary.main, 0.8),
        ],
        borderColor: [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.secondary.main,
        ],
        borderWidth: 2,
      },
    ],
  };

  const engagementData = {
    labels: mockTopArticles.map((a) => a.title.substring(0, 20) + '...'),
    datasets: [
      {
        label: 'Views',
        data: mockTopArticles.map((a) => a.views),
        backgroundColor: alpha(theme.palette.primary.main, 0.6),
      },
      {
        label: 'Likes',
        data: mockTopArticles.map((a) => a.likes),
        backgroundColor: alpha(theme.palette.success.main, 0.6),
      },
      {
        label: 'Comments',
        data: mockTopArticles.map((a) => a.comments),
        backgroundColor: alpha(theme.palette.info.main, 0.6),
      },
    ],
  };

  const demographicsData = {
    labels: readerDemographics.map((d) => d.grade),
    datasets: [
      {
        data: readerDemographics.map((d) => d.percentage),
        backgroundColor: [
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.secondary.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
        ],
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Reader Engagement Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track readership and content performance
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                >
                  <ViewIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    8.2K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Views
                  </Typography>
                  <Chip label="+12.5%" size="small" color="success" sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    4.9K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Readers
                  </Typography>
                  <Chip label="+8.3%" size="small" color="success" sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                  <TimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    4.2m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Read Time
                  </Typography>
                  <Chip label="+5.1%" size="small" color="success" sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}
                >
                  <LikeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    1.5K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Engagement
                  </Typography>
                  <Chip label="+18.7%" size="small" color="success" sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title="Readership Trends" />
            <CardContent>
              <Box sx={{ height: 350 }}>
                <Line data={viewsOverTimeData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Category Distribution" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Pie data={categoryDistributionData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Most Read Articles"
              avatar={<TrendingUpIcon />}
              subheader="Top performing content this month"
            />
            <CardContent>
              <List>
                {mockTopArticles.map((article, index) => (
                  <Paper
                    key={article.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {article.title}
                          </Typography>
                          <Chip label={article.category.toUpperCase()} size="small" />
                        </Box>
                      </Box>
                    </Box>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ViewIcon sx={{ color: 'primary.main', mb: 0.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            {article.views.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Views
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LikeIcon sx={{ color: 'success.main', mb: 0.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            {article.likes}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Likes
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CommentIcon sx={{ color: 'info.main', mb: 0.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            {article.comments}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Comments
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <ShareIcon sx={{ color: 'warning.main', mb: 0.5 }} />
                          <Typography variant="h6" fontWeight={600}>
                            {article.shares}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Shares
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Trending Topics" avatar={<CategoryIcon />} />
              <CardContent>
                <List dense>
                  {trendingTopics.map((topic, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemText
                        primary={topic.topic}
                        secondary={`${topic.mentions} mentions`}
                      />
                      <Chip
                        label={topic.trend}
                        size="small"
                        color={
                          topic.trend === 'up'
                            ? 'success'
                            : topic.trend === 'down'
                              ? 'error'
                              : 'default'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Reader Demographics" />
              <CardContent>
                <Box sx={{ height: 250, mb: 2 }}>
                  <Doughnut data={demographicsData} options={chartOptions} />
                </Box>
                <List dense>
                  {readerDemographics.map((demo, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText primary={demo.grade} secondary={`${demo.count} readers`} />
                      <Typography variant="body2" fontWeight={600}>
                        {demo.percentage}%
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Engagement by Article" />
            <CardContent>
              <Box sx={{ height: 400 }}>
                <Bar data={engagementData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
