import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { People, TrendingUp, Pageview, Timer } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import OverviewTab from './components/OverviewTab';
import FeatureAdoptionTab from './components/FeatureAdoptionTab';
import UserFlowTab from './components/UserFlowTab';
import RetentionTab from './components/RetentionTab';
import PerformanceTab from './components/PerformanceTab';
import EventsTab from './components/EventsTab';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AnalyticsDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.getDashboardStats(),
    refetchInterval: 60000,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor user engagement, feature adoption, and performance metrics
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h4">{stats?.total_users || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active Today: {stats?.active_users_today || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Active This Week
                </Typography>
              </Box>
              <Typography variant="h4">{stats?.active_users_week || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Month: {stats?.active_users_month || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Pageview color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Total Sessions
                </Typography>
              </Box>
              <Typography variant="h4">{stats?.total_sessions || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.total_page_views || 0} page views
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Timer color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Avg. Duration
                </Typography>
              </Box>
              <Typography variant="h4">
                {Math.round((stats?.avg_session_duration || 0) / 60)}m
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.avg_pages_per_session?.toFixed(1) || 0} pages/session
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab label="Overview" />
            <Tab label="Feature Adoption" />
            <Tab label="User Flow" />
            <Tab label="Retention" />
            <Tab label="Performance" />
            <Tab label="Events" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <OverviewTab />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <FeatureAdoptionTab />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <UserFlowTab />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <RetentionTab />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <PerformanceTab />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <EventsTab />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AnalyticsDashboard;
