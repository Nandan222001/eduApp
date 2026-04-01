import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { academicApi } from '../api/academic';
import type { Grade, GradeCreate, Section, SectionCreate } from '../types/academic';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const ClassManagement: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [_teachers] = useState<Teacher[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [gradeFormData, setGradeFormData] = useState<GradeCreate>({
    name: '',
    description: '',
  });

  const [sectionFormData, setSectionFormData] = useState<SectionCreate>({
    grade_id: 0,
    name: '',
    capacity: undefined,
    class_teacher_id: undefined,
    description: '',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadGrades = useCallback(async () => {
    try {
      setLoading(true);
      const data = await academicApi.getGrades(true);
      setGrades(data);
    } catch (error) {
      showSnackbar('Failed to load grades', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSections = useCallback(async () => {
    try {
      const data = await academicApi.getSections(undefined, true);
      setSections(data);
    } catch (error) {
      showSnackbar('Failed to load sections', 'error');
    }
  }, []);

  useEffect(() => {
    loadGrades();
    loadSections();
  }, [loadGrades, loadSections]);

  const handleOpenGradeDialog = (grade?: Grade) => {
    if (grade) {
      setEditingGrade(grade);
      setGradeFormData({
        name: grade.name,
        description: grade.description || '',
      });
    } else {
      setEditingGrade(null);
      setGradeFormData({
        name: '',
        description: '',
      });
    }
    setGradeDialogOpen(true);
  };

  const handleOpenSectionDialog = (section?: Section) => {
    if (!selectedGrade && !section) return;

    if (section) {
      setEditingSection(section);
      setSectionFormData({
        grade_id: section.grade_id,
        name: section.name,
        capacity: section.capacity,
        class_teacher_id: section.class_teacher_id,
        description: section.description || '',
      });
    } else {
      setEditingSection(null);
      setSectionFormData({
        grade_id: selectedGrade!.id,
        name: '',
        capacity: undefined,
        class_teacher_id: undefined,
        description: '',
      });
    }
    setSectionDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    try {
      setLoading(true);
      if (editingGrade) {
        await academicApi.updateGrade(editingGrade.id, gradeFormData);
        showSnackbar('Grade updated successfully', 'success');
      } else {
        await academicApi.createGrade(gradeFormData);
        showSnackbar('Grade created successfully', 'success');
      }
      setGradeDialogOpen(false);
      loadGrades();
    } catch (error) {
      showSnackbar('Failed to save grade', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async () => {
    try {
      setLoading(true);
      if (editingSection) {
        await academicApi.updateSection(editingSection.id, {
          name: sectionFormData.name,
          capacity: sectionFormData.capacity,
          class_teacher_id: sectionFormData.class_teacher_id,
          description: sectionFormData.description,
        });
        showSnackbar('Section updated successfully', 'success');
      } else {
        await academicApi.createSection(sectionFormData);
        showSnackbar('Section created successfully', 'success');
      }
      setSectionDialogOpen(false);
      loadSections();
    } catch (error) {
      showSnackbar('Failed to save section', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGrade = async (grade: Grade) => {
    if (!window.confirm(`Are you sure you want to delete ${grade.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteGrade(grade.id);
      showSnackbar('Grade deleted successfully', 'success');
      loadGrades();
      if (selectedGrade?.id === grade.id) {
        setSelectedGrade(null);
      }
    } catch (error) {
      showSnackbar('Failed to delete grade', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (section: Section) => {
    if (!window.confirm(`Are you sure you want to delete Section ${section.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteSection(section.id);
      showSnackbar('Section deleted successfully', 'success');
      loadSections();
    } catch (error) {
      showSnackbar('Failed to delete section', 'error');
    } finally {
      setLoading(false);
    }
  };

  const _handleAssignClassTeacher = async (sectionId: number, teacherId: number) => {
    try {
      setLoading(true);
      await academicApi.assignClassTeacher({ section_id: sectionId, teacher_id: teacherId });
      showSnackbar('Class teacher assigned successfully', 'success');
      loadSections();
    } catch (error) {
      showSnackbar('Failed to assign class teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getGradeSections = (gradeId: number) => {
    return sections.filter((s) => s.grade_id === gradeId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Class & Grade Management
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={5}>
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
              <List>
                {grades.map((grade) => (
                  <ListItem
                    key={grade.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: selectedGrade?.id === grade.id ? 'action.selected' : 'inherit',
                    }}
                    onClick={() => setSelectedGrade(grade)}
                  >
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
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGrade(grade);
                        }}
                      >
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

          <Grid item xs={12} md={7}>
            {selectedGrade ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Sections - {selectedGrade.name}</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenSectionDialog()}
                    size="small"
                  >
                    Add Section
                  </Button>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Section</TableCell>
                        <TableCell>Class Teacher</TableCell>
                        <TableCell>Capacity</TableCell>
                        <TableCell>Current Strength</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getGradeSections(selectedGrade.id).map((section) => (
                        <TableRow key={section.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GroupIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              Section {section.name}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {section.class_teacher_name ? (
                              <Chip
                                icon={<PersonIcon />}
                                label={section.class_teacher_name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not assigned
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{section.capacity ? section.capacity : 'No limit'}</TableCell>
                          <TableCell>
                            {section.current_strength || 0}
                            {section.capacity && (
                              <Typography
                                variant="caption"
                                color={
                                  (section.current_strength || 0) >= section.capacity
                                    ? 'error'
                                    : 'text.secondary'
                                }
                              >
                                {' '}
                                / {section.capacity}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenSectionDialog(section)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteSection(section)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {getGradeSections(selectedGrade.id).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No sections configured. Click &apos;Add Section&apos; to create
                              sections.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
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
          <DialogTitle>{editingGrade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Grade Name"
                value={gradeFormData.name}
                onChange={(e) => setGradeFormData({ ...gradeFormData, name: e.target.value })}
                placeholder="e.g., Grade 10, Class XII"
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={gradeFormData.description}
                onChange={(e) =>
                  setGradeFormData({ ...gradeFormData, description: e.target.value })
                }
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveGrade} disabled={loading}>
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
          <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Section Name"
                value={sectionFormData.name}
                onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                placeholder="e.g., A, B, Blue"
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Capacity (Optional)"
                type="number"
                value={sectionFormData.capacity || ''}
                onChange={(e) =>
                  setSectionFormData({
                    ...sectionFormData,
                    capacity: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Maximum students"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Class Teacher (Optional)</InputLabel>
                <Select
                  value={sectionFormData.class_teacher_id || ''}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      class_teacher_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  label="Class Teacher (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {_teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Button variant="contained" onClick={handleSaveSection} disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default ClassManagement;
