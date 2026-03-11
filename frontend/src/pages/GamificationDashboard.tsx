import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Paper,
  Stack,
  Avatar,
  Button,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  LocalFireDepartment as FireIcon,
  Redeem as RedeemIcon,
  Leaderboard as LeaderboardIcon,
} from '@mui/icons-material';
import {
  PointsHistoryPage,
  BadgesShowcase,
  LeaderboardTable,
  AchievementNotificationToast,
  StreakTracker,
  RewardsRedemption,
  ProgressIndicator,
} from '../components/gamification';
import { AchievementNotification } from '../types/gamification';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const GamificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [notification] = useState<AchievementNotification | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const userId = parseInt(localStorage.getItem('user_id') || '0');
  const institutionId = parseInt(localStorage.getItem('institution_id') || '0');

  useEffect(() => {
    const checkForNewAchievements = () => {
      const lastCheck = localStorage.getItem('last_achievement_check');
      const now = Date.now();

      if (!lastCheck || now - parseInt(lastCheck) > 60000) {
        localStorage.setItem('last_achievement_check', now.toString());
      }
    };

    const interval = setInterval(() => {
      checkForNewAchievements();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Gamification Hub
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your progress, earn rewards, and compete with others
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <TrophyIcon sx={{ fontSize: 36 }} />
            </Avatar>
          </Stack>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} lg={8}>
              <ProgressIndicator userId={userId} institutionId={institutionId} />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Quick Actions
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrophyIcon />}
                      onClick={() => setActiveTab(1)}
                    >
                      View Badges
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<LeaderboardIcon />}
                      onClick={() => setActiveTab(2)}
                    >
                      Check Leaderboard
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RedeemIcon />}
                      onClick={() => setActiveTab(4)}
                    >
                      Redeem Rewards
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FireIcon />}
                      onClick={() => setActiveTab(3)}
                    >
                      View Streaks
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<TimelineIcon />} label="Points History" iconPosition="start" />
            <Tab icon={<TrophyIcon />} label="Badges" iconPosition="start" />
            <Tab icon={<LeaderboardIcon />} label="Leaderboard" iconPosition="start" />
            <Tab icon={<FireIcon />} label="Streaks" iconPosition="start" />
            <Tab icon={<RedeemIcon />} label="Rewards" iconPosition="start" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <PointsHistoryPage userId={userId} institutionId={institutionId} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <BadgesShowcase userId={userId} institutionId={institutionId} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <LeaderboardTable userId={userId} institutionId={institutionId} />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <StreakTracker userId={userId} institutionId={institutionId} />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <RewardsRedemption userId={userId} institutionId={institutionId} />
          </TabPanel>
        </Paper>
      </Container>

      <AchievementNotificationToast
        open={notificationOpen}
        notification={notification}
        onClose={() => setNotificationOpen(false)}
      />
    </Box>
  );
};

export default GamificationDashboard;
