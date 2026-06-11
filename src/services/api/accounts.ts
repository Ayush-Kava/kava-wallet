import { apiFetch } from '@/lib/api-client';
import type { Account, CreateAccountData } from '@/types/account-types';

export const accountsApi = {
  getAccounts: async (userId: string): Promise<Account[]> => {
    return apiFetch<Account[]>(`/api/accounts?userId=${encodeURIComponent(userId)}`);
  },

  createAccount: async (userId: string, data: CreateAccountData): Promise<void> => {
    await apiFetch<void>(`/api/accounts`, 'POST', { ...data, user_id: userId });
  },

  updateAccount: async (
    userId: string,
    { id, ...data }: Partial<CreateAccountData> & { id: string },
  ): Promise<void> => {
    await apiFetch<void>(`/api/accounts/${id}`, 'PUT', {
      ...data,
      user_id: userId,
    });
  },

  deleteAccount: async (userId: string, id: string): Promise<void> => {
    await apiFetch<void>(`/api/accounts/${id}`, 'DELETE', { user_id: userId });
  },
};
