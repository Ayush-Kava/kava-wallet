import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { transactionsApi } from '@/services/api/transactions';

export const useSummaryTransactions = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'summary', user?.id],
    queryFn: () => transactionsApi.getTransactions(1, 50),
    enabled: !!user,
  });

  return {
    transactions: data?.data ?? [],
    isLoading,
  };
};
