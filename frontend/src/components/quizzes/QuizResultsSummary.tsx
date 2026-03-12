import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { CheckCircle, Cancel, HelpOutline, EmojiEvents, Timer } from '@mui/icons-material';
import { QuizAttempt, Quiz, QuizResponse } from '@/types/quiz';

interface QuizResultsSummaryProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  responses?: QuizResponse[];
  showAnswers?: boolean;
}

export const QuizResultsSummary: React.FC<QuizResultsSummaryProps> = ({
  attempt,
  quiz,
  responses = [],
  showAnswers = true,
}) => {
  const passed = quiz.passing_percentage ? attempt.percentage >= quiz.passing_percentage : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getQuestionById = (questionId: number) => {
    return quiz.questions?.find((q) => q.id === questionId);
  };

  const getResponseStatus = (response: QuizResponse) => {
    if (response.is_correct === true)
      return { icon: <CheckCircle color="success" />, label: 'Correct' };
    if (response.is_correct === false)
      return { icon: <Cancel color="error" />, label: 'Incorrect' };
    return { icon: <HelpOutline color="warning" />, label: 'Pending Review' };
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <EmojiEvents color="primary" />
            Quiz Completed!
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h3">{attempt.score}</Typography>
                <Typography variant="body2">out of {quiz.total_marks}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {attempt.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Percentage
                </Typography>
                <LinearProgress variant="determinate" value={attempt.percentage} sx={{ mt: 1 }} />
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
                >
                  <Timer color="action" />
                  <Typography variant="h4" sx={{ ml: 1 }}>
                    {formatTime(attempt.time_taken_seconds)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Time Taken
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">{attempt.attempt_number}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Attempt Number
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {passed !== null && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Chip
                label={passed ? 'PASSED' : 'FAILED'}
                color={passed ? 'success' : 'error'}
                sx={{ fontSize: '1.1rem', px: 3, py: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Passing: {quiz.passing_percentage}%
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Answer Breakdown
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Chip
              icon={<CheckCircle />}
              label={`${attempt.correct_answers} Correct`}
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<Cancel />}
              label={`${attempt.incorrect_answers} Incorrect`}
              color="error"
              variant="outlined"
            />
            <Chip
              icon={<HelpOutline />}
              label={`${attempt.unanswered} Unanswered`}
              color="warning"
              variant="outlined"
            />
          </Stack>

          <Box sx={{ mt: 3 }}>
            <LinearProgress
              variant="determinate"
              value={(attempt.correct_answers / attempt.total_questions) * 100}
              color="success"
              sx={{ height: 10, borderRadius: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Correct: {attempt.correct_answers}/{attempt.total_questions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {((attempt.correct_answers / attempt.total_questions) * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {showAnswers && responses.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Review
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {responses.map((response, index) => {
                const question = getQuestionById(response.question_id);
                const status = getResponseStatus(response);

                if (!question) return null;

                return (
                  <React.Fragment key={response.id}>
                    <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>{status.icon}</ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1">
                              Question {index + 1}: {status.label}
                            </Typography>
                          }
                          secondary={`${response.marks_awarded} / ${question.marks} marks`}
                        />
                      </Box>

                      <Box sx={{ ml: 7, width: '100%' }}>
                        <Typography variant="body2" gutterBottom>
                          {question.question_text}
                        </Typography>

                        {response.user_answer && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Your Answer:
                            </Typography>
                            <Typography variant="body2">{response.user_answer}</Typography>
                          </Box>
                        )}

                        {question.explanation && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                            <Typography variant="caption" color="primary">
                              Explanation:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {question.explanation}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </ListItem>
                    {index < responses.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
