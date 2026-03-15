import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  WbSunny,
  AccessTime,
  Assignment,
  School,
} from '@mui/icons-material';
import {
  DailyBriefing as DailyBriefingType,
  ScheduleItem,
  WeakTopic,
  ExamReadiness,
} from '@/types/studyBuddy';
import { format } from 'date-fns';

interface DailyBriefingProps {
  briefing: DailyBriefingType;
}

export default function DailyBriefing({ briefing }: DailyBriefingProps) {
  const theme = useTheme();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ongoing':
        return theme.palette.success.main;
      case 'upcoming':
        return theme.palette.info.main;
      case 'completed':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp fontSize="small" color="success" />;
      case 'declining':
        return <TrendingDown fontSize="small" color="error" />;
      default:
        return <Remove fontSize="small" color="disabled" />;
    }
  };

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 80) return theme.palette.success.main;
    if (readiness >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 56, height: 56 }}>
            <WbSunny sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Good Morning! ☀️
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {format(briefing.date, 'EEEE, MMMM d, yyyy')}
            </Typography>
          </Box>
        </Box>

        {briefing.motivationalQuote && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: alpha('#fff', 0.1),
              borderRadius: 2,
              borderLeft: `4px solid ${alpha('#fff', 0.3)}`,
            }}
          >
            <Typography variant="body2" fontStyle="italic" sx={{ opacity: 0.95 }}>
              &ldquo;{briefing.motivationalQuote}&rdquo;
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AccessTime fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Today&apos;s Schedule
            </Typography>
          </Box>
          <List disablePadding sx={{ bgcolor: alpha('#fff', 0.1), borderRadius: 2 }}>
            {briefing.schedule.slice(0, 4).map((item: ScheduleItem, index: number) => (
              <ListItem
                key={item.id}
                sx={{
                  borderBottom:
                    index < Math.min(briefing.schedule.length, 4) - 1
                      ? `1px solid ${alpha('#fff', 0.1)}`
                      : 'none',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.time}
                      </Typography>
                      <Chip
                        label={item.type}
                        size="small"
                        sx={{
                          bgcolor: alpha('#fff', 0.2),
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: alpha('#fff', 0.9), mt: 0.5 }}>
                      {item.subject}
                    </Typography>
                  }
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(item.status),
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Assignment fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Focus Areas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {briefing.weakTopics.slice(0, 3).map((topic: WeakTopic) => (
              <Chip
                key={topic.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{topic.topic}</span>
                    {getTrendIcon(topic.trend)}
                  </Box>
                }
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <School fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              Exam Readiness
            </Typography>
          </Box>
          {briefing.examReadiness.slice(0, 3).map((exam: ExamReadiness) => (
            <Box key={exam.subject} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  {exam.subject}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {exam.readiness}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={exam.readiness}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha('#fff', 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getReadinessColor(exam.readiness),
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
