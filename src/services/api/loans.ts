import { supabase } from '@/integrations/supabase/client';
import { addMonths } from 'date-fns';
import type {
  CreateLoanData,
  UpdateLoanData,
  Loan,
  EMIScheduleItem,
} from '@/types/loan-types';
import { recurringRulesApi } from './recurring-rules';

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
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Loan[];
  },

  getLoan: async (userId: string, loanId: string): Promise<Loan> => {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as Loan;
  },

  createLoan: async (
    userId: string,
    payload: CreateLoanData,
  ): Promise<Loan> => {
    const outstandingBalance = payload.principal;

    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: userId,
        name: payload.name,
        principal: payload.principal,
        interest_rate: payload.interest_rate,
        tenure_months: payload.tenure_months,
        emi_amount: payload.emi_amount,
        start_date: payload.start_date,
        account_id: payload.account_id,
        category_id: payload.category_id || null,
        outstanding_balance: outstandingBalance,
      })
      .select()
      .single();

    if (error) throw error;

    const loan = data as Loan;

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
    const { error } = await supabase
      .from('loans')
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  deleteLoan: async (userId: string, loanId: string): Promise<void> => {
    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId)
      .eq('user_id', userId);

    if (error) throw error;
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
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('account_id', (await loansApi.getLoan(userId, loanId)).account_id)
      .like('description', `EMI - %`)
      .gte('created_at', (await loansApi.getLoan(userId, loanId)).start_date);

    if (error) throw error;

    const loan = await loansApi.getLoan(userId, loanId);
    const totalPaid = (data || []).reduce((sum, tx) => sum + tx.amount, 0);
    return Math.max(0, loan.principal - totalPaid);
  },
};
