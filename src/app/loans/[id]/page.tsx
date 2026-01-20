'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLoans } from '@/hooks/useLoans';
import { Button } from '@/components/atoms/Button';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

function LoanDetailContent({ loanId }: { loanId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { useLoan, getEMISchedule, deleteLoan } = useLoans();
  const { data: loan, isLoading, error } = useLoan(loanId);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." description="">
        <div className="text-center py-8">Loading loan details...</div>
      </DashboardLayout>
    );
  }

  if (error || !loan) {
    return (
      <DashboardLayout title="Loan Not Found" description="">
        <div className="text-red-600">Failed to load loan details</div>
      </DashboardLayout>
    );
  }

  const schedule = getEMISchedule(loan);
  const paidPercentage =
    ((loan.principal - loan.outstanding_balance) / loan.principal) * 100;

  const handleDelete = async () => {
    try {
      await deleteLoan.mutateAsync(loanId);
      toast({
        title: 'Success',
        description: 'Loan deleted successfully',
      });
      router.push('/loans');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete loan',
        variant: 'destructive',
      });
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <DashboardLayout
      title={loan.name}
      description={`Started on ${format(new Date(loan.start_date), 'MMM dd, yyyy')}`}
      actions={
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={deleteLoan.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Principal Amount
            </p>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.principal)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Amount Paid
            </p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {formatCurrency(loan.principal - loan.outstanding_balance)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Outstanding Balance
            </p>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {formatCurrency(loan.outstanding_balance)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Monthly EMI
            </p>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.emi_amount)}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold mb-4">Loan Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Paid</span>
              <span className="text-sm font-medium">
                {paidPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
              <div
                className="bg-green-600 dark:bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{loan.tenure_months} months total</span>
              <span>
                {Math.ceil(loan.outstanding_balance / loan.emi_amount || 0)}{' '}
                months remaining
              </span>
            </div>
          </div>
        </div>

        {/* EMI Schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold">EMI Schedule</h3>
            <p className="text-sm text-gray-600">
              Expected monthly EMI breakdown
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">EMI Amount</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((item) => (
                  <TableRow
                    key={item.emi_number}
                    className={
                      item.paid ? 'bg-green-50 dark:bg-green-950/20' : ''
                    }
                  >
                    <TableCell className="font-medium">
                      {item.emi_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.due_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.emi_amount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      {formatCurrency(item.principal_paid)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">
                      {formatCurrency(item.interest_paid)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.balance_remaining)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold mb-4">Loan Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Interest Rate
              </p>
              <p className="text-lg font-semibold">
                {loan.interest_rate.toFixed(2)}% p.a.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tenure</p>
              <p className="text-lg font-semibold">
                {loan.tenure_months} months
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start Date
              </p>
              <p className="text-lg font-semibold">
                {format(new Date(loan.start_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created
              </p>
              <p className="text-lg font-semibold">
                {format(new Date(loan.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">
                Delete Loan?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{loan.name}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoan.isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleteLoan.isPending ? 'Deleting...' : 'Delete Loan'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

export default function LoanDetail() {
  const params = useParams();
  const loanId = params.id as string;

  return (
    <ProtectedRoute>
      <LoanDetailContent loanId={loanId} />
    </ProtectedRoute>
  );
}
