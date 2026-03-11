import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Fab,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PullToRefresh, MobileAssignmentCard, TouchOptimizedTextField } from '@/components/mobile';

interface Assignment {
  id: number;
  title: string;
  description?: string;
  total_marks: number;
  due_date?: string;
  status: string;
  submission_count?: number;
  total_students?: number;
}

export default function MobileAssignmentListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockAssignments: Assignment[] = [
        {
          id: 1,
          title: 'Mathematics Assignment 1',
          description: 'Complete exercises from Chapter 5',
          total_marks: 100,
          due_date: '2024-12-25',
          status: 'active',
          submission_count: 20,
          total_students: 30,
        },
        {
          id: 2,
          title: 'Science Project',
          description: 'Build a working model of solar system',
          total_marks: 50,
          due_date: '2024-12-30',
          status: 'active',
          submission_count: 15,
          total_students: 30,
        },
        {
          id: 3,
          title: 'English Essay',
          description: 'Write a 500-word essay on environmental conservation',
          total_marks: 25,
          due_date: '2024-12-20',
          status: 'graded',
          submission_count: 30,
          total_students: 30,
        },
      ];

      setAssignments(mockAssignments);
      setError(null);
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleRefresh = async () => {
    await fetchAssignments();
  };

  const handleView = (assignment: Assignment) => {
    navigate(`/assignments/${assignment.id}`);
  };

  const handleEdit = (assignment: Assignment) => {
    navigate(`/assignments/${assignment.id}/edit`);
  };

  const handleDelete = async (assignment: Assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"?`)) {
      return;
    }
    try {
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
    } catch (err) {
      setError('Failed to delete assignment');
    }
  };

  const handleDownload = (assignment: Assignment) => {
    console.log('Download submissions for', assignment.title);
  };

  const filteredAssignments = assignments
    .filter((a) => {
      if (tabValue === 0) return a.status === 'active';
      if (tabValue === 1) return a.status === 'graded';
      if (tabValue === 2) return a.status === 'draft';
      return true;
    })
    .filter(
      (a) =>
        search === '' ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase())
    );

  if (!isMobile) {
    return null;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: 'background.paper', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Assignments
          </Typography>
          <TouchOptimizedTextField
            fullWidth
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab label="Active" />
          <Tab label="Graded" />
          <Tab label="Draft" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <PullToRefresh onRefresh={handleRefresh}>
          <Box sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                {filteredAssignments.map((assignment) => (
                  <MobileAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                  />
                ))}
                {filteredAssignments.length === 0 && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ py: 4 }}
                  >
                    No assignments found
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </PullToRefresh>
      </Box>

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
        onClick={() => navigate('/assignments/new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
