import React, { useState } from 'react';
import { TextField, MenuItem, Button, Grid } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface TimetableControlsProps {
  onGradeChange: (gradeId: number | null) => void;
  onSectionChange: (sectionId: number | null) => void;
  onTimetableChange: (timetableId: number | null) => void;
}

const TimetableControls: React.FC<TimetableControlsProps> = ({
  onGradeChange,
  onSectionChange,
  onTimetableChange,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedTimetable, setSelectedTimetable] = useState<number | null>(null);

  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId);
    setSelectedSection(null);
    setSelectedTimetable(null);
    onGradeChange(gradeId);
    onSectionChange(null);
    onTimetableChange(null);
  };

  const handleSectionChange = (sectionId: number) => {
    setSelectedSection(sectionId);
    setSelectedTimetable(null);
    onSectionChange(sectionId);
    onTimetableChange(null);
  };

  const handleTimetableChange = (timetableId: number) => {
    setSelectedTimetable(timetableId);
    onTimetableChange(timetableId);
  };

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          select
          label="Grade"
          value={selectedGrade || ''}
          onChange={(e) => handleGradeChange(parseInt(e.target.value))}
        >
          <MenuItem value="">Select Grade</MenuItem>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
            <MenuItem key={grade} value={grade}>
              Grade {grade}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          select
          label="Section"
          value={selectedSection || ''}
          onChange={(e) => handleSectionChange(parseInt(e.target.value))}
          disabled={!selectedGrade}
        >
          <MenuItem value="">Select Section</MenuItem>
          {['A', 'B', 'C', 'D'].map((section, index) => (
            <MenuItem key={section} value={index + 1}>
              Section {section}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          select
          label="Timetable"
          value={selectedTimetable || ''}
          onChange={(e) => handleTimetableChange(parseInt(e.target.value))}
          disabled={!selectedSection}
        >
          <MenuItem value="">Select Timetable</MenuItem>
          <MenuItem value={1}>Current Timetable</MenuItem>
          <MenuItem value={2}>Draft Timetable</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Button fullWidth variant="contained" startIcon={<AddIcon />} disabled={!selectedSection}>
          New Timetable
        </Button>
      </Grid>
    </Grid>
  );
};

export default TimetableControls;
