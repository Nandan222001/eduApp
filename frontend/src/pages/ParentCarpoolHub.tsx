import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Group as GroupIcon,
  DirectionsCar as DriveIcon,
  Assessment as AnalyticsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import CarpoolFinder from '@/components/carpool/CarpoolFinder';
import CarpoolGroupManagement from '@/components/carpool/CarpoolGroupManagement';
import RideConfirmationSystem from '@/components/carpool/RideConfirmationSystem';
import CarpoolAnalyticsDashboard from '@/components/carpool/CarpoolAnalyticsDashboard';
import CarpoolSafetyFeatures from '@/components/carpool/CarpoolSafetyFeatures';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`carpool-tabpanel-${index}`}
      aria-labelledby={`carpool-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ParentCarpoolHub: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Carpool Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize safe, eco-friendly carpools with other parents
          </Typography>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Tab
              icon={<SearchIcon />}
              label="Find Carpools"
              iconPosition="start"
              id="carpool-tab-0"
              aria-controls="carpool-tabpanel-0"
            />
            <Tab
              icon={<GroupIcon />}
              label="My Groups"
              iconPosition="start"
              id="carpool-tab-1"
              aria-controls="carpool-tabpanel-1"
            />
            <Tab
              icon={<DriveIcon />}
              label="Rides"
              iconPosition="start"
              id="carpool-tab-2"
              aria-controls="carpool-tabpanel-2"
            />
            <Tab
              icon={<AnalyticsIcon />}
              label="Analytics"
              iconPosition="start"
              id="carpool-tab-3"
              aria-controls="carpool-tabpanel-3"
            />
            <Tab
              icon={<SecurityIcon />}
              label="Safety"
              iconPosition="start"
              id="carpool-tab-4"
              aria-controls="carpool-tabpanel-4"
            />
          </Tabs>
        </Paper>

        <TabPanel value={currentTab} index={0}>
          <CarpoolFinder />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <CarpoolGroupManagement />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <RideConfirmationSystem />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <CarpoolAnalyticsDashboard />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <CarpoolSafetyFeatures />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ParentCarpoolHub;
