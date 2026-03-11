import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Schedule as LateIcon,
} from '@mui/icons-material';
import { AssignmentSubmissionStats } from '@/types/analytics';

interface AssignmentSubmissionRateProps {
  data: AssignmentSubmissionStats;
}

export default function AssignmentSubmissionRate({ data }: AssignmentSubmissionRateProps) {
  const theme = useTheme();

  const stats = [
    {
      label: 'Submitted',
      value: data.submitted,
      color: theme.palette.success.main,
      icon: <CheckCircleIcon />,
    },
    {
      label: 'Pending',
      value: data.pending,
      color: theme.palette.warning.main,
      icon: <PendingIcon />,
    },
    {
      label: 'Late',
      value: data.late,
      color: theme.palette.error.main,
      icon: <LateIcon />,
    },
  ];

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardHeader
        title="Assignment Submission Rate"
        subheader={`${data.total} total assignments`}
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h3" fontWeight={700} color="primary">
              {data.submissionRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submission Rate
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={data.submissionRate}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
              },
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {stats.map((stat) => (
            <Grid item xs={4} key={stat.label}>
              <Box
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  backgroundColor: alpha(stat.color, 0.1),
                  border: `1px solid ${alpha(stat.color, 0.3)}`,
                }}
              >
                <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700} color={stat.color}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Total: {data.total} assignments
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            On-time submissions: {data.submitted - data.late} (
            {(((data.submitted - data.late) / data.total) * 100).toFixed(1)}%)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
