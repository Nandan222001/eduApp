import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  Grid,
  Paper,
  styled,
} from '@mui/material';
import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { gamificationAPI } from '../../api/gamification';
import { UserGamificationStats } from '../../types/gamification';

interface ProgressIndicatorProps {
  userId: number;
  institutionId: number;
  compact?: boolean;
}

const GradientLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
}));

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  userId,
  institutionId,
  compact = false,
}) => {
  const [stats, setStats] = useState<UserGamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await gamificationAPI.getUserStats(userId, institutionId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  if (compact) {
    return (
      <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h5" fontWeight="bold" color="white">
              {stats.level}
            </Typography>
          </Avatar>
          <Box flex={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="subtitle2" color="white" fontWeight="bold">
                Level {stats.level}
              </Typography>
              <Typography variant="caption" color="white" sx={{ opacity: 0.9 }}>
                {stats.points_to_next_level} pts to Level {stats.level + 1}
              </Typography>
            </Stack>
            <GradientLinearProgress
              variant="determinate"
              value={stats.level_progress_percentage}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'rgba(255,255,255,0.9)',
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Your Progress
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <TrendingUpIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {stats.level}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Level
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <StarIcon sx={{ color: '#ffd700', fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {stats.total_points.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Points
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
              <FireIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {stats.current_streak}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Day Streak
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <TrophyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {stats.badges_count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Badges
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box mb={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              Progress to Level {stats.level + 1}
            </Typography>
            <Chip
              label={`${stats.level_progress_percentage.toFixed(1)}%`}
              size="small"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          </Stack>
          <GradientLinearProgress variant="determinate" value={stats.level_progress_percentage} />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {stats.points_to_next_level} points needed
          </Typography>
        </Box>

        {stats.rank && (
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Your Rank
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  #{stats.rank}
                </Typography>
              </Box>
              <Tooltip title="Your position in the global leaderboard">
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <TrophyIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Tooltip>
            </Stack>
          </Paper>
        )}

        <Stack direction="row" spacing={1} mt={2} justifyContent="center">
          <Chip
            icon={<TrophyIcon />}
            label={`${stats.achievements_count} Achievements`}
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<FireIcon />}
            label={`${stats.longest_streak} Best Streak`}
            variant="outlined"
            size="small"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProgressIndicator;
