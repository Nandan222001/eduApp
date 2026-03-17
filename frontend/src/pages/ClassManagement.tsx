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
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import classesApi, { Class, ClassCreate, ClassUpdate } from '@/api/classes';
import teachersApi, { Teacher } from '@/api/teachers';
import { isDemoUser } from '@/api/demoDataApi';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ClassManagement() {
  const theme = useTheme();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<ClassCreate>({
    institution_id: 1,
    grade: 1,
    section: 'A',
    student_capacity: 30,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      if (isDemoUser()) {
        const mockData: ClassListResponse = {
          items: generateMockClasses(),
          total: 72,
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        };
        setClasses(mockData.items);
        setTotal(mockData.total);
      } else {
        const response = await classesApi.listClasses({
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: search || undefined,
          grade: gradeFilter,
          is_active: activeFilter,
        });
        setClasses(response.items);
        setTotal(response.total);
      }
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load classes');
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

  useEffect(() => {
    fetchClasses();
  }, [page, rowsPerPage, search, gradeFilter, activeFilter]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, classItem: Class) => {
    setAnchorEl(event.currentTarget);
    setSelectedClass(classItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedClass) {
      setFormMode('edit');
      setFormData({
        institution_id: selectedClass.institution_id,
        grade: selectedClass.grade,
        section: selectedClass.section,
        class_teacher_id: selectedClass.class_teacher_id,
        student_capacity: selectedClass.student_capacity,
        room_number: selectedClass.room_number,
        academic_year: selectedClass.academic_year,
        is_active: selectedClass.is_active,
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
    if (!selectedClass) return;

    try {
      if (!isDemoUser()) {
        await classesApi.deleteClass(selectedClass.id);
      }
      setDeleteDialogOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete class');
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
      grade: 1,
      section: 'A',
      student_capacity: 30,
      is_active: true,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setFormData({
      institution_id: 1,
      grade: 1,
      section: 'A',
      student_capacity: 30,
      is_active: true,
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.grade) {
      errors.grade = 'Grade is required';
    }
    if (!formData.section) {
      errors.section = 'Section is required';
    }
    if (!formData.student_capacity || formData.student_capacity < 1) {
      errors.student_capacity = 'Student capacity must be at least 1';
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
          await classesApi.createClass(formData);
        } else if (selectedClass) {
          const updateData: ClassUpdate = {
            grade: formData.grade,
            section: formData.section,
            class_teacher_id: formData.class_teacher_id,
            student_capacity: formData.student_capacity,
            room_number: formData.room_number,
            academic_year: formData.academic_year,
            is_active: formData.is_active,
          };
          await classesApi.updateClass(selectedClass.id, updateData);
        }
      }
      handleCloseFormDialog();
      fetchClasses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save class');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getCapacityColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const calculateOccupancyPercentage = (current: number, capacity: number) => {
    return (current / capacity) * 100;
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Class Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage classes, sections, teachers, and student capacity
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          Add Class
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search classes..."
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Grade</InputLabel>
            <Select
              value={gradeFilter || ''}
              label="Grade"
              onChange={(e) => {
                setGradeFilter(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
            >
              <MenuItem value="">All Grades</MenuItem>
              {GRADES.map((grade) => (
                <MenuItem key={grade} value={grade}>
                  Grade {grade}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <IconButton onClick={fetchClasses}>
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
                    <TableCell>Class</TableCell>
                    <TableCell>Class Teacher</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Occupancy</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No classes found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((classItem) => (
                      <TableRow key={classItem.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon color="primary" />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                Grade {classItem.grade} - {classItem.section}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {classItem.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {classItem.class_teacher_name ? (
                              <>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {classItem.class_teacher_name}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not assigned
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{classItem.room_number || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {classItem.current_students} / {classItem.student_capacity}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 120 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="caption">
                                {calculateOccupancyPercentage(
                                  classItem.current_students,
                                  classItem.student_capacity
                                ).toFixed(0)}
                                %
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={calculateOccupancyPercentage(
                                classItem.current_students,
                                classItem.student_capacity
                              )}
                              color={getCapacityColor(
                                classItem.current_students,
                                classItem.student_capacity
                              )}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{classItem.academic_year || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={classItem.is_active ? 'Active' : 'Inactive'}
                            color={getStatusColor(classItem.is_active)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, classItem);
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
        <DialogTitle>Delete Class</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Grade {selectedClass?.grade} - {selectedClass?.section}?
            This action cannot be undone.
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
        <DialogTitle>{formMode === 'create' ? 'Add New Class' : 'Edit Class'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(formErrors.grade)}>
                <InputLabel>Grade *</InputLabel>
                <Select
                  value={formData.grade}
                  label="Grade *"
                  onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                >
                  {GRADES.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.grade && (
                  <Typography variant="caption" color="error">
                    {formErrors.grade}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(formErrors.section)}>
                <InputLabel>Section *</InputLabel>
                <Select
                  value={formData.section}
                  label="Section *"
                  onChange={(e) => setFormData({ ...formData, section: e.target.value as string })}
                >
                  {SECTIONS.map((section) => (
                    <MenuItem key={section} value={section}>
                      Section {section}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.section && (
                  <Typography variant="caption" color="error">
                    {formErrors.section}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Capacity *"
                type="number"
                value={formData.student_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    student_capacity: parseInt(e.target.value) || 0,
                  })
                }
                error={Boolean(formErrors.student_capacity)}
                helperText={formErrors.student_capacity}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Class Teacher</InputLabel>
                <Select
                  value={formData.class_teacher_id || ''}
                  label="Class Teacher"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      class_teacher_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.room_number || ''}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Academic Year"
                placeholder="e.g., 2024-2025"
                value={formData.academic_year || ''}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
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
    </Box>
  );
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
        class_teacher_id: Math.random() > 0.3 ? Math.floor(Math.random() * 50) + 1 : undefined,
        class_teacher_name:
          Math.random() > 0.3
            ? `${['Mr.', 'Ms.', 'Mrs.'][Math.floor(Math.random() * 3)]} ${
                ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]
              }`
            : undefined,
        student_capacity: grade <= 8 ? 35 : 40,
        current_students: Math.floor(Math.random() * (grade <= 8 ? 35 : 40)),
        room_number: `${grade}${section}${Math.floor(Math.random() * 9) + 1}`,
        academic_year: '2024-2025',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      });
    });
  }
  return mockClasses;
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

interface ClassListResponse {
  items: Class[];
  total: number;
  skip: number;
  limit: number;
}
