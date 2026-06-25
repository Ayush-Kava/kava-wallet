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
    page: number,
    limit: number,
    filters?: TransactionFilters,
  ): Promise<PaginatedTransactionsResult> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.type && filters.type !== 'Income & Expense') {
      params.set('type', filters.type.toLowerCase());
    }
    if (filters?.accountId) {
      params.set('accountId', filters.accountId);
    }
    if (filters?.categoryId) {
      params.set('categoryId', filters.categoryId);
    }
    if (filters?.search) {
      params.set('search', filters.search);
    }

    return apiFetch<PaginatedTransactionsResult>(`/api/transactions?${params.toString()}`);
  },

  createTransaction: async (data: CreateTransactionData): Promise<void> => {
    await apiFetch<void>('/api/transactions', 'POST', data);
  },

  createTransfer: async (data: CreateTransferData): Promise<void> => {
    await apiFetch<void>('/api/transactions/transfer', 'POST', data);
  },

  updateTransaction: async (
    { id, ...data }: Partial<CreateTransactionData> & { id: string },
  ): Promise<void> => {
    await apiFetch<void>(`/api/transactions/${id}`, 'PUT', data);
  },

  updateTransfer: async (data: UpdateTransferData): Promise<void> => {
    await apiFetch<void>('/api/transactions/transfer', 'PUT', data);
  },

  deleteTransaction: async (id: string): Promise<{ deletedTransfer: boolean }> => {
    return apiFetch<{ deletedTransfer: boolean }>(`/api/transactions/${id}`, 'DELETE');
  },

  duplicateTransaction: async (id: string): Promise<{ duplicatedTransfer: boolean }> => {
    return apiFetch<{ duplicatedTransfer: boolean }>(`/api/transactions/${id}/duplicate`, 'POST');
  },

  getTransactionDetail: async (id: string): Promise<TransactionDetail> => {
    return apiFetch<TransactionDetail>(`/api/transactions/${id}`);
  },
};
