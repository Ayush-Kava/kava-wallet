import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { accountsApi } from '@/services/api/accounts';
import type { Account, CreateAccountData } from '@/types/account-types';

export const useAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      return accountsApi.getAccounts(user!.id);
    },
    enabled: !!user,
  });

  const createAccount = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      await accountsApi.createAccount(user!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account created successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateAccountData> & { id: string }) => {
      await accountsApi.updateAccount(user!.id, { id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      await accountsApi.deleteAccount(user!.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account deleted!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const totalBalance =
    accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  return {
    accounts: accounts || [],
    isLoading,
    totalBalance,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};

export type { Account, CreateAccountData } from '@/types/account-types';
