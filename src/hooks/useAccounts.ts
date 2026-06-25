'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { accountsApi } from '@/services/api/accounts';
import type { Account, CreateAccountData } from '@/types/account-types';

const EMPTY_ACCOUNTS: Account[] = [];

export const useAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts', user?.id],
    queryFn: () => accountsApi.getAccounts(),
    enabled: !!user,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      await accountsApi.createAccount(data);
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

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateAccountData> & { id: string }) => {
      await accountsApi.updateAccount({ id, ...data });
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

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      await accountsApi.deleteAccount(id);
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

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  return {
    accounts: accounts ?? EMPTY_ACCOUNTS,
    isLoading,
    totalBalance,
    createAccount: (data: CreateAccountData) => createAccountMutation.mutateAsync(data),
    updateAccount: (data: Partial<CreateAccountData> & { id: string }) =>
      updateAccountMutation.mutateAsync(data),
    deleteAccount: (id: string) => deleteAccountMutation.mutateAsync(id),
    fetchAccountForEdit: (id: string) => accountsApi.getAccount(id, true),
    isCreatingAccount: createAccountMutation.isPending,
    isUpdatingAccount: updateAccountMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
};

export type { Account, CreateAccountData } from '@/types/account-types';

/** Load full account details (unmasked) for the edit form. */
export function useAccountForEdit(accountId: string | null, enabled: boolean) {
  const { user } = useAuth();

  return useQuery<Account | null>({
    queryKey: ['account-edit', accountId, user?.id],
    queryFn: async () => {
      if (!accountId) return null;
      return accountsApi.getAccount(accountId, true);
    },
    enabled: enabled && !!accountId && !!user,
  });
}
