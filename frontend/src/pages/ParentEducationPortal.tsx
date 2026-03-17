import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
  Rating,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  School,
  PlayCircle,
  Article,
  Quiz,
  CheckCircle,
  Lock,
  ExpandMore,
  Download,
  Forum,
  ThumbUp,
  Send,
  VideoLibrary,
  MenuBook,
  EmojiEvents,
  Search,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactPlayer from 'react-player';

interface Course {
  id: number;
  title: string;
  description: string;
  short_description: string;
  category: string;
  level: string;
  thumbnail_url?: string;
  duration_hours: number;
  learning_objectives: string[];
  is_free: boolean;
  price?: number;
  certificate_enabled: boolean;
  total_enrollments: number;
  average_rating?: number;
  total_reviews: number;
  status: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content_type: string;
  video_url?: string;
  video_duration_seconds?: number;
  article_content?: string;
  pdf_url?: string;
  is_preview: boolean;
  is_completed?: boolean;
}

interface Enrollment {
  id: number;
  course_id: number;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  certificate_url?: string;
  last_accessed_at?: string;
}

const COURSE_CATEGORIES = [
  { value: 'parenting', label: 'Parenting', icon: '👨‍👩‍👧‍👦' },
  { value: 'child_development', label: 'Child Development', icon: '🧒' },
  { value: 'academic_support', label: 'Academic Support', icon: '📚' },
  { value: 'special_education', label: 'Special Education', icon: '♿' },
  { value: 'health_wellness', label: 'Health & Wellness', icon: '🏥' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'college_prep', label: 'College Preparation', icon: '🎓' },
  { value: 'social_emotional', label: 'Social-Emotional Learning', icon: '❤️' },
];

