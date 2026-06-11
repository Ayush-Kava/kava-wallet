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
  // Get all goals for user
  getGoals: async (userId: string): Promise<GoalWithFunding[]> => {
    return apiFetch<GoalWithFunding[]>(`/api/goals?userId=${encodeURIComponent(userId)}`);
  },

  // Get single goal with detailed funding info
  getGoal: async (userId: string, goalId: string): Promise<GoalWithFunding> => {
    return apiFetch<GoalWithFunding>(`/api/goals/${goalId}?userId=${encodeURIComponent(userId)}`);
  },

  // Create goal
  createGoal: async (userId: string, payload: CreateGoalData): Promise<Goal> => {
    return apiFetch<Goal>(`/api/goals`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  // Update goal
  updateGoal: async (userId: string, { id, ...rest }: UpdateGoalData): Promise<void> => {
    await apiFetch<void>(`/api/goals/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  // Delete goal
  deleteGoal: async (userId: string, goalId: string): Promise<void> => {
    await apiFetch<void>(`/api/goals/${goalId}`, 'DELETE', {
      user_id: userId,
    });
  },

  // Goal Funding Operations
  addFunding: async (userId: string, payload: CreateGoalFundingData): Promise<GoalFunding> => {
    return apiFetch<GoalFunding>(`/api/goals/${payload.goal_id}/funding`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  updateFunding: async (userId: string, { id, ...rest }: UpdateGoalFundingData): Promise<void> => {
    await apiFetch<void>(`/api/goals/funding/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  removeFunding: async (userId: string, fundingId: string): Promise<void> => {
    await apiFetch<void>(`/api/goals/funding/${fundingId}`, 'DELETE', {
      user_id: userId,
    });
  },

  // Get funding for a specific goal
  getGoalFunding: async (userId: string, goalId: string): Promise<GoalFunding[]> => {
    return apiFetch<GoalFunding[]>(
      `/api/goals/${goalId}/funding?userId=${encodeURIComponent(userId)}`,
    );
  },
};
