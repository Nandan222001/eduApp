import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  TextField,
} from '@mui/material';
import { Promote as PromoteIcon, Cancel as CancelIcon } from '@mui/icons-material';
import studentsApi, { Student, StudentPromotionRequest } from '@/api/students';

export default function StudentPromotion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sourceGradeId, setSourceGradeId] = useState<number | ''>('');
  const [sourceSectionId, setSourceSectionId] = useState<number | ''>('');
  const [targetGradeId, setTargetGradeId] = useState<number | ''>('');
  const [targetSectionId, setTargetSectionId] = useState<number | ''>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await studentsApi.listStudents({
        grade_id: sourceGradeId || undefined,
        section_id: sourceSectionId || undefined,
        is_active: true,
        limit: 100,
      });
      setStudents(response.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (sourceGradeId || sourceSectionId) {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceGradeId, sourceSectionId]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handlePromote = async () => {
    if (!targetGradeId) {
      setError('Please select a target grade');
      return;
    }

    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }

    try {
      setLoading(true);
      const data: StudentPromotionRequest = {
        student_ids: Array.from(selectedStudents),
        target_grade_id: targetGradeId as number,
        target_section_id: targetSectionId || undefined,
        effective_date: effectiveDate || undefined,
      };

      const result = await studentsApi.promoteStudents(data);

      if (result.promoted > 0) {
        setSuccess(`Successfully promoted ${result.promoted} student(s)`);
        setSelectedStudents(new Set());
        fetchStudents();
      }

      if (result.failed > 0) {
        setError(`Failed to promote ${result.failed} student(s)`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to promote students');
    } finally {
      setLoading(false);
    }
  };

  const allSelected = students.length > 0 && selectedStudents.size === students.length;
  const someSelected = selectedStudents.size > 0 && selectedStudents.size < students.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Promote Students
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Source Class
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Source Grade</InputLabel>
              <Select
                value={sourceGradeId}
                label="Source Grade"
                onChange={(e) => setSourceGradeId(e.target.value as number)}
              >
                <MenuItem value="">Select Grade</MenuItem>
                <MenuItem value={1}>Grade 1</MenuItem>
                <MenuItem value={2}>Grade 2</MenuItem>
                <MenuItem value={3}>Grade 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Source Section (Optional)</InputLabel>
              <Select
                value={sourceSectionId}
                label="Source Section (Optional)"
                onChange={(e) => setSourceSectionId(e.target.value as number)}
              >
                <MenuItem value="">All Sections</MenuItem>
                <MenuItem value={1}>Section A</MenuItem>
                <MenuItem value={2}>Section B</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Target Class
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Target Grade</InputLabel>
              <Select
                value={targetGradeId}
                label="Target Grade"
                onChange={(e) => setTargetGradeId(e.target.value as number)}
              >
                <MenuItem value="">Select Grade</MenuItem>
                <MenuItem value={2}>Grade 2</MenuItem>
                <MenuItem value={3}>Grade 3</MenuItem>
                <MenuItem value={4}>Grade 4</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Target Section (Optional)</InputLabel>
              <Select
                value={targetSectionId}
                label="Target Section (Optional)"
                onChange={(e) => setTargetSectionId(e.target.value as number)}
              >
                <MenuItem value="">Auto Assign</MenuItem>
                <MenuItem value={1}>Section A</MenuItem>
                <MenuItem value={2}>Section B</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Effective Date (Optional)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {students.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box
            sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="h6">Select Students ({selectedStudents.size} selected)</Typography>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Admission No.</TableCell>
                  <TableCell>Current Class</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingStudents ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow
                      key={student.id}
                      hover
                      onClick={() => handleSelectStudent(student.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedStudents.has(student.id)} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={student.photo_url}
                            alt={`${student.first_name} ${student.last_name}`}
                            sx={{ width: 40, height: 40 }}
                          >
                            {student.first_name[0]}
                            {student.last_name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {student.first_name} {student.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{student.admission_number || '-'}</TableCell>
                      <TableCell>
                        {student.section
                          ? `${student.section.grade?.name || '-'} / ${student.section.name}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={student.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/admin/students')}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <PromoteIcon />}
          onClick={handlePromote}
          disabled={loading || selectedStudents.size === 0 || !targetGradeId}
        >
          {loading ? 'Promoting...' : `Promote ${selectedStudents.size} Student(s)`}
        </Button>
      </Box>
    </Box>
  );
}
