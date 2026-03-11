import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Grid,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import examinationsApi from '@/api/examinations';
import { ExamResult } from '@/types/examination';

export default function StudentMarksheetPage() {
  const theme = useTheme();
  const { examId, studentId } = useParams<{ examId: string; studentId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const loadResult = async () => {
    try {
      setLoading(true);
      const data = await examinationsApi.getStudentResult(
        parseInt(examId!),
        parseInt(studentId!),
        1
      );
      setResult(data);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load result'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, [examId, studentId, loadResult]);

  const handleDownload = () => {
    window.print();
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Marksheet</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Loading marksheet...</Typography>
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Box>
        <Alert severity="error">{error || 'Result not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Student Marksheet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Detailed examination result and performance analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
            Download PDF
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent ref={printRef}>
          <Box
            sx={{
              textAlign: 'center',
              mb: 4,
              pb: 3,
              borderBottom: `2px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              XYZ International School
            </Typography>
            <Typography variant="h6" gutterBottom>
              Academic Year 2023-24
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              Examination Marksheet
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Student Name
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {result.student_name}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Roll Number
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {result.student_roll_number}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {result.total_marks_obtained}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Marks
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        {result.percentage.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Percentage
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                      <EmojiEventsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {result.section_rank || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Class Rank
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: result.is_pass
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                      }}
                    >
                      {result.grade}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {result.grade}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grade
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={600} gutterBottom>
            Subject-wise Performance
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Theory
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Practical
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Total
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Max Marks
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Percentage
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Grade
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Result
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.subject_results?.map((subject) => (
                  <TableRow key={subject.subject_id}>
                    <TableCell>
                      <Typography fontWeight={500}>{subject.subject_name}</Typography>
                    </TableCell>
                    <TableCell align="center">{subject.theory_marks}</TableCell>
                    <TableCell align="center">{subject.practical_marks}</TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={600}>{subject.total_marks}</Typography>
                    </TableCell>
                    <TableCell align="center">{subject.max_marks}</TableCell>
                    <TableCell align="center">
                      <Typography color="primary" fontWeight={600}>
                        {subject.percentage.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={subject.grade || '-'} size="small" color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={subject.is_pass ? 'Pass' : 'Fail'}
                        color={subject.is_pass ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                  <TableCell colSpan={3}>
                    <Typography fontWeight={700}>Overall Total</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700}>{result.total_marks_obtained}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700}>{result.total_max_marks}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700} color="primary">
                      {result.percentage.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={result.grade} color="primary" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.is_pass ? 'Pass' : 'Fail'}
                      color={result.is_pass ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Result
                </Typography>
                <Chip
                  label={result.is_pass ? 'PASS' : 'FAIL'}
                  color={result.is_pass ? 'success' : 'error'}
                  sx={{ fontWeight: 700, fontSize: '1rem', px: 2, py: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Issued On
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              This is a computer-generated marksheet and does not require a signature.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              For any queries, please contact the examination department.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
