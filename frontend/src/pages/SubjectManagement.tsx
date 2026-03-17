import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import subjectsApi, {
  Subject,
  SubjectCreate,
  SubjectUpdate,
  SubjectTeacherClassAssignmentCreate,
  AssignmentMatrixData,
} from '@/api/subjects';
import teachersApi, { Teacher } from '@/api/teachers';
import classesApi, { Class } from '@/api/classes';
import { isDemoUser } from '@/api/demoDataApi';

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
      id={`subject-tabpanel-${index}`}
      aria-labelledby={`subject-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SubjectManagement() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignmentMatrix, setAssignmentMatrix] = useState<AssignmentMatrixData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [electiveFilter, setElectiveFilter] = useState<boolean | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<SubjectCreate>({
    institution_id: 1,
    name: '',
    code: '',
    description: '',
    is_elective: false,
    is_active: true,
  });
  const [assignmentFormData, setAssignmentFormData] = useState<
    Omit<SubjectTeacherClassAssignmentCreate, 'institution_id'>
  >({
    subject_id: 0,
    teacher_id: 0,
    class_id: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      if (isDemoUser()) {
        const mockData = {
          items: generateMockSubjects(),
          total: 20,
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        };
        setSubjects(mockData.items);
        setTotal(mockData.total);
      } else {
        const response = await subjectsApi.listSubjects({
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: search || undefined,
          is_elective: electiveFilter,
          is_active: activeFilter,
        });
        setSubjects(response.items);
        setTotal(response.total);
      }
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      if (isDemoUser()) {
        setTeachers(generateMockTeachers());
      } else {
        const response = await teachersApi.listTeachers({ limit: 100, is_active: true });
        setTeachers(response.items);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      if (isDemoUser()) {
        setClasses(generateMockClasses());
      } else {
        const response = await classesApi.listClasses({ limit: 100, is_active: true });
        setClasses(response.items);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchAssignmentMatrix = async () => {
    try {
      setLoading(true);
      if (isDemoUser()) {
        setAssignmentMatrix(generateMockAssignmentMatrix());
      } else {
        const response = await subjectsApi.getAssignmentMatrix();
        setAssignmentMatrix(response);
      }
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load assignment matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      fetchSubjects();
    } else if (tabValue === 1) {
      fetchAssignmentMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, electiveFilter, activeFilter, tabValue]);

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subject: Subject) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubject(subject);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedSubject) {
      setFormMode('edit');
      setFormData({
        institution_id: selectedSubject.institution_id,
        name: selectedSubject.name,
        code: selectedSubject.code,
        description: selectedSubject.description,
        is_elective: selectedSubject.is_elective,
        is_active: selectedSubject.is_active,
      });
      setFormDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubject) return;

    try {
      if (!isDemoUser()) {
        await subjectsApi.deleteSubject(selectedSubject.id);
      }
      setDeleteDialogOpen(false);
      setSelectedSubject(null);
      fetchSubjects();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete subject');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenCreateDialog = () => {
    setFormMode('create');
    setFormData({
      institution_id: 1,
      name: '',
      code: '',
      description: '',
      is_elective: false,
      is_active: true,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setFormData({
      institution_id: 1,
      name: '',
      code: '',
      description: '',
      is_elective: false,
      is_active: true,
    });
    setFormErrors({});
  };

  const handleOpenAssignmentDialog = () => {
    setAssignmentFormData({
      subject_id: 0,
      teacher_id: 0,
      class_id: 0,
      is_active: true,
    });
    setFormErrors({});
    setAssignmentDialogOpen(true);
  };

  const handleCloseAssignmentDialog = () => {
    setAssignmentDialogOpen(false);
    setAssignmentFormData({
      subject_id: 0,
      teacher_id: 0,
      class_id: 0,
      is_active: true,
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Subject name is required';
    }
    if (!formData.code.trim()) {
      errors.code = 'Subject code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAssignmentForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!assignmentFormData.subject_id) {
      errors.subject_id = 'Subject is required';
    }
    if (!assignmentFormData.teacher_id) {
      errors.teacher_id = 'Teacher is required';
    }
    if (!assignmentFormData.class_id) {
      errors.class_id = 'Class is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        if (formMode === 'create') {
          await subjectsApi.createSubject(formData);
        } else if (selectedSubject) {
          const updateData: SubjectUpdate = {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            is_elective: formData.is_elective,
            is_active: formData.is_active,
          };
          await subjectsApi.updateSubject(selectedSubject.id, updateData);
        }
      }
      handleCloseFormDialog();
      fetchSubjects();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!validateAssignmentForm()) return;

    try {
      setSubmitting(true);
      if (isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        await subjectsApi.createAssignment({
          ...assignmentFormData,
          institution_id: 1,
        });
      }
      handleCloseAssignmentDialog();
      fetchAssignmentMatrix();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      if (!isDemoUser()) {
        await subjectsApi.deleteAssignment(assignmentId);
      }
      fetchAssignmentMatrix();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete assignment');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getTypeColor = (isElective: boolean) => {
    return isElective ? 'secondary' : 'primary';
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Subject Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage subjects, codes, and teacher-class assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={tabValue === 0 ? handleOpenCreateDialog : handleOpenAssignmentDialog}
        >
          {tabValue === 0 ? 'Add Subject' : 'Add Assignment'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<BookIcon />} iconPosition="start" label="Subjects" />
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Assignment Matrix" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{ px: 2, pb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
          >
            <TextField
              placeholder="Search subjects..."
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => {
                setElectiveFilter(
                  electiveFilter === true ? false : electiveFilter === false ? undefined : true
                );
                setPage(0);
              }}
            >
              {electiveFilter === true
                ? 'Electives Only'
                : electiveFilter === false
                  ? 'Mandatory Only'
                  : 'All Types'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => {
                setActiveFilter(activeFilter === true ? undefined : true);
                setPage(0);
              }}
            >
              {activeFilter === true ? 'Active Only' : 'All'}
            </Button>
            <IconButton onClick={fetchSubjects}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject Name</TableCell>
                      <TableCell>Subject Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={4}>
                            No subjects found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject) => (
                        <TableRow key={subject.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BookIcon color="primary" />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {subject.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {subject.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={subject.code} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {subject.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subject.is_elective ? 'Elective' : 'Mandatory'}
                              color={getTypeColor(subject.is_elective)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subject.is_active ? 'Active' : 'Inactive'}
                              color={getStatusColor(subject.is_active)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, subject);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ px: 2, pb: 2 }}>
              {assignmentMatrix.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No assignments found
                  </Typography>
                </Box>
              ) : (
                assignmentMatrix.map((subjectData) => (
                  <Paper
                    key={subjectData.subject_id}
                    sx={{ mb: 2, p: 2, border: `1px solid ${theme.palette.divider}` }}
                    elevation={0}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {subjectData.subject_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Code: {subjectData.subject_code}
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Teacher</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Section</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subjectData.assignments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" py={2}>
                                  No teachers assigned
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            subjectData.assignments.map((assignment) => (
                              <TableRow key={assignment.id}>
                                <TableCell>{assignment.teacher_name}</TableCell>
                                <TableCell>{assignment.class_name}</TableCell>
                                <TableCell>{assignment.section}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={assignment.is_active ? 'Active' : 'Inactive'}
                                    color={getStatusColor(assignment.is_active)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </TabPanel>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Subject</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedSubject?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>{formMode === 'create' ? 'Add New Subject' : 'Edit Subject'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={Boolean(formErrors.name)}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                error={Boolean(formErrors.code)}
                helperText={formErrors.code}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_elective}
                    onChange={(e) => setFormData({ ...formData, is_elective: e.target.checked })}
                  />
                }
                label="Elective Subject"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  label="Status"
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.value === 'active' })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {formMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignmentDialogOpen}
        onClose={handleCloseAssignmentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Teacher-Class Assignment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={subjects}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={subjects.find((s) => s.id === assignmentFormData.subject_id) || null}
                onChange={(_e, newValue) =>
                  setAssignmentFormData({
                    ...assignmentFormData,
                    subject_id: newValue?.id || 0,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Subject *"
                    error={Boolean(formErrors.subject_id)}
                    helperText={formErrors.subject_id}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={teachers}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                value={teachers.find((t) => t.id === assignmentFormData.teacher_id) || null}
                onChange={(_e, newValue) =>
                  setAssignmentFormData({
                    ...assignmentFormData,
                    teacher_id: newValue?.id || 0,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Teacher *"
                    error={Boolean(formErrors.teacher_id)}
                    helperText={formErrors.teacher_id}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={classes}
                getOptionLabel={(option) => `Grade ${option.grade} - ${option.section}`}
                value={classes.find((c) => c.id === assignmentFormData.class_id) || null}
                onChange={(_e, newValue) =>
                  setAssignmentFormData({
                    ...assignmentFormData,
                    class_id: newValue?.id || 0,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Class *"
                    error={Boolean(formErrors.class_id)}
                    helperText={formErrors.class_id}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignmentDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignmentSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function generateMockSubjects(): Subject[] {
  const subjects = [
    { name: 'Mathematics', code: 'MATH', is_elective: false },
    { name: 'English Language', code: 'ENG', is_elective: false },
    { name: 'Physics', code: 'PHY', is_elective: false },
    { name: 'Chemistry', code: 'CHEM', is_elective: false },
    { name: 'Biology', code: 'BIO', is_elective: false },
    { name: 'Computer Science', code: 'CS', is_elective: true },
    { name: 'History', code: 'HIST', is_elective: false },
    { name: 'Geography', code: 'GEO', is_elective: false },
    { name: 'Economics', code: 'ECON', is_elective: true },
    { name: 'Business Studies', code: 'BUS', is_elective: true },
    { name: 'Accounting', code: 'ACC', is_elective: true },
    { name: 'Physical Education', code: 'PE', is_elective: false },
    { name: 'Art & Design', code: 'ART', is_elective: true },
    { name: 'Music', code: 'MUS', is_elective: true },
    { name: 'French', code: 'FRE', is_elective: true },
    { name: 'Spanish', code: 'SPA', is_elective: true },
    { name: 'Psychology', code: 'PSY', is_elective: true },
    { name: 'Sociology', code: 'SOC', is_elective: true },
    { name: 'Environmental Science', code: 'ENV', is_elective: true },
    { name: 'Political Science', code: 'POL', is_elective: true },
  ];

  return subjects.map((subject, index) => ({
    id: index + 1,
    institution_id: 1,
    name: subject.name,
    code: subject.code,
    description: `${subject.name} curriculum`,
    is_elective: subject.is_elective,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  }));
}

function generateMockTeachers(): Teacher[] {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    institution_id: 1,
    employee_id: `T${(i + 1).toString().padStart(4, '0')}`,
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `teacher${i + 1}@school.com`,
    phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  }));
}

function generateMockClasses(): Class[] {
  const mockClasses: Class[] = [];
  for (let grade = 1; grade <= 12; grade++) {
    const sections = grade <= 8 ? ['A', 'B', 'C'] : ['A', 'B'];
    sections.forEach((section) => {
      mockClasses.push({
        id: grade * 100 + section.charCodeAt(0),
        institution_id: 1,
        grade,
        section,
        student_capacity: grade <= 8 ? 35 : 40,
        current_students: Math.floor(Math.random() * (grade <= 8 ? 35 : 40)),
        academic_year: '2024-2025',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      });
    });
  }
  return mockClasses;
}

function generateMockAssignmentMatrix(): AssignmentMatrixData[] {
  const subjects = generateMockSubjects();
  const teachers = ['John Smith', 'Jane Johnson', 'Sarah Williams', 'Michael Brown'];

  return subjects.slice(0, 5).map((subject, index) => ({
    subject_id: subject.id,
    subject_name: subject.name,
    subject_code: subject.code,
    assignments: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      id: index * 10 + i,
      teacher_id: i + 1,
      teacher_name: teachers[i % teachers.length],
      class_id: (index + 1) * 100 + 65,
      class_name: `Grade ${index + 9}`,
      section: String.fromCharCode(65 + i),
      is_active: true,
    })),
  }));
}
