import { asNullablePublicId, asPublicId } from '@/lib/public-id';

export interface Transaction {
  id: string;
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

export const transactionInclude = {
  account: { select: { kind: true, publicId: true } },
  category: { select: { name: true, icon: true, color: true, publicId: true } },
} as const;

export const toTransactionType = (
  transaction: {
    publicId: string;
    accountId: number;
    categoryId: number | null;
    type: 'income' | 'expense';
    amount: { toString(): string } | number;
    description: string | null;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    transfer_id: number | null;
    account?: { kind: string; publicId: string } | null;
    category?: { name: string; icon: string; color: string; publicId: string } | null;
  },
  accountMeta?: { name: string; type: string },
  transferPublicId?: string | null,
): Transaction => ({
  id: asPublicId(transaction.publicId),
  account_id:
    transaction.account?.publicId != null ? asPublicId(transaction.account.publicId) : '',
  category_id: asNullablePublicId(transaction.category?.publicId),
  type: transaction.type,
  amount: Number(transaction.amount),
  description: transaction.description,
  date: transaction.date.toISOString().split('T')[0],
  created_at: transaction.createdAt.toISOString(),
  updated_at: transaction.updatedAt.toISOString(),
  transfer_id: transferPublicId != null ? asPublicId(transferPublicId) : null,
  accounts: accountMeta
    ?? (transaction.account
      ? { name: 'Account', type: transaction.account.kind }
      : undefined),
  categories: transaction.category
    ? {
        name: transaction.category.name,
        icon: transaction.category.icon,
        color: transaction.category.color,
      }
    : undefined,
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
    accountPublicId: filters.accountId,
    categoryPublicId: filters.categoryId,
  } as const;
};