export const ParentEducationPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, unknown>>({});

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['parent-courses', categoryFilter, searchQuery],
    queryFn: async () => {
      // API call to fetch courses
      return [] as Course[];
    },
  });

  // Fetch enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['course-enrollments'],
    queryFn: async () => {
      // API call to fetch enrollments
      return [] as Enrollment[];
    },
  });

  // Fetch course details
  const { data: courseDetails } = useQuery({
    queryKey: ['course-details', selectedCourse?.id],
    queryFn: async () => {
      // API call to fetch course modules and lessons
      return { modules: [] as Module[] };
    },
    enabled: !!selectedCourse,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (_courseId: number) => {
      // API call to enroll in course
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (_data: { lessonId: number; progress: number }) => {
      // API call to update lesson progress
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (_data: { quizId: number; answers: Record<number, unknown> }) => {
      // API call to submit quiz
      return { score: 85, passed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
      setQuizDialogOpen(false);
    },
  });

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setCourseDialogOpen(true);
  };

  const handleEnroll = (courseId: number) => {
    enrollMutation.mutate(courseId);
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleCompleteLesson = () => {
    if (selectedLesson) {
      updateProgressMutation.mutate({
        lessonId: selectedLesson.id,
        progress: 100,
      });
      setLessonDialogOpen(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = COURSE_CATEGORIES.find((c) => c.value === category);
    return cat?.icon || '📚';
  };

  if (coursesLoading || enrollmentsLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            <School sx={{ mr: 1, verticalAlign: 'middle' }} />
            Parent Education Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enhance your parenting skills with courses, videos, and resources from education experts
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
          <Tab label="Catalog" icon={<MenuBook />} iconPosition="start" />
          <Tab label="My Courses" icon={<VideoLibrary />} iconPosition="start" />
          <Tab label="Certificates" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Discussions" icon={<Forum />} iconPosition="start" />
        </Tabs>

        {/* Catalog Tab */}
        {selectedTab === 0 && (
          <>
            {/* Search and Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {COURSE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Course Grid */}
            <Grid container spacing={3}>
              {courses && courses.length > 0 ? (
                courses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={course.thumbnail_url || '/placeholder-course.jpg'}
                        alt={course.title}
                        sx={{ bgcolor: 'grey.200' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={getCategoryIcon(course.category)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={course.level}
                            size="small"
                            color={getLevelColor(course.level)}
                          />
                          {course.is_free && <Chip label="Free" size="small" color="success" />}
                        </Box>
                        <Typography variant="h6" gutterBottom noWrap>
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {course.short_description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Rating value={course.average_rating || 0} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary">
                            ({course.total_reviews})
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {course.duration_hours} hours • {course.total_enrollments} enrolled
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => handleCourseClick(course)}
                          fullWidth
                          variant="outlined"
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No courses found. Try adjusting your search or filters.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* My Courses Tab */}
        {selectedTab === 1 && (
          <Grid container spacing={3}>
            {enrollments && enrollments.length > 0 ? (
              enrollments.map((enrollment) => {
                const course = courses?.find((c) => c.id === enrollment.course_id);
                if (!course) return null;

                return (
                  <Grid item xs={12} key={enrollment.id}>
                    <Card>
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={3}>
                            <CardMedia
                              component="img"
                              image={course.thumbnail_url || '/placeholder-course.jpg'}
                              alt={course.title}
                              sx={{ borderRadius: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={9}>
                            <Typography variant="h5" gutterBottom>
                              {course.title}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Progress: {enrollment.completed_lessons} /{' '}
                                {enrollment.total_lessons} lessons completed
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={enrollment.progress_percentage}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {Math.round(enrollment.progress_percentage)}% complete
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                variant="contained"
                                startIcon={<PlayCircle />}
                                onClick={() => handleCourseClick(course)}
                              >
                                Continue Learning
                              </Button>
                              {enrollment.certificate_url && (
                                <Button
                                  variant="outlined"
                                  startIcon={<Download />}
                                  href={enrollment.certificate_url}
                                >
                                  Download Certificate
                                </Button>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  You haven&apos;t enrolled in any courses yet. Browse the catalog to get started!
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* Certificates Tab */}
        {selectedTab === 2 && (
          <Grid container spacing={3}>
            {enrollments
              ?.filter((e) => e.certificate_url)
              .map((enrollment) => {
                const course = courses?.find((c) => c.id === enrollment.course_id);
                if (!course) return null;

                return (
                  <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                    <Card>
                      <CardContent>
                        <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Completed with {enrollment.progress_percentage}% score
                        </Typography>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Download />}
                          href={enrollment.certificate_url}
                          sx={{ mt: 2 }}
                        >
                          Download Certificate
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            {(!enrollments || enrollments.filter((e) => e.certificate_url).length === 0) && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Complete courses to earn certificates and showcase your achievements!
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* Discussions Tab */}
        {selectedTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Discussions
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Connect with other parents, share experiences, and get support from the community
            </Alert>
            <List>
              {[1, 2, 3].map((post) => (
                <React.Fragment key={post}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <Avatar>P</Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">
                            How to support struggling readers?
                          </Typography>
                          <Box>
                            <IconButton size="small">
                              <ThumbUp fontSize="small" />
                            </IconButton>
                            <Typography variant="caption">12</Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Posted by Parent User • 2 hours ago
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            My child is having trouble with reading comprehension. Any tips from
                            other parents?
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                placeholder="Start a new discussion..."
                multiline
                rows={3}
                variant="outlined"
              />
              <Button variant="contained" startIcon={<Send />} sx={{ mt: 2 }}>
                Post
              </Button>
            </Box>
          </Paper>
        )}

        {/* Course Details Dialog */}
        <Dialog
          open={courseDialogOpen}
          onClose={() => setCourseDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedCourse && (
            <>
              <DialogTitle>
                <Typography variant="h5">{selectedCourse.title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Rating value={selectedCourse.average_rating || 0} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    ({selectedCourse.total_reviews} reviews)
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedCourse.description}
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Learning Objectives
                </Typography>
                <List>
                  {selectedCourse.learning_objectives?.map((obj, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={obj} />
                    </ListItem>
                  ))}
                </List>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Course Content
                </Typography>
                {courseDetails?.modules.map((module, index) => (
                  <Accordion key={module.id}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {index + 1}. {module.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {module.lessons.map((lesson) => (
                          <ListItem
                            key={lesson.id}
                            button
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <ListItemIcon>
                              {lesson.content_type === 'video' ? <PlayCircle /> : <Article />}
                            </ListItemIcon>
                            <ListItemText
                              primary={lesson.title}
                              secondary={
                                lesson.video_duration_seconds
                                  ? `${Math.round(lesson.video_duration_seconds / 60)} min`
                                  : null
                              }
                            />
                            {lesson.is_completed && <CheckCircle color="success" />}
                            {!lesson.is_preview && !lesson.is_completed && (
                              <Lock color="disabled" />
                            )}
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setCourseDialogOpen(false)}>Close</Button>
                <Button
                  variant="contained"
                  onClick={() => handleEnroll(selectedCourse.id)}
                  disabled={enrollMutation.isPending}
                >
                  {selectedCourse.is_free ? 'Enroll Now' : `Enroll - $${selectedCourse.price}`}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Lesson Player Dialog */}
        <Dialog
          open={lessonDialogOpen}
          onClose={() => setLessonDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          {selectedLesson && (
            <>
              <DialogTitle>{selectedLesson.title}</DialogTitle>
              <DialogContent>
                {selectedLesson.content_type === 'video' && selectedLesson.video_url && (
                  <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 2 }}>
                    <ReactPlayer
                      url={selectedLesson.video_url}
                      controls
                      width="100%"
                      height="100%"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                      onProgress={(progress) => {
                        // Track video progress
                        updateProgressMutation.mutate({
                          lessonId: selectedLesson.id,
                          progress: Math.round(progress.played * 100),
                        });
                      }}
                    />
                  </Box>
                )}
                {selectedLesson.content_type === 'article' && selectedLesson.article_content && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" component="div">
                      <div dangerouslySetInnerHTML={{ __html: selectedLesson.article_content }} />
                    </Typography>
                  </Box>
                )}
                {selectedLesson.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedLesson.description}
                  </Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setLessonDialogOpen(false)}>Close</Button>
                <Button variant="contained" onClick={handleCompleteLesson}>
                  Mark as Complete
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Quiz />}
                  onClick={() => setQuizDialogOpen(true)}
                >
                  Take Quiz
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Quiz Dialog */}
        <Dialog
          open={quizDialogOpen}
          onClose={() => setQuizDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Lesson Quiz</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Complete this quiz to test your understanding. Passing score: 70%
            </Alert>
            <Typography variant="h6" gutterBottom>
              Question {currentQuestionIndex + 1}
            </Typography>
            <Typography variant="body1" paragraph>
              Sample quiz question text goes here?
            </Typography>
            <FormControl component="fieldset" fullWidth>
              {['Option A', 'Option B', 'Option C', 'Option D'].map((option, index) => (
                <Button
                  key={index}
                  variant={quizAnswers[currentQuestionIndex] === index ? 'contained' : 'outlined'}
                  fullWidth
                  sx={{ mb: 1, justifyContent: 'flex-start' }}
                  onClick={() => setQuizAnswers({ ...quizAnswers, [currentQuestionIndex]: index })}
                >
                  {option}
                </Button>
              ))}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuizDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => submitQuizMutation.mutate({ quizId: 1, answers: quizAnswers })}
            >
              Submit Quiz
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ParentEducationPortal;
