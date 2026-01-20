import { supabase } from '@/integrations/supabase/client';
import type { Account } from '@/types/account-types';
import type { Transaction } from '@/types/transaction-types';

export const accountLedgerApi = {
  getAccount: async (
    userId: string,
    accountId: string,
  ): Promise<Account | null> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as Account;
  },

  getAccountTransactions: async (
    userId: string,
    accountId: string,
  ): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        accounts(name, type),
        categories(name, icon, color)
      `,
      )
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data as Transaction[]) || [];
  },

  getTransferPairs: async (
    userId: string,
    transferIds: string[],
  ): Promise<
    Array<{
      id: string;
      transfer_id: string | null;
      account_id: string;
      accounts?: { name: string };
    }>
  > => {
    const { data, error } = await (supabase.from('transactions') as any)
      .select('id, transfer_id, account_id, accounts(name)')
      .eq('user_id', userId)
      .in('transfer_id', transferIds);

    if (error) {
      if (String(error.message).includes('transfer_id')) {
        return [];
      }
      throw error;
    }

    return (
      (data as Array<{
        id: string;
        transfer_id: string | null;
        account_id: string;
        accounts?: { name: string };
      }>) || []
    );
  },
};
