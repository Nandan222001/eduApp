import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Checkbox,
  Stack,
  Divider,
  Badge,
  FormControl,
  InputLabel,
  Select,
  Alert,
  useTheme,
  alpha,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  Switch,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Send as SendIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  Task as TaskIcon,
  Photo as PhotoIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Help as HelpIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  AttachFile as AttachFileIcon,
  Edit as EditIcon,
  Translate as TranslateIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  startDate: string;
  targetDate: string;
  assignedTo: string[];
}

interface Conference {
  id: number;
  title: string;
  date: string;
  time: string;
  participants: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

interface ActionPlanTask {
  id: number;
  title: string;
  description: string;
  assignedTo: 'parent' | 'teacher' | 'both';
  dueDate: string;
  completed: boolean;
  progress: number;
  photos: string[];
}

interface HomeActivity {
  id: number;
  title: string;
  description: string;
  subject: string;
  topic: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  materials: string[];
  instructions: string[];
}

interface ChatMessage {
  id: number;
  sender: string;
  senderRole: 'parent' | 'teacher';
  content: string;
  originalContent?: string;
  originalLanguage?: string;
  translatedTo?: string;
  timestamp: Date;
  attachments?: string[];
}

interface WorkSample {
  id: number;
  title: string;
  subject: string;
  date: string;
  type: 'assignment' | 'test' | 'project' | 'classwork';
  score?: number;
  maxScore?: number;
  imageUrl: string;
  annotations: Annotation[];
  teacherComments: string;
}

interface Annotation {
  x: number;
  y: number;
  text: string;
  color: string;
}

const smartGuide = {
  specific: 'What exactly do you want to accomplish? Be clear and detailed.',
  measurable: 'How will you measure progress? Define quantifiable metrics.',
  achievable: 'Is this goal realistic? What resources do you need?',
  relevant: 'Why is this goal important? How does it align with broader objectives?',
  timeBound: 'When will you achieve this? Set a clear deadline.',
};

const goalCategories = [
  { value: 'academic', label: 'Academic Performance' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'social', label: 'Social Skills' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'homework', label: 'Homework Completion' },
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Art', 'Music'];

export const ParentTeacherWorkspace: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [goalWizardOpen, setGoalWizardOpen] = useState(false);
  const [activityDetailOpen, setActivityDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [selectedSample, setSelectedSample] = useState<WorkSample | null>(null);
  const [_conferenceDialogOpen, setConferenceDialogOpen] = useState(false);

  const [goalWizardStep, setGoalWizardStep] = useState(0);
  const [goalFormData, setGoalFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: 'academic',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    assignedTo: [],
  });

  const [conferences] = useState<Conference[]>([
    {
      id: 1,
      title: 'Progress Review',
      date: '2024-02-15',
      time: '14:00',
      participants: ['Parent', 'Teacher'],
      status: 'scheduled',
      meetingLink: 'https://meet.example.com/abc123',
    },
  ]);

  const [actionPlanTasks, setActionPlanTasks] = useState<ActionPlanTask[]>([
    {
      id: 1,
      title: 'Review homework daily',
      description: 'Check homework completion and understanding',
      assignedTo: 'parent',
      dueDate: '2024-02-28',
      completed: false,
      progress: 60,
      photos: [],
    },
    {
      id: 2,
      title: 'Provide weekly progress updates',
      description: 'Share student progress and areas of concern',
      assignedTo: 'teacher',
      dueDate: '2024-02-28',
      completed: false,
      progress: 75,
      photos: [],
    },
  ]);

  const [homeActivities] = useState<HomeActivity[]>([
    {
      id: 1,
      title: 'Fraction Practice',
      description: 'Practice adding and subtracting fractions',
      subject: 'Mathematics',
      topic: 'Fractions',
      duration: 30,
      difficulty: 'medium',
      materials: ['Fraction blocks', 'Worksheet'],
      instructions: [
        'Review fraction basics',
        'Practice with visual aids',
        'Complete 10 problems',
        'Check answers',
      ],
    },
    {
      id: 2,
      title: 'Reading Comprehension',
      description: 'Read and answer questions about a story',
      subject: 'English',
      topic: 'Reading',
      duration: 25,
      difficulty: 'easy',
      materials: ['Storybook', 'Question sheet'],
      instructions: [
        'Read the story aloud',
        'Discuss main characters',
        'Answer comprehension questions',
        'Write a summary',
      ],
    },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'Ms. Johnson',
      senderRole: 'teacher',
      content: "Hello! I wanted to discuss your child's progress in mathematics.",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      sender: "John's Parent",
      senderRole: 'parent',
      content: "Thank you for reaching out. I've noticed he's been struggling with fractions.",
      timestamp: new Date(Date.now() - 1800000),
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [sharedNotes, setSharedNotes] = useState(
    'Meeting Notes:\n\n- Student showing improvement in reading\n- Continue with fraction practice at home\n- Schedule follow-up in 2 weeks'
  );

  const [workSamples] = useState<WorkSample[]>([
    {
      id: 1,
      title: 'Math Quiz - Chapter 5',
      subject: 'Mathematics',
      date: '2024-02-10',
      type: 'test',
      score: 85,
      maxScore: 100,
      imageUrl: '/placeholder-work.jpg',
      annotations: [
        { x: 50, y: 100, text: 'Great work on this problem!', color: 'green' },
        { x: 150, y: 200, text: 'Review this concept', color: 'orange' },
      ],
      teacherComments: 'Excellent progress! Keep practicing fractions.',
    },
  ]);

  const handleGoalWizardNext = () => {
    setGoalWizardStep((prev) => Math.min(prev + 1, 2));
  };

  const handleGoalWizardBack = () => {
    setGoalWizardStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGoalSubmit = () => {
    console.log('Goal created:', goalFormData);
    setGoalWizardOpen(false);
    setGoalWizardStep(0);
    setGoalFormData({
      title: '',
      description: '',
      category: 'academic',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timeBound: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      assignedTo: [],
    });
  };

  const handleTaskToggle = (taskId: number) => {
    setActionPlanTasks(
      actionPlanTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, progress: task.completed ? task.progress : 100 }
          : task
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: chatMessages.length + 1,
      sender: 'Current User',
      senderRole: 'parent',
      content: newMessage,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  const filteredActivities = homeActivities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || activity.subject === filterSubject;
    const matchesDifficulty =
      filterDifficulty === 'all' || activity.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const renderGoalWizard = () => {
    const steps = ['Basic Information', 'SMART Criteria', 'Review & Submit'];

    return (
      <Dialog
        open={goalWizardOpen}
        onClose={() => setGoalWizardOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={600}>
              Create SMART Goal
            </Typography>
            <IconButton onClick={() => setGoalWizardOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Stepper activeStep={goalWizardStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {goalWizardStep === 0 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Goal Title"
                value={goalFormData.title}
                onChange={(e) => setGoalFormData({ ...goalFormData, title: e.target.value })}
                required
                placeholder="e.g., Improve Math Test Scores"
              />

              <TextField
                fullWidth
                label="Description"
                value={goalFormData.description}
                onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                required
                multiline
                rows={3}
                placeholder="Describe the goal in detail..."
              />

              <FormControl fullWidth>
                <InputLabel>Goal Category</InputLabel>
                <Select
                  value={goalFormData.category}
                  label="Goal Category"
                  onChange={(e) => setGoalFormData({ ...goalFormData, category: e.target.value })}
                >
                  {goalCategories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={goalFormData.startDate}
                    onChange={(e) =>
                      setGoalFormData({ ...goalFormData, startDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Target Date"
                    value={goalFormData.targetDate}
                    onChange={(e) =>
                      setGoalFormData({ ...goalFormData, targetDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                    inputProps={{ min: goalFormData.startDate }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}

          {goalWizardStep === 1 && (
            <Stack spacing={3}>
              <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="info.dark" fontWeight={500}>
                  <HelpIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                  SMART Goal Framework
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Answer each question to create a well-defined, achievable goal
                </Typography>
              </Box>

              {Object.entries(smartGuide).map(([key, guide]) => (
                <Accordion key={key} defaultExpanded={key === 'specific'}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600} textTransform="capitalize">
                      {key}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: 'block' }}
                    >
                      {guide}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={goalFormData[key as keyof typeof smartGuide]}
                      onChange={(e) => setGoalFormData({ ...goalFormData, [key]: e.target.value })}
                      placeholder={`Enter ${key} criteria...`}
                      required
                    />
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}

          {goalWizardStep === 2 && (
            <Stack spacing={3}>
              <Alert severity="info">Review your goal details before submitting</Alert>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {goalFormData.title}
                  </Typography>
                  <Chip
                    label={goalCategories.find((c) => c.value === goalFormData.category)?.label}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {goalFormData.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body2">{goalFormData.startDate}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Target Date
                      </Typography>
                      <Typography variant="body2">{goalFormData.targetDate}</Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      SMART Criteria
                    </Typography>
                    {Object.keys(smartGuide).map((key) => (
                      <Box key={key} sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textTransform="capitalize"
                        >
                          {key}:
                        </Typography>
                        <Typography variant="body2">
                          {goalFormData[key as keyof typeof smartGuide] || 'Not specified'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGoalWizardOpen(false)}>Cancel</Button>
          {goalWizardStep > 0 && <Button onClick={handleGoalWizardBack}>Back</Button>}
          {goalWizardStep < 2 ? (
            <Button onClick={handleGoalWizardNext} variant="contained">
              Next
            </Button>
          ) : (
            <Button onClick={handleGoalSubmit} variant="contained">
              Create Goal
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const renderConferenceScheduler = () => (
    <Card>
      <CardHeader
        title="Conference Scheduler"
        avatar={<EventIcon color="primary" />}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setConferenceDialogOpen(true)}
          >
            Schedule Meeting
          </Button>
        }
      />
      <CardContent>
        <List>
          {conferences.map((conference) => (
            <ListItem
              key={conference.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                mb: 2,
                bgcolor:
                  conference.status === 'scheduled'
                    ? alpha(theme.palette.primary.main, 0.05)
                    : 'background.paper',
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <CalendarIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={conference.title}
                secondary={
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">{conference.date}</Typography>
                      <AccessTimeIcon sx={{ fontSize: 16, ml: 1 }} />
                      <Typography variant="body2">{conference.time}</Typography>
                    </Box>
                    <Box>
                      <Chip
                        label={conference.status}
                        size="small"
                        color={conference.status === 'scheduled' ? 'success' : 'default'}
                      />
                    </Box>
                  </Stack>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Join Video Call">
                    <IconButton color="primary" disabled={conference.status !== 'scheduled'}>
                      <VideoCallIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Set Reminder">
                    <IconButton>
                      <NotificationsIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderSharedNotes = () => (
    <Card>
      <CardHeader
        title="Shared Notes"
        avatar={<EditIcon color="primary" />}
        subheader="Collaborative document for meeting notes and updates"
      />
      <CardContent>
        <TextField
          fullWidth
          multiline
          rows={12}
          value={sharedNotes}
          onChange={(e) => setSharedNotes(e.target.value)}
          placeholder="Start typing notes here... This document is shared with all participants."
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
            },
          }}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last edited: {formatDistanceToNow(new Date(), { addSuffix: true })}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<ShareIcon />}>
              Share
            </Button>
            <Button size="small" startIcon={<DownloadIcon />}>
              Export
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );

  const renderActionPlanTracker = () => (
    <Card>
      <CardHeader
        title="Action Plan Tracker"
        avatar={<TaskIcon color="primary" />}
        subheader="Tasks and responsibilities for parents and teachers"
      />
      <CardContent>
        <List>
          {actionPlanTasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                mb: 2,
                bgcolor: task.completed
                  ? alpha(theme.palette.success.main, 0.05)
                  : 'background.paper',
              }}
            >
              <Checkbox checked={task.completed} onChange={() => handleTaskToggle(task.id)} />
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="body1"
                      sx={{ textDecoration: task.completed ? 'line-through' : 'none' }}
                    >
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.assignedTo}
                      size="small"
                      color={task.assignedTo === 'parent' ? 'primary' : 'secondary'}
                    />
                  </Box>
                }
                secondary={
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Due: {task.dueDate}
                      </Typography>
                    </Box>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="caption">Progress: {task.progress}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={task.progress} />
                    </Box>
                    {task.photos.length > 0 && (
                      <Box display="flex" gap={1} mt={1}>
                        {task.photos.map((photo, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <PhotoIcon />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Stack>
                }
              />
              <ListItemSecondaryAction>
                <IconButton size="small">
                  <PhotoIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Button fullWidth variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }}>
          Add New Task
        </Button>
      </CardContent>
    </Card>
  );

  const renderHomeActivityLibrary = () => (
    <Card>
      <CardHeader
        title="Home Activity Library"
        avatar={<SchoolIcon color="primary" />}
        subheader="Activities aligned with current topics and skill gaps"
      />
      <CardContent>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search activities..."
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

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filterSubject}
                  label="Subject"
                  onChange={(e) => setFilterSubject(e.target.value)}
                >
                  <MenuItem value="all">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filterDifficulty}
                  label="Difficulty"
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Stack>

        <Grid container spacing={2}>
          {filteredActivities.map((activity) => (
            <Grid item xs={12} md={6} key={activity.id}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => {
                  setSelectedActivity(activity);
                  setActivityDetailOpen(true);
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6" gutterBottom>
                      {activity.title}
                    </Typography>
                    <Chip
                      label={activity.difficulty}
                      size="small"
                      color={
                        activity.difficulty === 'easy'
                          ? 'success'
                          : activity.difficulty === 'medium'
                            ? 'warning'
                            : 'error'
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {activity.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={activity.subject} size="small" variant="outlined" />
                      <Chip label={activity.topic} size="small" variant="outlined" />
                      <Chip
                        label={`${activity.duration} min`}
                        size="small"
                        icon={<AccessTimeIcon />}
                      />
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMultilingualChat = () => (
    <Card>
      <CardHeader
        title="Multilingual Chat"
        avatar={<TranslateIcon color="primary" />}
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                />
              }
              label="Auto-translate"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={selectedLanguage}
                label="Language"
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        }
      />
      <CardContent>
        <Box
          sx={{
            height: 400,
            overflow: 'auto',
            mb: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          {chatMessages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.senderRole === 'parent' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  bgcolor: message.senderRole === 'parent' ? 'primary.main' : 'grey.200',
                  color: message.senderRole === 'parent' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography variant="caption" fontWeight={600} display="block">
                  {message.sender}
                </Typography>
                <Typography variant="body2">{message.content}</Typography>
                {message.translatedTo && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider', opacity: 0.8 }}>
                    <Typography variant="caption" display="block">
                      Translated to {languages.find((l) => l.code === message.translatedTo)?.name}:
                    </Typography>
                    <Typography variant="body2" fontStyle="italic">
                      {message.originalContent}
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box display="flex" gap={1}>
          <IconButton size="small">
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const renderStudentProgressSharing = () => (
    <Card>
      <CardHeader
        title="Student Progress Sharing"
        avatar={<AssignmentIcon color="primary" />}
        subheader="Annotated work samples and progress updates"
      />
      <CardContent>
        <Grid container spacing={2}>
          {workSamples.map((sample) => (
            <Grid item xs={12} md={6} key={sample.id}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => setSelectedSample(sample)}
              >
                <Box
                  sx={{
                    height: 200,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <PhotoIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                  <Badge
                    badgeContent={sample.annotations.length}
                    color="primary"
                    sx={{ position: 'absolute', top: 10, right: 10 }}
                  >
                    <CommentIcon />
                  </Badge>
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {sample.title}
                  </Typography>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip label={sample.subject} size="small" />
                    <Chip label={sample.type} size="small" variant="outlined" />
                  </Stack>
                  {sample.score !== undefined && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Score: {sample.score}/{sample.maxScore}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(sample.score / sample.maxScore!) * 100}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {sample.teacherComments}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 1 }}
                  >
                    {sample.date}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Button fullWidth variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }}>
          Upload New Work Sample
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Parent-Teacher Collaboration Workspace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Collaborate on student goals, share progress, and communicate effectively
          </Typography>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Goals & Planning" icon={<TaskIcon />} iconPosition="start" />
            <Tab label="Conferences" icon={<EventIcon />} iconPosition="start" />
            <Tab label="Shared Notes" icon={<EditIcon />} iconPosition="start" />
            <Tab label="Action Plans" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Home Activities" icon={<SchoolIcon />} iconPosition="start" />
            <Tab label="Chat" icon={<TranslateIcon />} iconPosition="start" />
            <Tab label="Progress" icon={<PhotoIcon />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight={600}>
                    SMART Goals
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setGoalWizardOpen(true)}
                  >
                    Create New Goal
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Improve Math Scores
                        </Typography>
                        <Chip label="Academic" size="small" sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Increase math test average from 75% to 85% by end of semester
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress: 60%
                          </Typography>
                          <LinearProgress variant="determinate" value={60} sx={{ mt: 0.5 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Target: March 31, 2024
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === 1 && renderConferenceScheduler()}
            {activeTab === 2 && renderSharedNotes()}
            {activeTab === 3 && renderActionPlanTracker()}
            {activeTab === 4 && renderHomeActivityLibrary()}
            {activeTab === 5 && renderMultilingualChat()}
            {activeTab === 6 && renderStudentProgressSharing()}
          </Box>
        </Paper>

        {renderGoalWizard()}

        <Dialog
          open={activityDetailOpen}
          onClose={() => setActivityDetailOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">{selectedActivity?.title}</Typography>
              <IconButton onClick={() => setActivityDetailOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedActivity && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">{selectedActivity.description}</Typography>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Subject
                    </Typography>
                    <Typography variant="body2">{selectedActivity.subject}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Topic
                    </Typography>
                    <Typography variant="body2">{selectedActivity.topic}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body2">{selectedActivity.duration} minutes</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Difficulty
                    </Typography>
                    <Typography variant="body2" textTransform="capitalize">
                      {selectedActivity.difficulty}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Materials Needed
                  </Typography>
                  <List dense>
                    {selectedActivity.materials.map((material, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={material} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Instructions
                  </Typography>
                  <List>
                    {selectedActivity.instructions.map((instruction, idx) => (
                      <ListItem key={idx}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {idx + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={instruction} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivityDetailOpen(false)}>Close</Button>
            <Button variant="contained" startIcon={<DownloadIcon />}>
              Download PDF
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!selectedSample}
          onClose={() => setSelectedSample(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">{selectedSample?.title}</Typography>
              <IconButton onClick={() => setSelectedSample(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedSample && (
              <Stack spacing={3}>
                <Box
                  sx={{
                    height: 400,
                    bgcolor: 'grey.200',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <PhotoIcon sx={{ fontSize: 128, color: 'grey.400' }} />
                  {selectedSample.annotations.map((annotation, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        position: 'absolute',
                        left: annotation.x,
                        top: annotation.y,
                        bgcolor: annotation.color,
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: 12,
                      }}
                    >
                      {annotation.text}
                    </Box>
                  ))}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Subject
                    </Typography>
                    <Typography variant="body2">{selectedSample.subject}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body2">{selectedSample.date}</Typography>
                  </Grid>
                  {selectedSample.score !== undefined && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Score
                      </Typography>
                      <Typography variant="body2">
                        {selectedSample.score}/{selectedSample.maxScore} (
                        {((selectedSample.score / selectedSample.maxScore!) * 100).toFixed(0)}%)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(selectedSample.score / selectedSample.maxScore!) * 100}
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  )}
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Teacher Comments
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">{selectedSample.teacherComments}</Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Annotations ({selectedSample.annotations.length})
                  </Typography>
                  <Stack spacing={1}>
                    {selectedSample.annotations.map((annotation, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1,
                          borderLeft: 4,
                          borderColor: annotation.color,
                          bgcolor: alpha(annotation.color, 0.1),
                        }}
                      >
                        <Typography variant="body2">{annotation.text}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedSample(null)}>Close</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download
            </Button>
            <Button variant="outlined" startIcon={<ShareIcon />}>
              Share
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ParentTeacherWorkspace;
