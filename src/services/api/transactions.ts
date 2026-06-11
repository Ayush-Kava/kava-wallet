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
    _userId: string,
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

  createTransaction: async (_userId: string, data: CreateTransactionData): Promise<void> => {
    await apiFetch<void>(`/api/transactions`, 'POST', data);
  },

  createTransfer: async (_userId: string, data: CreateTransferData): Promise<void> => {
    await apiFetch<void>(`/api/transactions/transfer`, 'POST', data);
  },

  updateTransaction: async (
    _userId: string,
    { id, ...data }: Partial<CreateTransactionData> & { id: string },
  ): Promise<void> => {
    await apiFetch<void>(`/api/transactions/${id}`, 'PUT', data);
  },

  updateTransfer: async (_userId: string, data: UpdateTransferData): Promise<void> => {
    await apiFetch<void>(`/api/transactions/transfer`, 'PUT', data);
  },

  deleteTransaction: async (_userId: string, id: string): Promise<{ deletedTransfer: boolean }> => {
    return apiFetch<{ deletedTransfer: boolean }>(`/api/transactions/${id}`, 'DELETE');
  },

  duplicateTransaction: async (
    _userId: string,
    id: string,
  ): Promise<{ duplicatedTransfer: boolean }> => {
    return apiFetch<{ duplicatedTransfer: boolean }>(`/api/transactions/${id}/duplicate`, 'POST');
  },

  getTransactionDetail: async (_userId: string, id: string): Promise<TransactionDetail> => {
    return apiFetch<TransactionDetail>(`/api/transactions/${id}`);
  },
};
