import React, { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import FeeStructureConfig from '../components/fees/FeeStructureConfig';
import PaymentRecording from '../components/fees/PaymentRecording';
import OutstandingDuesReport from '../components/fees/OutstandingDuesReport';

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
      id={`fee-tabpanel-${index}`}
      aria-labelledby={`fee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Fee Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage fee structures, record payments, and track outstanding dues
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="fee management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Fee Structures" />
          <Tab label="Payment Recording" />
          <Tab label="Outstanding Dues" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <FeeStructureConfig />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PaymentRecording />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <OutstandingDuesReport />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default FeeManagement;
