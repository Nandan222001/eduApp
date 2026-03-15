import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Rating,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { Course, CourseLevel } from '@/types/parentEducation';

const levelColors = {
  [CourseLevel.BEGINNER]: 'success',
  [CourseLevel.INTERMEDIATE]: 'warning',
  [CourseLevel.ADVANCED]: 'error',
} as const;

const levelLabels = {
  [CourseLevel.BEGINNER]: 'Beginner',
  [CourseLevel.INTERMEDIATE]: 'Intermediate',
  [CourseLevel.ADVANCED]: 'Advanced',
};

interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: number) => void;
  enrolling?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll, enrolling = false }) => {
  const theme = useTheme();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      {/* Thumbnail */}
      <CardMedia
        component="img"
        height="200"
        image={course.thumbnail_url || '/placeholder-course.jpg'}
        alt={course.title}
        sx={{
          bgcolor: 'grey.200',
          objectFit: 'cover',
        }}
      />

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={600}
          gutterBottom
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.6em',
            mb: 2,
          }}
        >
          {course.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8em',
            mb: 2,
          }}
        >
          {course.description}
        </Typography>

        {/* Instructor */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Avatar src={course.instructor_photo_url} sx={{ width: 28, height: 28 }}>
            <PersonIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {course.instructor_name}
          </Typography>
        </Box>

        {/* Stats Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            size="small"
            label={levelLabels[course.level]}
            color={levelColors[course.level]}
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
          <Chip
            size="small"
            icon={<TimerIcon sx={{ fontSize: 14 }} />}
            label={formatDuration(course.duration_minutes)}
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            size="small"
            icon={<MenuBookIcon sx={{ fontSize: 14 }} />}
            label={`${course.total_lessons} lessons`}
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>

        {/* Rating */}
        {course.rating !== undefined && course.rating !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating value={course.rating} precision={0.1} size="small" readOnly />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {course.rating.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({course.rating_count || 0})
            </Typography>
          </Box>
        )}

        {/* Enrollment Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {course.enrollment_count.toLocaleString()} students enrolled
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => onEnroll(course.id)}
          disabled={enrolling}
          sx={{
            py: 1.5,
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          {enrolling ? 'Enrolling...' : 'Enroll Now'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default CourseCard;
