import { useState, useEffect } from 'react';
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
  Paper,
  Stack,
  useTheme,
  Rating,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { scholarshipEssayApi } from '@/api/scholarshipEssay';
import { useAuth } from '@/hooks/useAuth';
import type { SavedEssay, CounselorFeedback } from '@/types/scholarshipEssay';

export default function CounselorReviewPortal() {
  const theme = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [reviewQueue, setReviewQueue] = useState<SavedEssay[]>([]);
  const [selectedEssay, setSelectedEssay] = useState<SavedEssay | null>(null);
  const [feedback, setFeedback] = useState<Partial<CounselorFeedback>>({
    approved: false,
    overallRating: 0,
    strengthsHighlighted: [],
    areasForImprovement: [],
    specificComments: '',
    suggestedRevisions: [],
    status: 'pending',
  });

  const [newStrength, setNewStrength] = useState('');
  const [newImprovement, setNewImprovement] = useState('');
  const [newRevision, setNewRevision] = useState('');

  useEffect(() => {
    loadReviewQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      const queue = await scholarshipEssayApi.getCounselorReviewQueue(user?.id || '1');
      setReviewQueue(queue);
      setError(null);
    } catch (err) {
      setError('Failed to load review queue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEssay = (essay: SavedEssay) => {
    setSelectedEssay(essay);
    setFeedback({
      approved: false,
      overallRating: 0,
      strengthsHighlighted: [],
      areasForImprovement: [],
      specificComments: '',
      suggestedRevisions: [],
      status: 'pending',
    });
  };

  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    setFeedback({
      ...feedback,
      strengthsHighlighted: [...(feedback.strengthsHighlighted || []), newStrength],
    });
    setNewStrength('');
  };

  const handleRemoveStrength = (index: number) => {
    setFeedback({
      ...feedback,
      strengthsHighlighted: feedback.strengthsHighlighted?.filter((_, i) => i !== index),
    });
  };

  const handleAddImprovement = () => {
    if (!newImprovement.trim()) return;
    setFeedback({
      ...feedback,
      areasForImprovement: [...(feedback.areasForImprovement || []), newImprovement],
    });
    setNewImprovement('');
  };

  const handleRemoveImprovement = (index: number) => {
    setFeedback({
      ...feedback,
      areasForImprovement: feedback.areasForImprovement?.filter((_, i) => i !== index),
    });
  };

  const handleAddRevision = () => {
    if (!newRevision.trim()) return;
    setFeedback({
      ...feedback,
      suggestedRevisions: [...(feedback.suggestedRevisions || []), newRevision],
    });
    setNewRevision('');
  };

  const handleRemoveRevision = (index: number) => {
    setFeedback({
      ...feedback,
      suggestedRevisions: feedback.suggestedRevisions?.filter((_, i) => i !== index),
    });
  };

  const handleSubmitFeedback = async (approved: boolean) => {
    if (!selectedEssay) return;

    try {
      await scholarshipEssayApi.submitCounselorFeedback(selectedEssay.id, {
        ...feedback,
        counselorId: user?.id || '1',
        counselorName: user?.fullName || user?.email || 'Counselor',
        approved,
        status: approved ? 'approved' : 'needs_revision',
      });

      setReviewQueue(reviewQueue.filter((e) => e.id !== selectedEssay.id));
      setSelectedEssay(null);
      setSuccess(`Essay ${approved ? 'approved' : 'sent back for revision'} successfully`);
    } catch (err) {
      setError('Failed to submit feedback');
      console.error(err);
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Counselor Review Portal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and approve student essays for scholarship submission
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Review Queue"
              subheader={`${reviewQueue.length} essay${reviewQueue.length !== 1 ? 's' : ''} pending`}
            />
            <Divider />
            <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {reviewQueue.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    All essays reviewed!
                  </Typography>
                </Box>
              ) : (
                <List>
                  {reviewQueue.map((essay) => (
                    <ListItem
                      key={essay.id}
                      button
                      selected={selectedEssay?.id === essay.id}
                      onClick={() => handleSelectEssay(essay)}
                    >
                      <ListItemText
                        primary={essay.title}
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {essay.promptTitle}
                            </Typography>
                            <Chip
                              label={`${essay.wordCount} words`}
                              size="small"
                              sx={{ width: 'fit-content' }}
                            />
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {!selectedEssay ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ViewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Select an essay to review
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader title={selectedEssay.title} subheader={selectedEssay.promptTitle} />
                <CardContent>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: 'background.default',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      fontFamily: 'Georgia, serif',
                      fontSize: '16px',
                      lineHeight: 1.8,
                    }}
                  >
                    <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedEssay.content}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader title="Overall Rating" />
                <CardContent>
                  <Rating
                    value={feedback.overallRating || 0}
                    onChange={(_, value) => setFeedback({ ...feedback, overallRating: value || 0 })}
                    size="large"
                  />
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader title="Strengths" avatar={<TrendingUpIcon color="success" />} />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Add a strength..."
                        value={newStrength}
                        onChange={(e) => setNewStrength(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddStrength();
                        }}
                      />
                      <Button variant="contained" size="small" onClick={handleAddStrength}>
                        <AddIcon />
                      </Button>
                    </Box>
                    {feedback.strengthsHighlighted && feedback.strengthsHighlighted.length > 0 && (
                      <List dense>
                        {feedback.strengthsHighlighted.map((strength, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveStrength(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={strength} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader
                  title="Areas for Improvement"
                  avatar={<WarningIcon color="warning" />}
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Add an area for improvement..."
                        value={newImprovement}
                        onChange={(e) => setNewImprovement(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddImprovement();
                        }}
                      />
                      <Button variant="contained" size="small" onClick={handleAddImprovement}>
                        <AddIcon />
                      </Button>
                    </Box>
                    {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                      <List dense>
                        {feedback.areasForImprovement.map((improvement, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveImprovement(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={improvement} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader title="Suggested Revisions" />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Add a suggested revision..."
                        value={newRevision}
                        onChange={(e) => setNewRevision(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddRevision();
                        }}
                      />
                      <Button variant="contained" size="small" onClick={handleAddRevision}>
                        <AddIcon />
                      </Button>
                    </Box>
                    {feedback.suggestedRevisions && feedback.suggestedRevisions.length > 0 && (
                      <List dense>
                        {feedback.suggestedRevisions.map((revision, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveRevision(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={revision} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardHeader title="Overall Comments" />
                <CardContent>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Provide overall feedback and comments..."
                    value={feedback.specificComments || ''}
                    onChange={(e) => setFeedback({ ...feedback, specificComments: e.target.value })}
                  />
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<RejectIcon />}
                    onClick={() => handleSubmitFeedback(false)}
                  >
                    Needs Revision
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<ApproveIcon />}
                    onClick={() => handleSubmitFeedback(true)}
                  >
                    Approve for Submission
                  </Button>
                </Grid>
              </Grid>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
