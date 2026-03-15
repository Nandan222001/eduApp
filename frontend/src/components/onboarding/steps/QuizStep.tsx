import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
} from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { OnboardingStep } from '@/types/onboarding';

interface QuizStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export default function QuizStep({ step, onComplete }: QuizStepProps) {
  const theme = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions = step.config.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const passingScore = step.config.passingScore || 70;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      setAnswers({ ...answers, [currentQuestionIndex]: selectedAnswer });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] ?? null);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResults(false);
  };

  const handleContinue = () => {
    const score = calculateScore();
    onComplete({ quizScore: score, answers });
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= passingScore;

    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: alpha(passed ? theme.palette.success.main : theme.palette.warning.main, 0.1),
              mb: 3,
            }}
          >
            <TrophyIcon
              sx={{
                fontSize: 60,
                color: passed ? theme.palette.success.main : theme.palette.warning.main,
              }}
            />
          </Box>

          <Typography variant="h4" fontWeight={700} gutterBottom>
            {passed ? 'Congratulations!' : 'Good Effort!'}
          </Typography>

          <Typography variant="h2" fontWeight={700} color="primary.main" gutterBottom>
            {score.toFixed(0)}%
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            You got{' '}
            {Object.values(answers).filter((a, i) => a === questions[i]?.correctAnswer).length} out
            of {questions.length} correct
          </Typography>

          {!passed && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You need {passingScore}% to pass. You can retake the quiz.
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {!passed && (
            <Button variant="outlined" onClick={handleRetake}>
              Retake Quiz
            </Button>
          )}
          <Button variant="contained" onClick={handleContinue} disabled={!passed && step.required}>
            Continue
          </Button>
        </Box>
      </Box>
    );
  }

  if (!currentQuestion) {
    return <Typography>No questions available</Typography>;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Chip label={`${progress.toFixed(0)}%`} size="small" color="primary" />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            },
          }}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {currentQuestion.question}
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%', mt: 3 }}>
          <RadioGroup
            value={selectedAnswer}
            onChange={(e) => handleAnswerSelect(Number(e.target.value))}
          >
            {currentQuestion.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index}
                control={<Radio />}
                label={option}
                sx={{
                  mb: 1,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
          Previous
        </Button>
        <Button variant="contained" onClick={handleNextQuestion} disabled={selectedAnswer === null}>
          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
        </Button>
      </Box>
    </Box>
  );
}
