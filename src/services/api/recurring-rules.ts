import { supabase } from '@/integrations/supabase/client';
import { computeNextRunDate, isRuleDue } from '@/lib/recurring-utils';
import type {
  CreateRecurringRuleData,
  RecurringRule,
  UpdateRecurringRuleData,
} from '@/types/recurring-types';
import { transactionsApi } from './transactions';

const formatDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const recurringRulesApi = {
  getRecurringRules: async (userId: string): Promise<RecurringRule[]> => {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('user_id', userId)
      .order('next_run_date', { ascending: true });

    if (error) throw error;
    return (data || []) as RecurringRule[];
  },

  createRecurringRule: async (
    userId: string,
    payload: CreateRecurringRuleData,
  ): Promise<void> => {
    const { error } = await supabase.from('recurring_rules').insert({
      ...payload,
      user_id: userId,
    });
    if (error) throw error;
  },

  updateRecurringRule: async (
    userId: string,
    { id, ...rest }: UpdateRecurringRuleData,
  ): Promise<void> => {
    const { error } = await supabase
      .from('recurring_rules')
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  deleteRecurringRule: async (userId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('recurring_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  togglePause: async (
    userId: string,
    id: string,
    paused: boolean,
  ): Promise<void> => {
    const { error } = await supabase
      .from('recurring_rules')
      .update({ paused })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  processDueRules: async (userId: string): Promise<{ created: number }> => {
    const today = formatDateOnly(new Date());

    const { data, error } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('paused', false)
      .lte('next_run_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (error) throw error;

    const rules = (data || []) as RecurringRule[];
    let created = 0;

    for (const rule of rules) {
      if (!isRuleDue(rule, today)) continue;

      if (rule.type === 'transfer') {
        if (!rule.from_account_id || !rule.to_account_id) continue;
        await transactionsApi.createTransfer(userId, {
          from_account_id: rule.from_account_id,
          to_account_id: rule.to_account_id,
          amount: rule.amount,
          description: rule.name,
          date: rule.next_run_date,
        });
      } else {
        if (!rule.account_id) continue;
        await transactionsApi.createTransaction(userId, {
          account_id: rule.account_id,
          category_id: rule.category_id || undefined,
          type: rule.type,
          amount: rule.amount,
          description: rule.name,
          date: rule.next_run_date,
        });
      }

      // Update loan outstanding balance if this is an EMI rule
      // Check if rule name starts with "EMI - " to identify loan payments
      if (rule.type === 'expense' && rule.name.startsWith('EMI - ')) {
        const loanName = rule.name.substring(6); // Remove "EMI - " prefix

        // Find the loan by name
        const { data: loanData } = await supabase
          .from('loans')
          .select('id, outstanding_balance')
          .eq('user_id', userId)
          .eq('name', loanName)
          .single();

        if (loanData) {
          const newBalance = Math.max(
            0,
            loanData.outstanding_balance - rule.amount,
          );
          await supabase
            .from('loans')
            .update({ outstanding_balance: newBalance })
            .eq('id', loanData.id)
            .eq('user_id', userId);
        }
      }

      created += 1;

      const nextDate = computeNextRunDate(rule.next_run_date, rule.frequency);
      const shouldPause = Boolean(rule.end_date && nextDate > rule.end_date);

      const { error: updateError } = await supabase
        .from('recurring_rules')
        .update({
          next_run_date: nextDate,
          paused: shouldPause ? true : rule.paused,
        })
        .eq('id', rule.id)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    return { created };
  },

  runRuleNow: async (userId: string, ruleId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw error || new Error('Rule not found');

    const rule = data as RecurringRule;

    if (rule.type === 'transfer') {
      if (!rule.from_account_id || !rule.to_account_id) {
        throw new Error('Transfer rule is missing account information');
      }

      await transactionsApi.createTransfer(userId, {
        from_account_id: rule.from_account_id,
        to_account_id: rule.to_account_id,
        amount: rule.amount,
        description: rule.name,
        date: rule.next_run_date,
      });
    } else {
      if (!rule.account_id) {
        throw new Error('Rule is missing account information');
      }

      await transactionsApi.createTransaction(userId, {
        account_id: rule.account_id,
        category_id: rule.category_id || undefined,
        type: rule.type,
        amount: rule.amount,
        description: rule.name,
        date: rule.next_run_date,
      });
    }

    // Update loan outstanding balance if this is an EMI rule
    // Check if rule name starts with "EMI - " to identify loan payments
    if (rule.type === 'expense' && rule.name.startsWith('EMI - ')) {
      const loanName = rule.name.substring(6); // Remove "EMI - " prefix

      // Find the loan by name
      const { data: loanData } = await supabase
        .from('loans')
        .select('id, outstanding_balance')
        .eq('user_id', userId)
        .eq('name', loanName)
        .single();

      if (loanData) {
        const newBalance = Math.max(
          0,
          loanData.outstanding_balance - rule.amount,
        );
        await supabase
          .from('loans')
          .update({ outstanding_balance: newBalance })
          .eq('id', loanData.id)
          .eq('user_id', userId);
      }
    }

    const nextDate = computeNextRunDate(rule.next_run_date, rule.frequency);
    const shouldPause = Boolean(rule.end_date && nextDate > rule.end_date);

    const { error: updateError } = await supabase
      .from('recurring_rules')
      .update({
        next_run_date: nextDate,
        paused: shouldPause ? true : rule.paused,
      })
      .eq('id', rule.id)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  },
};
