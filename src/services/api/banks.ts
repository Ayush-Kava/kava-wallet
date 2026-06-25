import { apiFetch } from '@/lib/api-client';
import type { Bank } from '@/types/account-types';
import type { CreateBankData, UpdateBankData } from '@/types/bank-types';

export const banksApi = {
  getBanks: async (): Promise<Bank[]> => {
    return apiFetch<Bank[]>('/api/banks');
  },

  getAdminBanks: async (): Promise<Bank[]> => {
    return apiFetch<Bank[]>('/api/admin/banks');
  },

  createBank: async (data: CreateBankData): Promise<Bank> => {
    return apiFetch<Bank>('/api/admin/banks', 'POST', data);
  },

  updateBank: async (publicId: string, data: UpdateBankData): Promise<Bank> => {
    return apiFetch<Bank>('/api/admin/banks', 'PUT', { publicId, ...data });
  },

  deleteBank: async (publicId: string): Promise<void> => {
    await apiFetch<void>('/api/admin/banks', 'DELETE', { publicId });
  },
};
