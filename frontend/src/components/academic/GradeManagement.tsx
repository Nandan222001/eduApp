import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Class as ClassIcon,
} from '@mui/icons-material';

interface Grade {
  id: number;
  name: string;
  display_order: number;
  description?: string;
  is_active: boolean;
}

interface Section {
  id: number;
  grade_id: number;
  name: string;
  capacity?: number;
  description?: string;
  is_active: boolean;
}

export default function GradeManagement() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [draggedGrade, setDraggedGrade] = useState<Grade | null>(null);
  const [draggedSection, setDraggedSection] = useState<Section | null>(null);

  const [gradeFormData, setGradeFormData] = useState({
    name: '',
    description: '',
  });

  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    capacity: '',
    description: '',
  });

  const handleGradeDragStart = (grade: Grade) => {
    setDraggedGrade(grade);
  };

  const handleGradeDragOver = (e: React.DragEvent, targetGrade: Grade) => {
    e.preventDefault();
    if (!draggedGrade || draggedGrade.id === targetGrade.id) return;

    const newGrades = [...grades];
    const draggedIdx = newGrades.findIndex((g) => g.id === draggedGrade.id);
    const targetIdx = newGrades.findIndex((g) => g.id === targetGrade.id);

    newGrades.splice(draggedIdx, 1);
    newGrades.splice(targetIdx, 0, draggedGrade);

    newGrades.forEach((grade, index) => {
      grade.display_order = index;
    });

    setGrades(newGrades);
  };

  const handleGradeDrop = () => {
    setDraggedGrade(null);
  };

  const handleSectionDragStart = (section: Section) => {
    setDraggedSection(section);
  };

  const handleSectionDragOver = (e: React.DragEvent, targetSection: Section) => {
    e.preventDefault();
    if (!draggedSection || draggedSection.id === targetSection.id) return;

    const gradeSections = sections.filter((s) => s.grade_id === selectedGrade?.id);
    const otherSections = sections.filter((s) => s.grade_id !== selectedGrade?.id);

    const draggedIdx = gradeSections.findIndex((s) => s.id === draggedSection.id);
    const targetIdx = gradeSections.findIndex((s) => s.id === targetSection.id);

    gradeSections.splice(draggedIdx, 1);
    gradeSections.splice(targetIdx, 0, draggedSection);

    setSections([...otherSections, ...gradeSections]);
  };

  const handleSectionDrop = () => {
    setDraggedSection(null);
  };

  const handleOpenGradeDialog = (grade?: Grade) => {
    if (grade) {
      setGradeFormData({
        name: grade.name,
        description: grade.description || '',
      });
      setSelectedGrade(grade);
    } else {
      setGradeFormData({
        name: '',
        description: '',
      });
      setSelectedGrade(null);
    }
    setGradeDialogOpen(true);
  };

  const handleOpenSectionDialog = () => {
    setSectionFormData({
      name: '',
      capacity: '',
      description: '',
    });
    setSectionDialogOpen(true);
  };

  const handleSaveGrade = () => {
    setGradeDialogOpen(false);
  };

  const handleSaveSection = () => {
    setSectionDialogOpen(false);
  };

  const getGradeSections = (gradeId: number) => {
    return sections.filter((s) => s.grade_id === gradeId);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Grades</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenGradeDialog()}
              size="small"
            >
              Add Grade
            </Button>
          </Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag and drop to reorder grades
            </Typography>
            <List>
              {grades.map((grade, index) => (
                <ListItem
                  key={grade.id}
                  draggable
                  onDragStart={() => handleGradeDragStart(grade)}
                  onDragOver={(e) => handleGradeDragOver(e, grade)}
                  onDragEnd={handleGradeDrop}
                  sx={{
                    cursor: 'move',
                    bgcolor: draggedGrade?.id === grade.id ? 'action.selected' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                    mb: 1,
                    borderRadius: 1,
                  }}
                  divider={index < grades.length - 1}
                  onClick={() => setSelectedGrade(grade)}
                  selected={selectedGrade?.id === grade.id}
                >
                  <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ClassIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                  <ListItemText
                    primary={grade.name}
                    secondary={`${getGradeSections(grade.id).length} sections`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGradeDialog(grade);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" size="small" onClick={(e) => e.stopPropagation()}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {grades.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No grades configured"
                    secondary="Click 'Add Grade' to create grades"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {selectedGrade ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Sections - {selectedGrade.name}</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenSectionDialog}
                  size="small"
                >
                  Add Section
                </Button>
              </Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Drag and drop to reorder sections
                </Typography>
                <List>
                  {getGradeSections(selectedGrade.id).map((section, index) => (
                    <ListItem
                      key={section.id}
                      draggable
                      onDragStart={() => handleSectionDragStart(section)}
                      onDragOver={(e) => handleSectionDragOver(e, section)}
                      onDragEnd={handleSectionDrop}
                      sx={{
                        cursor: 'move',
                        bgcolor: draggedSection?.id === section.id ? 'action.selected' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' },
                        mb: 1,
                        borderRadius: 1,
                      }}
                      divider={index < getGradeSections(selectedGrade.id).length - 1}
                    >
                      <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <ListItemText
                        primary={`Section ${section.name}`}
                        secondary={
                          section.capacity ? `Capacity: ${section.capacity}` : 'No capacity limit'
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small" sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton edge="end" size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {getGradeSections(selectedGrade.id).length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No sections configured"
                        secondary="Click 'Add Section' to create sections"
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <ClassIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a grade
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on a grade to manage its sections
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={gradeDialogOpen}
        onClose={() => setGradeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedGrade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Grade Name"
              value={gradeFormData.name}
              onChange={(e) => setGradeFormData({ ...gradeFormData, name: e.target.value })}
              placeholder="e.g., Grade 10, Class XII"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={gradeFormData.description}
              onChange={(e) => setGradeFormData({ ...gradeFormData, description: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveGrade}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={sectionDialogOpen}
        onClose={() => setSectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Section</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Section Name"
              value={sectionFormData.name}
              onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
              placeholder="e.g., A, B, Blue"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Capacity (Optional)"
              type="number"
              value={sectionFormData.capacity}
              onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: e.target.value })}
              placeholder="Maximum students"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={sectionFormData.description}
              onChange={(e) =>
                setSectionFormData({ ...sectionFormData, description: e.target.value })
              }
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSection}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
