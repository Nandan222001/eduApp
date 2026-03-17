import React, { useState, useEffect } from 'react';
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { academicApi } from '../api/academic';
import type {
  Subject,
  SubjectCreate,
  SubjectAssignment,
  SubjectAssignmentCreate,
  Grade,
  Section,
} from '../types/academic';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const SubjectManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [_teachers, _setTeachers] = useState<Teacher[]>([]);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [subjectFormData, setSubjectFormData] = useState<SubjectCreate>({
    name: '',
    code: '',
    description: '',
    is_elective: false,
  });

  const [assignmentFormData, setAssignmentFormData] = useState<SubjectAssignmentCreate>({
    subject_id: 0,
    grade_id: 0,
    section_id: undefined,
    teacher_id: undefined,
  });

  useEffect(() => {
    loadSubjects();
    loadAssignments();
    loadGrades();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await academicApi.getSubjects(true);
      setSubjects(data);
    } catch (error) {
      showSnackbar('Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await academicApi.getSubjectAssignments();
      setAssignments(data);
    } catch (error) {
      showSnackbar('Failed to load assignments', 'error');
    }
  };

  const loadGrades = async () => {
    try {
      const data = await academicApi.getGrades(true);
      setGrades(data);
    } catch (error) {
      showSnackbar('Failed to load grades', 'error');
    }
  };

  const loadSections = async (gradeId: number) => {
    try {
      const data = await academicApi.getSections(gradeId, true);
      setSections(data);
    } catch (error) {
      showSnackbar('Failed to load sections', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenSubjectDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        is_elective: subject.is_elective,
      });
    } else {
      setEditingSubject(null);
      setSubjectFormData({
        name: '',
        code: '',
        description: '',
        is_elective: false,
      });
    }
    setSubjectDialogOpen(true);
  };

  const handleOpenAssignmentDialog = () => {
    setAssignmentFormData({
      subject_id: subjects[0]?.id || 0,
      grade_id: grades[0]?.id || 0,
      section_id: undefined,
      teacher_id: undefined,
    });
    setAssignmentDialogOpen(true);
  };

  const handleSaveSubject = async () => {
    try {
      setLoading(true);
      if (editingSubject) {
        await academicApi.updateSubject(editingSubject.id, subjectFormData);
        showSnackbar('Subject updated successfully', 'success');
      } else {
        await academicApi.createSubject(subjectFormData);
        showSnackbar('Subject created successfully', 'success');
      }
      setSubjectDialogOpen(false);
      loadSubjects();
    } catch (error) {
      showSnackbar('Failed to save subject', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignment = async () => {
    try {
      setLoading(true);
      await academicApi.createSubjectAssignment(assignmentFormData);
      showSnackbar('Subject assigned successfully', 'success');
      setAssignmentDialogOpen(false);
      loadAssignments();
    } catch (error) {
      showSnackbar('Failed to assign subject', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!window.confirm(`Are you sure you want to delete ${subject.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteSubject(subject.id);
      showSnackbar('Subject deleted successfully', 'success');
      loadSubjects();
    } catch (error) {
      showSnackbar('Failed to delete subject', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignment: SubjectAssignment) => {
    if (
      !window.confirm(
        `Remove ${assignment.subject_name} from ${assignment.grade_name}${
          assignment.section_name ? ` - Section ${assignment.section_name}` : ''
        }?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteSubjectAssignment(assignment.id);
      showSnackbar('Assignment removed successfully', 'success');
      loadAssignments();
    } catch (error) {
      showSnackbar('Failed to remove assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const _handleUpdateAssignmentTeacher = async (assignmentId: number, teacherId: number) => {
    try {
      setLoading(true);
      await academicApi.updateSubjectAssignment(assignmentId, { teacher_id: teacherId });
      showSnackbar('Teacher assigned successfully', 'success');
      loadAssignments();
    } catch (error) {
      showSnackbar('Failed to assign teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentsByGrade = (gradeId: number) => {
    return assignments.filter((a) => a.grade_id === gradeId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Subject Management
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Subjects" />
            <Tab label="Subject-Teacher-Class Assignment" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">All Subjects</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenSubjectDialog()}
              >
                Add Subject
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject Code</TableCell>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {subject.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {subject.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subject.is_elective ? 'Elective' : 'Mandatory'}
                          size="small"
                          color={subject.is_elective ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {subject.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenSubjectDialog(subject)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteSubject(subject)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No subjects found. Click &apos;Add Subject&apos; to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Subject Assignments</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAssignmentDialog}
              >
                Assign Subject
              </Button>
            </Box>

            {grades.map((grade) => (
              <Card key={grade.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {grade.name}
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell>Section</TableCell>
                          <TableCell>Teacher</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getAssignmentsByGrade(grade.id).map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AssignmentIcon
                                  sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }}
                                />
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {assignment.subject_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {assignment.subject_code}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {assignment.section_name ? (
                                <Chip label={`Section ${assignment.section_name}`} size="small" />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  All sections
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.teacher_name || (
                                <Typography variant="body2" color="text.secondary">
                                  Not assigned
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  subjects.find((s) => s.id === assignment.subject_id)?.is_elective
                                    ? 'Elective'
                                    : 'Mandatory'
                                }
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAssignment(assignment)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {getAssignmentsByGrade(grade.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No subjects assigned to this grade
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ))}
          </TabPanel>
        </Paper>

        <Dialog
          open={subjectDialogOpen}
          onClose={() => setSubjectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Subject Name"
                value={subjectFormData.name}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Subject Code"
                value={subjectFormData.code}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                placeholder="e.g., MATH101"
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={subjectFormData.description}
                onChange={(e) =>
                  setSubjectFormData({ ...subjectFormData, description: e.target.value })
                }
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={subjectFormData.is_elective}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, is_elective: e.target.checked })
                    }
                  />
                }
                label="Elective Subject"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubjectDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveSubject} disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={assignmentDialogOpen}
          onClose={() => setAssignmentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign Subject to Class</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={assignmentFormData.subject_id}
                  onChange={(e) =>
                    setAssignmentFormData({
                      ...assignmentFormData,
                      subject_id: Number(e.target.value),
                    })
                  }
                  label="Subject"
                  required
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={assignmentFormData.grade_id}
                  onChange={(e) => {
                    const gradeId = Number(e.target.value);
                    setAssignmentFormData({
                      ...assignmentFormData,
                      grade_id: gradeId,
                      section_id: undefined,
                    });
                    loadSections(gradeId);
                  }}
                  label="Grade"
                  required
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Section (Optional)</InputLabel>
                <Select
                  value={assignmentFormData.section_id || ''}
                  onChange={(e) =>
                    setAssignmentFormData({
                      ...assignmentFormData,
                      section_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  label="Section (Optional)"
                >
                  <MenuItem value="">All sections</MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      Section {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Teacher (Optional)</InputLabel>
                <Select
                  value={assignmentFormData.teacher_id || ''}
                  onChange={(e) =>
                    setAssignmentFormData({
                      ...assignmentFormData,
                      teacher_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  label="Teacher (Optional)"
                >
                  <MenuItem value="">Not assigned</MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveAssignment} disabled={loading}>
              Assign
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

export default SubjectManagement;
