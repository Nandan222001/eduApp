import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Rating, LinearProgress } from '@mui/material';
import {
  FlightTakeoff as EntryIcon,
  FlightLand as ExitIcon,
  CheckCircle as CompleteIcon,
  Schedule as DurationIcon,
} from '@mui/icons-material';
import { PassportStamp as PassportStampType } from '../../types/rpg';

interface PassportStampProps {
  stamp: PassportStampType;
}

export const PassportStamp: React.FC<PassportStampProps> = ({ stamp }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Mathematics: '#4CAF50',
      Physics: '#2196F3',
      Chemistry: '#FF9800',
      Biology: '#9C27B0',
      English: '#F44336',
      History: '#795548',
    };
    return colors[subject] || '#607D8B';
  };

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        border: `3px solid ${getSubjectColor(stamp.subject)}`,
        borderRadius: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -10,
          right: -10,
          width: 40,
          height: 40,
          bgcolor: stamp.exitDate ? 'success.main' : 'warning.main',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 2,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {stamp.exitDate ? (
          <CompleteIcon sx={{ color: 'white', fontSize: 24 }} />
        ) : (
          <DurationIcon sx={{ color: 'white', fontSize: 24 }} />
        )}
      </Box>

      <CardContent>
        <Box mb={2}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {stamp.chapterName}
          </Typography>
          <Chip
            label={stamp.subject}
            size="small"
            sx={{
              bgcolor: getSubjectColor(stamp.subject),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Mastery Level
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Rating
              value={stamp.masteryStars}
              readOnly
              max={5}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: getSubjectColor(stamp.subject),
                },
              }}
            />
            <Typography variant="body2" color="text.secondary">
              ({stamp.masteryLevel}/100)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stamp.masteryLevel}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                bgcolor: getSubjectColor(stamp.subject),
              },
            }}
          />
        </Box>

        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <EntryIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Typography variant="body2" color="text.secondary">
              Entry: {formatDate(stamp.entryDate)}
            </Typography>
          </Box>
          {stamp.exitDate && (
            <Box display="flex" alignItems="center" gap={1}>
              <ExitIcon sx={{ fontSize: 18, color: 'info.main' }} />
              <Typography variant="body2" color="text.secondary">
                Exit: {formatDate(stamp.exitDate)}
              </Typography>
            </Box>
          )}
          <Box display="flex" alignItems="center" gap={1}>
            <DurationIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="body2" color="text.secondary">
              Duration: {formatDuration(stamp.duration)}
            </Typography>
          </Box>
        </Box>

        <Box
          mt={2}
          pt={2}
          borderTop={1}
          borderColor="divider"
          display="flex"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Questions
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stamp.questionsCompleted}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Accuracy
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color={
                stamp.accuracy >= 80
                  ? 'success.main'
                  : stamp.accuracy >= 60
                    ? 'warning.main'
                    : 'error.main'
              }
            >
              {stamp.accuracy}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
