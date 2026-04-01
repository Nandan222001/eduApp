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
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
  Alert,
  alpha,
  Paper,
  Divider,
} from '@mui/material';
import {
  PlayCircle as PlayIcon,
  Download as DownloadIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  CardMembership as CertificateIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { parentEducationApi } from '@/api/parentEducation';
import { EnrollmentStatus } from '@/types/parentEducation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ParentCoursesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const {
    data: enrollments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => parentEducationApi.getMyEnrollments(),
  });

  const activeEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);
  const completedEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED);

  const handleDownloadCertificate = async (enrollmentId: number) => {
    try {
      const blob = await parentEducationApi.downloadCertificate(enrollmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${enrollmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const getBadges = (): Badge[] => {
    const allBadges: Badge[] = [];
    enrollments.forEach((enrollment) => {
      if (enrollment.badges) {
        allBadges.push(...enrollment.badges);
      }
    });
    return allBadges;
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load your courses
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Courses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Continue your learning journey
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <PlayIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {activeEnrollments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Courses
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {completedEnrollments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <TrophyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {getBadges().length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Badges Earned
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <CertificateIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {completedEnrollments.filter((e) => e.certificate_url).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Certificates
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
            <Tab label={`Active (${activeEnrollments.length})`} />
            <Tab label={`Completed (${completedEnrollments.length})`} />
            <Tab label="Badges" />
          </Tabs>
        </Paper>

        {/* Active Courses Tab */}
        <TabPanel value={currentTab} index={0}>
          {activeEnrollments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PlayIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No active courses
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/parent/education')}
                sx={{ mt: 2 }}
              >
                Browse Courses
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {activeEnrollments.map((enrollment) => (
                <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={enrollment.course?.thumbnail_url || '/placeholder-course.jpg'}
                      alt={enrollment.course?.title}
                      sx={{ bgcolor: 'grey.200' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {enrollment.course?.title}
                      </Typography>

                      {/* Progress */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {enrollment.progress_percentage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={enrollment.progress_percentage}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {enrollment.completed_lessons} of {enrollment.total_lessons} lessons
                        </Typography>
                      </Box>

                      {/* Next Lesson */}
                      {enrollment.current_lesson && (
                        <Paper
                          variant="outlined"
                          sx={{ p: 1.5, bgcolor: alpha('primary.main', 0.05) }}
                        >
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Next Lesson
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {enrollment.current_lesson.title}
                          </Typography>
                        </Paper>
                      )}

                      {/* Last Accessed */}
                      {enrollment.last_accessed_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                          Last accessed:{' '}
                          {new Date(enrollment.last_accessed_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayIcon />}
                        onClick={() => navigate(`/parent/education/learning/${enrollment.id}`)}
                      >
                        Continue Learning
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Completed Courses Tab */}
        <TabPanel value={currentTab} index={1}>
          {completedEnrollments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No completed courses yet
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {completedEnrollments.map((enrollment) => (
                <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={enrollment.course?.thumbnail_url || '/placeholder-course.jpg'}
                      alt={enrollment.course?.title}
                      sx={{ bgcolor: 'grey.200' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Chip
                        label="Completed"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {enrollment.course?.title}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Completed on:{' '}
                        {enrollment.completed_at &&
                          new Date(enrollment.completed_at).toLocaleDateString()}
                      </Typography>

                      {enrollment.certificate_url && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            icon={<CertificateIcon />}
                            label="Certificate Available"
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => navigate(`/parent/education/learning/${enrollment.id}`)}
                          >
                            Review Course
                          </Button>
                        </Grid>
                        {enrollment.certificate_url && (
                          <Grid item xs={12}>
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadCertificate(enrollment.id)}
                            >
                              Download Certificate
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Badges Tab */}
        <TabPanel value={currentTab} index={2}>
          {getBadges().length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No badges earned yet
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {getBadges().map((badge, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Avatar
                      src={badge.icon_url}
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: 'warning.light',
                      }}
                    >
                      <TrophyIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {badge.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {badge.description}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                      Earned: {new Date(badge.awarded_at).toLocaleDateString()}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ParentCoursesDashboard;
