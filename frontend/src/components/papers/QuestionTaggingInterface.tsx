import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, AutoAwesome as AIIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { previousYearPapersAPI } from '@/api/previousYearPapers';
import {
  QuestionBankCreate,
  QuestionType,
  DifficultyLevel,
  BloomTaxonomyLevel,
  QuestionTagSuggestion,
} from '@/types/previousYearPapers';

interface QuestionTaggingInterfaceProps {
  paperId: number;
}

const QuestionTaggingInterface: React.FC<QuestionTaggingInterfaceProps> = ({ paperId }) => {
  const [questions, setQuestions] = useState<QuestionBankCreate[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionBankCreate>({
    institution_id: 1,
    paper_id: paperId,
    question_text: '',
    question_type: QuestionType.SHORT_ANSWER,
    grade_id: 0,
    subject_id: 0,
    difficulty_level: DifficultyLevel.MEDIUM,
    bloom_taxonomy_level: BloomTaxonomyLevel.UNDERSTAND,
  });
  const [aiSuggestions, setAiSuggestions] = useState<QuestionTagSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof QuestionBankCreate,
    value: string | number | QuestionType | DifficultyLevel | BloomTaxonomyLevel
  ) => {
    setCurrentQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleAISuggest = async () => {
    if (!currentQuestion.question_text) {
      setError('Please enter question text first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tempQuestion = await previousYearPapersAPI.createQuestion(currentQuestion);
      const suggestions = await previousYearPapersAPI.suggestTags(tempQuestion.id);
      setAiSuggestions(suggestions);

      setCurrentQuestion((prev) => ({
        ...prev,
        tags: suggestions.suggested_tags.join(', '),
        difficulty_level:
          (suggestions.suggested_difficulty as DifficultyLevel) || prev.difficulty_level,
        bloom_taxonomy_level:
          (suggestions.suggested_bloom_level as BloomTaxonomyLevel) || prev.bloom_taxonomy_level,
      }));

      await previousYearPapersAPI.deleteQuestion(tempQuestion.id);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to get AI suggestions'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question_text) {
      setError('Question text is required');
      return;
    }

    setQuestions((prev) => [...prev, currentQuestion]);
    setCurrentQuestion({
      institution_id: 1,
      paper_id: paperId,
      question_text: '',
      question_type: QuestionType.SHORT_ANSWER,
      grade_id: 0,
      subject_id: 0,
      difficulty_level: DifficultyLevel.MEDIUM,
      bloom_taxonomy_level: BloomTaxonomyLevel.UNDERSTAND,
    });
    setAiSuggestions(null);
    setError(null);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      for (const question of questions) {
        await previousYearPapersAPI.createQuestion(question);
      }
      setSuccess(`Successfully saved ${questions.length} questions`);
      setQuestions([]);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to save questions'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Question
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Question Text"
              value={currentQuestion.question_text}
              onChange={(e) => handleInputChange('question_text', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={currentQuestion.question_type}
                onChange={(e) => handleInputChange('question_type', e.target.value)}
                label="Question Type"
              >
                <MenuItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</MenuItem>
                <MenuItem value={QuestionType.SHORT_ANSWER}>Short Answer</MenuItem>
                <MenuItem value={QuestionType.LONG_ANSWER}>Long Answer</MenuItem>
                <MenuItem value={QuestionType.TRUE_FALSE}>True/False</MenuItem>
                <MenuItem value={QuestionType.FILL_IN_BLANK}>Fill in the Blank</MenuItem>
                <MenuItem value={QuestionType.NUMERICAL}>Numerical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={currentQuestion.difficulty_level}
                onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                label="Difficulty Level"
              >
                <MenuItem value={DifficultyLevel.VERY_EASY}>Very Easy</MenuItem>
                <MenuItem value={DifficultyLevel.EASY}>Easy</MenuItem>
                <MenuItem value={DifficultyLevel.MEDIUM}>Medium</MenuItem>
                <MenuItem value={DifficultyLevel.HARD}>Hard</MenuItem>
                <MenuItem value={DifficultyLevel.VERY_HARD}>Very Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Bloom&apos;s Taxonomy Level</InputLabel>
              <Select
                value={currentQuestion.bloom_taxonomy_level}
                onChange={(e) => handleInputChange('bloom_taxonomy_level', e.target.value)}
                label="Bloom's Taxonomy Level"
              >
                <MenuItem value={BloomTaxonomyLevel.REMEMBER}>Remember</MenuItem>
                <MenuItem value={BloomTaxonomyLevel.UNDERSTAND}>Understand</MenuItem>
                <MenuItem value={BloomTaxonomyLevel.APPLY}>Apply</MenuItem>
                <MenuItem value={BloomTaxonomyLevel.ANALYZE}>Analyze</MenuItem>
                <MenuItem value={BloomTaxonomyLevel.EVALUATE}>Evaluate</MenuItem>
                <MenuItem value={BloomTaxonomyLevel.CREATE}>Create</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Marks"
              value={currentQuestion.marks || ''}
              onChange={(e) => handleInputChange('marks', parseFloat(e.target.value))}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={currentQuestion.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />
          </Grid>

          {aiSuggestions && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  AI Suggestions (Confidence: {(aiSuggestions.confidence_score * 100).toFixed(0)}%)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {aiSuggestions.suggested_tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Alert>
            </Grid>
          )}

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
                onClick={handleAISuggest}
                disabled={loading || !currentQuestion.question_text}
              >
                AI Suggest Tags
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
                disabled={loading}
              >
                Add Question
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {questions.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Questions to Save ({questions.length})</Typography>
            <Button variant="contained" color="primary" onClick={handleSaveAll} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : `Save All ${questions.length} Questions`}
            </Button>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {questions.map((question, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Question {index + 1}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {question.question_text}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={question.question_type} size="small" />
                    <Chip label={question.difficulty_level} size="small" color="primary" />
                    <Chip label={question.bloom_taxonomy_level} size="small" color="secondary" />
                    {question.marks && <Chip label={`${question.marks} marks`} size="small" />}
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => handleRemoveQuestion(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default QuestionTaggingInterface;
