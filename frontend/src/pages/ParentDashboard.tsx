import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import { ChildOverviewCard } from '@/components/parent/ChildOverviewCard';
import { TodayAttendanceCard } from '@/components/parent/TodayAttendanceCard';
import { RecentGradesTable } from '@/components/parent/RecentGradesTable';
import { PendingAssignmentsList } from '@/components/parent/PendingAssignmentsList';
import { TeacherCommunicationPanel } from '@/components/parent/TeacherCommunicationPanel';
import { WeeklyProgressChart } from '@/components/parent/WeeklyProgressChart';
import { GoalTrackingView } from '@/components/parent/GoalTrackingView';
import { PerformanceComparisonChart } from '@/components/parent/PerformanceComparisonChart';

export const ParentDashboard: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(undefined);

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['parent-dashboard', selectedChildId],
    queryFn: () => parentsApi.getDashboard(selectedChildId),
  });

  const handleChildChange = (event: SelectChangeEvent<number>) => {
    setSelectedChildId(event.target.value as number);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Failed to load dashboard. Please try again later.</Alert>
        </Box>
      </Container>
    );
  }

  if (!dashboard || dashboard.children.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="info">
            No children found. Please contact the school administration.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Parent Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Monitor your child&apos;s academic progress and stay connected
          </Typography>

          {/* Multi-child selector */}
          {dashboard.children.length > 1 && (
            <Box sx={{ mt: 3, maxWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel id="child-select-label">Select Child</InputLabel>
                <Select
                  labelId="child-select-label"
                  id="child-select"
                  value={selectedChildId || dashboard.children[0].id}
                  label="Select Child"
                  onChange={handleChildChange}
                >
                  {dashboard.children.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                      {child.grade_name &&
                        child.section_name &&
                        ` - ${child.grade_name} ${child.section_name}`}
                      {child.admission_number && ` (${child.admission_number})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        {/* Main Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Child Overview Card */}
          <Grid item xs={12} md={4}>
            {dashboard.selected_child && <ChildOverviewCard child={dashboard.selected_child} />}
          </Grid>

          {/* Today's Attendance Status */}
          <Grid item xs={12} md={8}>
            {dashboard.today_attendance && (
              <TodayAttendanceCard
                attendance={dashboard.today_attendance}
                attendanceStats={dashboard.attendance_stats}
              />
            )}
          </Grid>

          {/* Recent Grades Table */}
          <Grid item xs={12} lg={8}>
            <RecentGradesTable grades={dashboard.recent_grades} />
          </Grid>

          {/* Pending Assignments List */}
          <Grid item xs={12} lg={4}>
            <PendingAssignmentsList assignments={dashboard.pending_assignments} />
          </Grid>

          {/* Weekly Progress Chart */}
          <Grid item xs={12} md={6}>
            {dashboard.weekly_progress && (
              <WeeklyProgressChart progress={dashboard.weekly_progress} />
            )}
          </Grid>

          {/* Teacher Communication Panel */}
          <Grid item xs={12} md={6}>
            <TeacherCommunicationPanel messages={dashboard.teacher_messages} />
          </Grid>

          {/* Goal Tracking View */}
          <Grid item xs={12} md={6}>
            <GoalTrackingView goals={dashboard.goals} />
          </Grid>

          {/* Performance Comparison Chart */}
          <Grid item xs={12} md={6}>
            {dashboard.performance_comparison && (
              <PerformanceComparisonChart comparison={dashboard.performance_comparison} />
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ParentDashboard;
