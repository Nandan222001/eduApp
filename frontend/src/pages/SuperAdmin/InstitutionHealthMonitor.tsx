import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Badge,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  NotificationsActive as NotificationsIcon,
  AutorenewRounded as AutorenewIcon,
  Psychology as PsychologyIcon,
  ShowChart as ShowChartIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts';

interface HealthScoreItem {
  institution_id: number;
  institution_name: string;
  overall_health_score: number;
  churn_risk_score: number;
  risk_level: string;
  health_trend: string;
  active_alerts_count: number;
  last_calculated_at: string;
}

interface HealthScoreList {
  items: HealthScoreItem[];
  total: number;
  critical_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

interface InstitutionHealth {
  health_score: {
    id: number;
    institution_id: number;
    institution_name: string;
    overall_health_score: number;
    payment_health_score: number;
    user_activity_score: number;
    support_ticket_score: number;
    feature_adoption_score: number;
    data_quality_score: number;
    churn_risk_score: number;
    churn_probability: number;
    risk_level: string;
    health_trend: string;
    previous_score: number | null;
    score_change_percentage: number | null;
    risk_factors: RiskFactor[];
    recommended_actions: RecommendedAction[];
    last_calculated_at: string;
  };
  active_alerts: Alert[];
  health_history: HealthHistory[];
  metrics_breakdown: any;
}

interface RiskFactor {
  factor: string;
  severity: string;
  description: string;
  impact_score: number;
}

interface RecommendedAction {
  action: string;
  priority: string;
  category: string;
  description: string;
  expected_impact: string;
}

interface Alert {
  id: number;
  institution_id: number;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metric_name: string | null;
  threshold_value: number | null;
  current_value: number | null;
  is_resolved: boolean;
  resolved_at: string | null;
  notification_sent: boolean;
  created_at: string;
}

interface HealthHistory {
  recorded_at: string;
  overall_health_score: number;
  payment_health_score: number;
  user_activity_score: number;
  support_ticket_score: number;
  feature_adoption_score: number;
  data_quality_score: number;
  churn_risk_score: number;
  risk_level: string;
}

export default function InstitutionHealthMonitor() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthScoreList | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionHealth | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, [filterRiskLevel]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterRiskLevel !== 'all') {
        params.append('risk_level', filterRiskLevel);
      }

      const response = await fetch(`/api/v1/institution-health/dashboard?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch health data');

      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError('Failed to load health monitoring data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutionDetails = async (institutionId: number) => {
    try {
      const response = await fetch(
        `/api/v1/institution-health/institutions/${institutionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch institution details');

      const data = await response.json();
      setSelectedInstitution(data);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Failed to load institution details:', err);
    }
  };

  const handleCalculateAll = async () => {
    try {
      setCalculating(true);
      const response = await fetch('/api/v1/institution-health/calculate-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to calculate health scores');

      await fetchHealthData();
      alert('Health scores calculated successfully!');
    } catch (err) {
      alert('Failed to calculate health scores');
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      critical: theme.palette.error.main,
      high: theme.palette.warning.main,
      medium: theme.palette.info.main,
      low: theme.palette.success.main,
    };
    return colors[riskLevel] || theme.palette.grey[500];
  };

  const getRiskLevelChip = (riskLevel: string) => {
    const config: Record<
      string,
      { color: 'error' | 'warning' | 'info' | 'success'; icon: React.ReactElement }
    > = {
      critical: { color: 'error', icon: <ErrorIcon /> },
      high: { color: 'warning', icon: <WarningIcon /> },
      medium: { color: 'info', icon: <WarningIcon /> },
      low: { color: 'success', icon: <CheckCircleIcon /> },
    };

    const item = config[riskLevel] || { color: 'info' as const, icon: <WarningIcon /> };

    return (
      <Chip
        icon={item.icon}
        label={riskLevel.toUpperCase()}
        color={item.color}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
      return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
    } else if (trend === 'declining') {
      return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
    }
    return null;
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchHealthData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!healthData) return null;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Institution Health Monitor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered health monitoring and churn prediction
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <IconButton onClick={fetchHealthData} color="primary">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={calculating ? <CircularProgress size={20} /> : <AutorenewIcon />}
            onClick={handleCalculateAll}
            disabled={calculating}
          >
            Recalculate All
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Institutions
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {healthData.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 56, height: 56 }}>
                  <AssessmentIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.error.main}`,
              bgcolor: alpha(theme.palette.error.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Critical Risk
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="error">
                    {healthData.critical_count}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.2), width: 56, height: 56 }}>
                  <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.warning.main}`,
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    High Risk
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    {healthData.high_risk_count}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), width: 56, height: 56 }}>
                  <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.success.main}`,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Healthy
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {healthData.low_risk_count}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.2), width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 32 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Institution Health Scores
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Risk</InputLabel>
            <Select
              value={filterRiskLevel}
              onChange={(e: SelectChangeEvent) => setFilterRiskLevel(e.target.value)}
              label="Filter by Risk"
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Institution</TableCell>
                <TableCell>Health Score</TableCell>
                <TableCell>Churn Risk</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Trend</TableCell>
                <TableCell align="center">Active Alerts</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {healthData.items.map((item) => (
                <TableRow key={item.institution_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {item.institution_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={item.overall_health_score}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(getHealthScoreColor(item.overall_health_score), 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getHealthScoreColor(item.overall_health_score),
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.overall_health_score.toFixed(0)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={getHealthScoreColor(100 - item.churn_risk_score)}
                    >
                      {item.churn_risk_score.toFixed(0)}%
                    </Typography>
                  </TableCell>
                  <TableCell>{getRiskLevelChip(item.risk_level)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getTrendIcon(item.health_trend)}
                      <Typography variant="body2" textTransform="capitalize">
                        {item.health_trend}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {item.active_alerts_count > 0 ? (
                      <Badge badgeContent={item.active_alerts_count} color="error">
                        <NotificationsIcon color="error" />
                      </Badge>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(item.last_calculated_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => fetchInstitutionDetails(item.institution_id)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              {selectedInstitution?.health_score.institution_name}
            </Typography>
            {selectedInstitution && getRiskLevelChip(selectedInstitution.health_score.risk_level)}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInstitution && (
            <Box>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                <Tab label="Overview" />
                <Tab label="Metrics Breakdown" />
                <Tab label="Risk Factors" />
                <Tab label="Recommendations" />
                <Tab label="History" />
              </Tabs>

              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                          Health Metrics
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart
                            data={[
                              {
                                metric: 'Payment',
                                score: selectedInstitution.health_score.payment_health_score,
                              },
                              {
                                metric: 'Activity',
                                score: selectedInstitution.health_score.user_activity_score,
                              },
                              {
                                metric: 'Support',
                                score: selectedInstitution.health_score.support_ticket_score,
                              },
                              {
                                metric: 'Adoption',
                                score: selectedInstitution.health_score.feature_adoption_score,
                              },
                              {
                                metric: 'Quality',
                                score: selectedInstitution.health_score.data_quality_score,
                              },
                            ]}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar
                              name="Score"
                              dataKey="score"
                              stroke={theme.palette.primary.main}
                              fill={theme.palette.primary.main}
                              fillOpacity={0.6}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                          Churn Risk Analysis
                        </Typography>
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="h2" fontWeight={700} color="error">
                            {(selectedInstitution.health_score.churn_probability * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            Churn Probability
                          </Typography>
                          <Box sx={{ mt: 3 }}>
                            <LinearProgress
                              variant="determinate"
                              value={selectedInstitution.health_score.churn_probability * 100}
                              sx={{
                                height: 12,
                                borderRadius: 6,
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: theme.palette.error.main,
                                },
                              }}
                            />
                          </Box>
                          <Box sx={{ mt: 3 }}>
                            <Chip
                              icon={<PsychologyIcon />}
                              label="ML-Powered Prediction"
                              color="secondary"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                          Active Alerts
                        </Typography>
                        {selectedInstitution.active_alerts.length > 0 ? (
                          <List>
                            {selectedInstitution.active_alerts.map((alert) => (
                              <ListItem
                                key={alert.id}
                                sx={{
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 1,
                                  mb: 1,
                                }}
                              >
                                <ListItemIcon>
                                  <WarningIcon color={alert.severity as any} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={alert.title}
                                  secondary={alert.description}
                                />
                                <Chip
                                  label={alert.severity.toUpperCase()}
                                  color={alert.severity as any}
                                  size="small"
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No active alerts
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Payment Health
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {selectedInstitution.health_score.payment_health_score.toFixed(0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedInstitution.health_score.payment_health_score}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          User Activity
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {selectedInstitution.health_score.user_activity_score.toFixed(0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedInstitution.health_score.user_activity_score}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Support Quality
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {selectedInstitution.health_score.support_ticket_score.toFixed(0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedInstitution.health_score.support_ticket_score}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Feature Adoption
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {selectedInstitution.health_score.feature_adoption_score.toFixed(0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedInstitution.health_score.feature_adoption_score}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Data Quality
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {selectedInstitution.health_score.data_quality_score.toFixed(0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedInstitution.health_score.data_quality_score}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Overall Health
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {selectedInstitution.health_score.overall_health_score.toFixed(0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedInstitution.health_score.overall_health_score}
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Identified Risk Factors
                  </Typography>
                  {selectedInstitution.health_score.risk_factors.length > 0 ? (
                    <List>
                      {selectedInstitution.health_score.risk_factors.map((factor, idx) => (
                        <ListItem
                          key={idx}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            mb: 2,
                          }}
                        >
                          <ListItemIcon>
                            <WarningIcon
                              color={
                                factor.severity === 'critical'
                                  ? 'error'
                                  : factor.severity === 'high'
                                  ? 'warning'
                                  : 'info'
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {factor.factor}
                                </Typography>
                                <Chip
                                  label={factor.severity.toUpperCase()}
                                  color={
                                    factor.severity === 'critical'
                                      ? 'error'
                                      : factor.severity === 'high'
                                      ? 'warning'
                                      : 'info'
                                  }
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" color="text.secondary">
                                  {factor.description}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Impact Score: {(factor.impact_score * 100).toFixed(0)}%
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={factor.impact_score * 100}
                                    sx={{ mt: 0.5, height: 4 }}
                                    color={
                                      factor.severity === 'critical'
                                        ? 'error'
                                        : factor.severity === 'high'
                                        ? 'warning'
                                        : 'info'
                                    }
                                  />
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="success">No significant risk factors identified</Alert>
                  )}
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Recommended Interventions
                  </Typography>
                  {selectedInstitution.health_score.recommended_actions.length > 0 ? (
                    <List>
                      {selectedInstitution.health_score.recommended_actions.map((action, idx) => (
                        <ListItem
                          key={idx}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            mb: 2,
                          }}
                        >
                          <ListItemIcon>
                            <ScheduleIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {action.action}
                                </Typography>
                                <Chip label={action.priority.toUpperCase()} size="small" color="secondary" />
                                <Chip label={action.category} size="small" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {action.description}
                                </Typography>
                                <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                                  Expected Impact: {action.expected_impact}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">No specific actions recommended</Alert>
                  )}
                </Box>
              )}

              {activeTab === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Health Score History
                  </Typography>
                  {selectedInstitution.health_history.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={selectedInstitution.health_history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="recorded_at"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="overall_health_score"
                          stroke={theme.palette.primary.main}
                          name="Overall Health"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="payment_health_score"
                          stroke={theme.palette.success.main}
                          name="Payment Health"
                        />
                        <Line
                          type="monotone"
                          dataKey="user_activity_score"
                          stroke={theme.palette.info.main}
                          name="User Activity"
                        />
                        <Line
                          type="monotone"
                          dataKey="churn_risk_score"
                          stroke={theme.palette.error.main}
                          name="Churn Risk"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert severity="info">No historical data available yet</Alert>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
