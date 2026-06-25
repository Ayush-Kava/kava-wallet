import type {
  Investment,
  CreateInvestmentData,
  UpdateInvestmentData,
  InvestmentDetail,
} from '@/types/investment-types';
import { apiFetch } from '@/lib/api-client';

export const investmentsApi = {
  getInvestments: async (): Promise<Investment[]> => {
    return apiFetch<Investment[]>('/api/investments');
  },

  getInvestment: async (investmentId: string): Promise<InvestmentDetail> => {
    return apiFetch<InvestmentDetail>(`/api/investments/${investmentId}`);
  },

  createInvestment: async (payload: CreateInvestmentData): Promise<Investment> => {
    return apiFetch<Investment>('/api/investments', 'POST', payload);
  },

  updateInvestment: async ({ id, ...rest }: UpdateInvestmentData): Promise<void> => {
    await apiFetch<void>(`/api/investments/${id}`, 'PUT', rest);
  },

  deleteInvestment: async (investmentId: string): Promise<void> => {
    await apiFetch<void>(`/api/investments/${investmentId}`, 'DELETE');
  },

  getInvestmentsByAccount: async (accountId: string): Promise<Investment[]> => {
    const params = new URLSearchParams({ account_id: accountId });
    return apiFetch<Investment[]>(`/api/investments/by-account?${params.toString()}`);
  },

  getTotalInvested: async (): Promise<number> => {
    const result = await apiFetch<{ total: number }>('/api/investments/total-invested');
    return result.total;
  },

  getTotalCurrentValue: async (): Promise<number> => {
    const result = await apiFetch<{ total: number }>('/api/investments/total-current');
    return result.total;
  },
};
