export interface Loan {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  account_id: string;
  category_id?: string | null;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

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

export const toLoanType = (loan: any): Loan => ({
  id: loan.id,
  user_id: loan.userId,
  name: loan.name,
  principal: Number(loan.principal),
  interest_rate: Number(loan.interest_rate),
  tenure_months: loan.tenure_months,
  emi_amount: Number(loan.emi_amount),
  start_date: loan.start_date?.toISOString().split('T')[0],
  account_id: loan.accountId,
  category_id: loan.categoryId,
  outstanding_balance: Number(loan.outstanding_balance),
  created_at: loan.createdAt.toISOString(),
  updated_at: loan.updatedAt.toISOString(),
});
