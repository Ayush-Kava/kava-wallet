import type {
  Investment,
  CreateInvestmentData,
  UpdateInvestmentData,
  InvestmentDetail,
} from '@/types/investment-types';
import { apiFetch } from '@/lib/api-client';

export const investmentsApi = {
  // Get all investments for user
  getInvestments: async (userId: string): Promise<Investment[]> => {
    return apiFetch<Investment[]>(`/api/investments?userId=${encodeURIComponent(userId)}`);
  },

  // Get single investment with linked transactions and documents
  getInvestment: async (userId: string, investmentId: string): Promise<InvestmentDetail> => {
    return apiFetch<InvestmentDetail>(
      `/api/investments/${investmentId}?userId=${encodeURIComponent(userId)}`,
    );
  },

  // Create investment
  createInvestment: async (userId: string, payload: CreateInvestmentData): Promise<Investment> => {
    return apiFetch<Investment>(`/api/investments`, 'POST', {
      ...payload,
      user_id: userId,
    });
  },

  // Update investment
  updateInvestment: async (
    userId: string,
    { id, ...rest }: UpdateInvestmentData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/investments/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  // Delete investment
  deleteInvestment: async (userId: string, investmentId: string): Promise<void> => {
    await apiFetch<void>(`/api/investments/${investmentId}`, 'DELETE', {
      user_id: userId,
    });
  },

  // Get investments by account
  getInvestmentsByAccount: async (userId: string, accountId: string): Promise<Investment[]> => {
    return apiFetch<Investment[]>(
      `/api/investments/by-account/${accountId}?userId=${encodeURIComponent(userId)}`,
    );
  },

  // Get total invested amount
  getTotalInvested: async (userId: string): Promise<number> => {
    const result = await apiFetch<{ total: number }>(
      `/api/investments/total-invested?userId=${encodeURIComponent(userId)}`,
    );
    return result.total;
  },

  // Get total current value
  getTotalCurrentValue: async (userId: string): Promise<number> => {
    const result = await apiFetch<{ total: number }>(
      `/api/investments/total-current?userId=${encodeURIComponent(userId)}`,
    );
    return result.total;
  },
};
