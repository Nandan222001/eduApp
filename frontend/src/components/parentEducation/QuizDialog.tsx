import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
  LinearProgress,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { QuizQuestion, QuestionType, QuizAttempt } from '@/types/parentEducation';

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  onSubmit: (answers: Record<number, string>) => void;
  result?: QuizAttempt | null;
  allowRetry?: boolean;
}

export const QuizDialog: React.FC<QuizDialogProps> = ({
  open,
  onClose,
  questions,
  onSubmit,
  result,
  allowRetry = true,
}) => {
  const theme = useTheme();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      return;
    }
    onSubmit(answers);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const isAnswerCorrect = (questionId: number) => {
    if (!result) return null;
    const question = questions.find((q) => q.id === questionId);
    return question && answers[questionId] === question.correct_answer;
  };

  const allQuestionsAnswered = Object.keys(answers).length === questions.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            Course Quiz
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {!result ? (
          /* Quiz Mode */
          <Box>
            {currentQuestion && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {currentQuestion.question_text}
                </Typography>

                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                >
                  {currentQuestion.question_type === QuestionType.MULTIPLE_CHOICE &&
                    currentQuestion.options?.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{
                          mb: 1,
                          p: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mr: 0,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      />
                    ))}
                  {currentQuestion.question_type === QuestionType.TRUE_FALSE && (
                    <>
                      <FormControlLabel
                        value="true"
                        control={<Radio />}
                        label="True"
                        sx={{
                          mb: 1,
                          p: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mr: 0,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio />}
                        label="False"
                        sx={{
                          mb: 1,
                          p: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mr: 0,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      />
                    </>
                  )}
                </RadioGroup>
              </Box>
            )}

            {/* Question Navigation */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
              {questions.map((q, index) => (
                <Chip
                  key={q.id}
                  label={index + 1}
                  onClick={() => setCurrentQuestionIndex(index)}
                  color={currentQuestionIndex === index ? 'primary' : 'default'}
                  variant={answers[q.id] ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          /* Results Mode */
          <Box>
            {/* Result Summary */}
            <Alert
              severity={result.passed ? 'success' : 'warning'}
              icon={result.passed ? <CheckCircleIcon /> : <CancelIcon />}
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" gutterBottom>
                {result.passed ? 'Congratulations! You Passed!' : 'Not Passed - Try Again'}
              </Typography>
              <Typography variant="body2">
                Score: {result.score}% ({result.correct_answers}/{result.total_questions} correct)
              </Typography>
            </Alert>

            {/* Question Review */}
            <Box>
              {questions.map((question, index) => {
                const isCorrect = isAnswerCorrect(question.id);
                return (
                  <Box
                    key={question.id}
                    sx={{
                      mb: 3,
                      p: 2,
                      border: 1,
                      borderColor: isCorrect ? 'success.main' : 'error.main',
                      borderRadius: 1,
                      bgcolor: alpha(
                        isCorrect ? theme.palette.success.main : theme.palette.error.main,
                        0.05
                      ),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {isCorrect ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                      <Typography variant="subtitle1" fontWeight={600}>
                        Question {index + 1}
                      </Typography>
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      {question.question_text}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Your answer: <strong>{answers[question.id]}</strong>
                      </Typography>
                    </Box>
                    {!isCorrect && (
                      <>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="success.main">
                            Correct answer: <strong>{question.correct_answer}</strong>
                          </Typography>
                        </Box>
                        {question.explanation && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="caption">{question.explanation}</Typography>
                          </Alert>
                        )}
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {!result ? (
          <>
            <Box>
              <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                Previous
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentQuestionIndex < questions.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit} disabled={!allQuestionsAnswered}>
                  Submit Quiz
                </Button>
              )}
            </Box>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Close</Button>
            {allowRetry && !result.passed && (
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRetry}>
                Retry Quiz
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuizDialog;
