import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  Grid,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import examinationsApi from '@/api/examinations';
import { ExamMarks } from '@/types/examination';

interface SubjectVerificationStatus {
  subject_id: number;
  subject_name: string;
  total_students: number;
  marks_entered: number;
  verified: boolean;
  verified_by?: string;
  verification_date?: string;
}

export default function MarksVerificationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectVerificationStatus[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectVerificationStatus | null>(null);
  const [marksData, setMarksData] = useState<ExamMarks[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Marks Entry', 'Verification', 'Result Generation'];

  const loadSubjects = async () => {
    try {
      const data = await examinationsApi.listExamSubjects(parseInt(examId!), 1);

      const statusData: SubjectVerificationStatus[] = data.map((subject) => ({
        subject_id: subject.id,
        subject_name: subject.subject_name || `Subject ${subject.subject_id}`,
        total_students: 25,
        marks_entered: Math.floor(Math.random() * 26),
        verified: Math.random() > 0.5,
        verified_by: Math.random() > 0.5 ? 'John Teacher' : undefined,
        verification_date: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      }));

      setSubjects(statusData);

      const allVerified = statusData.every((s) => s.verified);
      const anyMarksEntered = statusData.some((s) => s.marks_entered > 0);

      if (!anyMarksEntered) setActiveStep(0);
      else if (!allVerified) setActiveStep(1);
      else setActiveStep(2);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load subjects'
      );
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [examId, loadSubjects]);

  const handleViewMarks = async (subject: SubjectVerificationStatus) => {
    try {
      const data = await examinationsApi.getSubjectMarks(subject.subject_id, 1);
      setMarksData(data);
      setSelectedSubject(subject);
      setDialogOpen(true);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load marks'
      );
    }
  };

  const handleVerify = async (approve: boolean) => {
    if (!selectedSubject) return;

    try {
      setDialogOpen(false);

      const updatedSubjects = subjects.map((s) =>
        s.subject_id === selectedSubject.subject_id
          ? {
              ...s,
              verified: approve,
              verified_by: approve ? 'Current User' : undefined,
              verification_date: approve ? new Date().toISOString() : undefined,
            }
          : s
      );

      setSubjects(updatedSubjects);
      setVerificationRemarks('');

      const allVerified = updatedSubjects.every((s) => s.verified);
      if (allVerified) setActiveStep(2);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to verify marks'
      );
    }
  };

  const getCompletionPercentage = () => {
    if (subjects.length === 0) return 0;
    const verified = subjects.filter((s) => s.verified).length;
    return (verified / subjects.length) * 100;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Marks Verification & Approval
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and approve marks before result generation
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <InfoIcon fontSize="large" />
                </Avatar>
                <Typography variant="h3" fontWeight={700} color="primary">
                  {subjects.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Subjects
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.success.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {subjects.filter((s) => s.verified).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.warning.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CancelIcon fontSize="large" />
                </Avatar>
                <Typography variant="h3" fontWeight={700} color="warning.main">
                  {subjects.filter((s) => !s.verified).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6" fontWeight={600}>
              Subject Verification Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion: {getCompletionPercentage().toFixed(0)}%
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Total Students
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Marks Entered
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified By</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.subject_id}>
                    <TableCell>
                      <Typography fontWeight={500}>{subject.subject_name}</Typography>
                    </TableCell>
                    <TableCell align="center">{subject.total_students}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${subject.marks_entered}/${subject.total_students}`}
                        color={
                          subject.marks_entered === subject.total_students ? 'success' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {subject.verified ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Verified"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip icon={<CancelIcon />} label="Pending" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.verified_by ? (
                        <Box>
                          <Typography variant="body2">{subject.verified_by}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(subject.verification_date!).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewMarks(subject)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {subjects.every((s) => s.verified) && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                All subjects verified! You can now proceed to result generation.
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/admin/examinations/${examId}/results/generate`)}
              >
                Proceed to Result Generation
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Review Marks - {selectedSubject?.subject_name}</Typography>
            {selectedSubject?.verified && (
              <Chip icon={<CheckCircleIcon />} label="Verified" color="success" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Roll No.</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell align="center">Theory</TableCell>
                  <TableCell align="center">Practical</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marksData.map((mark) => (
                  <TableRow key={mark.id}>
                    <TableCell>{mark.student_roll_number}</TableCell>
                    <TableCell>{mark.student_name}</TableCell>
                    <TableCell align="center">
                      {mark.is_absent ? 'AB' : mark.theory_marks_obtained}
                    </TableCell>
                    <TableCell align="center">
                      {mark.is_absent ? 'AB' : mark.practical_marks_obtained}
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={600}>
                        {mark.is_absent ? 'AB' : mark.total_marks_obtained}
                      </Typography>
                    </TableCell>
                    <TableCell>{mark.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Verification Remarks (Optional)"
              value={verificationRemarks}
              onChange={(e) => setVerificationRemarks(e.target.value)}
              placeholder="Add any comments about the marks verification..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ThumbDownIcon />}
            onClick={() => handleVerify(false)}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ThumbUpIcon />}
            onClick={() => handleVerify(true)}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
