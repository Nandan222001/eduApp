import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Stars as StarsIcon,
  MonetizationOn as CoinIcon,
  TrendingUp as LevelUpIcon,
} from '@mui/icons-material';
import { LootDrop as LootDropType } from '../../types/rpg';

interface LootDropProps {
  open: boolean;
  loot: LootDropType | null;
  onClose: () => void;
}

export const LootDrop: React.FC<LootDropProps> = ({ open, loot, onClose }) => {
  if (!loot) return null;

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800',
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityGlow = (rarity: string) => {
    const glows = {
      common: 'none',
      rare: '0 0 10px rgba(33, 150, 243, 0.5)',
      epic: '0 0 15px rgba(156, 39, 176, 0.5)',
      legendary: '0 0 20px rgba(255, 152, 0, 0.7)',
    };
    return glows[rarity as keyof typeof glows] || glows.common;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <TrophyIcon sx={{ fontSize: 48, color: '#FFD700' }} />
          <Typography variant="h4" fontWeight="bold">
            Victory Rewards!
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loot.levelUp && (
          <Box mb={3} textAlign="center">
            <Card
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                  <LevelUpIcon sx={{ fontSize: 48 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      Level Up!
                    </Typography>
                    <Typography variant="h6">Level {loot.newLevel}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                  <StarsIcon sx={{ color: '#4CAF50' }} />
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      +{loot.xpGained} XP
                    </Typography>
                    <Typography variant="caption">Experience Gained</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                  <CoinIcon sx={{ color: '#FFD700' }} />
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      +{loot.goldGained} Gold
                    </Typography>
                    <Typography variant="caption">Currency Earned</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

        <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
          Items Obtained
        </Typography>

        <Grid container spacing={2}>
          {loot.items.length > 0 ? (
            loot.items.map((item) => (
              <Grid item xs={12} sm={6} key={item.id}>
                <Card
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${getRarityColor(item.rarity)}`,
                    boxShadow: getRarityGlow(item.rarity),
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `${getRarityGlow(item.rarity)}, 0 4px 20px rgba(0,0,0,0.3)`,
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.rarity}
                        size="small"
                        sx={{
                          bgcolor: getRarityColor(item.rarity),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" gutterBottom>
                      {item.type}
                    </Typography>
                    {item.quantity > 1 && (
                      <Chip
                        label={`x${item.quantity}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}
                      />
                    )}
                    {item.equipment && (
                      <Box mt={1}>
                        {Object.entries(item.equipment.stats).map(([stat, value]) => (
                          <Typography
                            key={stat}
                            variant="caption"
                            display="block"
                            color="rgba(255, 255, 255, 0.9)"
                          >
                            +{value} {stat}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body2" textAlign="center" color="rgba(255, 255, 255, 0.8)">
                No items dropped this time
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={onClose}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: 'primary.main',
            fontWeight: 'bold',
            px: 4,
            '&:hover': {
              bgcolor: 'white',
            },
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
