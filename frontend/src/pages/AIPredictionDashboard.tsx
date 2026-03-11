import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  useTheme,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import {
  Psychology as AIIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import aiPredictionDashboardApi, {
  AIPredictionDashboardResponse,
} from '@/api/aiPredictionDashboard';
import TopicProbabilityRankingTable from '@/components/aiPrediction/TopicProbabilityRankingTable';
import PredictedBlueprintViewer from '@/components/aiPrediction/PredictedBlueprintViewer';
import MarksDistributionChart from '@/components/aiPrediction/MarksDistributionChart';
import FocusAreaRecommendations from '@/components/aiPrediction/FocusAreaRecommendations';
import StudyTimeAllocationChart from '@/components/aiPrediction/StudyTimeAllocationChart';
import StudyPlanTimeline from '@/components/aiPrediction/StudyPlanTimeline';
import WhatIfScenarioSimulator from '@/components/aiPrediction/WhatIfScenarioSimulator';
import CrashCourseMode from '@/components/aiPrediction/CrashCourseMode';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AIPredictionDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<AIPredictionDashboardResponse | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Filters
  const [board, setBoard] = useState('cbse');
  const [gradeId, setGradeId] = useState(10);
  const [subjectId, setSubjectId] = useState(1);

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, gradeId, subjectId]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await aiPredictionDashboardApi.getDashboard(board, gradeId, subjectId);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load AI prediction dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBoardChange = (event: SelectChangeEvent) => {
    setBoard(event.target.value);
  };

  const handleGradeChange = (event: SelectChangeEvent) => {
    setGradeId(Number(event.target.value));
  };

  const handleSubjectChange = (event: SelectChangeEvent) => {
    setSubjectId(Number(event.target.value));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No prediction data available</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          mb: 3,
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <AIIcon sx={{ fontSize: 48 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight={700}>
                AI Exam Prediction Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {dashboardData.subject_name} • {dashboardData.board.toUpperCase()} • Grade{' '}
                {dashboardData.grade_id}
              </Typography>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white', borderRadius: 1 }}>
                  <InputLabel>Board</InputLabel>
                  <Select value={board} onChange={handleBoardChange} label="Board">
                    <MenuItem value="cbse">CBSE</MenuItem>
                    <MenuItem value="icse">ICSE</MenuItem>
                    <MenuItem value="state_board">State Board</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100, bgcolor: 'white', borderRadius: 1 }}>
                  <InputLabel>Grade</InputLabel>
                  <Select value={gradeId.toString()} onChange={handleGradeChange} label="Grade">
                    <MenuItem value="10">10</MenuItem>
                    <MenuItem value="12">12</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={subjectId.toString()}
                    onChange={handleSubjectChange}
                    label="Subject"
                  >
                    <MenuItem value="1">Mathematics</MenuItem>
                    <MenuItem value="2">Science</MenuItem>
                    <MenuItem value="3">English</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Topics Analyzed
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {dashboardData.overall_prediction.total_topics_analyzed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                High Probability Topics
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {dashboardData.overall_prediction.high_probability_topics}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Expected Marks
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {dashboardData.overall_prediction.total_expected_marks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Study Hours Needed
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {dashboardData.overall_prediction.recommended_study_hours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<TrendingUpIcon />} label="Topic Rankings" iconPosition="start" />
            <Tab icon={<SchoolIcon />} label="Question Blueprint" iconPosition="start" />
            <Tab icon={<AIIcon />} label="Study Plan" iconPosition="start" />
            <Tab icon={<SpeedIcon />} label="What-If Simulator" iconPosition="start" />
            <Tab icon={<CalendarIcon />} label="Crash Course" iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TopicProbabilityRankingTable topics={dashboardData.topic_rankings} />
            </Grid>
            <Grid item xs={12} md={6}>
              <MarksDistributionChart distribution={dashboardData.marks_distribution} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StudyTimeAllocationChart allocation={dashboardData.study_time_allocation} />
            </Grid>
            <Grid item xs={12}>
              <FocusAreaRecommendations focusAreas={dashboardData.focus_areas} />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PredictedBlueprintViewer blueprint={dashboardData.predicted_blueprint} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <StudyPlanTimeline
            board={board}
            gradeId={gradeId}
            subjectId={subjectId}
            topicRankings={dashboardData.topic_rankings}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <WhatIfScenarioSimulator
            board={board}
            gradeId={gradeId}
            subjectId={subjectId}
            topics={dashboardData.topic_rankings}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <CrashCourseMode board={board} gradeId={gradeId} subjectId={subjectId} />
        </TabPanel>
      </Card>
    </Box>
  );
}
