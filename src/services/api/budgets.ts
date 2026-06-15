import { apiFetch } from '@/lib/api-client';
import type { Budget, CreateBudgetData, UpdateBudgetData } from '@/types/budget-types';

export const budgetsApi = {
  getBudgets: () => apiFetch<Budget[]>('/api/budgets'),

  createBudget: (data: CreateBudgetData) => apiFetch<void>('/api/budgets', 'POST', data),

  updateBudget: (id: string, data: UpdateBudgetData) =>
    apiFetch<void>(`/api/budgets/${id}`, 'PUT', data),

  deleteBudget: (id: string) => apiFetch<void>(`/api/budgets/${id}`, 'DELETE'),
};
