import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { banksApi } from '@/services/api/banks';

export const useBanks = () => {
  const { user } = useAuth();

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ['banks', user?.id],
    queryFn: () => banksApi.getBanks(),
    enabled: !!user,
  });

  return { banks, isLoading };
};
