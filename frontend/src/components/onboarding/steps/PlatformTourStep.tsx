import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Explore as ExploreIcon,
} from '@mui/icons-material';
import { OnboardingStep } from '@/types/onboarding';

interface PlatformTourStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export default function PlatformTourStep({ step, onComplete }: PlatformTourStepProps) {
  const theme = useTheme();
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);

  const highlights = step.config.tourHighlights || [];
  const currentHighlight = highlights[currentHighlightIndex];

  const handleNext = () => {
    if (currentHighlightIndex < highlights.length - 1) {
      setCurrentHighlightIndex(currentHighlightIndex + 1);
    } else {
      onComplete({ tourCompleted: true });
    }
  };

  const handleBack = () => {
    if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex(currentHighlightIndex - 1);
    }
  };

  if (highlights.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No tour highlights configured
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <ExploreIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {step.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Let&apos;s explore the key features
          </Typography>
        </Box>
      </Box>

      <Stepper activeStep={currentHighlightIndex} sx={{ mb: 4 }}>
        {highlights.map((highlight, index) => (
          <Step key={highlight.id} completed={index < currentHighlightIndex}>
            <StepLabel>{highlight.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          position: 'relative',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Chip
          label={`Step ${currentHighlightIndex + 1} of ${highlights.length}`}
          color="primary"
          size="small"
          sx={{ mb: 2 }}
        />

        <Typography variant="h6" fontWeight={700} gutterBottom>
          {currentHighlight.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {currentHighlight.description}
        </Typography>

        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: '#fff',
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Feature Location
          </Typography>
          <Chip
            label={currentHighlight.selector}
            variant="outlined"
            sx={{ fontFamily: 'monospace', mt: 1 }}
          />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
                transform: 'scale(1)',
              },
              '50%': {
                opacity: 0.5,
                transform: 'scale(1.1)',
              },
            },
          }}
        >
          <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>
            {currentHighlightIndex + 1}
          </Typography>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        {highlights.map((highlight, index) => (
          <Paper
            key={highlight.id}
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${index === currentHighlightIndex ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor:
                index === currentHighlightIndex
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
              opacity: index <= currentHighlightIndex ? 1 : 0.5,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
            onClick={() => index <= currentHighlightIndex && setCurrentHighlightIndex(index)}
          >
            <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
              Step {index + 1}
            </Typography>
            <Typography variant="body2" noWrap>
              {highlight.title}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handleBack}
          disabled={currentHighlightIndex === 0}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Button variant="contained" onClick={handleNext} endIcon={<ArrowForwardIcon />}>
          {currentHighlightIndex < highlights.length - 1 ? 'Next Feature' : 'Complete Tour'}
        </Button>
      </Box>
    </Box>
  );
}
