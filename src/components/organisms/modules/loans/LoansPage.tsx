'use client';

import { useState } from 'react';
import { AppLink } from '@/components/atoms/AppLink';
import { useLoans } from '@/hooks/useLoans';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/atoms/Button';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { LoanForm } from '@/components/organisms/modules/loans/LoanForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSeparator,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { CreateLoanData } from '@/types/loan-types';

export default function LoansPage() {
  const { getLoans, createLoan } = useLoans();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const { data: loans = [], isLoading, error } = getLoans;

  const handleCreateClick = () => setFormOpen(true);

  const handleSubmit = async (data: CreateLoanData) => {
    try {
      await createLoan.mutateAsync(data);
      toast({
        title: 'Success',
        description: 'Loan created successfully. EMI recurring rule has been set up.',
      });
      setFormOpen(false);
    } catch (submitError) {
      toast({
        title: 'Error',
        description:
          submitError instanceof Error ? submitError.message : 'Failed to create loan',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <DashboardLayout
        title="Loans & EMI"
        description="Manage your loans and track EMI payments"
        actions={
          <Button onClick={handleCreateClick}>
            <Plus size={18} />
            New Loan
          </Button>
        }
      >
        <div className="text-red-600">Failed to load loans</div>
      </DashboardLayout>
    );
  }

  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0);
  const totalPaid = totalLoanAmount - totalOutstanding;

  return (
    <DashboardLayout
      title="Loans & EMI"
      description="Manage your loans and track EMI payments"
      actions={
        <Button onClick={handleCreateClick}>
          <Plus size={18} />
          New Loan
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Total Loan Amount</p>
            <div className="text-2xl font-bold">{formatCurrency(totalLoanAmount)}</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {formatCurrency(totalPaid)}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Outstanding Balance</p>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {formatCurrency(totalOutstanding)}
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Loading loans...
            </div>
          ) : loans.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-4">No loans created yet.</p>
              <Button variant="outline" onClick={handleCreateClick}>
                Create Your First Loan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Name</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest Rate</TableHead>
                    <TableHead className="text-right">EMI</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => {
                    const paidPercentage =
                      ((loan.principal - loan.outstanding_balance) / loan.principal) * 100;

                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(loan.principal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {loan.interest_rate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(loan.emi_amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">
                          {formatCurrency(loan.outstanding_balance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-slate-700">
                              <div
                                className="h-2 rounded-full bg-green-600 dark:bg-green-500"
                                style={{ width: `${paidPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {paidPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <AppLink href={ROUTES.loan(loan.id)}>
                              View
                            </AppLink>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="flex max-h-[min(90vh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
          <DialogHeader className="shrink-0 space-y-1 border-b-0 px-6 py-4 pb-4 shadow-none">
            <DialogTitle className="font-display">Create new loan</DialogTitle>
            <DialogDescription>Enter loan details to set up EMI tracking</DialogDescription>
          </DialogHeader>
          <DialogSeparator />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <LoanForm
              embedded
              onSubmit={handleSubmit}
              isLoading={createLoan.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
