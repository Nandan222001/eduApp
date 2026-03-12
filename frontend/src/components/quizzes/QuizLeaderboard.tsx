import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Paper,
} from '@mui/material';
import { EmojiEvents, Timer, TrendingUp } from '@mui/icons-material';
import { QuizLeaderboardEntry } from '@/types/quiz';

interface QuizLeaderboardProps {
  entries: QuizLeaderboardEntry[];
  currentUserId?: number;
}

export const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({ entries, currentUserId }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankColor = (rank?: number) => {
    if (!rank) return 'default';
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'default';
  };

  const getRankIcon = (rank?: number) => {
    if (!rank) return null;
    if (rank <= 3) {
      return <EmojiEvents sx={{ color: getRankColor(rank) }} />;
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Leaderboard</Typography>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" width={80}>
                  Rank
                </TableCell>
                <TableCell>User</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Percentage</TableCell>
                <TableCell align="center">Time</TableCell>
                <TableCell align="center">Attempts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No entries yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const isCurrentUser = entry.user_id === currentUserId;
                  return (
                    <TableRow
                      key={entry.id}
                      sx={{
                        bgcolor: isCurrentUser ? 'action.selected' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                          }}
                        >
                          {getRankIcon(entry.rank)}
                          <Typography
                            variant="h6"
                            sx={{
                              color: getRankColor(entry.rank),
                              fontWeight: entry.rank && entry.rank <= 3 ? 'bold' : 'normal',
                            }}
                          >
                            {entry.rank}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {entry.user_name?.[0] || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {entry.user_name || `User ${entry.user_id}`}
                              {isCurrentUser && (
                                <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight="medium">
                          {entry.best_score}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                          }}
                        >
                          <TrendingUp fontSize="small" color="success" />
                          <Typography
                            variant="body2"
                            color={entry.best_percentage >= 80 ? 'success.main' : 'text.primary'}
                          >
                            {entry.best_percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Timer fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatTime(entry.best_time_seconds)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={entry.total_attempts} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
