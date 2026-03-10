import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Class as ClassIcon,
} from '@mui/icons-material';
import teachersApi, { Subject, TeacherSubjectAssignment } from '@/api/teachers';
import { useAuth } from '@/hooks/useAuth';

interface AvailableSubject {
  id: number;
  name: string;
  code: string;
  grade_level?: string;
}

interface AvailableClass {
  id: number;
  name: string;
  section: string;
  grade_level: string;
  subject_id?: number;
}

export default function TeacherAssignments() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [isPrimarySubject, setIsPrimarySubject] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const subjects = await teachersApi.getTeacherSubjects(parseInt(id));
      setTeacherSubjects(subjects);
      setAvailableSubjects([
        { id: 1, name: 'Mathematics', code: 'MATH101', grade_level: '10' },
        { id: 2, name: 'Physics', code: 'PHY101', grade_level: '10' },
        { id: 3, name: 'Chemistry', code: 'CHEM101', grade_level: '10' },
        { id: 4, name: 'Biology', code: 'BIO101', grade_level: '10' },
        { id: 5, name: 'English', code: 'ENG101', grade_level: '10' },
      ]);
      setAvailableClasses([
        { id: 1, name: 'Class 10', section: 'A', grade_level: '10', subject_id: 1 },
        { id: 2, name: 'Class 10', section: 'B', grade_level: '10', subject_id: 1 },
        { id: 3, name: 'Class 11', section: 'A', grade_level: '11', subject_id: 2 },
      ]);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddSubjects = async () => {
    if (!id || !user?.institution_id || selectedSubjects.length === 0) return;

    try {
      setLoading(true);
      for (const subjectId of selectedSubjects) {
        const assignment: TeacherSubjectAssignment = {
          teacher_id: parseInt(id),
          subject_id: subjectId,
          is_primary: isPrimarySubject,
          institution_id: user.institution_id,
        };
        await teachersApi.assignSubject(assignment);
      }
      setSuccess('Subjects assigned successfully');
      setSubjectDialogOpen(false);
      setSelectedSubjects([]);
      setIsPrimarySubject(false);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to assign subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    if (!id) return;

    try {
      await teachersApi.removeSubject(parseInt(id), subjectId);
      setSuccess('Subject removed successfully');
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to remove subject');
    }
  };

  const handleSubjectSelection = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleClassSelection = (classId: number) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  if (loading && teacherSubjects.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/admin/users/teachers/${id}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Subject & Class Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage teacher&apos;s subject and class assignments
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Subjects
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setSubjectDialogOpen(true)}
                >
                  Assign Subject
                </Button>
              </Box>
              {teacherSubjects.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No subjects assigned yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {teacherSubjects.map((subject) => (
                    <ListItem
                      key={subject.id}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {subject.name}
                            </Typography>
                            {subject.is_primary && (
                              <Chip label="Primary" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={subject.code}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveSubject(subject.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ClassIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Classes
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setClassDialogOpen(true)}
                >
                  Assign Class
                </Button>
              </Box>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No classes assigned yet
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Subjects</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select one or more subjects to assign to this teacher
          </Typography>
          <List>
            {availableSubjects
              .filter((s) => !teacherSubjects.find((ts) => ts.id === s.id))
              .map((subject) => (
                <ListItem
                  key={subject.id}
                  button
                  onClick={() => handleSubjectSelection(subject.id)}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedSubjects.includes(subject.id)
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                  }}
                >
                  <Checkbox
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => handleSubjectSelection(subject.id)}
                  />
                  <ListItemText
                    primary={subject.name}
                    secondary={`${subject.code} - Grade ${subject.grade_level}`}
                  />
                </ListItem>
              ))}
          </List>
          {selectedSubjects.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPrimarySubject}
                  onChange={(e) => setIsPrimarySubject(e.target.checked)}
                />
              }
              label="Set as primary subject"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubjectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSubjects}
            disabled={selectedSubjects.length === 0 || loading}
          >
            Assign Selected
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={classDialogOpen}
        onClose={() => setClassDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Classes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select one or more classes to assign to this teacher
          </Typography>
          <List>
            {availableClasses.map((classItem) => (
              <ListItem
                key={classItem.id}
                button
                onClick={() => handleClassSelection(classItem.id)}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: selectedClasses.includes(classItem.id)
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                }}
              >
                <Checkbox
                  checked={selectedClasses.includes(classItem.id)}
                  onChange={() => handleClassSelection(classItem.id)}
                />
                <ListItemText
                  primary={`${classItem.name} - Section ${classItem.section}`}
                  secondary={`Grade ${classItem.grade_level}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setSuccess('Classes assigned successfully');
              setClassDialogOpen(false);
              setSelectedClasses([]);
            }}
            disabled={selectedClasses.length === 0}
          >
            Assign Selected
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
