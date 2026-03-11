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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  alpha,
  Grid,
  Avatar,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Visibility as VisibilityIcon,
  Publish as PublishIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import examinationsApi from '@/api/examinations';
import { ExamResult, Exam } from '@/types/examination';

const steps = ['Verification Complete', 'Generate Results', 'Preview Results', 'Publish'];

export default function ResultGenerationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [stats, setStats] = useState({
    total_students: 0,
    passed: 0,
    failed: 0,
    average_percentage: 0,
    highest_percentage: 0,
  });

  const loadExam = async () => {
    try {
      const data = await examinationsApi.getExam(parseInt(examId!), 1);
      setExam(data);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load exam'
      );
    }
  };

  const checkExistingResults = async () => {
    try {
      const data = await examinationsApi.listResults(parseInt(examId!), 1);
      if (data.length > 0) {
        setResults(data);
        setActiveStep(2);
        calculateStats(data);
      }
    } catch (err) {
      // Silently fail if no results exist yet
    }
  };

  useEffect(() => {
    loadExam();
    checkExistingResults();
  }, [examId, loadExam, checkExistingResults]);

  const calculateStats = (resultData: ExamResult[]) => {
    const total = resultData.length;
    const passed = resultData.filter((r) => r.is_pass).length;
    const failed = total - passed;
    const avgPercentage = resultData.reduce((sum, r) => sum + r.percentage, 0) / total;
    const highest = Math.max(...resultData.map((r) => r.percentage));

    setStats({
      total_students: total,
      passed,
      failed,
      average_percentage: avgPercentage,
      highest_percentage: highest,
    });
  };

  const handleGenerateResults = async () => {
    try {
      setGenerating(true);
      setError(null);

      await examinationsApi.generateResults(parseInt(examId!), 1);

      setTimeout(async () => {
        const data = await examinationsApi.listResults(parseInt(examId!), 1);
        setResults(data);
        calculateStats(data);
        setActiveStep(2);
        setSuccess(true);
        setGenerating(false);
      }, 3000);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to generate results'
      );
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      await examinationsApi.publishResults(parseInt(examId!), 1);

      setActiveStep(3);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/admin/examinations/${examId}/analytics`);
      }, 2000);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to publish results'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Result Generation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and publish examination results
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {activeStep === 2 ? 'Results generated successfully!' : 'Results published successfully!'}
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

          {exam && (
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Exam Name
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {exam.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Exam Type
                  </Typography>
                  <Chip label={exam.exam_type} color="primary" size="small" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={exam.result_published ? 'Published' : 'Not Published'}
                    color={exam.result_published ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              {generating ? (
                <>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Generating Results...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This may take a few moments. Please wait.
                  </Typography>
                </>
              ) : (
                <>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <PlayArrowIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Ready to Generate Results
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    All marks have been verified. Click the button below to generate results for all
                    students.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleGenerateResults}
                  >
                    Generate Results
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep >= 2 && results.length > 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.total_students}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Students
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {stats.passed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Passed ({((stats.passed / stats.total_students) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.average_percentage.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <EmojiEventsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {stats.highest_percentage.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Highest
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Results Preview
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handlePreview}>
                    Full Preview
                  </Button>
                  {activeStep === 2 && (
                    <Button
                      variant="contained"
                      startIcon={<PublishIcon />}
                      onClick={handlePublish}
                      disabled={loading}
                    >
                      Publish Results
                    </Button>
                  )}
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Roll No.</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Total Marks
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Percentage
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Grade
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Result
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.slice(0, 10).map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <Chip
                            label={result.section_rank || '-'}
                            size="small"
                            color={result.section_rank === 1 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{result.student_roll_number}</TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{result.student_name}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {result.total_marks_obtained}/{result.total_max_marks}
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={600} color="primary">
                            {result.percentage.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={result.grade || '-'} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={result.is_pass ? 'Pass' : 'Fail'}
                            color={result.is_pass ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {results.length > 10 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing 10 of {results.length} results
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Full Results Preview</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell align="center">Marks</TableCell>
                  <TableCell align="center">%</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="center">Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.section_rank}</TableCell>
                    <TableCell>
                      {result.student_name} ({result.student_roll_number})
                    </TableCell>
                    <TableCell align="center">
                      {result.total_marks_obtained}/{result.total_max_marks}
                    </TableCell>
                    <TableCell align="center">{result.percentage.toFixed(2)}%</TableCell>
                    <TableCell align="center">{result.grade}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={result.is_pass ? 'Pass' : 'Fail'}
                        color={result.is_pass ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
