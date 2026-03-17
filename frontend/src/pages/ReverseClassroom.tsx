import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Divider,
  List,
  ListItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import TeachingInterface from '@/components/reverseClassroom/TeachingInterface';
import AnalysisResult from '@/components/reverseClassroom/AnalysisResult';
import ChallengeSelector from '@/components/reverseClassroom/ChallengeSelector';
import reverseClassroomApi from '@/api/reverseClassroom';
import {
  Subject,
  Chapter,
  Topic,
  ChatMessage,
  TeachingSession,
  ConceptAnalysis,
  DifficultyLevel,
  TopicProgress,
  TeachingBadge,
} from '@/types/reverseClassroom';
import { useAuth } from '@/hooks/useAuth';

export default function ReverseClassroom() {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syllabusLoading, setSyllabusLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | undefined>(
    undefined
  );
  const [activeSession, setActiveSession] = useState<TeachingSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<ConceptAnalysis | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [teachingBadges, setTeachingBadges] = useState<TeachingBadge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [endSessionDialog, setEndSessionDialog] = useState(false);
  const [newBadgesDialog, setNewBadgesDialog] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<TeachingBadge[]>([]);

  useEffect(() => {
    loadSyllabusAndProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSyllabusAndProgress = async () => {
    try {
      setSyllabusLoading(true);
      const studentId = user?.id ? parseInt(user.id, 10) : 1;

      const [syllabusData, progressData, badgesData] = await Promise.all([
        reverseClassroomApi.getSyllabusTopics(studentId),
        reverseClassroomApi.getTopicProgress(studentId),
        reverseClassroomApi.getTeachingBadges(studentId),
      ]);

      setSubjects(syllabusData);
      setTopicProgress(progressData);
      setTeachingBadges(badgesData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load syllabus data. Using mock data for demonstration.');

      const mockSubjects: Subject[] = [
        {
          id: 1,
          name: 'Mathematics',
          code: 'MATH101',
          chapters: [
            {
              id: 1,
              subject_id: 1,
              chapter_number: 1,
              title: 'Calculus',
              estimated_hours: 20,
              order: 1,
              topics: [
                {
                  id: 1,
                  chapter_id: 1,
                  title: 'Limits and Continuity',
                  estimated_hours: 4,
                  order: 1,
                },
                {
                  id: 2,
                  chapter_id: 1,
                  title: 'Derivatives',
                  estimated_hours: 6,
                  order: 2,
                },
                {
                  id: 3,
                  chapter_id: 1,
                  title: 'Integration',
                  estimated_hours: 6,
                  order: 3,
                },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'Physics',
          code: 'PHY101',
          chapters: [
            {
              id: 2,
              subject_id: 2,
              chapter_number: 1,
              title: 'Mechanics',
              estimated_hours: 18,
              order: 1,
              topics: [
                {
                  id: 4,
                  chapter_id: 2,
                  title: "Newton's Laws of Motion",
                  estimated_hours: 5,
                  order: 1,
                },
                {
                  id: 5,
                  chapter_id: 2,
                  title: 'Work, Energy and Power',
                  estimated_hours: 4,
                  order: 2,
                },
              ],
            },
          ],
        },
      ];

      const mockProgress: TopicProgress[] = [
        {
          topic_id: 1,
          topic_name: 'Limits and Continuity',
          mastery_level: 65,
          sessions_count: 3,
          trend: 'up',
        },
        {
          topic_id: 2,
          topic_name: 'Derivatives',
          mastery_level: 45,
          sessions_count: 2,
          trend: 'stable',
        },
      ];

      setSubjects(mockSubjects);
      setTopicProgress(mockProgress);
    } finally {
      setSyllabusLoading(false);
    }
  };

  const getTopicById = (topicId: number): Topic | null => {
    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const topic = chapter.topics.find((t) => t.id === topicId);
        if (topic) return topic;
      }
    }
    return null;
  };

  const handleStartSession = async () => {
    if (!selectedTopic) return;

    try {
      setLoading(true);
      const studentId = user?.id ? parseInt(user.id, 10) : 1;

      const session = await reverseClassroomApi.startTeachingSession(
        studentId,
        selectedTopic,
        selectedDifficulty
      );

      setActiveSession(session);
      setMessages([
        {
          id: '1',
          role: 'ai',
          content: `Hi! I'm really confused about "${getTopicById(selectedTopic)?.title}". Can you explain it to me? I'm having trouble understanding the basics.`,
          timestamp: new Date(),
        },
      ]);
      setAnalysis(null);
      setError(null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start teaching session. Using mock session.');

      const mockSession: TeachingSession = {
        id: 'mock-session-' + Date.now(),
        topic_id: selectedTopic,
        topic_name: getTopicById(selectedTopic)?.title || 'Topic',
        started_at: new Date(),
        messages: [],
        difficulty_level: selectedDifficulty,
      };

      setActiveSession(mockSession);
      setMessages([
        {
          id: '1',
          role: 'ai',
          content: `Hi! I'm really confused about "${getTopicById(selectedTopic)?.title}". Can you explain it to me? I'm having trouble understanding the basics.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string, isVoice: boolean = false) => {
    if (!activeSession) return;

    const studentMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'student',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, studentMessage]);
    setLoading(true);

    try {
      const response = await reverseClassroomApi.sendMessage(activeSession.id, message, isVoice);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.ai_response,
        timestamp: new Date(),
        confusion_markers: response.confusion_detected,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);

      const mockAiResponses = [
        "Hmm, I'm still a bit confused. Can you explain that part about the definition again?",
        "Oh, I think I'm starting to get it! But what about when we apply this in practice?",
        'That makes sense! Can you give me an example to help me understand better?',
        "Wait, I don't understand how that relates to what we learned before. Can you clarify?",
        'Great explanation! I think I understand now. Can you test my understanding?',
      ];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: mockAiResponses[Math.floor(Math.random() * mockAiResponses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      const result = await reverseClassroomApi.endSession(activeSession.id);

      setAnalysis(result.analysis);
      if (result.badges_earned && result.badges_earned.length > 0) {
        setEarnedBadges(result.badges_earned);
        setNewBadgesDialog(true);
      }
      setEndSessionDialog(false);
      await loadSyllabusAndProgress();
    } catch (err) {
      console.error('Error ending session:', err);

      const mockAnalysis: ConceptAnalysis = {
        correctly_explained: ['Basic Definition', 'Key Properties', 'Real-world Application'],
        missing_concepts: ['Advanced Theory', 'Edge Cases'],
        confused_concepts: ['Mathematical Notation'],
        understanding_score: Math.floor(Math.random() * 40) + 50,
      };

      setAnalysis(mockAnalysis);
      setEndSessionDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setActiveSession(null);
    setMessages([]);
    setAnalysis(null);
    setSelectedTopic(null);
    setSelectedDifficulty(undefined);
  };

  const getAvailableChapters = (): Chapter[] => {
    if (!selectedSubject) return [];
    const subject = subjects.find((s) => s.id === selectedSubject);
    return subject?.chapters || [];
  };

  const getAvailableTopics = (): Topic[] => {
    if (!selectedChapter) return [];
    const chapters = getAvailableChapters();
    const chapter = chapters.find((c) => c.id === selectedChapter);
    return chapter?.topics || [];
  };

  const getTopicProgressData = (topicId: number): TopicProgress | null => {
    return topicProgress.find((p) => p.topic_id === topicId) || null;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      default:
        return <StableIcon sx={{ color: theme.palette.grey[500], fontSize: 16 }} />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9C27B0';
      case 'rare':
        return '#2196F3';
      default:
        return theme.palette.grey[500];
    }
  };

  if (syllabusLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Reverse Classroom
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Teach the AI to master your understanding! The best way to learn is to teach.
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {!activeSession ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Select a Topic to Teach
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a topic from your current syllabus and get ready to explain it!
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={selectedSubject || ''}
                      onChange={(e) => {
                        setSelectedSubject(e.target.value as number);
                        setSelectedChapter(null);
                        setSelectedTopic(null);
                      }}
                      label="Subject"
                    >
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedSubject}>
                    <InputLabel>Chapter</InputLabel>
                    <Select
                      value={selectedChapter || ''}
                      onChange={(e) => {
                        setSelectedChapter(e.target.value as number);
                        setSelectedTopic(null);
                      }}
                      label="Chapter"
                    >
                      {getAvailableChapters().map((chapter) => (
                        <MenuItem key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedChapter}>
                    <InputLabel>Topic</InputLabel>
                    <Select
                      value={selectedTopic || ''}
                      onChange={(e) => setSelectedTopic(e.target.value as number)}
                      label="Topic"
                    >
                      {getAvailableTopics().map((topic) => {
                        const progress = getTopicProgressData(topic.id);
                        return (
                          <MenuItem key={topic.id} value={topic.id}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                              }}
                            >
                              <span>{topic.title}</span>
                              {progress && (
                                <Chip
                                  label={`${progress.mastery_level}%`}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {selectedTopic && (
                <Box sx={{ mt: 4 }}>
                  <ChallengeSelector
                    selectedDifficulty={selectedDifficulty}
                    onSelectDifficulty={setSelectedDifficulty}
                  />
                </Box>
              )}

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<StartIcon />}
                  onClick={handleStartSession}
                  disabled={!selectedTopic || loading}
                  sx={{ minWidth: 200 }}
                >
                  Start Teaching
                </Button>
              </Box>
            </Paper>
          ) : (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Teaching: {activeSession.topic_name}
                  </Typography>
                  {selectedDifficulty && (
                    <Chip label={`Difficulty: ${selectedDifficulty}`} size="small" sx={{ mt: 1 }} />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={() => setEndSessionDialog(true)}
                  disabled={loading}
                >
                  End Session
                </Button>
              </Paper>

              <Box sx={{ height: '600px' }}>
                <TeachingInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={loading}
                  aiPersona={{
                    name: 'AI Student',
                    confusion_level:
                      messages.length < 3 ? 'high' : messages.length < 6 ? 'medium' : 'low',
                  }}
                />
              </Box>

              {analysis && (
                <Box sx={{ mt: 3 }}>
                  <AnalysisResult analysis={analysis} />
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button variant="outlined" onClick={handleResetSession}>
                      Teach Another Topic
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setAnalysis(null);
                        setMessages([
                          {
                            id: '1',
                            role: 'ai',
                            content:
                              "Great! Let's try again. Can you explain it differently this time?",
                            timestamp: new Date(),
                          },
                        ]);
                      }}
                    >
                      Try Again
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Your Progress
            </Typography>
            <Divider sx={{ my: 2 }} />
            {topicProgress.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 3 }}
              >
                Start teaching to track your progress!
              </Typography>
            ) : (
              <List>
                {topicProgress.slice(0, 5).map((progress) => (
                  <ListItem key={progress.topic_id} sx={{ px: 0 }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {progress.topic_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getTrendIcon(progress.trend)}
                          <Typography variant="body2" fontWeight={700}>
                            {progress.mastery_level}%
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress.mastery_level}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          mb: 0.5,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {progress.sessions_count} sessions
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrophyIcon sx={{ color: theme.palette.warning.main }} />
              <Typography variant="h6" fontWeight={700}>
                Teaching Badges
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            {teachingBadges.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 3 }}
              >
                Earn badges by teaching effectively!
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {teachingBadges.slice(0, 6).map((badge) => (
                  <Grid item xs={4} key={badge.id}>
                    <Tooltip title={badge.description}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          border: `2px solid ${getRarityColor(badge.rarity)}`,
                          borderRadius: 2,
                          cursor: 'pointer',
                        }}
                      >
                        <Avatar
                          src={badge.icon_url}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha(getRarityColor(badge.rarity), 0.1),
                            color: getRarityColor(badge.rarity),
                            mx: 'auto',
                            mb: 0.5,
                          }}
                        >
                          <StarIcon />
                        </Avatar>
                        <Typography variant="caption" display="block" fontWeight={600}>
                          {badge.name}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={endSessionDialog} onClose={() => setEndSessionDialog(false)}>
        <DialogTitle>End Teaching Session?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this session? Your progress will be analyzed and saved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndSessionDialog(false)}>Cancel</Button>
          <Button onClick={handleEndSession} variant="contained" color="primary">
            End Session
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newBadgesDialog} onClose={() => setNewBadgesDialog(false)}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <TrophyIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            New Badges Earned!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {earnedBadges.map((badge) => (
              <Grid item xs={12} key={badge.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `2px solid ${getRarityColor(badge.rarity)}`,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar
                    src={badge.icon_url}
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: alpha(getRarityColor(badge.rarity), 0.1),
                      color: getRarityColor(badge.rarity),
                    }}
                  >
                    <StarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {badge.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {badge.description}
                    </Typography>
                    <Chip
                      label={badge.rarity}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: alpha(getRarityColor(badge.rarity), 0.2),
                        color: getRarityColor(badge.rarity),
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewBadgesDialog(false)} variant="contained" fullWidth>
            Awesome!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
