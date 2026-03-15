import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CameraAlt,
  Delete,
  CloudUpload,
  Check,
  CheckCircle,
  Cancel,
  School,
  TrendingUp,
  TrendingDown,
  VideoLibrary,
  MenuBook,
  NotificationsActive,
  ExpandMore,
  Refresh,
  PhotoCamera,
} from '@mui/icons-material';
import {
  ScannedPage,
  CameraState,
  ProcessingProgress,
  HomeworkScanResult,
  QuestionResult,
  MistakeAnalysis,
  ProcessingStatus,
} from '@/types/homeworkScanner';
import homeworkScannerApi from '@/api/homeworkScanner';
import { useAuthStore } from '@/store/useAuthStore';

const processingSteps = [
  'Uploading',
  'OCR Processing',
  'Evaluating Answers',
  'Generating Feedback',
];

export default function HomeworkScanner() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    hasPermission: false,
  });
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [processing, setProcessing] = useState<ProcessingProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
  });
  const [scanResult, setScanResult] = useState<HomeworkScanResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Geography',
  ];

  useEffect(() => {
    return () => {
      if (cameraState.stream) {
        cameraState.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraState.stream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraState({
        isActive: true,
        hasPermission: true,
        stream,
      });
      setShowCamera(true);
    } catch (error) {
      setCameraState({
        isActive: false,
        hasPermission: false,
        error: 'Failed to access camera. Please grant camera permissions.',
      });
    }
  };

  const stopCamera = () => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach((track) => track.stop());
    }
    setCameraState({
      isActive: false,
      hasPermission: cameraState.hasPermission,
    });
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    const thumbnail = canvas.toDataURL('image/jpeg', 0.3);

    const newPage: ScannedPage = {
      id: Date.now().toString(),
      imageUrl: imageData,
      imageData,
      thumbnail,
      pageNumber: scannedPages.length + 1,
      timestamp: new Date(),
    };

    setScannedPages([...scannedPages, newPage]);
    setPreviewImage(imageData);

    setTimeout(() => {
      setPreviewImage(null);
    }, 2000);
  };

  const deletePage = (pageId: string) => {
    setScannedPages(scannedPages.filter((page) => page.id !== pageId));
  };

  const handleSubmitScan = async () => {
    if (scannedPages.length === 0 || !selectedSubject || !user) return;

    setShowSubjectDialog(false);
    setProcessing({
      status: 'uploading',
      progress: 0,
      currentStep: 'Uploading images...',
    });

    try {
      const scanData = {
        pages: scannedPages.map((page) => page.imageData),
        subject: selectedSubject,
        assignmentTitle,
        studentId: user.id,
      };

      const response = await homeworkScannerApi.submitScan(scanData);

      pollScanStatus(response.scanId);
    } catch (error) {
      setProcessing({
        status: 'error',
        progress: 0,
        currentStep: 'Failed to submit scan',
        error: 'An error occurred while processing your homework. Please try again.',
      });
    }
  };

  const pollScanStatus = async (scanId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const progress = await homeworkScannerApi.getScanStatus(scanId);

        setProcessing(progress);

        if (progress.status === 'completed') {
          clearInterval(pollInterval);
          const result = await homeworkScannerApi.getScanResult(scanId);
          setScanResult(result);
        } else if (progress.status === 'error') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        clearInterval(pollInterval);
        setProcessing({
          status: 'error',
          progress: 0,
          currentStep: 'Failed to get scan status',
          error: 'Failed to retrieve scan status',
        });
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const getActiveStep = (status: ProcessingStatus): number => {
    switch (status) {
      case 'uploading':
        return 0;
      case 'ocr':
        return 1;
      case 'evaluating':
        return 2;
      case 'generating_feedback':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const handleNotifyTeacher = async () => {
    if (!scanResult) return;

    try {
      await homeworkScannerApi.notifyTeacher(scanResult.id);
      setScanResult({
        ...scanResult,
        teacherNotified: true,
        teacherNotificationDate: new Date(),
      });
    } catch (error) {
      console.error('Failed to notify teacher:', error);
    }
  };

  const resetScanner = () => {
    setScannedPages([]);
    setSelectedSubject('');
    setAssignmentTitle('');
    setProcessing({ status: 'idle', progress: 0, currentStep: '' });
    setScanResult(null);
    stopCamera();
  };

  const renderCameraView = () => (
    <Dialog open={showCamera} onClose={stopCamera} maxWidth="md" fullWidth>
      <DialogTitle>
        Capture Homework Pages
        <Typography variant="caption" display="block" color="text.secondary">
          Position the page clearly in frame and tap capture
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            bgcolor: 'black',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              display: 'block',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {previewImage && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeOut 2s',
                '@keyframes fadeOut': {
                  '0%': { opacity: 1 },
                  '70%': { opacity: 1 },
                  '100%': { opacity: 0 },
                },
              }}
            >
              <Check sx={{ fontSize: 80, color: 'success.main' }} />
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Pages captured: {scannedPages.length}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={stopCamera}>
              Done
            </Button>
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={capturePhoto}
              size="large"
            >
              Capture
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderCaptureInterface = () => (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Capture Homework Pages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Use your camera to scan your homework pages. Take clear photos of each page.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<CameraAlt />}
          onClick={startCamera}
          fullWidth
        >
          Open Camera
        </Button>
      </Box>

      {scannedPages.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Scanned Pages ({scannedPages.length})
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {scannedPages.map((page) => (
              <Grid item xs={6} sm={4} md={3} key={page.id}>
                <Card sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="150"
                    image={page.thumbnail}
                    alt={`Page ${page.pageNumber}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                    }}
                  >
                    <Typography variant="caption" fontWeight={600}>
                      Page {page.pageNumber}
                    </Typography>
                  </Box>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                    size="small"
                    onClick={() => deletePage(page.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<CloudUpload />}
            onClick={() => setShowSubjectDialog(true)}
            fullWidth
            sx={{ mt: 3 }}
          >
            Process Homework
          </Button>
        </>
      )}
    </Paper>
  );

  const renderProcessingIndicator = () => (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Processing Your Homework
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {processing.currentStep}
      </Typography>

      <Stepper activeStep={getActiveStep(processing.status)} sx={{ mb: 4 }}>
        {processingSteps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <LinearProgress
        variant="determinate"
        value={processing.progress}
        sx={{ height: 8, borderRadius: 1, mb: 2 }}
      />
      <Typography variant="body2" color="text.secondary">
        {processing.progress}% Complete
      </Typography>

      {processing.status === 'error' && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {processing.error}
          <Button onClick={resetScanner} sx={{ mt: 1 }}>
            Try Again
          </Button>
        </Alert>
      )}
    </Paper>
  );

  const renderQuestionResult = (question: QuestionResult) => (
    <Card
      key={question.questionNumber}
      sx={{
        border: `2px solid ${question.isCorrect ? theme.palette.success.main : theme.palette.error.main}`,
        borderRadius: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Question {question.questionNumber}
            </Typography>
            {question.isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />}
          </Box>
          <Chip
            label={`${question.earnedPoints}/${question.maxPoints} pts`}
            color={question.isCorrect ? 'success' : 'error'}
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Your Answer
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {question.studentAnswer}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Correct Answer
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'success.main', fontWeight: 600 }}>
              {question.correctAnswer}
            </Typography>
          </Grid>
        </Grid>

        {question.topic && <Chip label={question.topic} size="small" sx={{ mt: 2 }} />}
      </CardContent>
    </Card>
  );

  const renderMistakeAnalysis = (mistake: MistakeAnalysis) => (
    <Accordion key={mistake.questionNumber}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Typography fontWeight={600}>Question {mistake.questionNumber}</Typography>
          <Chip label={mistake.mistakeType} size="small" color="warning" />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Explanation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mistake.explanation}
            </Typography>
          </Box>

          {mistake.conceptsToReview.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Concepts to Review
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {mistake.conceptsToReview.map((concept, idx) => (
                  <Chip key={idx} label={concept} size="small" />
                ))}
              </Stack>
            </Box>
          )}

          {mistake.videoLinks && mistake.videoLinks.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Video Resources
              </Typography>
              <List dense>
                {mistake.videoLinks.map((link, idx) => (
                  <ListItem
                    key={idx}
                    button
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ListItemIcon>
                      <VideoLibrary color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={link.title} secondary={link.duration || link.platform} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {mistake.practiceLinks && mistake.practiceLinks.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Practice Resources
              </Typography>
              <List dense>
                {mistake.practiceLinks.map((link, idx) => (
                  <ListItem
                    key={idx}
                    button
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ListItemIcon>
                      <MenuBook color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={link.title} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderResults = () => {
    if (!scanResult) return null;

    return (
      <Box>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
            {scanResult.percentage.toFixed(1)}%
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" gutterBottom>
            {scanResult.grade}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={600} color="success.main">
                  {scanResult.correctAnswers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Correct
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={600} color="error.main">
                  {scanResult.incorrectAnswers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Incorrect
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={600} color="warning.main">
                  {scanResult.partiallyCorrect}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Partial
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={600}>
                  {scanResult.earnedPoints}/{scanResult.totalPoints}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Points
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!scanResult.teacherNotified ? (
              <Button
                variant="contained"
                startIcon={<NotificationsActive />}
                onClick={handleNotifyTeacher}
              >
                Notify Teacher
              </Button>
            ) : (
              <Chip icon={<Check />} label="Teacher Notified" color="success" variant="outlined" />
            )}
            <Button variant="outlined" startIcon={<Refresh />} onClick={resetScanner}>
              New Scan
            </Button>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Overall Feedback
          </Typography>
          <Alert severity="info" icon={<School />} sx={{ mb: 2 }}>
            {scanResult.overallFeedback}
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp color="success" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Strengths
                  </Typography>
                </Box>
                <List dense>
                  {scanResult.strengthAreas.map((strength, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingDown color="warning" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Areas to Improve
                  </Typography>
                </Box>
                <List dense>
                  {scanResult.improvementAreas.map((area, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <School color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={area} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Question Breakdown
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {scanResult.questions.map(renderQuestionResult)}
          </Stack>
        </Paper>

        {scanResult.mistakes.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              AI Feedback & Learning Resources
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Detailed explanations and resources to help you improve
            </Typography>
            {scanResult.mistakes.map(renderMistakeAnalysis)}
          </Paper>
        )}
      </Box>
    );
  };

  const renderSubjectDialog = () => (
    <Dialog open={showSubjectDialog} onClose={() => setShowSubjectDialog(false)}>
      <DialogTitle>Select Subject</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Subject *
            </Typography>
            <Grid container spacing={1}>
              {subjects.map((subject) => (
                <Grid item xs={6} key={subject}>
                  <Button
                    variant={selectedSubject === subject ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Assignment Title (Optional)
            </Typography>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="e.g., Chapter 5 Exercise"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                fontFamily: 'inherit',
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSubjectDialog(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmitScan} disabled={!selectedSubject}>
          Start Processing
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Smart Homework Scanner 📸
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan your homework, get instant AI feedback, and track your progress
        </Typography>
      </Box>

      {processing.status === 'idle' && !scanResult && renderCaptureInterface()}

      {processing.status !== 'idle' &&
        processing.status !== 'completed' &&
        renderProcessingIndicator()}

      {processing.status === 'completed' && scanResult && renderResults()}

      {renderCameraView()}
      {renderSubjectDialog()}
    </Box>
  );
}
