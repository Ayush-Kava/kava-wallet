import { apiFetch } from '@/lib/api-client';
import type { Budget, CreateBudgetData } from '@/types/budget-types';

export const budgetsApi = {
  getBudgets: () => apiFetch<Budget[]>('/api/budgets'),

  createBudget: (data: CreateBudgetData) => apiFetch<void>('/api/budgets', 'POST', data),

  deleteBudget: (id: string) => apiFetch<void>(`/api/budgets/${id}`, 'DELETE'),
};
