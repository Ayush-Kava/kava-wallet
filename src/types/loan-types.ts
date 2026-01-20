import type { Database } from '@/integrations/supabase/types';

export type Loan = Database['public']['Tables']['loans']['Row'];

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface CreateLoanData {
  name: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  account_id: string;
  category_id?: string | null;
}

export interface UpdateLoanData extends CreateLoanData {
  id: string;
}

export interface EMIScheduleItem {
  emi_number: number;
  due_date: string;
  emi_amount: number;
  principal_paid: number;
  interest_paid: number;
  balance_remaining: number;
  paid: boolean;
}

export interface LoanWithSchedule extends Loan {
  schedule: EMIScheduleItem[];
}
