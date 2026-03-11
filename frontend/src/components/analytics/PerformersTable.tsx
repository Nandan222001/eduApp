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
  Avatar,
  Chip,
  Box,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, Warning as WarningIcon } from '@mui/icons-material';
import { TopPerformer, BottomPerformer } from '@/types/analytics';

interface PerformersTableProps {
  topPerformers: TopPerformer[];
  bottomPerformers: BottomPerformer[];
}

export default function PerformersTable({ topPerformers, bottomPerformers }: PerformersTableProps) {
  const theme = useTheme();

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return theme.palette.grey[500];
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <CardHeader
          title="Top Performers"
          avatar={<TrophyIcon sx={{ color: theme.palette.warning.main }} />}
          subheader="Students excelling in the class"
        />
        <CardContent sx={{ pt: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell align="right">Avg Score</TableCell>
                  <TableCell align="right">Attendance</TableCell>
                  <TableCell align="right">Assignments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPerformers.map((student) => (
                  <TableRow
                    key={student.student_id}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: '0.75rem',
                            bgcolor: getRankColor(student.rank),
                            color: student.rank <= 3 ? '#000' : '#fff',
                          }}
                        >
                          {student.rank}
                        </Avatar>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {student.student_name}
                        </Typography>
                        {student.roll_number && (
                          <Typography variant="caption" color="text.secondary">
                            Roll: {student.roll_number}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${student.average_score.toFixed(1)}%`}
                        size="small"
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {student.attendance_percentage.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{student.assignments_submitted}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <CardHeader
          title="Students Needing Support"
          avatar={<WarningIcon sx={{ color: theme.palette.warning.main }} />}
          subheader="Students who may benefit from extra attention"
        />
        <CardContent sx={{ pt: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell align="right">Avg Score</TableCell>
                  <TableCell align="right">Attendance</TableCell>
                  <TableCell>Weak Subjects</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bottomPerformers.map((student) => (
                  <TableRow
                    key={student.student_id}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {student.student_name}
                        </Typography>
                        {student.roll_number && (
                          <Typography variant="caption" color="text.secondary">
                            Roll: {student.roll_number}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${student.average_score.toFixed(1)}%`}
                        size="small"
                        color={student.average_score < 40 ? 'error' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={student.attendance_percentage < 75 ? 'error' : 'text.primary'}
                      >
                        {student.attendance_percentage.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {student.weak_subjects.slice(0, 3).map((subject) => (
                          <Chip
                            key={subject}
                            label={subject}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                        {student.weak_subjects.length > 3 && (
                          <Chip
                            label={`+${student.weak_subjects.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
