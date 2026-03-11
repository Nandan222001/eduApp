import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  TrendingUp as AnalyticsIcon,
} from '@mui/icons-material';
import GoalCreationForm from '@/components/goals/GoalCreationForm';
import GoalDashboard from '@/components/goals/GoalDashboard';
import GoalDetailView from '@/components/goals/GoalDetailView';
import GoalAnalytics from '@/components/goals/GoalAnalytics';
import AchievementCelebration from '@/components/goals/AchievementCelebration';
import { useGoals } from '@/hooks/useGoals';
import { Goal, GoalType, GoalStatus, GoalFormData } from '@/types/goals';

type ViewTab = 'dashboard' | 'analytics';

export default function GoalsManagement() {
  const {
    goals,
    analytics,
    isLoading,
    error,
    createGoal,
    deleteGoal,
    updateMilestoneProgress,
    completeMilestone,
    isCreating,
  } = useGoals();

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [celebrationGoal, setCelebrationGoal] = useState<Goal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<GoalType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');

  const handleCreateGoal = (data: GoalFormData) => {
    createGoal(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoal(goalId, {
      onSuccess: () => {
        setSelectedGoal(null);
      },
    });
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleUpdateMilestone = (goalId: string, milestoneId: string, progress: number) => {
    updateMilestoneProgress({ goalId, milestoneId, progress });
  };

  const handleCompleteMilestone = (goalId: string, milestoneId: string) => {
    completeMilestone(
      { goalId, milestoneId },
      {
        onSuccess: (data) => {
          if (data.progress === 100 && data.status === 'completed') {
            setCelebrationGoal(data);
          }
        },
      }
    );
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || goal.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (selectedGoal) {
    return (
      <GoalDetailView
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onEdit={() => {
          setCreateDialogOpen(true);
        }}
        onDelete={() => handleDeleteGoal(selectedGoal.id)}
        onUpdateMilestone={(milestoneId, progress) =>
          handleUpdateMilestone(selectedGoal.id, milestoneId, progress)
        }
        onCompleteMilestone={(milestoneId) => handleCompleteMilestone(selectedGoal.id, milestoneId)}
      />
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Goal Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set SMART goals, track milestones, and achieve your objectives
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Goal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load goals. Please try again later.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Analytics" value="analytics" icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 'dashboard' && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <TextField
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as GoalType | 'all')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="performance">Performance</MenuItem>
              <MenuItem value="behavioral">Behavioral</MenuItem>
              <MenuItem value="skill">Skill</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as GoalStatus | 'all')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </TextField>
          </Stack>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : filteredGoals.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No goals match your filters'
                  : 'No goals yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by creating your first goal'}
              </Typography>
              {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First Goal
                </Button>
              )}
            </Box>
          ) : (
            <GoalDashboard
              goals={filteredGoals}
              onGoalClick={handleGoalClick}
              onEditGoal={(goal) => {
                setSelectedGoal(goal);
                setCreateDialogOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
            />
          )}
        </>
      )}

      {activeTab === 'analytics' && analytics && <GoalAnalytics analytics={analytics} />}

      <GoalCreationForm
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedGoal(null);
        }}
        onSubmit={handleCreateGoal}
        isLoading={isCreating}
      />

      {celebrationGoal && (
        <AchievementCelebration
          open={Boolean(celebrationGoal)}
          onClose={() => setCelebrationGoal(null)}
          goal={celebrationGoal}
        />
      )}
    </Box>
  );
}
