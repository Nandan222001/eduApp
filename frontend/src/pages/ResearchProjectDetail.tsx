import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  People,
  Timeline,
  Assignment,
  Schedule,
  CheckCircle,
  PersonAdd,
  Settings,
} from '@mui/icons-material';
import { ResearchProject } from '@/types/research';
import { formatDistanceToNow } from 'date-fns';

export default function ResearchProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    const mockProject: ResearchProject = {
      id: 1,
      title: 'Effect of pH Levels on Plant Growth',
      abstract:
        'This study investigates how different pH levels in soil affect the growth rate and health of common garden plants. We will conduct controlled experiments with various pH treatments.',
      research_question:
        'How do varying soil pH levels impact plant growth rates and overall plant health?',
      methodology:
        'Controlled experiment with multiple plant groups (N=30 per group) exposed to different pH levels (4.0, 5.5, 6.5, 7.5, 9.0) over an 8-week period. Daily measurements of height, leaf count, and health indicators.',
      status: 'in_progress',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
      team_lead_id: 1,
      team_lead_name: 'Sarah Johnson',
      team_members: [
        {
          id: 1,
          user_id: 1,
          name: 'Sarah Johnson',
          role: 'Lead Researcher',
          joined_at: '2024-01-15T10:00:00Z',
          avatar: '',
        },
        {
          id: 2,
          user_id: 2,
          name: 'Mike Chen',
          role: 'Data Analyst',
          joined_at: '2024-01-15T10:30:00Z',
          avatar: '',
        },
        {
          id: 3,
          user_id: 3,
          name: 'Emma Davis',
          role: 'Research Assistant',
          joined_at: '2024-01-15T11:00:00Z',
          avatar: '',
        },
      ],
      milestones: [
        {
          id: 1,
          title: 'Literature Review',
          description: 'Complete comprehensive literature review of existing research',
          due_date: '2024-02-01T00:00:00Z',
          completed: true,
          completed_at: '2024-01-28T00:00:00Z',
          approved_by_advisor: true,
          order: 1,
        },
        {
          id: 2,
          title: 'Experiment Setup',
          description: 'Prepare all experimental materials, soil samples, and control groups',
          due_date: '2024-02-15T00:00:00Z',
          completed: true,
          approved_by_advisor: false,
          advisor_feedback: 'Please add more detail to the methodology section before proceeding',
          order: 2,
        },
        {
          id: 3,
          title: 'Data Collection Phase 1',
          description: 'Weeks 1-4 of data collection',
          due_date: '2024-03-15T00:00:00Z',
          completed: false,
          approved_by_advisor: false,
          order: 3,
        },
        {
          id: 4,
          title: 'Data Collection Phase 2',
          description: 'Weeks 5-8 of data collection',
          due_date: '2024-04-15T00:00:00Z',
          completed: false,
          approved_by_advisor: false,
          order: 4,
        },
        {
          id: 5,
          title: 'Data Analysis',
          description: 'Statistical analysis and interpretation of results',
          due_date: '2024-05-01T00:00:00Z',
          completed: false,
          approved_by_advisor: false,
          order: 5,
        },
        {
          id: 6,
          title: 'Final Report & Presentation',
          description: 'Complete research paper and presentation materials',
          due_date: '2024-05-15T00:00:00Z',
          completed: false,
          approved_by_advisor: false,
          order: 6,
        },
      ],
      progress_percentage: 35,
      category: 'Biology',
      tags: ['plants', 'soil', 'pH', 'growth', 'botany'],
      is_member: true,
      is_public: true,
      awards: [],
    };

    setProject(mockProject);
  };

  const handleInviteMember = () => {
    console.log('Inviting:', inviteEmail);
    setInviteDialogOpen(false);
    setInviteEmail('');
  };

  const handleOpenWorkspace = () => {
    navigate(`/research/workspace/${projectId}`);
  };

  if (!project) {
    return <Container>Loading...</Container>;
  }

  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const totalMilestones = project.milestones.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/research/projects')}
        sx={{ mb: 3 }}
      >
        Back to Projects
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box flex={1}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {project.title}
          </Typography>
          <Stack direction="row" spacing={1} mb={2}>
            <Chip label={project.status.replace('_', ' ')} color="primary" />
            <Chip label={project.category} variant="outlined" />
            {project.is_public && <Chip label="Public" variant="outlined" size="small" />}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })} • Last
            updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {project.is_member && (
            <>
              <Button variant="contained" startIcon={<Edit />} onClick={handleOpenWorkspace}>
                Open Workspace
              </Button>
              <IconButton>
                <Settings />
              </IconButton>
            </>
          )}
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Abstract
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.abstract}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Research Question
                </Typography>
                <Typography variant="body1" color="primary.main" fontStyle="italic">
                  {project.research_question}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Methodology
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {project.methodology}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Project Timeline
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {completedMilestones} of {totalMilestones} completed
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {project.milestones.map((milestone, index) => (
                    <Box key={milestone.id}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: milestone.completed ? 'success.lighter' : 'background.default',
                          border: milestone.completed ? '1px solid' : 'none',
                          borderColor: 'success.main',
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              {milestone.completed ? (
                                <CheckCircle color="success" fontSize="small" />
                              ) : (
                                <Schedule color="action" fontSize="small" />
                              )}
                              <Typography variant="subtitle1" fontWeight={600}>
                                {milestone.title}
                              </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                              {milestone.description}
                            </Typography>

                            <Stack direction="row" spacing={2} alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                              </Typography>
                              {milestone.completed && milestone.completed_at && (
                                <Typography variant="caption" color="success.main">
                                  Completed: {new Date(milestone.completed_at).toLocaleDateString()}
                                </Typography>
                              )}
                              {milestone.approved_by_advisor && (
                                <Chip label="Advisor Approved" size="small" color="info" />
                              )}
                            </Stack>

                            {milestone.advisor_feedback && (
                              <Paper sx={{ p: 1.5, mt: 1, bgcolor: 'info.lighter' }}>
                                <Typography variant="caption" fontWeight={600} display="block">
                                  Advisor Feedback:
                                </Typography>
                                <Typography variant="body2">
                                  {milestone.advisor_feedback}
                                </Typography>
                              </Paper>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                      {index < project.milestones.length - 1 && (
                        <Box
                          sx={{
                            width: 2,
                            height: 20,
                            bgcolor: milestone.completed ? 'success.main' : 'divider',
                            ml: 2,
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Tags
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {project.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Progress Tracker
                </Typography>
                <Box textAlign="center" mb={2}>
                  <Typography variant="h2" fontWeight={700} color="primary.main">
                    {project.progress_percentage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress_percentage}
                    sx={{ height: 10, borderRadius: 5, mt: 2 }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Milestones</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {completedMilestones}/{totalMilestones}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Team Members</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {project.team_members.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Team Roster
                  </Typography>
                  {project.is_member && (
                    <IconButton size="small" onClick={() => setInviteDialogOpen(true)}>
                      <PersonAdd />
                    </IconButton>
                  )}
                </Box>

                <List>
                  {project.team_members.map((member) => (
                    <ListItem key={member.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={member.avatar}>{member.name[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.name}
                        secondary={member.role}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>

                {!project.is_member && (
                  <Button variant="outlined" fullWidth startIcon={<PersonAdd />}>
                    Request to Join
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Project Details
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {project.category}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Started
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(project.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Team Lead
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {project.team_lead_name}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="student@example.com"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInviteMember} disabled={!inviteEmail}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
