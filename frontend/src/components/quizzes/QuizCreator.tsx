import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Save as SaveIcon, NavigateNext, NavigateBefore } from '@mui/icons-material';
import { QuizCreateInput, QuizType, QuestionCreateInput } from '@/types/quiz';
import { QuestionBuilder } from './QuestionBuilder';

interface QuizCreatorProps {
  onSave: (quiz: QuizCreateInput, questions: Omit<QuestionCreateInput, 'quiz_id'>[]) => void;
  onCancel: () => void;
  institutionId: number;
  userId: number;
}

const steps = ['Quiz Details', 'Add Questions', 'Settings'];

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  onSave,
  onCancel,
  institutionId,
  userId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [quizData, setQuizData] = useState<QuizCreateInput>({
    institution_id: institutionId,
    creator_id: userId,
    title: '',
    description: '',
    quiz_type: QuizType.PRACTICE,
    shuffle_questions: false,
    shuffle_options: false,
    show_correct_answers: true,
    enable_leaderboard: false,
    allow_retake: true,
  });

  const [questions, setQuestions] = useState<Omit<QuestionCreateInput, 'quiz_id'>[]>([]);

  const handleQuizChange = (
    field: keyof QuizCreateInput,
    value: string | number | boolean | QuizType | undefined
  ) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddQuestion = (question: Omit<QuestionCreateInput, 'quiz_id'>) => {
    setQuestions([...questions, { ...question, order_index: questions.length }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (quizData.title && questions.length > 0) {
      onSave(quizData, questions);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quiz Title"
                value={quizData.title}
                onChange={(e) => handleQuizChange('title', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={quizData.description}
                onChange={(e) => handleQuizChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Instructions"
                value={quizData.instructions}
                onChange={(e) => handleQuizChange('instructions', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Quiz Type</InputLabel>
                <Select
                  value={quizData.quiz_type}
                  onChange={(e) => handleQuizChange('quiz_type', e.target.value)}
                >
                  <MenuItem value={QuizType.PRACTICE}>Practice</MenuItem>
                  <MenuItem value={QuizType.GRADED}>Graded</MenuItem>
                  <MenuItem value={QuizType.COMPETITIVE}>Competitive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Time Limit (minutes)"
                value={quizData.time_limit_minutes || ''}
                onChange={(e) =>
                  handleQuizChange('time_limit_minutes', parseInt(e.target.value) || undefined)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Passing Percentage"
                value={quizData.passing_percentage || ''}
                onChange={(e) =>
                  handleQuizChange('passing_percentage', parseFloat(e.target.value) || undefined)
                }
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Attempts"
                value={quizData.max_attempts || ''}
                onChange={(e) =>
                  handleQuizChange('max_attempts', parseInt(e.target.value) || undefined)
                }
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Questions ({questions.length})
            </Typography>
            <QuestionBuilder
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onRemoveQuestion={handleRemoveQuestion}
            />
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Quiz Settings
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.shuffle_questions}
                    onChange={(e) => handleQuizChange('shuffle_questions', e.target.checked)}
                  />
                }
                label="Shuffle Questions"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.shuffle_options}
                    onChange={(e) => handleQuizChange('shuffle_options', e.target.checked)}
                  />
                }
                label="Shuffle Options"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.show_correct_answers}
                    onChange={(e) => handleQuizChange('show_correct_answers', e.target.checked)}
                  />
                }
                label="Show Correct Answers After Submission"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.enable_leaderboard}
                    onChange={(e) => handleQuizChange('enable_leaderboard', e.target.checked)}
                  />
                }
                label="Enable Leaderboard"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quizData.allow_retake}
                    onChange={(e) => handleQuizChange('allow_retake', e.target.checked)}
                  />
                }
                label="Allow Retake"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Quiz
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, mb: 3 }}>{renderStepContent()}</Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button startIcon={<NavigateBefore />} onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={!quizData.title || questions.length === 0}
            >
              Save Quiz
            </Button>
          ) : (
            <Button variant="contained" endIcon={<NavigateNext />} onClick={handleNext}>
              Next
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
};
