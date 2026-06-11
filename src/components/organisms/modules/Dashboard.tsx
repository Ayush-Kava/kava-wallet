'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSummaryTransactions } from '@/hooks/useSummaryTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { ROUTES } from '@/lib/constants/routes';
import { useUiStore } from '@/store/ui/use-ui-store';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

const Dashboard = () => {
  const { transactions } = useSummaryTransactions();
  const { accounts, totalBalance } = useAccounts();
  const { openTransactionDialog } = useUiStore();

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Net savings = Total balance (which already reflects all transactions)
    // OR if we want monthly: income - expenses for the month
    // The balance already accounts for initial deposits and all transactions
    const netFlow = income - expenses;

    return { income, expenses, netFlow };
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <DashboardLayout
      title="Dashboard"
      description="High-level summary of your money."
      actions={
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" asChild>
            <Link href={ROUTES.analytics}>View Analytics</Link>
          </Button>
          <Button size="xs" onClick={() => openTransactionDialog({ mode: 'expense' })}>
            Add Transaction
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total Balance',
              value: formatCurrency(totalBalance),
              icon: Wallet,
              className: 'text-foreground',
              iconClass: 'bg-primary/10 text-primary',
            },
            {
              label: 'Monthly Income',
              value: formatCurrency(currentMonthStats.income),
              icon: TrendingUp,
              className: 'text-success',
              iconClass: 'bg-success/10 text-success',
            },
            {
              label: 'Monthly Expenses',
              value: formatCurrency(currentMonthStats.expenses),
              icon: TrendingDown,
              className: 'text-destructive',
              iconClass: 'bg-destructive/10 text-destructive',
            },
            {
              label: 'Monthly Net',
              value: formatCurrency(currentMonthStats.netFlow),
              icon: currentMonthStats.netFlow >= 0 ? ArrowUpRight : ArrowDownRight,
              className: currentMonthStats.netFlow >= 0 ? 'text-success' : 'text-destructive',
              iconClass:
                currentMonthStats.netFlow >= 0
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive',
            },
          ].map(stat => (
            <Card key={stat.label} className="shadow-none">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className={cn('mt-1 text-xl font-semibold tracking-tight', stat.className)}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md',
                    stat.iconClass,
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Transactions */}
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.transactions}>View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No transactions yet.</p>
                  <Button variant="link" onClick={() => openTransactionDialog({ mode: 'expense' })}>
                    Add your first transaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${t.categories?.color || '#6366F1'}20`,
                          }}
                        >
                          {t.type === 'income' ? (
                            <ArrowUpRight
                              style={{
                                color: t.categories?.color || '#10B981',
                              }}
                            />
                          ) : (
                            <ArrowDownRight
                              style={{
                                color: t.categories?.color || '#EF4444',
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {t.description || t.categories?.name || 'Transaction'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          t.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(Number(t.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accounts */}
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Your Accounts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.accounts}>Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No accounts yet.</p>
                  <Button variant="link" asChild>
                    <Link href={ROUTES.accounts}>Add your first account</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${acc.color}20` }}
                        >
                          <Wallet style={{ color: acc.color }} size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{acc.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {acc.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          Number(acc.balance) >= 0 ? 'text-foreground' : 'text-destructive'
                        }`}
                      >
                        {formatCurrency(Number(acc.balance))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
