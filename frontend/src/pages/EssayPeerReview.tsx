import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Slider,
  Stack,
  LinearProgress,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Rating,
  Avatar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Spellcheck as GrammarIcon,
  Psychology as PsychologyIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { scholarshipEssayApi } from '@/api/scholarshipEssay';
import { useAuth } from '@/hooks/useAuth';
import type { AssignedEssayForReview, PeerReview, RubricScore } from '@/types/scholarshipEssay';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

const RUBRIC_CRITERIA = [
  {
    name: 'Content & Relevance',
    description: 'Essay addresses the prompt effectively and stays on topic',
    weight: 0.25,
    maxScore: 10,
  },
  {
    name: 'Structure & Organization',
    description: 'Clear introduction, body, and conclusion with logical flow',
    weight: 0.2,
    maxScore: 10,
  },
  {
    name: 'Writing Quality',
    description: 'Grammar, syntax, and vocabulary usage',
    weight: 0.2,
    maxScore: 10,
  },
  {
    name: 'Personal Voice & Authenticity',
    description: 'Unique perspective and genuine self-expression',
    weight: 0.2,
    maxScore: 10,
  },
  {
    name: 'Impact & Persuasiveness',
    description: 'Compelling narrative that leaves a lasting impression',
    weight: 0.15,
    maxScore: 10,
  },
];

interface RubricScoringProps {
  scores: RubricScore[];
  onChange: (scores: RubricScore[]) => void;
}

