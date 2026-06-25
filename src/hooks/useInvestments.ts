import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { investmentsApi } from '@/services/api/investments';
import type { CreateInvestmentData, UpdateInvestmentData } from '@/types/investment-types';

const INVESTMENTS_QUERY_KEY = ['investments'];

type UseInvestmentsOptions = {
  /** When false, skips list/total queries (mutations still work). Default: true */
  enabled?: boolean;
};

export const useInvestments = (options?: UseInvestmentsOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const listEnabled = (options?.enabled ?? true) && !!user;

  const getInvestments = useQuery({
    queryKey: INVESTMENTS_QUERY_KEY,
    queryFn: () => investmentsApi.getInvestments(),
    enabled: listEnabled,
  });

  const useInvestment = (investmentId: string) =>
    useQuery({
      queryKey: [...INVESTMENTS_QUERY_KEY, investmentId],
      queryFn: () => investmentsApi.getInvestment(investmentId),
      enabled: !!user && !!investmentId,
    });

  const createInvestmentMutation = useMutation({
    mutationFn: (payload: CreateInvestmentData) => investmentsApi.createInvestment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVESTMENTS_QUERY_KEY });
      toast({ title: 'Investment created successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating investment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: (payload: UpdateInvestmentData) => investmentsApi.updateInvestment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVESTMENTS_QUERY_KEY });
      toast({ title: 'Investment updated!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating investment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: (investmentId: string) => investmentsApi.deleteInvestment(investmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVESTMENTS_QUERY_KEY });
      toast({ title: 'Investment deleted!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting investment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getTotalInvested = useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'total-invested'],
    queryFn: () => investmentsApi.getTotalInvested(),
    enabled: listEnabled,
  });

  const getTotalCurrentValue = useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'total-value'],
    queryFn: () => investmentsApi.getTotalCurrentValue(),
    enabled: listEnabled,
  });

  return {
    investments: getInvestments.data || [],
    isLoading: getInvestments.isLoading,
    useInvestment,
    totalInvested: getTotalInvested.data || 0,
    totalCurrentValue: getTotalCurrentValue.data || 0,
    createInvestment: (payload: CreateInvestmentData) =>
      createInvestmentMutation.mutateAsync(payload),
    updateInvestment: (payload: UpdateInvestmentData) =>
      updateInvestmentMutation.mutateAsync(payload),
    deleteInvestment: (investmentId: string) => deleteInvestmentMutation.mutateAsync(investmentId),
    isCreatingInvestment: createInvestmentMutation.isPending,
    isUpdatingInvestment: updateInvestmentMutation.isPending,
    isDeletingInvestment: deleteInvestmentMutation.isPending,
  };
};

export type {
  Investment,
  CreateInvestmentData,
  UpdateInvestmentData,
} from '@/types/investment-types';
