import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  AutoAwesome as ManaIcon,
  Bolt as AttackIcon,
} from '@mui/icons-material';
import { BossBattle, Method } from '../../types/rpg';

interface BattleArenaProps {
  battle: BossBattle;
  onMethodSelect: (methodId: string) => void;
  playerName: string;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ battle, onMethodSelect, playerName }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const bossHealthPercentage = (battle.bossHealth / battle.bossMaxHealth) * 100;

  const handleMethodClick = async (method: Method) => {
    setSelectedMethod(method.id);
    setIsAnimating(true);

    setTimeout(() => {
      onMethodSelect(method.id);
      setSelectedMethod(null);
      setIsAnimating(false);
    }, 1500);
  };

  const getAttackTypeColor = (type: Method['attackType']) => {
    switch (type) {
      case 'physical':
        return 'error';
      case 'magic':
        return 'info';
      case 'hybrid':
        return 'secondary';
    }
  };

  if (battle.isVictory) {
    return (
      <Card>
        <CardContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6">Victory!</Typography>
            <Typography variant="body2">You have defeated {battle.bossName}!</Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (battle.isDefeat) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Defeat</Typography>
            <Typography variant="body2">
              You were defeated by {battle.bossName}. Try again!
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5" fontWeight="bold">
                    Boss Battle
                  </Typography>
                  <Chip
                    label={battle.turn === 'player' ? 'Your Turn' : "Boss's Turn"}
                    color={battle.turn === 'player' ? 'primary' : 'error'}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        bgcolor: 'primary.lighter',
                        border: battle.turn === 'player' ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {playerName}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <HeartIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        <Typography variant="body2">Health: {battle.playerHealth}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ManaIcon sx={{ color: 'info.main', fontSize: 20 }} />
                        <Typography variant="body2">Mana: {battle.playerMana}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        bgcolor: 'error.lighter',
                        border: battle.turn === 'boss' ? '2px solid' : 'none',
                        borderColor: 'error.main',
                        animation: isAnimating && selectedMethod ? 'shake 0.5s' : 'none',
                        '@keyframes shake': {
                          '0%, 100%': { transform: 'translateX(0)' },
                          '25%': { transform: 'translateX(-10px)' },
                          '75%': { transform: 'translateX(10px)' },
                        },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {battle.bossName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Level {battle.bossLevel}
                      </Typography>
                      <Box mt={1}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption">Health</Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {battle.bossHealth} / {battle.bossMaxHealth}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={bossHealthPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 'error.main',
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {battle.currentQuestion && (
                <Box mb={3}>
                  <Paper elevation={1} sx={{ p: 3, bgcolor: 'background.default' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Question
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {battle.currentQuestion.questionText}
                    </Typography>
                    <Box mt={2}>
                      <Chip
                        label={`Difficulty: ${battle.currentQuestion.difficulty}`}
                        color={
                          battle.currentQuestion.difficulty === 'hard'
                            ? 'error'
                            : battle.currentQuestion.difficulty === 'medium'
                              ? 'warning'
                              : 'success'
                        }
                        size="small"
                      />
                    </Box>
                  </Paper>
                </Box>
              )}

              {battle.currentQuestion && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Choose Your Attack Method
                  </Typography>
                  <Grid container spacing={2}>
                    {battle.currentQuestion.methods.map((method) => (
                      <Grid item xs={12} sm={6} key={method.id}>
                        <Card
                          sx={{
                            cursor:
                              battle.turn === 'player' && !isAnimating ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            border:
                              selectedMethod === method.id ? '2px solid' : '1px solid transparent',
                            borderColor: 'primary.main',
                            opacity: isAnimating && selectedMethod !== method.id ? 0.5 : 1,
                            '&:hover': {
                              transform:
                                battle.turn === 'player' && !isAnimating
                                  ? 'translateY(-4px)'
                                  : 'none',
                              boxShadow: battle.turn === 'player' && !isAnimating ? 4 : 1,
                            },
                          }}
                          onClick={() =>
                            battle.turn === 'player' && !isAnimating && handleMethodClick(method)
                          }
                        >
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {method.name}
                              </Typography>
                              <Chip
                                label={method.attackType}
                                color={getAttackTypeColor(method.attackType)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              {method.description}
                            </Typography>
                            <Box display="flex" gap={2}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <AttackIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                <Typography variant="body2">{method.baseDamage} DMG</Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <ManaIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                <Typography variant="body2">{method.manaCost} Mana</Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Battle Log
              </Typography>
              <List
                sx={{
                  maxHeight: 400,
                  overflow: 'auto',
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                {battle.battleLog.length > 0 ? (
                  battle.battleLog
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <React.Fragment key={entry.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={entry.actor}
                                  size="small"
                                  color={entry.actor === 'player' ? 'primary' : 'error'}
                                />
                                {entry.damage && (
                                  <Chip
                                    label={`-${entry.damage} HP`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                  />
                                )}
                                {entry.xpGained && (
                                  <Chip
                                    label={`+${entry.xpGained} XP`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {entry.message}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < battle.battleLog.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Battle started" secondary="Make your first move!" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
