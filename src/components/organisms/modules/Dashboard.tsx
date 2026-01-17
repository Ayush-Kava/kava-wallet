'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

const Dashboard = () => {
  const { transactions } = useTransactions();
  const { accounts, totalBalance } = useAccounts();

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Net savings = Total balance (which already reflects all transactions)
    // OR if we want monthly: income - expenses for the month
    // The balance already accounts for initial deposits and all transactions
    const savings = totalBalance;

    return { income, expenses, savings };
  }, [transactions, totalBalance]);

  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout
      title="Dashboard"
      description="High-level summary of your money."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/analytics">View Analytics</Link>
          </Button>
          <Button asChild>
            <Link href="/transactions/new">Add Transaction</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold font-display">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Wallet className="text-primary-foreground" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Monthly Income
                  </p>
                  <p className="text-2xl font-bold font-display text-success">
                    {formatCurrency(currentMonthStats.income)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Monthly Expenses
                  </p>
                  <p className="text-2xl font-bold font-display text-destructive">
                    {formatCurrency(currentMonthStats.expenses)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="text-destructive" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Savings</p>
                  <p
                    className={`text-2xl font-bold font-display ${
                      currentMonthStats.savings >= 0
                        ? 'text-success'
                        : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(currentMonthStats.savings)}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentMonthStats.savings >= 0
                      ? 'bg-success/10'
                      : 'bg-destructive/10'
                  }`}
                >
                  {currentMonthStats.savings >= 0 ? (
                    <ArrowUpRight className="text-success" size={24} />
                  ) : (
                    <ArrowDownRight className="text-destructive" size={24} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Recent Transactions & Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions yet.</p>
                  <Button variant="link" asChild>
                    <Link href="/transactions">Add your first transaction</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${
                              t.categories?.color || '#6366F1'
                            }20`,
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
                          <p className="font-medium text-sm">
                            {t.description ||
                              t.categories?.name ||
                              'Transaction'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          t.type === 'income'
                            ? 'text-success'
                            : 'text-destructive'
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
          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Your Accounts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/accounts">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No accounts yet.</p>
                  <Button variant="link" asChild>
                    <Link href="/accounts">Add your first account</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${acc.color}20` }}
                        >
                          <Wallet style={{ color: acc.color }} size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{acc.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {acc.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          Number(acc.balance) >= 0
                            ? 'text-foreground'
                            : 'text-destructive'
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
