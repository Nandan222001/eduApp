import { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import { EmojiEvents, Timer, TrendingUp } from '@mui/icons-material';
import { useQuizLeaderboard } from '@/hooks/useQuizLeaderboard';

interface LiveLeaderboardProps {
  quizId: number;
  currentUserId?: number;
}

export const LiveLeaderboard = ({ quizId, currentUserId }: LiveLeaderboardProps) => {
  const { leaderboard, lastUpdate } = useQuizLeaderboard(quizId);
  const [highlightedRanks, setHighlightedRanks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (lastUpdate) {
      const newHighlights = new Set(leaderboard.slice(0, 3).map((entry) => entry.rank));
      setHighlightedRanks(newHighlights);

      const timer = setTimeout(() => {
        setHighlightedRanks(new Set());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [lastUpdate, leaderboard]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getMedalColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return 'transparent';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <EmojiEvents color="primary" />
        <Typography variant="h6">Live Leaderboard</Typography>
        {lastUpdate && (
          <Chip
            label="LIVE"
            color="success"
            size="small"
            sx={{ ml: 'auto', animation: 'pulse 2s infinite' }}
          />
        )}
      </Box>

      {leaderboard.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          No participants yet. Be the first to complete the quiz!
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Participant</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Time</TableCell>
                <TableCell align="right">Attempts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const isHighlighted = highlightedRanks.has(entry.rank);
                const medalColor = getMedalColor(entry.rank);

                return (
                  <TableRow
                    key={entry.user_id}
                    sx={{
                      backgroundColor: isCurrentUser
                        ? 'action.selected'
                        : isHighlighted
                          ? 'action.hover'
                          : 'transparent',
                      transition: 'background-color 0.3s',
                      fontWeight: isCurrentUser ? 'bold' : 'normal',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {entry.rank <= 3 ? (
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: medalColor,
                              fontSize: '0.875rem',
                            }}
                          >
                            {entry.rank}
                          </Avatar>
                        ) : (
                          <Typography>{entry.rank}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {entry.user_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {entry.user_name}
                          {isCurrentUser && (
                            <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 0.5,
                        }}
                      >
                        <TrendingUp fontSize="small" color="success" />
                        <Typography variant="body2" fontWeight="medium">
                          {entry.best_score.toFixed(1)} ({entry.best_percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 0.5,
                        }}
                      >
                        <Timer fontSize="small" />
                        <Typography variant="body2">
                          {formatTime(entry.best_time_seconds)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{entry.total_attempts}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {lastUpdate && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, textAlign: 'right' }}
        >
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </Typography>
      )}
    </Paper>
  );
};
