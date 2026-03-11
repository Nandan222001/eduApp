import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Pagination,
  CircularProgress,
  Alert,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { previousYearPapersAPI } from '@/api/previousYearPapers';
import {
  QuestionBank,
  QuestionFilters,
  QuestionType,
  DifficultyLevel,
  BloomTaxonomyLevel,
} from '@/types/previousYearPapers';

const QuestionBankBrowserPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<QuestionFilters>({
    search: '',
  });

  const [highlightedText, setHighlightedText] = useState<string>('');

  const itemsPerPage = 12;

  useEffect(() => {
    loadQuestions();
    loadBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * itemsPerPage;
      const response = await previousYearPapersAPI.listQuestions({
        ...filters,
        skip,
        limit: itemsPerPage,
      });
      setQuestions(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load questions'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const response = await previousYearPapersAPI.listBookmarks(0, 1000);
      const bookmarkedIds = new Set<number>(
        response.items.map((b: { question_id: number }) => b.question_id)
      );
      setBookmarkedQuestions(bookmarkedIds);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const handleFilterChange = (
    field: keyof QuestionFilters,
    value:
      | string
      | number
      | QuestionType
      | DifficultyLevel
      | BloomTaxonomyLevel
      | boolean
      | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSearch = () => {
    setHighlightedText(filters.search || '');
    loadQuestions();
  };

  const handleClearFilters = () => {
    setFilters({ search: '' });
    setHighlightedText('');
    setPage(1);
  };

  const handleToggleBookmark = async (questionId: number) => {
    try {
      if (bookmarkedQuestions.has(questionId)) {
        const response = await previousYearPapersAPI.checkBookmark(questionId);
        if (response.bookmark) {
          await previousYearPapersAPI.deleteBookmark(response.bookmark.id);
          setBookmarkedQuestions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
          });
        }
      } else {
        await previousYearPapersAPI.createBookmark({ question_id: questionId });
        setBookmarkedQuestions((prev) => new Set(prev).add(questionId));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleDownloadQuestion = (question: QuestionBank) => {
    const content = `Question: ${question.question_text}\n\nType: ${question.question_type}\nDifficulty: ${question.difficulty_level}\nMarks: ${question.marks || 'N/A'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question_${question.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const highlightSearchText = (text: string) => {
    if (!highlightedText) return text;

    const regex = new RegExp(`(${highlightedText})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '2px 4px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Question Bank Browser
      </Typography>

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography>Advanced Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={filters.question_type || ''}
                  onChange={(e) => handleFilterChange('question_type', e.target.value || undefined)}
                  label="Question Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</MenuItem>
                  <MenuItem value={QuestionType.SHORT_ANSWER}>Short Answer</MenuItem>
                  <MenuItem value={QuestionType.LONG_ANSWER}>Long Answer</MenuItem>
                  <MenuItem value={QuestionType.TRUE_FALSE}>True/False</MenuItem>
                  <MenuItem value={QuestionType.NUMERICAL}>Numerical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={filters.difficulty_level || ''}
                  onChange={(e) =>
                    handleFilterChange('difficulty_level', e.target.value || undefined)
                  }
                  label="Difficulty Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={DifficultyLevel.VERY_EASY}>Very Easy</MenuItem>
                  <MenuItem value={DifficultyLevel.EASY}>Easy</MenuItem>
                  <MenuItem value={DifficultyLevel.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={DifficultyLevel.HARD}>Hard</MenuItem>
                  <MenuItem value={DifficultyLevel.VERY_HARD}>Very Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Bloom&apos;s Level</InputLabel>
                <Select
                  value={filters.bloom_taxonomy_level || ''}
                  onChange={(e) =>
                    handleFilterChange('bloom_taxonomy_level', e.target.value || undefined)
                  }
                  label="Bloom's Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={BloomTaxonomyLevel.REMEMBER}>Remember</MenuItem>
                  <MenuItem value={BloomTaxonomyLevel.UNDERSTAND}>Understand</MenuItem>
                  <MenuItem value={BloomTaxonomyLevel.APPLY}>Apply</MenuItem>
                  <MenuItem value={BloomTaxonomyLevel.ANALYZE}>Analyze</MenuItem>
                  <MenuItem value={BloomTaxonomyLevel.EVALUATE}>Evaluate</MenuItem>
                  <MenuItem value={BloomTaxonomyLevel.CREATE}>Create</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>
                  Search
                </Button>
                <Button variant="outlined" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {total} questions
          </Typography>

          <Grid container spacing={3}>
            {questions.map((question) => (
              <Grid item xs={12} md={6} key={question.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" component="div">
                        Question #{question.id}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleBookmark(question.id)}
                        color={bookmarkedQuestions.has(question.id) ? 'primary' : 'default'}
                      >
                        {bookmarkedQuestions.has(question.id) ? (
                          <BookmarkIcon />
                        ) : (
                          <BookmarkBorderIcon />
                        )}
                      </IconButton>
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {highlightSearchText(question.question_text)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={question.question_type} size="small" />
                      <Chip label={question.difficulty_level} size="small" color="primary" />
                      <Chip label={question.bloom_taxonomy_level} size="small" color="secondary" />
                      {question.marks && <Chip label={`${question.marks} marks`} size="small" />}
                      {question.is_verified && (
                        <Chip label="Verified" size="small" color="success" />
                      )}
                    </Box>

                    {question.tags && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {question.tags.split(',').map((tag, index) => (
                          <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadQuestion(question)}
                    >
                      Download
                    </Button>
                    <Button size="small" startIcon={<PrintIcon />} onClick={() => window.print()}>
                      Print
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {total > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(total / itemsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default QuestionBankBrowserPage;
