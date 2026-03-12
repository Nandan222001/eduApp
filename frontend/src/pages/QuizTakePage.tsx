import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizApi } from '@/api/quizzes';
import { QuizTakingInterface, QuizResultsSummary } from '@/components/quizzes';
import { QuizAttempt } from '@/types/quiz';

export const QuizTakePage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const userId = 1; // Get from auth context

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz-student', quizId],
    queryFn: () => quizApi.getQuizForStudent(Number(quizId)),
    enabled: !!quizId,
  });

  const startAttemptMutation = useMutation({
    mutationFn: () => quizApi.startAttempt(Number(quizId), userId),
    onSuccess: (data) => {
      setAttempt(data);
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: (data: {
      responses: Array<{ question_id: number; user_answer?: string; user_answers?: string[] }>;
      timeTaken: number;
    }) =>
      quizApi.submitQuiz({
        attempt_id: attempt!.id,
        responses: data.responses.map((r) => ({
          ...r,
          attempt_id: attempt!.id,
        })),
        time_taken_seconds: data.timeTaken,
      }),
    onSuccess: (data) => {
      setAttempt(data);
      setShowResults(true);
    },
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['quiz-responses', attempt?.id],
    queryFn: () => quizApi.getAttemptResponses(attempt!.id),
    enabled: !!attempt && showResults,
  });

  const handleStartQuiz = () => {
    startAttemptMutation.mutate();
  };

  const handleSubmit = (
    responses: Array<{ question_id: number; user_answer?: string; user_answers?: string[] }>,
    timeTaken: number
  ) => {
    submitQuizMutation.mutate({ responses, timeTaken });
  };

  if (quizLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!quiz) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Quiz not found</Alert>
      </Box>
    );
  }

  if (showResults && attempt) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/quizzes')} sx={{ mb: 3 }}>
          Back to Quizzes
        </Button>

        <QuizResultsSummary
          attempt={attempt}
          quiz={quiz}
          responses={responses}
          showAnswers={quiz.show_correct_answers}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/quizzes')}>
            Back to Quizzes
          </Button>
          {quiz.allow_retake && (
            <Button
              variant="contained"
              onClick={() => {
                setAttempt(null);
                setShowResults(false);
              }}
            >
              Retake Quiz
            </Button>
          )}
          {quiz.enable_leaderboard && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate(`/quizzes/${quizId}/leaderboard`)}
            >
              View Leaderboard
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  if (!attempt) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/quizzes')} sx={{ mb: 3 }}>
          Back to Quizzes
        </Button>

        <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom>
            {quiz.title}
          </Typography>

          {quiz.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {quiz.description}
            </Typography>
          )}

          {quiz.instructions && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Instructions:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {quiz.instructions}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {quiz.questions?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Questions
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {quiz.total_marks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Marks
              </Typography>
            </Box>
            {quiz.time_limit_minutes && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {quiz.time_limit_minutes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Minutes
                </Typography>
              </Box>
            )}
            {quiz.passing_percentage && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {quiz.passing_percentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  To Pass
                </Typography>
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<CheckCircle />}
            onClick={handleStartQuiz}
            disabled={startAttemptMutation.isPending}
          >
            {startAttemptMutation.isPending ? 'Starting...' : 'Start Quiz'}
          </Button>
        </Box>
      </Box>
    );
  }

  return <QuizTakingInterface quiz={quiz} onSubmit={handleSubmit} />;
};

export default QuizTakePage;
