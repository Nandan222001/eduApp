import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Chip,
  Button,
  TextField,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  PlayCircle as PlayIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Quiz as QuizIcon,
  Article as ArticleIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  parentEducationApi,
  Lesson as ApiLesson,
  QuizAttempt as ApiQuizAttempt,
  QuizQuestion as ApiQuizQuestion,
  CourseMaterial,
  Note,
} from '@/api/parentEducation';
import { LessonType } from '@/types/parentEducation';
import { useToast } from '@/hooks/useToast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ParentCourseLearning: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<ApiQuizAttempt | null>(null);
  const [discussionContent, setDiscussionContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment-detail', enrollmentId],
    queryFn: () => parentEducationApi.getEnrollmentDetail(Number(enrollmentId)),
    enabled: !!enrollmentId,
  });

  const { data: currentLesson } = useQuery({
    queryKey: ['lesson', selectedLessonId],
    queryFn: () => parentEducationApi.getLesson(selectedLessonId!),
    enabled: !!selectedLessonId,
  });

  const { data: lessonMaterials = [] } = useQuery({
    queryKey: ['lesson-materials', selectedLessonId],
    queryFn: () => parentEducationApi.getLessonMaterials(selectedLessonId!),
    enabled: !!selectedLessonId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', enrollmentId, selectedLessonId],
    queryFn: () => parentEducationApi.getNotes(Number(enrollmentId), selectedLessonId || undefined),
    enabled: !!enrollmentId,
  });

  const { data: quizQuestions = [] } = useQuery({
    queryKey: ['quiz-questions', selectedLessonId],
    queryFn: () => parentEducationApi.getQuizQuestions(selectedLessonId!),
    enabled: !!selectedLessonId && (currentLesson as ApiLesson)?.type === LessonType.VIDEO,
  });

  const { data: discussions = [] } = useQuery({
    queryKey: ['discussions', enrollment?.course_id],
    queryFn: () => parentEducationApi.getDiscussionThreads(enrollment!.course_id),
    enabled: !!enrollment?.course_id,
  });

  const { data: threadReplies = [] } = useQuery({
    queryKey: ['thread-replies', selectedThreadId],
    queryFn: () => parentEducationApi.getThreadReplies(selectedThreadId!),
    enabled: !!selectedThreadId,
  });

  useEffect(() => {
    if (
      enrollment?.course &&
      'lessons' in enrollment.course &&
      enrollment.course.lessons &&
      !selectedLessonId
    ) {
      const nextLesson =
        enrollment.course.lessons.find((l) => l.id === enrollment.current_lesson?.id) ||
        enrollment.course.lessons[0];
      if (nextLesson) {
        setSelectedLessonId(nextLesson.id);
      }
    }
  }, [enrollment, selectedLessonId]);

  const completeMutation = useMutation({
    mutationFn: (lessonId: number) =>
      parentEducationApi.markLessonComplete(Number(enrollmentId), lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-detail', enrollmentId] });
      toast.success('Lesson completed!');
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: { lesson_id?: number; content: string; timestamp_seconds?: number }) =>
      parentEducationApi.createNote(Number(enrollmentId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setNoteContent('');
      toast.success('Note saved!');
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: number; content: string }) =>
      parentEducationApi.updateNote(noteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingNoteId(null);
      setNoteContent('');
      toast.success('Note updated!');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => parentEducationApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted!');
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: (answers: Record<number, string>) =>
      parentEducationApi.submitQuiz(selectedLessonId!, answers),
    onSuccess: (result: ApiQuizAttempt) => {
      setQuizResult(result);
      if (result.is_passed) {
        completeMutation.mutate(selectedLessonId!);
      }
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      parentEducationApi.createDiscussionThread(enrollment!.course_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      setDiscussionContent('');
      toast.success('Discussion posted!');
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: (data: { threadId: number; content: string }) =>
      parentEducationApi.createThreadReply(data.threadId, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-replies'] });
      setReplyContent('');
      toast.success('Reply posted!');
    },
  });

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && selectedLessonId) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progress = (currentTime / duration) * 100;

      if (progress > 90 && !isLessonCompleted(selectedLessonId)) {
        completeMutation.mutate(selectedLessonId);
      }
    }
  };

  const handleSaveNote = () => {
    if (!noteContent.trim() || !selectedLessonId) return;

    if (editingNoteId) {
      updateNoteMutation.mutate({ noteId: editingNoteId, content: noteContent });
    } else {
      const timestamp = videoRef.current?.currentTime;
      createNoteMutation.mutate({
        lesson_id: selectedLessonId,
        content: noteContent,
        timestamp_seconds: timestamp,
      });
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
  };

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleQuizSubmit = () => {
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      toast.error('Please answer all questions');
      return;
    }
    submitQuizMutation.mutate(quizAnswers);
  };

  const handleDownloadMaterial = async (material: CourseMaterial) => {
    window.open(material.file_url, '_blank');
  };

  const isLessonCompleted = (lessonId: number) => {
    return enrollment?.lesson_progress?.some((p) => p.lesson_id === lessonId && p.is_completed);
  };

  const getLessonIcon = (type: LessonType) => {
    switch (type) {
      case LessonType.VIDEO:
        return <PlayIcon />;
      case LessonType.QUIZ:
        return <QuizIcon />;
      case LessonType.ARTICLE:
        return <ArticleIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  if (enrollmentLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!enrollment) {
    return (
      <Container>
        <Alert severity="error">Enrollment not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Lesson Sidebar */}
      <Paper
        sx={{
          width: 320,
          borderRadius: 0,
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {enrollment.course?.title || 'Course'}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {enrollment.progress_percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={enrollment.progress_percentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {enrollment.completed_lessons} of {enrollment.total_lessons} lessons completed
          </Typography>
        </Box>

        <Divider />

        <List sx={{ p: 0 }}>
          {enrollment.course?.lessons?.map((lesson: ApiLesson, index: number) => {
            const isCompleted = isLessonCompleted(lesson.id);
            const isActive = lesson.id === selectedLessonId;

            return (
              <ListItem key={lesson.id} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  sx={{
                    py: 1.5,
                    borderLeft: 3,
                    borderColor: isActive ? 'primary.main' : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {isCompleted ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      getLessonIcon(lesson.type as LessonType)
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={isActive ? 600 : 400}>
                        {index + 1}. {lesson.title}
                      </Typography>
                    }
                    secondary={
                      lesson.video_url && (
                        <Typography variant="caption" color="text.secondary">
                          Video
                        </Typography>
                      )
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {currentLesson && (
            <>
              {/* Lesson Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {(currentLesson as ApiLesson).title}
                </Typography>
                {(currentLesson as ApiLesson).description && (
                  <Typography variant="body1" color="text.secondary">
                    {(currentLesson as ApiLesson).description}
                  </Typography>
                )}
              </Box>

              {/* Video Player */}
              {(currentLesson as ApiLesson).type === 'video' &&
                (currentLesson as ApiLesson).video_url && (
                  <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                    <video
                      ref={videoRef}
                      controls
                      style={{ width: '100%', maxHeight: '500px', display: 'block' }}
                      onTimeUpdate={handleVideoTimeUpdate}
                      src={(currentLesson as ApiLesson).video_url}
                    />
                    {showTranscript && (currentLesson as ApiLesson).transcript && (
                      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom>
                          Transcript
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {(currentLesson as ApiLesson).transcript}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                      {(currentLesson as ApiLesson).transcript && (
                        <Button
                          variant="outlined"
                          onClick={() => setShowTranscript(!showTranscript)}
                        >
                          {showTranscript ? 'Hide' : 'Show'} Transcript
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => completeMutation.mutate((currentLesson as ApiLesson).id)}
                        disabled={isLessonCompleted((currentLesson as ApiLesson).id)}
                      >
                        {isLessonCompleted((currentLesson as ApiLesson).id)
                          ? 'Completed'
                          : 'Mark as Complete'}
                      </Button>
                    </Box>
                  </Paper>
                )}

              {/* Article Content */}
              {(currentLesson as ApiLesson).type === 'article' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: (currentLesson as ApiLesson).content || '' }}
                  />
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => completeMutation.mutate((currentLesson as ApiLesson).id)}
                      disabled={isLessonCompleted((currentLesson as ApiLesson).id)}
                    >
                      {isLessonCompleted((currentLesson as ApiLesson).id)
                        ? 'Completed'
                        : 'Mark as Complete'}
                    </Button>
                  </Box>
                </Paper>
              )}

              {/* Quiz */}
              {(currentLesson as ApiLesson).type === 'quiz' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quiz
                  </Typography>
                  <Button variant="contained" onClick={() => setQuizDialogOpen(true)}>
                    {quizResult ? 'Retake Quiz' : 'Start Quiz'}
                  </Button>
                  {quizResult && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity={quizResult.is_passed ? 'success' : 'warning'}>
                        Score: {quizResult.score}%
                        {quizResult.is_passed ? ' - Passed!' : ' - Try again'}
                      </Alert>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Tabs Section */}
              <Paper sx={{ mb: 3 }}>
                <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
                  <Tab label="Materials" />
                  <Tab label="Notes" />
                  <Tab label="Discussion" />
                </Tabs>

                {/* Materials Tab */}
                <TabPanel value={currentTab} index={0}>
                  {lessonMaterials.length === 0 ? (
                    <Typography color="text.secondary">No materials available</Typography>
                  ) : (
                    <List>
                      {lessonMaterials.map((material: CourseMaterial) => (
                        <ListItem
                          key={material.id}
                          secondaryAction={
                            <IconButton onClick={() => handleDownloadMaterial(material)}>
                              <DownloadIcon />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            <DescriptionIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={material.title}
                            secondary={`${material.file_type} - ${(material.file_size_bytes / 1024).toFixed(1)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </TabPanel>

                {/* Notes Tab */}
                <TabPanel value={currentTab} index={1}>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Add a note..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleSaveNote}
                        disabled={!noteContent.trim()}
                      >
                        {editingNoteId ? 'Update Note' : 'Save Note'}
                      </Button>
                      {editingNoteId && (
                        <Button
                          onClick={() => {
                            setEditingNoteId(null);
                            setNoteContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <List>
                    {notes.map((note: Note) => (
                      <Card key={note.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(note.created_at).toLocaleString()}
                              {note.timestamp_seconds &&
                                ` - ${Math.floor(note.timestamp_seconds / 60)}:${String(Math.floor(note.timestamp_seconds % 60)).padStart(2, '0')}`}
                            </Typography>
                            <Box>
                              <IconButton size="small" onClick={() => handleEditNote(note)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteNote(note.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          <Typography variant="body2">{note.content}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </List>
                </TabPanel>

                {/* Discussion Tab */}
                <TabPanel value={currentTab} index={2}>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Start a discussion..."
                      value={discussionContent}
                      onChange={(e) => setDiscussionContent(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      sx={{ mt: 1 }}
                      onClick={() =>
                        createThreadMutation.mutate({
                          title: 'Discussion',
                          content: discussionContent,
                        })
                      }
                      disabled={!discussionContent.trim()}
                    >
                      Post
                    </Button>
                  </Box>

                  <List>
                    {discussions.map((thread) => (
                      <Card key={thread.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar src={thread.parent_photo_url} sx={{ width: 32, height: 32 }}>
                              {thread.parent_name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{thread.parent_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(thread.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {thread.content}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() =>
                              setSelectedThreadId(selectedThreadId === thread.id ? null : thread.id)
                            }
                          >
                            {thread.reply_count} replies
                          </Button>

                          <Collapse in={selectedThreadId === thread.id}>
                            <Box sx={{ mt: 2, pl: 4 }}>
                              {threadReplies.map((reply) => (
                                <Box key={reply.id} sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <Avatar
                                      src={reply.user_photo_url}
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {(reply.user_name || 'U').charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="caption" fontWeight={600}>
                                        {reply.user_name}
                                        {reply.user_role === 'teacher' && (
                                          <Chip
                                            label="Teacher"
                                            size="small"
                                            sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                                          />
                                        )}
                                      </Typography>
                                      <Typography variant="body2">{reply.content}</Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                InputProps={{
                                  endAdornment: (
                                    <IconButton
                                      onClick={() => {
                                        createReplyMutation.mutate({
                                          threadId: thread.id,
                                          content: replyContent,
                                        });
                                      }}
                                      disabled={!replyContent.trim()}
                                    >
                                      <SendIcon />
                                    </IconButton>
                                  ),
                                }}
                              />
                            </Box>
                          </Collapse>
                        </CardContent>
                      </Card>
                    ))}
                  </List>
                </TabPanel>
              </Paper>
            </>
          )}
        </Container>
      </Box>

      {/* Quiz Dialog */}
      <Dialog
        open={quizDialogOpen}
        onClose={() => setQuizDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Quiz
          <IconButton
            onClick={() => setQuizDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {quizQuestions.map((question: ApiQuizQuestion, index: number) => (
            <Box key={question.id} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {index + 1}. {question.question_text}
              </Typography>
              <RadioGroup
                value={quizAnswers[question.id] || ''}
                onChange={(e) => setQuizAnswers({ ...quizAnswers, [question.id]: e.target.value })}
              >
                {question.question_type === 'multiple_choice' &&
                  question.options?.map((option: { id: string; text: string }, i: number) => (
                    <FormControlLabel
                      key={i}
                      value={option.id}
                      control={<Radio />}
                      label={option.text}
                    />
                  ))}
                {question.question_type === 'true_false' && (
                  <>
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </>
                )}
              </RadioGroup>
              {quizResult && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {question.explanation || 'Question completed'}
                </Alert>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuizSubmit} disabled={!quizResult}>
            {quizResult ? 'Close' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentCourseLearning;
