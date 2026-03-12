import React, { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import EventCalendar from '../components/events/EventCalendar';
import RSVPTracking from '../components/events/RSVPTracking';
import PhotoGallery from '../components/events/PhotoGallery';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EventManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Event Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage events, track RSVPs, and organize photo galleries
        </Typography>
      </Box>
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Event Calendar" />
          <Tab label="RSVP Tracking" />
          <Tab label="Photo Gallery" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          <EventCalendar onSelectEvent={setSelectedEventId} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <RSVPTracking eventId={selectedEventId} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <PhotoGallery eventId={selectedEventId} />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default EventManagement;
