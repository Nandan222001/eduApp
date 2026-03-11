import { Box, Typography, alpha } from '@mui/material';
import { School, Assignment, EmojiEvents, TrendingUp, Event, People } from '@mui/icons-material';
import { SwipeableCard } from './';

interface DashboardCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

interface MobileDashboardCardsProps {
  cards: DashboardCardData[];
}

export default function MobileDashboardCards({ cards }: MobileDashboardCardsProps) {
  return (
    <SwipeableCard>
      {cards.map((card, index) => (
        <Box key={index}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              bgcolor: alpha(card.color, 0.1),
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              {card.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {card.title}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {card.value}
              </Typography>
              {card.subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </SwipeableCard>
  );
}

export const getDefaultDashboardCards = (role: string): DashboardCardData[] => {
  if (role === 'admin') {
    return [
      {
        title: 'Total Students',
        value: 1250,
        subtitle: '+45 this month',
        icon: <School sx={{ fontSize: 32 }} />,
        color: '#1976d2',
      },
      {
        title: 'Active Assignments',
        value: 24,
        subtitle: '12 pending review',
        icon: <Assignment sx={{ fontSize: 32 }} />,
        color: '#9c27b0',
      },
      {
        title: 'Attendance Rate',
        value: '94%',
        subtitle: 'Last 7 days',
        icon: <Event sx={{ fontSize: 32 }} />,
        color: '#2e7d32',
      },
      {
        title: 'Performance',
        value: '87%',
        subtitle: 'Average score',
        icon: <TrendingUp sx={{ fontSize: 32 }} />,
        color: '#0288d1',
      },
    ];
  } else if (role === 'teacher') {
    return [
      {
        title: 'My Students',
        value: 85,
        subtitle: '3 classes',
        icon: <People sx={{ fontSize: 32 }} />,
        color: '#1976d2',
      },
      {
        title: 'Assignments',
        value: 8,
        subtitle: '3 need grading',
        icon: <Assignment sx={{ fontSize: 32 }} />,
        color: '#9c27b0',
      },
      {
        title: 'Attendance Today',
        value: '92%',
        subtitle: '78/85 present',
        icon: <Event sx={{ fontSize: 32 }} />,
        color: '#2e7d32',
      },
      {
        title: 'Class Average',
        value: '85%',
        subtitle: 'All subjects',
        icon: <TrendingUp sx={{ fontSize: 32 }} />,
        color: '#0288d1',
      },
    ];
  } else if (role === 'student') {
    return [
      {
        title: 'Assignments',
        value: 5,
        subtitle: '2 due this week',
        icon: <Assignment sx={{ fontSize: 32 }} />,
        color: '#1976d2',
      },
      {
        title: 'My Score',
        value: '88%',
        subtitle: 'Overall average',
        icon: <TrendingUp sx={{ fontSize: 32 }} />,
        color: '#2e7d32',
      },
      {
        title: 'Attendance',
        value: '95%',
        subtitle: 'This semester',
        icon: <Event sx={{ fontSize: 32 }} />,
        color: '#0288d1',
      },
      {
        title: 'Achievements',
        value: 12,
        subtitle: '3 new this month',
        icon: <EmojiEvents sx={{ fontSize: 32 }} />,
        color: '#ed6c02',
      },
    ];
  }

  return [];
};
