import { supabase } from '@/integrations/supabase/client';
import type {
  Investment,
  CreateInvestmentData,
  UpdateInvestmentData,
  InvestmentDetail,
} from '@/types/investment-types';

export const investmentsApi = {
  // Get all investments for user
  getInvestments: async (userId: string): Promise<Investment[]> => {
    const { data, error } = await (supabase
      .from('investments' as any)
      .select('*, accounts(id, name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any);

    if (error) throw error;
    return (data || []) as Investment[];
  },

  // Get single investment with linked transactions and documents
  getInvestment: async (
    userId: string,
    investmentId: string,
  ): Promise<InvestmentDetail> => {
    const { data: investmentData, error: invError } = await (supabase
      .from('investments' as any)
      .select('*, accounts(id, name)')
      .eq('id', investmentId)
      .eq('user_id', userId)
      .single() as any);

    if (invError) throw invError;

    return investmentData as InvestmentDetail;
  },

  // Create investment
  createInvestment: async (
    userId: string,
    payload: CreateInvestmentData,
  ): Promise<Investment> => {
    const { data, error } = await (supabase
      .from('investments' as any)
      .insert({
        user_id: userId,
        ...payload,
      })
      .select('*, accounts(id, name)')
      .single() as any);

    if (error) throw error;
    return data as Investment;
  },

  // Update investment
  updateInvestment: async (
    userId: string,
    { id, ...rest }: UpdateInvestmentData,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('investments' as any)
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Delete investment
  deleteInvestment: async (
    userId: string,
    investmentId: string,
  ): Promise<void> => {
    const { error } = await (supabase
      .from('investments' as any)
      .delete()
      .eq('id', investmentId)
      .eq('user_id', userId) as any);

    if (error) throw error;
  },

  // Get investments by account
  getInvestmentsByAccount: async (
    userId: string,
    accountId: string,
  ): Promise<Investment[]> => {
    const { data, error } = await (supabase
      .from('investments' as any)
      .select('*, accounts(id, name)')
      .eq('user_id', userId)
      .eq('account_id', accountId) as any);

    if (error) throw error;
    return (data || []) as Investment[];
  },

  // Get total invested amount
  getTotalInvested: async (userId: string): Promise<number> => {
    const { data, error } = await (supabase
      .from('investments' as any)
      .select('invested_amount')
      .eq('user_id', userId) as any);

    if (error) throw error;

    return (data || []).reduce(
      (sum: number, inv: any) => sum + inv.invested_amount,
      0,
    );
  },

  // Get total current value
  getTotalCurrentValue: async (userId: string): Promise<number> => {
    const { data, error } = await (supabase
      .from('investments' as any)
      .select('current_value')
      .eq('user_id', userId) as any);

    if (error) throw error;

    return (data || []).reduce(
      (sum: number, inv: any) => sum + inv.current_value,
      0,
    );
  },
};
