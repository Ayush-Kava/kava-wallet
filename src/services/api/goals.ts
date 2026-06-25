import type {
  Goal,
  GoalWithFunding,
  CreateGoalData,
  UpdateGoalData,
  GoalFunding,
  CreateGoalFundingData,
  UpdateGoalFundingData,
} from '@/types/goal-types';
import { apiFetch } from '@/lib/api-client';

export const goalsApi = {
  getGoals: async (): Promise<GoalWithFunding[]> => {
    return apiFetch<GoalWithFunding[]>('/api/goals');
  },

  getGoal: async (goalId: string): Promise<GoalWithFunding> => {
    return apiFetch<GoalWithFunding>(`/api/goals/${goalId}`);
  },

  createGoal: async (payload: CreateGoalData): Promise<Goal> => {
    return apiFetch<Goal>('/api/goals', 'POST', payload);
  },

  updateGoal: async ({ id, ...rest }: UpdateGoalData): Promise<void> => {
    await apiFetch<void>(`/api/goals/${id}`, 'PUT', rest);
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    await apiFetch<void>(`/api/goals/${goalId}`, 'DELETE');
  },

  addFunding: async (payload: CreateGoalFundingData): Promise<GoalFunding> => {
    return apiFetch<GoalFunding>(`/api/goals/${payload.goal_id}/funding`, 'POST', payload);
  },

  updateFunding: async ({ id, ...rest }: UpdateGoalFundingData): Promise<void> => {
    await apiFetch<void>(`/api/goals/funding/${id}`, 'PUT', rest);
  },

  removeFunding: async (fundingId: string): Promise<void> => {
    await apiFetch<void>(`/api/goals/funding/${fundingId}`, 'DELETE');
  },

  getGoalFunding: async (goalId: string): Promise<GoalFunding[]> => {
    return apiFetch<GoalFunding[]>(`/api/goals/${goalId}/funding`);
  },
};
