import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  PersonSearch as PersonSearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import attendanceApi, { AttendanceDefaulter } from '@/api/attendance';
import studentsApi from '@/api/students';

interface Section {
  id: number;
  name: string;
  grade_name?: string;
}

interface Subject {
  id: number;
  name: string;
}

export default function AttendanceDefaultersPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [thresholdPercentage, setThresholdPercentage] = useState<number>(75);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [defaulters, setDefaulters] = useState<AttendanceDefaulter[]>([]);

  useEffect(() => {
    loadSections();
    loadSubjects();
  }, []);

  const loadSections = async () => {
    try {
      const response = await studentsApi.listStudents({ limit: 1000 });
      const uniqueSections = Array.from(
        new Map(
          response.items.filter((s) => s.section).map((s) => [s.section!.id, s.section!])
        ).values()
      ) as Section[];
      setSections(uniqueSections);
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  };

  const loadSubjects = async () => {
    setSubjects([
      { id: 1, name: 'Mathematics' },
      { id: 2, name: 'Science' },
      { id: 3, name: 'English' },
      { id: 4, name: 'History' },
      { id: 5, name: 'Geography' },
    ]);
  };

  const loadDefaulters = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const data = await attendanceApi.getDefaulters(
        startDateStr,
        endDateStr,
        thresholdPercentage,
        selectedSection || undefined,
        selectedSubject || undefined
      );

      setDefaulters(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load defaulters data');
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return theme.palette.success.main;
    if (percentage >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSeverityLevel = (percentage: number) => {
    if (percentage < 50) return 'Critical';
    if (percentage < 65) return 'High';
    return 'Medium';
  };

  const getSeverityColor = (percentage: number) => {
    if (percentage < 50) return 'error';
    if (percentage < 65) return 'warning';
    return 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Attendance Defaulters Report
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Students with attendance below threshold ({thresholdPercentage}%)
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => alert('Export functionality will be implemented')}
            disabled={defaulters.length === 0}
          >
            Export Report
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={2}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date: Date | null) => date && setStartDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date: Date | null) => date && setEndDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Section"
                  value={selectedSection || ''}
                  onChange={(e) => setSelectedSection(Number(e.target.value) || null)}
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.grade_name
                        ? `${section.grade_name} - ${section.name}`
                        : section.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Subject"
                  value={selectedSubject || ''}
                  onChange={(e) => setSelectedSubject(Number(e.target.value) || null)}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Threshold %"
                  value={thresholdPercentage}
                  onChange={(e) => setThresholdPercentage(Number(e.target.value))}
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={loadDefaulters}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  Load Report
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {defaulters.length > 0 && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
                        <WarningIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {defaulters.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Defaulters
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          {defaulters.filter((d) => d.attendance_percentage < 50).length}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Critical
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Below 50%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: theme.palette.warning.main,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          {
                            defaulters.filter(
                              (d) => d.attendance_percentage >= 50 && d.attendance_percentage < 65
                            ).length
                          }
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          High Risk
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          50-65%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          {
                            defaulters.filter(
                              (d) => d.attendance_percentage >= 65 && d.attendance_percentage < 75
                            ).length
                          }
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Medium Risk
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          65-75%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Defaulters List
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">Rank</TableCell>
                        <TableCell width="25%">Student</TableCell>
                        <TableCell width="15%">Section</TableCell>
                        <TableCell align="center" width="10%">
                          Total Days
                        </TableCell>
                        <TableCell align="center" width="10%">
                          Present
                        </TableCell>
                        <TableCell align="center" width="10%">
                          Absent
                        </TableCell>
                        <TableCell width="15%">Attendance %</TableCell>
                        <TableCell width="10%">Severity</TableCell>
                        <TableCell align="center" width="10%">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {defaulters
                        .sort((a, b) => a.attendance_percentage - b.attendance_percentage)
                        .map((defaulter, index) => (
                          <TableRow
                            key={defaulter.student_id}
                            hover
                            sx={{
                              bgcolor:
                                defaulter.attendance_percentage < 50
                                  ? alpha(theme.palette.error.main, 0.05)
                                  : defaulter.attendance_percentage < 65
                                    ? alpha(theme.palette.warning.main, 0.05)
                                    : 'transparent',
                            }}
                          >
                            <TableCell>
                              <Chip
                                label={index + 1}
                                size="small"
                                color={
                                  getSeverityColor(defaulter.attendance_percentage) as
                                    | 'default'
                                    | 'error'
                                    | 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {defaulter.student_name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {defaulter.student_name}
                                  </Typography>
                                  {defaulter.admission_number && (
                                    <Typography variant="caption" color="text.secondary">
                                      {defaulter.admission_number}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {defaulter.section_name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{defaulter.total_days}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={defaulter.present_days}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={defaulter.absent_days}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color={getPercentageColor(defaulter.attendance_percentage)}
                                  >
                                    {defaulter.attendance_percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={defaulter.attendance_percentage}
                                  sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: alpha(
                                      getPercentageColor(defaulter.attendance_percentage),
                                      0.1
                                    ),
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: getPercentageColor(defaulter.attendance_percentage),
                                    },
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getSeverityLevel(defaulter.attendance_percentage)}
                                size="small"
                                color={
                                  getSeverityColor(defaulter.attendance_percentage) as
                                    | 'default'
                                    | 'error'
                                    | 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View Profile">
                                <IconButton size="small" color="primary">
                                  <PersonSearchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Contact Parent">
                                <IconButton size="small" color="info">
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}

        {!loading && defaulters.length === 0 && (
          <Alert severity="success" icon={<PersonSearchIcon />}>
            No defaulters found for the selected criteria. All students are maintaining good
            attendance!
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
}
