import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { goalsApi } from '@/services/api/goals';
import type {
  CreateGoalData,
  UpdateGoalData,
  CreateGoalFundingData,
  UpdateGoalFundingData,
} from '@/types/goal-types';

const GOALS_QUERY_KEY = ['goals'];

export const useGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  const getGoals = useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: () => goalsApi.getGoals(userId),
    enabled: !!userId,
  });

  const useGoal = (goalId: string) =>
    useQuery({
      queryKey: [...GOALS_QUERY_KEY, goalId],
      queryFn: () => goalsApi.getGoal(userId, goalId),
      enabled: !!userId && !!goalId,
    });

  const createGoal = useMutation({
    mutationFn: (payload: CreateGoalData) =>
      goalsApi.createGoal(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      toast({ title: 'Goal created successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating goal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateGoal = useMutation({
    mutationFn: (payload: UpdateGoalData) =>
      goalsApi.updateGoal(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      toast({ title: 'Goal updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating goal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) => goalsApi.deleteGoal(userId, goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      toast({ title: 'Goal deleted!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting goal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addFunding = useMutation({
    mutationFn: (payload: CreateGoalFundingData) =>
      goalsApi.addFunding(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      toast({ title: 'Funding added!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding funding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateFunding = useMutation({
    mutationFn: (payload: UpdateGoalFundingData) =>
      goalsApi.updateFunding(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      toast({ title: 'Funding updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating funding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeFunding = useMutation({
    mutationFn: (fundingId: string) =>
      goalsApi.removeFunding(userId, fundingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      toast({ title: 'Funding removed!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing funding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Queries
    goals: getGoals.data || [],
    isLoading: getGoals.isLoading,
    useGoal,

    // Mutations
    createGoal,
    updateGoal,
    deleteGoal,
    addFunding,
    updateFunding,
    removeFunding,
  };
};

export type {
  Goal,
  GoalWithFunding,
  CreateGoalData,
  UpdateGoalData,
} from '@/types/goal-types';
