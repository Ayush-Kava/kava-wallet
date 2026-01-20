'use client';

import Link from 'next/link';
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
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function LoansPage() {
  const { getLoans } = useLoans();
  const { data: loans = [], isLoading, error } = getLoans;

  if (error) {
    return (
      <DashboardLayout
        title="Loans & EMI"
        description="Manage your loans and track EMI payments"
        actions={
          <Button asChild>
            <Link href="/loans/new">
              <Plus size={18} />
              New Loan
            </Link>
          </Button>
        }
      >
        <div className="text-red-600">Failed to load loans</div>
      </DashboardLayout>
    );
  }

  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + loan.outstanding_balance,
    0,
  );
  const totalPaid = totalLoanAmount - totalOutstanding;

  return (
    <DashboardLayout
      title="Loans & EMI"
      description="Manage your loans and track EMI payments"
      actions={
        <Button asChild>
          <Link href="/loans/new">
            <Plus size={18} />
            New Loan
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Loan Amount
            </p>
            <div className="text-2xl font-bold">
              {formatCurrency(totalLoanAmount)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Amount Paid
            </p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {formatCurrency(totalPaid)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Outstanding Balance
            </p>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {formatCurrency(totalOutstanding)}
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading loans...
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No loans created yet.</p>
              <Button asChild variant="outline">
                <Link href="/loans/new">Create Your First Loan</Link>
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
                  {loans.map((loan) => {
                    const paidPercentage =
                      ((loan.principal - loan.outstanding_balance) /
                        loan.principal) *
                      100;

                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          {loan.name}
                        </TableCell>
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
                            <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
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
                            <Link href={`/loans/${loan.id}`}>View</Link>
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
    </DashboardLayout>
  );
}
