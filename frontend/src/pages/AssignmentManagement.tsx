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
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Grade as GradeIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { assignmentApi, submissionApi } from '@/api/assignments';
import subjectsApi, { Subject } from '@/api/subjects';
import {
  Assignment,
  AssignmentCreateInput,
  AssignmentStatus,
  Submission,
  SubmissionStatus,
  SubmissionGradeInput,
} from '@/types/assignment';

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
      id={`assignment-tabpanel-${index}`}
      aria-labelledby={`assignment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AssignmentManagement() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | undefined>(undefined);
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined);
  const [subjectFilter, setSubjectFilter] = useState<number | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState<SubmissionGradeInput>({
    marks_obtained: 0,
    grade: '',
    feedback: '',
  });
  const [statistics, setStatistics] = useState<Record<string, number | string | boolean> | null>(
    null
  );
  const [analytics, setAnalytics] = useState<Record<string, number | string | boolean> | null>(
    null
  );

  const [formData, setFormData] = useState<AssignmentCreateInput>({
    institution_id: 1,
    teacher_id: 1,
    grade_id: 1,
    section_id: undefined,
    subject_id: 1,
    chapter_id: undefined,
    title: '',
    description: '',
    content: '',
    instructions: '',
    due_date: '',
    publish_date: '',
    close_date: '',
    max_marks: 100,
    passing_marks: 40,
    allow_late_submission: false,
    late_penalty_percentage: 0,
    max_file_size_mb: 10,
    allowed_file_types: 'pdf,doc,docx,jpg,png',
    status: AssignmentStatus.DRAFT,
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentApi.list({
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter,
        grade_id: gradeFilter,
        subject_id: subjectFilter,
      });
      setAssignments(response.items || []);
      setTotal(response.total || 0);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectsApi.listSubjects({ limit: 100, is_active: true });
      setSubjects(response.items);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchSubmissions = async (assignmentId: number) => {
    try {
      const response = await assignmentApi.listSubmissions(assignmentId);
      setSelectedSubmissions(response.items || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const fetchStatistics = async (assignmentId: number) => {
    try {
      const response = await assignmentApi.getStatistics(assignmentId);
      setStatistics(response);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const fetchAnalytics = async (assignmentId: number) => {
    try {
      const response = await assignmentApi.getAnalytics(assignmentId);
      setAnalytics(response);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, statusFilter, gradeFilter, subjectFilter]);

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assignment: Assignment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormData({
      institution_id: 1,
      teacher_id: 1,
      grade_id: 1,
      section_id: undefined,
      subject_id: 1,
      chapter_id: undefined,
      title: '',
      description: '',
      content: '',
      instructions: '',
      due_date: '',
      publish_date: '',
      close_date: '',
      max_marks: 100,
      passing_marks: 40,
      allow_late_submission: false,
      late_penalty_percentage: 0,
      max_file_size_mb: 10,
      allowed_file_types: 'pdf,doc,docx,jpg,png',
      status: AssignmentStatus.DRAFT,
    });
    setFormDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedAssignment) {
      setFormMode('edit');
      setFormData({
        institution_id: selectedAssignment.institution_id,
        teacher_id: selectedAssignment.teacher_id,
        grade_id: selectedAssignment.grade_id,
        section_id: selectedAssignment.section_id,
        subject_id: selectedAssignment.subject_id,
        chapter_id: selectedAssignment.chapter_id,
        title: selectedAssignment.title,
        description: selectedAssignment.description || '',
        content: selectedAssignment.content || '',
        instructions: selectedAssignment.instructions || '',
        due_date: selectedAssignment.due_date || '',
        publish_date: selectedAssignment.publish_date || '',
        close_date: selectedAssignment.close_date || '',
        max_marks: selectedAssignment.max_marks,
        passing_marks: selectedAssignment.passing_marks,
        allow_late_submission: selectedAssignment.allow_late_submission,
        late_penalty_percentage: selectedAssignment.late_penalty_percentage,
        max_file_size_mb: selectedAssignment.max_file_size_mb,
        allowed_file_types: selectedAssignment.allowed_file_types,
        status: selectedAssignment.status,
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
    if (!selectedAssignment) return;

    try {
      await assignmentApi.delete(selectedAssignment.id);
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete assignment');
    }
  };

  const handleFormSubmit = async () => {
    try {
      setSubmitting(true);
      if (formMode === 'create') {
        await assignmentApi.create(formData);
      } else if (selectedAssignment) {
        await assignmentApi.update(selectedAssignment.id, formData);
      }
      setFormDialogOpen(false);
      fetchAssignments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await fetchSubmissions(assignment.id);
    setTabValue(1);
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      marks_obtained: submission.marks_obtained || 0,
      grade: submission.grade || '',
      feedback: submission.feedback || '',
    });
    setGradingDialogOpen(true);
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);
      await submissionApi.grade(selectedSubmission.id, gradeData);
      setGradingDialogOpen(false);
      if (selectedAssignment) {
        await fetchSubmissions(selectedAssignment.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to grade submission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAnalytics = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await fetchStatistics(assignment.id);
    await fetchAnalytics(assignment.id);
    setTabValue(2);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.PUBLISHED:
        return 'success';
      case AssignmentStatus.DRAFT:
        return 'warning';
      case AssignmentStatus.CLOSED:
        return 'error';
      case AssignmentStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getSubmissionStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.GRADED:
        return 'success';
      case SubmissionStatus.SUBMITTED:
        return 'info';
      case SubmissionStatus.LATE_SUBMITTED:
        return 'warning';
      case SubmissionStatus.NOT_SUBMITTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Assignment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage assignments across all classes
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Assignment
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
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}
        >
          <Tab label="All Assignments" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Submissions" icon={<CheckCircleIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<BarChartIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search assignments..."
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter || ''}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value ? (e.target.value as AssignmentStatus) : undefined
                  );
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={AssignmentStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={AssignmentStatus.PUBLISHED}>Published</MenuItem>
                <MenuItem value={AssignmentStatus.CLOSED}>Closed</MenuItem>
                <MenuItem value={AssignmentStatus.ARCHIVED}>Archived</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Grade</InputLabel>
              <Select
                value={gradeFilter || ''}
                label="Grade"
                onChange={(e) => {
                  setGradeFilter(e.target.value ? Number(e.target.value) : undefined);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    Grade {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={subjectFilter || ''}
                label="Subject"
                onChange={(e) => {
                  setSubjectFilter(e.target.value ? Number(e.target.value) : undefined);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={fetchAssignments}>
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
                      <TableCell>Title</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Max Marks</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submissions</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="text.secondary" py={4}>
                            No assignments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((assignment) => (
                        <TableRow key={assignment.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.title}
                              </Typography>
                              {assignment.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {assignment.description.substring(0, 60)}
                                  {assignment.description.length > 60 ? '...' : ''}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              Grade {assignment.grade_id}
                              {assignment.section_id ? ` - Section ${assignment.section_id}` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                subjects.find((s) => s.id === assignment.subject_id)?.name || 'N/A'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {formatDate(assignment.due_date)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{assignment.max_marks}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={assignment.status}
                              color={getStatusColor(assignment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewSubmissions(assignment)}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, assignment);
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
          {selectedAssignment ? (
            <Box sx={{ p: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {selectedAssignment.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Grade {selectedAssignment.grade_id} - Due:{' '}
                  {formatDate(selectedAssignment.due_date)}
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Submitted At</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Marks</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" py={4}>
                            No submissions yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedSubmissions.map((submission) => (
                        <TableRow key={submission.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {submission.student_name?.charAt(0) || 'S'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {submission.student_name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {submission.student_roll_number || '-'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(submission.submitted_at)}
                            </Typography>
                            {submission.is_late && (
                              <Chip label="Late" color="warning" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={submission.status}
                              color={getSubmissionStatusColor(submission.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {submission.marks_obtained !== undefined
                                ? `${submission.marks_obtained} / ${selectedAssignment.max_marks}`
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<GradeIcon />}
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Grade
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select an assignment to view submissions
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {selectedAssignment && statistics && analytics ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Analytics for {selectedAssignment.title}
              </Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon color="primary" />
                        <Typography variant="h4" fontWeight={700}>
                          {statistics.total_submissions || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Total Submissions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" />
                        <Typography variant="h4" fontWeight={700}>
                          {statistics.graded_count || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Graded
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PendingIcon color="warning" />
                        <Typography variant="h4" fontWeight={700}>
                          {statistics.pending_count || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon color="info" />
                        <Typography variant="h4" fontWeight={700}>
                          {typeof analytics.average_marks === 'number'
                            ? analytics.average_marks.toFixed(1)
                            : 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Average Marks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Submission Progress
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Completion Rate</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {statistics.submission_rate
                              ? `${(Number(statistics.submission_rate) * 100).toFixed(1)}%`
                              : '0%'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            statistics.submission_rate
                              ? Number(statistics.submission_rate) * 100
                              : 0
                          }
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Performance Distribution
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                            }}
                          >
                            <Typography variant="h5" fontWeight={700} color="success.main">
                              {analytics.pass_count || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Passed
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                            }}
                          >
                            <Typography variant="h5" fontWeight={700} color="error.main">
                              {analytics.fail_count || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Failed
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                            }}
                          >
                            <Typography variant="h5" fontWeight={700} color="info.main">
                              {analytics.highest_marks || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Highest Score
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Select an assignment to view analytics
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedAssignment) {
              handleViewSubmissions(selectedAssignment);
            }
            handleMenuClose();
          }}
        >
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          View Submissions
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedAssignment) {
              handleViewAnalytics(selectedAssignment);
            }
            handleMenuClose();
          }}
        >
          <BarChartIcon sx={{ mr: 1 }} fontSize="small" />
          View Analytics
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Assignment
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to delete &quot;{selectedAssignment?.title}&quot;? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{formMode === 'create' ? 'Create Assignment' : 'Edit Assignment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={formData.grade_id}
                  label="Grade"
                  onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject_id}
                  label="Subject"
                  onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Publish Date"
                type="datetime-local"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Marks"
                type="number"
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passing Marks"
                type="number"
                value={formData.passing_marks}
                onChange={(e) =>
                  setFormData({ ...formData, passing_marks: Number(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as AssignmentStatus })
                  }
                >
                  <MenuItem value={AssignmentStatus.DRAFT}>Draft</MenuItem>
                  <MenuItem value={AssignmentStatus.PUBLISHED}>Published</MenuItem>
                  <MenuItem value={AssignmentStatus.CLOSED}>Closed</MenuItem>
                  <MenuItem value={AssignmentStatus.ARCHIVED}>Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFormSubmit} disabled={submitting}>
            {submitting ? (
              <CircularProgress size={24} />
            ) : formMode === 'create' ? (
              'Create'
            ) : (
              'Save'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={gradingDialogOpen}
        onClose={() => setGradingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Marks Obtained"
                type="number"
                value={gradeData.marks_obtained}
                onChange={(e) =>
                  setGradeData({ ...gradeData, marks_obtained: Number(e.target.value) })
                }
                inputProps={{
                  max: selectedAssignment?.max_marks,
                  min: 0,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Grade"
                value={gradeData.grade}
                onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                placeholder="e.g., A, B+, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Feedback"
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGradeSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Submit Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
