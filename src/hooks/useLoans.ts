import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { loansApi } from '@/services/api/loans';
import type { CreateLoanData, UpdateLoanData, Loan } from '@/types/loan-types';

const LOANS_QUERY_KEY = ['loans'];

export const useLoans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const getLoans = useQuery({
    queryKey: LOANS_QUERY_KEY,
    queryFn: () => loansApi.getLoans(),
    enabled: !!user,
  });

  const useLoan = (loanId: string) =>
    useQuery({
      queryKey: [...LOANS_QUERY_KEY, loanId],
      queryFn: () => loansApi.getLoan(loanId),
      enabled: !!user && !!loanId,
    });

  const createLoan = useMutation({
    mutationFn: (payload: CreateLoanData) => loansApi.createLoan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
    },
  });

  const updateLoan = useMutation({
    mutationFn: (payload: UpdateLoanData) => loansApi.updateLoan(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...LOANS_QUERY_KEY, variables.id],
      });
    },
  });

  const deleteLoan = useMutation({
    mutationFn: (loanId: string) => loansApi.deleteLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
    },
  });

  const getEMISchedule = (loan: Loan) => loansApi.getEMISchedule(loan);

  const calculateOutstandingBalance = async (loanId: string) => {
    return loansApi.calculateOutstandingBalance(loanId);
  };

  return {
    getLoans,
    useLoan,
    createLoan,
    updateLoan,
    deleteLoan,
    getEMISchedule,
    calculateOutstandingBalance,
  };
};
