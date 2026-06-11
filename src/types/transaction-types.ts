export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  transfer_id?: string | null;
  accounts?: { name: string; type: string };
  categories?: { name: string; icon: string; color: string };
}

export interface TransactionDetail {
  transaction: Transaction;
  linkedTransactions: Transaction[];
}

export interface CreateTransactionData {
  account_id: string;
  category_id?: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  transfer_id?: string | null;
}

export interface CreateTransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  date: string;
}

export interface UpdateTransferData {
  transfer_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  date: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  search?: string;
  type?: 'Income & Expense' | 'Income' | 'Expense';
}

export interface PaginatedTransactionsResult {
  data: Transaction[];
  totalCount: number;
  totalPages: number;
}

export const toTransactionType = (transaction: any): Transaction => ({
  id: transaction.id,
  user_id: transaction.userId,
  account_id: transaction.accountId,
  category_id: transaction.categoryId,
  type: transaction.type,
  amount: Number(transaction.amount),
  description: transaction.description,
  date: transaction.date.toISOString().split('T')[0],
  created_at: transaction.createdAt.toISOString(),
  updated_at: transaction.updatedAt.toISOString(),
  transfer_id: transaction.transfer_id,
});

export const mapTransactionFilters = (filters?: TransactionFilters) => {
  if (!filters) return {};
  return {
    type:
      filters.type?.toLowerCase() === 'income'
        ? 'income'
        : filters.type?.toLowerCase() === 'expense'
          ? 'expense'
          : undefined,
    accountId: filters.accountId,
    categoryId: filters.categoryId,
  } as const;
};
