import { asNullablePublicId, asPublicId } from '@/lib/public-id';

export type RecurringType = 'income' | 'expense' | 'transfer';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
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

export const toRecurringRuleType = (rule: any): RecurringRule => ({
  id: asPublicId(rule.publicId),
  name: rule.name,
  description: rule.description,
  type: rule.type,
  frequency: rule.frequency,
  amount: Number(rule.amount),
  account_id: asNullablePublicId(rule.account?.publicId),
  from_account_id: asNullablePublicId(rule.fromAccount?.publicId),
  to_account_id: asNullablePublicId(rule.toAccount?.publicId),
  category_id: asNullablePublicId(rule.category?.publicId),
  loan_id: asNullablePublicId(rule.loan?.publicId),
  next_run_date: rule.next_run_date?.toISOString().split('T')[0],
  end_date: rule.end_date?.toISOString().split('T')[0] || null,
  paused: rule.paused,
  created_at: rule.createdAt.toISOString(),
  updated_at: rule.updatedAt.toISOString(),
});
