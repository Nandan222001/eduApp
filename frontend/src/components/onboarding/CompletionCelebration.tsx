import { useEffect, useState } from 'react';
import { Box, Button, Typography, Dialog, DialogContent, useTheme, alpha } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { UserRole } from '@/types/onboarding';

interface CompletionCelebrationProps {
  flowTitle: string;
  role: UserRole;
  onClose: () => void;
}

export default function CompletionCelebration({
  flowTitle,
  role,
  onClose,
}: CompletionCelebrationProps) {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const confettiColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  const renderConfetti = () => {
    if (!showConfetti) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: '-10%',
              left: `${Math.random() * 100}%`,
              width: '10px',
              height: '10px',
              backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
              opacity: 0.8,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              animation: `fall ${2 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`,
              '@keyframes fall': {
                '0%': {
                  transform: 'translateY(0) rotate(0deg)',
                  opacity: 1,
                },
                '100%': {
                  transform: `translateY(120vh) rotate(${Math.random() * 360}deg)`,
                  opacity: 0,
                },
              },
            }}
          />
        ))}
      </Box>
    );
  };

  const getRoleMessage = () => {
    switch (role) {
      case 'student':
        return "You're all set to start your learning journey!";
      case 'parent':
        return "You're ready to support your child's education!";
      case 'teacher':
        return "You're prepared to inspire and educate!";
      default:
        return "You're all set!";
    }
  };

  return (
    <Dialog
      open={true}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        },
      }}
    >
      {renderConfetti()}

      <DialogContent sx={{ textAlign: 'center', py: 6, position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 120,
                color: theme.palette.success.main,
                animation: 'pulse 1s ease-in-out',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                },
              }}
            />
            <TrophyIcon
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                fontSize: 40,
                color: theme.palette.warning.main,
                animation: 'bounce 1s ease-in-out infinite',
                '@keyframes bounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            />
          </Box>
        </Box>

        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Congratulations! 🎉
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          {flowTitle} Complete
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {getRoleMessage()}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3,
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.1),
          }}
        >
          <CelebrationIcon sx={{ color: theme.palette.success.main }} />
          <Typography variant="body2" fontWeight={600} color="success.main">
            Your journey begins now!
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={onClose}
          sx={{
            px: 6,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            },
          }}
        >
          Get Started
        </Button>
      </DialogContent>
    </Dialog>
  );
}
