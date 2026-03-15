import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
  LocalActivity as ActivityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { volunteerApi } from '@/api/volunteer';
import { useAuth } from '@/hooks/useAuth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`volunteer-tabpanel-${index}`}
      aria-labelledby={`volunteer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const VolunteerLeaderboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['volunteer-leaderboard'],
    queryFn: () => volunteerApi.getLeaderboard(50),
  });

  const { data: gradeStats, isLoading: gradeStatsLoading } = useQuery({
    queryKey: ['volunteer-grade-stats'],
    queryFn: volunteerApi.getGradeStats,
  });

  const { data: communityImpact, isLoading: impactLoading } = useQuery({
    queryKey: ['volunteer-community-impact'],
    queryFn: volunteerApi.getCommunityImpact,
  });

  const anonymousMutation = useMutation({
    mutationFn: volunteerApi.updateAnonymousSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-leaderboard'] });
    },
  });

  const handleAnonymousToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsAnonymous(newValue);
    anonymousMutation.mutate(newValue);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return undefined;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank) }} />;
    }
    return null;
  };

  if (leaderboardLoading || gradeStatsLoading || impactLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const userEntry = leaderboard?.find((entry) => entry.parent_id === parseInt(user?.id || '0'));

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Volunteer Leaderboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Celebrating our school community&apos;s volunteer contributions
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={isAnonymous} onChange={handleAnonymousToggle} />}
            label="Display as Anonymous"
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {communityImpact?.total_volunteers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Volunteers
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
                    <TimeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {communityImpact?.total_hours.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
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
                    <ActivityIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {communityImpact?.total_activities || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activities
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
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {communityImpact?.growth_percentage >= 0 ? '+' : ''}
                      {communityImpact?.growth_percentage.toFixed(1) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Year Growth
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {communityImpact?.most_popular_activity && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              Most Popular Activity: {communityImpact.most_popular_activity}
            </Typography>
            <Typography variant="caption">
              {communityImpact.most_popular_activity_hours} hours contributed
            </Typography>
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Top Volunteers" />
            <Tab label="Grade Competition" />
            <Tab label="Community Impact" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {userEntry && userEntry.rank > 10 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  <Typography variant="body2" fontWeight={600}>
                    Your Position: #{userEntry.rank}
                  </Typography>
                  <Typography variant="caption">
                    {userEntry.total_hours} hours • {userEntry.activities_count} activities
                  </Typography>
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Top Volunteers"
                  subheader="Leading contributors to our school community"
                />
                <CardContent>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width={80}>Rank</TableCell>
                          <TableCell>Volunteer</TableCell>
                          <TableCell align="right">Hours</TableCell>
                          <TableCell align="right">Activities</TableCell>
                          <TableCell>Grade</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaderboard?.slice(0, 50).map((entry) => (
                          <TableRow
                            key={entry.parent_id}
                            sx={{
                              bgcolor:
                                entry.parent_id === parseInt(user?.id || '0')
                                  ? 'action.selected'
                                  : undefined,
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getRankIcon(entry.rank)}
                                <Typography
                                  variant="h6"
                                  fontWeight={700}
                                  sx={{ color: getRankColor(entry.rank) }}
                                >
                                  #{entry.rank}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {entry.display_name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {entry.display_name}
                                    {entry.is_anonymous && (
                                      <Chip
                                        label="Anonymous"
                                        size="small"
                                        sx={{ ml: 1, height: 20 }}
                                      />
                                    )}
                                  </Typography>
                                  {entry.student_count && (
                                    <Typography variant="caption" color="text.secondary">
                                      {entry.student_count}{' '}
                                      {entry.student_count === 1 ? 'child' : 'children'}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${entry.total_hours}h`}
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{entry.activities_count}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {entry.grade_name || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardHeader
              title="Grade-Level Competition"
              subheader="Volunteer participation rates by grade"
            />
            <CardContent>
              <Stack spacing={3}>
                {gradeStats
                  ?.sort((a, b) => b.participation_rate - a.participation_rate)
                  .map((grade, index) => (
                    <Box key={grade.grade_name}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label={`#${index + 1}`}
                            color={index < 3 ? 'primary' : 'default'}
                            size="small"
                          />
                          <Typography variant="h6" fontWeight={600}>
                            {grade.grade_name}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {grade.participation_rate.toFixed(1)}% Participation
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {grade.total_volunteers} / {grade.total_students} parents
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={grade.participation_rate}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Total Hours: {grade.total_hours}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: {grade.average_hours_per_volunteer.toFixed(1)}h per volunteer
                        </Typography>
                      </Box>
                    </Box>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="This Year vs Last Year" />
                <CardContent>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        This Year
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="primary">
                        {communityImpact?.hours_this_year.toLocaleString() || 0} hours
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Year
                      </Typography>
                      <Typography variant="h3" fontWeight={700}>
                        {communityImpact?.hours_last_year.toLocaleString() || 0} hours
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Growth
                      </Typography>
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        color={
                          (communityImpact?.growth_percentage || 0) >= 0
                            ? 'success.main'
                            : 'error.main'
                        }
                      >
                        {communityImpact?.growth_percentage >= 0 ? '+' : ''}
                        {communityImpact?.growth_percentage.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Community Impact Metrics" />
                <CardContent>
                  <Stack spacing={2}>
                    {communityImpact?.impact_metrics.map((metric, index) => (
                      <Box key={index}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {metric.metric_name}
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {metric.value.toLocaleString()} {metric.unit}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    {(!communityImpact?.impact_metrics ||
                      communityImpact.impact_metrics.length === 0) && (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        No impact metrics available yet
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader title="Active This Month" />
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h2" fontWeight={700} color="primary" gutterBottom>
                      {communityImpact?.active_this_month || 0}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      volunteers contributed this month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default VolunteerLeaderboard;
