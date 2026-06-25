import type {
  CreateRecurringRuleData,
  RecurringRule,
  UpdateRecurringRuleData,
} from '@/types/recurring-types';
import { apiFetch } from '@/lib/api-client';

export const recurringRulesApi = {
  getRecurringRules: async (): Promise<RecurringRule[]> => {
    return apiFetch<RecurringRule[]>('/api/recurring-rules');
  },

  createRecurringRule: async (payload: CreateRecurringRuleData): Promise<void> => {
    await apiFetch<void>('/api/recurring-rules', 'POST', payload);
  },

  updateRecurringRule: async ({ id, ...rest }: UpdateRecurringRuleData): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${id}`, 'PUT', rest);
  },

  deleteRecurringRule: async (id: string): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${id}`, 'DELETE');
  },

  togglePause: async (id: string, paused: boolean): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${id}/pause`, 'POST', { paused });
  },

  processDueRules: async (): Promise<{ created: number }> => {
    return apiFetch<{ created: number }>('/api/recurring-rules/process');
  },

  runRuleNow: async (ruleId: string): Promise<void> => {
    await apiFetch<void>(`/api/recurring-rules/${ruleId}/run`, 'POST');
  },
};
