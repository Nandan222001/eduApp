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
  alpha,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as PassRateIcon,
} from '@mui/icons-material';
import {
  GradeComparisonChart,
  TeacherEffectivenessMetrics,
  EngagementStatistics,
  CustomReportBuilder,
} from '@/components/analytics';
import analyticsApi from '@/api/analytics';
import { InstitutionAnalytics, CustomReportData, CustomReportFilter } from '@/types/analytics';
import { subDays, subMonths } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
  );
}

export default function InstitutionAnalyticsDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months' | '6months'>('30days');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const institutionId = 1;

        const endDate = new Date();
        let startDate: Date;

        switch (dateRange) {
          case '7days':
            startDate = subDays(endDate, 7);
            break;
          case '30days':
            startDate = subDays(endDate, 30);
            break;
          case '3months':
            startDate = subMonths(endDate, 3);
            break;
          case '6months':
            startDate = subMonths(endDate, 6);
            break;
        }

        const data = await analyticsApi.getInstitutionAnalytics(
          institutionId,
          startDate.toISOString(),
          endDate.toISOString()
        );
        setAnalytics(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const handleGenerateCustomReport = async (filters: CustomReportFilter) => {
    const institutionId = 1;
    return await analyticsApi.generateCustomReport(institutionId, filters);
  };

  const handleExportPDF = async (reportData: CustomReportData) => {
    try {
      const blob = await analyticsApi.exportReportToPDF(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleExportExcel = async (reportData: CustomReportData) => {
    try {
      const blob = await analyticsApi.exportReportToExcel(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export Excel:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Analytics data not available'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Institution Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analytics.institution_name}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={dateRange}
            exclusive
            onChange={(_, value) => value && setDateRange(value)}
            size="small"
          >
            <ToggleButton value="7days">7 Days</ToggleButton>
            <ToggleButton value="30days">30 Days</ToggleButton>
            <ToggleButton value="3months">3 Months</ToggleButton>
            <ToggleButton value="6months">6 Months</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="body2" color="text.secondary">
                  Total Students
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700}>
                {analytics.overall_metrics.totalStudents.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SchoolIcon sx={{ color: theme.palette.secondary.main }} />
                <Typography variant="body2" color="text.secondary">
                  Total Teachers
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="secondary">
                {analytics.overall_metrics.totalTeachers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon sx={{ color: theme.palette.info.main }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Attendance
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {analytics.overall_metrics.averageAttendance.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PassRateIcon sx={{ color: theme.palette.success.main }} />
                <Typography variant="body2" color="text.secondary">
                  Overall Pass Rate
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {analytics.overall_metrics.overallPassRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Teacher Performance" />
          <Tab label="Custom Reports" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <GradeComparisonChart data={analytics.grade_comparisons} />
          </Grid>
          <Grid item xs={12}>
            <EngagementStatistics data={analytics.engagement_stats} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <TeacherEffectivenessMetrics data={analytics.teacher_effectiveness} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CustomReportBuilder
          onGenerate={handleGenerateCustomReport}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      </TabPanel>
    </Box>
  );
}