function RubricScoring({ scores, onChange }: RubricScoringProps) {
  const theme = useTheme();

  const handleScoreChange = (criterion: string, score: number) => {
    const newScores = scores.map((s) => (s.criterion === criterion ? { ...s, score } : s));
    onChange(newScores);
  };

  const handleCommentChange = (criterion: string, comment: string) => {
    const newScores = scores.map((s) => (s.criterion === criterion ? { ...s, comment } : s));
    onChange(newScores);
  };

  const totalScore = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  const maxTotalScore = scores.reduce((sum, s) => sum + s.maxScore * s.weight, 0);

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Rubric-Based Scoring"
        subheader={
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Total Score</Typography>
              <Typography variant="body2" fontWeight={700}>
                {totalScore.toFixed(1)} / {maxTotalScore.toFixed(1)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(totalScore / maxTotalScore) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        }
      />
      <CardContent>
        <Stack spacing={4}>
          {RUBRIC_CRITERIA.map((criterion) => {
            const currentScore = scores.find((s) => s.criterion === criterion.name);
            return (
              <Box key={criterion.name}>
                <Typography variant="subtitle2" gutterBottom>
                  {criterion.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {criterion.description}
                </Typography>
                <Box sx={{ px: 2, mt: 2 }}>
                  <Slider
                    value={currentScore?.score || 0}
                    onChange={(_, value) => handleScoreChange(criterion.name, value as number)}
                    min={0}
                    max={criterion.maxScore}
                    step={0.5}
                    marks
                    valueLabelDisplay="on"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      0 (Poor)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {criterion.maxScore} (Excellent)
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder={`Comments on ${criterion.name.toLowerCase()}...`}
                  value={currentScore?.comment || ''}
                  onChange={(e) => handleCommentChange(criterion.name, e.target.value)}
                  sx={{ mt: 2 }}
                  size="small"
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function EssayPeerReview() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [assignedEssays, setAssignedEssays] = useState<AssignedEssayForReview[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignedEssayForReview | null>(null);
  const [review, setReview] = useState<Partial<PeerReview>>({
    rubricScores: RUBRIC_CRITERIA.map((c) => ({
      criterion: c.name,
      score: 0,
      maxScore: c.maxScore,
      weight: c.weight,
      comment: '',
    })),
    strengthComments: '',
    improvementComments: '',
    grammarSuggestions: [],
    overallRating: 0,
    wouldRecommend: false,
  });

  const [grammarSuggestionInput, setGrammarSuggestionInput] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const assignments = await scholarshipEssayApi.getAssignedReviews(user?.id || '1');
      setAssignedEssays(assignments);
      setError(null);
    } catch (err) {
      setError('Failed to load assignments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssignment = async (assignment: AssignedEssayForReview) => {
    setSelectedAssignment(assignment);
    setCurrentTab(1);

    setReview({
      rubricScores: RUBRIC_CRITERIA.map((c) => ({
        criterion: c.name,
        score: 0,
        maxScore: c.maxScore,
        weight: c.weight,
        comment: '',
      })),
      strengthComments: '',
      improvementComments: '',
      grammarSuggestions: [],
      overallRating: 0,
      wouldRecommend: false,
    });
  };

  const handleSubmitReview = async () => {
    if (!selectedAssignment) return;

    if (!review.strengthComments || !review.improvementComments) {
      setError('Please provide both strengths and areas for improvement');
      return;
    }

    try {
      await scholarshipEssayApi.submitPeerReview(selectedAssignment.id, {
        ...review,
        reviewerId: user?.id || '1',
        reviewerName: user?.fullName || user?.email || 'Anonymous',
        status: 'completed',
      });

      setAssignedEssays(
        assignedEssays.map((a) =>
          a.id === selectedAssignment.id ? { ...a, status: 'completed' } : a
        )
      );

      setSuccess('Review submitted successfully!');
      setCurrentTab(0);
      setSelectedAssignment(null);
    } catch (err) {
      setError('Failed to submit review');
      console.error(err);
    }
  };

  const handleAddGrammarSuggestion = () => {
    if (!grammarSuggestionInput.trim()) return;

    setReview({
      ...review,
      grammarSuggestions: [...(review.grammarSuggestions || []), grammarSuggestionInput],
    });
    setGrammarSuggestionInput('');
  };

  const handleRemoveGrammarSuggestion = (index: number) => {
    setReview({
      ...review,
      grammarSuggestions: review.grammarSuggestions?.filter((_, i) => i !== index),
    });
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Essay Peer Review
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Provide constructive feedback to help your peers improve their essays
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Assigned Essays" icon={<AssignmentIcon />} iconPosition="start" />
          {selectedAssignment && (
            <Tab label="Review Interface" icon={<ReviewIcon />} iconPosition="start" />
          )}
          <Tab label="My Feedback" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {assignedEssays.length === 0 ? (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <ReviewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No essays assigned for review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back later for new assignments
                </Typography>
              </Paper>
            </Grid>
          ) : (
            assignedEssays.map((assignment) => (
              <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                  }}
                >
                  <CardHeader
                    title={assignment.essayTitle}
                    subheader={assignment.promptTitle}
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {assignment.authorName.charAt(0)}
                      </Avatar>
                    }
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Chip
                          label={assignment.status.replace('_', ' ').toUpperCase()}
                          color={
                            assignment.status === 'completed'
                              ? 'success'
                              : assignment.status === 'in_progress'
                                ? 'warning'
                                : 'default'
                          }
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Author
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {assignment.authorName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Word Count
                        </Typography>
                        <Typography variant="body2">{assignment.wordCount}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Due Date
                        </Typography>
                        <Typography variant="body2">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        variant={assignment.status === 'completed' ? 'outlined' : 'contained'}
                        startIcon={
                          assignment.status === 'completed' ? <CheckCircleIcon /> : <ReviewIcon />
                        }
                        onClick={() => handleSelectAssignment(assignment)}
                        disabled={assignment.status === 'completed'}
                      >
                        {assignment.status === 'completed' ? 'Completed' : 'Start Review'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      {selectedAssignment && (
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader
                  title={selectedAssignment.essayTitle}
                  subheader={`by ${selectedAssignment.authorName}`}
                />
                <CardContent>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'background.default',
                      maxHeight: '600px',
                      overflowY: 'auto',
                      fontFamily: 'Georgia, serif',
                      fontSize: '16px',
                      lineHeight: 1.8,
                    }}
                  >
                    <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedAssignment.content}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Stack spacing={3}>
                <RubricScoring
                  scores={review.rubricScores || []}
                  onChange={(scores) => setReview({ ...review, rubricScores: scores })}
                />

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader
                    title="Overall Rating"
                    avatar={<Rating value={review.overallRating || 0} readOnly />}
                  />
                  <CardContent>
                    <Rating
                      value={review.overallRating || 0}
                      onChange={(_, value) => setReview({ ...review, overallRating: value || 0 })}
                      size="large"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={review.wouldRecommend || false}
                          onChange={(e) =>
                            setReview({ ...review, wouldRecommend: e.target.checked })
                          }
                        />
                      }
                      label="I would recommend this essay for submission"
                    />
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader title="Strengths" avatar={<ThumbUpIcon color="success" />} />
                  <CardContent>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="What did the author do well? Be specific and encouraging..."
                      value={review.strengthComments || ''}
                      onChange={(e) => setReview({ ...review, strengthComments: e.target.value })}
                    />
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader
                    title="Areas for Improvement"
                    avatar={<ThumbDownIcon color="warning" />}
                  />
                  <CardContent>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="What could be improved? Provide constructive feedback..."
                      value={review.improvementComments || ''}
                      onChange={(e) =>
                        setReview({ ...review, improvementComments: e.target.value })
                      }
                    />
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader title="Grammar Corrections" avatar={<GrammarIcon color="info" />} />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add grammar or spelling correction..."
                          value={grammarSuggestionInput}
                          onChange={(e) => setGrammarSuggestionInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddGrammarSuggestion();
                            }
                          }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleAddGrammarSuggestion}
                        >
                          Add
                        </Button>
                      </Box>
                      {review.grammarSuggestions && review.grammarSuggestions.length > 0 && (
                        <List dense>
                          {review.grammarSuggestions.map((suggestion, index) => (
                            <ListItem
                              key={index}
                              secondaryAction={
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveGrammarSuggestion(index)}
                                >
                                  Remove
                                </Button>
                              }
                            >
                              <ListItemText primary={suggestion} />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  onClick={handleSubmitReview}
                >
                  Submit Review
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>
      )}

      <TabPanel value={currentTab} index={selectedAssignment ? 2 : 1}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Feedback Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View feedback received on your essays in the Essay Center
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => navigate('/scholarship-essays')}
          >
            Go to Essay Center
          </Button>
        </Paper>
      </TabPanel>
    </Box>
  );
}
