import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentEducationApi } from '@/api/parentEducation';
import { CourseLevel } from '@/types/parentEducation';
import { useToast } from '@/hooks/useToast';

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

export const ParentEducationPortal: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['parent-courses', { search: searchQuery, level: selectedLevel }],
    queryFn: () =>
      parentEducationApi.getCourses({
        search: searchQuery || undefined,
        level: selectedLevel || undefined,
      }),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: number) => parentEducationApi.enrollCourse(courseId),
    onSuccess: (enrollment) => {
      toast.success('Successfully enrolled in course!');
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      navigate(`/parent/education/learning/${enrollment.id}`);
    },
    onError: () => {
      toast.error('Failed to enroll in course');
    },
  });

  const handleEnroll = (courseId: number) => {
    enrollMutation.mutate(courseId);
  };

  const handleLevelChange = (event: SelectChangeEvent) => {
    setSelectedLevel(event.target.value);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Parent Education Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enhance your parenting skills with expert-led courses
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select value={selectedLevel} onChange={handleLevelChange} label="Difficulty Level">
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value={CourseLevel.BEGINNER}>Beginner</MenuItem>
                  <MenuItem value={CourseLevel.INTERMEDIATE}>Intermediate</MenuItem>
                  <MenuItem value={CourseLevel.ADVANCED}>Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load courses. Please try again later.
          </Alert>
        )}

        {/* Course Grid */}
        {!isLoading && !error && (
          <>
            {courses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <MenuBookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No courses found
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {courses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      {/* Thumbnail */}
                      <CardMedia
                        component="img"
                        height="180"
                        image={course.thumbnail_url || '/placeholder-course.jpg'}
                        alt={course.title}
                        sx={{ bgcolor: 'grey.200' }}
                      />

                      <CardContent sx={{ flexGrow: 1 }}>
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
                            minHeight: '3em',
                          }}
                        >
                          {course.title}
                        </Typography>

                        {/* Instructor */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Avatar src={course.instructor_photo_url} sx={{ width: 24, height: 24 }}>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {course.instructor_name}
                          </Typography>
                        </Box>

                        {/* Stats */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip
                            size="small"
                            label={levelLabels[course.level]}
                            color={levelColors[course.level]}
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            size="small"
                            icon={<TimerIcon />}
                            label={formatDuration(course.duration_minutes)}
                          />
                          <Chip
                            size="small"
                            icon={<MenuBookIcon />}
                            label={`${course.total_lessons} lessons`}
                          />
                        </Box>

                        {/* Rating & Enrollment */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          {course.rating !== undefined && course.rating !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Rating value={course.rating} precision={0.1} size="small" readOnly />
                              <Typography variant="caption" color="text.secondary">
                                ({course.rating_count || 0})
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {course.enrollment_count.toLocaleString()} enrolled
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollMutation.isPending}
                        >
                          {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default ParentEducationPortal;
