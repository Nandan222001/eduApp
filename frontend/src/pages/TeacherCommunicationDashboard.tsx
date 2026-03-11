import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Button, Tabs, Tab } from '@mui/material';
import {
  Campaign as AnnouncementIcon,
  Message as MessageIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  AnnouncementComposer,
  AnnouncementList,
  MessagingInterface,
  MessageComposer,
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

export const TeacherCommunicationDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <div>
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Communication Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage announcements and communicate with students and parents
            </Typography>
          </div>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowMessageComposer(true)}
            >
              New Message
            </Button>
            <Button
              variant="contained"
              startIcon={<AnnouncementIcon />}
              onClick={() => setShowAnnouncementComposer(true)}
            >
              Create Announcement
            </Button>
          </Box>
        </Box>

        <Paper>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
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

        <MessageComposer open={showMessageComposer} onClose={() => setShowMessageComposer(false)} />
      </Box>
    </Container>
  );
};

export default TeacherCommunicationDashboard;
