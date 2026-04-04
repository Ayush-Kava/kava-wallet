import type {
  CreateTransactionData,
  TransactionDetail,
  TransactionFilters,
  PaginatedTransactionsResult,
  CreateTransferData,
  UpdateTransferData,
} from '@/types/transaction-types';
import { apiFetch } from '@/lib/api-client';

export const transactionsApi = {
  getTransactions: async (
    userId: string,
    page: number,
    limit: number,
    filters?: TransactionFilters,
  ): Promise<PaginatedTransactionsResult> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    params.set('userId', userId);
    if (filters?.type && filters.type !== 'Income & Expense') {
      params.set('type', filters.type.toLowerCase());
    }
    if (filters?.account && filters.account !== 'All Accounts') {
      params.set('account', filters.account);
    }
    if (filters?.category && filters.category !== 'All Categories') {
      params.set('category', filters.category);
    }

    return apiFetch<PaginatedTransactionsResult>(
      `/api/transactions?${params.toString()}`,
    );
  },

  createTransaction: async (
    userId: string,
    data: CreateTransactionData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/transactions`, 'POST', {
      ...data,
      user_id: userId,
    });
  },

  createTransfer: async (
    userId: string,
    data: CreateTransferData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/transactions/transfer`, 'POST', {
      ...data,
      user_id: userId,
    });
  },

  updateTransaction: async (
    userId: string,
    { id, ...data }: Partial<CreateTransactionData> & { id: string },
  ): Promise<void> => {
    await apiFetch<void>(`/api/transactions/${id}`, 'PUT', {
      ...data,
      user_id: userId,
    });
  },

  updateTransfer: async (
    userId: string,
    data: UpdateTransferData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/transactions/transfer`, 'PUT', {
      ...data,
      user_id: userId,
    });
  },

  deleteTransaction: async (
    userId: string,
    id: string,
  ): Promise<{ deletedTransfer: boolean }> => {
    return apiFetch<{ deletedTransfer: boolean }>(
      `/api/transactions/${id}`,
      'DELETE',
      { user_id: userId },
    );
  },

  duplicateTransaction: async (
    userId: string,
    id: string,
  ): Promise<{ duplicatedTransfer: boolean }> => {
    return apiFetch<{ duplicatedTransfer: boolean }>(
      `/api/transactions/${id}/duplicate`,
      'POST',
      { user_id: userId },
    );
  },

  getTransactionDetail: async (
    userId: string,
    id: string,
  ): Promise<TransactionDetail> => {
    return apiFetch<TransactionDetail>(
      `/api/transactions/${id}?userId=${encodeURIComponent(userId)}`,
    );
  },
};
