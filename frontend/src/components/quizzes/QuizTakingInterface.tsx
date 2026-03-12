import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  NavigateNext,
  NavigateBefore,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { Quiz, QuestionType } from '@/types/quiz';

interface QuizTakingInterfaceProps {
  quiz: Quiz;
  onSubmit: (
    responses: Array<{ question_id: number; user_answer?: string; user_answers?: string[] }>,
    timeTaken: number
  ) => void;
}

interface Answer {
  question_id: number;
  user_answer?: string;
  user_answers?: string[];
}

export const QuizTakingInterface: React.FC<QuizTakingInterfaceProps> = ({ quiz, onSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = answers.size;
  const timeLimit = quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null;
  const timeRemaining = timeLimit ? timeLimit - timeElapsed : null;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining <= 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const handleAnswerChange = (answer: string | string[]) => {
    if (!currentQuestion) return;

    const newAnswer: Answer = {
      question_id: currentQuestion.id,
      ...(Array.isArray(answer) ? { user_answers: answer } : { user_answer: answer }),
    };

    setAnswers(new Map(answers.set(currentQuestion.id, newAnswer)));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlaggedQuestions(newFlagged);
  };

  const handleSubmit = () => {
    const responses = Array.from(answers.values());
    onSubmit(responses, timeElapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers.get(currentQuestion.id);

    switch (currentQuestion.question_type) {
      case QuestionType.MCQ:
        return (
          <RadioGroup
            value={currentAnswer?.user_answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            {currentQuestion.options?.map((option, index) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={`${String.fromCharCode(65 + index)}. ${option.text}`}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        );

      case QuestionType.TRUE_FALSE:
        return (
          <RadioGroup
            value={currentAnswer?.user_answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            <FormControlLabel value="true" control={<Radio />} label="True" />
            <FormControlLabel value="false" control={<Radio />} label="False" />
          </RadioGroup>
        );

      case QuestionType.FILL_BLANK:
      case QuestionType.SHORT_ANSWER:
        return (
          <TextField
            fullWidth
            multiline={currentQuestion.question_type === QuestionType.SHORT_ANSWER}
            rows={currentQuestion.question_type === QuestionType.SHORT_ANSWER ? 4 : 1}
            value={currentAnswer?.user_answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here"
            variant="outlined"
          />
        );

      default:
        return null;
    }
  };

  if (!currentQuestion) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6">No questions available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5">{quiz.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {questions.length} questions • {quiz.total_marks} marks
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: { md: 'flex-end' },
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Chip
                icon={<TimerIcon />}
                label={
                  timeRemaining !== null
                    ? `${formatTime(timeRemaining)} left`
                    : formatTime(timeElapsed)
                }
                color={timeRemaining !== null && timeRemaining < 300 ? 'error' : 'primary'}
              />
              <Chip
                icon={<CheckIcon />}
                label={`${answeredCount}/${questions.length} answered`}
                color={answeredCount === questions.length ? 'success' : 'default'}
              />
            </Box>
          </Grid>
        </Grid>

        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />

        {timeRemaining !== null && timeRemaining < 300 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Less than 5 minutes remaining!
          </Alert>
        )}
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Chip
                label={`${currentQuestion.marks} ${currentQuestion.marks === 1 ? 'mark' : 'marks'}`}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Chip
                label={currentQuestion.question_type.replace('_', ' ')}
                size="small"
                variant="outlined"
              />
            </Box>
            <Button
              startIcon={<FlagIcon />}
              onClick={toggleFlag}
              color={flaggedQuestions.has(currentQuestion.id) ? 'warning' : 'default'}
              size="small"
            >
              Flag
            </Button>
          </Box>

          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {currentQuestion.question_text}
          </Typography>

          {currentQuestion.question_image_url && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <img
                src={currentQuestion.question_image_url}
                alt="Question"
                style={{ maxWidth: '100%', maxHeight: 400 }}
              />
            </Box>
          )}

          {renderQuestion()}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<NavigateBefore />}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {questions.map((q, index) => (
            <Button
              key={q.id}
              variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setCurrentQuestionIndex(index)}
              color={
                answers.has(q.id) ? 'success' : flaggedQuestions.has(q.id) ? 'warning' : 'primary'
              }
              sx={{ minWidth: 40 }}
            >
              {index + 1}
            </Button>
          ))}
        </Box>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button variant="contained" color="success" onClick={handleSubmit}>
            Submit Quiz
          </Button>
        ) : (
          <Button endIcon={<NavigateNext />} onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};
