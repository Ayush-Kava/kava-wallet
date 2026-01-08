import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'wallet';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountData {
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'wallet';
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export const useAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user,
  });

  const createAccount = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      const { error } = await supabase.from('accounts').insert({
        ...data,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account created successfully!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating account', description: error.message, variant: 'destructive' });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateAccountData> & { id: string }) => {
      const { error } = await supabase
        .from('accounts')
        .update(data)
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account updated!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating account', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account deleted!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting account', description: error.message, variant: 'destructive' });
    },
  });

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  return {
    accounts: accounts || [],
    isLoading,
    totalBalance,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
