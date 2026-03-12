import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  PlayArrow as TakeIcon,
  Leaderboard as LeaderboardIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/api/quizzes';
import { Quiz, QuizStatus } from '@/types/quiz';
import { useNavigate } from 'react-router-dom';
import { QuizCreator } from '@/components/quizzes';
import { QuizCreateInput, QuestionCreateInput } from '@/types/quiz';

export const QuizList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const institutionId = 1; // Get from auth context
  const userId = 1; // Get from auth context

  const statusFilter =
    tabValue === 0 ? QuizStatus.PUBLISHED : tabValue === 1 ? QuizStatus.DRAFT : undefined;

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes', search, statusFilter],
    queryFn: () =>
      quizApi.listQuizzes({ search, institution_id: institutionId, status: statusFilter }),
  });

  const createQuizMutation = useMutation({
    mutationFn: (data: {
      quiz: QuizCreateInput;
      questions: Omit<QuestionCreateInput, 'quiz_id'>[];
    }) => quizApi.createQuizWithQuestions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setShowCreateForm(false);
    },
  });

  const publishQuizMutation = useMutation({
    mutationFn: (quizId: number) => quizApi.publishQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: number) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuiz(quiz);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuiz(null);
  };

  const handleTakeQuiz = (quizId: number) => {
    navigate(`/quizzes/${quizId}/take`);
  };

  const handlePublish = () => {
    if (selectedQuiz) {
      publishQuizMutation.mutate(selectedQuiz.id);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedQuiz) {
      deleteQuizMutation.mutate(selectedQuiz.id);
    }
    handleMenuClose();
  };

  if (showCreateForm) {
    return (
      <QuizCreator
        onSave={(quiz, questions) => createQuizMutation.mutate({ quiz, questions })}
        onCancel={() => setShowCreateForm(false)}
        institutionId={institutionId}
        userId={userId}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quizzes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateForm(true)}>
          Create Quiz
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Published" />
        <Tab label="Drafts" />
        <Tab label="All" />
      </Tabs>

      <TextField
        fullWidth
        placeholder="Search quizzes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {quizzes.map((quiz: Quiz) => (
          <Grid item xs={12} sm={6} md={4} key={quiz.id}>
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
                  <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                    {quiz.title}
                  </Typography>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, quiz)}>
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {quiz.description || 'No description'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={quiz.status}
                    size="small"
                    color={quiz.status === QuizStatus.PUBLISHED ? 'success' : 'default'}
                  />
                  <Chip label={quiz.quiz_type} size="small" variant="outlined" />
                  <Chip label={`${quiz.questions?.length || 0} questions`} size="small" />
                  <Chip label={`${quiz.total_marks} marks`} size="small" />
                </Box>

                {quiz.time_limit_minutes && (
                  <Typography variant="caption" color="text.secondary">
                    ⏱️ {quiz.time_limit_minutes} minutes
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<TakeIcon />}
                  onClick={() => handleTakeQuiz(quiz.id)}
                  variant="contained"
                  fullWidth
                  disabled={quiz.status !== QuizStatus.PUBLISHED}
                >
                  {quiz.status === QuizStatus.PUBLISHED ? 'Take Quiz' : 'Not Published'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedQuiz?.status === QuizStatus.DRAFT && (
          <MenuItem onClick={handlePublish}>
            <PublishIcon sx={{ mr: 1 }} /> Publish
          </MenuItem>
        )}
        {selectedQuiz?.enable_leaderboard && (
          <MenuItem
            onClick={() => selectedQuiz && navigate(`/quizzes/${selectedQuiz.id}/leaderboard`)}
          >
            <LeaderboardIcon sx={{ mr: 1 }} /> Leaderboard
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedQuiz && navigate(`/quizzes/${selectedQuiz.id}/analytics`)}>
          <AnalyticsIcon sx={{ mr: 1 }} /> Analytics
        </MenuItem>
        <MenuItem onClick={() => selectedQuiz && navigate(`/quizzes/${selectedQuiz.id}/edit`)}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default QuizList;
