import { useState } from 'react';
import {
  Box,
  Button,
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
  Checkbox,
  FormControlLabel,
  Chip,
  Paper,
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
  Book as BookIcon,
} from '@mui/icons-material';

interface Subject {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
}

interface GradeSubject {
  grade_id: number;
  grade_name: string;
  subject_id: number;
  subject_name: string;
  is_compulsory: boolean;
}

interface Grade {
  id: number;
  name: string;
}

export default function SubjectConfiguration() {
  const [subjects] = useState<Subject[]>([]);
  const [grades] = useState<Grade[]>([]);
  const [gradeSubjects] = useState<GradeSubject[]>([]);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [assignFormData, setAssignFormData] = useState({
    grade_id: 0,
    subject_id: 0,
    is_compulsory: true,
  });

  const handleOpenSubjectDialog = (subject?: Subject) => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code || '',
        description: subject.description || '',
      });
      setSelectedSubject(subject);
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
      });
      setSelectedSubject(null);
    }
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = () => {
    setSubjectDialogOpen(false);
  };

  const handleSaveAssignment = () => {
    setAssignDialogOpen(false);
  };

  const getSubjectGrades = (subjectId: number) => {
    return gradeSubjects
      .filter((gs) => gs.subject_id === subjectId)
      .map((gs) => ({ name: gs.grade_name, is_compulsory: gs.is_compulsory }));
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Subjects</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenSubjectDialog()}
              size="small"
            >
              Add Subject
            </Button>
          </Box>
          <Paper sx={{ p: 2 }}>
            <List>
              {subjects.map((subject, index) => (
                <ListItem
                  key={subject.id}
                  divider={index < subjects.length - 1}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <BookIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                  <ListItemText
                    primary={subject.name}
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {subject.code && (
                          <Chip label={subject.code} size="small" sx={{ mr: 0.5 }} />
                        )}
                        {getSubjectGrades(subject.id).map((grade, idx) => (
                          <Chip
                            key={idx}
                            label={grade.name}
                            size="small"
                            color={grade.is_compulsory ? 'primary' : 'default'}
                            sx={{ mr: 0.5 }}
                          />
                        ))}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleOpenSubjectDialog(subject)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {subjects.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No subjects configured"
                    secondary="Click 'Add Subject' to create subjects"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Grade-Subject Assignments</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAssignDialogOpen(true)}
              size="small"
            >
              Assign Subject
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Grade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Subject</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradeSubjects.map((gs, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{gs.grade_name}</TableCell>
                    <TableCell>{gs.subject_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={gs.is_compulsory ? 'Compulsory' : 'Elective'}
                        color={gs.is_compulsory ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {gradeSubjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No assignments configured
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click &apos;Assign Subject&apos; to assign subjects to grades
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Subject Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mathematics, English"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Subject Code (Optional)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., MATH101"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubjectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSubject}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Subject to Grade</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Select Grade"
              value={assignFormData.grade_id}
              onChange={(e) =>
                setAssignFormData({ ...assignFormData, grade_id: Number(e.target.value) })
              }
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value={0}>Select a grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Select Subject"
              value={assignFormData.subject_id}
              onChange={(e) =>
                setAssignFormData({ ...assignFormData, subject_id: Number(e.target.value) })
              }
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value={0}>Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={assignFormData.is_compulsory}
                  onChange={(e) =>
                    setAssignFormData({ ...assignFormData, is_compulsory: e.target.checked })
                  }
                />
              }
              label="Compulsory Subject (uncheck for elective)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAssignment}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
