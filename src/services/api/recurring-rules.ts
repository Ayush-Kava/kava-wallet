import type {
  CreateRecurringRuleData,
  RecurringRule,
  UpdateRecurringRuleData,
} from '@/types/recurring-types';
import { apiFetch } from '@/lib/api-client';

export const recurringRulesApi = {
  getRecurringRules: async (userId: string): Promise<RecurringRule[]> => {
    return apiFetch<RecurringRule[]>(
      `/api/recurring-rules?userId=${encodeURIComponent(userId)}`,
    );
  },

  createRecurringRule: async (
    userId: string,
    payload: CreateRecurringRuleData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  updateRecurringRule: async (
    userId: string,
    { id, ...rest }: UpdateRecurringRuleData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  deleteRecurringRule: async (userId: string, id: string): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${id}`, 'DELETE', {
      user_id: userId,
    });
  },

  togglePause: async (
    userId: string,
    id: string,
    paused: boolean,
  ): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${id}/pause`, 'POST', {
      paused,
      user_id: userId,
    });
  },

  processDueRules: async (userId: string): Promise<{ created: number }> => {
    return apiFetch<{ created: number }>(
      `/api/recurring-rules/process?userId=${encodeURIComponent(userId)}`,
    );
  },

  runRuleNow: async (userId: string, ruleId: string): Promise<void> => {
    await apiFetch<void>(
      `/api/recurring-rules/${ruleId}/run?userId=${encodeURIComponent(userId)}`,
      'POST',
    );
  },
};
