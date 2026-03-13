import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Paper,
  IconButton,
  Checkbox,
  Divider,
  Badge as MuiBadge,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Book as BookIcon,
  Quiz as QuizIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  TrendingUp as AnalyticsIcon,
  ArrowForward as ArrowForwardIcon,
  Psychology as PsychologyIcon,
  EmojiEvents as BadgeIcon,
} from '@mui/icons-material';
import studentsApi, { StudentDashboardData } from '@/api/students';
import { useAuth } from '@/hooks/useAuth';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

interface WelcomeCardProps {
  name: string;
  photoUrl?: string;
  grade?: string;
  section?: string;
}

function WelcomeCard({ name, photoUrl, grade, section }: WelcomeCardProps) {
  const theme = useTheme();
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        border: 'none',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={photoUrl}
            alt={name}
            sx={{
              width: 80,
              height: 80,
              border: `3px solid ${alpha('#fff', 0.3)}`,
            }}
          >
            {name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {greeting()}, {name}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {grade && section ? `${grade} - Section ${section}` : 'Welcome to your dashboard'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface AttendanceStatusCardProps {
  status: string;
  attendancePercentage: number;
  presentDays: number;
  totalDays: number;
}

function AttendanceStatusCard({
  status,
  attendancePercentage,
  presentDays,
  totalDays,
}: AttendanceStatusCardProps) {
  const theme = useTheme();

  const getStatusInfo = () => {
    switch (status) {
      case 'present':
        return { icon: <CheckCircleIcon />, color: theme.palette.success.main, label: 'Present' };
      case 'absent':
        return { icon: <CancelIcon />, color: theme.palette.error.main, label: 'Absent' };
      case 'late':
        return { icon: <HourglassIcon />, color: theme.palette.warning.main, label: 'Late' };
      default:
        return {
          icon: <HourglassIcon />,
          color: theme.palette.grey[500],
          label: 'Not Marked',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardHeader title="Today's Attendance" />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: alpha(statusInfo.color, 0.1),
              color: statusInfo.color,
              width: 56,
              height: 56,
            }}
          >
            {statusInfo.icon}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {statusInfo.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This Month
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {attendancePercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={attendancePercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor:
                  attendancePercentage >= 75
                    ? theme.palette.success.main
                    : theme.palette.warning.main,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {presentDays} of {totalDays} days present
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

interface AssignmentCardProps {
  assignments: StudentDashboardData['upcoming_assignments'];
  onViewAll: () => void;
}

function UpcomingAssignmentsCard({ assignments, onViewAll }: AssignmentCardProps) {
  const theme = useTheme();

  const getDueDateColor = (daysUntilDue: number) => {
    if (daysUntilDue <= 1) return theme.palette.error.main;
    if (daysUntilDue <= 3) return theme.palette.warning.main;
    return theme.palette.info.main;
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardHeader
        title="Upcoming Assignments"
        subheader={`${assignments.length} assignments due soon`}
        action={
          <IconButton onClick={onViewAll} size="small">
            <ArrowForwardIcon />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List sx={{ py: 0 }}>
          {assignments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No upcoming assignments
              </Typography>
            </Box>
          ) : (
            assignments.slice(0, 4).map((assignment, index) => (
              <Box key={assignment.id}>
                <ListItem sx={{ px: 0, py: 2 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {assignment.title}
                      </Typography>
                      <Chip
                        label={`${assignment.days_until_due}d`}
                        size="small"
                        sx={{
                          bgcolor: alpha(getDueDateColor(assignment.days_until_due), 0.1),
                          color: getDueDateColor(assignment.days_until_due),
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      {assignment.subject} • {assignment.total_marks} marks
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </Typography>
                      {assignment.is_submitted && (
                        <Chip
                          label="Submitted"
                          size="small"
                          color="success"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < assignments.slice(0, 4).length - 1 && <Divider />}
              </Box>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}

interface PendingHomeworkCardProps {
  homework: StudentDashboardData['pending_homework'];
}

function PendingHomeworkCard({ homework }: PendingHomeworkCardProps) {
  const theme = useTheme();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const handleToggle = (id: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardHeader
        title="Pending Homework"
        subheader={`${homework.filter((h) => !h.is_completed).length} tasks to complete`}
      />
      <CardContent sx={{ pt: 0, maxHeight: 400, overflow: 'auto' }}>
        <List sx={{ py: 0 }}>
          {homework.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                All caught up! 🎉
              </Typography>
            </Box>
          ) : (
            homework.slice(0, 8).map((item) => (
              <ListItem
                key={item.id}
                dense
                sx={{
                  px: 0,
                  textDecoration:
                    item.is_completed || checkedItems.has(item.id) ? 'line-through' : 'none',
                  opacity: item.is_completed || checkedItems.has(item.id) ? 0.6 : 1,
                }}
              >
                <Checkbox
                  edge="start"
                  checked={item.is_completed || checkedItems.has(item.id)}
                  onChange={() => handleToggle(item.id)}
                  disabled={item.is_completed}
                  size="small"
                />
                <ListItemText
                  primary={item.title}
                  secondary={
                    <Typography component="span" variant="caption" color="text.secondary">
                      {item.subject} • Due: {new Date(item.due_date).toLocaleDateString()}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}

interface RecentGradesCardProps {
  grades: StudentDashboardData['recent_grades'];
}

function RecentGradesCard({ grades }: RecentGradesCardProps) {
  const theme = useTheme();

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      default:
        return <RemoveIcon sx={{ color: theme.palette.grey[500], fontSize: 16 }} />;
    }
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardHeader title="Recent Grades" subheader="Your latest exam performance" />
      <CardContent sx={{ pt: 0 }}>
        <List sx={{ py: 0 }}>
          {grades.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentTurnedInIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No grades available yet
              </Typography>
            </Box>
          ) : (
            grades.slice(0, 5).map((grade, index) => (
              <Box key={index}>
                <ListItem sx={{ px: 0, py: 2 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {grade.exam_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getTrendIcon(grade.trend)}
                        <Typography variant="body2" fontWeight={700}>
                          {grade.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      {grade.subject}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {grade.marks_obtained} / {grade.max_marks}
                      </Typography>
                      {grade.grade && (
                        <Chip
                          label={grade.grade}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < grades.slice(0, 5).length - 1 && <Divider />}
              </Box>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}

interface AIPredictionCardProps {
  prediction?: StudentDashboardData['ai_prediction'];
}

function AIPredictionCard({ prediction }: AIPredictionCardProps) {
  const theme = useTheme();

  if (!prediction) {
    return (
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardHeader
          title="AI Performance Prediction"
          avatar={<PsychologyIcon sx={{ color: theme.palette.primary.main }} />}
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Prediction will be available after more data is collected
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}
    >
      <CardHeader
        title="AI Performance Prediction"
        avatar={<PsychologyIcon sx={{ color: theme.palette.primary.main }} />}
      />
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h2" fontWeight={700} color="primary.main" gutterBottom>
            {prediction.predicted_percentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Predicted Final Score
          </Typography>
        </Box>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Confidence Level
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {prediction.confidence.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={prediction.confidence}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              },
            }}
          />
          {prediction.confidence_lower !== undefined &&
            prediction.confidence_upper !== undefined && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Range: {prediction.confidence_lower.toFixed(1)}% -{' '}
                {prediction.confidence_upper.toFixed(1)}%
              </Typography>
            )}
        </Box>
      </CardContent>
    </Card>
  );
}

interface WeakAreasCardProps {
  weakAreas: StudentDashboardData['weak_areas'];
}

function WeakAreasCard({ weakAreas }: WeakAreasCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardHeader
        title="Areas for Improvement"
        avatar={<WarningIcon sx={{ color: theme.palette.warning.main }} />}
        subheader="Focus on these topics"
      />
      <CardContent sx={{ pt: 0 }}>
        {weakAreas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <StarIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Great job! No weak areas identified
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {weakAreas.map((area, index) => (
              <Box key={area.id}>
                <ListItem sx={{ px: 0, py: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {area.topic}
                      </Typography>
                      <Chip
                        label={`${area.weakness_score.toFixed(0)}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      {area.subject}
                    </Typography>
                    {area.recommendations.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {area.recommendations.map((rec, i) => (
                          <Chip
                            key={i}
                            label={rec}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </ListItem>
                {index < weakAreas.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

interface StudyStreakCardProps {
  streak: StudentDashboardData['study_streak'];
}

function StudyStreakCard({ streak }: StudyStreakCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Study Streak
          </Typography>
          <FireIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
        </Box>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" fontWeight={700} color="warning.main">
            {streak.current_streak}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Days in a row
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {streak.longest_streak}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Longest Streak
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              🔥
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Keep it up!
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface PointsRankCardProps {
  pointsData: StudentDashboardData['points_and_rank'];
}

function PointsRankCard({ pointsData }: PointsRankCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Points & Rank
          </Typography>
          <TrophyIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
        </Box>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" fontWeight={700} color="primary.main">
            {pointsData.total_points.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Points
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Level {pointsData.level}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current Level
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {pointsData.rank ? `#${pointsData.rank}` : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Leaderboard
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface BadgesDisplayProps {
  badges: StudentDashboardData['badges'];
}

function BadgesDisplay({ badges }: BadgesDisplayProps) {
  const theme = useTheme();

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9C27B0';
      case 'rare':
        return '#2196F3';
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Recent Badges"
        avatar={<BadgeIcon sx={{ color: theme.palette.warning.main }} />}
        subheader={`${badges.length} badges earned`}
      />
      <CardContent>
        {badges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BadgeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Complete tasks to earn badges
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {badges.map((badge) => (
              <Grid item xs={6} sm={4} md={2} key={badge.id}>
                <Tooltip title={badge.description || badge.name} arrow>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `2px solid ${getRarityColor(badge.rarity)}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <MuiBadge
                      badgeContent={
                        <StarIcon sx={{ fontSize: 12, color: getRarityColor(badge.rarity) }} />
                      }
                      overlap="circular"
                    >
                      <Avatar
                        src={badge.icon_url}
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: alpha(getRarityColor(badge.rarity), 0.1),
                          color: getRarityColor(badge.rarity),
                          mx: 'auto',
                        }}
                      >
                        {badge.name.charAt(0)}
                      </Avatar>
                    </MuiBadge>
                    <Typography variant="caption" display="block" fontWeight={600} sx={{ mt: 1 }}>
                      {badge.name}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickLinksProps {
  links: StudentDashboardData['quick_links'];
}

function QuickLinks({ links }: QuickLinksProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'book':
        return <BookIcon />;
      case 'quiz':
        return <QuizIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      case 'trending_up':
        return <AnalyticsIcon />;
      default:
        return <BookIcon />;
    }
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Quick Access" />
      <CardContent>
        <Grid container spacing={2}>
          {links.map((link, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => navigate(link.path)}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {getIcon(link.icon)}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>
                  {link.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const studentId = user?.id ? parseInt(user.id, 10) : 1;

        // Use demo data API if user is demo user, otherwise use real API
        const data = isDemoUser()
          ? await demoDataApi.students.getStudentDashboard(studentId)
          : await studentsApi.getStudentDashboard(studentId);

        setDashboardData(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Dashboard data not available</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <WelcomeCard
            name={dashboardData.student_name}
            photoUrl={dashboardData.photo_url}
            grade={dashboardData.grade}
            section={dashboardData.section}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <AttendanceStatusCard
            status={dashboardData.todays_attendance.status}
            attendancePercentage={dashboardData.attendance_summary.attendance_percentage}
            presentDays={dashboardData.attendance_summary.present_days}
            totalDays={dashboardData.attendance_summary.total_days}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <StudyStreakCard streak={dashboardData.study_streak} />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <PointsRankCard pointsData={dashboardData.points_and_rank} />
        </Grid>

        <Grid item xs={12} md={6}>
          <UpcomingAssignmentsCard
            assignments={dashboardData.upcoming_assignments}
            onViewAll={() => navigate('/student/assignments')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PendingHomeworkCard homework={dashboardData.pending_homework} />
        </Grid>

        <Grid item xs={12} md={6}>
          <RecentGradesCard grades={dashboardData.recent_grades} />
        </Grid>

        <Grid item xs={12} md={6}>
          <AIPredictionCard prediction={dashboardData.ai_prediction} />
        </Grid>

        <Grid item xs={12} md={6}>
          <WeakAreasCard weakAreas={dashboardData.weak_areas} />
        </Grid>

        <Grid item xs={12} md={6}>
          <BadgesDisplay badges={dashboardData.badges} />
        </Grid>

        <Grid item xs={12}>
          <QuickLinks links={dashboardData.quick_links} />
        </Grid>
      </Grid>
    </Box>
  );
}
