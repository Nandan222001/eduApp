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
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
  Tooltip,
} from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import attendanceApi, { AttendanceStatus, StudentAttendanceReport } from '@/api/attendance';
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

interface MonthlyAttendanceData {
  [studentId: number]: {
    [date: string]: AttendanceStatus;
  };
}

export default function AttendanceSheetPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData>({});

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

  const loadAttendanceData = async () => {
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const report = await attendanceApi.getSectionReport(
        selectedSection,
        startDateStr,
        endDateStr,
        selectedSubject || undefined
      );

      setAttendanceData(report);

      const monthlyDataMap: MonthlyAttendanceData = {};
      for (const student of report) {
        const detailedReport = await attendanceApi.getStudentDetailedReport(
          student.student_id,
          startDateStr,
          endDateStr,
          selectedSubject || undefined
        );

        monthlyDataMap[student.student_id] = {};
        detailedReport.attendances.forEach((att) => {
          monthlyDataMap[student.student_id][att.date] = att.status;
        });
      }

      setMonthlyData(monthlyDataMap);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getStatusColor = (status?: AttendanceStatus) => {
    if (!status) return theme.palette.grey[300];
    switch (status) {
      case AttendanceStatus.PRESENT:
        return theme.palette.success.main;
      case AttendanceStatus.ABSENT:
        return theme.palette.error.main;
      case AttendanceStatus.LATE:
        return theme.palette.warning.main;
      case AttendanceStatus.HALF_DAY:
        return theme.palette.info.main;
      default:
        return theme.palette.grey[300];
    }
  };

  const getStatusLabel = (status?: AttendanceStatus) => {
    if (!status) return 'No Data';
    return status.replace('_', ' ').toUpperCase();
  };

  const days = getDaysInMonth();

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Attendance Sheet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View monthly attendance records with calendar heatmap
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => alert('Export functionality will be implemented')}
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
            <Grid item xs={12} md={3}>
              <TextField
                type="month"
                fullWidth
                size="small"
                label="Month"
                value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Section"
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(Number(e.target.value))}
              >
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.grade_name ? `${section.grade_name} - ${section.name}` : section.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Subject (Optional)"
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
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={loadAttendanceData}
                disabled={!selectedSection || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                Load Data
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {attendanceData.length > 0 && (
        <>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Summary Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {Math.round(
                        attendanceData.reduce((sum, s) => sum + s.attendance_percentage, 0) /
                          attendanceData.length
                      )}
                      %
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg Attendance
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      {attendanceData.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Students
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      {attendanceData.reduce((sum, s) => sum + s.total_days, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Classes
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      {days.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Days in Month
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Heatmap View
              </Typography>

              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 800, mt: 2 }}>
                  <Grid container spacing={0.5} sx={{ mb: 1 }}>
                    <Grid item xs={2}>
                      <Typography variant="caption" fontWeight={600}>
                        Student
                      </Typography>
                    </Grid>
                    {days.map((day) => (
                      <Grid item key={day.toISOString()} sx={{ flex: 1, minWidth: 30 }}>
                        <Typography
                          variant="caption"
                          align="center"
                          display="block"
                          fontWeight={600}
                        >
                          {day.getDate()}
                        </Typography>
                      </Grid>
                    ))}
                    <Grid item xs={1}>
                      <Typography variant="caption" fontWeight={600} align="center" display="block">
                        %
                      </Typography>
                    </Grid>
                  </Grid>

                  {attendanceData.map((student) => (
                    <Grid container spacing={0.5} key={student.student_id} sx={{ mb: 0.5 }}>
                      <Grid item xs={2}>
                        <Tooltip title={student.admission_number || ''}>
                          <Typography variant="caption" noWrap>
                            {student.student_name}
                          </Typography>
                        </Tooltip>
                      </Grid>
                      {days.map((day) => {
                        const dateStr = day.toISOString().split('T')[0];
                        const status = monthlyData[student.student_id]?.[dateStr];
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                          <Grid item key={dateStr} sx={{ flex: 1, minWidth: 30 }}>
                            <Tooltip title={getStatusLabel(status)}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 24,
                                  bgcolor: isWeekend
                                    ? alpha(theme.palette.grey[400], 0.2)
                                    : getStatusColor(status),
                                  borderRadius: 0.5,
                                  border: `1px solid ${theme.palette.divider}`,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    zIndex: 1,
                                  },
                                }}
                              />
                            </Tooltip>
                          </Grid>
                        );
                      })}
                      <Grid item xs={1}>
                        <Chip
                          label={`${Math.round(student.attendance_percentage)}%`}
                          size="small"
                          color={student.attendance_percentage >= 75 ? 'success' : 'error'}
                          sx={{ height: 24, fontSize: '0.7rem' }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={600}>
                  Legend:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: theme.palette.success.main,
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">Present</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: theme.palette.error.main,
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">Absent</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: theme.palette.warning.main,
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">Late</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: theme.palette.info.main,
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">Half Day</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: theme.palette.grey[300],
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">No Data</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: alpha(theme.palette.grey[400], 0.2),
                      borderRadius: 0.5,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Typography variant="caption">Weekend</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && attendanceData.length === 0 && selectedSection && (
        <Alert severity="info">
          No attendance data found for the selected period. Please mark attendance first.
        </Alert>
      )}
    </Box>
  );
}
