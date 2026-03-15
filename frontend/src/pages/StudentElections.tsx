import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
  Alert,
  AlertTitle,
  LinearProgress,
  Stack,
  Divider,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  EventNote as CalendarIcon,
  ThumbUp as ThumbUpIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';
import electionsApi from '@/api/elections';
import {
  Election,
  Candidate,
  ElectionCalendarEvent,
  ElectionStatus,
  CandidateStatus,
  VotingMethod,
  RankedChoiceVote,
} from '@/types/elections';

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

const StudentElections: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [elections, setElections] = useState<Election[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ElectionCalendarEvent[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [votingDialogOpen, setVotingDialogOpen] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [rankedChoices, setRankedChoices] = useState<RankedChoiceVote[]>([]);
  const [simpleVote, setSimpleVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchElections();
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const data = await electionsApi.getElections(institutionId);
      setElections(data);
    } catch (error) {
      console.error('Failed to fetch elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    try {
      const data = await electionsApi.getElectionCalendar(institutionId);
      setCalendarEvents(data);
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    }
  };

  const fetchCandidates = async (electionId: number) => {
    try {
      const data = await electionsApi.getElectionCandidates(institutionId, electionId);
      const approved = data.filter((c) => c.status === CandidateStatus.APPROVED);
      setCandidates(approved);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const handleViewElection = async (election: Election) => {
    setSelectedElection(election);
    await fetchCandidates(election.id);
    const voted = await electionsApi.hasVoted(institutionId, election.id);
    setHasVoted(voted);
  };

  const handleViewCandidate = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateDialogOpen(true);
    await electionsApi.recordProfileView(institutionId, candidate.id);
  };

  const handleOpenVoting = () => {
    setRankedChoices([]);
    setSimpleVote(null);
    setVotingDialogOpen(true);
  };

  const handleSubmitVote = async () => {
    if (!selectedElection) return;

    try {
      if (selectedElection.voting_method === VotingMethod.RANKED_CHOICE) {
        await electionsApi.submitVote(institutionId, {
          election_id: selectedElection.id,
          ranked_choices: rankedChoices,
        });
      } else {
        if (!simpleVote) return;
        await electionsApi.submitVote(institutionId, {
          election_id: selectedElection.id,
          candidate_id: simpleVote,
        });
      }
      setVotingDialogOpen(false);
      setHasVoted(true);
      alert('Vote submitted successfully!');
    } catch (error) {
      console.error('Failed to submit vote:', error);
      alert('Failed to submit vote. Please try again.');
    }
  };

  const handleRankedChoiceChange = (candidateId: number, rank: number) => {
    const existing = rankedChoices.filter((rc) => rc.candidate_id !== candidateId);
    if (rank > 0) {
      setRankedChoices([...existing, { candidate_id: candidateId, rank }]);
    } else {
      setRankedChoices(existing);
    }
  };

  const getStatusColor = (status: ElectionStatus) => {
    switch (status) {
      case ElectionStatus.VOTING_OPEN:
        return 'success';
      case ElectionStatus.NOMINATIONS_OPEN:
        return 'info';
      case ElectionStatus.COMPLETED:
        return 'default';
      default:
        return 'warning';
    }
  };

  const getDaysUntil = (date: string) => {
    return differenceInDays(parseISO(date), new Date());
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Student Elections
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Participate in school governance and elect your representatives
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <VoteIcon sx={{ fontSize: 36 }} />
            </Avatar>
          </Stack>
        </Box>

        <Paper sx={{ borderRadius: 2 }}>
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
            <Tab icon={<CalendarIcon />} label="Calendar" iconPosition="start" />
            <Tab icon={<VoteIcon />} label="Elections" iconPosition="start" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {calendarEvents.map((event) => (
                <Grid item xs={12} md={6} lg={4} key={event.id}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <CalendarIcon />
                        </Avatar>
                      }
                      title={event.title}
                      subheader={event.position}
                    />
                    <CardContent>
                      <Stack spacing={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {format(parseISO(event.date), 'MMM dd, yyyy h:mm a')}
                          </Typography>
                        </Box>
                        <Chip label={event.type.replace(/_/g, ' ')} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {getDaysUntil(event.date) > 0
                            ? `In ${getDaysUntil(event.date)} days`
                            : getDaysUntil(event.date) === 0
                              ? 'Today'
                              : 'Passed'}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {loading ? (
              <LinearProgress />
            ) : (
              <Grid container spacing={3}>
                {elections.map((election) => (
                  <Grid item xs={12} md={6} key={election.id}>
                    <Card>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <VoteIcon />
                          </Avatar>
                        }
                        title={election.title}
                        subheader={election.position}
                        action={
                          <Chip
                            label={election.status.replace(/_/g, ' ')}
                            color={getStatusColor(election.status)}
                            size="small"
                          />
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {election.description}
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">Voting Opens:</Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {format(parseISO(election.voting_open_date), 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">Voting Closes:</Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {format(parseISO(election.voting_close_date), 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">Candidates:</Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {election.candidates_count || 0}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ mt: 2 }}
                          onClick={() => handleViewElection(election)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Paper>

        {selectedElection && (
          <Dialog
            open={!!selectedElection}
            onClose={() => setSelectedElection(null)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedElection.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedElection.position}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedElection(null)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              {hasVoted && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <AlertTitle>You have voted in this election</AlertTitle>
                  Thank you for participating in student governance!
                </Alert>
              )}

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Candidates
                </Typography>
                <Stack direction="row" spacing={1} mb={2}>
                  {selectedElection.status === ElectionStatus.VOTING_OPEN && !hasVoted && (
                    <Button variant="contained" startIcon={<VoteIcon />} onClick={handleOpenVoting}>
                      Vote Now
                    </Button>
                  )}
                </Stack>

                <Grid container spacing={2}>
                  {candidates.map((candidate) => (
                    <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 4 },
                          border: selectedCandidates.includes(candidate.id)
                            ? '2px solid'
                            : '1px solid',
                          borderColor: selectedCandidates.includes(candidate.id)
                            ? 'primary.main'
                            : 'divider',
                        }}
                        onClick={() => {
                          if (selectedCandidates.includes(candidate.id)) {
                            setSelectedCandidates(
                              selectedCandidates.filter((id) => id !== candidate.id)
                            );
                          } else if (selectedCandidates.length < 3) {
                            setSelectedCandidates([...selectedCandidates, candidate.id]);
                          }
                        }}
                      >
                        <CardContent>
                          <Stack alignItems="center" spacing={1}>
                            <Badge
                              badgeContent={selectedCandidates.indexOf(candidate.id) + 1 || null}
                              color="primary"
                            >
                              <Avatar
                                src={candidate.student?.photo_url}
                                sx={{ width: 80, height: 80 }}
                              >
                                {candidate.student?.first_name.charAt(0)}
                              </Avatar>
                            </Badge>
                            <Typography variant="h6" textAlign="center">
                              {candidate.student?.first_name} {candidate.student?.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {candidate.student?.grade} - {candidate.student?.section}
                            </Typography>
                            {candidate.slogan && (
                              <Typography
                                variant="body2"
                                fontStyle="italic"
                                textAlign="center"
                                color="primary"
                              >
                                &ldquo;{candidate.slogan}&rdquo;
                              </Typography>
                            )}
                            <Stack direction="row" spacing={2}>
                              <Tooltip title="Profile Views">
                                <Chip
                                  icon={<PeopleIcon />}
                                  label={candidate.profile_views}
                                  size="small"
                                />
                              </Tooltip>
                              <Tooltip title="Endorsements">
                                <Chip
                                  icon={<ThumbUpIcon />}
                                  label={candidate.endorsements_count}
                                  size="small"
                                />
                              </Tooltip>
                            </Stack>
                            <Button
                              size="small"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCandidate(candidate);
                              }}
                            >
                              View Profile
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </DialogContent>
          </Dialog>
        )}

        <Dialog
          open={candidateDialogOpen}
          onClose={() => setCandidateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedCandidate && (
            <>
              <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={selectedCandidate.student?.photo_url}
                      sx={{ width: 60, height: 60 }}
                    >
                      {selectedCandidate.student?.first_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {selectedCandidate.student?.first_name}{' '}
                        {selectedCandidate.student?.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCandidate.student?.grade} - {selectedCandidate.student?.section}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setCandidateDialogOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </DialogTitle>
              <DialogContent>
                {selectedCandidate.slogan && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontStyle="italic">
                      &ldquo;{selectedCandidate.slogan}&rdquo;
                    </Typography>
                  </Alert>
                )}

                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Campaign Statement
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedCandidate.campaign_statement}
                  </Typography>
                </Box>

                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Platform Points
                  </Typography>
                  <List>
                    {selectedCandidate.platform_points.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <CheckIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {selectedCandidate.poster_url && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Campaign Poster
                    </Typography>
                    <img
                      src={selectedCandidate.poster_url}
                      alt="Campaign poster"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </Box>
                )}

                {selectedCandidate.video_url && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Campaign Video
                    </Typography>
                    <video
                      src={selectedCandidate.video_url}
                      controls
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </Box>
                )}

                {selectedCandidate.endorsements && selectedCandidate.endorsements.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Endorsements
                    </Typography>
                    <Stack spacing={1}>
                      {selectedCandidate.endorsements
                        .filter((e) => e.is_public)
                        .map((endorsement) => (
                          <Card key={endorsement.id} variant="outlined">
                            <CardContent>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar src={endorsement.endorser?.photo_url}>
                                  {endorsement.endorser?.first_name.charAt(0)}
                                </Avatar>
                                <Box flex={1}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {endorsement.endorser?.first_name}{' '}
                                    {endorsement.endorser?.last_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {endorsement.message}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                    </Stack>
                  </Box>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>

        <Dialog
          open={votingDialogOpen}
          onClose={() => setVotingDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cast Your Vote</DialogTitle>
          <DialogContent>
            {selectedElection?.voting_method === VotingMethod.RANKED_CHOICE ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Ranked Choice Voting</AlertTitle>
                  Rank candidates in order of preference (1 being your top choice)
                </Alert>
                <FormControl fullWidth>
                  {candidates.map((candidate) => (
                    <Box key={candidate.id} sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={candidate.student?.photo_url}>
                          {candidate.student?.first_name.charAt(0)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body1" fontWeight="bold">
                            {candidate.student?.first_name} {candidate.student?.last_name}
                          </Typography>
                        </Box>
                        <TextField
                          type="number"
                          label="Rank"
                          size="small"
                          sx={{ width: 100 }}
                          inputProps={{ min: 0, max: candidates.length }}
                          value={
                            rankedChoices.find((rc) => rc.candidate_id === candidate.id)?.rank || ''
                          }
                          onChange={(e) =>
                            handleRankedChoiceChange(candidate.id, parseInt(e.target.value) || 0)
                          }
                        />
                      </Stack>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </FormControl>
              </Box>
            ) : (
              <FormControl fullWidth>
                <FormLabel>Select a candidate</FormLabel>
                <RadioGroup
                  value={simpleVote}
                  onChange={(e) => setSimpleVote(parseInt(e.target.value))}
                >
                  {candidates.map((candidate) => (
                    <FormControlLabel
                      key={candidate.id}
                      value={candidate.id}
                      control={<Radio />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar src={candidate.student?.photo_url}>
                            {candidate.student?.first_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {candidate.student?.first_name} {candidate.student?.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {candidate.student?.grade} - {candidate.student?.section}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVotingDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmitVote}
              disabled={
                selectedElection?.voting_method === VotingMethod.RANKED_CHOICE
                  ? rankedChoices.length === 0
                  : !simpleVote
              }
            >
              Submit Vote
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default StudentElections;
