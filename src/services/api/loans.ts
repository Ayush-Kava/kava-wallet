import { addMonths } from 'date-fns';
import type {
  CreateLoanData,
  UpdateLoanData,
  Loan,
  EMIScheduleItem,
} from '@/types/loan-types';
import { recurringRulesApi } from './recurring-rules';
import { apiFetch } from '@/lib/api-client';

const formatDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const calculateEMISchedule = (
  principal: number,
  monthlyRate: number,
  tenure: number,
): EMIScheduleItem[] => {
  const schedule: EMIScheduleItem[] = [];
  let balance = principal;
  const monthlyInterestRate = monthlyRate / 100 / 12;

  for (let i = 1; i <= tenure; i++) {
    const interestPaid = balance * monthlyInterestRate;
    const principalPaid = principal / tenure;
    balance -= principalPaid;

    schedule.push({
      emi_number: i,
      due_date: formatDateOnly(addMonths(new Date(), i)),
      emi_amount: principalPaid + interestPaid,
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      balance_remaining: Math.max(0, balance),
      paid: false,
    });
  }

  return schedule;
};

export const loansApi = {
  getLoans: async (userId: string): Promise<Loan[]> => {
    return apiFetch<Loan[]>(`/api/loans?userId=${encodeURIComponent(userId)}`);
  },

  getLoan: async (userId: string, loanId: string): Promise<Loan> => {
    return apiFetch<Loan>(
      `/api/loans/${loanId}?userId=${encodeURIComponent(userId)}`,
    );
  },

  createLoan: async (
    userId: string,
    payload: CreateLoanData,
  ): Promise<Loan> => {
    const loan = await apiFetch<Loan>(`/api/loans`, 'POST', {
      ...payload,
      user_id: userId,
    });

    // Auto-create recurring EMI rule
    const nextEmiDate = addMonths(new Date(payload.start_date), 1);
    const endDate = addMonths(
      new Date(payload.start_date),
      payload.tenure_months,
    );

    await recurringRulesApi.createRecurringRule(userId, {
      name: `EMI - ${payload.name}`,
      description: `Automated EMI for ${payload.name}`,
      amount: payload.emi_amount,
      type: 'expense',
      frequency: 'monthly',
      account_id: payload.account_id,
      category_id: payload.category_id || null,
      from_account_id: null,
      to_account_id: null,
      loan_id: loan.id,
      next_run_date: formatDateOnly(nextEmiDate),
      end_date: formatDateOnly(endDate),
      paused: false,
    });

    return loan;
  },

  updateLoan: async (
    userId: string,
    { id, ...rest }: UpdateLoanData,
  ): Promise<void> => {
    await apiFetch<void>(`/api/loans/${id}`, 'PUT', {
      ...rest,
      user_id: userId,
    });
  },

  deleteLoan: async (userId: string, loanId: string): Promise<void> => {
    await apiFetch<void>(`/api/loans/${loanId}`, 'DELETE', {
      user_id: userId,
    });
  },

  getEMISchedule: (loan: Loan): EMIScheduleItem[] => {
    return calculateEMISchedule(
      loan.principal,
      loan.interest_rate,
      loan.tenure_months,
    );
  },

  calculateOutstandingBalance: async (
    userId: string,
    loanId: string,
  ): Promise<number> => {
    const result = await apiFetch<{ outstanding: number }>(
      `/api/loans/${loanId}/outstanding?userId=${encodeURIComponent(userId)}`,
    );
    return result.outstanding;
  },
};
