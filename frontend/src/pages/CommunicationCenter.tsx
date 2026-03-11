import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Campaign as AnnouncementIcon, Message as MessageIcon } from '@mui/icons-material';
import {
  AnnouncementComposer,
  AnnouncementList,
  MessagingInterface,
  NotificationPreferences,
} from '@/components/communications';

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

export const CommunicationCenter: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Communication Center
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage announcements, messages, and notifications
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<AnnouncementIcon />} label="Announcements" iconPosition="start" />
            <Tab icon={<MessageIcon />} label="Messages" iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <AnnouncementList onCompose={() => setShowAnnouncementComposer(true)} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <MessagingInterface />
          </TabPanel>
        </Paper>

        <AnnouncementComposer
          open={showAnnouncementComposer}
          onClose={() => setShowAnnouncementComposer(false)}
        />

        <NotificationPreferences
          open={showNotificationPreferences}
          onClose={() => setShowNotificationPreferences(false)}
        />
      </Box>
    </Container>
  );
};

export default CommunicationCenter;
