import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Stack,
  Switch,
  FormControlLabel,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  Publish as PublishIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  BarChart as ChartIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { contentMarketplaceApi, CreatorContent, CreatorStats } from '@/api/contentMarketplace';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

interface UploadWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editContent?: CreatorContent | null;
}

function UploadWizard({ open, onClose, onSuccess, editContent }: UploadWizardProps) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    full_description: string;
    subject: string;
    topic: string;
    grade: string;
    content_type: string;
    file: File | null;
    thumbnail: File | null;
    price: number;
    is_free: boolean;
    tags: string[];
    learning_objectives: string[];
    prerequisites: string[];
    difficulty_level: string;
  }>({
    title: '',
    description: '',
    full_description: '',
    subject: '',
    topic: '',
    grade: '',
    content_type: 'pdf',
    file: null,
    thumbnail: null,
    price: 0,
    is_free: true,
    tags: [],
    learning_objectives: [],
    prerequisites: [],
    difficulty_level: 'beginner',
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');

  const steps = ['Basic Info', 'Content Upload', 'Details & Pricing', 'Preview & Submit'];

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
  ];
  const grades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  useEffect(() => {
    if (editContent) {
      setFormData({
        title: editContent.title,
        description: editContent.description,
        full_description: editContent.description || '',
        subject: editContent.subject,
        topic: editContent.topic,
        grade: editContent.grade,
        content_type: editContent.content_type,
        file: null,
        thumbnail: null,
        price: editContent.price,
        is_free: editContent.is_free,
        tags: editContent.tags,
        learning_objectives: [],
        prerequisites: [],
        difficulty_level: 'beginner',
      });
    }
  }, [editContent]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        const typedKey = key as keyof typeof formData;
        const value = formData[typedKey];
        if (key === 'file' || key === 'thumbnail') {
          if (value && value instanceof File) {
            data.append(key, value);
          }
        } else if (Array.isArray(value)) {
          data.append(key, JSON.stringify(value));
        } else if (value != null) {
          data.append(key, String(value));
        }
      });

      if (editContent) {
        await contentMarketplaceApi.updateContent(editContent.id, data);
      } else {
        await contentMarketplaceApi.createContent(data);
      }

      onSuccess();
      onClose();
      setActiveStep(0);
    } catch (error) {
      console.error('Failed to upload content:', error);
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) });
  };

  const addObjective = () => {
    if (currentObjective && !formData.learning_objectives.includes(currentObjective)) {
      setFormData({
        ...formData,
        learning_objectives: [...formData.learning_objectives, currentObjective],
      });
      setCurrentObjective('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {editContent ? 'Edit Content' : 'Upload New Content'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Short Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                  label="Subject"
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={formData.grade}
                  label="Grade"
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={formData.content_type}
                  label="Content Type"
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                >
                  <MenuItem value="pdf">PDF Document</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="slides">Presentation Slides</MenuItem>
                  <MenuItem value="notes">Notes</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="worksheet">Worksheet</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  border: `2px dashed ${theme.palette.divider}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                />
                <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {formData.file ? formData.file.name : 'Click to upload content file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: PDF, MP4, PPTX, DOCX
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: `1px dashed ${theme.palette.divider}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('thumbnail-upload')?.click()}
              >
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail: e.target.files?.[0] || null })
                  }
                />
                <Typography variant="body2" color="text.secondary">
                  {formData.thumbnail ? formData.thumbnail.name : 'Upload Thumbnail (Optional)'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {activeStep === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Description"
                value={formData.full_description}
                onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_free}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_free: e.target.checked,
                        price: e.target.checked ? 0 : formData.price,
                      })
                    }
                  />
                }
                label="Make this content free"
              />
            </Grid>
            {!formData.is_free && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price (in credits)"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                  }
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={formData.is_free ? 12 : 6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  label="Difficulty Level"
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Add Tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Learning Objectives
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Add learning objective"
                  value={currentObjective}
                  onChange={(e) => setCurrentObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  size="small"
                />
                <Button onClick={addObjective} startIcon={<AddIcon />} size="small">
                  Add
                </Button>
              </Box>
              <List dense>
                {formData.learning_objectives.map((obj: string, idx: number) => (
                  <ListItem key={idx}>
                    <ListItemText primary={`• ${obj}`} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Content
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formData.title}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Subject
                </Typography>
                <Typography variant="body1">{formData.subject}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Grade
                </Typography>
                <Typography variant="body1">{formData.grade}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1">
                  {formData.is_free ? 'Free' : `${formData.price} credits`}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  File
                </Typography>
                <Typography variant="body1">{formData.file?.name || 'No file selected'}</Typography>
              </Grid>
            </Grid>
            {uploading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Uploading...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={uploading || !formData.file}
            startIcon={<UploadIcon />}
          >
            {editContent ? 'Update' : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function ContentCreatorStudio() {
  const theme = useTheme();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myContent, setMyContent] = useState<CreatorContent[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingContent, setEditingContent] = useState<CreatorContent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contentData, statsData] = await Promise.all([
        contentMarketplaceApi.getMyContent(),
        contentMarketplaceApi.getCreatorStats(),
      ]);
      setMyContent(contentData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to load creator data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (contentId: string) => {
    try {
      await contentMarketplaceApi.submitForReview(contentId);
      loadData();
    } catch (err) {
      console.error('Failed to submit for review:', err);
    }
  };

  const handlePublish = async (contentId: string) => {
    try {
      await contentMarketplaceApi.publishContent(contentId);
      loadData();
    } catch (err) {
      console.error('Failed to publish content:', err);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        await contentMarketplaceApi.deleteContent(contentId);
        loadData();
      } catch (err) {
        console.error('Failed to delete content:', err);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'pending_review':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'rejected':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <DescriptionIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Content Creator Studio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your educational content
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<UploadIcon />}
          onClick={() => {
            setEditingContent(null);
            setShowUploadDialog(true);
          }}
        >
          Upload New Content
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_e, v) => setCurrentTab(v)}>
          <Tab label="Dashboard" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="My Content" icon={<DescriptionIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {stats.total_earnings.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Credits
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total_sales.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main">
                      Growing
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.average_rating.toFixed(1)}
                    </Typography>
                    <StarIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stats.total_reviews} reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Leaderboard Rank
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    #{stats.leaderboard_rank || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Top Creator
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Top Selling Content
                  </Typography>
                  <List>
                    {stats.top_selling_content.slice(0, 5).map((content) => (
                      <ListItem key={content.id}>
                        <ListItemText
                          primary={content.title}
                          secondary={`${content.total_purchases} sales • ${content.rating.toFixed(1)} ⭐`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Content Statistics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Content</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.total_content}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Views</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.total_views.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Credits Earned</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.credits_earned.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Pending Earnings</Typography>
                      <Typography variant="body2" fontWeight={700} color="warning.main">
                        {stats.pending_earnings.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.divider}` }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Content</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Sales</TableCell>
                <TableCell align="right">Rating</TableCell>
                <TableCell align="right">Earnings</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myContent.map((content) => (
                <TableRow key={content.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getStatusIcon(content.status)}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {content.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {content.content_type.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={content.subject} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={content.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        content.status === 'published' || content.status === 'approved'
                          ? 'success'
                          : content.status === 'pending_review'
                            ? 'warning'
                            : content.status === 'rejected'
                              ? 'error'
                              : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">{content.total_purchases}</TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                      }}
                    >
                      <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      {content.rating.toFixed(1)}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{content.earnings.toLocaleString()} credits</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View">
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingContent(content);
                            setShowUploadDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {content.status === 'draft' && (
                        <Tooltip title="Submit for Review">
                          <IconButton
                            size="small"
                            onClick={() => handleSubmitForReview(content.id)}
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {content.status === 'approved' && (
                        <Tooltip title="Publish">
                          <IconButton size="small" onClick={() => handlePublish(content.id)}>
                            <PublishIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(content.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {myContent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No content yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Start creating educational content to earn credits
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setShowUploadDialog(true)}
                    >
                      Upload Your First Content
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <UploadWizard
        open={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          setEditingContent(null);
        }}
        onSuccess={loadData}
        editContent={editingContent}
      />
    </Box>
  );
}
