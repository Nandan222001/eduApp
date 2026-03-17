import { Box, Paper, Typography, Grid, alpha, useTheme } from '@mui/material';
import { DifficultyLevel, DifficultyChallenge } from '@/types/reverseClassroom';

interface ChallengeSelectorProps {
  selectedDifficulty?: DifficultyLevel;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  disabled?: boolean;
}

const difficulties: DifficultyChallenge[] = [
  {
    id: '5yo',
    label: 'Explain to a 5-Year-Old',
    description: 'Use simple words and analogies',
    icon: '👶',
  },
  {
    id: '10yo',
    label: 'Explain to a 10-Year-Old',
    description: 'Basic concepts with examples',
    icon: '🧒',
  },
  {
    id: 'college',
    label: 'College Level',
    description: 'Advanced technical explanation',
    icon: '🎓',
  },
  {
    id: '30seconds',
    label: 'In 30 Seconds',
    description: 'Quick and concise summary',
    icon: '⚡',
  },
];

export default function ChallengeSelector({
  selectedDifficulty,
  onSelectDifficulty,
  disabled = false,
}: ChallengeSelectorProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Select Difficulty Challenge
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose how you want to explain this topic
      </Typography>

      <Grid container spacing={2}>
        {difficulties.map((difficulty) => {
          const isSelected = selectedDifficulty === difficulty.id;
          return (
            <Grid item xs={12} sm={6} md={3} key={difficulty.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 2,
                  bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  transition: 'all 0.3s',
                  '&:hover': disabled
                    ? {}
                    : {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                }}
                onClick={() => !disabled && onSelectDifficulty(difficulty.id)}
              >
                <Box
                  sx={{
                    fontSize: 48,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 60,
                  }}
                >
                  {difficulty.icon}
                </Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {difficulty.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {difficulty.description}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
