import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  ShowChart as ChartIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import electionsApi from '@/api/elections';
import {
  Election,
  ElectionResults as ElectionResultsType,
  ElectionStatus,
} from '@/types/elections';
import ConfettiCelebration from '@/components/common/ConfettiCelebration';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ElectionResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResultsType | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchCompletedElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompletedElections = async () => {
    try {
      setLoading(true);
      const data = await electionsApi.getElections(institutionId);
      const completed = data.filter(
        (e) => e.status === ElectionStatus.COMPLETED || e.status === ElectionStatus.VOTING_CLOSED
      );
      setElections(completed);
      if (completed.length > 0) {
        handleSelectElection(completed[0]);
      }
    } catch (error) {
      console.error('Failed to fetch elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElection = async (election: Election) => {
    setSelectedElection(election);
    try {
      const data = await electionsApi.getElectionResults(institutionId, election.id);
      setResults(data);
      if (data.winner) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  const votesDistributionData = results
    ? {
        labels: results.candidates.map((c) => c.candidate_name),
        datasets: [
          {
            data: results.candidates.map((c) => c.votes_count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const gradeDistributionData = results
    ? {
        labels: results.demographics.by_grade.map((g) => g.grade),
        datasets: [
          {
            label: 'Votes by Grade',
            data: results.demographics.by_grade.map((g) => g.count),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
        ],
      }
    : null;

  const genderDistributionData = results
    ? {
        labels: results.demographics.by_gender.map((g) => g.gender),
        datasets: [
          {
            data: results.demographics.by_gender.map((g) => g.count),
            backgroundColor: [
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 206, 86, 0.8)',
            ],
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <ConfettiCelebration
        active={showConfetti}
        duration={5000}
        recycle={false}
        numberOfPieces={500}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Election Results
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View results and analytics from completed elections
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              }}
            >
              <TrophyIcon sx={{ fontSize: 36 }} />
            </Avatar>
          </Stack>
        </Box>

        <Grid container spacing={3} mb={3}>
          {elections.map((election) => (
            <Grid item xs={12} sm={6} md={4} key={election.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedElection?.id === election.id ? '2px solid' : '1px solid',
                  borderColor: selectedElection?.id === election.id ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 4 },
                }}
                onClick={() => handleSelectElection(election)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {election.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {election.position}
                  </Typography>
                  <Chip
                    label={election.status.replace(/_/g, ' ')}
                    color={election.status === ElectionStatus.COMPLETED ? 'success' : 'default'}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {results && selectedElection && (
          <Paper sx={{ borderRadius: 2 }}>
            {results.winner && (
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  p: 4,
                  borderRadius: '8px 8px 0 0',
                }}
              >
                <Stack alignItems="center" spacing={2}>
                  <TrophyIcon sx={{ fontSize: 80 }} />
                  <Typography variant="h3" fontWeight="bold">
                    Winner Announcement
                  </Typography>
                  <Avatar
                    src={results.winner.photo_url}
                    sx={{ width: 120, height: 120, border: '4px solid white' }}
                  >
                    {results.winner.candidate_name.charAt(0)}
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold">
                    {results.winner.candidate_name}
                  </Typography>
                  <Typography variant="h5">
                    {results.winner.votes_count} votes ({results.winner.vote_percentage.toFixed(1)}
                    %)
                  </Typography>
                </Stack>
              </Box>
            )}

            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { minHeight: 64, fontSize: '1rem', fontWeight: 600 },
              }}
            >
              <Tab icon={<TrophyIcon />} label="Results" iconPosition="start" />
              <Tab icon={<ChartIcon />} label="Vote Breakdown" iconPosition="start" />
              <Tab icon={<PeopleIcon />} label="Demographics" iconPosition="start" />
              {results.rounds && (
                <Tab icon={<TimelineIcon />} label="Rounds" iconPosition="start" />
              )}
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardHeader title="Candidate Results" />
                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Rank</TableCell>
                              <TableCell>Candidate</TableCell>
                              <TableCell align="right">Votes</TableCell>
                              <TableCell align="right">Percentage</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {results.candidates
                              .sort((a, b) => b.votes_count - a.votes_count)
                              .map((candidate, index) => (
                                <TableRow key={candidate.candidate_id}>
                                  <TableCell>
                                    {index === 0 ? (
                                      <TrophyIcon sx={{ color: 'gold' }} />
                                    ) : (
                                      `#${index + 1}`
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                      <Avatar src={candidate.photo_url}>
                                        {candidate.candidate_name.charAt(0)}
                                      </Avatar>
                                      <Typography variant="body2" fontWeight="bold">
                                        {candidate.candidate_name}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold">
                                      {candidate.votes_count}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ width: '100%' }}>
                                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        {candidate.vote_percentage.toFixed(1)}%
                                      </Typography>
                                      <LinearProgress
                                        variant="determinate"
                                        value={candidate.vote_percentage}
                                        sx={{ height: 8, borderRadius: 4 }}
                                      />
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    {candidate.is_winner && (
                                      <Chip label="Winner" color="success" size="small" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Stack spacing={3}>
                    <Card>
                      <CardContent>
                        <Stack alignItems="center" spacing={1}>
                          <PeopleIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                          <Typography variant="h3" fontWeight="bold">
                            {results.total_votes}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Votes Cast
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent>
                        <Stack alignItems="center" spacing={1}>
                          <ChartIcon sx={{ fontSize: 48, color: 'success.main' }} />
                          <Typography variant="h3" fontWeight="bold">
                            {results.voter_turnout_percentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Voter Turnout
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {results.demographics.total_votes_cast} of{' '}
                            {results.demographics.total_eligible_voters} eligible voters
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Vote Distribution (Pie Chart)" />
                    <CardContent>
                      {votesDistributionData && (
                        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                          <Pie data={votesDistributionData} options={{ responsive: true }} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Vote Distribution (Doughnut)" />
                    <CardContent>
                      {votesDistributionData && (
                        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                          <Doughnut data={votesDistributionData} options={{ responsive: true }} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Votes by Grade" />
                    <CardContent>
                      {gradeDistributionData && (
                        <Bar data={gradeDistributionData} options={{ responsive: true }} />
                      )}
                      <Box mt={2}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Grade</TableCell>
                                <TableCell align="right">Votes</TableCell>
                                <TableCell align="right">Percentage</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {results.demographics.by_grade.map((grade) => (
                                <TableRow key={grade.grade}>
                                  <TableCell>{grade.grade}</TableCell>
                                  <TableCell align="right">{grade.count}</TableCell>
                                  <TableCell align="right">
                                    {grade.percentage.toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Votes by Gender" />
                    <CardContent>
                      {genderDistributionData && (
                        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                          <Doughnut data={genderDistributionData} options={{ responsive: true }} />
                        </Box>
                      )}
                      <Box mt={2}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Gender</TableCell>
                                <TableCell align="right">Votes</TableCell>
                                <TableCell align="right">Percentage</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {results.demographics.by_gender.map((gender) => (
                                <TableRow key={gender.gender}>
                                  <TableCell>{gender.gender}</TableCell>
                                  <TableCell align="right">{gender.count}</TableCell>
                                  <TableCell align="right">
                                    {gender.percentage.toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {results.rounds && (
              <TabPanel value={activeTab} index={3}>
                <Card>
                  <CardHeader
                    title="Ranked Choice Voting Rounds"
                    subheader="Elimination rounds until a winner is determined"
                  />
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>How Ranked Choice Works</AlertTitle>
                      Candidates with the fewest votes are eliminated each round, and their votes
                      are redistributed to voters&apos; next choices until a candidate has a
                      majority.
                    </Alert>
                    <Stack spacing={3}>
                      {results.rounds.map((round) => (
                        <Box key={round.round_number}>
                          <Typography variant="h6" gutterBottom>
                            Round {round.round_number}
                          </Typography>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Candidate</TableCell>
                                  <TableCell align="right">Votes</TableCell>
                                  <TableCell align="center">Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {round.candidates.map((c) => {
                                  const candidate = results.candidates.find(
                                    (can) => can.candidate_id === c.candidate_id
                                  );
                                  return (
                                    <TableRow key={c.candidate_id}>
                                      <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                          <Avatar src={candidate?.photo_url}>
                                            {candidate?.candidate_name.charAt(0)}
                                          </Avatar>
                                          <Typography>{candidate?.candidate_name}</Typography>
                                        </Stack>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography fontWeight="bold">{c.votes}</Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        {c.eliminated ? (
                                          <Chip label="Eliminated" color="error" size="small" />
                                        ) : (
                                          <Chip label="Active" color="success" size="small" />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </TabPanel>
            )}
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ElectionResults;
