import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon } from '@mui/icons-material';
import { OnboardingFlow, OnboardingProgress } from '@/types/onboarding';
import onboardingApi from '@/api/onboarding';
import WelcomeStep from './steps/WelcomeStep';
import VideoStep from './steps/VideoStep';
import FormStep from './steps/FormStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import SignatureStep from './steps/SignatureStep';
import QuizStep from './steps/QuizStep';
import PlatformTourStep from './steps/PlatformTourStep';
import CompletionCelebration from './CompletionCelebration';

interface OnboardingWizardProps {
  flow: OnboardingFlow;
  userId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export default function OnboardingWizard({
  flow,
  userId,
  onComplete,
  onExit,
}: OnboardingWizardProps) {
  const theme = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [stepData, setStepData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  const currentStep = flow.steps[currentStepIndex];

  useEffect(() => {
    loadProgress();
  }, [flow.id, userId]);

  useEffect(() => {
    setStepStartTime(Date.now());
    if (progress && currentStep) {
      onboardingApi.trackStepView(progress.id, currentStep.id);
    }
  }, [currentStepIndex, currentStep, progress]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const userProgress = await onboardingApi.getUserProgress(userId, flow.id);
      setProgress(userProgress);

      const currentStepIdx = flow.steps.findIndex((step) => step.id === userProgress.currentStepId);
      if (currentStepIdx !== -1) {
        setCurrentStepIndex(currentStepIdx);
      }
    } catch (err) {
      setError('Failed to load onboarding progress');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const trackStepTime = useCallback(async () => {
    if (progress && currentStep) {
      const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
      await onboardingApi.trackStepTime(progress.id, currentStep.id, timeSpent);
    }
  }, [progress, currentStep, stepStartTime]);

  const handleNext = async (data?: Record<string, unknown>) => {
    if (!progress || !currentStep) return;

    try {
      await trackStepTime();

      const updatedProgress = await onboardingApi.completeStep(
        progress.id,
        currentStep.id,
        data || stepData
      );
      setProgress(updatedProgress);

      if (data) {
        setStepData({ ...stepData, ...data });
      }

      if (currentStepIndex < flow.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setShowCompletion(true);
        if (onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      setError('Failed to save progress');
      console.error(err);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = async () => {
    if (!progress || !currentStep) return;

    try {
      await trackStepTime();
      const updatedProgress = await onboardingApi.skipStep(progress.id, currentStep.id);
      setProgress(updatedProgress);

      if (currentStepIndex < flow.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setShowCompletion(true);
        if (onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      setError('Failed to skip step');
      console.error(err);
    }
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    const stepProps = {
      step: currentStep,
      onComplete: handleNext,
      data: stepData,
    };

    switch (currentStep.type) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />;
      case 'video':
        return <VideoStep {...stepProps} />;
      case 'form':
        return <FormStep {...stepProps} />;
      case 'document_upload':
        return <DocumentUploadStep {...stepProps} />;
      case 'signature':
        return <SignatureStep {...stepProps} />;
      case 'quiz':
        return <QuizStep {...stepProps} />;
      case 'platform_tour':
        return <PlatformTourStep {...stepProps} />;
      default:
        return <Typography>Unknown step type</Typography>;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (showCompletion) {
    return (
      <CompletionCelebration
        flowTitle={flow.title}
        role={flow.role}
        onClose={() => {
          setShowCompletion(false);
          if (onComplete) onComplete();
        }}
      />
    );
  }

  const progressPercentage = progress ? progress.overallProgress : 0;

  return (
    <Dialog
      open={true}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {flow.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Step {currentStepIndex + 1} of {flow.steps.length}
          </Typography>
        </Box>
        {onExit && (
          <IconButton onClick={onExit} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {progressPercentage.toFixed(0)}% Complete
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={currentStepIndex} sx={{ mb: 4 }}>
          {flow.steps.map((step, index) => (
            <Step key={step.id} completed={index < currentStepIndex}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>{renderStepContent()}</CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!currentStep?.required && (
              <Button onClick={handleSkip} color="inherit">
                Skip
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
