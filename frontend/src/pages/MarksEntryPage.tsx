import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import examinationsApi from '@/api/examinations';
import { ExamSubject, BulkMarksEntry } from '@/types/examination';

interface MarksRow {
  student_id: number;
  student_name: string;
  student_roll_number: string;
  theory_marks: number | null;
  practical_marks: number | null;
  total_marks: number;
  is_absent: boolean;
  remarks: string;
  status: 'pending' | 'saved' | 'error';
}

export default function MarksEntryPage() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [marksData, setMarksData] = useState<MarksRow[]>([]);
  const [locked, setLocked] = useState(false);

  const loadExamSubjects = async () => {
    try {
      setLoading(true);
      const examId = parseInt(searchParams.get('exam_id') || '1');
      const data = await examinationsApi.listExamSubjects(examId, 1);
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubject(data[0].id);
      }
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load subjects'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamSubjects();
  }, [loadExamSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      loadMarksData();
    }
  }, [selectedSubject, loadMarksData]);

  const loadMarksData = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      const existingMarks = await examinationsApi.getSubjectMarks(selectedSubject, 1);

      const mockStudents = [
        { id: 1, name: 'John Doe', roll_number: '001' },
        { id: 2, name: 'Jane Smith', roll_number: '002' },
        { id: 3, name: 'Bob Johnson', roll_number: '003' },
        { id: 4, name: 'Alice Williams', roll_number: '004' },
        { id: 5, name: 'Charlie Brown', roll_number: '005' },
      ];

      const rows: MarksRow[] = mockStudents.map((student) => {
        const existingMark = existingMarks.find((m) => m.student_id === student.id);
        return {
          student_id: student.id,
          student_name: student.name,
          student_roll_number: student.roll_number,
          theory_marks: existingMark?.theory_marks_obtained ?? null,
          practical_marks: existingMark?.practical_marks_obtained ?? null,
          total_marks: existingMark?.total_marks_obtained ?? 0,
          is_absent: existingMark?.is_absent ?? false,
          remarks: existingMark?.remarks ?? '',
          status: existingMark ? 'saved' : 'pending',
        };
      });

      setMarksData(rows);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load marks data'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateMarks = (index: number, field: string, value: string | number | boolean | null) => {
    const updated = [...marksData];
    (updated[index] as Record<string, string | number | boolean | null>)[field] = value;

    if (field === 'theory_marks' || field === 'practical_marks') {
      const theory = field === 'theory_marks' ? value : updated[index].theory_marks;
      const practical = field === 'practical_marks' ? value : updated[index].practical_marks;
      updated[index].total_marks = (theory || 0) + (practical || 0);
    }

    if (field === 'is_absent' && value) {
      updated[index].theory_marks = null;
      updated[index].practical_marks = null;
      updated[index].total_marks = 0;
    }

    updated[index].status = 'pending';
    setMarksData(updated);
  };

  const handleSave = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      setError(null);

      const marksEntries: BulkMarksEntry[] = marksData.map((row) => ({
        student_id: row.student_id,
        theory_marks_obtained: row.theory_marks ?? undefined,
        practical_marks_obtained: row.practical_marks ?? undefined,
        is_absent: row.is_absent,
        remarks: row.remarks || undefined,
      }));

      await examinationsApi.bulkEnterMarks(
        {
          exam_subject_id: selectedSubject,
          marks_entries: marksEntries,
        },
        1,
        1
      );

      setSuccess(true);
      setMarksData(marksData.map((row) => ({ ...row, status: 'saved' })));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to save marks'
      );
    } finally {
      setLoading(false);
    }
  };

  const getSubjectInfo = () => {
    return subjects.find((s) => s.id === selectedSubject);
  };

  const subjectInfo = getSubjectInfo();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Marks Entry
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter marks for students in a spreadsheet-like grid
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Marks saved successfully!
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              select
              label="Select Subject"
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(parseInt(e.target.value))}
              sx={{ minWidth: 300 }}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.subject_name || `Subject ${subject.subject_id}`}
                </MenuItem>
              ))}
            </TextField>

            {subjectInfo && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<InfoIcon />}
                  label={`Theory Max: ${subjectInfo.theory_max_marks}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<InfoIcon />}
                  label={`Practical Max: ${subjectInfo.practical_max_marks}`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  icon={<WarningIcon />}
                  label={`Pass: ${subjectInfo.theory_passing_marks + subjectInfo.practical_passing_marks}`}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            )}

            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Tooltip title={locked ? 'Unlock for editing' : 'Lock to prevent changes'}>
                <IconButton onClick={() => setLocked(!locked)} color={locked ? 'error' : 'default'}>
                  {locked ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading || locked}
              >
                Save All Marks
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}>
                  Roll No.
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}>
                  Student Name
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}
                  align="center"
                >
                  Theory ({subjectInfo?.theory_max_marks})
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}
                  align="center"
                >
                  Practical ({subjectInfo?.practical_max_marks})
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}
                  align="center"
                >
                  Total
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}
                  align="center"
                >
                  Absent
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}>
                  Remarks
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, bgcolor: theme.palette.grey[100] }}
                  align="center"
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marksData.map((row, index) => (
                <TableRow
                  key={row.student_id}
                  sx={{
                    bgcolor: row.is_absent ? alpha(theme.palette.error.main, 0.05) : undefined,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                  }}
                >
                  <TableCell>{row.student_roll_number}</TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{row.student_name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={row.theory_marks ?? ''}
                      onChange={(e) =>
                        updateMarks(index, 'theory_marks', parseFloat(e.target.value) || null)
                      }
                      disabled={row.is_absent || locked}
                      sx={{ width: 80 }}
                      inputProps={{
                        min: 0,
                        max: subjectInfo?.theory_max_marks,
                        step: 0.5,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={row.practical_marks ?? ''}
                      onChange={(e) =>
                        updateMarks(index, 'practical_marks', parseFloat(e.target.value) || null)
                      }
                      disabled={row.is_absent || locked}
                      sx={{ width: 80 }}
                      inputProps={{
                        min: 0,
                        max: subjectInfo?.practical_max_marks,
                        step: 0.5,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600} color="primary">
                      {row.total_marks.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={row.is_absent}
                      onChange={(e) => updateMarks(index, 'is_absent', e.target.checked)}
                      disabled={locked}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.remarks}
                      onChange={(e) => updateMarks(index, 'remarks', e.target.value)}
                      disabled={locked}
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {row.status === 'saved' && (
                      <Chip icon={<CheckCircleIcon />} label="Saved" color="success" size="small" />
                    )}
                    {row.status === 'pending' && (
                      <Chip icon={<WarningIcon />} label="Pending" color="warning" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
