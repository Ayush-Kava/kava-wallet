import type { Account } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';
import { apiFetch } from '@/lib/api-client';

export const accountLedgerApi = {
  getAccount: async (
    userId: string,
    accountId: string,
  ): Promise<Account | null> => {
    return apiFetch<Account | null>(
      `/api/accounts/${accountId}?userId=${encodeURIComponent(userId)}`,
    );
  },

  getAccountTransactions: async (
    userId: string,
    accountId: string,
  ): Promise<Transaction[]> => {
    return apiFetch<Transaction[]>(
      `/api/accounts/${accountId}/transactions?userId=${encodeURIComponent(userId)}`,
    );
  },

  getTransferPairs: async (
    userId: string,
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
    >(
      `/api/transactions/transfers?ids=${transferIds.join(',')}&userId=${encodeURIComponent(userId)}`,
    );
  },
};
