import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Divider,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  Visibility,
  CheckCircle,
  Bookmark,
  BookmarkBorder,
  Edit,
  Delete,
} from '@mui/icons-material';
import { AnswerInterface, AnswerComposer } from '../components/doubts';
import doubtsApi from '../api/doubts';
import { DoubtPost, DoubtAnswer } from '../types/doubt';
import { formatDistanceToNow } from 'date-fns';

const DoubtDetail: React.FC = () => {
  const { doubtId } = useParams<{ doubtId: string }>();
  const [doubt, setDoubt] = useState<DoubtPost | null>(null);
  const [answers, setAnswers] = useState<DoubtAnswer[]>([]);
  const [similarDoubts, setSimilarDoubts] = useState<DoubtPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const currentUserId = 1;

  useEffect(() => {
    if (doubtId) {
      const id = parseInt(doubtId);
      loadDoubt(id);
      loadAnswers(id);
      loadSimilarDoubts(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doubtId]);

  const loadDoubt = async (id: number) => {
    try {
      const data = await doubtsApi.getDoubt(id);
      setDoubt(data);
    } catch (error) {
      showSnackbar('Failed to load doubt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async (id: number) => {
    try {
      const data = await doubtsApi.getAnswers(id);
      setAnswers(
        data.sort((a, b) => {
          if (a.is_accepted) return -1;
          if (b.is_accepted) return 1;
          return b.upvote_count - a.upvote_count;
        })
      );
    } catch (error) {
      console.error('Failed to load answers:', error);
    }
  };

  const loadSimilarDoubts = async (id: number) => {
    try {
      const data = await doubtsApi.getSimilarDoubts(id);
      setSimilarDoubts(data);
    } catch (error) {
      console.error('Failed to load similar doubts:', error);
    }
  };

  const handleUpvoteDoubt = async () => {
    if (!doubt) return;

    try {
      if (doubt.is_upvoted) {
        await doubtsApi.removeDoubtVote(doubt.id);
      } else {
        await doubtsApi.voteDoubt(doubt.id, 'upvote' as const);
      }
      loadDoubt(doubt.id);
    } catch (error) {
      showSnackbar('Failed to update vote', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!doubt) return;

    try {
      if (doubt.is_bookmarked) {
        await doubtsApi.removeBookmark(doubt.id);
        showSnackbar('Bookmark removed', 'success');
      } else {
        await doubtsApi.bookmarkDoubt(doubt.id);
        showSnackbar('Doubt bookmarked', 'success');
      }
      loadDoubt(doubt.id);
    } catch (error) {
      showSnackbar('Failed to update bookmark', 'error');
    }
  };

  const handleSubmitAnswer = async (content: string, images: File[]) => {
    if (!doubt) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('is_anonymous', 'false');
      images.forEach((image) => formData.append('images', image));

      await doubtsApi.createAnswer(doubt.id, formData);
      showSnackbar('Answer posted successfully', 'success');
      loadAnswers(doubt.id);
      loadDoubt(doubt.id);
    } catch (error) {
      showSnackbar('Failed to post answer', 'error');
      throw error;
    }
  };

  const handleUpvoteAnswer = async (answer: DoubtAnswer) => {
    try {
      if (answer.is_upvoted) {
        await doubtsApi.removeAnswerVote(answer.id);
      } else {
        await doubtsApi.voteAnswer(answer.id, 'upvote' as const);
      }
      loadAnswers(parseInt(doubtId!));
    } catch (error) {
      showSnackbar('Failed to update vote', 'error');
    }
  };

  const handleDownvoteAnswer = async (answer: DoubtAnswer) => {
    try {
      if (answer.is_downvoted) {
        await doubtsApi.removeAnswerVote(answer.id);
      } else {
        await doubtsApi.voteAnswer(answer.id, 'downvote' as const);
      }
      loadAnswers(parseInt(doubtId!));
    } catch (error) {
      showSnackbar('Failed to update vote', 'error');
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
      await doubtsApi.acceptAnswer(answerId);
      showSnackbar('Answer accepted', 'success');
      loadAnswers(parseInt(doubtId!));
      loadDoubt(parseInt(doubtId!));
    } catch (error) {
      showSnackbar('Failed to accept answer', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading || !doubt) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Chip
                label={doubt.status}
                color={doubt.status === 'resolved' ? 'success' : 'warning'}
                icon={doubt.status === 'resolved' ? <CheckCircle /> : undefined}
              />
              <Box display="flex" gap={1}>
                {doubt.user_id === currentUserId && (
                  <>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small">
                      <Delete />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>

            <Typography variant="h4" gutterBottom>
              {doubt.title}
            </Typography>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar src={doubt.user_avatar} alt={doubt.user_name}>
                {doubt.user_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2">
                  {doubt.is_anonymous ? 'Anonymous' : doubt.user_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Asked {formatDistanceToNow(new Date(doubt.created_at), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              {doubt.description}
            </Typography>

            {doubt.images && doubt.images.length > 0 && (
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {doubt.images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <img
                      src={image}
                      alt={`Doubt image ${index + 1}`}
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
              {doubt.subject_name && (
                <Chip label={doubt.subject_name} color="primary" variant="outlined" />
              )}
              {doubt.chapter_name && <Chip label={doubt.chapter_name} variant="outlined" />}
              {doubt.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={2}>
                <Button
                  startIcon={doubt.is_upvoted ? <ThumbUp /> : <ThumbUpOutlined />}
                  color={doubt.is_upvoted ? 'primary' : 'inherit'}
                  onClick={handleUpvoteDoubt}
                >
                  {doubt.upvote_count} Upvotes
                </Button>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <Visibility fontSize="small" color="action" />
                  <Typography variant="body2">{doubt.view_count} views</Typography>
                </Box>
              </Stack>

              <IconButton onClick={handleBookmark}>
                {doubt.is_bookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
              </IconButton>
            </Box>
          </Paper>

          <Typography variant="h5" gutterBottom>
            {answers.length} Answers
          </Typography>

          {answers.map((answer) => (
            <AnswerInterface
              key={answer.id}
              answer={answer}
              isQuestionOwner={doubt.user_id === currentUserId}
              onUpvote={() => handleUpvoteAnswer(answer)}
              onDownvote={() => handleDownvoteAnswer(answer)}
              onAccept={
                doubt.user_id === currentUserId && !answer.is_accepted
                  ? () => handleAcceptAnswer(answer.id)
                  : undefined
              }
            />
          ))}

          <AnswerComposer onSubmit={handleSubmitAnswer} />
        </Grid>

        <Grid item xs={12} md={4}>
          {similarDoubts.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Similar Doubts
                </Typography>
                <Stack spacing={1}>
                  {similarDoubts.map((similar) => (
                    <Box
                      key={similar.id}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
                      }}
                      onClick={() => (window.location.href = `/doubts/${similar.id}`)}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {similar.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {similar.answer_count} answers • {similar.upvote_count} upvotes
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DoubtDetail;
