import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { accountLedgerApi } from '@/services/api/account-ledger';
import type { Account } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';

/**
 * Hook to fetch account details and all transactions for that account
 * @param accountId - The account ID to fetch ledger for
 * @returns Account details, transactions, and loading/error states
 */
export const useAccountLedger = (accountId?: string) => {
  const { user } = useAuth();

  const { data: account, isLoading: isLoadingAccount } =
    useQuery<Account | null>({
      queryKey: ['account', accountId, user?.id],
      queryFn: async () => {
        if (!accountId) return null;
        return accountLedgerApi.getAccount(user!.id, accountId);
      },
      enabled: !!accountId && !!user,
    });

  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useQuery<Transaction[]>({
      queryKey: ['account-transactions', accountId, user?.id],
      queryFn: async () => {
        if (!accountId) return [];
        return accountLedgerApi.getAccountTransactions(user!.id, accountId);
      },
      enabled: !!accountId && !!user,
    });

  const transferIds = useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || [])
            .map((transaction) => transaction.transfer_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [transactions],
  );

  const { data: transferPairs = [], isLoading: isLoadingTransferLinks } =
    useQuery({
      queryKey: ['account-transfer-links', accountId, user?.id, transferIds],
      queryFn: async () => {
        if (!transferIds.length) return [];
        return accountLedgerApi.getTransferPairs(user!.id, transferIds);
      },
      enabled: !!accountId && !!user && transferIds.length > 0,
    });

  const transferPartners = useMemo(() => {
    const map: Record<
      string,
      { transactionId: string; accountId: string; accountName?: string }
    > = {};

    transferPairs.forEach((transaction) => {
      if (!transaction.transfer_id) return;
      if (transaction.account_id === accountId) return;

      map[transaction.transfer_id] = {
        transactionId: transaction.id,
        accountId: transaction.account_id,
        accountName: transaction.accounts?.name,
      };
    });

    return map;
  }, [transferPairs, accountId]);

  return {
    account,
    transactions,
    transferPartners,
    isLoading:
      isLoadingAccount || isLoadingTransactions || isLoadingTransferLinks,
    isLoadingAccount,
    isLoadingTransactions,
    isLoadingTransferLinks,
  };
};
