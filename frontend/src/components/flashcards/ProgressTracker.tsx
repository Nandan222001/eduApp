import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import { Timeline, Schedule, EmojiEvents, TrendingUp } from '@mui/icons-material';
import { FlashcardDeckStats } from '@/types/flashcard';

interface ProgressTrackerProps {
  stats: FlashcardDeckStats;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ stats }) => {
  const masteryPercentage =
    stats.total_cards > 0 ? (stats.cards_mastered / stats.total_cards) * 100 : 0;

  const studyPercentage =
    stats.total_cards > 0 ? (stats.cards_studied / stats.total_cards) * 100 : 0;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Cards Studied
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.cards_studied}/{stats.total_cards}
              </Typography>
              <LinearProgress variant="determinate" value={studyPercentage} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmojiEvents color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Cards Mastered
                </Typography>
              </Box>
              <Typography variant="h4">{stats.cards_mastered}</Typography>
              <LinearProgress
                variant="determinate"
                value={masteryPercentage}
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule color="info" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Study Time
                </Typography>
              </Box>
              <Typography variant="h4">{stats.study_time_minutes}</Typography>
              <Typography variant="caption" color="text.secondary">
                minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="warning" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  Accuracy
                </Typography>
              </Box>
              <Typography variant="h4">{stats.average_accuracy.toFixed(1)}%</Typography>
              <LinearProgress
                variant="determinate"
                value={stats.average_accuracy}
                color="warning"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today&apos;s Study Plan
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`${stats.cards_due_today} cards due today`}
                  color={stats.cards_due_today > 0 ? 'primary' : 'default'}
                />
                <Chip label={`${stats.cards_mastered} mastered`} color="success" />
                <Chip
                  label={`${stats.total_cards - stats.cards_studied} not started`}
                  color="default"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
