'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import AccountLedgerTable from './AccountLedgerTable';
import AccountLedgerFilters from './AccountLedgerFilters';
import { Button } from '@/components/atoms/ui/button';
import { useAccountLedger } from '@/hooks/useAccountLedger';
import { useUiStore } from '@/store/ui/use-ui-store';
import { filterTransactionsByDateRange } from '@/lib/ledger-utils';
import { ArrowDownRight, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/ledger-utils';

type AccountLedgerProps = {
  accountId: string;
};

export default function AccountLedger({ accountId }: AccountLedgerProps) {
  const router = useRouter();
  const { openTransactionDialog } = useUiStore();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { account, transactions, transferPartners, isLoading } = useAccountLedger(accountId);

  // Filter transactions by date range
  const filteredTransactions = filterTransactionsByDateRange(transactions, startDate, endDate);

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const openForAccount = (mode: 'expense' | 'income' | 'transfer') => {
    if (mode === 'transfer') {
      openTransactionDialog({
        mode: 'transfer',
        fromAccountId: accountId,
      });
      return;
    }
    openTransactionDialog({
      mode,
      accountId,
      preserveAccountOnSave: true,
    });
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
          <Button variant="outline" onClick={() => openForAccount('expense')}>
            <ArrowDownRight size={18} />
            Add expense
          </Button>
          <Button variant="outline" onClick={() => openForAccount('income')}>
            <ArrowUpRight size={18} />
            Add income
          </Button>
          <Button onClick={() => openForAccount('transfer')}>Transfer</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Account Summary Cards */}
        {account && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Current Balance Card */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <p className="mb-2 text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </p>
            </div>

            {/* Total Transactions Card */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <p className="mb-2 text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">{filteredTransactions.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {startDate || endDate ? 'Filtered period' : 'All time'}
              </p>
            </div>

            {/* Net Activity Card */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <p className="mb-2 text-sm text-muted-foreground">Net Activity</p>
              <p className="text-2xl font-bold text-foreground">
                {(() => {
                  const totalIncome = filteredTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const totalExpense = filteredTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                  const net = totalIncome - totalExpense;
                  return (
                    <span className={net >= 0 ? 'text-success' : 'text-destructive'}>
                      {net >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(net), account.currency)}
                    </span>
                  );
                })()}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Income - Expense</p>
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
