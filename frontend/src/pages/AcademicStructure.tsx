import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper } from '@mui/material';
import AcademicYearSetup from '../components/academic/AcademicYearSetup';
import GradeManagement from '../components/academic/GradeManagement';
import SubjectConfiguration from '../components/academic/SubjectConfiguration';
import TimetableBuilder from '../components/academic/TimetableBuilder';
import ExamScheduleManager from '../components/academic/ExamScheduleManager';
import GradingSchemeConfig from '../components/academic/GradingSchemeConfig';

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
      id={`academic-tabpanel-${index}`}
      aria-labelledby={`academic-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `academic-tab-${index}`,
    'aria-controls': `academic-tabpanel-${index}`,
  };
}

export default function AcademicStructure() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Academic Structure Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure academic years, grades, subjects, timetables, and grading schemes
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Academic Year & Terms" {...a11yProps(0)} />
          <Tab label="Grades & Sections" {...a11yProps(1)} />
          <Tab label="Subjects" {...a11yProps(2)} />
          <Tab label="Timetable Builder" {...a11yProps(3)} />
          <Tab label="Exam Schedules" {...a11yProps(4)} />
          <Tab label="Grading Scheme" {...a11yProps(5)} />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <AcademicYearSetup />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <GradeManagement />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <SubjectConfiguration />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <TimetableBuilder />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <ExamScheduleManager />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <GradingSchemeConfig />
        </TabPanel>
      </Paper>
    </Container>
  );
}
