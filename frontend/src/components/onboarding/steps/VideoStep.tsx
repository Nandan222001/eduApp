import { useState } from 'react';
import { Box, Typography, Button, LinearProgress, useTheme, alpha } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { OnboardingStep } from '@/types/onboarding';

interface VideoStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export default function VideoStep({ step, onComplete }: VideoStepProps) {
  const theme = useTheme();
  const [videoWatched, setVideoWatched] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleVideoEnd = () => {
    setVideoWatched(true);
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const watchedPercentage = (video.currentTime / video.duration) * 100;
    setProgress(watchedPercentage);

    if (watchedPercentage >= 90) {
      setVideoWatched(true);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {step.config.videoTitle || step.title}
      </Typography>

      {step.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {step.description}
        </Typography>
      )}

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 800,
          mx: 'auto',
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#000',
        }}
      >
        <video
          width="100%"
          controls
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          style={{ display: 'block' }}
        >
          <source src={step.config.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Video Progress
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: theme.palette.primary.main,
            },
          }}
        />
      </Box>

      {videoWatched && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            border: `1px solid ${theme.palette.success.main}`,
          }}
        >
          <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
          <Typography variant="body2" color="success.main" fontWeight={600}>
            Great! You&apos;ve watched the video
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => onComplete({ videoWatched })}
          disabled={step.required && !videoWatched}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}
