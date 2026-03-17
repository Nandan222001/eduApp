import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Favorite as HeartIcon,
  AutoAwesome as ManaIcon,
  TrendingUp as XPIcon,
} from '@mui/icons-material';
import { CharacterStats, Equipment } from '../../types/rpg';

interface CharacterCardProps {
  stats: CharacterStats;
  equipment: Equipment[];
  playerName: string;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ stats, equipment, playerName }) => {
  const xpPercentage = (stats.currentXP / stats.xpToNextLevel) * 100;
  const healthPercentage = (stats.health / stats.maxHealth) * 100;
  const manaPercentage = (stats.mana / stats.maxMana) * 100;

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800',
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 'bold',
            }}
          >
            {playerName.charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5" fontWeight="bold">
              {playerName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip label={`Level ${stats.level}`} color="primary" size="small" icon={<XPIcon />} />
            </Box>
          </Box>
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Experience
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stats.currentXP} / {stats.xpToNextLevel} XP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={xpPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
              },
            }}
          />
        </Box>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <HeartIcon sx={{ color: 'error.main', fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                  Health
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={healthPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'error.main',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {stats.health} / {stats.maxHealth}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <ManaIcon sx={{ color: 'info.main', fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                  Mana
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={manaPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'info.main',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {stats.mana} / {stats.maxMana}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={2}>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {stats.attack}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Attack
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={2}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {stats.defense}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Defense
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
          Equipment
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          {equipment.length > 0 ? (
            equipment.map((item) => (
              <Box
                key={item.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={1}
                borderRadius={1}
                sx={{
                  bgcolor: 'action.hover',
                  border: `2px solid ${getRarityColor(item.rarity)}`,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <ShieldIcon sx={{ color: getRarityColor(item.rarity), fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.type}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={item.rarity}
                  size="small"
                  sx={{
                    bgcolor: getRarityColor(item.rarity),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No equipment equipped
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
