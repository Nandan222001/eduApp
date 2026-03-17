import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tabs,
  Tab,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Avatar,
} from '@mui/material';
import {
  CardTravel as PassportIcon,
  Star as StarIcon,
  EmojiEvents as BadgeIcon,
  School as TestIcon,
  MenuBook as JournalIcon,
  Add as AddIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { PassportStamp } from '../components/rpg';
import { SubjectPassport as SubjectPassportType, TravelJournalEntry } from '../types/rpg';

const mockPassportData: SubjectPassportType = {
  id: 'passport-1',
  studentId: '1',
  studentName: 'Student Hero',
  issueDate: '2024-01-01',
  overallProgress: 65,
  totalChaptersCompleted: 19,
  totalSubjects: 5,
  stamps: [
    {
      id: 'stamp-1',
      chapterId: 'ch-1',
      chapterName: 'Linear Equations',
      subject: 'Mathematics',
      entryDate: '2024-01-15',
      exitDate: '2024-01-20',
      masteryLevel: 95,
      masteryStars: 5,
      duration: 120,
      questionsCompleted: 45,
      accuracy: 95,
    },
    {
      id: 'stamp-2',
      chapterId: 'ch-2',
      chapterName: 'Quadratic Functions',
      subject: 'Mathematics',
      entryDate: '2024-01-21',
      exitDate: '2024-01-28',
      masteryLevel: 88,
      masteryStars: 4,
      duration: 168,
      questionsCompleted: 52,
      accuracy: 88,
    },
    {
      id: 'stamp-3',
      chapterId: 'ch-3',
      chapterName: "Newton's Laws",
      subject: 'Physics',
      entryDate: '2024-02-01',
      exitDate: '2024-02-08',
      masteryLevel: 92,
      masteryStars: 5,
      duration: 144,
      questionsCompleted: 38,
      accuracy: 92,
    },
    {
      id: 'stamp-4',
      chapterId: 'ch-4',
      chapterName: 'Thermodynamics',
      subject: 'Physics',
      entryDate: '2024-02-10',
      exitDate: null,
      masteryLevel: 45,
      masteryStars: 2,
      duration: 48,
      questionsCompleted: 20,
      accuracy: 75,
    },
  ],
  visaBadges: [
    {
      id: 'badge-1',
      name: 'Speed Scholar',
      description: 'Complete a chapter in under 3 days',
      category: 'Speed',
      earnedDate: '2024-01-20',
      special: true,
    },
    {
      id: 'badge-2',
      name: 'Perfect Score',
      description: 'Achieve 100% accuracy in a chapter',
      category: 'Mastery',
      earnedDate: '2024-01-28',
      special: true,
    },
    {
      id: 'badge-3',
      name: 'Multi-Subject Traveler',
      description: 'Complete chapters in 3 different subjects',
      category: 'Exploration',
      earnedDate: '2024-02-08',
      special: false,
    },
  ],
  borderCrossingTests: [
    {
      id: 'test-1',
      fromChapter: 'Linear Equations',
      toChapter: 'Quadratic Functions',
      subject: 'Mathematics',
      required: true,
      status: 'passed',
      attempts: 1,
      maxAttempts: 3,
      score: 92,
      passingScore: 70,
    },
    {
      id: 'test-2',
      fromChapter: 'Quadratic Functions',
      toChapter: 'Calculus Basics',
      subject: 'Mathematics',
      required: true,
      status: 'not-taken',
      attempts: 0,
      maxAttempts: 3,
      passingScore: 70,
    },
  ],
  travelJournal: [
    {
      id: 'journal-1',
      date: '2024-01-20',
      title: 'Conquered Linear Equations!',
      content:
        'Finally mastered linear equations. The key was understanding the slope-intercept form.',
      chapterId: 'ch-1',
      chapterName: 'Linear Equations',
      subject: 'Mathematics',
      mood: 'excellent',
      achievements: ['First 5-star mastery', 'Speed Scholar badge earned'],
      reflections: 'Practice really does make perfect.Daily problem-solving helped a lot.',
    },
    {
      id: 'journal-2',
      date: '2024-01-28',
      title: 'Quadratics Complete',
      content:
        'Quadratic functions were challenging but rewarding. Vertex form was tricky at first.',
      chapterId: 'ch-2',
      chapterName: 'Quadratic Functions',
      subject: 'Mathematics',
      mood: 'good',
      achievements: ['Perfect Score badge'],
      reflections: 'Graphing helped me visualize the concepts better.',
    },
  ],
};

const SubjectPassport: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [passportData] = useState<SubjectPassportType>(mockPassportData);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<TravelJournalEntry | null>(null);

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Mathematics: '#4CAF50',
      Physics: '#2196F3',
      Chemistry: '#FF9800',
      Biology: '#9C27B0',
      English: '#F44336',
      History: '#795548',
    };
    return colors[subject] || '#607D8B';
  };

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      excellent: '#4CAF50',
      good: '#8BC34A',
      neutral: '#FFC107',
      struggling: '#FF5722',
    };
    return colors[mood] || '#9E9E9E';
  };

  const getBadgeCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Speed: '#2196F3',
      Mastery: '#9C27B0',
      Exploration: '#FF9800',
      Achievement: '#4CAF50',
    };
    return colors[category] || '#607D8B';
  };

  const getTestStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      passed: 'success',
      failed: 'error',
      'in-progress': 'warning',
      'not-taken': 'default',
    };
    return colors[status] as 'success' | 'error' | 'warning' | 'default';
  };

  const handleJournalClick = (entry: TravelJournalEntry) => {
    setSelectedJournal(entry);
    setJournalDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                }}
              >
                <PassportIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Subject Passport
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {passportData.studentName}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Issued: {new Date(passportData.issueDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h3" fontWeight="bold">
                  {passportData.overallProgress}%
                </Typography>
                <Typography variant="body2">Overall Progress</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {passportData.totalChaptersCompleted} Chapters Completed
                </Typography>
              </Box>
            </Box>
            <Box mt={3}>
              <LinearProgress
                variant="determinate"
                value={passportData.overallProgress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<StarIcon />} label="Passport Stamps" />
        <Tab icon={<BadgeIcon />} label="Visa Badges" />
        <Tab icon={<TestIcon />} label="Border Crossing Tests" />
        <Tab icon={<JournalIcon />} label="Travel Journal" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Box mb={3}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Chapter Stamps
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your journey through subject territories
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {passportData.stamps.map((stamp) => (
              <Grid item xs={12} sm={6} md={4} key={stamp.id}>
                <PassportStamp stamp={stamp} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box mb={3}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Special Visa Badges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Achievements earned during your educational journey
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {passportData.visaBadges.map((badge) => (
              <Grid item xs={12} sm={6} md={4} key={badge.id}>
                <Card
                  sx={{
                    height: '100%',
                    border: badge.special ? '3px solid' : '1px solid',
                    borderColor: badge.special ? getBadgeCategoryColor(badge.category) : 'divider',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {badge.special && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        bgcolor: getBadgeCategoryColor(badge.category),
                        color: 'white',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 2,
                      }}
                    >
                      <StarIcon />
                    </Box>
                  )}
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: getBadgeCategoryColor(badge.category),
                          width: 56,
                          height: 56,
                        }}
                      >
                        <BadgeIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {badge.name}
                        </Typography>
                        <Chip
                          label={badge.category}
                          size="small"
                          sx={{
                            bgcolor: getBadgeCategoryColor(badge.category),
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {badge.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box mb={3}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Border Crossing Tests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Required assessments between chapters
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {passportData.borderCrossingTests.map((test) => (
              <Grid item xs={12} md={6} key={test.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {test.fromChapter} → {test.toChapter}
                        </Typography>
                        <Chip
                          label={test.subject}
                          size="small"
                          sx={{
                            bgcolor: getSubjectColor(test.subject),
                            color: 'white',
                          }}
                        />
                      </Box>
                      <Chip label={test.status} color={getTestStatusColor(test.status)} />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Attempts
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {test.attempts} / {test.maxAttempts}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {test.score !== undefined ? 'Score' : 'Passing Score'}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {test.score !== undefined ? `${test.score}%` : `${test.passingScore}%`}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {test.status === 'not-taken' && (
                      <Button variant="contained" fullWidth sx={{ mt: 2 }} startIcon={<TestIcon />}>
                        Take Test
                      </Button>
                    )}
                    {test.status === 'passed' && (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={1}
                        mt={2}
                        p={1}
                        bgcolor="success.lighter"
                        borderRadius={1}
                      >
                        <CompleteIcon color="success" />
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          Test Passed!
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Travel Journal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reflections on your learning journey
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />}>
              New Entry
            </Button>
          </Box>
          <Grid container spacing={3}>
            {passportData.travelJournal.map((entry) => (
              <Grid item xs={12} md={6} key={entry.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleJournalClick(entry)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {entry.title}
                        </Typography>
                        <Box display="flex" gap={1} mb={1}>
                          <Chip
                            label={entry.subject}
                            size="small"
                            sx={{
                              bgcolor: getSubjectColor(entry.subject),
                              color: 'white',
                            }}
                          />
                          <Chip
                            label={entry.mood}
                            size="small"
                            sx={{
                              bgcolor: getMoodColor(entry.mood),
                              color: 'white',
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {entry.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                      {new Date(entry.date).toLocaleDateString()} • {entry.chapterName}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog
        open={journalDialogOpen}
        onClose={() => setJournalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJournal && (
          <>
            <DialogTitle>
              <Typography variant="h5" fontWeight="bold">
                {selectedJournal.title}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip
                  label={selectedJournal.subject}
                  size="small"
                  sx={{
                    bgcolor: getSubjectColor(selectedJournal.subject),
                    color: 'white',
                  }}
                />
                <Chip
                  label={selectedJournal.mood}
                  size="small"
                  sx={{
                    bgcolor: getMoodColor(selectedJournal.mood),
                    color: 'white',
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {new Date(selectedJournal.date).toLocaleDateString()} •{' '}
                {selectedJournal.chapterName}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" paragraph>
                {selectedJournal.content}
              </Typography>
              {selectedJournal.achievements.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Achievements
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedJournal.achievements.map((achievement, index) => (
                      <Chip
                        key={index}
                        label={achievement}
                        color="success"
                        size="small"
                        icon={<StarIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Reflections
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body2">{selectedJournal.reflections}</Typography>
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setJournalDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default SubjectPassport;
