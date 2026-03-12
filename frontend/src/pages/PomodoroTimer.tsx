import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, useTheme } from '@mui/material';
import { Timer as TimerIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import PomodoroTimerInterface from '@/components/pomodoro/PomodoroTimerInterface';
import PomodoroAnalyticsDashboard from '@/components/pomodoro/PomodoroAnalyticsDashboard';

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
      id={`pomodoro-tabpanel-${index}`}
      aria-labelledby={`pomodoro-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `pomodoro-tab-${index}`,
    'aria-controls': `pomodoro-tabpanel-${index}`,
  };
}

export default function PomodoroTimer() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Pomodoro Study Timer
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay focused and productive with the Pomodoro Technique
        </Typography>
      </Box>

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="pomodoro tabs"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
            },
          }}
        >
          <Tab
            icon={<TimerIcon />}
            iconPosition="start"
            label="Timer"
            {...a11yProps(0)}
            sx={{
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            }}
          />
          <Tab
            icon={<AnalyticsIcon />}
            iconPosition="start"
            label="Analytics"
            {...a11yProps(1)}
            sx={{
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            }}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <PomodoroTimerInterface />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PomodoroAnalyticsDashboard />
      </TabPanel>
    </Container>
  );
}
