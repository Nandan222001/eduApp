import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as LateIcon,
  WatchLater as HalfDayIcon,
} from '@mui/icons-material';
import {
  TouchOptimizedButton,
  TouchOptimizedTextField,
  MobileAttendanceMarking,
  CollapsibleSection,
} from '@/components/mobile';
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

export default function MobileAttendanceMarkingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<ClassRosterStudent[]>([]);

  useEffect(() => {
    loadSections();
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
        });
        existingAttendance = attendanceResponse.items;
      } catch (err) {
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

  const handleStatusChange = (studentId: number, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        status,
      }))
    );
  };

  const handleSubmit = async () => {
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

      loadStudents();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to mark attendance');
    } finally {
      setLoading(false);
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

  if (!isMobile) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Mark Attendance
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <CollapsibleSection title="Select Date & Section" defaultExpanded={true} elevation={2}>
            <Stack spacing={2}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={(date: Date | null) => date && setSelectedDate(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
              <TouchOptimizedTextField
                select
                fullWidth
                label="Section"
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(Number(e.target.value))}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select Section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.grade_name ? `${section.grade_name} - ${section.name}` : section.name}
                  </option>
                ))}
              </TouchOptimizedTextField>
            </Stack>
          </CollapsibleSection>

          {students.length > 0 && (
            <>
              <Box sx={{ mt: 2 }}>
                <CollapsibleSection
                  title="Summary"
                  subtitle={`${summary.total} students`}
                  defaultExpanded={false}
                  elevation={2}
                >
                  <Stack spacing={1}>
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
                  </Stack>
                </CollapsibleSection>
              </Box>

              <Box sx={{ mt: 2 }}>
                <CollapsibleSection title="Quick Actions" defaultExpanded={false} elevation={2}>
                  <Stack spacing={1}>
                    <TouchOptimizedButton
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
                    >
                      Mark All Present
                    </TouchOptimizedButton>
                    <TouchOptimizedButton
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
                    >
                      Mark All Absent
                    </TouchOptimizedButton>
                  </Stack>
                </CollapsibleSection>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Student Roster
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <MobileAttendanceMarking
                    students={students}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </Box>

              <Box sx={{ mt: 3, mb: 2 }}>
                <TouchOptimizedButton
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  Submit Attendance
                </TouchOptimizedButton>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
