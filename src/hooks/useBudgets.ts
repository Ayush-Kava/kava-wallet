import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { budgetsApi } from '@/services/api/budgets';
import type { CreateBudgetData, UpdateBudgetData } from '@/types/budget-types';

const BUDGETS_QUERY_KEY = ['budgets'];

export const useBudgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: [...BUDGETS_QUERY_KEY, user?.id],
    queryFn: () => budgetsApi.getBudgets(),
    enabled: !!user,
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data: CreateBudgetData) => budgetsApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
      toast({ title: 'Budget created!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating budget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
      toast({ title: 'Budget deleted!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting budget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetData }) =>
      budgetsApi.updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
      toast({ title: 'Budget updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating budget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    budgets,
    isLoading,
    createBudget: (data: CreateBudgetData) => createBudgetMutation.mutateAsync(data),
    updateBudget: (id: string, data: UpdateBudgetData) =>
      updateBudgetMutation.mutateAsync({ id, data }),
    deleteBudget: (id: string) => deleteBudgetMutation.mutateAsync(id),
    isCreatingBudget: createBudgetMutation.isPending,
    isUpdatingBudget: updateBudgetMutation.isPending,
    isDeletingBudget: deleteBudgetMutation.isPending,
  };
};
