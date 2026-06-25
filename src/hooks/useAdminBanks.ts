import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { banksApi } from '@/services/api/banks';
import type { CreateBankData, UpdateBankData } from '@/types/bank-types';

export const useAdminBanks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ['admin-banks'],
    queryFn: () => banksApi.getAdminBanks(),
    enabled: isAdmin,
  });

  const invalidateBanks = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-banks'] });
    queryClient.invalidateQueries({ queryKey: ['banks'] });
  };

  const createBank = useMutation({
    mutationFn: (data: CreateBankData) => banksApi.createBank(data),
    onSuccess: () => {
      invalidateBanks();
      toast({ title: 'Bank created' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating bank',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateBank = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankData }) =>
      banksApi.updateBank(id, data),
    onSuccess: () => {
      invalidateBanks();
      toast({ title: 'Bank updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating bank',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteBank = useMutation({
    mutationFn: (id: string) => banksApi.deleteBank(id),
    onSuccess: () => {
      invalidateBanks();
      toast({ title: 'Bank deactivated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting bank',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    banks,
    isLoading,
    isAdmin,
    createBank,
    updateBank,
    deleteBank,
  };
};
