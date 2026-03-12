import React from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizApi } from '@/api/quizzes';
import { QuizAnalyticsDashboard } from '@/components/quizzes';

export const QuizAnalyticsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(Number(quizId)),
    enabled: !!quizId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['quiz-analytics', quizId],
    queryFn: () => quizApi.getAnalytics(Number(quizId)),
    enabled: !!quizId,
  });

  if (quizLoading || analyticsLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!quiz || !analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Data not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/quizzes')} sx={{ mb: 3 }}>
        Back to Quizzes
      </Button>

      <Typography variant="h4" gutterBottom>
        {quiz.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Detailed analytics and performance insights
      </Typography>

      <QuizAnalyticsDashboard analytics={analytics} />
    </Box>
  );
};

export default QuizAnalyticsPage;
