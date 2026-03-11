import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Chip,
  LinearProgress,
  Box,
  alpha,
} from '@mui/material';
import { School as TeacherIcon, Star as StarIcon, Speed as SpeedIcon } from '@mui/icons-material';
import { TeacherEffectiveness } from '@/types/analytics';

interface TeacherEffectivenessMetricsProps {
  data: TeacherEffectiveness[];
}

export default function TeacherEffectivenessMetrics({ data }: TeacherEffectivenessMetricsProps) {
  const theme = useTheme();

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getResponseTimeColor = (hours?: number) => {
    if (!hours) return theme.palette.grey[500];
    if (hours <= 24) return theme.palette.success.main;
    if (hours <= 48) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Teacher Effectiveness Metrics"
        avatar={<TeacherIcon sx={{ color: theme.palette.primary.main }} />}
        subheader="Performance analysis of teaching staff"
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell align="center">Students</TableCell>
                <TableCell align="right">Class Score</TableCell>
                <TableCell align="right">Satisfaction</TableCell>
                <TableCell align="right">Response Time</TableCell>
                <TableCell align="right">Graded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((teacher) => (
                <TableRow
                  key={teacher.teacher_id}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {teacher.teacher_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {teacher.subjects.slice(0, 2).map((subject) => (
                        <Chip
                          key={subject}
                          label={subject}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {teacher.subjects.length > 2 && (
                        <Chip
                          label={`+${teacher.subjects.length - 2}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{teacher.totalStudents}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ minWidth: 100 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={600}>
                          {teacher.averageClassScore.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={teacher.averageClassScore}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: alpha(getScoreColor(teacher.averageClassScore), 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getScoreColor(teacher.averageClassScore),
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {teacher.studentSatisfaction !== undefined ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <StarIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                        <Typography variant="body2" fontWeight={600}>
                          {teacher.studentSatisfaction.toFixed(1)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {teacher.responseTime !== undefined ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <SpeedIcon
                          sx={{
                            fontSize: 16,
                            color: getResponseTimeColor(teacher.responseTime),
                          }}
                        />
                        <Typography
                          variant="body2"
                          color={getResponseTimeColor(teacher.responseTime)}
                        >
                          {teacher.responseTime.toFixed(0)}h
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{teacher.assignmentsGraded}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
