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
