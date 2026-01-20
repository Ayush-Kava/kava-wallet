export type RecurringType = 'income' | 'expense' | 'transfer';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  type: RecurringType;
  frequency: RecurringFrequency;
  amount: number;
  account_id?: string | null;
  from_account_id?: string | null;
  to_account_id?: string | null;
  category_id?: string | null;
  loan_id?: string | null;
  next_run_date: string;
  end_date?: string | null;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringRuleData {
  name: string;
  description?: string;
  type: RecurringType;
  frequency: RecurringFrequency;
  amount: number;
  account_id?: string | null;
  from_account_id?: string | null;
  to_account_id?: string | null;
  category_id?: string | null;
  loan_id?: string | null;
  next_run_date: string;
  end_date?: string | null;
  paused?: boolean;
}

export interface UpdateRecurringRuleData extends Partial<CreateRecurringRuleData> {
  id: string;
}
