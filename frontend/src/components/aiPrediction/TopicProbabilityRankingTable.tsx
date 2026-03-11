import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Rating,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { TopicProbabilityRanking } from '@/api/aiPredictionDashboard';

interface TopicProbabilityRankingTableProps {
  topics: TopicProbabilityRanking[];
}

export default function TopicProbabilityRankingTable({
  topics,
}: TopicProbabilityRankingTableProps) {
  const theme = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'MUST STUDY':
        return theme.palette.error.main;
      case 'VERY HIGH':
        return theme.palette.error.light;
      case 'HIGH':
        return theme.palette.warning.main;
      case 'MEDIUM':
        return theme.palette.info.main;
      case 'OVERDUE':
        return theme.palette.warning.dark;
      default:
        return theme.palette.grey[500];
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'very high':
        return theme.palette.success.main;
      case 'high':
        return theme.palette.success.light;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight={700}>
          Topic Probability Rankings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-powered predictions based on historical exam patterns
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell align="center">Star Rating</TableCell>
              <TableCell>Probability</TableCell>
              <TableCell align="center">Priority</TableCell>
              <TableCell align="center">Confidence</TableCell>
              <TableCell align="center">Expected Marks</TableCell>
              <TableCell align="center">Study Hours</TableCell>
              <TableCell align="center">Frequency</TableCell>
              <TableCell align="center">Last Appeared</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topics.map((topic, index) => (
              <TableRow
                key={topic.topic_id || index}
                hover
                sx={{
                  bgcolor: topic.is_due ? alpha(theme.palette.warning.main, 0.05) : 'transparent',
                }}
              >
                <TableCell>
                  <Typography variant="h6" fontWeight={700}>
                    #{index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {topic.topic_name}
                      {topic.is_due && (
                        <Tooltip title="This topic is overdue and likely to appear">
                          <WarningIcon
                            sx={{
                              fontSize: 16,
                              ml: 1,
                              color: theme.palette.warning.main,
                              verticalAlign: 'middle',
                            }}
                          />
                        </Tooltip>
                      )}
                    </Typography>
                    {topic.chapter_name && (
                      <Typography variant="caption" color="text.secondary">
                        {topic.chapter_name}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Rating value={topic.star_rating} readOnly size="small" />
                </TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 120 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {topic.probability_score.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={topic.probability_score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor:
                            topic.probability_score >= 80
                              ? theme.palette.success.main
                              : topic.probability_score >= 60
                                ? theme.palette.info.main
                                : theme.palette.warning.main,
                        },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={topic.priority_tag}
                    size="small"
                    sx={{
                      bgcolor: alpha(getPriorityColor(topic.priority_tag), 0.1),
                      color: getPriorityColor(topic.priority_tag),
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={topic.confidence_level}
                    size="small"
                    sx={{
                      bgcolor: alpha(getConfidenceColor(topic.confidence_level), 0.1),
                      color: getConfidenceColor(topic.confidence_level),
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUpIcon
                      sx={{ fontSize: 16, mr: 0.5, color: theme.palette.success.main }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {topic.expected_marks.toFixed(1)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccessTimeIcon
                      sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {topic.study_hours_recommended.toFixed(1)}h
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{topic.frequency_count}x</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{topic.last_appeared_year || 'N/A'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({topic.years_since_last_appearance}y ago)
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
