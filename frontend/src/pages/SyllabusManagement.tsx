import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Book as BookIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Topic as TopicIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import subjectsApi, { Subject } from '@/api/subjects';
import classesApi, { Class } from '@/api/classes';
import { isDemoUser } from '@/api/demoDataApi';

interface Chapter {
  id: number;
  subject_id: number;
  chapter_number: number;
  title: string;
  description?: string;
  estimated_hours: number;
  order: number;
}

interface Topic {
  id: number;
  chapter_id: number;
  title: string;
  description?: string;
  estimated_hours: number;
  order: number;
}

interface LearningObjective {
  id: number;
  topic_id?: number;
  chapter_id?: number;
  objective: string;
  bloom_level: string;
  order: number;
}

interface CalendarMapping {
  id: number;
  subject_id: number;
  chapter_id?: number;
  topic_id?: number;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed';
}

interface SyllabusData {
  subject_id: number;
  subject_name: string;
  chapters: Array<Chapter & { topics: Topic[]; objectives: LearningObjective[] }>;
}

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
      id={`syllabus-tabpanel-${index}`}
      aria-labelledby={`syllabus-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SyllabusManagement() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [syllabusData, setSyllabusData] = useState<SyllabusData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<Chapter | Topic | LearningObjective | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  const [chapterFormData, setChapterFormData] = useState<Partial<Chapter>>({
    subject_id: 0,
    chapter_number: 1,
    title: '',
    description: '',
    estimated_hours: 0,
    order: 1,
  });

  const [topicFormData, setTopicFormData] = useState<Partial<Topic>>({
    chapter_id: 0,
    title: '',
    description: '',
    estimated_hours: 0,
    order: 1,
  });

  const [objectiveFormData, setObjectiveFormData] = useState<Partial<LearningObjective>>({
    chapter_id: 0,
    topic_id: 0,
    objective: '',
    bloom_level: 'Remember',
    order: 1,
  });

  const [calendarFormData, setCalendarFormData] = useState<Partial<CalendarMapping>>({
    subject_id: 0,
    chapter_id: 0,
    start_date: '',
    end_date: '',
    status: 'scheduled',
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  const fetchSubjects = async () => {
    try {
      if (isDemoUser()) {
        setSubjects(generateMockSubjects());
      } else {
        const response = await subjectsApi.listSubjects({ limit: 100, is_active: true });
        setSubjects(response.items);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      if (isDemoUser()) {
        setClasses(generateMockClasses());
      } else {
        const response = await classesApi.listClasses({ limit: 100, is_active: true });
        setClasses(response.items);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchSyllabusData = async () => {
    try {
      setLoading(true);
      if (isDemoUser()) {
        setSyllabusData(generateMockSyllabusData());
      } else {
        setSyllabusData([]);
      }
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load syllabus data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      fetchSyllabusData();
    }
  }, [tabValue]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: Chapter | Topic | LearningObjective
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (type: 'chapter' | 'topic' | 'objective') => {
    setFormMode('edit');
    if (type === 'chapter' && selectedItem) {
      setChapterFormData(selectedItem as Chapter);
      setChapterDialogOpen(true);
    } else if (type === 'topic' && selectedItem) {
      setTopicFormData(selectedItem as Topic);
      setTopicDialogOpen(true);
    } else if (type === 'objective' && selectedItem) {
      setObjectiveFormData(selectedItem as LearningObjective);
      setObjectiveDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchSyllabusData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete item');
    }
  };

  const handleAddChapter = () => {
    if (!selectedSubject) {
      setError('Please select a subject first');
      return;
    }
    setFormMode('create');
    setChapterFormData({
      subject_id: selectedSubject.id,
      chapter_number: 1,
      title: '',
      description: '',
      estimated_hours: 0,
      order: 1,
    });
    setFormErrors({});
    setChapterDialogOpen(true);
  };

  const handleAddTopic = (chapterId: number) => {
    setFormMode('create');
    setTopicFormData({
      chapter_id: chapterId,
      title: '',
      description: '',
      estimated_hours: 0,
      order: 1,
    });
    setFormErrors({});
    setTopicDialogOpen(true);
  };

  const handleAddObjective = (chapterId: number, topicId?: number) => {
    setFormMode('create');
    setObjectiveFormData({
      chapter_id: chapterId,
      topic_id: topicId,
      objective: '',
      bloom_level: 'Remember',
      order: 1,
    });
    setFormErrors({});
    setObjectiveDialogOpen(true);
  };

  const handleChapterSubmit = async () => {
    try {
      setSubmitting(true);
      if (isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setChapterDialogOpen(false);
      fetchSyllabusData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopicSubmit = async () => {
    try {
      setSubmitting(true);
      if (isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setTopicDialogOpen(false);
      fetchSyllabusData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save topic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleObjectiveSubmit = async () => {
    try {
      setSubmitting(true);
      if (isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setObjectiveDialogOpen(false);
      fetchSyllabusData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save objective');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadSyllabus = async () => {
    if (!uploadFile || !selectedSubject) {
      setError('Please select a subject and file');
      return;
    }

    try {
      setSubmitting(true);
      if (isDemoUser()) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      setUploadDialogOpen(false);
      setUploadFile(null);
      fetchSyllabusData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to upload syllabus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadSyllabus = () => {
    if (!selectedSubject) {
      setError('Please select a subject first');
      return;
    }
    const blob = new Blob(['Mock Syllabus Data'], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubject.name}_Syllabus.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredSyllabusData = selectedSubject
    ? syllabusData.filter((data) => data.subject_id === selectedSubject.id)
    : syllabusData;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Syllabus Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage curriculum, chapters, topics, learning objectives, and academic calendar mapping
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadSyllabus}>
            Download
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddChapter}>
            Add Chapter
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <Autocomplete
              options={subjects}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedSubject}
              onChange={(_e, newValue) => setSelectedSubject(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select Subject" placeholder="Choose a subject" />
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <Autocomplete
              options={classes}
              getOptionLabel={(option) => `Grade ${option.grade} - ${option.section}`}
              value={selectedClass}
              onChange={(_e, newValue) => setSelectedClass(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Class (Optional)"
                  placeholder="Choose a class"
                />
              )}
            />
          </FormControl>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<MenuBookIcon />} iconPosition="start" label="Curriculum Structure" />
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Learning Objectives" />
          <Tab icon={<CalendarIcon />} iconPosition="start" label="Calendar Mapping" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search chapters, topics..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, maxWidth: 400 }}
              />
              <IconButton onClick={fetchSyllabusData}>
                <RefreshIcon />
              </IconButton>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredSyllabusData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Syllabus Data
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedSubject
                    ? 'Start by adding chapters to organize your curriculum'
                    : 'Please select a subject to view or manage its syllabus'}
                </Typography>
                {selectedSubject && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddChapter}>
                    Add First Chapter
                  </Button>
                )}
              </Box>
            ) : (
              filteredSyllabusData.map((subjectData) => (
                <Box key={subjectData.subject_id} sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    {subjectData.subject_name}
                  </Typography>
                  {subjectData.chapters.map((chapter, chapterIndex) => (
                    <Accordion key={chapter.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            gap: 2,
                          }}
                        >
                          <FolderOpenIcon color="primary" />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              Chapter {chapter.chapter_number}: {chapter.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {chapter.topics.length} topics • {chapter.estimated_hours} hours
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, chapter);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {chapter.description && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {chapter.description}
                          </Typography>
                        )}
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              Topics
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddTopic(chapter.id)}
                            >
                              Add Topic
                            </Button>
                          </Box>
                          {chapter.topics.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No topics added yet
                            </Typography>
                          ) : (
                            <List dense>
                              {chapter.topics.map((topic, topicIndex) => (
                                <ListItem
                                  key={topic.id}
                                  sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                    mb: 1,
                                  }}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={(e) => handleMenuOpen(e, topic)}
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                  }
                                >
                                  <ListItemIcon>
                                    <TopicIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`${chapterIndex + 1}.${topicIndex + 1} ${topic.title}`}
                                    secondary={`${topic.estimated_hours} hours`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                        <Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              Learning Objectives
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddObjective(chapter.id)}
                            >
                              Add Objective
                            </Button>
                          </Box>
                          {chapter.objectives.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No objectives added yet
                            </Typography>
                          ) : (
                            <List dense>
                              {chapter.objectives.map((objective) => (
                                <ListItem
                                  key={objective.id}
                                  sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                    mb: 0.5,
                                  }}
                                  secondaryAction={
                                    <Chip label={objective.bloom_level} size="small" />
                                  }
                                >
                                  <ListItemIcon>
                                    <CheckCircleIcon fontSize="small" color="success" />
                                  </ListItemIcon>
                                  <ListItemText primary={objective.objective} />
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ))
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 2, pb: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredSyllabusData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Learning Objectives
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a subject and add chapters to define learning objectives
                </Typography>
              </Box>
            ) : (
              filteredSyllabusData.map((subjectData) => (
                <Box key={subjectData.subject_id}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    {subjectData.subject_name} - Learning Objectives by Bloom&apos;s Taxonomy
                  </Typography>
                  <Grid container spacing={2}>
                    {bloomLevels.map((level) => {
                      const objectives = subjectData.chapters.flatMap((chapter) =>
                        chapter.objectives.filter((obj) => obj.bloom_level === level)
                      );
                      return (
                        <Grid item xs={12} md={6} key={level}>
                          <Card>
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                {level}
                              </Typography>
                              <Divider sx={{ mb: 1 }} />
                              {objectives.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  No objectives at this level
                                </Typography>
                              ) : (
                                <List dense>
                                  {objectives.map((obj) => (
                                    <ListItem key={obj.id} disableGutters>
                                      <ListItemIcon sx={{ minWidth: 32 }}>
                                        <CheckCircleIcon fontSize="small" color="success" />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={obj.objective}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ))
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCalendarDialogOpen(true)}
              >
                Map to Calendar
              </Button>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Calendar Mapping
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Map chapters and topics to the academic year calendar
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleEdit('chapter')}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={chapterDialogOpen}
        onClose={() => setChapterDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{formMode === 'create' ? 'Add New Chapter' : 'Edit Chapter'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Chapter Number *"
                type="number"
                value={chapterFormData.chapter_number || ''}
                onChange={(e) =>
                  setChapterFormData({
                    ...chapterFormData,
                    chapter_number: parseInt(e.target.value),
                  })
                }
                error={Boolean(formErrors.chapter_number)}
                helperText={formErrors.chapter_number}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Hours *"
                type="number"
                value={chapterFormData.estimated_hours || ''}
                onChange={(e) =>
                  setChapterFormData({
                    ...chapterFormData,
                    estimated_hours: parseFloat(e.target.value),
                  })
                }
                error={Boolean(formErrors.estimated_hours)}
                helperText={formErrors.estimated_hours}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Chapter Title *"
                value={chapterFormData.title || ''}
                onChange={(e) => setChapterFormData({ ...chapterFormData, title: e.target.value })}
                error={Boolean(formErrors.title)}
                helperText={formErrors.title}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={chapterFormData.description || ''}
                onChange={(e) =>
                  setChapterFormData({ ...chapterFormData, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChapterDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChapterSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {formMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={topicDialogOpen}
        onClose={() => setTopicDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{formMode === 'create' ? 'Add New Topic' : 'Edit Topic'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Topic Title *"
                value={topicFormData.title || ''}
                onChange={(e) => setTopicFormData({ ...topicFormData, title: e.target.value })}
                error={Boolean(formErrors.title)}
                helperText={formErrors.title}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={topicFormData.description || ''}
                onChange={(e) =>
                  setTopicFormData({ ...topicFormData, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estimated Hours *"
                type="number"
                value={topicFormData.estimated_hours || ''}
                onChange={(e) =>
                  setTopicFormData({
                    ...topicFormData,
                    estimated_hours: parseFloat(e.target.value),
                  })
                }
                error={Boolean(formErrors.estimated_hours)}
                helperText={formErrors.estimated_hours}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopicDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTopicSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {formMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={objectiveDialogOpen}
        onClose={() => setObjectiveDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formMode === 'create' ? 'Add Learning Objective' : 'Edit Learning Objective'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Learning Objective *"
                multiline
                rows={3}
                value={objectiveFormData.objective || ''}
                onChange={(e) =>
                  setObjectiveFormData({ ...objectiveFormData, objective: e.target.value })
                }
                error={Boolean(formErrors.objective)}
                helperText={formErrors.objective}
                placeholder="e.g., Students will be able to..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={Boolean(formErrors.bloom_level)}>
                <InputLabel>Bloom&apos;s Taxonomy Level *</InputLabel>
                <Select
                  value={objectiveFormData.bloom_level || 'Remember'}
                  label="Bloom's Taxonomy Level *"
                  onChange={(e) =>
                    setObjectiveFormData({ ...objectiveFormData, bloom_level: e.target.value })
                  }
                >
                  {bloomLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.bloom_level && (
                  <Typography variant="caption" color="error">
                    {formErrors.bloom_level}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObjectiveDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleObjectiveSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {formMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={calendarDialogOpen}
        onClose={() => setCalendarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Map to Academic Calendar</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={subjects}
                getOptionLabel={(option) => option.name}
                value={subjects.find((s) => s.id === calendarFormData.subject_id) || null}
                onChange={(_e, newValue) =>
                  setCalendarFormData({ ...calendarFormData, subject_id: newValue?.id || 0 })
                }
                renderInput={(params) => <TextField {...params} label="Subject *" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date *"
                type="date"
                value={calendarFormData.start_date || ''}
                onChange={(e) =>
                  setCalendarFormData({ ...calendarFormData, start_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date *"
                type="date"
                value={calendarFormData.end_date || ''}
                onChange={(e) =>
                  setCalendarFormData({ ...calendarFormData, end_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setCalendarDialogOpen(false)}
            disabled={submitting}
          >
            Map
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Syllabus</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Autocomplete
                options={subjects}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={selectedSubject}
                onChange={(_e, newValue) => setSelectedSubject(newValue)}
                renderInput={(params) => <TextField {...params} label="Select Subject *" />}
              />
            </FormControl>
            <Box
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: theme.palette.primary.main },
              }}
              onClick={() => document.getElementById('syllabus-upload')?.click()}
            >
              <input
                id="syllabus-upload"
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.csv"
                style={{ display: 'none' }}
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {uploadFile ? uploadFile.name : 'Click to upload syllabus document'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: PDF, Word, Excel, CSV
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadSyllabus}
            disabled={submitting || !uploadFile || !selectedSubject}
            startIcon={submitting ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function generateMockSubjects(): Subject[] {
  const subjects = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English Language', code: 'ENG' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Biology', code: 'BIO' },
  ];

  return subjects.map((subject, index) => ({
    id: index + 1,
    institution_id: 1,
    name: subject.name,
    code: subject.code,
    description: `${subject.name} curriculum`,
    is_elective: false,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  }));
}

function generateMockClasses(): Class[] {
  const mockClasses: Class[] = [];
  for (let grade = 9; grade <= 12; grade++) {
    ['A', 'B'].forEach((section) => {
      mockClasses.push({
        id: grade * 100 + section.charCodeAt(0),
        institution_id: 1,
        grade,
        section,
        student_capacity: 40,
        current_students: Math.floor(Math.random() * 40),
        academic_year: '2024-2025',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      });
    });
  }
  return mockClasses;
}

function generateMockSyllabusData(): SyllabusData[] {
  return [
    {
      subject_id: 1,
      subject_name: 'Mathematics',
      chapters: [
        {
          id: 1,
          subject_id: 1,
          chapter_number: 1,
          title: 'Real Numbers',
          description: 'Introduction to real numbers, rational and irrational numbers',
          estimated_hours: 12,
          order: 1,
          topics: [
            {
              id: 1,
              chapter_id: 1,
              title: "Euclid's Division Lemma",
              description: "Understanding Euclid's division algorithm",
              estimated_hours: 4,
              order: 1,
            },
            {
              id: 2,
              chapter_id: 1,
              title: 'Fundamental Theorem of Arithmetic',
              description: 'Prime factorization and its applications',
              estimated_hours: 4,
              order: 2,
            },
            {
              id: 3,
              chapter_id: 1,
              title: 'Irrational Numbers',
              description: 'Properties and proofs of irrational numbers',
              estimated_hours: 4,
              order: 3,
            },
          ],
          objectives: [
            {
              id: 1,
              chapter_id: 1,
              objective: "Students will be able to apply Euclid's division lemma to find HCF",
              bloom_level: 'Apply',
              order: 1,
            },
            {
              id: 2,
              chapter_id: 1,
              objective: 'Students will understand the concept of prime factorization',
              bloom_level: 'Understand',
              order: 2,
            },
            {
              id: 3,
              chapter_id: 1,
              objective: 'Students will be able to prove that certain numbers are irrational',
              bloom_level: 'Analyze',
              order: 3,
            },
          ],
        },
        {
          id: 2,
          subject_id: 1,
          chapter_number: 2,
          title: 'Polynomials',
          description: 'Understanding polynomials, their types and operations',
          estimated_hours: 14,
          order: 2,
          topics: [
            {
              id: 4,
              chapter_id: 2,
              title: 'Degrees of Polynomials',
              description: 'Identifying linear, quadratic, cubic polynomials',
              estimated_hours: 3,
              order: 1,
            },
            {
              id: 5,
              chapter_id: 2,
              title: 'Zeros of Polynomials',
              description: 'Finding and understanding zeros',
              estimated_hours: 5,
              order: 2,
            },
            {
              id: 6,
              chapter_id: 2,
              title: 'Division Algorithm',
              description: 'Polynomial division and remainder theorem',
              estimated_hours: 6,
              order: 3,
            },
          ],
          objectives: [
            {
              id: 4,
              chapter_id: 2,
              objective: 'Students will be able to classify polynomials based on their degree',
              bloom_level: 'Remember',
              order: 1,
            },
            {
              id: 5,
              chapter_id: 2,
              objective: 'Students will be able to find zeros of polynomial equations',
              bloom_level: 'Apply',
              order: 2,
            },
            {
              id: 6,
              chapter_id: 2,
              objective: 'Students will evaluate polynomial relationships using division algorithm',
              bloom_level: 'Evaluate',
              order: 3,
            },
          ],
        },
      ],
    },
  ];
}
