import { apiFetch } from '@/lib/api-client';
import type { Account, CreateAccountData } from '@/types/account-types';

export const accountsApi = {
  getAccounts: async (): Promise<Account[]> => {
    return apiFetch<Account[]>('/api/accounts');
  },

  getAccount: async (id: string, reveal = false): Promise<Account | null> => {
    const query = reveal ? '?reveal=true' : '';
    return apiFetch<Account | null>(`/api/accounts/${id}${query}`);
  },

  createAccount: async (data: CreateAccountData): Promise<void> => {
    await apiFetch<void>('/api/accounts', 'POST', data);
  },

  updateAccount: async (
    { id, ...data }: Partial<CreateAccountData> & { id: string },
  ): Promise<void> => {
    await apiFetch<void>(`/api/accounts/${id}`, 'PUT', data);
  },

  deleteAccount: async (id: string): Promise<void> => {
    await apiFetch<void>(`/api/accounts/${id}`, 'DELETE');
  },
};
