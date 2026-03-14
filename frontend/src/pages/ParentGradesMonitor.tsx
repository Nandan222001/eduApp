import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
  LinearProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
  Grade as GradeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';
import { demoData } from '@/data/dummyData';

interface Grade {
  id: number;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
}

export default function ParentGradesMonitor() {
  const theme = useTheme();
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(undefined);

  const {
    data: children,
    isLoading: isLoadingChildren,
    error: childrenError,
  } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => (isDemoUser() ? demoDataApi.parents.getChildren() : parentsApi.getChildren()),
  });

  const childId = selectedChildId || children?.[0]?.id;

  const gradesMonitorData = isDemoUser()
    ? childId === 1101
      ? demoData.parent.gradesMonitor.child1
      : demoData.parent.gradesMonitor.child2
    : null;

  const recentGrades = gradesMonitorData?.recent_grades || [];

  const gradesData: Grade[] = recentGrades.map(
    (
      grade: {
        subject_name: string;
        exam_type: string;
        marks_obtained: number;
        total_marks: number;
        percentage: number;
        grade?: string;
        exam_date: string;
      },
      index: number
    ) => ({
      id: index + 1,
      subject: grade.subject_name,
      examType: grade.exam_type,
      marksObtained: grade.marks_obtained,
      maxMarks: grade.total_marks,
      percentage: grade.percentage,
      grade: grade.grade || 'N/A',
      date: new Date(grade.exam_date).toISOString().split('T')[0],
      trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'stable' : 'down',
    })
  ) || [
    {
      id: 1,
      subject: 'Mathematics',
      examType: 'Unit Test 3',
      marksObtained: 85,
      maxMarks: 100,
      percentage: 85,
      grade: 'A',
      date: '2024-11-10',
      trend: 'up',
    },
    {
      id: 2,
      subject: 'Science',
      examType: 'Unit Test 3',
      marksObtained: 78,
      maxMarks: 100,
      percentage: 78,
      grade: 'B+',
      date: '2024-11-08',
      trend: 'stable',
    },
    {
      id: 3,
      subject: 'English',
      examType: 'Unit Test 3',
      marksObtained: 92,
      maxMarks: 100,
      percentage: 92,
      grade: 'A+',
      date: '2024-11-05',
      trend: 'up',
    },
    {
      id: 4,
      subject: 'Social Studies',
      examType: 'Unit Test 3',
      marksObtained: 72,
      maxMarks: 100,
      percentage: 72,
      grade: 'B',
      date: '2024-11-03',
      trend: 'down',
    },
    {
      id: 5,
      subject: 'Computer Science',
      examType: 'Unit Test 3',
      marksObtained: 88,
      maxMarks: 100,
      percentage: 88,
      grade: 'A',
      date: '2024-11-01',
      trend: 'up',
    },
  ];

  const totalMarks = gradesData.reduce((sum, g) => sum + g.marksObtained, 0);
  const maxMarks = gradesData.reduce((sum, g) => sum + g.maxMarks, 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

  const overallStats = {
    totalMarks,
    maxMarks,
    percentage,
    grade:
      percentage >= 90
        ? 'A+'
        : percentage >= 80
          ? 'A'
          : percentage >= 70
            ? 'B+'
            : percentage >= 60
              ? 'B'
              : 'C',
  };

  const handleChildChange = (event: SelectChangeEvent<number>) => {
    setSelectedChildId(event.target.value as number);
  };

  if (isLoadingChildren) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (childrenError) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Failed to load children data. Please try again later.</Alert>
        </Box>
      </Container>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      default:
        return <StableIcon sx={{ color: theme.palette.grey[500], fontSize: 16 }} />;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return theme.palette.success.main;
    if (percentage >= 75) return theme.palette.info.main;
    if (percentage >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Grades & Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your child&apos;s academic performance and exam results
          </Typography>

          {children && children.length > 1 && (
            <Box sx={{ mt: 3, maxWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel id="child-select-label">Select Child</InputLabel>
                <Select
                  labelId="child-select-label"
                  id="child-select"
                  value={childId || children[0].id}
                  label="Select Child"
                  onChange={handleChildChange}
                >
                  {children.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                      {child.grade_name &&
                        child.section_name &&
                        ` - ${child.grade_name} ${child.section_name}`}
                      {child.admission_number && ` (${child.admission_number})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardHeader
                title="Overall Performance"
                avatar={
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <GradeIcon sx={{ color: theme.palette.primary.main }} />
                  </Avatar>
                }
              />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" fontWeight={700} color="primary.main" gutterBottom>
                    {overallStats.percentage}%
                  </Typography>
                  <Chip
                    label={`Grade ${overallStats.grade}`}
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      fontWeight: 700,
                      fontSize: '1rem',
                      height: 32,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {overallStats.totalMarks} / {overallStats.maxMarks} marks
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={overallStats.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getGradeColor(overallStats.percentage),
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardHeader title="Subject-wise Performance" subheader="Current term results" />
              <CardContent>
                <Grid container spacing={2}>
                  {gradesData.slice(0, 3).map((grade) => (
                    <Grid item xs={12} sm={4} key={grade.id}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color={getGradeColor(grade.percentage)}
                        >
                          {grade.percentage}%
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                          {grade.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Grade {grade.grade}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardHeader title="Recent Exam Results" subheader="Latest test scores and grades" />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          Subject
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          Exam Type
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          Marks
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          Percentage
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          Grade
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          Trend
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          Date
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gradesData.map((grade) => (
                      <TableRow key={grade.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {grade.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{grade.examType}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {grade.marksObtained} / {grade.maxMarks}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                bgcolor: alpha(getGradeColor(grade.percentage), 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color={getGradeColor(grade.percentage)}
                              >
                                {grade.percentage}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={grade.grade}
                            size="small"
                            sx={{
                              bgcolor: alpha(getGradeColor(grade.percentage), 0.1),
                              color: getGradeColor(grade.percentage),
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">{getTrendIcon(grade.trend)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(grade.date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                bgcolor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 24 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="info.dark" gutterBottom>
                      About Grades Monitoring
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This is a view-only section. Grades are entered and managed by teachers. You
                      can view your child&apos;s performance but cannot modify any records. For
                      queries about grades or to request re-evaluation, please contact the subject
                      teacher or class coordinator.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
