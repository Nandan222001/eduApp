import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { gamificationAPI } from '../../api/gamification';
import { LeaderboardEntry, LeaderboardType, LeaderboardPeriod } from '../../types/gamification';

interface LeaderboardTableProps {
  userId: number;
  institutionId: number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ userId, institutionId }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<LeaderboardType>(LeaderboardType.GLOBAL);
  const [filterPeriod, setFilterPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId, filterType, filterPeriod]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await gamificationAPI.getDynamicLeaderboard(
        institutionId,
        { type: filterType, period: filterPeriod },
        userId,
        50
      );
      setEntries(data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return 'inherit';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: getRankColor(rank),
            color: rank <= 3 ? '#000' : 'inherit',
            fontWeight: 'bold',
          }}
        >
          {rank}
        </Avatar>
      );
    }
    return (
      <Typography variant="h6" fontWeight="bold">
        {rank}
      </Typography>
    );
  };

  const getRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previous_rank) return null;
    const change = entry.previous_rank - entry.rank;
    if (change === 0) {
      return (
        <Chip
          icon={<RemoveIcon />}
          label="Same"
          size="small"
          sx={{ bgcolor: 'grey.300', fontWeight: 'bold' }}
        />
      );
    }
    if (change > 0) {
      return (
        <Chip
          icon={<TrendingUpIcon />}
          label={`+${change}`}
          size="small"
          color="success"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    return (
      <Chip
        icon={<TrendingDownIcon />}
        label={Math.abs(change)}
        size="small"
        color="error"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const periods = [
      LeaderboardPeriod.ALL_TIME,
      LeaderboardPeriod.MONTHLY,
      LeaderboardPeriod.WEEKLY,
      LeaderboardPeriod.DAILY,
    ];
    setFilterPeriod(periods[newValue]);
  };

  const isCurrentUser = (entry: LeaderboardEntry) => entry.user_id === userId;

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Leaderboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compete with others and climb the ranks
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadLeaderboard} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="All Time" />
            <Tab label="This Month" />
            <Tab label="This Week" />
            <Tab label="Today" />
          </Tabs>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <FormControl fullWidth>
            <InputLabel>Leaderboard Type</InputLabel>
            <Select
              value={filterType}
              label="Leaderboard Type"
              onChange={(e) => setFilterType(e.target.value as LeaderboardType)}
              startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
            >
              <MenuItem value={LeaderboardType.GLOBAL}>Global</MenuItem>
              <MenuItem value={LeaderboardType.GRADE}>My Grade</MenuItem>
              <MenuItem value={LeaderboardType.SECTION}>My Section</MenuItem>
              <MenuItem value={LeaderboardType.SUBJECT}>By Subject</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No entries yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Be the first to earn points and appear on the leaderboard!
          </Typography>
        </Paper>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Rank
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Points
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Change
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    sx={{
                      bgcolor: isCurrentUser(entry) ? 'primary.light' : 'inherit',
                      opacity: isCurrentUser(entry) ? 1 : 0.9,
                      '&:hover': {
                        bgcolor: isCurrentUser(entry) ? 'primary.light' : 'action.hover',
                      },
                    }}
                  >
                    <TableCell align="center">{getRankIcon(entry.rank)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: isCurrentUser(entry) ? 'primary.main' : 'secondary.main',
                            width: 48,
                            height: 48,
                          }}
                        >
                          {entry.user?.first_name?.[0]}
                          {entry.user?.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {entry.user?.first_name} {entry.user?.last_name}
                            {isCurrentUser(entry) && (
                              <Chip
                                label="You"
                                size="small"
                                color="primary"
                                sx={{ ml: 1, fontWeight: 'bold' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{entry.user?.username}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <TrophyIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          {entry.score.toLocaleString()}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">{getRankChange(entry)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {entries.length > 0 && (
        <Box mt={3} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Showing top {entries.length} students
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default LeaderboardTable;
