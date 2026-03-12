import React, { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import BookCatalog from '../components/library/BookCatalog';
import IssueReturnWorkflow from '../components/library/IssueReturnWorkflow';
import OverdueTracking from '../components/library/OverdueTracking';

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

const LibraryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Library Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage books, issue/return workflow, and track overdue books
        </Typography>
      </Box>
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Book Catalog" />
          <Tab label="Issue/Return" />
          <Tab label="Overdue Tracking" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          <BookCatalog />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <IssueReturnWorkflow />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <OverdueTracking />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LibraryManagement;
