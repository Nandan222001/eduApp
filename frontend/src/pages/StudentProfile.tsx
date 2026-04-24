import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Grade as GradeIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import studentsApi, { StudentProfile } from '@/api/students';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await studentsApi.getStudentProfile(parseInt(id));
      setStudent(data);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Student not found'}</Alert>
      </Box>
    );
  }

  const performanceChartData = {
    labels: student.recent_performance?.map((p) => p.exam_name) || [],
    datasets: [
      {
        label: 'Percentage',
        data: student.recent_performance?.map((p) => p.percentage) || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
    ],
  };

  const performanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const attendancePercentage = student.attendance_summary?.attendance_percentage || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/admin/users/students')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Student Profile
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<BadgeIcon />}
            onClick={() => navigate(`/admin/users/students/${id}/id-card`)}
          >
            View ID Card
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/users/students/${id}/edit`)}
          >
            Edit Profile
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={student.photo_url}
              alt={`${student.first_name} ${student.last_name}`}
              sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
            >
              {student.first_name[0]}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {student.first_name} {student.last_name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {student.admission_number}
            </Typography>
            <Chip
              label={student.status}
              color={student.status === 'active' ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />

            <Divider sx={{ my: 3 }} />

            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={student.email || 'Not provided'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary="Phone" secondary={student.phone || 'Not provided'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CakeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Date of Birth"
                  secondary={student.date_of_birth || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Class/Section"
                  secondary={
                    student.section
                      ? `${student.section.grade?.name || ''} - ${student.section.name}`
                      : 'Not assigned'
                  }
                />
              </ListItem>
            </List>
          </Paper>

          {student.parents_info && student.parents_info.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Parent Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {student.parents_info.map((parent) => (
                <Box key={parent.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {parent.first_name} {parent.last_name}
                    {parent.is_primary_contact && (
                      <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {parent.relation_type || 'Parent'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {parent.email}
                  </Typography>
                  <Typography variant="body2">{parent.phone}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Attendance</Typography>
                  </Box>
                  <Typography variant="h3" color="primary.main">
                    {attendancePercentage.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={attendancePercentage}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                  {student.attendance_summary && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block">
                        Present: {student.attendance_summary.present_days} /{' '}
                        {student.attendance_summary.total_days}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Absent: {student.attendance_summary.absent_days}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AssignmentIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Assignments</Typography>
                  </Box>
                  <Typography variant="h3" color="success.main">
                    {student.completed_assignments}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed out of {student.total_assignments}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      student.total_assignments > 0
                        ? (student.completed_assignments / student.total_assignments) * 100
                        : 0
                    }
                    color="success"
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">Pending</Typography>
                  </Box>
                  <Typography variant="h3" color="warning.main">
                    {student.pending_assignments}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Assignments due
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <GradeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Performance Chart
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {student.recent_performance && student.recent_performance.length > 0 ? (
                  <Line data={performanceChartData} options={performanceChartOptions} />
                ) : (
                  <Alert severity="info">No performance data available</Alert>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Exam Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {student.recent_performance && student.recent_performance.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Exam</TableCell>
                          <TableCell align="right">Marks Obtained</TableCell>
                          <TableCell align="right">Total Marks</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                          <TableCell align="right">Grade</TableCell>
                          <TableCell align="right">Rank</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {student.recent_performance.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.exam_name}</TableCell>
                            <TableCell align="right">{result.obtained_marks}</TableCell>
                            <TableCell align="right">{result.total_marks}</TableCell>
                            <TableCell align="right">{result.percentage.toFixed(2)}%</TableCell>
                            <TableCell align="right">
                              {result.grade ? (
                                <Chip label={result.grade} size="small" color="primary" />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right">{result.rank || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No exam results available</Alert>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Gender
                    </Typography>
                    <Typography variant="body1">{student.gender || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Blood Group
                    </Typography>
                    <Typography variant="body1">{student.blood_group || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Nationality
                    </Typography>
                    <Typography variant="body1">{student.nationality || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Religion
                    </Typography>
                    <Typography variant="body1">{student.religion || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Address
                    </Typography>
                    <Typography variant="body1">{student.address || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Medical Conditions
                    </Typography>
                    <Typography variant="body1">{student.medical_conditions || 'None'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      Name
                    </Typography>
                    <Typography variant="body1">{student.emergency_contact_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {student.emergency_contact_phone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      Relation
                    </Typography>
                    <Typography variant="body1">
                      {student.emergency_contact_relation || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
