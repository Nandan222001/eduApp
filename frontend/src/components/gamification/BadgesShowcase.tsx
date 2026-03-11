import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Tooltip,
  Paper,
  styled,
  keyframes,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  LockOutlined as LockedIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { gamificationAPI } from '../../api/gamification';
import { UserBadge, Badge, BadgeRarity } from '../../types/gamification';
import { format } from 'date-fns';

interface BadgesShowcaseProps {
  userId: number;
  institutionId: number;
}

const unlockAnimation = keyframes`
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

const shimmerAnimation = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const BadgeCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'rarity' && prop !== 'unlocked' && prop !== 'animate',
})<{ rarity?: BadgeRarity; unlocked: boolean; animate?: boolean }>(({
  theme,
  rarity,
  unlocked,
  animate,
}) => {
  const rarityColors: Record<BadgeRarity, string> = {
    [BadgeRarity.COMMON]: '#9e9e9e',
    [BadgeRarity.RARE]: '#2196f3',
    [BadgeRarity.EPIC]: '#9c27b0',
    [BadgeRarity.LEGENDARY]: '#ffd700',
  };

  return {
    height: '100%',
    position: 'relative',
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    background: unlocked
      ? `linear-gradient(135deg, ${rarityColors[rarity || BadgeRarity.COMMON]}20 0%, transparent 100%)`
      : theme.palette.background.paper,
    border: unlocked
      ? `2px solid ${rarityColors[rarity || BadgeRarity.COMMON]}`
      : `2px dashed ${theme.palette.divider}`,
    opacity: unlocked ? 1 : 0.5,
    animation: animate ? `${unlockAnimation} 0.6s ease-out` : 'none',
    '&:hover': {
      transform: unlocked ? 'translateY(-8px) scale(1.02)' : 'none',
      boxShadow: unlocked ? theme.shadows[8] : 'none',
    },
    '&::before': unlocked
      ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent, ${rarityColors[rarity || BadgeRarity.COMMON]}40, transparent)`,
          animation: `${shimmerAnimation} 3s infinite`,
          pointerEvents: 'none',
        }
      : {},
  };
});

const BadgeAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'rarity' && prop !== 'unlocked',
})<{ rarity?: BadgeRarity; unlocked: boolean }>(({ theme, rarity, unlocked }) => {
  const rarityColors: Record<BadgeRarity, string> = {
    [BadgeRarity.COMMON]: '#9e9e9e',
    [BadgeRarity.RARE]: '#2196f3',
    [BadgeRarity.EPIC]: '#9c27b0',
    [BadgeRarity.LEGENDARY]: '#ffd700',
  };

  return {
    width: 80,
    height: 80,
    bgcolor: unlocked
      ? rarityColors[rarity || BadgeRarity.COMMON]
      : theme.palette.action.disabledBackground,
    fontSize: '2.5rem',
    margin: '0 auto',
    boxShadow: unlocked ? `0 0 20px ${rarityColors[rarity || BadgeRarity.COMMON]}80` : 'none',
  };
});

const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({ userId, institutionId }) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Set<number>>(new Set());

  const loadBadges = async () => {
    try {
      setLoading(true);
      const [earnedBadges, availableBadges] = await Promise.all([
        gamificationAPI.getUserBadges(userId, institutionId),
        gamificationAPI.getBadges(institutionId),
      ]);

      const previousIds = new Set(userBadges.map((b) => b.badge_id));
      const currentIds = new Set(earnedBadges.map((b) => b.badge_id));
      const newIds = new Set([...currentIds].filter((id) => !previousIds.has(id)));

      setUserBadges(earnedBadges);
      setAllBadges(availableBadges);
      setNewlyUnlocked(newIds);
      setError(null);

      if (newIds.size > 0) {
        setTimeout(() => setNewlyUnlocked(new Set()), 1000);
      }
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId]);

  const getBadgeStatus = (badge: Badge): { unlocked: boolean; userBadge?: UserBadge } => {
    const userBadge = userBadges.find((ub) => ub.badge_id === badge.id);
    return { unlocked: !!userBadge, userBadge };
  };

  const getRarityLabel = (rarity: BadgeRarity): string => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Badge Collection
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Collect badges by completing various activities
        </Typography>
        <Paper sx={{ p: 2, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <TrophyIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {earnedCount} / {totalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Badges Earned
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {allBadges.map((badge) => {
          const { unlocked, userBadge } = getBadgeStatus(badge);
          const isNew = newlyUnlocked.has(badge.id);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
              <Tooltip
                title={
                  unlocked && userBadge
                    ? `Earned on ${format(new Date(userBadge.earned_at), 'MMM dd, yyyy')}`
                    : badge.description
                }
                arrow
              >
                <BadgeCard rarity={badge.rarity} unlocked={unlocked} animate={isNew}>
                  <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                    {isNew && (
                      <Chip
                        label="NEW!"
                        color="success"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 'bold',
                          animation: 'pulse 1s infinite',
                        }}
                      />
                    )}

                    <BadgeAvatar rarity={badge.rarity} unlocked={unlocked}>
                      {unlocked ? (
                        badge.icon_url ? (
                          <img src={badge.icon_url} alt={badge.name} style={{ width: '100%' }} />
                        ) : (
                          <TrophyIcon sx={{ fontSize: '2.5rem' }} />
                        )
                      ) : (
                        <LockedIcon sx={{ fontSize: '2.5rem' }} />
                      )}
                    </BadgeAvatar>

                    <Typography variant="h6" fontWeight="bold" mt={2} gutterBottom>
                      {badge.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        minHeight: 40,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {unlocked ? badge.description : '???'}
                    </Typography>

                    <Box mt={2} display="flex" justifyContent="center" gap={1}>
                      <Chip
                        label={getRarityLabel(badge.rarity)}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: unlocked
                            ? (() => {
                                const colors: Record<BadgeRarity, string> = {
                                  [BadgeRarity.COMMON]: '#9e9e9e',
                                  [BadgeRarity.RARE]: '#2196f3',
                                  [BadgeRarity.EPIC]: '#9c27b0',
                                  [BadgeRarity.LEGENDARY]: '#ffd700',
                                };
                                return `${colors[badge.rarity]}20`;
                              })()
                            : 'action.disabledBackground',
                          color: unlocked ? 'inherit' : 'text.disabled',
                        }}
                      />
                      {badge.points_required > 0 && (
                        <Chip
                          label={`${badge.points_required} pts`}
                          size="small"
                          icon={<StarIcon />}
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </BadgeCard>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default BadgesShowcase;
