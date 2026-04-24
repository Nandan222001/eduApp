import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  MenuBook as BookIcon,
  Topic as TopicIcon,
} from '@mui/icons-material';
import { academicApi } from '../api/academic';
import type {
  Syllabus,
  SyllabusCreate,
  Subject,
  Grade,
  Chapter,
  ChapterCreate,
  Topic,
  TopicCreate,
} from '../types/academic';

export const SyllabusManagement: React.FC = () => {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [syllabusFormData, setSyllabusFormData] = useState<SyllabusCreate>({
    subject_id: 0,
    grade_id: 0,
    title: '',
    description: '',
    academic_year: '',
  });

  const [chapterFormData, setChapterFormData] = useState<ChapterCreate>({
    subject_id: 0,
    name: '',
    chapter_number: 1,
    description: '',
    learning_objectives: [],
  });

  const [topicFormData, setTopicFormData] = useState<TopicCreate>({
    chapter_id: 0,
    name: '',
    description: '',
    duration_hours: undefined,
  });

  const [learningObjective, setLearningObjective] = useState('');

  useEffect(() => {
    loadSyllabi();
    loadSubjects();
    loadGrades();
  }, []);

  const loadSyllabi = async () => {
    try {
      setLoading(true);
      const data = await academicApi.getSyllabi();
      setSyllabi(data);
    } catch (error) {
      showSnackbar('Failed to load syllabi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await academicApi.getSubjects(true);
      setSubjects(data);
    } catch (error) {
      showSnackbar('Failed to load subjects', 'error');
    }
  };

  const loadGrades = async () => {
    try {
      const data = await academicApi.getGrades(true);
      setGrades(data);
    } catch (error) {
      showSnackbar('Failed to load grades', 'error');
    }
  };

  const loadChapters = async (subjectId: number) => {
    try {
      const data = await academicApi.getChapters(subjectId);
      setChapters(data);
    } catch (error) {
      showSnackbar('Failed to load chapters', 'error');
    }
  };

  const loadTopics = async (chapterId: number) => {
    try {
      const data = await academicApi.getTopics(chapterId);
      setTopics(data);
    } catch (error) {
      showSnackbar('Failed to load topics', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenSyllabusDialog = (syllabus?: Syllabus) => {
    if (syllabus) {
      setEditingSyllabus(syllabus);
      setSyllabusFormData({
        subject_id: syllabus.subject_id,
        grade_id: syllabus.grade_id,
        title: syllabus.title,
        description: syllabus.description || '',
        academic_year: syllabus.academic_year || '',
      });
    } else {
      setEditingSyllabus(null);
      setSyllabusFormData({
        subject_id: subjects[0]?.id || 0,
        grade_id: grades[0]?.id || 0,
        title: '',
        description: '',
        academic_year: new Date().getFullYear().toString(),
      });
    }
    setSyllabusDialogOpen(true);
  };

  const handleOpenChapterDialog = (chapter?: Chapter) => {
    if (!selectedSyllabus && !chapter) return;

    if (chapter) {
      setEditingChapter(chapter);
      setChapterFormData({
        subject_id: chapter.subject_id,
        name: chapter.name,
        chapter_number: chapter.chapter_number,
        description: chapter.description || '',
        learning_objectives: chapter.learning_objectives || [],
      });
    } else {
      setEditingChapter(null);
      const maxChapterNumber = chapters.reduce((max, ch) => Math.max(max, ch.chapter_number), 0);
      setChapterFormData({
        subject_id: selectedSyllabus!.subject_id,
        name: '',
        chapter_number: maxChapterNumber + 1,
        description: '',
        learning_objectives: [],
      });
    }
    setChapterDialogOpen(true);
  };

  const handleOpenTopicDialog = (topic?: Topic) => {
    if (!selectedChapter && !topic) return;

    if (topic) {
      setEditingTopic(topic);
      setTopicFormData({
        chapter_id: topic.chapter_id,
        name: topic.name,
        description: topic.description || '',
        duration_hours: topic.duration_hours,
      });
    } else {
      setEditingTopic(null);
      setTopicFormData({
        chapter_id: selectedChapter!.id,
        name: '',
        description: '',
        duration_hours: undefined,
      });
    }
    setTopicDialogOpen(true);
  };

  const handleSaveSyllabus = async () => {
    try {
      setLoading(true);
      if (editingSyllabus) {
        const updated = await academicApi.updateSyllabus(editingSyllabus.id, syllabusFormData);
        setSelectedSyllabus(updated);
        showSnackbar('Syllabus updated successfully', 'success');
      } else {
        const newSyllabus = await academicApi.createSyllabus(syllabusFormData);
        if (uploadFile) {
          await academicApi.uploadSyllabusFile(newSyllabus.id, uploadFile);
        }
        setSelectedSyllabus(newSyllabus);
        setChapters([]);
        setSelectedChapter(null);
        showSnackbar('Syllabus created successfully', 'success');
      }
      setSyllabusDialogOpen(false);
      setUploadFile(null);
      loadSyllabi();
    } catch (error) {
      showSnackbar('Failed to save syllabus', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChapter = async () => {
    try {
      setLoading(true);
      if (editingChapter) {
        await academicApi.updateChapter(editingChapter.id, chapterFormData);
        showSnackbar('Chapter updated successfully', 'success');
      } else {
        await academicApi.createChapter(chapterFormData);
        showSnackbar('Chapter created successfully', 'success');
      }
      setChapterDialogOpen(false);
      if (selectedSyllabus) {
        loadChapters(selectedSyllabus.subject_id);
      }
    } catch (error) {
      showSnackbar('Failed to save chapter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTopic = async () => {
    try {
      setLoading(true);
      if (editingTopic) {
        await academicApi.updateTopic(editingTopic.id, topicFormData);
        showSnackbar('Topic updated successfully', 'success');
      } else {
        await academicApi.createTopic(topicFormData);
        showSnackbar('Topic created successfully', 'success');
      }
      setTopicDialogOpen(false);
      if (selectedChapter) {
        loadTopics(selectedChapter.id);
      }
    } catch (error) {
      showSnackbar('Failed to save topic', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSyllabus = async (syllabus: Syllabus) => {
    if (!window.confirm(`Are you sure you want to delete ${syllabus.title}?`)) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteSyllabus(syllabus.id);
      showSnackbar('Syllabus deleted successfully', 'success');
      loadSyllabi();
      if (selectedSyllabus?.id === syllabus.id) {
        setSelectedSyllabus(null);
      }
    } catch (error) {
      showSnackbar('Failed to delete syllabus', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!window.confirm(`Are you sure you want to delete ${chapter.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteChapter(chapter.id);
      showSnackbar('Chapter deleted successfully', 'success');
      if (selectedSyllabus) {
        loadChapters(selectedSyllabus.subject_id);
      }
    } catch (error) {
      showSnackbar('Failed to delete chapter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    if (!window.confirm(`Are you sure you want to delete ${topic.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await academicApi.deleteTopic(topic.id);
      showSnackbar('Topic deleted successfully', 'success');
      if (selectedChapter) {
        loadTopics(selectedChapter.id);
      }
    } catch (error) {
      showSnackbar('Failed to delete topic', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSyllabus = async (syllabus: Syllabus) => {
    try {
      setLoading(true);
      const blob = await academicApi.downloadSyllabusFile(syllabus.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = syllabus.file_name || 'syllabus.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSnackbar('Syllabus downloaded successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to download syllabus', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSyllabus = async (syllabus: Syllabus) => {
    setSelectedSyllabus(syllabus);
    setSelectedChapter(null);
    await loadChapters(syllabus.subject_id);
  };

  const handleSelectChapter = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    await loadTopics(chapter.id);
  };

  const handleAddLearningObjective = () => {
    if (learningObjective.trim()) {
      setChapterFormData({
        ...chapterFormData,
        learning_objectives: [...(chapterFormData.learning_objectives || []), learningObjective],
      });
      setLearningObjective('');
    }
  };

  const handleRemoveLearningObjective = (index: number) => {
    const objectives = [...(chapterFormData.learning_objectives || [])];
    objectives.splice(index, 1);
    setChapterFormData({ ...chapterFormData, learning_objectives: objectives });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Syllabus & Curriculum Management
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Syllabi</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenSyllabusDialog()}
                size="small"
              >
                Add
              </Button>
            </Box>
            <Paper sx={{ p: 2 }}>
              <List>
                {syllabi.map((syllabus) => (
                  <ListItem
                    key={syllabus.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: selectedSyllabus?.id === syllabus.id ? 'action.selected' : 'inherit',
                    }}
                    onClick={() => handleSelectSyllabus(syllabus)}
                  >
                    <BookIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                    <ListItemText
                      primary={syllabus.title}
                      secondary={`${subjects.find((s) => s.id === syllabus.subject_id)?.name || ''} - ${
                        grades.find((g) => g.id === syllabus.grade_id)?.name || ''
                      }`}
                    />
                    <ListItemSecondaryAction>
                      {syllabus.file_url && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSyllabus(syllabus);
                          }}
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSyllabusDialog(syllabus);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSyllabus(syllabus);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {syllabi.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No syllabi found"
                      secondary="Click 'Add' to create a syllabus"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            {selectedSyllabus ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Chapters</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenChapterDialog()}
                    size="small"
                  >
                    Add
                  </Button>
                </Box>
                <Paper sx={{ p: 2 }}>
                  <List>
                    {chapters.map((chapter) => (
                      <ListItem
                        key={chapter.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          mb: 1,
                          borderRadius: 1,
                          bgcolor:
                            selectedChapter?.id === chapter.id ? 'action.selected' : 'inherit',
                        }}
                        onClick={() => handleSelectChapter(chapter)}
                      >
                        <Box sx={{ mr: 1.5 }}>
                          <Chip label={chapter.chapter_number} size="small" color="primary" />
                        </Box>
                        <ListItemText
                          primary={chapter.name}
                          secondary={
                            chapter.learning_objectives?.length
                              ? `${chapter.learning_objectives.length} objectives`
                              : 'No objectives'
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChapterDialog(chapter);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(chapter);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {chapters.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="No chapters found"
                          secondary="Click 'Add' to create a chapter"
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <BookIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a syllabus
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a syllabus to view its chapters
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            {selectedChapter ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Topics</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenTopicDialog()}
                    size="small"
                  >
                    Add
                  </Button>
                </Box>
                <Paper sx={{ p: 2 }}>
                  <List>
                    {topics.map((topic) => (
                      <ListItem key={topic.id} sx={{ mb: 1 }}>
                        <TopicIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                        <ListItemText
                          primary={topic.name}
                          secondary={topic.duration_hours ? `${topic.duration_hours} hours` : ''}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleOpenTopicDialog(topic)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDeleteTopic(topic)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {topics.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="No topics found"
                          secondary="Click 'Add' to create a topic"
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <TopicIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a chapter
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a chapter to view its topics
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        <Dialog
          open={syllabusDialogOpen}
          onClose={() => setSyllabusDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editingSyllabus ? 'Edit Syllabus' : 'Add Syllabus'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                value={syllabusFormData.title}
                onChange={(e) =>
                  setSyllabusFormData({ ...syllabusFormData, title: e.target.value })
                }
                sx={{ mb: 2 }}
                required
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={syllabusFormData.subject_id}
                  onChange={(e) =>
                    setSyllabusFormData({ ...syllabusFormData, subject_id: Number(e.target.value) })
                  }
                  label="Subject"
                  required
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={syllabusFormData.grade_id}
                  onChange={(e) =>
                    setSyllabusFormData({ ...syllabusFormData, grade_id: Number(e.target.value) })
                  }
                  label="Grade"
                  required
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Academic Year"
                value={syllabusFormData.academic_year}
                onChange={(e) =>
                  setSyllabusFormData({ ...syllabusFormData, academic_year: e.target.value })
                }
                placeholder="e.g., 2024"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={syllabusFormData.description}
                onChange={(e) =>
                  setSyllabusFormData({ ...syllabusFormData, description: e.target.value })
                }
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth>
                Upload Syllabus File
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </Button>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {uploadFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSyllabusDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveSyllabus} disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={chapterDialogOpen}
          onClose={() => setChapterDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add Chapter'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Chapter Name"
                    value={chapterFormData.name}
                    onChange={(e) =>
                      setChapterFormData({ ...chapterFormData, name: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Chapter Number"
                    type="number"
                    value={chapterFormData.chapter_number}
                    onChange={(e) =>
                      setChapterFormData({
                        ...chapterFormData,
                        chapter_number: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Description"
                value={chapterFormData.description}
                onChange={(e) =>
                  setChapterFormData({ ...chapterFormData, description: e.target.value })
                }
                multiline
                rows={3}
                sx={{ mt: 2, mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Learning Objectives
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a learning objective"
                  value={learningObjective}
                  onChange={(e) => setLearningObjective(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLearningObjective();
                    }
                  }}
                />
                <Button variant="outlined" onClick={handleAddLearningObjective}>
                  Add
                </Button>
              </Box>
              <List dense>
                {chapterFormData.learning_objectives?.map((objective, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveLearningObjective(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChapterDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveChapter} disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={topicDialogOpen}
          onClose={() => setTopicDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Topic Name"
                value={topicFormData.name}
                onChange={(e) => setTopicFormData({ ...topicFormData, name: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={topicFormData.duration_hours || ''}
                onChange={(e) =>
                  setTopicFormData({
                    ...topicFormData,
                    duration_hours: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={topicFormData.description}
                onChange={(e) =>
                  setTopicFormData({ ...topicFormData, description: e.target.value })
                }
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveTopic} disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default SyllabusManagement;
