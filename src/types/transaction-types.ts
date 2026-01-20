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
  account?: string;
  category?: string;
  type?: 'Income & Expense' | 'Income' | 'Expense';
}

export interface PaginatedTransactionsResult {
  data: Transaction[];
  totalCount: number;
  totalPages: number;
}
