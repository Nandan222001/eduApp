import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  Search,
  Add,
  Science,
  People,
  TrendingUp,
  EmojiEvents,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { ResearchProject } from '@/types/research';
import { useNavigate } from 'react-router-dom';

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

export default function ResearchProjectHub() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    abstract: '',
    research_question: '',
    category: '',
  });

  const categories = [
    'Biology',
    'Chemistry',
    'Physics',
    'Environmental Science',
    'Computer Science',
    'Engineering',
    'Social Science',
    'Mathematics',
    'Other',
  ];

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, categoryFilter, statusFilter]);

  const loadProjects = async () => {
    const mockProjects: ResearchProject[] = [
      {
        id: 1,
        title: 'Effect of pH Levels on Plant Growth',
        abstract:
          'This study investigates how different pH levels in soil affect the growth rate and health of common garden plants.',
        research_question: 'How do varying soil pH levels impact plant growth rates?',
        methodology: 'Controlled experiment with multiple plant groups and pH treatments',
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
          },
          {
            id: 2,
            user_id: 2,
            name: 'Mike Chen',
            role: 'Data Analyst',
            joined_at: '2024-01-15T10:30:00Z',
          },
          {
            id: 3,
            user_id: 3,
            name: 'Emma Davis',
            role: 'Research Assistant',
            joined_at: '2024-01-15T11:00:00Z',
          },
        ],
        milestones: [],
        progress_percentage: 65,
        category: 'Biology',
        tags: ['plants', 'soil', 'pH', 'growth'],
        is_member: true,
        is_public: true,
        awards: [],
      },
      {
        id: 2,
        title: 'Renewable Energy Solutions for Schools',
        abstract:
          'Exploring cost-effective renewable energy implementations for educational institutions.',
        research_question:
          'What are the most cost-effective renewable energy solutions for schools?',
        methodology: 'Comparative analysis and feasibility study',
        status: 'completed',
        created_at: '2023-09-01T10:00:00Z',
        updated_at: '2024-01-10T15:30:00Z',
        team_lead_id: 4,
        team_lead_name: 'James Wilson',
        team_members: [
          {
            id: 4,
            user_id: 4,
            name: 'James Wilson',
            role: 'Lead Researcher',
            joined_at: '2023-09-01T10:00:00Z',
          },
          {
            id: 5,
            user_id: 5,
            name: 'Lisa Brown',
            role: 'Engineering Lead',
            joined_at: '2023-09-01T10:30:00Z',
          },
        ],
        milestones: [],
        progress_percentage: 100,
        category: 'Engineering',
        tags: ['renewable energy', 'solar', 'sustainability'],
        is_member: false,
        is_public: true,
        submission_date: '2024-01-10T00:00:00Z',
        presentation_url: 'https://example.com/presentation.pdf',
        findings_summary: 'Solar panels provide the best ROI for schools in sunny climates.',
        awards: [
          {
            id: 1,
            name: 'Best Engineering Project',
            category: 'Engineering',
            awarded_date: '2024-01-15T00:00:00Z',
          },
        ],
      },
    ];

    let filtered = mockProjects;

    if (tabValue === 1) {
      filtered = filtered.filter((p) => p.is_member);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.abstract.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setProjects(filtered);
  };

  const handleCreateProject = () => {
    console.log('Creating project:', newProject);
    setCreateDialogOpen(false);
    setNewProject({ title: '', abstract: '', research_question: '', category: '' });
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/research/projects/${projectId}`);
  };

  const handleJoinWorkspace = (projectId: number) => {
    navigate(`/research/workspace/${projectId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'submitted':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Research Project Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Collaborate on research projects, track progress, and showcase your findings
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Science color="primary" />
                <Typography color="text.secondary" variant="body2">
                  Active Projects
                </Typography>
              </Box>
              <Typography variant="h4">
                {projects.filter((p) => p.status === 'in_progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <People color="success" />
                <Typography color="text.secondary" variant="body2">
                  My Projects
                </Typography>
              </Box>
              <Typography variant="h4">{projects.filter((p) => p.is_member).length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="info" />
                <Typography color="text.secondary" variant="body2">
                  Completed
                </Typography>
              </Box>
              <Typography variant="h4">
                {projects.filter((p) => p.status === 'completed').length}
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
                {projects.reduce((sum, p) => sum + p.awards.length, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
          <Tab label="All Projects" />
          <Tab label="My Projects" />
          <Tab label="Featured" />
        </Tabs>
      </Paper>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="planning">Planning</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          New Project
        </Button>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.3s',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip
                      label={project.status.replace('_', ' ')}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                    <Chip label={project.category} size="small" variant="outlined" />
                  </Box>

                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {project.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2,
                    }}
                  >
                    {project.abstract}
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress_percentage}
                      sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {project.progress_percentage}% complete
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        Team:
                      </Typography>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                        {project.team_members.map((member) => (
                          <Avatar
                            key={member.id}
                            src={member.avatar}
                            sx={{ width: 24, height: 24 }}
                          >
                            {member.name[0]}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    </Box>

                    {project.awards.length > 0 && (
                      <Chip
                        icon={<EmojiEvents />}
                        label={project.awards.length}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>

                  <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={2}>
                    {project.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewProject(project.id)}
                  >
                    View Details
                  </Button>
                  {project.is_member && (
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleJoinWorkspace(project.id)}
                    >
                      Workspace
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {projects
            .filter((p) => p.is_member)
            .map((project) => (
              <Grid item xs={12} md={6} lg={4} key={project.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.abstract.substring(0, 100)}...
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleJoinWorkspace(project.id)}>
                      Open Workspace
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1" color="text.secondary">
          Featured projects will be displayed here
        </Typography>
      </TabPanel>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Research Project</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Project Title"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              placeholder="Enter a descriptive title for your research project"
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Abstract"
              value={newProject.abstract}
              onChange={(e) => setNewProject({ ...newProject, abstract: e.target.value })}
              placeholder="Provide a brief summary of your research project"
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Research Question"
              value={newProject.research_question}
              onChange={(e) => setNewProject({ ...newProject, research_question: e.target.value })}
              placeholder="What is the main question you are trying to answer?"
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateProject}
            disabled={!newProject.title || !newProject.abstract || !newProject.category}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
