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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  HowToVote as VoteIcon,
  People as PeopleIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import electionsApi from '@/api/elections';
import {
  Election,
  Candidate,
  ElectionStatus,
  CandidateStatus,
  VotingMethod,
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

const ElectionAdministration: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);

  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    position: '',
    voting_method: VotingMethod.SIMPLE,
    nominations_open_date: new Date(),
    nominations_close_date: new Date(),
    voting_open_date: new Date(),
    voting_close_date: new Date(),
    max_candidates: 10,
    min_candidates: 2,
  });

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchCandidates(selectedElection.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElection]);

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

  const fetchCandidates = async (electionId: number) => {
    try {
      const data = await electionsApi.getElectionCandidates(institutionId, electionId);
      setCandidates(data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const handleCreateElection = async () => {
    try {
      await electionsApi.createElection(institutionId, {
        ...newElection,
        nominations_open_date: newElection.nominations_open_date.toISOString(),
        nominations_close_date: newElection.nominations_close_date.toISOString(),
        voting_open_date: newElection.voting_open_date.toISOString(),
        voting_close_date: newElection.voting_close_date.toISOString(),
      } as Partial<Election>);
      setCreateDialogOpen(false);
      fetchElections();
      setNewElection({
        title: '',
        description: '',
        position: '',
        voting_method: VotingMethod.SIMPLE,
        nominations_open_date: new Date(),
        nominations_close_date: new Date(),
        voting_open_date: new Date(),
        voting_close_date: new Date(),
        max_candidates: 10,
        min_candidates: 2,
      });
      alert('Election created successfully!');
    } catch (error) {
      console.error('Failed to create election:', error);
      alert('Failed to create election. Please try again.');
    }
  };

  const handleUpdateElection = async () => {
    if (!selectedElection) return;

    try {
      await electionsApi.updateElection(institutionId, selectedElection.id, selectedElection);
      setEditDialogOpen(false);
      fetchElections();
      alert('Election updated successfully!');
    } catch (error) {
      console.error('Failed to update election:', error);
      alert('Failed to update election. Please try again.');
    }
  };

  const handleDeleteElection = async (electionId: number) => {
    if (!confirm('Are you sure you want to delete this election?')) return;

    try {
      await electionsApi.deleteElection(institutionId, electionId);
      fetchElections();
      if (selectedElection?.id === electionId) {
        setSelectedElection(null);
      }
      alert('Election deleted successfully!');
    } catch (error) {
      console.error('Failed to delete election:', error);
      alert('Failed to delete election. Please try again.');
    }
  };

  const handleApproveCandidate = async (candidateId: number) => {
    try {
      await electionsApi.approveCandidate(institutionId, candidateId);
      if (selectedElection) {
        fetchCandidates(selectedElection.id);
      }
      alert('Candidate approved successfully!');
    } catch (error) {
      console.error('Failed to approve candidate:', error);
      alert('Failed to approve candidate. Please try again.');
    }
  };

  const handleRejectCandidate = async () => {
    if (!selectedCandidate) return;

    try {
      await electionsApi.rejectCandidate(institutionId, selectedCandidate.id, rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
      if (selectedElection) {
        fetchCandidates(selectedElection.id);
      }
      alert('Candidate rejected.');
    } catch (error) {
      console.error('Failed to reject candidate:', error);
      alert('Failed to reject candidate. Please try again.');
    }
  };

  const handlePublishResults = async (electionId: number) => {
    if (!confirm('Are you sure you want to publish the results? This action cannot be undone.'))
      return;

    try {
      await electionsApi.publishResults(institutionId, electionId);
      fetchElections();
      alert('Results published successfully!');
    } catch (error) {
      console.error('Failed to publish results:', error);
      alert('Failed to publish results. Please try again.');
    }
  };

  const getStatusColor = (status: ElectionStatus | CandidateStatus) => {
    switch (status) {
      case ElectionStatus.VOTING_OPEN:
      case CandidateStatus.APPROVED:
        return 'success';
      case ElectionStatus.NOMINATIONS_OPEN:
      case CandidateStatus.PENDING:
        return 'info';
      case ElectionStatus.COMPLETED:
        return 'default';
      case CandidateStatus.REJECTED:
        return 'error';
      default:
        return 'warning';
    }
  };

  const pendingCandidates = candidates.filter((c) => c.status === CandidateStatus.PENDING);
  const approvedCandidates = candidates.filter((c) => c.status === CandidateStatus.APPROVED);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box mb={4}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  Election Administration
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create and manage student government elections
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <AdminIcon sx={{ fontSize: 36 }} />
              </Avatar>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              onClick={() => setCreateDialogOpen(true)}
            >
              Create New Election
            </Button>
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
              <Tab icon={<VoteIcon />} label="Elections" iconPosition="start" />
              <Tab
                icon={<PeopleIcon />}
                label={`Candidates (${pendingCandidates.length} pending)`}
                iconPosition="start"
              />
              <Tab icon={<ChartIcon />} label="Monitoring" iconPosition="start" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              {loading ? (
                <LinearProgress />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Voting Method</TableCell>
                        <TableCell>Candidates</TableCell>
                        <TableCell>Votes</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {elections.map((election) => (
                        <TableRow key={election.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {election.title}
                            </Typography>
                          </TableCell>
                          <TableCell>{election.position}</TableCell>
                          <TableCell>
                            <Chip
                              label={election.status.replace(/_/g, ' ')}
                              color={getStatusColor(election.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {election.voting_method === VotingMethod.RANKED_CHOICE
                              ? 'Ranked Choice'
                              : 'Simple'}
                          </TableCell>
                          <TableCell>{election.candidates_count || 0}</TableCell>
                          <TableCell>{election.votes_count || 0}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedElection(election)}
                                color="primary"
                              >
                                <ViewIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedElection(election);
                                  setEditDialogOpen(true);
                                }}
                                color="info"
                              >
                                <EditIcon />
                              </IconButton>
                              {election.status === ElectionStatus.VOTING_CLOSED && (
                                <IconButton
                                  size="small"
                                  onClick={() => handlePublishResults(election.id)}
                                  color="success"
                                >
                                  <PublishIcon />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteElection(election.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {selectedElection ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <AlertTitle>Election: {selectedElection.title}</AlertTitle>
                    Manage candidates for this election
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardHeader
                          title={`Pending Approval (${pendingCandidates.length})`}
                          avatar={<Chip label={pendingCandidates.length} color="warning" />}
                        />
                        <CardContent>
                          <Stack spacing={2}>
                            {pendingCandidates.map((candidate) => (
                              <Paper key={candidate.id} variant="outlined" sx={{ p: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Avatar src={candidate.student?.photo_url}>
                                    {candidate.student?.first_name.charAt(0)}
                                  </Avatar>
                                  <Box flex={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      {candidate.student?.first_name} {candidate.student?.last_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {candidate.student?.grade} - {candidate.student?.section}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      {candidate.campaign_statement.substring(0, 100)}...
                                    </Typography>
                                  </Box>
                                  <Stack spacing={1}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      startIcon={<ApproveIcon />}
                                      onClick={() => handleApproveCandidate(candidate.id)}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<RejectIcon />}
                                      onClick={() => {
                                        setSelectedCandidate(candidate);
                                        setRejectDialogOpen(true);
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  </Stack>
                                </Stack>
                              </Paper>
                            ))}
                            {pendingCandidates.length === 0 && (
                              <Alert severity="info">No pending candidates</Alert>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardHeader
                          title={`Approved Candidates (${approvedCandidates.length})`}
                          avatar={<Chip label={approvedCandidates.length} color="success" />}
                        />
                        <CardContent>
                          <Stack spacing={2}>
                            {approvedCandidates.map((candidate) => (
                              <Paper key={candidate.id} variant="outlined" sx={{ p: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Avatar src={candidate.student?.photo_url}>
                                    {candidate.student?.first_name.charAt(0)}
                                  </Avatar>
                                  <Box flex={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      {candidate.student?.first_name} {candidate.student?.last_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {candidate.student?.grade} - {candidate.student?.section}
                                    </Typography>
                                    <Stack direction="row" spacing={1} mt={1}>
                                      <Chip
                                        icon={<ViewIcon />}
                                        label={candidate.profile_views}
                                        size="small"
                                      />
                                      <Chip
                                        icon={<ApproveIcon />}
                                        label={candidate.endorsements_count}
                                        size="small"
                                      />
                                    </Stack>
                                  </Box>
                                </Stack>
                              </Paper>
                            ))}
                            {approvedCandidates.length === 0 && (
                              <Alert severity="info">No approved candidates yet</Alert>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info">Select an election to manage candidates</Alert>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {selectedElection ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Stack alignItems="center" spacing={1}>
                          <PeopleIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                          <Typography variant="h3" fontWeight="bold">
                            {selectedElection.candidates_count || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Candidates
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Stack alignItems="center" spacing={1}>
                          <VoteIcon sx={{ fontSize: 48, color: 'success.main' }} />
                          <Typography variant="h3" fontWeight="bold">
                            {selectedElection.votes_count || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Votes Cast
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Stack alignItems="center" spacing={1}>
                          <ApproveIcon sx={{ fontSize: 48, color: 'info.main' }} />
                          <Typography variant="h3" fontWeight="bold">
                            {approvedCandidates.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Approved Candidates
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Stack alignItems="center" spacing={1}>
                          <RejectIcon sx={{ fontSize: 48, color: 'warning.main' }} />
                          <Typography variant="h3" fontWeight="bold">
                            {pendingCandidates.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pending Approval
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardHeader title="Election Timeline" />
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="subtitle2">Nominations Open</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(selectedElection.nominations_open_date), 'PPpp')}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">Nominations Close</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(selectedElection.nominations_close_date), 'PPpp')}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">Voting Opens</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(selectedElection.voting_open_date), 'PPpp')}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">Voting Closes</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(selectedElection.voting_close_date), 'PPpp')}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">Select an election to view monitoring data</Alert>
              )}
            </TabPanel>
          </Paper>
        </Container>

        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Election</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Election Title"
                value={newElection.title}
                onChange={(e) => setNewElection({ ...newElection, title: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Position"
                placeholder="e.g., Student Body President"
                value={newElection.position}
                onChange={(e) => setNewElection({ ...newElection, position: e.target.value })}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newElection.description}
                onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Voting Method</InputLabel>
                <Select
                  value={newElection.voting_method}
                  label="Voting Method"
                  onChange={(e) =>
                    setNewElection({
                      ...newElection,
                      voting_method: e.target.value as VotingMethod,
                    })
                  }
                >
                  <MenuItem value={VotingMethod.SIMPLE}>Simple (One Vote)</MenuItem>
                  <MenuItem value={VotingMethod.RANKED_CHOICE}>Ranked Choice</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DateTimePicker
                    label="Nominations Open"
                    value={newElection.nominations_open_date}
                    onChange={(date) =>
                      setNewElection({ ...newElection, nominations_open_date: date || new Date() })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DateTimePicker
                    label="Nominations Close"
                    value={newElection.nominations_close_date}
                    onChange={(date) =>
                      setNewElection({ ...newElection, nominations_close_date: date || new Date() })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DateTimePicker
                    label="Voting Opens"
                    value={newElection.voting_open_date}
                    onChange={(date) =>
                      setNewElection({ ...newElection, voting_open_date: date || new Date() })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DateTimePicker
                    label="Voting Closes"
                    value={newElection.voting_close_date}
                    onChange={(date) =>
                      setNewElection({ ...newElection, voting_close_date: date || new Date() })
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Candidates"
                    value={newElection.min_candidates}
                    onChange={(e) =>
                      setNewElection({ ...newElection, min_candidates: parseInt(e.target.value) })
                    }
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Candidates"
                    value={newElection.max_candidates}
                    onChange={(e) =>
                      setNewElection({ ...newElection, max_candidates: parseInt(e.target.value) })
                    }
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateElection}>
              Create Election
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Election</DialogTitle>
          <DialogContent>
            {selectedElection && (
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Election Title"
                  value={selectedElection.title}
                  onChange={(e) =>
                    setSelectedElection({ ...selectedElection, title: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Position"
                  value={selectedElection.position}
                  onChange={(e) =>
                    setSelectedElection({ ...selectedElection, position: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={selectedElection.description}
                  onChange={(e) =>
                    setSelectedElection({ ...selectedElection, description: e.target.value })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedElection.status}
                    label="Status"
                    onChange={(e) =>
                      setSelectedElection({
                        ...selectedElection,
                        status: e.target.value as ElectionStatus,
                      })
                    }
                  >
                    {Object.values(ElectionStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateElection}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reject Candidate</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for Rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this candidacy..."
              sx={{ mt: 2 }}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRejectCandidate}
              disabled={!rejectReason.trim()}
            >
              Reject Candidate
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ElectionAdministration;
