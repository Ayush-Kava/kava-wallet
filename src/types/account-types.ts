export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  statement_start_date?: string | null;
  statement_end_date?: string | null;
  due_date?: string | null;
  credit_limit?: number | null;
  min_due?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountData {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  statement_start_date?: string | null;
  statement_end_date?: string | null;
  due_date?: string | null;
  credit_limit?: number | null;
  min_due?: number | null;
}

export const toAccountType = (account: any): Account => ({
  id: account.id,
  user_id: account.userId,
  name: account.name,
  type: account.type,
  balance: Number(account.balance),
  currency: account.currency,
  color: account.color,
  icon: account.icon,
  statement_start_date:
    account.statement_start_date?.toISOString().split('T')[0] || null,
  statement_end_date:
    account.statement_end_date?.toISOString().split('T')[0] || null,
  due_date: account.due_date?.toISOString().split('T')[0] || null,
  credit_limit: account.credit_limit ? Number(account.credit_limit) : null,
  min_due: account.min_due ? Number(account.min_due) : null,
  created_at: account.createdAt.toISOString(),
  updated_at: account.updatedAt.toISOString(),
});
