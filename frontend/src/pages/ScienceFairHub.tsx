import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  TextField,
  Stack,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  EmojiEvents,
  Add,
  Upload,
  Assessment,
  CheckCircle,
  Pending,
  Cancel,
  Visibility,
  Download,
} from '@mui/icons-material';
import { ScienceFairSubmission, ResearchProject } from '@/types/research';

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

export default function ScienceFairHub() {
  const [tabValue, setTabValue] = useState(0);
  const [submissions, setSubmissions] = useState<ScienceFairSubmission[]>([]);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ScienceFairSubmission | null>(null);
  const [newSubmission, setNewSubmission] = useState({
    project_id: 0,
    fair_name: '',
    presentation_date: '',
  });

  useEffect(() => {
    loadSubmissions();
    loadProjects();
  }, []);

  const loadSubmissions = async () => {
    const mockSubmissions: ScienceFairSubmission[] = [
      {
        id: 1,
        project_id: 1,
        fair_name: 'Regional Science Fair 2024',
        submission_date: '2024-02-01T00:00:00Z',
        presentation_date: '2024-03-15T00:00:00Z',
        booth_number: 'A-23',
        status: 'judged',
        judging_criteria: [
          {
            id: 1,
            name: 'Scientific Thought/Engineering Goals',
            description: 'Clear objectives, hypothesis, and experimental design',
            max_score: 30,
            score: 27,
            judge_feedback: 'Excellent hypothesis and well-designed methodology',
          },
          {
            id: 2,
            name: 'Creative Ability',
            description: 'Originality and innovation in approach',
            max_score: 30,
            score: 25,
            judge_feedback: 'Good creative approach to testing pH levels',
          },
          {
            id: 3,
            name: 'Thoroughness',
            description: 'Completeness of data collection and analysis',
            max_score: 15,
            score: 14,
            judge_feedback: 'Very thorough data collection process',
          },
          {
            id: 4,
            name: 'Skill',
            description: 'Technical skill and execution',
            max_score: 15,
            score: 13,
            judge_feedback: 'Good technical skills demonstrated',
          },
          {
            id: 5,
            name: 'Clarity',
            description: 'Clear presentation and communication',
            max_score: 10,
            score: 9,
            judge_feedback: 'Very clear presentation materials',
          },
        ],
        total_score: 88,
        awards: [
          {
            id: 1,
            name: 'Second Place - Biology',
            category: 'Biology',
            awarded_date: '2024-03-15T00:00:00Z',
            description: 'Regional Science Fair',
          },
        ],
      },
      {
        id: 2,
        project_id: 2,
        fair_name: 'State Science Competition 2024',
        submission_date: '2024-01-15T00:00:00Z',
        presentation_date: '2024-04-20T00:00:00Z',
        status: 'accepted',
        judging_criteria: [
          {
            id: 6,
            name: 'Scientific Thought/Engineering Goals',
            description: 'Clear objectives, hypothesis, and experimental design',
            max_score: 30,
          },
          {
            id: 7,
            name: 'Creative Ability',
            description: 'Originality and innovation in approach',
            max_score: 30,
          },
          {
            id: 8,
            name: 'Thoroughness',
            description: 'Completeness of data collection and analysis',
            max_score: 15,
          },
          {
            id: 9,
            name: 'Skill',
            description: 'Technical skill and execution',
            max_score: 15,
          },
          {
            id: 10,
            name: 'Clarity',
            description: 'Clear presentation and communication',
            max_score: 10,
          },
        ],
        awards: [],
      },
      {
        id: 3,
        project_id: 3,
        fair_name: 'School Science Fair 2024',
        submission_date: '2024-02-20T00:00:00Z',
        status: 'submitted',
        judging_criteria: [],
        awards: [],
      },
    ];

    setSubmissions(mockSubmissions);
  };

  const loadProjects = async () => {
    const mockProjects: ResearchProject[] = [
      {
        id: 1,
        title: 'Effect of pH Levels on Plant Growth',
        abstract: 'Study on soil pH and plant growth',
        research_question: 'How does pH affect plants?',
        methodology: 'Controlled experiment',
        status: 'completed',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T15:30:00Z',
        team_lead_id: 1,
        team_lead_name: 'Sarah Johnson',
        team_members: [],
        milestones: [],
        progress_percentage: 100,
        category: 'Biology',
        tags: [],
        is_member: true,
        is_public: true,
        awards: [],
      },
    ];

    setProjects(mockProjects);
  };

  const handleSubmitProject = () => {
    console.log('Submitting:', newSubmission);
    setSubmitDialogOpen(false);
    setNewSubmission({ project_id: 0, fair_name: '', presentation_date: '' });
    loadSubmissions();
  };

  const handleViewDetails = (submission: ScienceFairSubmission) => {
    setSelectedSubmission(submission);
    setDetailDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Pending color="info" />;
      case 'accepted':
        return <CheckCircle color="success" />;
      case 'rejected':
        return <Cancel color="error" />;
      case 'judged':
        return <EmojiEvents color="warning" />;
      default:
        return <Pending />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'info';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'judged':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Science Fair Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Submit projects to science fairs, track judging, and view awards
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Upload color="primary" />
                <Typography color="text.secondary" variant="body2">
                  Total Submissions
                </Typography>
              </Box>
              <Typography variant="h4">{submissions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircle color="success" />
                <Typography color="text.secondary" variant="body2">
                  Accepted
                </Typography>
              </Box>
              <Typography variant="h4">
                {submissions.filter((s) => s.status === 'accepted' || s.status === 'judged').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmojiEvents color="warning" />
                <Typography color="text.secondary" variant="body2">
                  Awards Won
                </Typography>
              </Box>
              <Typography variant="h4">
                {submissions.reduce((sum, s) => sum + s.awards.length, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Assessment color="info" />
                <Typography color="text.secondary" variant="body2">
                  Avg Score
                </Typography>
              </Box>
              <Typography variant="h4">
                {submissions.filter((s) => s.total_score).length > 0
                  ? Math.round(
                      submissions
                        .filter((s) => s.total_score)
                        .reduce((sum, s) => sum + (s.total_score || 0), 0) /
                        submissions.filter((s) => s.total_score).length
                    )
                  : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label="My Submissions" />
            <Tab label="Submit Project" />
            <Tab label="Upcoming Fairs" />
          </Tabs>
          <Button variant="contained" startIcon={<Add />} onClick={() => setSubmitDialogOpen(true)}>
            New Submission
          </Button>
        </Box>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {submissions.map((submission) => (
            <Grid item xs={12} md={6} lg={4} key={submission.id}>
              <Card>
                <CardHeader
                  title={submission.fair_name}
                  subheader={`Submitted ${new Date(submission.submission_date).toLocaleDateString()}`}
                  action={
                    <Chip
                      icon={getStatusIcon(submission.status)}
                      label={submission.status.toUpperCase()}
                      color={
                        getStatusColor(submission.status) as
                          | 'default'
                          | 'primary'
                          | 'secondary'
                          | 'error'
                          | 'info'
                          | 'success'
                          | 'warning'
                      }
                      size="small"
                    />
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    {submission.presentation_date && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Presentation Date
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(submission.presentation_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}

                    {submission.booth_number && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Booth Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {submission.booth_number}
                        </Typography>
                      </Box>
                    )}

                    {submission.total_score !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Total Score
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h5" fontWeight={700} color="primary.main">
                            {submission.total_score}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            / 100
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={submission.total_score}
                          sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}

                    {submission.awards.length > 0 && (
                      <Box>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Awards:
                        </Typography>
                        <Stack spacing={0.5} mt={0.5}>
                          {submission.awards.map((award) => (
                            <Box key={award.id} display="flex" alignItems="center" gap={0.5}>
                              <EmojiEvents sx={{ fontSize: 16 }} color="warning" />
                              <Typography variant="body2">{award.name}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
                <Box p={2} pt={0}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(submission)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Submit a Project to Science Fair
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a completed research project to submit to an upcoming science fair
            </Typography>

            <Stack spacing={3} mt={3}>
              <FormControl fullWidth>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={newSubmission.project_id}
                  onChange={(e) =>
                    setNewSubmission({ ...newSubmission, project_id: e.target.value as number })
                  }
                >
                  {projects
                    .filter((p) => p.status === 'completed')
                    .map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Science Fair Name"
                value={newSubmission.fair_name}
                onChange={(e) => setNewSubmission({ ...newSubmission, fair_name: e.target.value })}
              />

              <TextField
                fullWidth
                type="date"
                label="Presentation Date"
                value={newSubmission.presentation_date}
                onChange={(e) =>
                  setNewSubmission({ ...newSubmission, presentation_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitProject}
                disabled={!newSubmission.project_id || !newSubmission.fair_name}
              >
                Submit Project
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Science Fairs
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="Regional Science Fair 2024"
                  secondary="Registration deadline: March 1, 2024"
                />
                <Button variant="outlined" size="small">
                  Learn More
                </Button>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="State Science Competition 2024"
                  secondary="Registration deadline: April 15, 2024"
                />
                <Button variant="outlined" size="small">
                  Learn More
                </Button>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="International Youth Science Symposium"
                  secondary="Registration deadline: May 30, 2024"
                />
                <Button variant="outlined" size="small">
                  Learn More
                </Button>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSubmission && (
          <>
            <DialogTitle>
              <Typography variant="h5" fontWeight={700}>
                {selectedSubmission.fair_name}
              </Typography>
              <Chip
                icon={getStatusIcon(selectedSubmission.status)}
                label={selectedSubmission.status.toUpperCase()}
                color={
                  getStatusColor(selectedSubmission.status) as
                    | 'default'
                    | 'primary'
                    | 'secondary'
                    | 'error'
                    | 'info'
                    | 'success'
                    | 'warning'
                }
                size="small"
                sx={{ mt: 1 }}
              />
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Submission Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Submitted
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(selectedSubmission.submission_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    {selectedSubmission.presentation_date && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Presentation
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(selectedSubmission.presentation_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                    {selectedSubmission.booth_number && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Booth Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedSubmission.booth_number}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {selectedSubmission.judging_criteria.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Judging Criteria & Scores
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Criterion</TableCell>
                            <TableCell align="center">Max</TableCell>
                            <TableCell align="center">Score</TableCell>
                            <TableCell>Feedback</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedSubmission.judging_criteria.map((criterion) => (
                            <TableRow key={criterion.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {criterion.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {criterion.description}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">{criterion.max_score}</TableCell>
                              <TableCell align="center">
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  color={criterion.score ? 'primary.main' : 'text.secondary'}
                                >
                                  {criterion.score || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {criterion.judge_feedback || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedSubmission.total_score !== undefined && (
                            <TableRow>
                              <TableCell colSpan={2}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  TOTAL SCORE
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="h6" fontWeight={700} color="primary.main">
                                  {selectedSubmission.total_score}
                                </Typography>
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {selectedSubmission.awards.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Awards & Recognition
                    </Typography>
                    <Stack spacing={1}>
                      {selectedSubmission.awards.map((award) => (
                        <Paper key={award.id} sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <EmojiEvents color="warning" />
                            <Typography variant="subtitle2" fontWeight={600}>
                              {award.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {award.description} •{' '}
                            {new Date(award.awarded_date).toLocaleDateString()}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button startIcon={<Download />}>Download Certificate</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Project to Science Fair</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={newSubmission.project_id}
                onChange={(e) =>
                  setNewSubmission({ ...newSubmission, project_id: e.target.value as number })
                }
              >
                {projects
                  .filter((p) => p.status === 'completed')
                  .map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Science Fair Name"
              value={newSubmission.fair_name}
              onChange={(e) => setNewSubmission({ ...newSubmission, fair_name: e.target.value })}
            />

            <TextField
              fullWidth
              type="date"
              label="Presentation Date (if known)"
              value={newSubmission.presentation_date}
              onChange={(e) =>
                setNewSubmission({ ...newSubmission, presentation_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitProject}
            disabled={!newSubmission.project_id || !newSubmission.fair_name}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
