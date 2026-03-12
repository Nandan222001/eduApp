import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Grid } from '@mui/material';
import TimetableGrid from '../components/timetable/TimetableGrid';
import TimetableControls from '../components/timetable/TimetableControls';
import ConflictDetection from '../components/timetable/ConflictDetection';

const TimetableBuilder: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [timetableId, setTimetableId] = useState<number | null>(null);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Timetable Builder
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Build timetables with drag-drop interface and automatic conflict detection
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <TimetableControls
              onGradeChange={setSelectedGrade}
              onSectionChange={setSelectedSection}
              onTimetableChange={setTimetableId}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <TimetableGrid
              timetableId={timetableId}
              gradeId={selectedGrade}
              sectionId={selectedSection}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <ConflictDetection timetableId={timetableId} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TimetableBuilder;
