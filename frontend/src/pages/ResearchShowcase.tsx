import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
  Divider,
  Paper,
  IconButton,
  Rating,
} from '@mui/material';
import {
  Search,
  EmojiEvents,
  Visibility,
  Share,
  ThumbUp,
  PlayCircle,
  PictureAsPdf,
  Close,
} from '@mui/icons-material';
import { ResearchProject, PeerReview } from '@/types/research';

export default function ResearchShowcase() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    strengths: '',
    improvements: '',
    overall_feedback: '',
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

  const years = ['2024', '2023', '2022', '2021'];

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, yearFilter, searchQuery]);

  const loadProjects = async () => {
    const mockProjects: ResearchProject[] = [
      {
        id: 1,
        title: 'Renewable Energy Solutions for Schools',
        abstract:
          'This research explores cost-effective renewable energy implementations for educational institutions, focusing on solar panel systems and their return on investment.',
        research_question:
          'What are the most cost-effective renewable energy solutions for schools?',
        methodology: 'Comparative analysis and feasibility study across 10 schools',
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
          {
            id: 6,
            user_id: 6,
            name: 'Tom Garcia',
            role: 'Data Analyst',
            joined_at: '2023-09-01T11:00:00Z',
          },
        ],
        milestones: [],
        progress_percentage: 100,
        category: 'Engineering',
        tags: ['renewable energy', 'solar', 'sustainability', 'cost-analysis'],
        is_member: false,
        is_public: true,
        submission_date: '2024-01-10T00:00:00Z',
        presentation_url: 'https://example.com/presentation.pdf',
        findings_summary:
          'Solar panels provide the best ROI for schools in sunny climates, with an average payback period of 7-9 years. Energy savings of 40-60% were observed across all test sites.',
        awards: [
          {
            id: 1,
            name: 'Best Engineering Project',
            category: 'Engineering',
            awarded_date: '2024-01-15T00:00:00Z',
            description: 'Regional Science Fair',
          },
          {
            id: 2,
            name: 'Innovation Award',
            category: 'Innovation',
            awarded_date: '2024-01-20T00:00:00Z',
            description: 'State Competition',
          },
        ],
      },
      {
        id: 2,
        title: 'Impact of Microplastics on Aquatic Ecosystems',
        abstract:
          'A comprehensive study examining the effects of microplastic pollution on freshwater fish populations and aquatic plant life.',
        research_question:
          'How do microplastics affect the health and behavior of freshwater organisms?',
        methodology: 'Controlled laboratory experiments and field observations over 6 months',
        status: 'completed',
        created_at: '2023-08-15T10:00:00Z',
        updated_at: '2023-12-20T15:30:00Z',
        team_lead_id: 7,
        team_lead_name: 'Emily Rodriguez',
        team_members: [
          {
            id: 7,
            user_id: 7,
            name: 'Emily Rodriguez',
            role: 'Lead Researcher',
            joined_at: '2023-08-15T10:00:00Z',
          },
          {
            id: 8,
            user_id: 8,
            name: 'David Kim',
            role: 'Field Researcher',
            joined_at: '2023-08-15T10:30:00Z',
          },
        ],
        milestones: [],
        progress_percentage: 100,
        category: 'Environmental Science',
        tags: ['microplastics', 'pollution', 'aquatic life', 'ecology'],
        is_member: false,
        is_public: true,
        submission_date: '2023-12-20T00:00:00Z',
        presentation_url: 'https://example.com/presentation2.pdf',
        findings_summary:
          'Microplastic concentrations above 50 particles/L showed significant negative impacts on fish feeding behavior and plant growth rates. Recommendations for water quality standards developed.',
        awards: [
          {
            id: 3,
            name: 'Environmental Stewardship Award',
            category: 'Environmental Science',
            awarded_date: '2024-01-05T00:00:00Z',
            description: 'National Youth Science Competition',
          },
        ],
      },
      {
        id: 3,
        title: 'AI-Powered Study Assistant for Students with Learning Disabilities',
        abstract:
          'Development of a machine learning application that adapts study materials to individual learning needs and preferences.',
        research_question:
          'Can AI personalization improve learning outcomes for students with disabilities?',
        methodology:
          'User testing with 50 students over 3 months, comparing traditional vs AI-assisted learning',
        status: 'completed',
        created_at: '2023-10-01T10:00:00Z',
        updated_at: '2024-02-01T15:30:00Z',
        team_lead_id: 9,
        team_lead_name: 'Alex Thompson',
        team_members: [
          {
            id: 9,
            user_id: 9,
            name: 'Alex Thompson',
            role: 'Lead Developer',
            joined_at: '2023-10-01T10:00:00Z',
          },
          {
            id: 10,
            user_id: 10,
            name: 'Maria Santos',
            role: 'UI/UX Designer',
            joined_at: '2023-10-01T10:30:00Z',
          },
          {
            id: 11,
            user_id: 11,
            name: 'Chris Lee',
            role: 'ML Engineer',
            joined_at: '2023-10-01T11:00:00Z',
          },
        ],
        milestones: [],
        progress_percentage: 100,
        category: 'Computer Science',
        tags: ['AI', 'machine learning', 'accessibility', 'education'],
        is_member: false,
        is_public: true,
        submission_date: '2024-02-01T00:00:00Z',
        presentation_url: 'https://example.com/presentation3.pdf',
        findings_summary:
          'Students using the AI assistant showed 35% improvement in comprehension and 28% increase in engagement. The system successfully adapted to various learning disabilities including dyslexia and ADHD.',
        awards: [
          {
            id: 4,
            name: 'Best Computer Science Project',
            category: 'Computer Science',
            awarded_date: '2024-02-10T00:00:00Z',
            description: 'Tech for Good Summit',
          },
          {
            id: 5,
            name: "People's Choice Award",
            category: 'General',
            awarded_date: '2024-02-15T00:00:00Z',
            description: 'School Science Fair',
          },
        ],
      },
    ];

    let filtered = mockProjects.filter((p) => p.status === 'completed');

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(
        (p) => new Date(p.submission_date || '').getFullYear().toString() === yearFilter
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.findings_summary?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setProjects(filtered);
  };

  const handleViewDetails = (project: ResearchProject) => {
    setSelectedProject(project);
    setDetailDialogOpen(true);
    loadReviews(project.id);
  };

  const loadReviews = async (projectId: number) => {
    const mockReviews: PeerReview[] = [
      {
        id: 1,
        project_id: projectId,
        reviewer_id: 100,
        reviewer_name: 'Sarah Mitchell',
        rating: 5,
        strengths:
          'Excellent methodology and clear presentation of findings. The data analysis was thorough.',
        improvements:
          'Could expand on the limitations section and discuss potential future research directions.',
        overall_feedback:
          'Outstanding research project with practical applications. Well deserving of the awards received.',
        created_at: '2024-01-25T10:00:00Z',
      },
      {
        id: 2,
        project_id: projectId,
        reviewer_id: 101,
        reviewer_name: 'Dr. Robert Chen',
        rating: 4,
        strengths: 'Strong theoretical foundation and good use of primary sources.',
        improvements:
          'Some sections could benefit from more detailed explanations, particularly the experimental setup.',
        overall_feedback:
          'Very good work overall. The research question was well-defined and adequately addressed.',
        created_at: '2024-01-26T14:30:00Z',
      },
    ];

    setReviews(mockReviews);
  };

  const handleSubmitReview = () => {
    if (!selectedProject) return;

    const review: PeerReview = {
      id: Date.now(),
      project_id: selectedProject.id,
      reviewer_id: 1,
      reviewer_name: 'Current User',
      rating: newReview.rating,
      strengths: newReview.strengths,
      improvements: newReview.improvements,
      overall_feedback: newReview.overall_feedback,
      created_at: new Date().toISOString(),
    };

    setReviews([...reviews, review]);
    setReviewDialogOpen(false);
    setNewReview({ rating: 0, strengths: '', improvements: '', overall_feedback: '' });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Research Showcase
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore completed research projects, findings, and award-winning work
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmojiEvents color="warning" />
                <Typography color="text.secondary" variant="body2">
                  Total Projects
                </Typography>
              </Box>
              <Typography variant="h4">{projects.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmojiEvents color="primary" />
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

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Visibility color="info" />
                <Typography color="text.secondary" variant="body2">
                  Total Views
                </Typography>
              </Box>
              <Typography variant="h4">1,234</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ThumbUp color="success" />
                <Typography color="text.secondary" variant="body2">
                  Peer Reviews
                </Typography>
              </Box>
              <Typography variant="h4">87</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <MenuItem value="all">All Years</MenuItem>
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': { boxShadow: 6 },
                transition: 'box-shadow 0.3s',
              }}
            >
              {project.awards.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                  }}
                >
                  <Chip
                    icon={<EmojiEvents />}
                    label={`${project.awards.length} Awards`}
                    color="warning"
                    size="small"
                  />
                </Box>
              )}

              <CardMedia
                component="div"
                sx={{
                  height: 200,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" color="white" fontWeight={700}>
                  {project.title
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')}
                </Typography>
              </CardMedia>

              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Chip label={project.category} size="small" color="primary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(project.submission_date || '').getFullYear()}
                  </Typography>
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
                  {project.findings_summary || project.abstract}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      Team:
                    </Typography>
                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                      {project.team_members.map((member) => (
                        <Avatar key={member.id} src={member.avatar} sx={{ width: 24, height: 24 }}>
                          {member.name[0]}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Box>
                </Box>

                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>

                {project.awards.length > 0 && (
                  <Box mt={2}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Awards:
                    </Typography>
                    <Stack spacing={0.5} mt={0.5}>
                      {project.awards.map((award) => (
                        <Box key={award.id} display="flex" alignItems="center" gap={0.5}>
                          <EmojiEvents sx={{ fontSize: 16 }} color="warning" />
                          <Typography variant="caption">{award.name}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => handleViewDetails(project)}
                >
                  View Details
                </Button>
                <IconButton size="small">
                  <Share />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projects.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No completed projects found
          </Typography>
          <Typography color="text.secondary">Try adjusting your search filters</Typography>
        </Box>
      )}

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {selectedProject.title}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={selectedProject.category} size="small" color="primary" />
                    {selectedProject.awards.map((award) => (
                      <Chip
                        key={award.id}
                        icon={<EmojiEvents />}
                        label={award.name}
                        size="small"
                        color="warning"
                      />
                    ))}
                  </Stack>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Research Question
                  </Typography>
                  <Typography variant="body1">{selectedProject.research_question}</Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Abstract
                  </Typography>
                  <Typography variant="body2">{selectedProject.abstract}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Methodology
                  </Typography>
                  <Typography variant="body2">{selectedProject.methodology}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Key Findings
                  </Typography>
                  <Typography variant="body2">{selectedProject.findings_summary}</Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Research Team
                  </Typography>
                  <Stack spacing={1} mt={1}>
                    {selectedProject.team_members.map((member) => (
                      <Box key={member.id} display="flex" alignItems="center" gap={1}>
                        <Avatar src={member.avatar} sx={{ width: 32, height: 32 }}>
                          {member.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {member.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.role}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {selectedProject.awards.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Awards & Recognition
                    </Typography>
                    <Stack spacing={1} mt={1}>
                      {selectedProject.awards.map((award) => (
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

                <Divider />

                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Peer Reviews ({reviews.length})
                    </Typography>
                    <Button size="small" onClick={() => setReviewDialogOpen(true)}>
                      Write Review
                    </Button>
                  </Box>

                  <Stack spacing={2}>
                    {reviews.map((review) => (
                      <Paper key={review.id} sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={1}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar src={review.reviewer_avatar} sx={{ width: 32, height: 32 }}>
                              {review.reviewer_name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{review.reviewer_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(review.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Rating value={review.rating} readOnly size="small" />
                        </Box>

                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="success.main"
                          gutterBottom
                        >
                          Strengths:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {review.strengths}
                        </Typography>

                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="warning.main"
                          gutterBottom
                        >
                          Areas for Improvement:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {review.improvements}
                        </Typography>

                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Overall Feedback:
                        </Typography>
                        <Typography variant="body2">{review.overall_feedback}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              {selectedProject.presentation_url && (
                <>
                  <Button startIcon={<PlayCircle />}>View Presentation</Button>
                  <Button startIcon={<PictureAsPdf />}>Download PDF</Button>
                </>
              )}
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Write Peer Review</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Overall Rating
              </Typography>
              <Rating
                value={newReview.rating}
                onChange={(_, value) => setNewReview({ ...newReview, rating: value || 0 })}
                size="large"
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Strengths"
              value={newReview.strengths}
              onChange={(e) => setNewReview({ ...newReview, strengths: e.target.value })}
              placeholder="What aspects of this research were particularly strong?"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Areas for Improvement"
              value={newReview.improvements}
              onChange={(e) => setNewReview({ ...newReview, improvements: e.target.value })}
              placeholder="What could be improved or expanded upon?"
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Overall Feedback"
              value={newReview.overall_feedback}
              onChange={(e) => setNewReview({ ...newReview, overall_feedback: e.target.value })}
              placeholder="Provide your overall assessment and constructive feedback"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={newReview.rating === 0 || !newReview.overall_feedback}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
