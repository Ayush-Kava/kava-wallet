import { supabase } from '@/integrations/supabase/client';
import type { Account, CreateAccountData } from '@/types/account-types';

export const accountsApi = {
  getAccounts: async (userId: string): Promise<Account[]> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Account[];
  },

  createAccount: async (
    userId: string,
    data: CreateAccountData,
  ): Promise<void> => {
    const { error } = await supabase.from('accounts').insert({
      ...data,
      user_id: userId,
    });
    if (error) throw error;
  },

  updateAccount: async (
    userId: string,
    { id, ...data }: Partial<CreateAccountData> & { id: string },
  ): Promise<void> => {
    const { error } = await supabase
      .from('accounts')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  deleteAccount: async (userId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
