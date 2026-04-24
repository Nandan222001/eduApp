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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  PullToRefresh,
  MobileStudentCard,
  CollapsibleSection,
  TouchOptimizedTextField,
} from '@/components/mobile';
import studentsApi, { Student as ApiStudent, StudentStatistics } from '@/api/students';

export default function MobileStudentListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.listStudents({
        search: search || undefined,
        limit: 100,
      });
      setStudents(response.items);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await studentsApi.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRefresh = async () => {
    await Promise.all([fetchStudents(), fetchStatistics()]);
  };

  const handleView = (student: { id: number }) => {
    navigate(`/admin/users/students/${student.id}/profile`);
  };

  const handleEdit = (student: { id: number }) => {
    navigate(`/admin/users/students/${student.id}/edit`);
  };

  const handleDelete = async (student: { id: number; first_name: string; last_name: string }) => {
    if (!window.confirm(`Delete ${student.first_name} ${student.last_name}?`)) {
      return;
    }
    try {
      await studentsApi.deleteStudent(student.id);
      fetchStudents();
      fetchStatistics();
    } catch (err) {
      setError('Failed to delete student');
    }
  };

  const handleViewIDCard = (student: { id: number }) => {
    navigate(`/admin/users/students/${student.id}/id-card`);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Students
        </Typography>
        <TouchOptimizedTextField
          fullWidth
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <PullToRefresh onRefresh={handleRefresh}>
          <Box sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {statistics && (
              <CollapsibleSection
                title="Statistics"
                subtitle={`${statistics.total_students} total students`}
                defaultExpanded={false}
                elevation={2}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Students
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {statistics.active_students}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Male Students
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {statistics.male_students}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Female Students
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {statistics.female_students}
                    </Typography>
                  </Box>
                </Stack>
              </CollapsibleSection>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {students.map((student) => (
                  <MobileStudentCard
                    key={student.id}
                    student={student}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewIDCard={handleViewIDCard}
                  />
                ))}
                {students.length === 0 && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ py: 4 }}
                  >
                    No students found
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
        onClick={() => navigate('/admin/users/students/new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
