import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import attendanceApi, {
  AttendanceStatus,
  CorrectionStatus,
  AttendanceCorrectionCreate,
  AttendanceCorrectionResponse,
  Attendance,
} from '@/api/attendance';
import studentsApi from '@/api/students';

interface Section {
  id: number;
  name: string;
  grade_name?: string;
}

export default function AttendanceCorrectionPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrectionResponse[]>([]);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadSections();
    loadCorrections();
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

  const loadAttendances = async () => {
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await attendanceApi.listAttendances({
        section_id: selectedSection,
        start_date: dateStr,
        end_date: dateStr,
      });

      setAttendances(response.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load attendances');
    } finally {
      setLoading(false);
    }
  };

  const loadCorrections = async () => {
    try {
      const response = await attendanceApi.listCorrections({});
      setCorrections(response.items);
    } catch (err) {
      console.error('Failed to load corrections:', err);
    }
  };

  const handleRequestCorrection = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setNewStatus(
      attendance.status === AttendanceStatus.PRESENT
        ? AttendanceStatus.ABSENT
        : AttendanceStatus.PRESENT
    );
    setReason('');
    setCorrectionDialogOpen(true);
  };

  const handleSubmitCorrection = async () => {
    if (!selectedAttendance) {
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for correction');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data: AttendanceCorrectionCreate = {
        institution_id: 1, // Will be set by backend from current user
        attendance_id: selectedAttendance.id,
        new_status: newStatus,
        reason: reason.trim(),
      };

      await attendanceApi.requestCorrection(data);
      setSuccess('Correction request submitted successfully!');
      setCorrectionDialogOpen(false);
      loadCorrections();
      loadAttendances();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to submit correction request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus | CorrectionStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
      case CorrectionStatus.APPROVED:
        return theme.palette.success.main;
      case AttendanceStatus.ABSENT:
      case CorrectionStatus.REJECTED:
        return theme.palette.error.main;
      case AttendanceStatus.LATE:
        return theme.palette.warning.main;
      case AttendanceStatus.HALF_DAY:
        return theme.palette.info.main;
      case CorrectionStatus.PENDING:
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: CorrectionStatus) => {
    switch (status) {
      case CorrectionStatus.APPROVED:
        return <CheckCircleIcon />;
      case CorrectionStatus.REJECTED:
        return <CancelIcon />;
      case CorrectionStatus.PENDING:
        return <PendingIcon />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Attendance Corrections
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Request corrections for historical attendance records
          </Typography>
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

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Select Date & Section
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
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
                  <Grid item xs={12} md={5}>
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
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={loadAttendances}
                      disabled={!selectedSection || loading}
                    >
                      Load Records
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {attendances.length > 0 && (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Attendance Records
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student ID</TableCell>
                          <TableCell>Current Status</TableCell>
                          <TableCell>Remarks</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendances.map((attendance) => (
                          <TableRow key={attendance.id} hover>
                            <TableCell>
                              <Typography variant="body2">{attendance.student_id}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={attendance.status.replace('_', ' ').toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getStatusColor(attendance.status), 0.1),
                                  color: getStatusColor(attendance.status),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {attendance.remarks || 'No remarks'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Request Correction">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleRequestCorrection(attendance)}
                                >
                                  <EditIcon fontSize="small" />
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
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Recent Correction Requests
                </Typography>

                {corrections.length === 0 ? (
                  <Alert severity="info">No correction requests found</Alert>
                ) : (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {corrections.slice(0, 10).map((correction) => (
                      <Paper
                        key={correction.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Request #{correction.id}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(correction.status)}
                            label={correction.status.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(correction.status), 0.1),
                              color: getStatusColor(correction.status),
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                          <Chip
                            label={correction.old_status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(correction.old_status), 0.1),
                              color: getStatusColor(correction.old_status),
                              fontSize: '0.7rem',
                            }}
                          />
                          <Typography variant="caption">→</Typography>
                          <Chip
                            label={correction.new_status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(correction.new_status), 0.1),
                              color: getStatusColor(correction.new_status),
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block">
                          <strong>Reason:</strong> {correction.reason}
                        </Typography>

                        {correction.review_remarks && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            <strong>Review:</strong> {correction.review_remarks}
                          </Typography>
                        )}

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {new Date(correction.created_at).toLocaleString()}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={correctionDialogOpen}
          onClose={() => setCorrectionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Request Attendance Correction</DialogTitle>
          <DialogContent>
            {selectedAttendance && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Requesting correction for attendance record. The request will be reviewed and
                  approved by an administrator.
                </Alert>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Status
                  </Typography>
                  <Chip
                    label={selectedAttendance.status.replace('_', ' ').toUpperCase()}
                    sx={{
                      bgcolor: alpha(getStatusColor(selectedAttendance.status), 0.1),
                      color: getStatusColor(selectedAttendance.status),
                    }}
                  />
                </Box>

                <TextField
                  select
                  fullWidth
                  label="New Status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value={AttendanceStatus.PRESENT}>Present</MenuItem>
                  <MenuItem value={AttendanceStatus.ABSENT}>Absent</MenuItem>
                  <MenuItem value={AttendanceStatus.LATE}>Late</MenuItem>
                  <MenuItem value={AttendanceStatus.HALF_DAY}>Half Day</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Reason for Correction"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a detailed reason for requesting this correction..."
                  required
                  error={!reason.trim() && reason !== ''}
                  helperText={
                    !reason.trim() && reason !== ''
                      ? 'Reason is required'
                      : 'This will be reviewed by an administrator'
                  }
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCorrectionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitCorrection}
              variant="contained"
              disabled={loading || !reason.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
