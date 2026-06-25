import type { Account } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';
import { apiFetch } from '@/lib/api-client';

export const accountLedgerApi = {
  getAccount: async (accountId: string): Promise<Account | null> => {
    return apiFetch<Account | null>(`/api/accounts/${accountId}`);
  },

  getAccountTransactions: async (accountId: string): Promise<Transaction[]> => {
    return apiFetch<Transaction[]>(`/api/accounts/${accountId}/transactions`);
  },

  getTransferPairs: async (
    transferIds: string[],
  ): Promise<
    Array<{
      id: string;
      transfer_id: string | null;
      account_id: string;
      accounts?: { name: string };
    }>
  > => {
    return apiFetch<
      Array<{
        id: string;
        transfer_id: string | null;
        account_id: string;
        accounts?: { name: string };
      }>
    >(`/api/transactions/transfers?ids=${transferIds.join(',')}`);
  },
};
