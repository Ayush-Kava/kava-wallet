import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { transactionsApi } from '@/services/api/transactions';
import type {
  CreateTransactionData,
  TransactionFilters,
  CreateTransferData,
  TransactionDetail,
  UpdateTransferData,
} from '@/types/transaction-types';

type UseTransactionsOptions = {
  enableList?: boolean;
};

export const useTransactions = (
  page: number = 1,
  limit: number = 7,
  filters?: TransactionFilters,
  options?: UseTransactionsOptions,
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const enableList = options?.enableList ?? true;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', user?.id, page, limit, filters],
    queryFn: async () => {
      return transactionsApi.getTransactions(user!.id, page, limit, filters);
    },
    enabled: !!user && enableList,
  });

  const transactions = enableList ? data?.data || [] : [];
  const totalCount = enableList ? data?.totalCount || 0 : 0;
  const totalPages = enableList ? data?.totalPages || 0 : 0;
  const listLoading = enableList ? isLoading : false;

  const createTransaction = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      await transactionsApi.createTransaction(user!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Transaction added successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createTransfer = useMutation({
    mutationFn: async (data: CreateTransferData) => {
      await transactionsApi.createTransfer(user!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Transfer recorded successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error recording transfer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateTransactionData> & { id: string }) => {
      await transactionsApi.updateTransaction(user!.id, { id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Transaction updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTransfer = useMutation({
    mutationFn: async (data: UpdateTransferData) => {
      await transactionsApi.updateTransfer(user!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Transfer updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating transfer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      return transactionsApi.deleteTransaction(user!.id, id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: result?.deletedTransfer
          ? 'Transfer deleted'
          : 'Transaction deleted',
        description: result?.deletedTransfer
          ? 'Both sides of the transfer were removed.'
          : undefined,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const duplicateTransaction = useMutation({
    mutationFn: async (id: string) => {
      return transactionsApi.duplicateTransaction(user!.id, id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      toast({
        title: result?.duplicatedTransfer
          ? 'Transfer duplicated'
          : 'Transaction duplicated',
        description: result?.duplicatedTransfer
          ? 'A matching pair was created.'
          : 'A copy was created with the same details.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error duplicating transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    transactions,
    totalCount,
    totalPages,
    isLoading: listLoading,
    createTransaction,
    createTransfer,
    updateTransaction,
    updateTransfer,
    deleteTransaction,
    duplicateTransaction,
  };
};

export const useTransactionById = (id?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const queryKey = ['transaction', user?.id ?? 'none', id ?? ''];

  const { data, isLoading, refetch } = useQuery<TransactionDetail, Error>({
    queryKey,
    queryFn: async () => {
      if (!id) throw new Error('Transaction id is required');
      const txId = id as string;
      try {
        return transactionsApi.getTransactionDetail(user!.id, txId);
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error loading transaction',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!user && !!id,
  });

  return {
    transaction: data?.transaction,
    linkedTransactions: data?.linkedTransactions || [],
    isLoading,
    refetch,
  };
};
