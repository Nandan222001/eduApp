import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AddCircle as AddOptionIcon,
} from '@mui/icons-material';
import { QuestionType, QuestionCreateInput, QuestionOption } from '@/types/quiz';

interface QuestionBuilderProps {
  questions: Omit<QuestionCreateInput, 'quiz_id'>[];
  onAddQuestion: (question: Omit<QuestionCreateInput, 'quiz_id'>) => void;
  onRemoveQuestion: (index: number) => void;
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  questions,
  onAddQuestion,
  onRemoveQuestion,
}) => {
  const [newQuestion, setNewQuestion] = useState<Omit<QuestionCreateInput, 'quiz_id'>>({
    question_type: QuestionType.MCQ,
    question_text: '',
    marks: 1,
    options: [
      { id: '1', text: '', is_correct: false },
      { id: '2', text: '', is_correct: false },
    ],
  });

  const handleQuestionChange = (field: string, value: string | number | QuestionOption[]) => {
    setNewQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (
    index: number,
    field: keyof QuestionOption,
    value: string | boolean
  ) => {
    const newOptions = [...(newQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };

    if (field === 'is_correct' && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.is_correct = false;
      });
    }

    setNewQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    const options = newQuestion.options || [];
    setNewQuestion((prev) => ({
      ...prev,
      options: [...options, { id: String(options.length + 1), text: '', is_correct: false }],
    }));
  };

  const removeOption = (index: number) => {
    const options = newQuestion.options || [];
    if (options.length > 2) {
      setNewQuestion((prev) => ({
        ...prev,
        options: options.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.question_text) {
      onAddQuestion(newQuestion);
      setNewQuestion({
        question_type: QuestionType.MCQ,
        question_text: '',
        marks: 1,
        options: [
          { id: '1', text: '', is_correct: false },
          { id: '2', text: '', is_correct: false },
        ],
      });
    }
  };

  const renderQuestionInput = () => {
    switch (newQuestion.question_type) {
      case QuestionType.MCQ:
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Options
            </Typography>
            <Stack spacing={2}>
              {newQuestion.options?.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Radio
                    checked={option.is_correct}
                    onChange={() => handleOptionChange(index, 'is_correct', true)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder="Enter option text"
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeOption(index)}
                    disabled={(newQuestion.options?.length || 0) <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddOptionIcon />} onClick={addOption} size="small">
                Add Option
              </Button>
            </Stack>
          </Box>
        );

      case QuestionType.TRUE_FALSE:
        return (
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Correct Answer
            </Typography>
            <RadioGroup
              value={newQuestion.correct_answer || ''}
              onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
            >
              <FormControlLabel value="true" control={<Radio />} label="True" />
              <FormControlLabel value="false" control={<Radio />} label="False" />
            </RadioGroup>
          </FormControl>
        );

      case QuestionType.FILL_BLANK:
      case QuestionType.SHORT_ANSWER:
        return (
          <TextField
            fullWidth
            label="Correct Answer"
            value={newQuestion.correct_answer || ''}
            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
            placeholder="Enter the correct answer"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add New Question
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={newQuestion.question_type}
                onChange={(e) => handleQuestionChange('question_type', e.target.value)}
              >
                <MenuItem value={QuestionType.MCQ}>Multiple Choice</MenuItem>
                <MenuItem value={QuestionType.TRUE_FALSE}>True/False</MenuItem>
                <MenuItem value={QuestionType.FILL_BLANK}>Fill in the Blank</MenuItem>
                <MenuItem value={QuestionType.SHORT_ANSWER}>Short Answer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Marks"
              value={newQuestion.marks}
              onChange={(e) => handleQuestionChange('marks', parseFloat(e.target.value) || 1)}
              inputProps={{ min: 0.5, step: 0.5 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Question Text"
              value={newQuestion.question_text}
              onChange={(e) => handleQuestionChange('question_text', e.target.value)}
              placeholder="Enter your question"
              required
            />
          </Grid>
          <Grid item xs={12}>
            {renderQuestionInput()}
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Explanation (optional)"
              value={newQuestion.explanation || ''}
              onChange={(e) => handleQuestionChange('explanation', e.target.value)}
              placeholder="Explain the correct answer"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
              disabled={!newQuestion.question_text}
            >
              Add Question
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Added Questions ({questions.length})
        </Typography>
        <Stack spacing={2}>
          {questions.map((question, index) => (
            <Paper key={index} sx={{ p: 2 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="primary">
                    Question {index + 1} ({question.question_type}) - {question.marks} marks
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {question.question_text}
                  </Typography>
                  {question.options && (
                    <Box sx={{ mt: 1, ml: 2 }}>
                      {question.options.map((opt, optIndex) => (
                        <Typography
                          key={optIndex}
                          variant="body2"
                          color={opt.is_correct ? 'success.main' : 'text.secondary'}
                        >
                          {String.fromCharCode(65 + optIndex)}. {opt.text}
                          {opt.is_correct && ' ✓'}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {question.correct_answer && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      Answer: {question.correct_answer}
                    </Typography>
                  )}
                </Box>
                <IconButton color="error" onClick={() => onRemoveQuestion(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
