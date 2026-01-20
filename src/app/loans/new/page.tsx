'use client';

import { useRouter } from 'next/navigation';
import { useLoans } from '@/hooks/useLoans';
import { LoanForm } from '@/components/organisms/modules/loans/LoanForm';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { useToast } from '@/hooks/useToast';
import type { CreateLoanData } from '@/types/loan-types';

function CreateLoanContent() {
  const router = useRouter();
  const { createLoan } = useLoans();
  const { toast } = useToast();

  const handleSubmit = async (data: CreateLoanData) => {
    try {
      await createLoan.mutateAsync(data);
      toast({
        title: 'Success',
        description:
          'Loan created successfully. EMI recurring rule has been set up.',
      });
      router.push('/loans');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create loan',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout
      title="Create New Loan"
      description="Set up a loan and we'll automatically track your EMI payments"
    >
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <LoanForm onSubmit={handleSubmit} isLoading={createLoan.isPending} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CreateLoan() {
  return (
    <ProtectedRoute>
      <CreateLoanContent />
    </ProtectedRoute>
  );
}
