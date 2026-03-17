import { useEffect, useState } from 'react';
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
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  School as SchoolIcon,
  Groups as TeamIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { olympicsAPI, SchoolRanking, IndividualRanking, Team } from '@/api/olympics';
import io from 'socket.io-client';

interface LiveLeaderboardProps {
  competitionId: number;
  currentUserId?: number;
}

export default function LiveLeaderboard({ competitionId, currentUserId }: LiveLeaderboardProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolRankings, setSchoolRankings] = useState<SchoolRanking[]>([]);
  const [individualRankings, setIndividualRankings] = useState<IndividualRanking[]>([]);
  const [teamRankings, setTeamRankings] = useState<Team[]>([]);

  useEffect(() => {
    loadRankings();
    const cleanup = setupWebSocket();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const [schools, individuals, teams] = await Promise.all([
        olympicsAPI.getSchoolRankings(competitionId),
        olympicsAPI.getIndividualRankings(competitionId),
        olympicsAPI.getTeamRankings(competitionId),
      ]);
      setSchoolRankings(schools);
      setIndividualRankings(individuals);
      setTeamRankings(teams);
      setError(null);
    } catch (err) {
      setError('Failed to load rankings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join_competition', { competition_id: competitionId });
    });

    socket.on('leaderboard_update', (data: { type: string; rankings: unknown[] }) => {
      if (data.type === 'school') {
        setSchoolRankings(data.rankings as SchoolRanking[]);
      } else if (data.type === 'individual') {
        setIndividualRankings(data.rankings as IndividualRanking[]);
      } else if (data.type === 'team') {
        setTeamRankings(data.rankings as Team[]);
      }
    });

    return () => {
      socket.emit('leave_competition', { competition_id: competitionId });
      socket.disconnect();
    };
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return 'inherit';
  };

  const getRankBadge = (rank: number) => {
    const color = getRankColor(rank);
    return (
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: rank <= 3 ? color : alpha(theme.palette.primary.main, 0.1),
          color: rank <= 3 ? '#000' : theme.palette.primary.main,
          fontWeight: 'bold',
        }}
      >
        {rank}
      </Avatar>
    );
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = previous - current;
    if (change === 0) {
      return <Chip icon={<RemoveIcon />} label="—" size="small" />;
    }
    if (change > 0) {
      return <Chip icon={<TrendingUpIcon />} label={`+${change}`} size="small" color="success" />;
    }
    return <Chip icon={<TrendingDownIcon />} label={Math.abs(change)} size="small" color="error" />;
  };

  const renderSchoolRankings = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center">Rank</TableCell>
            <TableCell>School</TableCell>
            <TableCell align="center">Points</TableCell>
            <TableCell align="center">Participants</TableCell>
            <TableCell align="center">Medals</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schoolRankings.map((school) => (
            <TableRow key={school.school_id}>
              <TableCell align="center">{getRankBadge(school.rank)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {school.school_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg: {school.average_points.toFixed(1)} pts
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {school.total_points.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="center">{school.participants_count}</TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  {school.gold_medals > 0 && (
                    <Chip label={`🥇 ${school.gold_medals}`} size="small" />
                  )}
                  {school.silver_medals > 0 && (
                    <Chip label={`🥈 ${school.silver_medals}`} size="small" />
                  )}
                  {school.bronze_medals > 0 && (
                    <Chip label={`🥉 ${school.bronze_medals}`} size="small" />
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderIndividualRankings = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center">Rank</TableCell>
            <TableCell>Student</TableCell>
            <TableCell align="center">Points</TableCell>
            <TableCell align="center">Events</TableCell>
            <TableCell align="center">Change</TableCell>
            <TableCell align="center">Medals</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {individualRankings.map((student) => (
            <TableRow
              key={student.user_id}
              sx={{
                bgcolor:
                  currentUserId === student.user_id
                    ? alpha(theme.palette.primary.main, 0.08)
                    : 'inherit',
              }}
            >
              <TableCell align="center">{getRankBadge(student.rank)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    {student.first_name[0]}
                    {student.last_name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {student.first_name} {student.last_name}
                      {currentUserId === student.user_id && (
                        <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {student.grade && student.section
                        ? `${student.grade} - ${student.section}`
                        : '@' + student.username}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {student.total_points.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="center">{student.events_participated}</TableCell>
              <TableCell align="center">
                {getRankChange(student.rank, student.previous_rank)}
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  {student.medals.gold > 0 && (
                    <Chip label={`🥇 ${student.medals.gold}`} size="small" />
                  )}
                  {student.medals.silver > 0 && (
                    <Chip label={`🥈 ${student.medals.silver}`} size="small" />
                  )}
                  {student.medals.bronze > 0 && (
                    <Chip label={`🥉 ${student.medals.bronze}`} size="small" />
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTeamRankings = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center">Rank</TableCell>
            <TableCell>Team</TableCell>
            <TableCell align="center">Points</TableCell>
            <TableCell align="center">Members</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teamRankings.map((team) => (
            <TableRow key={team.id}>
              <TableCell align="center">{getRankBadge(team.rank || 0)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={team.avatar_url} sx={{ bgcolor: theme.palette.info.main }}>
                    <TeamIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {team.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Code: {team.team_code}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {team.total_points.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="center">{team.members_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <TrophyIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Live Leaderboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated in real-time
            </Typography>
          </Box>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SchoolIcon />} label="Schools" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="Individual" iconPosition="start" />
          <Tab icon={<TeamIcon />} label="Teams" iconPosition="start" />
        </Tabs>

        {activeTab === 0 && renderSchoolRankings()}
        {activeTab === 1 && renderIndividualRankings()}
        {activeTab === 2 && renderTeamRankings()}
      </CardContent>
    </Card>
  );
}
