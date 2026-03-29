import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  TextField,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Promote as PromoteIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import studentsApi, { Student, StudentPromotionRequest } from '@/api/students';

interface PromotionCriteria {
  minAttendancePercentage: number;
  minPassPercentage: number;
  autoFailSubjects: string[];
  enableAutoFail: boolean;
  minSubjectPassPercentage: number;
}

interface SubjectScore {
  subject: string;
  marks: number;
  totalMarks: number;
  percentage: number;
}

interface PromotionResult {
  studentId: number;
  studentName: string;
  status: 'pass' | 'fail' | 'detained';
  reason?: string;
  attendance: number;
  averageMarks: number;
  failedSubjects: string[];
  subjectScores: SubjectScore[];
}

export default function StudentPromotion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sourceGradeId, setSourceGradeId] = useState<number | ''>('');
  const [sourceSectionId, setSourceSectionId] = useState<number | ''>('');
  const [targetGradeId, setTargetGradeId] = useState<number | ''>('');
  const [targetSectionId, setTargetSectionId] = useState<number | ''>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [criteria, setCriteria] = useState<PromotionCriteria>({
    minAttendancePercentage: 75,
    minPassPercentage: 40,
    minSubjectPassPercentage: 33,
    autoFailSubjects: ['Mathematics', 'English'],
    enableAutoFail: true,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewResults, setPreviewResults] = useState<PromotionResult[]>([]);
  const [showTCDialog, setShowTCDialog] = useState(false);
  const [tcStudentIds, setTcStudentIds] = useState<number[]>([]);
  const [tcReason, setTcReason] = useState('');

  const [promotionHistory] = useState([
    {
      id: 1,
      date: '2023-04-15',
      fromGrade: 'Grade 9',
      toGrade: 'Grade 10',
      studentsPromoted: 45,
      studentsFailed: 3,
      studentsDetained: 2,
      performedBy: 'Admin User',
    },
    {
      id: 2,
      date: '2023-04-10',
      fromGrade: 'Grade 8',
      toGrade: 'Grade 9',
      studentsPromoted: 48,
      studentsFailed: 2,
      studentsDetained: 1,
      performedBy: 'Admin User',
    },
    {
      id: 3,
      date: '2023-04-08',
      fromGrade: 'Grade 7',
      toGrade: 'Grade 8',
      studentsPromoted: 52,
      studentsFailed: 1,
      studentsDetained: 0,
      performedBy: 'Admin User',
    },
  ]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await studentsApi.listStudents({
        grade_id: sourceGradeId || undefined,
        section_id: sourceSectionId || undefined,
        is_active: true,
        limit: 100,
      });
      setStudents(response.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (sourceGradeId || sourceSectionId) {
      fetchStudents();
    }
  }, [sourceGradeId, sourceSectionId]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const generateMockSubjectScores = (): SubjectScore[] => {
    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];
    return subjects.map((subject) => {
      const marks = Math.floor(Math.random() * 60) + 40;
      const totalMarks = 100;
      return {
        subject,
        marks,
        totalMarks,
        percentage: (marks / totalMarks) * 100,
      };
    });
  };

  const generatePreview = () => {
    const results: PromotionResult[] = students
      .filter((s) => selectedStudents.has(s.id))
      .map((student) => {
        const attendance = student.attendance_percentage || 0;
        const averageMarks = student.average_score || 0;
        const subjectScores = generateMockSubjectScores();
        const failedSubjects: string[] = subjectScores
          .filter((score) => score.percentage < criteria.minSubjectPassPercentage)
          .map((score) => score.subject);

        let status: 'pass' | 'fail' | 'detained' = 'pass';
        let reason = '';

        if (attendance < criteria.minAttendancePercentage) {
          status = 'detained';
          reason = `Low attendance: ${attendance.toFixed(1)}% (Required: ${criteria.minAttendancePercentage}%)`;
        } else if (averageMarks < criteria.minPassPercentage) {
          status = 'fail';
          reason = `Below minimum pass percentage: ${averageMarks.toFixed(1)}% (Required: ${criteria.minPassPercentage}%)`;
        } else if (
          criteria.enableAutoFail &&
          criteria.autoFailSubjects.some((subject) => failedSubjects.includes(subject))
        ) {
          status = 'fail';
          const failedCoreSubjects = criteria.autoFailSubjects.filter((subject) =>
            failedSubjects.includes(subject)
          );
          reason = `Failed in core subject(s): ${failedCoreSubjects.join(', ')}`;
        } else if (failedSubjects.length > 0) {
          status = 'fail';
          reason = `Failed in subject(s): ${failedSubjects.join(', ')}`;
        }

        return {
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          status,
          reason,
          attendance,
          averageMarks,
          failedSubjects,
          subjectScores,
        };
      });

    setPreviewResults(results);
    setShowPreview(true);
  };

  const handlePromote = async () => {
    if (!targetGradeId) {
      setError('Please select a target grade');
      return;
    }

    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }

    try {
      setLoading(true);
      const data: StudentPromotionRequest = {
        student_ids: Array.from(selectedStudents),
        target_grade_id: targetGradeId as number,
        target_section_id: targetSectionId || undefined,
        effective_date: effectiveDate || undefined,
      };

      const result = await studentsApi.promoteStudents(data);

      if (result.promoted > 0) {
        setSuccess(`Successfully promoted ${result.promoted} student(s)`);
        setSelectedStudents(new Set());
        fetchStudents();
      }

      if (result.failed > 0) {
        setError(`Failed to promote ${result.failed} student(s)`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to promote students');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTCs = () => {
    const leavingStudents = previewResults
      .filter((r) => r.status === 'fail' || r.status === 'detained')
      .map((r) => r.studentId);
    setTcStudentIds(leavingStudents);
    setTcReason('');
    setShowTCDialog(true);
  };

  const handleConfirmTCGeneration = () => {
    setSuccess(`Generated ${tcStudentIds.length} Transfer Certificate(s)`);
    setShowTCDialog(false);
  };

  const allSelected = students.length > 0 && selectedStudents.size === students.length;
  const someSelected = selectedStudents.size > 0 && selectedStudents.size < students.length;

  const passCount = previewResults.filter((r) => r.status === 'pass').length;
  const failCount = previewResults.filter((r) => r.status === 'fail').length;
  const detainedCount = previewResults.filter((r) => r.status === 'detained').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Promote Students
        </Typography>
      </Box>

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

      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Promotion Criteria Configuration
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Attendance Requirements
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Attendance %"
                type="number"
                value={criteria.minAttendancePercentage}
                onChange={(e) =>
                  setCriteria({ ...criteria, minAttendancePercentage: Number(e.target.value) })
                }
                inputProps={{ min: 0, max: 100 }}
                helperText="Students below this threshold will be detained"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Academic Requirements
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Overall Pass Percentage"
                type="number"
                value={criteria.minPassPercentage}
                onChange={(e) =>
                  setCriteria({ ...criteria, minPassPercentage: Number(e.target.value) })
                }
                inputProps={{ min: 0, max: 100 }}
                helperText="Minimum average marks required to pass"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Subject Pass Percentage"
                type="number"
                value={criteria.minSubjectPassPercentage}
                onChange={(e) =>
                  setCriteria({ ...criteria, minSubjectPassPercentage: Number(e.target.value) })
                }
                inputProps={{ min: 0, max: 100 }}
                helperText="Minimum marks required per subject"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Auto-Fail Subjects Handling
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={criteria.enableAutoFail}
                    onChange={(e) => setCriteria({ ...criteria, enableAutoFail: e.target.checked })}
                  />
                }
                label="Enable Auto-Fail for Core Subjects"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Auto-Fail Subjects (comma-separated)"
                value={criteria.autoFailSubjects.join(', ')}
                onChange={(e) =>
                  setCriteria({
                    ...criteria,
                    autoFailSubjects: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                placeholder="Mathematics, English"
                helperText="Failing these subjects results in overall fail"
                disabled={!criteria.enableAutoFail}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Source Class
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Source Grade</InputLabel>
              <Select
                value={sourceGradeId}
                label="Source Grade"
                onChange={(e) => setSourceGradeId(e.target.value as number)}
              >
                <MenuItem value="">Select Grade</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <MenuItem key={g} value={g}>
                    Grade {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Source Section (Optional)</InputLabel>
              <Select
                value={sourceSectionId}
                label="Source Section (Optional)"
                onChange={(e) => setSourceSectionId(e.target.value as number)}
              >
                <MenuItem value="">All Sections</MenuItem>
                <MenuItem value={1}>Section A</MenuItem>
                <MenuItem value={2}>Section B</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Target Class
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Target Grade</InputLabel>
              <Select
                value={targetGradeId}
                label="Target Grade"
                onChange={(e) => setTargetGradeId(e.target.value as number)}
              >
                <MenuItem value="">Select Grade</MenuItem>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <MenuItem key={g} value={g}>
                    Grade {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Target Section (Optional)</InputLabel>
              <Select
                value={targetSectionId}
                label="Target Section (Optional)"
                onChange={(e) => setTargetSectionId(e.target.value as number)}
              >
                <MenuItem value="">Auto Assign</MenuItem>
                <MenuItem value={1}>Section A</MenuItem>
                <MenuItem value={2}>Section B</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Effective Date (Optional)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {students.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box
            sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="h6">Select Students ({selectedStudents.size} selected)</Typography>
            <Box>
              <Button
                variant="outlined"
                onClick={generatePreview}
                disabled={selectedStudents.size === 0}
                sx={{ mr: 1 }}
                startIcon={<SchoolIcon />}
              >
                Preview Results
              </Button>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
              />
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Admission No.</TableCell>
                  <TableCell>Current Class</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell>Avg Score</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingStudents ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow
                      key={student.id}
                      hover
                      onClick={() => handleSelectStudent(student.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedStudents.has(student.id)} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={student.photo_url}
                            alt={`${student.first_name} ${student.last_name}`}
                            sx={{ width: 40, height: 40 }}
                          >
                            {student.first_name[0]}
                            {student.last_name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {student.first_name} {student.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{student.admission_number || '-'}</TableCell>
                      <TableCell>
                        {student.section
                          ? `${student.section.grade?.name || '-'} / ${student.section.name}`
                          : '-'}
                      </TableCell>
                      <TableCell>{(student.attendance_percentage || 0).toFixed(1)}%</TableCell>
                      <TableCell>{(student.average_score || 0).toFixed(1)}%</TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={student.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Promotion History
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {promotionHistory.map((record, index) => (
              <div key={record.id}>
                <ListItem>
                  <ListItemText
                    primary={`${record.fromGrade} → ${record.toGrade}`}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" component="div">
                          {record.studentsPromoted} promoted, {record.studentsFailed} failed,{' '}
                          {record.studentsDetained} detained
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Performed on {new Date(record.date).toLocaleDateString()} by{' '}
                          {record.performedBy}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < promotionHistory.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/admin/students')}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <PromoteIcon />}
          onClick={handlePromote}
          disabled={loading || selectedStudents.size === 0 || !targetGradeId}
        >
          {loading ? 'Promoting...' : `Promote ${selectedStudents.size} Student(s)`}
        </Button>
      </Box>

      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Promotion Report Preview</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
            <Grid item xs={4}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon />
                    <Box>
                      <Typography variant="h4">{passCount}</Typography>
                      <Typography variant="caption">Pass</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ErrorIcon />
                    <Box>
                      <Typography variant="h4">{failCount}</Typography>
                      <Typography variant="caption">Fail</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ bgcolor: 'warning.light' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <WarningIcon />
                    <Box>
                      <Typography variant="h4">{detainedCount}</Typography>
                      <Typography variant="caption">Detained</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell>Avg Marks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewResults.map((result) => (
                  <TableRow key={result.studentId}>
                    <TableCell>{result.studentName}</TableCell>
                    <TableCell>{result.attendance.toFixed(1)}%</TableCell>
                    <TableCell>{result.averageMarks.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Chip
                        label={result.status.toUpperCase()}
                        color={
                          result.status === 'pass'
                            ? 'success'
                            : result.status === 'fail'
                              ? 'error'
                              : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {result.reason || 'Eligible for promotion'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleGenerateTCs}
            disabled={failCount + detainedCount === 0}
          >
            Generate TCs for Leaving Students ({failCount + detainedCount})
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showTCDialog} onClose={() => setShowTCDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Generate Transfer Certificates
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2, mb: 2 }}>
            Generate Transfer Certificates for {tcStudentIds.length} student(s) who are leaving?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for TC"
            value={tcReason}
            onChange={(e) => setTcReason(e.target.value)}
            placeholder="E.g., Failed to meet promotion criteria, Parent request, etc."
            helperText="Optional: Provide reason for leaving"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTCDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmTCGeneration}
            startIcon={<DownloadIcon />}
          >
            Generate TCs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
