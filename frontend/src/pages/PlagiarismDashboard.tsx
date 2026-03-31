import React, { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import {
  PlagiarismCheckButton,
  PlagiarismResultsList,
  PlagiarismReport,
  TeacherReviewInterface,
} from '../components/plagiarism';
import { useParams } from 'react-router-dom';

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
      id={`plagiarism-tabpanel-${index}`}
      aria-labelledby={`plagiarism-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const PlagiarismDashboard: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [currentCheckId, setCurrentCheckId] = useState<number | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCheckStarted = (checkId: number) => {
    setCurrentCheckId(checkId);
    setTabValue(1);
  };

  const handleViewDetails = (resultId: number) => {
    setSelectedResultId(resultId);
    setTabValue(2);
  };

  if (!assignmentId) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          Assignment ID is required
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Plagiarism Detection
          </Typography>
          <PlagiarismCheckButton
            assignmentId={parseInt(assignmentId)}
            onCheckStarted={handleCheckStarted}
          />
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="plagiarism dashboard tabs">
            <Tab label="Report" />
            <Tab label="Results" />
            <Tab label="Review" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <PlagiarismReport assignmentId={parseInt(assignmentId)} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {currentCheckId ? (
              <PlagiarismResultsList checkId={currentCheckId} onViewDetails={handleViewDetails} />
            ) : (
              <Typography variant="body1" color="text.secondary">
                Run a plagiarism check to see results
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {selectedResultId ? (
              <TeacherReviewInterface
                resultId={selectedResultId}
                result={{}}
                onReviewComplete={() => {
                  setTabValue(1);
                }}
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                Select a result to review
              </Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};
