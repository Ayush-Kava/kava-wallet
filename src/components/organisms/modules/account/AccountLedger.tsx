'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import AccountLedgerTable from './AccountLedgerTable';
import AccountLedgerFilters from './AccountLedgerFilters';
import { Button } from '@/components/atoms/ui/button';
import { useAccountLedger } from '@/hooks/useAccountLedger';
import { filterTransactionsByDateRange } from '@/lib/ledger-utils';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/ledger-utils';

type AccountLedgerProps = {
  accountId: string;
};

export default function AccountLedger({ accountId }: AccountLedgerProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { account, transactions, transferPartners, isLoading } =
    useAccountLedger(accountId);

  // Filter transactions by date range
  const filteredTransactions = filterTransactionsByDateRange(
    transactions,
    startDate,
    endDate,
  );

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleTransfer = () => {
    // Navigate to transfer page with the account pre-selected
    router.push(`/transactions/new?type=transfer&from=${accountId}`);
  };

  if (!account && !isLoading) {
    return (
      <DashboardLayout
        title="Account Not Found"
        description="The account you're looking for doesn't exist."
      >
        <div className="flex items-center justify-center py-12">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={account?.name || 'Account Ledger'}
      description={`View transactions and balance for ${account?.name}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <Button onClick={handleTransfer}>
            <ArrowUpRight size={18} />
            Transfer
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Account Summary Cards */}
        {account && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Balance Card */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-2">
                Current Balance
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </p>
            </div>

            {/* Total Transactions Card */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-2">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-foreground">
                {filteredTransactions.length}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {startDate || endDate ? 'Filtered period' : 'All time'}
              </p>
            </div>

            {/* Net Activity Card */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <p className="text-sm text-muted-foreground mb-2">Net Activity</p>
              <p className="text-2xl font-bold text-foreground">
                {(() => {
                  const totalIncome = filteredTransactions
                    .filter((t) => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const totalExpense = filteredTransactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const net = totalIncome - totalExpense;
                  return (
                    <span
                      className={net >= 0 ? 'text-success' : 'text-destructive'}
                    >
                      {net >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(net), account.currency)}
                    </span>
                  );
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Income - Expense
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction Ledger</h3>
          <AccountLedgerFilters
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onReset={handleReset}
          />
        </div>

        {/* Ledger Table */}
        <AccountLedgerTable
          transactions={filteredTransactions}
          openingBalance={
            (account?.balance ?? 0) -
            (filteredTransactions.reduce((sum, t) => {
              return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0) ?? 0)
          }
          currency={account?.currency || 'INR'}
          transferPartners={transferPartners}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
