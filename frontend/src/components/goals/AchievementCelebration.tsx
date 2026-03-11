import { useEffect, useState } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, IconButton } from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { Goal } from '@/types/goals';

interface AchievementCelebrationProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

export default function AchievementCelebration({
  open,
  onClose,
  goal,
}: AchievementCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
        },
      }}
    >
      {showConfetti && <ConfettiAnimation />}

      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ textAlign: 'center', py: 6, px: 4 }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            animation: 'bounce 1s ease-in-out infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-20px)' },
            },
          }}
        >
          <TrophyIcon sx={{ fontSize: 80, color: 'success.main' }} />
        </Box>

        <Typography variant="h3" fontWeight={700} gutterBottom color="success.main">
          Congratulations!
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
          {goal.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          You&apos;ve successfully completed your goal! Your dedication and hard work have paid off.
          Keep up the excellent work!
        </Typography>

        <Box
          sx={{
            bgcolor: 'success.light',
            borderRadius: 2,
            p: 3,
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600} color="success.dark" gutterBottom>
            Achievement Stats
          </Typography>
          <Box display="flex" justifyContent="space-around" mt={2}>
            <Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {goal.milestones.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Milestones
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                100%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completion
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {Math.ceil(
                  (new Date(goal.completedDate!).getTime() - new Date(goal.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Days
              </Typography>
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<CelebrationIcon />}
          onClick={onClose}
          sx={{ mt: 2 }}
        >
          Celebrate & Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ConfettiAnimation() {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][
      Math.floor(Math.random() * 6)
    ],
  }));

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {confettiPieces.map((piece) => (
        <Box
          key={piece.id}
          sx={{
            position: 'absolute',
            top: '-10px',
            left: `${piece.left}%`,
            width: '10px',
            height: '10px',
            bgcolor: piece.color,
            animation: `fall ${piece.duration}s linear ${piece.delay}s`,
            borderRadius: '2px',
            '@keyframes fall': {
              to: {
                transform: 'translateY(100vh) rotate(360deg)',
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  );
}
