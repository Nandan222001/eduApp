import { Box, Typography, useTheme, alpha, Tooltip } from '@mui/material';
import { DailyFocusTime } from '@/types/pomodoro';

interface StudyStreakCalendarProps {
  data: DailyFocusTime[];
}

export default function StudyStreakCalendar({ data }: StudyStreakCalendarProps) {
  const theme = useTheme();

  const getColor = (minutes: number): string => {
    if (minutes === 0) return theme.palette.grey[200];
    if (minutes < 30) return alpha(theme.palette.success.main, 0.3);
    if (minutes < 60) return alpha(theme.palette.success.main, 0.5);
    if (minutes < 120) return alpha(theme.palette.success.main, 0.7);
    return theme.palette.success.main;
  };

  const getLast12Weeks = (): DailyFocusTime[][] => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83);

    const weeks: DailyFocusTime[][] = [];
    let currentWeek: DailyFocusTime[] = [];

    for (let i = 0; i < 84; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = data.find((d) => d.date === dateStr) || {
        date: dateStr,
        total_minutes: 0,
        session_count: 0,
        completed_sessions: 0,
      };

      currentWeek.push(dayData);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return weeks;
  };

  const weeks = getLast12Weeks();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatTooltip = (item: DailyFocusTime): string => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const hours = Math.floor(item.total_minutes / 60);
    const minutes = item.total_minutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    if (item.total_minutes === 0) {
      return `${dateStr}: No study time`;
    }
    return `${dateStr}: ${timeStr} (${item.session_count} sessions)`;
  };

  if (data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No calendar data available yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Start studying to track your consistency
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 2 }}>
        <Box sx={{ minWidth: 40, mr: 1 }}>
          {weekDays.map((day, index) => (
            <Box
              key={index}
              sx={{
                height: 16,
                display: 'flex',
                alignItems: 'center',
                mb: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {weeks.map((week, weekIndex) => (
          <Box key={weekIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {week.map((day, dayIndex) => (
              <Tooltip key={dayIndex} title={formatTooltip(day)} arrow placement="top">
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: getColor(day.total_minutes),
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      transform: 'scale(1.2)',
                      boxShadow: theme.shadows[2],
                    },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Less
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2, 3, 4].map((level) => (
            <Box
              key={level}
              sx={{
                width: 16,
                height: 16,
                bgcolor: getColor(level * 30),
                borderRadius: 0.5,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          More
        </Typography>
        <Box sx={{ ml: 2, display: 'flex', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            0m = No activity
          </Typography>
          <Typography variant="caption" color="text.secondary">
            30m+ = Light
          </Typography>
          <Typography variant="caption" color="text.secondary">
            60m+ = Moderate
          </Typography>
          <Typography variant="caption" color="text.secondary">
            120m+ = High
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          💡 <strong>Tip:</strong> Consistent daily study sessions help build strong learning habits
          and improve retention!
        </Typography>
      </Box>
    </Box>
  );
}
