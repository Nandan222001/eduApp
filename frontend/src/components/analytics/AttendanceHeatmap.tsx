import { Card, CardHeader, CardContent, Box, Typography, useTheme, alpha } from '@mui/material';
import { AttendanceCalendarDay } from '@/types/analytics';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface AttendanceHeatmapProps {
  data: AttendanceCalendarDay[];
  month?: Date;
}

export default function AttendanceHeatmap({ data, month = new Date() }: AttendanceHeatmapProps) {
  const theme = useTheme();

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatusColor = (status: AttendanceCalendarDay['status']) => {
    switch (status) {
      case 'present':
        return theme.palette.success.main;
      case 'absent':
        return theme.palette.error.main;
      case 'late':
        return theme.palette.warning.main;
      case 'holiday':
        return theme.palette.info.light;
      case 'weekend':
        return theme.palette.grey[300];
      default:
        return theme.palette.grey[200];
    }
  };

  const getDayData = (day: Date) => {
    return data.find((d) => isSameDay(new Date(d.date), day));
  };

  const firstDayOfWeek = monthStart.getDay();
  const totalCells = Math.ceil((daysInMonth.length + firstDayOfWeek) / 7) * 7;
  const calendarDays = Array.from({ length: totalCells }, (_, i) => {
    const dayIndex = i - firstDayOfWeek;
    return dayIndex >= 0 && dayIndex < daysInMonth.length ? daysInMonth[dayIndex] : null;
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Attendance Calendar" subheader={format(month, 'MMMM yyyy')} />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
          {weekDays.map((day) => (
            <Box key={day} sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>
              {day}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <Box key={`empty-${index}`} />;
            }
            const dayData = getDayData(day);
            const status = dayData?.status || 'weekend';
            const color = getStatusColor(status);

            return (
              <Box
                key={day.toISOString()}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(color, 0.15),
                  border: `2px solid ${color}`,
                  borderRadius: 1,
                  cursor: dayData ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  '&:hover': dayData
                    ? {
                        transform: 'scale(1.05)',
                        boxShadow: theme.shadows[2],
                      }
                    : {},
                }}
              >
                <Typography variant="caption" fontWeight={600}>
                  {format(day, 'd')}
                </Typography>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { status: 'present' as const, label: 'Present' },
            { status: 'absent' as const, label: 'Absent' },
            { status: 'late' as const, label: 'Late' },
            { status: 'holiday' as const, label: 'Holiday' },
          ].map(({ status, label }) => (
            <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: alpha(getStatusColor(status), 0.15),
                  border: `2px solid ${getStatusColor(status)}`,
                  borderRadius: 0.5,
                }}
              />
              <Typography variant="caption">{label}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
