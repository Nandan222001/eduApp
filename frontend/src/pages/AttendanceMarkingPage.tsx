import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as LateIcon,
  WatchLater as HalfDayIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import attendanceApi, {
  AttendanceStatus,
  ClassRosterStudent,
  BulkAttendanceCreate,
} from '@/api/attendance';
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

export default function AttendanceMarkingPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<ClassRosterStudent[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    loadSections();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, selectedDate]);

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

  const loadStudents = async () => {
    if (!selectedSection) return;

    try {
      setLoading(true);
      const response = await studentsApi.listStudents({
        section_id: selectedSection,
        is_active: true,
        limit: 1000,
      });

      const dateStr = selectedDate.toISOString().split('T')[0];
      let existingAttendance: Array<{
        id: number;
        student_id: number;
        status: AttendanceStatus;
        remarks?: string;
      }> = [];

      try {
        const attendanceResponse = await attendanceApi.listAttendances({
          section_id: selectedSection,
          start_date: dateStr,
          end_date: dateStr,
          subject_id: selectedSubject || undefined,
        });
        existingAttendance = attendanceResponse.items;
      } catch (err: unknown) {
        console.error('Failed to load existing attendance:', err);
      }

      const roster: ClassRosterStudent[] = response.items.map((student) => {
        const attendance = existingAttendance.find((a) => a.student_id === student.id);
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          admission_number: student.admission_number,
          roll_number: student.roll_number,
          photo_url: student.photo_url,
          status: attendance?.status || AttendanceStatus.PRESENT,
          remarks: attendance?.remarks,
          attendance_id: attendance?.id,
        };
      });

      setStudents(roster);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        status,
      }))
    );
  };

  const handleToggleStatus = (studentId: number, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === studentId ? { ...student, remarks } : student))
    );
  };

  const handleSubmit = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const bulkData: BulkAttendanceCreate = {
        date: dateStr,
        section_id: selectedSection,
        subject_id: selectedSubject || undefined,
        attendances: students.map((student) => ({
          student_id: student.id,
          status: student.status,
          remarks: student.remarks,
        })),
      };

      const result = await attendanceApi.bulkMarkAttendance(bulkData);

      if (result.failed > 0) {
        setError(
          `Attendance marked with ${result.failed} errors. ${result.success} students marked successfully.`
        );
      } else {
        setSuccess(`Attendance marked successfully for ${result.success} students!`);
        setTimeout(() => setSuccess(null), 5000);
      }

      setConfirmDialogOpen(false);
      loadStudents();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case AttendanceStatus.ABSENT:
        return <CancelIcon sx={{ color: theme.palette.error.main }} />;
      case AttendanceStatus.LATE:
        return <LateIcon sx={{ color: theme.palette.warning.main }} />;
      case AttendanceStatus.HALF_DAY:
        return <HalfDayIcon sx={{ color: theme.palette.info.main }} />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return theme.palette.success.main;
      case AttendanceStatus.ABSENT:
        return theme.palette.error.main;
      case AttendanceStatus.LATE:
        return theme.palette.warning.main;
      case AttendanceStatus.HALF_DAY:
        return theme.palette.info.main;
    }
  };

  const getSummary = () => {
    const present = students.filter((s) => s.status === AttendanceStatus.PRESENT).length;
    const absent = students.filter((s) => s.status === AttendanceStatus.ABSENT).length;
    const late = students.filter((s) => s.status === AttendanceStatus.LATE).length;
    const halfDay = students.filter((s) => s.status === AttendanceStatus.HALF_DAY).length;
    return { present, absent, late, halfDay, total: students.length };
  };

  const summary = getSummary();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Mark Attendance
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Record student attendance for classes
            </Typography>
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

        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={(date: Date | null) => date && setSelectedDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
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
                      {section.grade_name
                        ? `${section.grade_name} - ${section.name}`
                        : section.name}
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
                  variant="outlined"
                  size="large"
                  onClick={loadStudents}
                  disabled={!selectedSection}
                >
                  Load Students
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
                    >
                      Mark All Present
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
                    >
                      Mark All Absent
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`Present: ${summary.present}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<CancelIcon />}
                    label={`Absent: ${summary.absent}`}
                    color="error"
                    variant="outlined"
                  />
                  <Chip
                    icon={<LateIcon />}
                    label={`Late: ${summary.late}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    icon={<HalfDayIcon />}
                    label={`Half Day: ${summary.halfDay}`}
                    color="info"
                    variant="outlined"
                  />
                  <Chip label={`Total: ${summary.total}`} variant="outlined" />
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Student Roster
                </Typography>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {students.map((student) => (
                      <Grid item xs={12} key={student.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `2px solid ${alpha(getStatusColor(student.status), 0.3)}`,
                            borderRadius: 2,
                            bgcolor: alpha(getStatusColor(student.status), 0.05),
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Badge
                              badgeContent={getStatusIcon(student.status)}
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            >
                              <Avatar
                                src={student.photo_url}
                                alt={`${student.first_name} ${student.last_name}`}
                                sx={{ width: 56, height: 56 }}
                              >
                                {student.first_name.charAt(0)}
                              </Avatar>
                            </Badge>

                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" fontWeight={600}>
                                {student.first_name} {student.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.admission_number &&
                                  `Admission: ${student.admission_number}`}
                                {student.roll_number && ` • Roll: ${student.roll_number}`}
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Present">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleToggleStatus(student.id, AttendanceStatus.PRESENT)
                                  }
                                  sx={{
                                    color:
                                      student.status === AttendanceStatus.PRESENT
                                        ? theme.palette.success.main
                                        : 'text.secondary',
                                    bgcolor:
                                      student.status === AttendanceStatus.PRESENT
                                        ? alpha(theme.palette.success.main, 0.1)
                                        : 'transparent',
                                  }}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Absent">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleToggleStatus(student.id, AttendanceStatus.ABSENT)
                                  }
                                  sx={{
                                    color:
                                      student.status === AttendanceStatus.ABSENT
                                        ? theme.palette.error.main
                                        : 'text.secondary',
                                    bgcolor:
                                      student.status === AttendanceStatus.ABSENT
                                        ? alpha(theme.palette.error.main, 0.1)
                                        : 'transparent',
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Late">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleToggleStatus(student.id, AttendanceStatus.LATE)
                                  }
                                  sx={{
                                    color:
                                      student.status === AttendanceStatus.LATE
                                        ? theme.palette.warning.main
                                        : 'text.secondary',
                                    bgcolor:
                                      student.status === AttendanceStatus.LATE
                                        ? alpha(theme.palette.warning.main, 0.1)
                                        : 'transparent',
                                  }}
                                >
                                  <LateIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Half Day">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleToggleStatus(student.id, AttendanceStatus.HALF_DAY)
                                  }
                                  sx={{
                                    color:
                                      student.status === AttendanceStatus.HALF_DAY
                                        ? theme.palette.info.main
                                        : 'text.secondary',
                                    bgcolor:
                                      student.status === AttendanceStatus.HALF_DAY
                                        ? alpha(theme.palette.info.main, 0.1)
                                        : 'transparent',
                                  }}
                                >
                                  <HalfDayIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>

                            <TextField
                              size="small"
                              placeholder="Remarks (optional)"
                              value={student.remarks || ''}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              sx={{ width: 200 }}
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<CloseIcon />}
                onClick={() => setStudents([])}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                Submit Attendance
              </Button>
            </Box>
          </>
        )}

        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Attendance Submission</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              You are about to submit attendance for:
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Date:</strong> {selectedDate.toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                <strong>Section:</strong> {sections.find((s) => s.id === selectedSection)?.name}
              </Typography>
              {selectedSubject && (
                <Typography variant="body2">
                  <strong>Subject:</strong> {subjects.find((s) => s.id === selectedSubject)?.name}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Total Students:</strong> {summary.total}
              </Typography>
              <Typography variant="body2" color="success.main">
                <strong>Present:</strong> {summary.present}
              </Typography>
              <Typography variant="body2" color="error.main">
                <strong>Absent:</strong> {summary.absent}
              </Typography>
              <Typography variant="body2" color="warning.main">
                <strong>Late:</strong> {summary.late}
              </Typography>
              <Typography variant="body2" color="info.main">
                <strong>Half Day:</strong> {summary.halfDay}
              </Typography>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              This will record attendance for all students in the roster. You can request
              corrections later if needed.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSubmit} variant="contained" disabled={loading}>
              Confirm & Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
