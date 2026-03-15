import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  WavingHand as WavingHandIcon,
} from '@mui/icons-material';
import { OnboardingStep } from '@/types/onboarding';

interface WelcomeStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export default function WelcomeStep({ step, onComplete }: WelcomeStepProps) {
  const theme = useTheme();

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          mb: 3,
        }}
      >
        <WavingHandIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        {step.title}
      </Typography>

      {step.description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          {step.description}
        </Typography>
      )}

      {step.config.message && (
        <Box
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {step.config.message}
          </Typography>
        </Box>
      )}

      {step.config.customHtml && (
        <Box
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          dangerouslySetInnerHTML={{ __html: step.config.customHtml }}
        />
      )}

      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowForwardIcon />}
        onClick={() => onComplete()}
        sx={{
          px: 6,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: 2,
          textTransform: 'none',
        }}
      >
        Let&apos;s Get Started
      </Button>
    </Box>
  );
}
