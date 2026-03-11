import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Avatar,
  Stack,
  Slide,
  styled,
  keyframes,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  TrendingUp as LevelUpIcon,
} from '@mui/icons-material';
import { AchievementNotification } from '../../types/gamification';

interface AchievementNotificationToastProps {
  open: boolean;
  notification: AchievementNotification | null;
  onClose: () => void;
}

const celebrateAnimation = keyframes`
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

const StyledAlert = styled(Alert)(({ theme }) => ({
  minWidth: 350,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
  backdropFilter: 'blur(10px)',
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
}));

const AnimatedAvatar = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  animation: `${celebrateAnimation} 0.6s ease-out, ${pulseAnimation} 2s infinite`,
  boxShadow: `0 0 20px ${theme.palette.primary.main}80`,
}));

const AchievementNotificationToast: React.FC<AchievementNotificationToastProps> = ({
  open,
  notification,
  onClose,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open && notification) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [open, notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'badge':
        return <TrophyIcon sx={{ fontSize: 32 }} />;
      case 'achievement':
        return <StarIcon sx={{ fontSize: 32 }} />;
      case 'level_up':
        return <LevelUpIcon sx={{ fontSize: 32 }} />;
      case 'streak':
        return <FireIcon sx={{ fontSize: 32 }} />;
      default:
        return <TrophyIcon sx={{ fontSize: 32 }} />;
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'badge':
        return 'warning';
      case 'achievement':
        return 'success';
      case 'level_up':
        return 'info';
      case 'streak':
        return 'error';
      default:
        return 'success';
    }
  };

  return (
    <Snackbar
      open={show}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={Slide}
      sx={{ mt: 8 }}
    >
      <StyledAlert
        severity={getColor()}
        icon={false}
        onClose={onClose}
        sx={{
          '& .MuiAlert-action': {
            alignItems: 'flex-start',
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <AnimatedAvatar
            sx={{
              bgcolor: (() => {
                const colors = {
                  badge: 'warning.main',
                  achievement: 'success.main',
                  level_up: 'info.main',
                  streak: 'error.main',
                };
                return colors[notification.type];
              })(),
            }}
          >
            {getIcon()}
          </AnimatedAvatar>
          <Box flex={1}>
            <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 0.5 }}>
              {notification.title}
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {notification.message}
            </Typography>
            {notification.points && (
              <Typography
                variant="caption"
                sx={{
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  fontWeight: 'bold',
                }}
              >
                +{notification.points} points
              </Typography>
            )}
          </Box>
        </Stack>
      </StyledAlert>
    </Snackbar>
  );
};

export default AchievementNotificationToast;
