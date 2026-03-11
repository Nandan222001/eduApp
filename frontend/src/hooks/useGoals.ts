import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/api/goals';
import { GoalFormData } from '@/types/goals';

export const useGoals = () => {
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getGoals,
  });

  const analyticsQuery = useQuery({
    queryKey: ['goals', 'analytics'],
    queryFn: goalsApi.getAnalytics,
  });

  const createGoalMutation = useMutation({
    mutationFn: goalsApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalFormData> }) =>
      goalsApi.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: goalsApi.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  const updateMilestoneProgressMutation = useMutation({
    mutationFn: ({
      goalId,
      milestoneId,
      progress,
    }: {
      goalId: string;
      milestoneId: string;
      progress: number;
    }) => goalsApi.updateMilestoneProgress(goalId, milestoneId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      goalsApi.completeMilestone(goalId, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  return {
    goals: goalsQuery.data || [],
    analytics: analyticsQuery.data,
    isLoading: goalsQuery.isLoading || analyticsQuery.isLoading,
    error: goalsQuery.error || analyticsQuery.error,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    updateMilestoneProgress: updateMilestoneProgressMutation.mutate,
    completeMilestone: completeMilestoneMutation.mutate,
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
  };
};

export const useGoalDetail = (id: string) => {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: () => goalsApi.getGoal(id),
    enabled: !!id,
  });
};
