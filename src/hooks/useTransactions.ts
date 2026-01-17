import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type {
  Transaction,
  CreateTransactionData,
  TransactionFilters,
  PaginatedTransactionsResult,
} from '@/types/transaction-types';

export const useTransactions = (
  page: number = 1,
  limit: number = 7,
  filters?: TransactionFilters,
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', user?.id, page, limit, filters],
    queryFn: async () => {
      // Fetch all transactions to properly filter by account/category
      let query = supabase
        .from('transactions')
        .select(
          `
          *,
          accounts(name, type),
          categories(name, icon, color)
        `,
          { count: 'exact' },
        )
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      // Apply type filter at database level
      if (filters?.type && filters.type !== 'Income & Expense') {
        query = query.eq(
          'type',
          filters.type.toLowerCase() as 'income' | 'expense',
        );
      }

      const { data: allData, error } = await query;

      if (error) throw error;

      // Filter by account and category in-memory
      let filteredData = allData as Transaction[];

      if (filters?.account && filters.account !== 'All Accounts') {
        filteredData = filteredData.filter((transaction) =>
          transaction.accounts?.name
            ?.toLowerCase()
            .includes(filters.account!.toLowerCase()),
        );
      }

      if (filters?.category && filters.category !== 'All Categories') {
        filteredData = filteredData.filter((transaction) =>
          transaction.categories?.name
            ?.toLowerCase()
            .includes(filters.category!.toLowerCase()),
        );
      }

      // Calculate total count after filtering
      const totalCount = filteredData.length;

      // Apply pagination to filtered data
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedData = filteredData.slice(from, to);

      return {
        data: paginatedData,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      } as PaginatedTransactionsResult;
    },
    enabled: !!user,
  });

  const transactions = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const createTransaction = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const { error } = await supabase.from('transactions').insert({
        ...data,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

  const updateTransaction = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateTransactionData> & { id: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Transaction deleted!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    transactions,
    totalCount,
    totalPages,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
