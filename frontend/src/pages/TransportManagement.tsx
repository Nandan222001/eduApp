import React, { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import RouteConfiguration from '../components/transport/RouteConfiguration';
import StudentAssignment from '../components/transport/StudentAssignment';

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

const TransportManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Transport Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure routes and assign students to transport
        </Typography>
      </Box>
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Route Configuration" />
          <Tab label="Student Assignment" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          <RouteConfiguration />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <StudentAssignment />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default TransportManagement;
