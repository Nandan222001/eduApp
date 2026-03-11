import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  LinearProgress,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { gamificationAPI } from '../../api/gamification';
import { UserGamificationStats, UserBadge } from '../../types/gamification';

interface GamificationWidgetProps {
  userId: number;
  institutionId: number;
}

const GamificationWidget: React.FC<GamificationWidgetProps> = ({ userId, institutionId }) => {
  const [stats, setStats] = useState<UserGamificationStats | null>(null);
  const [recentBadges, setRecentBadges] = useState<UserBadge[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId]);

  const loadData = async () => {
    try {
      const [statsData, badgesData] = await Promise.all([
        gamificationAPI.getUserStats(userId, institutionId),
        gamificationAPI.getUserBadges(userId, institutionId),
      ]);
      setStats(statsData);
      setRecentBadges(badgesData.slice(0, 3));
    } catch (err) {
      console.error('Failed to load gamification data:', err);
    }
  };

  if (!stats) return null;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Your Progress
          </Typography>
          <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/gamification')}>
            View All
          </Button>
        </Stack>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.level}
              </Typography>
              <Typography variant="caption">Level</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'warning.light',
              }}
            >
              <StarIcon sx={{ fontSize: 32, mb: 1, color: '#ffd700' }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.total_points.toLocaleString()}
              </Typography>
              <Typography variant="caption">Points</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box mb={2}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.secondary">
              Level Progress
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {stats.level_progress_percentage.toFixed(0)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={stats.level_progress_percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {stats.points_to_next_level} points to Level {stats.level + 1}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2} mb={2}>
          <Box flex={1} textAlign="center">
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <FireIcon sx={{ color: '#f44336', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="bold">
                {stats.current_streak}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Day Streak
            </Typography>
          </Box>
          <Box flex={1} textAlign="center">
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <TrophyIcon sx={{ color: '#ff9800', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="bold">
                {stats.badges_count}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Badges
            </Typography>
          </Box>
        </Stack>

        {recentBadges.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                Recent Badges
              </Typography>
              <Stack direction="row" spacing={1}>
                {recentBadges.map((badge) => (
                  <Avatar
                    key={badge.id}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main',
                      border: 2,
                      borderColor: 'primary.light',
                    }}
                  >
                    <TrophyIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {stats.rank && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" fontWeight="bold">
                Your Rank
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                #{stats.rank}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GamificationWidget;
