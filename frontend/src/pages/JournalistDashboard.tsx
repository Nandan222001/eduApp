import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Container,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Alert,
  Tabs,
  Tab,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AttachFile as AttachFileIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  MenuBook as GuideIcon,
} from '@mui/icons-material';

interface Draft {
  id: number;
  title: string;
  category: string;
  lastEdited: string;
  wordCount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

interface PublicationEvent {
  date: string;
  edition: string;
  deadline: string;
  status: 'upcoming' | 'active' | 'past';
}

const mockDrafts: Draft[] = [
  {
    id: 1,
    title: 'The Impact of Technology in Education',
    category: 'opinion',
    lastEdited: '2024-03-15',
    wordCount: 850,
    status: 'draft',
  },
  {
    id: 2,
    title: 'Basketball Team Season Recap',
    category: 'sports',
    lastEdited: '2024-03-14',
    wordCount: 1200,
    status: 'submitted',
  },
  {
    id: 3,
    title: 'Spring Musical Preview',
    category: 'arts',
    lastEdited: '2024-03-13',
    wordCount: 950,
    status: 'approved',
  },
];

const publicationCalendar: PublicationEvent[] = [
  {
    date: '2024-04-01',
    edition: 'April Edition',
    deadline: '2024-03-25',
    status: 'upcoming',
  },
  {
    date: '2024-03-15',
    edition: 'March Edition',
    deadline: '2024-03-08',
    status: 'active',
  },
  {
    date: '2024-02-15',
    edition: 'February Edition',
    deadline: '2024-02-08',
    status: 'past',
  },
];

const submissionGuidelines = [
  {
    title: 'Word Count',
    content: 'Articles should be between 500-1500 words. Feature stories can be up to 2000 words.',
  },
  {
    title: 'Format',
    content:
      'Use clear headings, short paragraphs, and include relevant quotes. Submit in plain text or supported formats.',
  },
  {
    title: 'Citations',
    content:
      'Always cite your sources and verify facts. Include links to references when possible.',
  },
  {
    title: 'Images',
    content:
      'Include high-quality images (min 1200px width). Ensure you have permission to use all media.',
  },
  {
    title: 'Deadline',
    content: 'Submit articles at least 7 days before publication date for review and editing.',
  },
];

const writingTips = [
  'Start with a compelling headline that captures attention',
  'Use the inverted pyramid structure: most important information first',
  'Keep sentences short and concise',
  'Use active voice instead of passive voice',
  'Include quotes from relevant sources to add credibility',
  'Proofread carefully for grammar and spelling errors',
  'Make sure your article answers: Who, What, When, Where, Why, and How',
  'Use specific examples and data to support your points',
];

export default function JournalistDashboard() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [articleForm, setArticleForm] = useState({
    title: '',
    category: '',
    content: '',
    tags: '',
    excerpt: '',
  });

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string): JSX.Element | undefined => {
    switch (status) {
      case 'draft':
        return <EditIcon fontSize="small" />;
      case 'submitted':
        return <PendingIcon fontSize="small" />;
      case 'approved':
        return <CheckCircleIcon fontSize="small" />;
      case 'rejected':
        return <CancelIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Submitting article:', articleForm);
    setArticleDialogOpen(false);
    setCurrentStep(0);
    setArticleForm({ title: '', category: '', content: '', tags: '', excerpt: '' });
  };

  const formatText = (format: string) => {
    console.log('Applying format:', format);
  };

  const insertMedia = (type: string) => {
    console.log('Inserting media:', type);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Journalist Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Write and manage your articles
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="My Articles"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setArticleDialogOpen(true)}
                >
                  New Article
                </Button>
              }
            />
            <CardContent>
              <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
                <Tab label="All" />
                <Tab label="Drafts" />
                <Tab label="Submitted" />
                <Tab label="Published" />
              </Tabs>

              <List>
                {mockDrafts.map((draft) => (
                  <Paper
                    key={draft.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {draft.title}
                      </Typography>
                      <Chip
                        label={draft.status}
                        size="small"
                        color={getStatusColor(draft.status)}
                        icon={getStatusIcon(draft.status)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Chip label={draft.category.toUpperCase()} size="small" variant="outlined" />
                      <Typography variant="body2" color="text.secondary">
                        {draft.wordCount} words
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last edited: {new Date(draft.lastEdited).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<SendIcon />}
                        disabled={draft.status !== 'draft'}
                      >
                        Submit
                      </Button>
                      <Button size="small" startIcon={<DeleteIcon />} color="error">
                        Delete
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Publication Calendar" avatar={<CalendarIcon />} />
              <CardContent>
                <List>
                  {publicationCalendar.map((event, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor:
                          event.status === 'active'
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'transparent',
                      }}
                    >
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {event.edition}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Publish: {new Date(event.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="caption" color="text.secondary">
                          Deadline: {new Date(event.deadline).toLocaleDateString()}
                        </Typography>
                        <Chip
                          label={event.status}
                          size="small"
                          color={
                            event.status === 'active'
                              ? 'primary'
                              : event.status === 'upcoming'
                                ? 'warning'
                                : 'default'
                          }
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Writing Tips" avatar={<LightbulbIcon />} />
              <CardContent>
                <List dense>
                  {writingTips.slice(0, 5).map((tip, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {index + 1}. {tip}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Button size="small" fullWidth>
                  View All Tips
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Submission Guidelines" avatar={<GuideIcon />} />
              <CardContent>
                {submissionGuidelines.slice(0, 3).map((guideline, index) => (
                  <Accordion key={index} elevation={0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" fontWeight={600}>
                        {guideline.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {guideline.content}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
                <Button size="small" fullWidth sx={{ mt: 1 }}>
                  View Full Guidelines
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={articleDialogOpen}
        onClose={() => setArticleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>New Article</DialogTitle>
        <DialogContent>
          <Stepper activeStep={currentStep} sx={{ mb: 3, mt: 2 }}>
            <Step>
              <StepLabel>Basic Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>Write Content</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review & Submit</StepLabel>
            </Step>
          </Stepper>

          {currentStep === 0 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Article Title"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={articleForm.category}
                  label="Category"
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                >
                  <MenuItem value="news">News</MenuItem>
                  <MenuItem value="sports">Sports</MenuItem>
                  <MenuItem value="opinion">Opinion</MenuItem>
                  <MenuItem value="arts">Arts</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Excerpt"
                multiline
                rows={3}
                value={articleForm.excerpt}
                onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                helperText="A brief summary of your article (150-200 characters)"
              />
              <TextField
                fullWidth
                label="Tags"
                value={articleForm.tags}
                onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                helperText="Separate tags with commas"
              />
            </Stack>
          )}

          {currentStep === 1 && (
            <Stack spacing={2}>
              <Alert severity="info" icon={<InfoIcon />}>
                Use the formatting tools below to style your article
              </Alert>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <IconButton size="small" onClick={() => formatText('bold')}>
                    <BoldIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => formatText('italic')}>
                    <ItalicIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => formatText('underline')}>
                    <UnderlineIcon />
                  </IconButton>
                  <Divider orientation="vertical" flexItem />
                  <IconButton size="small" onClick={() => formatText('bulletList')}>
                    <BulletListIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => formatText('numberList')}>
                    <NumberListIcon />
                  </IconButton>
                  <Divider orientation="vertical" flexItem />
                  <IconButton size="small" onClick={() => insertMedia('image')}>
                    <ImageIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => insertMedia('video')}>
                    <VideoIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => insertMedia('file')}>
                    <AttachFileIcon />
                  </IconButton>
                </Stack>
              </Paper>
              <TextField
                fullWidth
                multiline
                rows={15}
                placeholder="Write your article here..."
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Word count: {articleForm.content.split(' ').filter((w) => w).length}
                </Typography>
                <Button startIcon={<SaveIcon />} size="small">
                  Save Draft
                </Button>
              </Box>
            </Stack>
          )}

          {currentStep === 2 && (
            <Stack spacing={3}>
              <Alert severity="success">
                Your article is ready for review. Please verify all information before submitting.
              </Alert>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {articleForm.title || 'Untitled Article'}
                </Typography>
                <Chip label={articleForm.category.toUpperCase() || 'NO CATEGORY'} size="small" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Excerpt:
                </Typography>
                <Typography variant="body1">
                  {articleForm.excerpt || 'No excerpt provided'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Content Preview:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="body2">
                    {articleForm.content || 'No content written'}
                  </Typography>
                </Paper>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tags:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {articleForm.tags
                    .split(',')
                    .map(
                      (tag, index) =>
                        tag.trim() && (
                          <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                        )
                    )}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArticleDialogOpen(false)}>Cancel</Button>
          {currentStep > 0 && <Button onClick={handleBack}>Back</Button>}
          {currentStep < 2 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSubmit} startIcon={<SendIcon />}>
              Submit for Review
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
