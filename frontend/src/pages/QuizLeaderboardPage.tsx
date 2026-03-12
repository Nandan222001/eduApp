import React from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizApi } from '@/api/quizzes';
import { QuizLeaderboard } from '@/components/quizzes';

export const QuizLeaderboardPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const userId = 1; // Get from auth context

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(Number(quizId)),
    enabled: !!quizId,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['quiz-leaderboard', quizId],
    queryFn: () => quizApi.getLeaderboard(Number(quizId)),
    enabled: !!quizId,
  });

  if (quizLoading || leaderboardLoading) {
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

  if (!quiz.enable_leaderboard) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Leaderboard is not enabled for this quiz</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/quizzes')}>
          Back to Quizzes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/quizzes')} sx={{ mb: 3 }}>
        Back to Quizzes
      </Button>

      <Typography variant="h4" gutterBottom>
        {quiz.title} - Leaderboard
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Top performers in this quiz
      </Typography>

      <QuizLeaderboard entries={leaderboard} currentUserId={userId} />
    </Box>
  );
};

export default QuizLeaderboardPage;
