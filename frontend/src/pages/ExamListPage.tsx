import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import examinationsApi from '@/api/examinations';
import { Exam, ExamStatus, ExamType } from '@/types/examination';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

export default function ExamListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [filterStatus, setFilterStatus] = useState<ExamStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ExamType | 'all'>('all');

  const loadExams = async () => {
    try {
      const params: Record<string, string | number> = { institution_id: 1 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.exam_type = filterType;

      const data = isDemoUser()
        ? await demoDataApi.institutionAdmin.getExamList(params)
        : await examinationsApi.listExams(params);
      setExams(data.items);
    } catch (err) {
      if ((err as { response?: { status?: number } }).response?.status === 404) {
        setExams([]);
      } else {
        setError(
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            'Failed to load exams'
        );
      }
    }
  };

  useEffect(() => {
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, exam: Exam) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExam(null);
  };

  const handleDelete = async () => {
    if (!selectedExam) return;

    try {
      if (!isDemoUser()) {
        await examinationsApi.deleteExam(selectedExam.id, 1);
      }
      setExams(exams.filter((e) => e.id !== selectedExam.id));
      handleMenuClose();
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to delete exam'
      );
    }
  };

  const getStatusColor = (status: ExamStatus) => {
    switch (status) {
      case ExamStatus.SCHEDULED:
        return 'info';
      case ExamStatus.ONGOING:
        return 'warning';
      case ExamStatus.COMPLETED:
        return 'success';
      case ExamStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: ExamType) => {
    switch (type) {
      case ExamType.FINAL:
        return 'error';
      case ExamType.MID_TERM:
        return 'warning';
      case ExamType.UNIT:
        return 'info';
      case ExamType.MOCK:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Examination Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage examinations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/examinations/create')}
        >
          Create New Exam
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ExamStatus | 'all')}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value={ExamStatus.SCHEDULED}>Scheduled</MenuItem>
                <MenuItem value={ExamStatus.ONGOING}>Ongoing</MenuItem>
                <MenuItem value={ExamStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={ExamStatus.CANCELLED}>Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filter by Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ExamType | 'all')}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value={ExamType.UNIT}>Unit Test</MenuItem>
                <MenuItem value={ExamType.MID_TERM}>Mid-term</MenuItem>
                <MenuItem value={ExamType.FINAL}>Final</MenuItem>
                <MenuItem value={ExamType.MOCK}>Mock</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                <TableCell sx={{ fontWeight: 600 }}>Exam Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Results</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      No exams found. Create your first exam to get started.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/admin/examinations/create')}
                      sx={{ mt: 2 }}
                    >
                      Create Exam
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{exam.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exam.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exam.exam_type.replace('_', ' ')}
                        color={getTypeColor(exam.exam_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>Grade {exam.grade_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(exam.start_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        to {new Date(exam.end_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={exam.status} color={getStatusColor(exam.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      {exam.result_published ? (
                        <Chip label="Published" color="success" size="small" />
                      ) : (
                        <Chip label="Not Published" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/admin/examinations/${exam.id}/marks-entry`)}
                          title="Enter Marks"
                        >
                          <AssignmentIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/admin/examinations/${exam.id}/verification`)}
                          title="Verify Marks"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => navigate(`/admin/examinations/${exam.id}/analytics`)}
                          title="View Analytics"
                        >
                          <BarChartIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, exam)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            navigate(`/admin/examinations/${selectedExam?.id}/edit`);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Exam
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/admin/examinations/${selectedExam?.id}/schedule`);
            handleMenuClose();
          }}
        >
          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
          Manage Schedule
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/admin/examinations/${selectedExam?.id}/results/generate`);
            handleMenuClose();
          }}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
          Generate Results
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Exam
        </MenuItem>
      </Menu>
    </Box>
  );
}
