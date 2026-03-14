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
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Drawer,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Promote as PromoteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import studentsApi, { Student, StudentStatistics } from '@/api/students';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined);
  const [sectionFilter, setSectionFilter] = useState<number | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = isDemoUser()
        ? await demoDataApi.institutionAdmin.getStudentList({
            skip: page * rowsPerPage,
            limit: rowsPerPage,
            search: search || undefined,
            grade_id: gradeFilter,
            section_id: sectionFilter,
            status: statusFilter || undefined,
          })
        : await studentsApi.listStudents({
            skip: page * rowsPerPage,
            limit: rowsPerPage,
            search: search || undefined,
            is_active: activeFilter,
            status: statusFilter || undefined,
            gender: genderFilter || undefined,
            grade_id: gradeFilter,
            section_id: sectionFilter,
          });
      setStudents(response.items);
      setTotal(response.total);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = isDemoUser()
        ? {
            total_students: 25,
            active_students: 20,
            inactive_students: 5,
            male_students: 13,
            female_students: 12,
            students_by_grade: {},
            students_by_status: {},
          }
        : await studentsApi.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [
    page,
    rowsPerPage,
    search,
    activeFilter,
    statusFilter,
    genderFilter,
    gradeFilter,
    sectionFilter,
  ]);

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, student: Student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudent(null);
  };

  const handleView = () => {
    if (selectedStudent) {
      navigate(`/students/${selectedStudent.id}/profile`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedStudent) {
      navigate(`/students/${selectedStudent.id}/edit`);
    }
    handleMenuClose();
  };

  const handleViewIDCard = () => {
    if (selectedStudent) {
      navigate(`/students/${selectedStudent.id}/id-card`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;

    try {
      if (!isDemoUser()) {
        await studentsApi.deleteStudent(selectedStudent.id);
      }
      setDeleteDialogOpen(false);
      fetchStudents();
      fetchStatistics();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete student');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setActiveFilter(undefined);
    setStatusFilter('');
    setGenderFilter('');
    setGradeFilter(undefined);
    setSectionFilter(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'graduated':
        return 'info';
      case 'transferred':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Student Directory
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => navigate('/students/bulk-import')}
          >
            Bulk Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<PromoteIcon />}
            onClick={() => navigate('/students/promotion')}
          >
            Promote Students
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/students/new')}
          >
            Add Student
          </Button>
        </Stack>
      </Box>

      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Students
                </Typography>
                <Typography variant="h4">{statistics.total_students}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Students
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistics.active_students}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Male Students
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {statistics.male_students}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Female Students
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {statistics.female_students}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, email, admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFilterDrawerOpen(true)}
              >
                Advanced Filters
              </Button>
              <IconButton onClick={fetchStudents}>
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Admission No.</TableCell>
                  <TableCell>Class/Section</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          sx={{ mr: 2 }}
                        >
                          {student.first_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {student.first_name} {student.last_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {student.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{student.admission_number || '-'}</TableCell>
                    <TableCell>
                      {student.section
                        ? `${student.section.grade?.name || ''} - ${student.section.name}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.phone || '-'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {student.parent_phone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {student.gender ? (
                        <Chip
                          label={student.gender}
                          size="small"
                          color={student.gender === 'male' ? 'primary' : 'secondary'}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        size="small"
                        color={getStatusColor(student.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, student)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      </TableContainer>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <VisibilityIcon sx={{ mr: 1 }} /> View Profile
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleViewIDCard}>
          <BadgeIcon sx={{ mr: 1 }} /> View ID Card
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedStudent?.first_name}{' '}
            {selectedStudent?.last_name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
        <Box sx={{ width: 320, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Advanced Filters</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="graduated">Graduated</MenuItem>
                <MenuItem value="transferred">Transferred</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={genderFilter}
                label="Gender"
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Active Status</InputLabel>
              <Select
                value={activeFilter === undefined ? '' : activeFilter.toString()}
                label="Active Status"
                onChange={(e) =>
                  setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleClearFilters}
              startIcon={<CloseIcon />}
            >
              Clear Filters
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
