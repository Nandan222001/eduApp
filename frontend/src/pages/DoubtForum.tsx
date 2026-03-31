import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Pagination,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Add, HelpOutline, TrendingUp, Bookmark } from '@mui/icons-material';
import { DoubtComposer, DoubtCard, DoubtFeedFilters } from '../components/doubts';
import doubtsApi from '../api/doubts';
import { DoubtPost, DoubtSearchFilters, DoubtStats } from '../types/doubt';
import { useAuth } from '@/hooks/useAuth';
import { isDemoUser } from '@/api/demoDataApi';

const DoubtForum: React.FC = () => {
  const { user } = useAuth();
  const isDemo = isDemoUser(user?.email);
  const [tabValue, setTabValue] = useState(0);
  const [doubts, setDoubts] = useState<DoubtPost[]>([]);
  const [stats, setStats] = useState<DoubtStats | null>(null);
  const [filters, setFilters] = useState<Partial<DoubtSearchFilters>>({
    page: 1,
    page_size: 12,
    sort_by: 'recent',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [composerOpen, setComposerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    loadDoubts();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (tabValue === 1) {
      setFilters((prev) => ({ ...prev, user_id: getCurrentUserId(), page: 1 }));
    } else if (tabValue === 2) {
      loadBookmarkedDoubts();
    } else {
      setFilters((prev) => {
        const newFilters = { ...prev, page: 1 };
        delete newFilters.user_id;
        return newFilters;
      });
    }
  }, [tabValue]);

  const getCurrentUserId = (): number => {
    return 1;
  };

  const loadDoubts = async () => {
    if (isDemo) {
      setDoubts([]);
      setTotalPages(0);
      return;
    }
    try {
      const response = await doubtsApi.searchDoubts(filters as DoubtSearchFilters);
      setDoubts(response.doubts);
      setTotalPages(response.total_pages);
    } catch (error) {
      showSnackbar('Failed to load doubts', 'error');
    }
  };

  const loadStats = async () => {
    if (isDemo) {
      setStats({
        total_doubts: 0,
        unanswered_doubts: 0,
        resolved_doubts: 0,
        my_doubts: 0,
        my_answers: 0,
        popular_tags: [],
      });
      return;
    }
    try {
      const data = await doubtsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadBookmarkedDoubts = async () => {
    if (isDemo) {
      setDoubts([]);
      return;
    }
    try {
      const bookmarks = await doubtsApi.getMyBookmarks();
      setDoubts(
        bookmarks.map((b) => ({
          ...b,
          id: b.doubt_id,
          institution_id: b.institution_id,
          user_id: b.user_id,
          title: '',
          description: '',
          status: 'unanswered' as const,
          view_count: 0,
          answer_count: 0,
          upvote_count: 0,
          is_anonymous: false,
          created_at: b.created_at,
          updated_at: b.created_at,
        }))
      );
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const handleViewDoubt = (doubtId: number) => {
    window.location.href = `/doubts/${doubtId}`;
  };

  const handleUpvote = async (doubt: DoubtPost) => {
    if (isDemo) {
      showSnackbar('Vote updated', 'success');
      return;
    }
    try {
      if (doubt.is_upvoted) {
        await doubtsApi.removeDoubtVote(doubt.id);
      } else {
        await doubtsApi.voteDoubt(doubt.id, 'upvote' as const);
      }
      loadDoubts();
    } catch (error) {
      showSnackbar('Failed to update vote', 'error');
    }
  };

  const handleBookmark = async (doubt: DoubtPost) => {
    if (isDemo) {
      showSnackbar(doubt.is_bookmarked ? 'Bookmark removed' : 'Doubt bookmarked', 'success');
      return;
    }
    try {
      if (doubt.is_bookmarked) {
        await doubtsApi.removeBookmark(doubt.id);
        showSnackbar('Bookmark removed', 'success');
      } else {
        await doubtsApi.bookmarkDoubt(doubt.id);
        showSnackbar('Doubt bookmarked', 'success');
      }
      loadDoubts();
    } catch (error) {
      showSnackbar('Failed to update bookmark', 'error');
    }
  };

  const handleFilterChange = (newFilters: Partial<DoubtSearchFilters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setFilters({ ...filters, page });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Doubt Forum
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setComposerOpen(true)}>
          Ask a Doubt
        </Button>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <HelpOutline color="primary" />
                  <Typography color="text.secondary" variant="body2">
                    Total Doubts
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.total_doubts}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <HelpOutline color="warning" />
                  <Typography color="text.secondary" variant="body2">
                    Unanswered
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.unanswered_doubts}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp color="success" />
                  <Typography color="text.secondary" variant="body2">
                    Resolved
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.resolved_doubts}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Bookmark color="info" />
                  <Typography color="text.secondary" variant="body2">
                    My Doubts
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.my_doubts}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} sx={{ mb: 2 }}>
        <Tab label="All Doubts" />
        <Tab label="My Doubts" />
        <Tab label="Bookmarked" />
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      <DoubtFeedFilters onFilterChange={handleFilterChange} />

      <Grid container spacing={3}>
        {doubts.map((doubt) => (
          <Grid item xs={12} sm={6} md={4} key={doubt.id}>
            <DoubtCard
              doubt={doubt}
              onView={() => handleViewDoubt(doubt.id)}
              onUpvote={() => handleUpvote(doubt)}
              onBookmark={() => handleBookmark(doubt)}
            />
          </Grid>
        ))}
      </Grid>

      {doubts.length === 0 && (
        <Box textAlign="center" py={8}>
          <HelpOutline sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No doubts found
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Be the first to ask a question!
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setComposerOpen(true)}>
            Ask a Doubt
          </Button>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={filters.page || 1}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      <DoubtComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSuccess={() => {
          loadDoubts();
          loadStats();
          showSnackbar('Doubt posted successfully', 'success');
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DoubtForum;
