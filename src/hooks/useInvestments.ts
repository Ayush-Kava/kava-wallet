import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { investmentsApi } from '@/services/api/investments';
import type {
  CreateInvestmentData,
  UpdateInvestmentData,
} from '@/types/investment-types';

const INVESTMENTS_QUERY_KEY = ['investments'];

export const useInvestments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  const getInvestments = useQuery({
    queryKey: INVESTMENTS_QUERY_KEY,
    queryFn: () => investmentsApi.getInvestments(userId),
    enabled: !!userId,
  });

  const useInvestment = (investmentId: string) =>
    useQuery({
      queryKey: [...INVESTMENTS_QUERY_KEY, investmentId],
      queryFn: () => investmentsApi.getInvestment(userId, investmentId),
      enabled: !!userId && !!investmentId,
    });

  const createInvestment = useMutation({
    mutationFn: (payload: CreateInvestmentData) =>
      investmentsApi.createInvestment(userId, payload),
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

  const updateInvestment = useMutation({
    mutationFn: (payload: UpdateInvestmentData) =>
      investmentsApi.updateInvestment(userId, payload),
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

  const deleteInvestment = useMutation({
    mutationFn: (investmentId: string) =>
      investmentsApi.deleteInvestment(userId, investmentId),
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
    queryFn: () => investmentsApi.getTotalInvested(userId),
    enabled: !!userId,
  });

  const getTotalCurrentValue = useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'total-value'],
    queryFn: () => investmentsApi.getTotalCurrentValue(userId),
    enabled: !!userId,
  });

  return {
    // Queries
    investments: getInvestments.data || [],
    isLoading: getInvestments.isLoading,
    useInvestment,
    totalInvested: getTotalInvested.data || 0,
    totalCurrentValue: getTotalCurrentValue.data || 0,

    // Mutations
    createInvestment,
    updateInvestment,
    deleteInvestment,
  };
};

export type {
  Investment,
  CreateInvestmentData,
  UpdateInvestmentData,
} from '@/types/investment-types';
