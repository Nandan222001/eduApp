import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Paper,
  IconButton,
  Divider,
  Rating,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  Alert,
  Badge,
  useTheme,
  alpha,
  CardActions,
} from '@mui/material';
import {
  Work as WorkIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  PlayCircle as PlayCircleIcon,
  Quiz as QuizIcon,
  WorkOutline as InternshipIcon,
  People as MentorshipIcon,
  Folder as PortfolioIcon,
  Business as CompanyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  LocationOn as LocationIcon,
  AttachMoney as SalaryIcon,
  CalendarToday as CalendarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Article as ArticleIcon,
  Link as LinkIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Videocam as VideoIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`career-tabpanel-${index}`}
      aria-labelledby={`career-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface CareerPath {
  id: number;
  title: string;
  industry: string;
  description: string;
  averageSalary: string;
  growthRate: string;
  education: string;
  skills: string[];
  videoUrl?: string;
  dayInLifeStory?: string;
  saved: boolean;
}

interface SkillAssessmentQuestion {
  id: number;
  question: string;
  options: { value: string; label: string; category: string }[];
}

interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'virtual' | 'in-person' | 'hybrid';
  duration: string;
  stipend: string;
  deadline: string;
  skills: string[];
  applicationStatus?: 'not_applied' | 'applied' | 'shortlisted' | 'accepted' | 'rejected';
  companyLogo?: string;
}

interface Mentor {
  id: number;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  experience: number;
  availability: string;
  rating: number;
  matchScore: number;
  avatar?: string;
}

interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  date: string;
  link?: string;
  attachments?: string[];
}

interface Partnership {
  id: number;
  companyName: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  opportunitiesOffered: string[];
  status: 'active' | 'pending' | 'inactive';
  since: string;
}

export default function CareerExploration() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showInternshipDialog, setShowInternshipDialog] = useState(false);
  const [showMentorDialog, setShowMentorDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showPartnershipDialog, setShowPartnershipDialog] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  const careerPaths: CareerPath[] = [
    {
      id: 1,
      title: 'Software Engineer',
      industry: 'Technology',
      description: 'Design, develop, and maintain software applications and systems.',
      averageSalary: '$95,000 - $150,000',
      growthRate: '22%',
      education: "Bachelor's in Computer Science or related field",
      skills: ['Programming', 'Problem Solving', 'Algorithms', 'Data Structures', 'Teamwork'],
      videoUrl: 'https://example.com/video1',
      dayInLifeStory:
        'Start the day with team standup, review code, develop new features, collaborate with designers, and mentor junior developers.',
      saved: false,
    },
    {
      id: 2,
      title: 'Data Scientist',
      industry: 'Technology',
      description: 'Analyze complex data to help companies make better decisions.',
      averageSalary: '$100,000 - $160,000',
      growthRate: '31%',
      education: "Master's in Data Science, Statistics, or Computer Science",
      skills: ['Python', 'Machine Learning', 'Statistics', 'Data Visualization', 'SQL'],
      videoUrl: 'https://example.com/video2',
      dayInLifeStory:
        'Analyze datasets, build predictive models, present insights to stakeholders, and collaborate with engineering teams.',
      saved: true,
    },
    {
      id: 3,
      title: 'UX Designer',
      industry: 'Design',
      description: 'Create intuitive and engaging user experiences for digital products.',
      averageSalary: '$75,000 - $120,000',
      growthRate: '13%',
      education: "Bachelor's in Design, HCI, or related field",
      skills: ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'Empathy'],
      videoUrl: 'https://example.com/video3',
      dayInLifeStory:
        'Conduct user research, create wireframes and prototypes, collaborate with developers, and iterate based on feedback.',
      saved: false,
    },
    {
      id: 4,
      title: 'Marketing Manager',
      industry: 'Business',
      description: 'Develop and execute marketing strategies to promote products and services.',
      averageSalary: '$70,000 - $130,000',
      growthRate: '10%',
      education: "Bachelor's in Marketing, Business, or Communications",
      skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Communication'],
      saved: false,
    },
    {
      id: 5,
      title: 'Environmental Engineer',
      industry: 'Engineering',
      description: 'Develop solutions to environmental problems and sustainability challenges.',
      averageSalary: '$70,000 - $110,000',
      growthRate: '8%',
      education: "Bachelor's in Environmental Engineering",
      skills: ['Environmental Science', 'Project Management', 'CAD', 'Regulations', 'Analysis'],
      saved: false,
    },
    {
      id: 6,
      title: 'Financial Analyst',
      industry: 'Finance',
      description: 'Analyze financial data to guide business investment decisions.',
      averageSalary: '$65,000 - $110,000',
      growthRate: '6%',
      education: "Bachelor's in Finance, Accounting, or Economics",
      skills: ['Financial Modeling', 'Excel', 'Accounting', 'Forecasting', 'Communication'],
      saved: true,
    },
  ];

  const assessmentQuestions: SkillAssessmentQuestion[] = [
    {
      id: 1,
      question: 'Which activity do you enjoy the most?',
      options: [
        { value: 'solving_puzzles', label: 'Solving puzzles and logic problems', category: 'tech' },
        { value: 'creating_art', label: 'Creating art and designs', category: 'design' },
        { value: 'helping_people', label: 'Helping and teaching people', category: 'education' },
        {
          value: 'analyzing_data',
          label: 'Analyzing data and finding patterns',
          category: 'analytics',
        },
      ],
    },
    {
      id: 2,
      question: 'What type of work environment do you prefer?',
      options: [
        { value: 'collaborative', label: 'Collaborative team environment', category: 'team' },
        {
          value: 'independent',
          label: 'Independent with minimal supervision',
          category: 'independent',
        },
        { value: 'structured', label: 'Structured with clear guidelines', category: 'structured' },
        { value: 'dynamic', label: 'Dynamic and fast-paced', category: 'dynamic' },
      ],
    },
    {
      id: 3,
      question: 'Which skill would you like to develop further?',
      options: [
        { value: 'technical', label: 'Technical and programming skills', category: 'tech' },
        { value: 'creative', label: 'Creative and design skills', category: 'design' },
        { value: 'leadership', label: 'Leadership and management', category: 'business' },
        { value: 'analytical', label: 'Analytical and research skills', category: 'analytics' },
      ],
    },
    {
      id: 4,
      question: 'What motivates you most in a career?',
      options: [
        { value: 'impact', label: 'Making a positive impact', category: 'purpose' },
        { value: 'innovation', label: 'Innovation and creativity', category: 'innovation' },
        { value: 'stability', label: 'Job security and stability', category: 'stability' },
        { value: 'growth', label: 'Career growth and advancement', category: 'growth' },
      ],
    },
  ];

  const internships: Internship[] = [
    {
      id: 1,
      title: 'Frontend Developer Intern',
      company: 'TechCorp',
      location: 'Remote',
      type: 'virtual',
      duration: '3 months',
      stipend: '$1,500/month',
      deadline: '2024-02-28',
      skills: ['React', 'JavaScript', 'CSS', 'Git'],
      applicationStatus: 'not_applied',
      companyLogo: 'https://via.placeholder.com/50',
    },
    {
      id: 2,
      title: 'Data Analytics Intern',
      company: 'DataWorks Inc',
      location: 'New York, NY',
      type: 'hybrid',
      duration: '6 months',
      stipend: '$2,000/month',
      deadline: '2024-03-15',
      skills: ['Python', 'SQL', 'Tableau', 'Statistics'],
      applicationStatus: 'applied',
      companyLogo: 'https://via.placeholder.com/50',
    },
    {
      id: 3,
      title: 'UX Design Intern',
      company: 'Design Studio',
      location: 'San Francisco, CA',
      type: 'in-person',
      duration: '4 months',
      stipend: '$1,800/month',
      deadline: '2024-03-01',
      skills: ['Figma', 'User Research', 'Prototyping', 'Adobe XD'],
      applicationStatus: 'shortlisted',
      companyLogo: 'https://via.placeholder.com/50',
    },
    {
      id: 4,
      title: 'Marketing Analytics Intern',
      company: 'GrowthHub',
      location: 'Remote',
      type: 'virtual',
      duration: '3 months',
      stipend: '$1,200/month',
      deadline: '2024-02-20',
      skills: ['Google Analytics', 'SEO', 'Content Marketing', 'Excel'],
      applicationStatus: 'not_applied',
      companyLogo: 'https://via.placeholder.com/50',
    },
  ];

  const mentors: Mentor[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'Senior Software Engineer',
      company: 'Google',
      expertise: ['Web Development', 'Career Guidance', 'Technical Interviews'],
      experience: 8,
      availability: 'Weekends',
      rating: 4.8,
      matchScore: 95,
      avatar: 'https://via.placeholder.com/100',
    },
    {
      id: 2,
      name: 'Michael Chen',
      title: 'Data Science Lead',
      company: 'Amazon',
      expertise: ['Machine Learning', 'Data Engineering', 'Python'],
      experience: 10,
      availability: 'Evenings',
      rating: 4.9,
      matchScore: 88,
      avatar: 'https://via.placeholder.com/100',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      title: 'Principal UX Designer',
      company: 'Adobe',
      expertise: ['User Research', 'Design Systems', 'Portfolio Review'],
      experience: 12,
      availability: 'Flexible',
      rating: 5.0,
      matchScore: 92,
      avatar: 'https://via.placeholder.com/100',
    },
    {
      id: 4,
      name: 'David Kim',
      title: 'Marketing Director',
      company: 'HubSpot',
      expertise: ['Digital Marketing', 'Brand Strategy', 'Growth Hacking'],
      experience: 9,
      availability: 'Weekdays',
      rating: 4.7,
      matchScore: 85,
      avatar: 'https://via.placeholder.com/100',
    },
  ];

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([
    {
      id: 1,
      title: 'E-commerce Website',
      description: 'Full-stack e-commerce platform with React and Node.js',
      category: 'Web Development',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
      date: '2024-01-15',
      link: 'https://github.com/example/ecommerce',
    },
    {
      id: 2,
      title: 'Machine Learning Model',
      description: 'Predictive model for customer churn analysis',
      category: 'Data Science',
      technologies: ['Python', 'TensorFlow', 'Pandas', 'Scikit-learn'],
      date: '2023-12-10',
      link: 'https://github.com/example/ml-project',
    },
  ]);

  const [partnerships] = useState<Partnership[]>([
    {
      id: 1,
      companyName: 'Tech Innovators Inc.',
      industry: 'Technology',
      contactPerson: 'John Smith',
      email: 'john.smith@techinnovators.com',
      phone: '+1-555-0123',
      opportunitiesOffered: ['Internships', 'Mentorship', 'Guest Lectures'],
      status: 'active',
      since: '2023-06-01',
    },
    {
      id: 2,
      companyName: 'Green Solutions Ltd.',
      industry: 'Environmental',
      contactPerson: 'Maria Garcia',
      email: 'maria@greensolutions.com',
      phone: '+1-555-0456',
      opportunitiesOffered: ['Internships', 'Research Projects'],
      status: 'active',
      since: '2023-09-15',
    },
    {
      id: 3,
      companyName: 'Finance Corp',
      industry: 'Finance',
      contactPerson: 'Robert Lee',
      email: 'robert.lee@financecorp.com',
      phone: '+1-555-0789',
      opportunitiesOffered: ['Job Shadowing', 'Workshops'],
      status: 'pending',
      since: '2024-01-10',
    },
  ]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleIndustryFilterChange = (event: SelectChangeEvent<string>) => {
    setIndustryFilter(event.target.value);
  };

  const handleSaveCareer = (careerId: number) => {
    // Toggle saved status
    console.log('Toggle save for career:', careerId);
  };

  const handleStartAssessment = () => {
    setShowAssessmentDialog(true);
    setAssessmentStep(0);
  };

  const handleAssessmentAnswer = (_questionId: number, _answer: string) => {
    if (assessmentStep < assessmentQuestions.length - 1) {
      setAssessmentStep((prev) => prev + 1);
    } else {
      setShowAssessmentDialog(false);
      setShowResultsDialog(true);
    }
  };

  const handleApplyInternship = (internshipId: number) => {
    console.log('Apply to internship:', internshipId);
    setShowInternshipDialog(false);
  };

  const handleRequestMentor = (mentorId: number) => {
    console.log('Request mentor:', mentorId);
    setShowMentorDialog(false);
  };

  const handleAddProject = () => {
    setShowProjectDialog(true);
  };

  const handleSaveProject = () => {
    setShowProjectDialog(false);
  };

  const handleDeleteProject = (projectId: number) => {
    setPortfolioProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleAddPartnership = () => {
    setShowPartnershipDialog(true);
  };

  const handleSavePartnership = () => {
    setShowPartnershipDialog(false);
  };

  const filteredCareers = careerPaths.filter((career) => {
    const matchesSearch =
      career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || career.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const industries = Array.from(new Set(careerPaths.map((c) => c.industry)));

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined => {
    switch (status) {
      case 'not_applied':
        return 'default';
      case 'applied':
        return 'info';
      case 'shortlisted':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_applied':
        return 'Not Applied';
      case 'applied':
        return 'Applied';
      case 'shortlisted':
        return 'Shortlisted';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Career Exploration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover your future career path, connect with industry professionals, and build your
          professional portfolio
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<WorkIcon />} label="Career Discovery" iconPosition="start" />
        <Tab icon={<QuizIcon />} label="Skills Assessment" iconPosition="start" />
        <Tab icon={<InternshipIcon />} label="Internship Marketplace" iconPosition="start" />
        <Tab icon={<MentorshipIcon />} label="Mentorship Program" iconPosition="start" />
        <Tab icon={<PortfolioIcon />} label="Portfolio Builder" iconPosition="start" />
        <Tab icon={<AssessmentIcon />} label="Application Tracking" iconPosition="start" />
        <Tab icon={<CompanyIcon />} label="Partnership Management" iconPosition="start" />
      </Tabs>

      {/* Career Discovery Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search careers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={industryFilter}
                  onChange={handleIndustryFilterChange}
                  label="Industry"
                >
                  <MenuItem value="all">All Industries</MenuItem>
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" startIcon={<FilterListIcon />}>
                More Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {filteredCareers.map((career) => (
            <Grid item xs={12} md={6} lg={4} key={career.id}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <WorkIcon />
                    </Avatar>
                  }
                  action={
                    <IconButton onClick={() => handleSaveCareer(career.id)}>
                      {career.saved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
                    </IconButton>
                  }
                  title={career.title}
                  subheader={career.industry}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {career.description}
                  </Typography>

                  <Box sx={{ my: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SalaryIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>Salary:</strong> {career.averageSalary}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 18, mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">
                        <strong>Growth:</strong> {career.growthRate}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SchoolIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>Education:</strong> {career.education}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Required Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {career.skills.slice(0, 4).map((skill) => (
                        <Chip key={skill} label={skill} size="small" />
                      ))}
                      {career.skills.length > 4 && (
                        <Chip
                          label={`+${career.skills.length - 4}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PlayCircleIcon />}
                    onClick={() => setSelectedCareer(career)}
                  >
                    Watch Video
                  </Button>
                  <Button size="small" startIcon={<InfoIcon />}>
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Skills Assessment Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader
                title="Career Assessment Quiz"
                subheader="Answer questions to get personalized career recommendations"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    <QuizIcon />
                  </Avatar>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Our comprehensive assessment evaluates your interests, skills, and preferences to
                  recommend careers that align with your strengths. The quiz takes approximately 10
                  minutes to complete.
                </Typography>

                <Box sx={{ my: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Assessment includes:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Interest & Aptitude Analysis" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Work Style Preferences" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Skills & Strengths Evaluation" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Career Values Assessment" />
                    </ListItem>
                  </List>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<QuizIcon />}
                  onClick={handleStartAssessment}
                >
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
              <CardHeader title="Previous Results" />
              <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Complete the assessment to view your career recommendations
                </Alert>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader title="Statistics" />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments Completed
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="secondary">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Career Matches Found
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Internship Marketplace Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search internships..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Grid container spacing={3}>
          {internships.map((internship) => (
            <Grid item xs={12} md={6} key={internship.id}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader
                  avatar={
                    <Avatar src={internship.companyLogo} sx={{ width: 56, height: 56 }}>
                      {internship.company.charAt(0)}
                    </Avatar>
                  }
                  title={internship.title}
                  subheader={internship.company}
                  action={
                    internship.applicationStatus && (
                      <Chip
                        label={getStatusLabel(internship.applicationStatus)}
                        color={getStatusColor(internship.applicationStatus)}
                        size="small"
                      />
                    )
                  }
                />
                <CardContent>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{internship.location}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{internship.duration}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SalaryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{internship.stipend}</Typography>
                      </Box>
                      <Chip
                        label={internship.type}
                        size="small"
                        color={
                          internship.type === 'virtual'
                            ? 'primary'
                            : internship.type === 'hybrid'
                              ? 'secondary'
                              : 'default'
                        }
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Required Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {internship.skills.map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Alert severity="warning" icon={<CalendarIcon />}>
                    Deadline: {new Date(internship.deadline).toLocaleDateString()}
                  </Alert>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant={
                      internship.applicationStatus === 'not_applied' ? 'contained' : 'outlined'
                    }
                    onClick={() => {
                      setSelectedInternship(internship);
                      setShowInternshipDialog(true);
                    }}
                    disabled={internship.applicationStatus === 'applied'}
                  >
                    {internship.applicationStatus === 'not_applied'
                      ? 'Apply Now'
                      : 'View Application'}
                  </Button>
                  <Button size="small" startIcon={<ShareIcon />}>
                    Share
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Mentorship Program Tab */}
      <TabPanel value={activeTab} index={3}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Connect with industry professionals who can guide your career journey
        </Alert>

        <Grid container spacing={3}>
          {mentors.map((mentor) => (
            <Grid item xs={12} md={6} lg={4} key={mentor.id}>
              <Card
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar src={mentor.avatar} sx={{ width: 80, height: 80, mr: 2 }}>
                      {mentor.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {mentor.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mentor.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mentor.company}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Match Score
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {mentor.matchScore}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={mentor.matchScore}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Experience:</strong> {mentor.experience} years
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={mentor.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          ({mentor.rating})
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Availability:</strong> {mentor.availability}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Expertise:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {mentor.expertise.map((exp) => (
                        <Chip
                          key={exp}
                          label={exp}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setShowMentorDialog(true);
                    }}
                  >
                    Request Mentorship
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Portfolio Builder Tab */}
      <TabPanel value={activeTab} index={4}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">My Portfolio</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddProject}>
            Add Project
          </Button>
        </Box>

        <Grid container spacing={3}>
          {portfolioProjects.map((project) => (
            <Grid item xs={12} md={6} key={project.id}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                      <ArticleIcon />
                    </Avatar>
                  }
                  action={
                    <>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteProject(project.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                  title={project.title}
                  subheader={project.category}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {project.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Technologies:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {project.technologies.map((tech) => (
                        <Chip key={tech} label={tech} size="small" />
                      ))}
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Completed: {new Date(project.date).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  {project.link && (
                    <Button
                      size="small"
                      startIcon={<LinkIcon />}
                      href={project.link}
                      target="_blank"
                    >
                      View Project
                    </Button>
                  )}
                  <Button size="small" startIcon={<ShareIcon />}>
                    Share
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {portfolioProjects.length === 0 && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  border: `2px dashed ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <PortfolioIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Projects Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Start building your portfolio by adding your first project
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddProject}>
                  Add Your First Project
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Application Tracking Tab */}
      <TabPanel value={activeTab} index={5}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Application Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your internship and job applications in one place
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {internships.filter((i) => i.applicationStatus === 'applied').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applications Sent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {internships.filter((i) => i.applicationStatus === 'shortlisted').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shortlisted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {internships.filter((i) => i.applicationStatus === 'accepted').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Accepted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {internships.filter((i) => i.applicationStatus === 'rejected').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.divider}` }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Position</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {internships
                .filter((i) => i.applicationStatus !== 'not_applied')
                .map((internship) => (
                  <TableRow key={internship.id}>
                    <TableCell>{internship.title}</TableCell>
                    <TableCell>{internship.company}</TableCell>
                    <TableCell>Jan 15, 2024</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(internship.applicationStatus || 'not_applied')}
                        color={getStatusColor(internship.applicationStatus || 'not_applied')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(internship.deadline).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Button size="small">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              {internships.filter((i) => i.applicationStatus !== 'not_applied').length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No applications yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Partnership Management Tab */}
      <TabPanel value={activeTab} index={6}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Industry Partnerships
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage company partnerships and collaboration opportunities
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPartnership}>
            Add Partnership
          </Button>
        </Box>

        <Grid container spacing={3}>
          {partnerships.map((partnership) => (
            <Grid item xs={12} md={6} key={partnership.id}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <CompanyIcon />
                    </Avatar>
                  }
                  action={
                    <Chip
                      label={partnership.status}
                      color={
                        partnership.status === 'active'
                          ? 'success'
                          : partnership.status === 'pending'
                            ? 'warning'
                            : 'default'
                      }
                      size="small"
                    />
                  }
                  title={partnership.companyName}
                  subheader={partnership.industry}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Contact:</strong> {partnership.contactPerson}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Email:</strong> {partnership.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Phone:</strong> {partnership.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Partner Since:</strong>{' '}
                      {new Date(partnership.since).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Opportunities Offered:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {partnership.opportunitiesOffered.map((opp) => (
                        <Chip
                          key={opp}
                          label={opp}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EditIcon />}>
                    Edit
                  </Button>
                  <Button size="small" startIcon={<ChatIcon />}>
                    Contact
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Career Detail Dialog */}
      <Dialog
        open={selectedCareer !== null}
        onClose={() => setSelectedCareer(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedCareer && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">{selectedCareer.title}</Typography>
                <IconButton onClick={() => setSelectedCareer(null)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Industry Video
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 300,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                  }}
                >
                  <VideoIcon sx={{ fontSize: 64, color: 'grey.500' }} />
                </Box>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                A Day in the Life
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedCareer.dayInLifeStory}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Salary Insights
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Average Salary: {selectedCareer.averageSalary}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Expected Growth: {selectedCareer.growthRate} over the next 10 years
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCareer(null)}>Close</Button>
              <Button variant="contained" startIcon={<BookmarkIcon />}>
                Save Career
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog
        open={showAssessmentDialog}
        onClose={() => setShowAssessmentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Career Assessment Quiz</DialogTitle>
        <DialogContent>
          <Stepper activeStep={assessmentStep} sx={{ mb: 3 }}>
            {assessmentQuestions.map((q, index) => (
              <Step key={q.id}>
                <StepLabel>Question {index + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {assessmentStep < assessmentQuestions.length && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {assessmentQuestions[assessmentStep].question}
              </Typography>
              <List>
                {assessmentQuestions[assessmentStep].options.map((option) => (
                  <ListItem
                    key={option.value}
                    button
                    onClick={() =>
                      handleAssessmentAnswer(assessmentQuestions[assessmentStep].id, option.value)
                    }
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemText primary={option.label} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssessmentDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog
        open={showResultsDialog}
        onClose={() => setShowResultsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Your Career Recommendations</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            Based on your responses, we&apos;ve identified careers that match your profile!
          </Alert>

          <List>
            {filteredCareers.slice(0, 3).map((career, index) => (
              <ListItem
                key={career.id}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={`#${index + 1}`} color="primary">
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <WorkIcon />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={career.title}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {career.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={95 - index * 10}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {95 - index * 10}% Match
                        </Typography>
                      </Box>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultsDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => setShowResultsDialog(false)}>
            Explore Careers
          </Button>
        </DialogActions>
      </Dialog>

      {/* Internship Application Dialog */}
      <Dialog
        open={showInternshipDialog}
        onClose={() => setShowInternshipDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedInternship && (
          <>
            <DialogTitle>Apply to {selectedInternship.title}</DialogTitle>
            <DialogContent>
              <TextField fullWidth label="Full Name" margin="normal" required />
              <TextField fullWidth label="Email" type="email" margin="normal" required />
              <TextField fullWidth label="Phone" margin="normal" required />
              <TextField
                fullWidth
                label="Cover Letter"
                multiline
                rows={4}
                margin="normal"
                placeholder="Tell us why you're interested in this internship..."
                required
              />
              <Button variant="outlined" startIcon={<ArticleIcon />} sx={{ mt: 2 }}>
                Attach Resume
              </Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowInternshipDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={() => handleApplyInternship(selectedInternship.id)}
                startIcon={<SendIcon />}
              >
                Submit Application
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Mentor Request Dialog */}
      <Dialog
        open={showMentorDialog}
        onClose={() => setShowMentorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedMentor && (
          <>
            <DialogTitle>Request Mentorship from {selectedMentor.name}</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Your Goals"
                multiline
                rows={3}
                margin="normal"
                placeholder="What do you hope to achieve with this mentorship?"
                required
              />
              <TextField
                fullWidth
                label="Areas of Interest"
                multiline
                rows={2}
                margin="normal"
                placeholder="What topics would you like to discuss?"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Preferred Meeting Frequency</InputLabel>
                <Select defaultValue="biweekly">
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Bi-weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowMentorDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={() => handleRequestMentor(selectedMentor.id)}
                startIcon={<SendIcon />}
              >
                Send Request
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog
        open={showProjectDialog}
        onClose={() => setShowProjectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Project to Portfolio</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Project Title" margin="normal" required />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            margin="normal"
            placeholder="Describe your project..."
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select defaultValue="">
              <MenuItem value="Web Development">Web Development</MenuItem>
              <MenuItem value="Data Science">Data Science</MenuItem>
              <MenuItem value="Mobile App">Mobile App</MenuItem>
              <MenuItem value="Design">Design</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Technologies Used"
            margin="normal"
            placeholder="React, Node.js, MongoDB"
          />
          <TextField
            fullWidth
            label="Project Link"
            margin="normal"
            placeholder="https://github.com/..."
          />
          <Button variant="outlined" startIcon={<LinkIcon />} sx={{ mt: 2 }}>
            Upload Files
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProjectDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProject}>
            Add Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Partnership Dialog */}
      <Dialog
        open={showPartnershipDialog}
        onClose={() => setShowPartnershipDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Industry Partnership</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Company Name" margin="normal" required />
          <TextField fullWidth label="Industry" margin="normal" required />
          <TextField fullWidth label="Contact Person" margin="normal" required />
          <TextField fullWidth label="Email" type="email" margin="normal" required />
          <TextField fullWidth label="Phone" margin="normal" required />
          <TextField
            fullWidth
            label="Opportunities Offered"
            margin="normal"
            placeholder="Internships, Mentorship, Guest Lectures"
            helperText="Separate with commas"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select defaultValue="pending">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPartnershipDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePartnership}>
            Add Partnership
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
